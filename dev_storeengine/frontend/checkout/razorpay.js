/**
 * Razorpay gateway — legacy /checkout/ shell.
 *
 * All Razorpay logic lives in @CheckoutCore/gateways/razorpay. This file is
 * the legacy CheckoutManager.registerGateway adapter that:
 *   1. Builds a CheckoutApi configured for cookie-auth + WP REST nonce.
 *   2. Calls the shared processRazorpayPayment(ctx) — same module the React
 *      Quick Checkout uses.
 *   3. Hands the resulting `payment_payload` to ctx.placeOrder(), which
 *      routes to REST `/checkout/place` (or `/checkout/pay-order` on
 *      failed-order retry).
 */

import { __ } from '@wordpress/i18n';
import { getSeGlobal, payment_gateways } from '@Utils/helper';
import { CheckoutApi } from '@CheckoutCore/api';
import { processRazorpayPayment } from '@CheckoutCore/gateways/razorpay';

function getRazorpayGatewayData() {
	const cfg = payment_gateways.razorpay || {};
	// Same key names the `storeengine/checkout/gateway/razorpay/data` filter
	// emits (Phase 5a) — the legacy `gateway_javascript_params` filter
	// already exposes the same shape.
	return {
		id: 'razorpay',
		key_id: cfg.key_id,
		store_name: cfg.store_name || '',
		store_logo: cfg.store_logo || '',
		store_primary_color: cfg.store_primary_color || '',
	};
}

function getCheckoutApi() {
	return new CheckoutApi( {
		surface: 'legacy',
		// Same-origin REST — cookie auth + X-WP-Nonce.
		wpNonce: getSeGlobal( 'nonce', '' ),
	} );
}

export function initRazorpayGateway() {
	if (
		! window.StoreEngineCheckout ||
		typeof window.StoreEngineCheckout.registerGateway !== 'function'
	) {
		return;
	}
	if ( ! payment_gateways.razorpay ) {
		return;
	}

	window.StoreEngineCheckout.registerGateway( 'razorpay', {
		async processPayment( { formData, placeOrder } ) {
			const gateway = getRazorpayGatewayData();
			if ( ! gateway.key_id ) {
				throw new Error(
					__(
						'Razorpay is not configured. Please contact your administrator.',
						'storeengine'
					)
				);
			}

			// Run the shared adapter — opens the Razorpay modal, awaits the
			// handler callback, returns { payment_payload: { razorpay_payment_id, ... } }.
			const api = getCheckoutApi();
			const result = await processRazorpayPayment( {
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
export const razorpayCheckout = () => initRazorpayGateway();
