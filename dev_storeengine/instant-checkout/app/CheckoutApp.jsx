import { createElement, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { CheckoutApi } from './api';
import CheckoutHeader from './components/CheckoutHeader.jsx';
import ContactBlock, { resolveIdentifier, isValidEmail } from './components/ContactBlock.jsx';
import { isPhoneE164 } from './components/dialCodes.js';
import BillingShipping from './components/BillingShipping.jsx';
import OrderSummary from './components/OrderSummary.jsx';
import PaymentSelector from './components/PaymentSelector.jsx';
import SuccessScreen from './components/SuccessScreen.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import CustomizeOrder from './components/CustomizeOrder.jsx';
import { get as getGateway } from './gateways/registry';
import './gateways'; // auto-registers built-ins

// ---------------------------------------------------------------------------
// sessionStorage helpers — persist verified state across same-tab page refreshes.
// PHP setcookie() in a REST response is unreliable for guests (headers may
// already be queued). sessionStorage survives a reload within the same tab,
// and the DB record used for order-gate checking is still valid.
// ---------------------------------------------------------------------------
const SE_VER_KEY = 'se_checkout_verified';

function saveVerifiedSession( identifier ) {
	try {
		sessionStorage.setItem( SE_VER_KEY, JSON.stringify( {
			identifier,
			expiresAt: Date.now() + 900 * 1000, // 15 min — matches server window default
		} ) );
	} catch ( e ) { /* ignore quota / private-mode errors */ }
}

function readVerifiedSession() {
	try {
		const raw = sessionStorage.getItem( SE_VER_KEY );
		if ( ! raw ) return null;
		const obj = JSON.parse( raw );
		return ( obj && obj.identifier && obj.expiresAt > Date.now() ) ? obj : null;
	} catch ( e ) { return null; }
}

function clearVerifiedSession() {
	try { sessionStorage.removeItem( SE_VER_KEY ); } catch ( e ) {}
}

/**
 * When mounted inside the SDK iframe, ask the parent overlay to switch to
 * full-screen mode. The parent listens for this postMessage type (see
 * dev_storeengine/instant-checkout/iframe.js) and adds an `is-fullscreen`
 * class that drops the modal to full viewport — matches the Shopify-style
 * design. No-op on inline shortcode mounts (no parent frame).
 */
function requestFullscreenModal(parentOrigin) {
	try {
		if (typeof window === 'undefined' || !window.parent || window.parent === window) return;
		window.parent.postMessage(
			{ source: 'storeengine-checkout', type: 'fullscreen.enable', payload: null },
			parentOrigin || '*'
		);
	} catch (e) { /* noop */ }
}

const initialFields = (overrides = {}) => ({
	user_email: '',
	billing_first_name: '',
	billing_last_name: '',
	billing_address_1: '',
	billing_city: '',
	billing_state: '',
	billing_postcode: '',
	billing_country: '',
	billing_phone: '',
	billing_email: '',
	shipping_first_name: '',
	shipping_last_name: '',
	shipping_address_1: '',
	shipping_city: '',
	shipping_state: '',
	shipping_postal_code: '',
	shipping_country: '',
	shipping_phone: '',
	shipping_method: '',
	same_as_shipping: true,
	...overrides,
});

// The instant checkout's address form is BILLING-primary with a "Ship to
// billing address" toggle, but the server's apply_addresses() mirrors the
// other way (shipping → billing, because the traditional /checkout/ page is
// shipping-primary). So when the shopper keeps "same as billing" on, copy the
// billing address into the shipping fields before sending — otherwise the
// shipping address reaches the server empty and shipping never calculates.
function withMirroredShipping(f) {
	if (!f || !f.same_as_shipping) return f;
	return {
		...f,
		shipping_first_name: f.billing_first_name || '',
		shipping_last_name: f.billing_last_name || '',
		shipping_address_1: f.billing_address_1 || '',
		shipping_address_2: f.billing_address_2 || '',
		shipping_city: f.billing_city || '',
		shipping_state: f.billing_state || '',
		shipping_postal_code: f.billing_postcode || '',
		shipping_country: f.billing_country || '',
		shipping_phone: f.billing_phone || '',
	};
}

// Validate the contact identifier before Place Order, honouring the active
// verification mode so we never demand an email in phone-only checkout (which
// would break 2-step verification). Returns an error string, or '' when valid.
function validateContact(mode, fields) {
	const val = (fields.user_email || '').trim();
	if (!val) {
		if (mode === 'phone_only') return 'Enter your phone number.';
		if (mode === 'phone_or_email') return 'Enter your email or phone number.';
		return 'Enter your email address.';
	}
	if (mode === 'phone_only') {
		return isPhoneE164(val) ? '' : 'Enter a valid phone number.';
	}
	if (mode === 'phone_or_email') {
		return (isValidEmail(val) || isPhoneE164(val)) ? '' : 'Enter a valid email or phone number.';
	}
	// email_only (default)
	return isValidEmail(val) ? '' : 'Enter a valid email address.';
}

// Build the initial selection map from declared items: required items always
// included; optional items included only if `default` is true.
function selectionFromDeclared(declared) {
	const map = {};
	(declared || []).forEach((d) => {
		if (!d.optional || d.default) {
			map[d.product_id] = {
				product_id: d.product_id,
				price_id: d.price_id,
				quantity: d.quantity || 1,
			};
		}
	});
	return map;
}

export default function CheckoutApp({ config }) {
	const api = useMemo(() => new CheckoutApi({
		storeUrl: config.storeUrl,
		restUrl: config.restUrl,
		nonce: config.nonce,
	}), [config.storeUrl, config.restUrl, config.nonce]);

	const [phase, setPhase] = useState('booting'); // booting | ready | placing | done | fatal
	const [snapshot, setSnapshot] = useState(null);
	const [fields, setFields] = useState(initialFields);
	const [paymentMethod, setPaymentMethod] = useState('');
	const [error, setError] = useState('');
	// Login URL surfaced with the "email already registered" 409 so the error
	// banner can render an actionable "Log in to continue" link.
	const [loginUrl, setLoginUrl] = useState('');
	const [orderId, setOrderId] = useState(0);
	const [selection, setSelection] = useState({});
	const [syncing, setSyncing] = useState(false);
	const [contactVerified, setContactVerified] = useState(false);
	const [consent, setConsent] = useState({});
	const gatewayContextRef = useRef(null);
	const syncTimerRef = useRef(null);
	const declaredItems = (snapshot && snapshot.declared_items) || [];
	const consentBoxes = (snapshot && snapshot.consent_checkboxes) || [];
	const toggleConsent = (key) => setConsent((c) => ({ ...c, [key]: !c[key] }));

	// Verification gate (added to the state snapshot by the verification addon).
	const verification = (snapshot && snapshot.verification) || null;
	const verificationMode = verification ? verification.mode : 'email_only';
	const verificationRequired = !!(verification && verification.verification_required);
	// Dial-code selector hints — passed down to ContactStep for country pre-selection.
	const storeDialCode = (verification && verification.default_dialing_code) || '';
	const savedPhone = (() => {
		const vid = verification && verification.verified_identifier;
		if (vid && vid.startsWith('+')) return vid;
		const bp = snapshot && snapshot.saved_fields && snapshot.saved_fields.billing_phone;
		return (bp && bp.startsWith('+')) ? bp : '';
	})();
	// Re-arm the gate if the customer edits the contact after verifying.
	const verifiedIdentifier = useRef('');

	// Boot: reuse provided session id, or create a new one with declared items.
	useEffect(() => {
		// Request full-screen modal on mount — Shopify-style two-column layout.
		requestFullscreenModal(config.parentOrigin);

		(async () => {
			try {
				if (config.sessionId) {
					api.setSession(config.sessionId);
				} else {
					await api.createSession({
						productId: config.productId,
						priceId: config.priceId,
						quantity: config.quantity,
						items: config.items, // multi-item from data-items attribute
					});
				}
				const snap = await api.getState();
				// Defensive: a broken/empty state response (see CheckoutApi._request)
				// should surface as a clear message, never a cryptic
				// "reading 'declared_items'" null-deref down the line.
				if (!snap || typeof snap !== 'object') {
					throw new Error('Could not load checkout details. Please refresh and try again.');
				}
				setSnapshot(snap);
				setSelection(selectionFromDeclared(snap.declared_items));
				if (snap.available_gateways && snap.available_gateways.length) {
					setPaymentMethod(snap.available_gateways[0].id);
				}
				// Pre-fill the form with the customer's saved billing/shipping
				// fields, matching the legacy /checkout/ behaviour. Only seed
				// keys actually returned by the server so unset keys keep the
				// initialFields() defaults (notably same_as_shipping=true).
				if (snap.saved_fields && Object.keys(snap.saved_fields).length) {
					setFields((f) => ({ ...f, ...snap.saved_fields }));
				}
				// Restore verified state. Two paths:
				// 1. Server confirms (logged-in users, guests where cookie round-tripped OK).
				// 2. sessionStorage fallback for guests whose se_co_ver cookie didn't
				//    survive the REST round-trip — same-tab refresh case.
				const verif = (snap.verification) || {};
				if (verif.is_already_verified && verif.verified_identifier) {
					const vid = verif.verified_identifier;
					verifiedIdentifier.current = vid;
					setContactVerified(true);
					saveVerifiedSession(vid);
					// Always overwrite user_email with vid so resolveIdentifier()
					// and verifiedIdentifier.current stay in sync — the re-arm
					// effect would immediately fire if they diverge (e.g. because
					// saved_fields had a placeholder email on a phone-only account,
					// or billing_phone was stored in a non-E.164 format).
					setFields((f) => ({
						...f,
						user_email: vid,
						// For phone-only: billing_phone is also the contact —
						// seed it so ContactStep shows the right number.
						...(verif.mode === 'phone_only' ? { billing_phone: vid } : {}),
					}));
				} else {
					// Server couldn't confirm — try sessionStorage.
					const stored = readVerifiedSession();
					if (stored) {
						verifiedIdentifier.current = stored.identifier;
						setContactVerified(true);
						setFields((f) => ({
							...f,
							user_email: stored.identifier,
							...(verif.mode === 'phone_only' ? { billing_phone: stored.identifier } : {}),
						}));
					}
				}
				// Seed the shipping-method selection from the server's chosen rate
				// so the selector shows the right radio pre-checked on first paint.
				if (snap.chosen_shipping_method) {
					setFields((f) => ({ ...f, shipping_method: snap.chosen_shipping_method }));
				}
				setPhase('ready');
			} catch (e) {
				setError(e.message || 'Failed to start checkout.');
				setPhase('fatal');
			}
		})();
	}, [api, config.sessionId, config.productId, config.priceId, config.quantity]);

	// Debounced sync: when the selection changes, push to the server and refresh totals.
	const handleSelectionChange = (next) => {
		setSelection(next);
		if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
		syncTimerRef.current = setTimeout(async () => {
			setSyncing(true);
			try {
				const fresh = await api.syncItems(Object.values(next));
				setSnapshot(fresh);
			} catch (e) {
				setError(e.message || 'Could not update items.');
			} finally {
				setSyncing(false);
			}
		}, 250);
	};

	const updateFields = (patch) => setFields((f) => ({ ...f, ...patch }));

	// Refresh the checkout whenever ANY field changes: debounce-push the form to
	// the server (/update → recalculates shipping/tax against the address +
	// chosen method) and re-render the summary when the response says something
	// material changed. Mirrors the traditional checkout's behaviour so the
	// instant checkout no longer waits until "Place order" to recompute totals.
	// `refresh` is computed server-side (address diff OR totals moved), so a pure
	// cosmetic edit (name/email) syncs the draft without a wasteful re-render.
	const fieldsSyncTimer = useRef(null);
	const lastSyncedRef = useRef('');
	useEffect(() => {
		if (phase !== 'ready') return undefined;

		// Skip the sync if nothing the server cares about actually changed since
		// the last push (avoids a redundant round-trip on the boot-time seed).
		const fingerprint = JSON.stringify(fields);
		if (fingerprint === lastSyncedRef.current) return undefined;

		if (fieldsSyncTimer.current) clearTimeout(fieldsSyncTimer.current);
		fieldsSyncTimer.current = setTimeout(async () => {
			lastSyncedRef.current = fingerprint;
			try {
				const res = await api.updateCheckout(withMirroredShipping(fields));
				// Apply the recalculated snapshot only when the server flags a
				// material change, so an already-mounted gateway widget (Stripe
				// Elements) isn't torn down on every keystroke.
				if (res && res.refresh && res.snapshot) {
					setSnapshot(res.snapshot);
				}
			} catch (e) {
				// Non-fatal: /place recalculates server-side regardless.
			}
		}, 500);

		return () => {
			if (fieldsSyncTimer.current) clearTimeout(fieldsSyncTimer.current);
		};
	}, [fields, phase, api]);

	// Re-arm the verification gate when the contact being verified changes.
	useEffect(() => {
		if (!verificationRequired) return;
		const current = resolveIdentifier(verificationMode, fields);
		if (contactVerified && current !== verifiedIdentifier.current) {
			setContactVerified(false);
			clearVerifiedSession();
		}
	}, [fields, verificationMode, verificationRequired, contactVerified]);

	const handlePlace = async (e) => {
		if (e && typeof e.preventDefault === 'function') e.preventDefault();
		// Guard against double-submit — particularly relevant for PayPal where
		// the user could re-click the Buttons widget while a place_order is
		// already in flight.
		if (phase === 'placing') return;
		setError('');
		setLoginUrl('');
		// Contact gate — require a valid email/phone (per verification mode)
		// before doing anything else, so an empty/malformed contact is caught
		// inline rather than as a server error at the end.
		const contactError = validateContact(verificationMode, fields);
		if (contactError) {
			setError(contactError);
			return;
		}
		// EU/German consent gate — block until mandatory boxes are ticked.
		const missingConsent = consentBoxes.filter((b) => b.required && !consent[b.key]);
		if (missingConsent.length) {
			setError('Please accept the required terms before placing your order.');
			return;
		}
		setPhase('placing');
		try {
			// Final pre-payment sync: make sure the draft/totals reflect the exact
			// address + shipping method being submitted before the gateway builds
			// its intent or the order is placed — even if the debounced field sync
			// hasn't fired yet (fast submit).
			try {
				await api.updateCheckout(withMirroredShipping(fields));
			} catch (e) { /* non-fatal: /place recalculates server-side */ }

			const adapter = getGateway(paymentMethod);
			let payload = {};
			if (adapter && adapter.processPayment) {
				const ctx = gatewayContextRef.current;
				const r = await adapter.processPayment({
					formData: fields,
					gateway: snapshot.available_gateways.find((g) => g.id === paymentMethod),
					stripeContext: ctx,
					api,
				});
				if (r && r.payment_payload) payload = r.payment_payload;
			}
			// In phone-only mode, the server resolves the verified contact from
			// billing_phone. BillingShipping lets the user enter a different
			// address phone after verifying, so we must re-sync billing_phone
			// back to the verified contact (user_email) before submitting.
			const orderFields = { ...fields, storeengine_consent: consent };
			if (verificationMode === 'phone_only' && orderFields.user_email) {
				orderFields.billing_phone = orderFields.user_email;
			}
			const result = await api.placeOrder({
				fields: { ...withMirroredShipping(orderFields), storeengine_consent: consent },
				paymentMethod,
				paymentPayload: payload,
			});
			setOrderId(result.order_id);
			setPhase('done');
		} catch (e) {
			setError(e.message || 'Could not complete the purchase.');
			// "Email already registered" → offer a real login CTA (server threads
			// the pre-filled, redirect-back login URL through the 409 data).
			const lu = e && e.data && e.data.data && e.data.data.login_url;
			if (lu) setLoginUrl(lu);
			setPhase('ready');
		}
	};

	if (phase === 'fatal') {
		return createElement('div', { className: 'se-embedded-app' },
			createElement(ErrorBanner, { message: error })
		);
	}

	if (phase === 'booting' || !snapshot) {
		return createElement('div', { className: 'se-embedded-app se-embedded-app--booting' },
			createElement('div', { className: 'se-embedded-app__spinner' })
		);
	}

	if (phase === 'done') {
		return createElement('div', { className: 'se-embedded-app se-embedded-app--success' },
			createElement(SuccessScreen, {
				orderId,
				successUrl: config.successUrl,
				parentOrigin: config.parentOrigin,
				onDismiss: () => {
					try {
						window.parent && window.parent !== window && window.parent.postMessage(
							{ source: 'storeengine-checkout', type: 'close.request' },
							config.parentOrigin || '*'
						);
					} catch (e) { /* noop */ }
				},
			})
		);
	}

	const showCustomize = declaredItems.length > 1 || declaredItems.some((d) => d.optional);

	// Verify-first gate: dim + disable everything after the verification step
	// until the contact is verified, whether or not it has been entered yet.
	const gateLocked = verificationRequired && !contactVerified;

	return createElement('form', {
		className: 'se-embedded-app min-h-screen bg-gray-50',
		onSubmit: handlePlace,
	},
		// Two-column body: form on the left, sticky order summary on the right.
		createElement('div', {
			className: 'mx-auto max-w-checkout px-4 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 lg:gap-10',
		},
			// Form column.
			createElement('div', { className: 'order-2 lg:order-1 flex flex-col gap-6 bg-white shadow-sm border border-solid border-[var(--storeengine-border-color)] rounded p-6' },
				createElement(ErrorBanner, {
					message: error,
					onDismiss: () => { setError(''); setLoginUrl(''); },
					actionHref: loginUrl,
					actionLabel: 'Log in to continue',
				}),
				showCustomize && createElement(CustomizeOrder, {
					declared: declaredItems,
					selection,
					currency: snapshot.cart && snapshot.cart.currency,
					onChange: handleSelectionChange,
					syncing,
				}),
				createElement(ContactBlock, {
					api,
					fields,
					onChange: updateFields,
					mode: verificationMode,
					savedPhone,
					storeDialCode,
					verificationRequired,
					verified: contactVerified,
					onVerified: () => {
						const id = resolveIdentifier(verificationMode, fields);
						verifiedIdentifier.current = id;
						setContactVerified(true);
						saveVerifiedSession(id);
					},
				}),
				// Everything after the contact/verification is dimmed + disabled
				// (50% opacity, non-interactive) until the contact is verified.
				createElement('div', {
					className: 'flex flex-col gap-6' + (gateLocked
						? ' opacity-50 pointer-events-none select-none cursor-not-allowed transition-opacity'
						: ''),
					'aria-disabled': gateLocked ? 'true' : undefined,
				},
					createElement(BillingShipping, {
						fields,
						onChange: updateFields,
						needsShipping: !!(snapshot.cart && snapshot.cart.needs_shipping),
						api,
						snapshot,
					}),
					createElement(PaymentSelector, {
						gateways: snapshot.available_gateways,
						selected: paymentMethod,
						onSelect: setPaymentMethod,
						api,
						// Feed the live cart total + currency to gateway UIs that
						// need it (Stripe PaymentElement renders "Pay $X" wallets
						// and requires an amount in 'payment' mode).
						amount: (snapshot.totals && snapshot.totals.total) || 0,
						currency: (snapshot.cart && snapshot.cart.currency) || '',
						onGatewayContext: (ctx) => { gatewayContextRef.current = ctx; },
						onGatewayError: (e) => setError(e.message || 'Payment setup failed.'),
						// Widget-driven gateways (PayPal Buttons) trigger place-order
						// from inside their own UI flow rather than via the regular
						// "Place order" submit. Expose handlePlace so they can.
						onAutoSubmit: () => { handlePlace(); },
					}),
					// EU/German consent checkboxes — rendered above the order button.
					consentBoxes.length > 0 && createElement('div', {
						className: 'flex flex-col gap-2 mt-2',
					},
						...consentBoxes.map((b) => createElement('label', {
							key: b.key,
							className: 'flex items-start gap-2 text-sm text-[var(--storeengine-text-color)]',
						},
							createElement('input', {
								type: 'checkbox',
								checked: !!consent[b.key],
								onChange: () => toggleConsent(b.key),
								className: 'mt-1',
							}),
							createElement('span', null,
								createElement('span', { dangerouslySetInnerHTML: { __html: b.label } }),
								b.required ? createElement('span', { className: 'text-red-600' }, ' *') : null,
								b.page_url ? createElement('a', {
									href: b.page_url,
									target: '_blank',
									rel: 'noopener noreferrer',
									className: 'ml-1 text-blue-600 underline',
								}, 'View') : null
							)
						))
					),
					// Hide the standard "Place order" button for widget-driven
					// gateways (PayPal Buttons): the gateway's own widget is the
					// submit affordance. The widget's onApprove → onAutoSubmit
					// path triggers handlePlace() directly.
					(() => {
						const adapter = paymentMethod ? getGateway(paymentMethod) : null;
						if (adapter && adapter.widgetDriven) return null;
						const blockedByVerification = verificationRequired && !contactVerified;
						return createElement('button', {
							type: 'submit',
							className: [
								'mt-2 w-full h-auto rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 text-base transition-colors border-0',
								'disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300',
							].join(' '),
							disabled: phase === 'placing' || syncing || blockedByVerification,
						}, phase === 'placing' ? 'Processing…' : (snapshot.place_order_label || 'Place order'));
					})()
				)
			),

			// Order summary column — sticky on desktop, top of stack on mobile.
			createElement('aside', {
				className: 'order-1 lg:order-2 lg:sticky lg:top-6 self-start border border-solid border-[var(--storeengine-border-color)] rounded',
			},
				createElement(OrderSummary, {
					snapshot,
					api,
					onSnapshotUpdate: (next) => setSnapshot(next),
				})
			),
		)
	);
}
