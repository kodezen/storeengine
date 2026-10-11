/**
 * Stripe gateway — legacy /checkout/ shell.
 *
 * All Stripe logic now lives in @CheckoutCore/gateways/stripe. This file is
 * the legacy CheckoutManager.registerGateway adapter that:
 *   1. Builds a CheckoutApi configured for cookie-auth + WP REST nonce.
 *   2. Mounts the shared PaymentElement (multi-method UI) into the legacy
 *      `#storeengine-stripe-card-element` container when the shopper picks Stripe.
 *   3. Decides between PaymentIntent (regular checkout) and SetupIntent
 *      (subscription-with-trial, cart total = 0) and calls the matching
 *      shared confirm helper.
 *   4. Bridges the new `{ payment_payload }` shape into the legacy
 *      "processPayment returns the place_order response" contract by POSTing
 *      place_order itself with the merged payload.
 *   5. Bypasses the shared adapter entirely on the saved-card path — when
 *      the shopper picked an existing saved token, place_order has all it
 *      needs, no client-side intent confirm required.
 *
 * Add-payment-method standalone form is at the bottom of this file — it
 * uses the same shared SetupIntent flow and POSTs to the REST
 * `/storeengine/v1/payment-methods` endpoint.
 */

import { __, sprintf } from '@wordpress/i18n';
import debounce from 'lodash/debounce';
import {
	checkout_page_url,
	getSeGlobal,
	handleRedirectResponse,
	makeRestRequest,
	notification,
	renderErrorNotification,
	StoreEngineDQ,
	wait,
} from '@Utils/helper';
import StoreEngineStripeAPI from '@Frontend/StoreEngineStripeApi';
import { addAction, doAction } from '@wordpress/hooks';
import { CheckoutApi } from '@CheckoutCore/api';
import {
	mountPaymentElement,
	unmountPaymentElement,
	updatePaymentElement,
	processPaymentElement,
	processSetupIntent,
	wpToStripeLocale,
	billingDetailsFromFormData,
} from '@CheckoutCore/gateways/stripe';

/* ── Module state ───────────────────────────────────────────────────────── */

/** Mounted PaymentElement state from the shared adapter (or null if unmounted). */
let elementState = null;
/**
 * The DOM node `elementState` is currently mounted into. A checkout fragment
 * refresh (coupon apply, shipping change, order-bump, or the initial
 * `_updateCheckout()` on load) replaces `.storeengine-ajax-checkout-form__payments`
 * via `.html()`, which recreates `#storeengine-stripe-card-element` as a fresh,
 * empty node and detaches the Stripe iframe. We keep the mounted container here so
 * `maybeMountElement()` can tell "still mounted in the live DOM" from "stale mount
 * whose container was swapped out" and re-mount instead of silently no-op'ing
 * (which left the card field blank until a hard refresh).
 */
let mountedContainer = null;
/** Re-entrancy guard: mountPaymentElement() is async, so two rapid triggers
 * (e.g. triggerPaymentMethodChanged + a change event) could otherwise mount twice. */
let isMounting = false;
/** Prevents double-submission when the saved-token bypass posts place_order. */
let hasCheckoutCompleted = false;

/* ── Form-data helpers ──────────────────────────────────────────────────── */

const getInputValue = ( name ) => StoreEngineDQ( `[name="${ name }"]` ).val();

function getBillingDetailsFromForm() {
	if (
		getSeGlobal( 'is_page.is_order_pay' ) ||
		getSeGlobal( 'is_page.is_add_payment_method' )
	) {
		return getSeGlobal( 'payment_data.customerBillingData' );
	}
	return billingDetailsFromFormData( {
		billing_first_name: getInputValue( 'billing_first_name' ) || '',
		billing_last_name: getInputValue( 'billing_last_name' ) || '',
		billing_email: getInputValue( 'billing_email' ) || '',
		user_email: getInputValue( 'billing_email' ) || '',
		billing_phone: getInputValue( 'billing_phone' ) || '',
		billing_city: getInputValue( 'billing_city' ) || '',
		billing_country: getInputValue( 'billing_country' ) || '',
		billing_address_1: getInputValue( 'billing_address_1' ) || '',
		billing_address_2: getInputValue( 'billing_address_2' ) || '',
		billing_postcode: getInputValue( 'billing_postcode' ) || '',
		billing_state: getInputValue( 'billing_state' ) || '',
	} );
}

