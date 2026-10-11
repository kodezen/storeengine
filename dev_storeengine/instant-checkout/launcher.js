/**
 * Quick Checkout launcher — bundled into core `frontend.js`.
 *
 * - Exposes `window.StoreEngine.Checkout` so any storefront page (including
 *   third-party plugins / themes) can drive the modal directly.
 * - Auto-binds clicks on `.storeengine-instant-checkout` and
 *   `[data-instant-checkout="modal"]` buttons. The handler replaces the
 *   button label with a spinner while the modal opens, then restores it on
 *   close. Behaviour preserved from the addon-era inline JS.
 *
 * The selector itself is the activation gate: the addon's PHP only emits
 * those classes / data attributes when the addon is enabled, so the listener
 * stays dormant on every page when the addon is off — no need to look at any
 * window globals.
 *
 * Same-origin only — embed-key powered cross-origin embeds load the slimmer
 * `embed-sdk.js` from the Embeddable Checkout addon.
 */
import { Checkout } from './sdk.js';

if ( typeof window !== 'undefined' ) {
	const existing = window.StoreEngine || {};
	window.StoreEngine = Object.assign( existing, { Checkout } );
}

const SPIN_STYLE_ID = 'se-btn-spin-style';
const SPIN_KEYFRAMES = '@keyframes se-btn-spin{to{transform:rotate(360deg)}}';

function injectSpinStylesOnce() {
	if (
		typeof document === 'undefined' ||
		document.getElementById( SPIN_STYLE_ID )
	) {
		return;
	}
	const st = document.createElement( 'style' );
	st.id = SPIN_STYLE_ID;
	st.textContent = SPIN_KEYFRAMES;
	document.head.appendChild( st );
}

function makeSpinner() {
	const s = document.createElement( 'span' );
	s.style.cssText =
		'display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:se-btn-spin .9s linear infinite;vertical-align:middle';
	return s;
}

function bindLauncher() {
	if ( typeof document === 'undefined' ) {
		return;
	}
	injectSpinStylesOnce();

	// Capture phase so we run BEFORE jQuery's delegated cart.js handler — that
	// way `stopPropagation()` actually prevents the legacy direct checkout
	// REST flow from racing the modal mount and redirecting the page before
	// the iframe gets a chance to appear.
	document.addEventListener(
		'click',
		( e ) => {
			const btn =
				e.target.closest &&
				e.target.closest(
					'.storeengine-instant-checkout, [data-instant-checkout="modal"]'
				);
			if ( ! btn || btn.tagName === 'A' ) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();

			// Build a per-click Checkout instance using the current page origin.
			// The constructor's same-origin check throws on URL/port mismatches
			// (dev setups where `home_url()` doesn't match `window.location`),
			// which previously killed the bind silently and left the click
			// without a handler. Forcing the storefront origin here keeps the
			// modal opening regardless of what the addon localised.
			let checkout;
			try {
				checkout = new Checkout( {
					store_url: window.location.origin,
				} );
			} catch ( err ) {
				// eslint-disable-next-line no-console
				console.error(
					'[StoreEngine.Checkout] failed to initialise:',
					err
				);
				return;
			}

			// On multi-price products the form renders a `<input name="price_id">`
			// radio group (or hidden input). When the shopper has selected a price
			// we want that one to open in the modal — fall back to the button's
			// data-price-id (the first price baked in by `direct_checkout_attrs()`)
			// when nothing has been picked yet.
			const form = btn.closest( 'form' );
			const selectedPriceEl =
				form &&
				( form.querySelector( '[name="price_id"]:checked' ) ||
					form.querySelector(
						'input[name="price_id"]:not([type="radio"]):not([type="checkbox"])'
					) );
			const selectedPriceId = selectedPriceEl
				? parseInt( selectedPriceEl.value, 10 )
				: 0;
			const buttonPriceId =
				parseInt( btn.getAttribute( 'data-price-id' ), 10 ) || 0;

			// Quantity input lives in the same form for non-subscription/installment
			// flows. Default to 1 when absent or invalid.
			const qtyInput = form && form.querySelector( '[name="quantity"]' );
			const quantity = qtyInput
				? Math.max( 1, parseInt( qtyInput.value, 10 ) || 1 )
				: 1;

			const args = {
				product_id: parseInt(
					btn.getAttribute( 'data-product-id' ),
					10
				),
				price_id: selectedPriceId || buttonPriceId,
				quantity,
			};

			const rect = btn.getBoundingClientRect();
			const origLabel = btn.innerHTML;
			const origStyle = btn.getAttribute( 'style' ) || '';
			btn.style.width = rect.width + 'px';
			btn.style.height = rect.height + 'px';
			btn.style.padding = '0';
			btn.style.display = 'inline-flex';
			btn.style.alignItems = 'center';
			btn.style.justifyContent = 'center';
			btn.disabled = true;
			btn.dataset.seOrigLabel = origLabel;
			btn.dataset.seOrigStyle = origStyle;
			btn.innerHTML = '';
			btn.appendChild( makeSpinner() );

			const restore = () => {
				btn.disabled = false;
				btn.innerHTML = btn.dataset.seOrigLabel || origLabel;
				btn.setAttribute(
					'style',
					btn.dataset.seOrigStyle || origStyle
				);
				delete btn.dataset.seOrigLabel;
				delete btn.dataset.seOrigStyle;
			};
			checkout.on( 'closed', restore );
			checkout.on( 'error', ( payload ) => {
				// eslint-disable-next-line no-console
				console.error( '[StoreEngine.Checkout] open failed:', payload );
				restore();
			} );

			try {
				Promise.resolve( checkout.open( args ) ).catch( ( err ) => {
					// eslint-disable-next-line no-console
					console.error(
						'[StoreEngine.Checkout] open rejected:',
						err
					);
					restore();
				} );
			} catch ( err ) {
				// eslint-disable-next-line no-console
				console.error( '[StoreEngine.Checkout] open threw:', err );
				restore();
			}
		},
		true
	);
}

if ( typeof document !== 'undefined' ) {
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', bindLauncher, {
			once: true,
		} );
	} else {
		bindLauncher();
	}
}
