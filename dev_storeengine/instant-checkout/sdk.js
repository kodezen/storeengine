/**
 * StoreEngine Quick Checkout SDK — pure class.
 *
 * Two consumers:
 *   - The core launcher (`launcher.js`, bundled into frontend.js) wires this to
 *     same-origin Quick Checkout buttons via WP REST cookie + nonce auth.
 *   - The Embeddable Checkout addon's `embed-sdk.js` (loaded by external sites)
 *     uses it with an `embed_key` for cross-origin sessions.
 *
 *   // Same-origin (storefront, headless WP on the same domain) — no key.
 *   const checkout = new Checkout({});
 *   checkout.open({ product_id: 123 });
 *
 *   // Cross-origin embed:
 *   const checkout = new Checkout({
 *     embed_key: 'pk_live_...',
 *     store_url: 'https://store.example.com',
 *   });
 *   checkout.open({
 *     product_id: 123,
 *     plan_id: 456,        // optional (price_id)
 *     licenses: 1,         // optional (quantity)
 *     purchaseCompleted: (data) => {...},
 *     success: (data) => {...},
 *     onExitIntent: () => {...},
 *   });
 */
import { CheckoutFrame } from './iframe.js';
import { buildRestUrl } from '../utils/rest-url';

const DEFAULT_NAMESPACE = 'storeengine/v1';