const isSavingPaymentMethod = () =>
	StoreEngineDQ( '[name=storeengine-stripe-save-new-payment-method]' ).prop(
		'checked'
	);

/**
 * Whether the shopper is entering a NEW card (vs. paying with a saved token).
 *
 * When saved payment methods exist, the new-card form starts collapsed
 * (TokenizationForm hides `.storeengine-payment-form` with visibility/height 0),
 * and Stripe's PaymentElement cannot mount into a hidden / zero-height container.
 * So we only mount while "Use a new payment method" is selected — or when there
 * are no saved methods at all, in which case the form is always shown.
 */
function isNewPaymentMethodSelected() {
	const radios = document.querySelectorAll(
		'.storeengine-saved-payment-methods-token-input'
	);
	if ( ! radios.length ) {
		return true;
	}
	const checked = document.querySelector(
		'.storeengine-saved-payment-methods-token-input:checked'
	);
	return ! checked || 'new' === checked.value;
}

function getCheckoutApi() {
	return new CheckoutApi( {
		surface: 'legacy',
		wpNonce: getSeGlobal( 'nonce', '' ),
	} );
}

function getStripeGatewayData() {
	return {
		id: 'stripe',
		publishable_key: getSeGlobal(
			'payment_gateways.stripe.publishable_key',
			''
		),
		locale: wpToStripeLocale(
			getSeGlobal( 'user_locale', getSeGlobal( 'locale', '' ) )
		),
	};
}

/**
 * Native Stripe Billing: a subscription cart collects the card via a SetupIntent
 * (no up-front charge) — Stripe bills the subscription invoices server-side.
 */
function isNativeSubscriptionCart() {
	return (
		!! getSeGlobal(
			'payment_gateways.stripe.use_native_subscriptions',
			false
		) && !! getSeGlobal( 'payment_data.has_subscription', false )
	);
}

/* ── Element mount ──────────────────────────────────────────────────────── */

