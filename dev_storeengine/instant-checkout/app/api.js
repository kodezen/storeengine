/**
 * Tiny fetch wrapper for the StoreEngine Instant Checkout REST surface.
 *
 *   - /storeengine/v1/checkout/{state,update,place,states,payment-intent/{id}}
 *   - /storeengine/v1/instant-checkout/{session,sync-items,stripe-intent}
 *
 * The React app always runs on the same origin as the store (either inside
 * the iframe served at /?se_checkout=1 or inline via the shortcode), so auth
 * is always cookie + nonce.
 */

import { buildRestUrl } from '../../utils/rest-url';

// Namespace routes (no `/wp-json/` prefix — that shape only exists on Pretty
// permalinks). `buildRestUrl()` resolves them against the correct REST root.
const CORE_ROUTE = 'storeengine/v1/checkout';
const ADDON_ROUTE = 'storeengine/v1/instant-checkout';
const OTP_ROUTE = 'storeengine/v1/otp';

function readNonce() {
	if ( typeof window === 'undefined' ) {
		return '';
	}
	const cfg = window.StoreEngineInstantCheckout;
	if ( cfg && cfg.nonce ) {
		return cfg.nonce;
	}
	if ( window.wpApiSettings && window.wpApiSettings.nonce ) {
		return window.wpApiSettings.nonce;
	}
	return '';
}

export class CheckoutApi {
	constructor( { storeUrl, restUrl, sessionId, nonce } ) {
		this.storeUrl = ( storeUrl || '' ).replace( /\/+$/, '' );
		this.sessionId = sessionId || null;
		this.nonce = nonce || '';

		// Prefer an explicit REST root (threaded from PHP as the mount's
		// `data-rest-url`), which already reflects the site's permalink
		// structure. Otherwise fall back to the standard `/wp-json/` mount on
		// the store origin — correct for Pretty permalinks.
		const cfg =
			( typeof window !== 'undefined' &&
				window.StoreEngineInstantCheckout ) ||
			{};
		this.restRoot =
			restUrl ||
			cfg.rest_url ||
			( this.storeUrl ? this.storeUrl + '/wp-json/' : '/wp-json/' );
	}

	setSession( id ) {
		this.sessionId = id;
	}

	async _request( method, fullUrl, body ) {
		const headers = { 'Content-Type': 'application/json' };
		const nonce = this.nonce || readNonce();
		if ( nonce ) {
			headers[ 'X-WP-Nonce' ] = nonce;
		}
		const init = {
			method,
			credentials: 'include',
			headers,
		};
		if ( body ) {
			init.body = JSON.stringify( body );
		}
		const res = await fetch( fullUrl, init );
		const text = await res.text();
		let data = null;
		let parseFailed = false;
		if ( text ) {
			try {
				data = JSON.parse( text );
			} catch ( e ) {
				parseFailed = true;
			}
		}
		if ( ! res.ok ) {
			const err = new Error(
				( data && ( data.message || data.code ) ) ||
					`Request failed (${ res.status })`
			);
			err.status = res.status;
			err.code = data && data.code;
			err.data = data;
			throw err;
		}
		// A 2xx with an empty or non-JSON body means the server began a normal
		// response then broke mid-flight — almost always a PHP fatal or a
		// serialization failure (e.g. invalid UTF-8 in the payload, or a PHP
		// notice/deprecation leaking into the output) AFTER the 200 header was
		// already committed. Surface that instead of returning null and letting
		// the caller crash later with a cryptic "Cannot read properties of null
		// (reading 'declared_items')".
		if ( parseFailed || ! text || data === null ) {
			const snippet = ( text || '' ).trim().slice( 0, 300 );
			const err = new Error(
				snippet
					? `The server returned an invalid response (status ${ res.status }). This usually means a plugin conflict or a PHP error/notice leaked into the response. Details: ${ snippet }`
					: `The server returned an empty response (status ${ res.status }). Please try again or contact support.`
			);
			err.status = res.status;
			err.rawBody = text;
			throw err;
		}
		return data;
	}

	core( path, method = 'GET', body = null ) {
		return this._request(
			method,
			buildRestUrl( this.restRoot, CORE_ROUTE + path ),
			body
		);
	}
	addon( path, method = 'GET', body = null ) {
		return this._request(
			method,
			buildRestUrl( this.restRoot, ADDON_ROUTE + path ),
			body
		);
	}

	// --- Session lifecycle ---

	createSession( { productId, priceId, quantity, items } ) {
		const body =
			items && items.length
				? { items }
				: {
						product_id: productId,
						price_id: priceId || 0,
						quantity: quantity || 1,
				  };
		return this.addon( '/session', 'POST', body ).then( ( res ) => {
			this.sessionId = res.session_id;
			return res;
		} );
	}

	syncItems( selection ) {
		return this.addon( '/sync-items', 'POST', {
			session_id: this.sessionId,
			selection,
		} );
	}

	/**
	 * Create the gateway's client-side intent (Stripe PaymentIntent, PayPal
	 * order, …) via the unified core endpoint introduced in Phase 3.
	 * @param gatewayId
	 */
	createPaymentIntent( gatewayId ) {
		return this.core(
			`/payment-intent/${ encodeURIComponent( gatewayId ) }`,
			'POST',
			{
				session_id: this.sessionId,
			}
		);
	}

	/**
	 * @deprecated Use createPaymentIntent('stripe') instead.
	 */
	createStripeIntent() {
		return this.createPaymentIntent( 'stripe' );
	}

	// --- Checkout (core — shared with the traditional /checkout/ page) ---

	getState() {
		const qs = new URLSearchParams( {
			session_id: this.sessionId || '',
		} ).toString();
		return this.core( `/state?${ qs }` );
	}

	updateCheckout( fields ) {
		return this.core( '/update', 'POST', {
			session_id: this.sessionId,
			fields,
		} );
	}

	placeOrder( { fields, paymentMethod, paymentPayload } ) {
		return this.core( '/place', 'POST', {
			session_id: this.sessionId,
			fields,
			payment_method: paymentMethod,
			payment_payload: paymentPayload || {},
		} );
	}

	applyCoupon( couponCode ) {
		return this.core( '/coupon/apply', 'POST', {
			session_id: this.sessionId,
			coupon_code: couponCode,
		} );
	}

	removeCoupon( couponCode ) {
		return this.core( '/coupon/remove', 'POST', {
			session_id: this.sessionId,
			coupon_code: couponCode,
		} );
	}

	/**
	 * Probe whether an email already belongs to an existing account, so the
	 * contact step can warn the shopper (with a login link) before they reach
	 * Place Order. Returns { exists, login_url }.
	 * @param email
	 */
	checkContact( email ) {
		return this.core( '/check-contact', 'POST', { email } );
	}

	getStates( countryCode ) {
		const qs = new URLSearchParams( {
			country_code: countryCode,
		} ).toString();
		return this.core( `/states?${ qs }` );
	}

	// --- Contact verification (OTP) ---

	requestOtp( identifier, purpose = 'checkout' ) {
		return this._request(
			'POST',
			buildRestUrl( this.restRoot, OTP_ROUTE + '/request' ),
			{
				identifier,
				purpose,
			}
		);
	}

	verifyOtp( identifier, code, purpose = 'checkout' ) {
		return this._request(
			'POST',
			buildRestUrl( this.restRoot, OTP_ROUTE + '/verify' ),
			{
				identifier,
				code,
				purpose,
			}
		);
	}
}