function readSameSiteNonce() {
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

export class Checkout {
	constructor( opts = {} ) {
		const storeUrl = this._stripTrailingSlash(
			opts.store_url ||
				( typeof window !== 'undefined' &&
					window.StoreEngineInstantCheckout &&
					window.StoreEngineInstantCheckout.storeUrl ) ||
				( typeof window !== 'undefined' ? window.location.origin : '' )
		);

		// Accept `embed_key` (preferred) or legacy `publishable_key` for callers
		// migrating from the older addon.
		const embedKey = opts.embed_key || opts.publishable_key || '';

		this.options = {
			embed_key: embedKey,
			store_url: storeUrl,
			// Optional explicit REST root. Same-origin callers get it from the
			// localized config so requests work on Plain permalinks; cross-origin
			// embeds may pass it too. Falls back to `store_url + /wp-json/`.
			rest_url:
				opts.rest_url ||
				( typeof window !== 'undefined' &&
					window.StoreEngineInstantCheckout &&
					window.StoreEngineInstantCheckout.rest_url ) ||
				'',
			product_id: opts.product_id || null,
		};

		if ( ! this.options.store_url ) {
			throw new Error( '[StoreEngine.Checkout] store_url is required' );
		}

		// Same-origin auth path: no embed key was supplied AND the SDK is loaded
		// on the same origin as the store. Send WP REST nonce + cookie instead
		// of X-StoreEngine-Embed-Key.
		this._sameOrigin =
			! this.options.embed_key && this._isSameOriginToStore();
		if ( ! this._sameOrigin && ! this.options.embed_key ) {
			throw new Error(
				'[StoreEngine.Checkout] embed_key is required for cross-origin usage'
			);
		}

		this._activeFrame = null;
		this._listeners = {};
	}

	_isSameOriginToStore() {
		if ( typeof window === 'undefined' ) {
			return false;
		}
		try {
			return (
				new URL( this.options.store_url ).origin ===
				window.location.origin
			);
		} catch ( e ) {
			return false;
		}
	}

	on( event, callback ) {
		if ( typeof callback !== 'function' ) {
			return this;
		}
		if ( ! this._listeners[ event ] ) {
			this._listeners[ event ] = [];
		}
		this._listeners[ event ].push( callback );
		return this;
	}

	off( event, callback ) {
		if ( ! this._listeners[ event ] ) {
			return this;
		}
		this._listeners[ event ] = this._listeners[ event ].filter(
			( cb ) => cb !== callback
		);
		return this;
	}

	_emit( event, payload ) {
		( this._listeners[ event ] || [] ).forEach( ( cb ) => {
			try {
				cb( payload );
			} catch ( err ) {
				console.error( '[StoreEngine.Checkout]', err );
			}
		} );
	}

	_stripTrailingSlash( url ) {
		return ( url || '' ).replace( /\/+$/, '' );
	}

	_apiUrl( path ) {
		const restRoot =
			this.options.rest_url || `${ this.options.store_url }/wp-json/`;
		return buildRestUrl(
			restRoot,
			`${ DEFAULT_NAMESPACE }/instant-checkout${ path }`
		);
	}

	_originOfStore() {
		try {
			return new URL( this.options.store_url ).origin;
		} catch ( e ) {
			return this.options.store_url;
		}
	}

	async _createSession( { product_id, price_id, quantity } ) {
		const headers = { 'Content-Type': 'application/json' };
		let credentials = 'omit';
		if ( this._sameOrigin ) {
			credentials = 'include';
			const nonce = readSameSiteNonce();
			if ( nonce ) {
				headers[ 'X-WP-Nonce' ] = nonce;
			}
		} else {
			headers[ 'X-StoreEngine-Embed-Key' ] = this.options.embed_key;
		}
		const res = await fetch( this._apiUrl( '/session' ), {
			method: 'POST',
			credentials,
			headers,
			body: JSON.stringify( {
				product_id,
				price_id: price_id || 0,
				quantity: quantity || 1,
			} ),
		} );
		if ( ! res.ok ) {
			const text = await res.text().catch( () => '' );
			throw new Error(
				`[StoreEngine.Checkout] session failed (${ res.status }): ${ text }`
			);
		}
		return res.json();
	}

	async open( openOpts = {} ) {
		const product_id = openOpts.product_id || this.options.product_id;
		if ( ! product_id ) {
			throw new Error(
				'[StoreEngine.Checkout] product_id is required (pass at construction or in open())'
			);
		}

		// Wire per-call callbacks as one-shot listeners.
		const wire = ( event, cb ) => {
			if ( typeof cb !== 'function' ) {
				return;
			}
			const wrapped = ( payload ) => {
				try {
					cb( payload );
				} finally {
					this.off( event, wrapped );
				}
			};
			this.on( event, wrapped );
		};
		wire( 'purchase.completed', openOpts.purchaseCompleted );
		wire( 'closed', openOpts.afterClose );
		wire( 'opened', openOpts.afterOpen );
		wire( 'exitIntent', openOpts.onExitIntent );
		// `success` fires after the modal closes following a successful purchase
		// (mirrors the Freemius semantic).
		let lastPurchase = null;
		this.on( 'purchase.completed', ( payload ) => {
			lastPurchase = payload;
		} );
		if ( typeof openOpts.success === 'function' ) {
			const onClosed = () => {
				if ( lastPurchase ) {
					openOpts.success( lastPurchase );
				}
				this.off( 'closed', onClosed );
			};
			this.on( 'closed', onClosed );
		}

		// If a previous modal is already open, close it first.
		if ( this._activeFrame ) {
			this._activeFrame.destroy();
			this._activeFrame = null;
		}

		try {
			const session = await this._createSession( {
				product_id,
				price_id: openOpts.plan_id || openOpts.price_id || 0,
				quantity: openOpts.licenses || openOpts.quantity || 1,
			} );

			this._activeFrame = new CheckoutFrame( {
				storeOrigin: this._originOfStore(),
				onEvent: ( type, payload ) => this._emit( type, payload ),
				// Default to fullscreen — matches the React Shopify-style layout.
				// Pass `fullscreen: false` in open() opts to fall back to the
				// legacy 760px modal.
				fullscreen: openOpts.fullscreen !== false,
			} );
			this._activeFrame.mount( session.checkout_url );
			return session;
		} catch ( err ) {
			this._emit( 'error', { message: err.message || String( err ) } );
			throw err;
		}
	}

	close() {
		if ( this._activeFrame ) {
			this._activeFrame.requestClose( 'api' );
			this._activeFrame = null;
		}
	}

	// Freemius compat alias.
	destroy() {
		this.close();
	}
}

export default Checkout;