async function maybeMountElement( mode = 'payment' ) {
	const container = StoreEngineDQ( '#storeengine-stripe-card-element' ).get(
		0
	);
	if ( ! container ) {
		return;
	}

	// Bail if a mount is already in flight (mountPaymentElement is async).
	if ( isMounting ) {
		return;
	}

	if ( elementState ) {
		// Already have a mounted element — but only treat it as "still mounted"
		// when it lives in the CURRENT, connected container and its iframe is
		// present. After a fragment refresh the payments HTML is replaced, so
		// `container` is a brand-new empty node (≠ mountedContainer) and the old
		// iframe is gone: that is a stale mount → tear it down and fall through
		// to re-mount into the fresh container. Without this the card field stays
		// blank after any checkout refresh until a hard reload.
		const stillMounted =
			mountedContainer === container &&
			container.isConnected &&
			!! container.querySelector( 'iframe' );
		if ( stillMounted ) {
			return;
		}
		teardownStripeElement();
	}

	// Never mount into the collapsed new-card form (a saved card is selected) —
	// Stripe's iframe needs a laid-out box. We mount on demand the moment the
	// shopper switches to "Use a new payment method".
	if ( ! isNewPaymentMethodSelected() ) {
		return;
	}

	const cartTotal = getSeGlobal( 'payment_data.cart_total', 0 );
	const currency = getSeGlobal( 'payment_data.currency', '' );
	const isSetup = mode === 'setup';
	const isSave = isSavingPaymentMethod();

	const elementConfig = {
		mode: isSetup ? 'setup' : 'payment',
		currency: currency.toLowerCase(),
		paymentMethodTypes: [ 'card' ],
		setupFutureUsage: isSave ? 'off_session' : null,
	};
	if ( ! isSetup && cartTotal ) {
		elementConfig.amount = StoreEngineStripeAPI.get_stripe_amount(
			cartTotal,
			currency
		);
	}

	const paymentConfig = {
		terms: { card: 'always' },
		wallets: { applePay: 'never', googlePay: 'never' },
	};

	StoreEngineDQ( document ).trigger( 'storeengine-credit-card-form-init' );

	isMounting = true;
	try {
		elementState = await mountPaymentElement( {
			gateway: getStripeGatewayData(),
			ui: {
				container,
				onError: ( e ) => renderErrorNotification( e.message ),
			},
			element: elementConfig,
			payment: paymentConfig,
			formData: {
				billing_first_name: getInputValue( 'billing_first_name' ) || '',
				billing_last_name: getInputValue( 'billing_last_name' ) || '',
				billing_email: getInputValue( 'billing_email' ) || '',
				billing_phone: getInputValue( 'billing_phone' ) || '',
				billing_city: getInputValue( 'billing_city' ) || '',
				billing_country: getInputValue( 'billing_country' ) || '',
				billing_address_1: getInputValue( 'billing_address_1' ) || '',
				billing_address_2: getInputValue( 'billing_address_2' ) || '',
				billing_postcode: getInputValue( 'billing_postcode' ) || '',
				billing_state: getInputValue( 'billing_state' ) || '',
			},
		} );
		// Remember which node we mounted into so a later fragment swap can be
		// detected as stale (see the self-heal check at the top of this fn).
		mountedContainer = container;
	} catch ( e ) {
		renderErrorNotification( e );
		return;
	} finally {
		isMounting = false;
	}

	// Fire the public payment-info-added action when the user completes the
	// element (used by upstream subscriptions to enable "Place order").
	if ( elementState && elementState.element ) {
		elementState.element.on(
			'change',
			debounce( ( ev ) => {
				if ( ev.complete ) {
					doAction( 'storeengine.checkout.payment_info_added', {
						payment_gateway: 'stripe',
						billing_details: getBillingDetailsFromForm(),
					} );
				}
			}, 300 )
		);
	}

	// Keep PaymentElement billing defaults in sync as the shopper edits the form.
	if (
		! isSetup &&
		cartTotal &&
		! getSeGlobal( 'is_page.is_order_pay' ) &&
		! getSeGlobal( 'is_page.is_add_payment_method' )
	) {
		[
			'billing_first_name',
			'billing_last_name',
			'billing_email',
			'billing_phone',
			'billing_city',
			'billing_country',
			'billing_address_1',
			'billing_address_2',
			'billing_postcode',
			'billing_state',
		].forEach( ( field ) => {
			StoreEngineDQ( `[name="${ field }"]` ).on( 'blur', () => {
				updatePaymentElement( elementState, {
					billingDetails: getBillingDetailsFromForm(),
				} );
			} );
		} );
	}
}

/* ── Subscription extras ────────────────────────────────────────────────── */

export const getAdditionalSetupIntentData = ( form ) => {
	const out = {};
	const selected = form.find(
		'.storeengine-dashboard-payment-methods input.input-radio:checked'
	);
	if ( ! selected.length ) {
		return out;
	}
	const li = selected.closest( 'li' );
	if ( ! li.length ) {
		return out;
	}
	const updateAll = li.find(
		'.storeengine-stripe-update-all-subscriptions-payment-method'
	);
	if ( updateAll.length && updateAll.is( ':checked' ) ) {
		out.update_subscription_methods = true;
	}
	return out;
};

/* ── Error formatting ───────────────────────────────────────────────────── */

const PARAM_ERROR_CODES = new Set( [
	'parameter_invalid_empty',
	'parameter_missing',
	'parameter_string_empty',
	'parameter_string_blank',
] );

