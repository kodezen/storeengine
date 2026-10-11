/**
 * StoreEngine Instant Checkout — React app entry.
 *
 * Mounts the React checkout into any DOM node carrying [data-storeengine-checkout].
 * Config is read from data-* attributes; auth is cookie + nonce so this works
 * inside the storefront, the iframe modal, or a same-origin headless WP install.
 */
import { createElement, render } from '@wordpress/element';
import CheckoutApp from './CheckoutApp.jsx';
import { register as registerGateway } from './gateways/registry';
// Exposes window.StoreEngineCheckoutCore for third-party gateway plugins.
import '@CheckoutCore/global';
import './styles.scss';

const MOUNT_ATTR = 'data-storeengine-checkout';

function readConfig( el ) {
	let items = [];
	const raw = el.getAttribute( 'data-items' );
	if ( raw ) {
		try {
			items = JSON.parse( raw ) || [];
		} catch ( e ) {
			/* ignore */
		}
	}
	return {
		storeUrl:
			el.getAttribute( 'data-store-url' ) ||
			( typeof window !== 'undefined' ? window.location.origin : '' ),
		// Permalink-aware REST root (from `rest_url()`); lets the app reach the
		// API on sites using Plain permalinks. Empty falls back to `/wp-json/`.
		restUrl: el.getAttribute( 'data-rest-url' ) || '',
		productId: parseInt( el.getAttribute( 'data-product-id' ), 10 ) || 0,
		priceId: parseInt( el.getAttribute( 'data-price-id' ), 10 ) || 0,
		quantity: parseInt( el.getAttribute( 'data-quantity' ), 10 ) || 1,
		successUrl: el.getAttribute( 'data-success-url' ) || '',
		sessionId: el.getAttribute( 'data-session-id' ) || '',
		nonce: el.getAttribute( 'data-nonce' ) || '',
		// Allowed origin to postMessage to (set by the iframe template). Falls
		// back to '*' for inline mounts where there's no parent frame.
		parentOrigin: el.getAttribute( 'data-parent-origin' ) || '*',
		items: Array.isArray( items ) ? items : [],
	};
}

function mountInto( el ) {
	if ( el.dataset.seMounted ) {
		return;
	}
	el.dataset.seMounted = '1';
	const config = readConfig( el );
	// Expose the parent-frame origin globally so per-gateway adapters (Paddle,
	// etc.) can postMessage back to the SDK iframe modal without having to
	// thread it through every callsite.
	if ( typeof window !== 'undefined' && config.parentOrigin ) {
		window.STOREENGINE_PARENT_ORIGIN = config.parentOrigin;
	}
	if ( ! config.productId && ! config.sessionId ) {
		// eslint-disable-next-line no-console
		console.warn(
			'[StoreEngine Instant Checkout] requires data-product-id or data-session-id on',
			el
		);
		return;
	}
	render( createElement( CheckoutApp, { config } ), el );
}

function mountAll() {
	document.querySelectorAll( `[${ MOUNT_ATTR }]` ).forEach( mountInto );
}

if ( typeof document !== 'undefined' ) {
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', mountAll, {
			once: true,
		} );
	} else {
		mountAll();
	}
	// Late-rendered hosts (page builders, SPA navigation).
	const obs = new MutationObserver( mountAll );
	obs.observe( document.documentElement, { childList: true, subtree: true } );
}

// Public API for third-party gateway plugins:
//   window.StoreEngineInstantCheckout.registerGateway('my_gw', { Component, processPayment });
if ( typeof window !== 'undefined' ) {
	const ns = window.StoreEngineInstantCheckout || {};
	ns.registerGateway = registerGateway;
	ns.mount = mountInto;
	window.StoreEngineInstantCheckout = ns;
}
