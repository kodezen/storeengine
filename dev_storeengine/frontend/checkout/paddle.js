/**
 * Paddle gateway — legacy /checkout/ shell.
 *
 * All Paddle logic lives in @CheckoutCore/gateways/paddle. This file is the
 * legacy CheckoutManager.registerGateway adapter that:
 *   1. Builds a CheckoutApi configured for cookie-auth + WP REST nonce.
 *   2. Calls the shared processPaddlePayment(ctx) — same module the React
 *      Quick Checkout uses.
 *   3. Hands the resulting `payment_payload` to ctx.placeOrder(), which
 *      routes to REST `/checkout/place` (or `/checkout/pay-order` on
 *      failed-order retry).
 */

import { __ } from '@wordpress/i18n';
import { getSeGlobal, payment_gateways } from '@Utils/helper';
import { CheckoutApi } from '@CheckoutCore/api';
import { processPaddlePayment } from '@CheckoutCore/gateways/paddle';

function getPaddleGatewayData() {
	const cfg = payment_gateways.paddle || {};
	// The legacy `gateway_javascript_params` filter exposes `theme` / `variant`;
	// the shared adapter accepts both that and the `checkout_theme` /
	// `checkout_variant` names from `storeengine/checkout/gateway/paddle/data`.
	return {
		id: 'paddle',
		client_token: cfg.client_token,
		sandbox_mode: !! cfg.sandbox_mode,
		checkout_theme: cfg.checkout_theme || cfg.theme || 'light',
		checkout_variant: cfg.checkout_variant || cfg.variant || 'one-page',
	};
}

function getCheckoutApi() {
	return new CheckoutApi( {
		surface: 'legacy',
		// Same-origin REST — cookie auth + X-WP-Nonce.
		wpNonce: getSeGlobal( 'nonce', '' ),
	} );
}

export function initPaddleGateway() {
	if (
		! window.StoreEngineCheckout ||
		typeof window.StoreEngineCheckout.registerGateway !== 'function'
	) {
		return;
	}

	window.StoreEngineCheckout.registerGateway( 'paddle', {
		async processPayment( { formData, placeOrder } ) {
			const gateway = getPaddleGatewayData();
			if ( ! gateway.client_token ) {
				throw new Error(
					__(
						'Paddle is not configured. Please contact your administrator.',
						'storeengine'
					)
				);
			}

			// Run the shared adapter — opens Paddle.Checkout overlay, awaits
			// `checkout.completed`, returns { payment_payload: { paddle_transaction_id, paddle_checkout_id } }.
			const api = getCheckoutApi();
			const result = await processPaddlePayment( {
				formData,
				gateway,
				api,
				surface: 'legacy',
			} );

			const payload = ( result && result.payment_payload ) || {};
			return placeOrder( payload );
		},
	} );
}

// Legacy export for backward compatibility.
export const paddleCheckout = () => initPaddleGateway();