const getErrorMessage = ( err ) => {
	const generic = __( 'Payment failed. Please try again.', 'storeengine' );
	if ( ! err ) {
		return generic;
	}
	const msg = err.message || generic;
	if ( ! PARAM_ERROR_CODES.has( err.code ) ) {
		return msg;
	}

	const section = err.param && err.param.match( /(billing|shipping)_/ );
	const field = err.param && err.param.match( /\[([A-Za-z0-9]+)\]/ );
	if ( ! section || ! section[ 1 ] || ! field || ! field[ 1 ] ) {
		return msg;
	}

	const proper = ( s ) =>
		s ? s.charAt( 0 ).toUpperCase() + s.slice( 1 ) : s;
	return sprintf(
		/* translators: %s is an input field name */
		__( '%s is a required field.', 'storeengine' ),
		proper( section[ 1 ] ) + ' ' + proper( field[ 1 ] )
	);
};

/* ── registerGateway ────────────────────────────────────────────────────── */

export function initStripeGateway() {
	if (
		! window.StoreEngineCheckout ||
		typeof window.StoreEngineCheckout.registerGateway !== 'function'
	) {
		return;
	}

	const initialMode =
		getSeGlobal( 'payment_data.cart_total', 0 ) &&
		! isNativeSubscriptionCart()
			? 'payment'
			: 'setup';

	window.StoreEngineCheckout.registerGateway( 'stripe', {
		async onSelected() {
			await maybeMountElement( initialMode );
		},

		async processPayment( {
			checkout_action,
			formData,
			form,
			placeOrder,
		} ) {
			if ( hasCheckoutCompleted ) {
				hasCheckoutCompleted = false;
				return null;
			}

			// Saved-card token path — bypass the shared adapter; the gateway
			// charges the saved token server-side. Forward the token in the
			// payment payload so it reaches the server on BOTH flows: the
			// pay-order request only sends `payment_payload` (not the form
			// fields), so without this the saved token is lost and the gateway
			// falls back to "new card" → "payment intent id is missing".
			if (
				checkout_action !== 'add_payment_method' &&
				formData[ 'storeengine-stripe-payment-token' ] &&
				formData[ 'storeengine-stripe-payment-token' ] !== 'new'
			) {
				hasCheckoutCompleted = true;
				const response = await placeOrder( {
					'storeengine-stripe-payment-token':
						formData[ 'storeengine-stripe-payment-token' ],
				} );
				await wait( 1000 );
				return response;
			}

			if ( ! elementState ) {
				throw new Error(
					__(
						'Invalid or missing payment details. Please ensure the provided payment method is correctly entered.',
						'storeengine'
					)
				);
			}

			const isSetupOnly =
				isNativeSubscriptionCart() ||
				( getSeGlobal( 'payment_data.has_subscription', false ) &&
					getSeGlobal( 'payment_data.has_trial', false ) &&
					! getSeGlobal( 'payment_data.cart_total', 0 ) );

			const api = getCheckoutApi();
			let result;

			try {
				if ( isSetupOnly ) {
					const additional = getAdditionalSetupIntentData( form );
					result = await processSetupIntent( elementState, {
						api,
						formData,
						returnUrl: checkout_page_url,
						extraIntentParams: additional,
					} );
				} else {
					// Critical: forward the save-card checkbox state to the
					// server. The PaymentElement is mounted with
					// `setupFutureUsage: 'off_session'` when the box is ticked;
					// the PaymentIntent on the server MUST be created with the
					// matching `setup_future_usage` or Stripe.js refuses to
					// confirm with "setup_future_usage (null) does not match…".
					const saveMethod = isSavingPaymentMethod();
					result = await processPaymentElement( elementState, {
						api,
						formData,
						returnUrl: checkout_page_url,
						extraIntentParams: saveMethod
							? { save_method: true }
							: {},
					} );
				}
			} catch ( err ) {
				throw new Error( getErrorMessage( err ) );
			}

			const payload = ( result && result.payment_payload ) || {};
			return placeOrder( payload );
		},

		onCheckoutUpdated() {
			if ( ! elementState || ! elementState.elements ) {
				return;
			}
			const cartTotal = getSeGlobal( 'payment_data.cart_total', 0 );
			if ( cartTotal ) {
				updatePaymentElement( elementState, {
					amount: StoreEngineStripeAPI.get_stripe_amount(
						cartTotal,
						getSeGlobal( 'payment_data.currency' )
					),
				} );
			}
		},
	} );

	// Saved-card radios → mount the card form the moment the shopper switches to
	// "Use a new payment method". It could not mount earlier while the form was
	// collapsed (Stripe can't render into a hidden, zero-height container).
	// TokenizationForm reveals the form on the same (bubbling) change event,
	// before this document-level handler runs, so the container is visible here.
	StoreEngineDQ( document ).on(
		'change',
		'.storeengine-saved-payment-methods-token-input',
		function () {
			if ( 'new' === this.value ) {
				maybeMountElement( initialMode );
			}
		}
	);

	// Save-card toggle → re-arm setupFutureUsage on the element.
	StoreEngineDQ( document ).on(
		'change',
		'[name=storeengine-stripe-save-new-payment-method]',
		debounce( function () {
			if ( elementState ) {
				updatePaymentElement( elementState, {
					setupFutureUsage: this.checked ? 'off_session' : null,
				} );
			}
		}, 800 )
	);
}

/* ── Add-payment-method standalone page ─────────────────────────────────── */

/**
 * Plug Stripe into the generic add-payment-method orchestrator
 * (`@Frontend/add-payment-method`). The orchestrator owns the form binding
 * and fires two actions:
 *
 *   storeengine.add-payment-method.init-form              ( form )
 *   storeengine.add-payment-method.select-payment-method  ( gateway_id, form )
 *   storeengine.add-payment-method.save-payment-method    ( gateway_id, form )
 *
 * We mount the PaymentElement when Stripe becomes the selected gateway, and
 * run the SetupIntent + REST POST when the form is submitted with Stripe
 * selected. Other gateways register their own listeners.
 */
export const initStripeAddPaymentMethod = () => {
	addAction(
		'storeengine.add-payment-method.select-payment-method',
		'storeengine/stripe',
		async ( gatewayId ) => {
			if ( 'stripe' !== gatewayId ) {
				return;
			}
			if ( ! elementState ) {
				await maybeMountElement( 'setup' );
			}
		}
	);

	addAction(
		'storeengine.add-payment-method.save-payment-method',
		'storeengine/stripe',
		async ( gatewayId, form ) => {
			if ( 'stripe' !== gatewayId ) {
				return;
			}
			if ( ! elementState ) {
				throw new Error(
					__( 'Invalid or missing payment details.', 'storeengine' )
				);
			}

			const formData = Object.fromEntries(
				new FormData( form.get( 0 ) )
			);
			const additional = getAdditionalSetupIntentData( form );
			// The dashboard "Add a payment method" flow has no cart and no
			// order — the shared processSetupIntent expects an api with a
			// `createPaymentIntent(gw, ...)` method, so we hand it a tiny
			// adapter that targets the no-cart REST endpoint instead of
			// /checkout/payment-intent/{gw} (which requires a draft order).
			const setupApi = {
				createPaymentIntent: () =>
					makeRestRequest(
						'storeengine/v1/payment-methods/setup-intent',
						{
							payment_method: formData.payment_method || 'stripe',
							return_url: checkout_page_url,
						}
					),
			};
			const result = await processSetupIntent( elementState, {
				api: setupApi,
				formData,
				returnUrl: checkout_page_url,
				extraIntentParams: additional,
			} );
			const payload = ( result && result.payment_payload ) || {};
			const response = await makeRestRequest(
				'storeengine/v1/payment-methods',
				{
					payment_method: formData.payment_method || 'stripe',
					payment_payload: payload,
					fields: {
						...formData,
						update_subscription_methods:
							additional.update_subscription_methods,
					},
				}
			);
			if ( response && response.message ) {
				await notification(
					response.message,
					response.found ? 'info' : 'success',
					3500
				);
			}
			await handleRedirectResponse( response, 850 );
		}
	);
};

export function teardownStripeElement() {
	unmountPaymentElement( elementState );
	elementState = null;
	mountedContainer = null;
}

// Legacy export.
export const stripeCheckout = () => initStripeGateway();
