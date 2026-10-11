/**
 * Donation / name-your-price amount field — client-side min/max validation.
 *
 * The server (Helper::clamp_amount) still enforces the real floor/ceiling as
 * defense in depth for a tampered/bypassed request, but it no longer silently
 * "fixes" an out-of-range amount into a cart line — a donor who typed 300 into
 * a $10–$100 field should see why their amount was rejected, not have it
 * quietly become 100. So here, out of range is surfaced as an error (while
 * typing, and on blur) and the Buy Now / Add to Cart click is blocked until
 * the amount is corrected — nothing is auto-adjusted on the client either.
 */
( function () {
	'use strict';

	/**
	 * Whether `wrap`'s amount is out of range, and if so, which message to
	 * show. Returns null when the field is empty (native `required`/type=
	 * number validation handles that) or within range.
	 *
	 * @param {Element} wrap
	 * @return {{input: Element, message: string}|null}
	 */
	function evaluate( wrap ) {
		var input = wrap.querySelector( '.storeengine-donation-amount-input' );

		if ( ! input ) {
			return null;
		}

		var value = parseFloat( input.value );

		if ( '' === input.value || isNaN( value ) ) {
			return null;
		}

		var min = parseFloat( input.getAttribute( 'min' ) );
		if ( ! isNaN( min ) && value < min ) {
			return { input: input, message: wrap.getAttribute( 'data-below-min-message' ) };
		}

		var maxAttr = input.getAttribute( 'max' );
		var max = null === maxAttr ? NaN : parseFloat( maxAttr );
		if ( ! isNaN( max ) && value > max ) {
			return { input: input, message: wrap.getAttribute( 'data-above-max-message' ) };
		}

		return null;
	}

	/**
	 * Reflect `invalid` (the `evaluate()` result, or null) onto `wrap`'s error
	 * text and invalid-state styling.
	 *
	 * @param {Element}                            wrap
	 * @param {{input: Element, message: string}|null} invalid
	 */
	function showState( wrap, invalid ) {
		var error = wrap.querySelector( '.storeengine-donation-amount-error' );

		wrap.classList.toggle( 'storeengine-donation-amount-wrap--invalid', !! invalid );

		if ( ! error ) {
			return;
		}

		if ( invalid && invalid.message ) {
			error.textContent = invalid.message;
			error.hidden = false;
		} else {
			error.hidden = true;
		}
	}

	function wire( wrap ) {
		var input = wrap.querySelector( '.storeengine-donation-amount-input' );

		if ( ! input ) {
			return;
		}

		var update = function () {
			showState( wrap, evaluate( wrap ) );
		};

		input.addEventListener( 'input', update );
		input.addEventListener( 'blur', update );
	}

	/**
	 * A product with more than one customer-priced price renders one amount
	 * field per price (each tagged data-toggle-by-price + data-price-id,
	 * server-rendered hidden+disabled). Show only the one matching whichever
	 * `price_id` radio is currently selected, and disable the rest so a
	 * hidden field's amount is never posted alongside the visible one.
	 */
	function wireToggle() {
		var wraps = document.querySelectorAll( '.storeengine-donation-amount-wrap[data-toggle-by-price]' );

		if ( ! wraps.length ) {
			return;
		}

		var radios = document.querySelectorAll( 'input[name="price_id"]' );

		var sync = function () {
			var checked = null;
			for ( var r = 0; r < radios.length; r++ ) {
				if ( radios[ r ].checked ) {
					checked = radios[ r ].value;
					break;
				}
			}

			for ( var i = 0; i < wraps.length; i++ ) {
				var wrap = wraps[ i ];
				var input = wrap.querySelector( '.storeengine-donation-amount-input' );
				var active = null !== checked && wrap.getAttribute( 'data-price-id' ) === checked;

				wrap.hidden = ! active;
				if ( input ) {
					input.disabled = ! active;
				}
			}
		};

		for ( var j = 0; j < radios.length; j++ ) {
			radios[ j ].addEventListener( 'change', sync );
		}

		sync();
	}

	/**
	 * Block Add to Cart / Buy Now when the form's active amount field(s) are
	 * out of range. Registered on `document` in the CAPTURE phase, so this
	 * runs — and, on failure, stops propagation — before the delegated
	 * bubble-phase click handler that fires the actual add-to-cart request
	 * (dev_storeengine/frontend/cart.js), regardless of script load order.
	 */
	function wireSubmitGuard() {
		document.addEventListener( 'click', function ( event ) {
			var target = event.target;
			var btn = target && target.closest && target.closest( '.storeengine-btn--add-to-cart, .storeengine-btn--direct-checkout' );

			if ( ! btn ) {
				return;
			}

			var form = btn.closest( 'form' );

			if ( ! form ) {
				return;
			}

			var wraps = form.querySelectorAll( '.storeengine-donation-amount-wrap' );
			var firstInvalid = null;

			for ( var i = 0; i < wraps.length; i++ ) {
				var wrap = wraps[ i ];
				var input = wrap.querySelector( '.storeengine-donation-amount-input' );

				// Hidden/disabled fields belong to a price the donor didn't
				// select (multi-price toggle) and aren't submitted — skip them.
				if ( ! input || input.disabled || wrap.hidden ) {
					continue;
				}

				var invalid = evaluate( wrap );
				showState( wrap, invalid );

				if ( invalid && ! firstInvalid ) {
					firstInvalid = invalid;
				}
			}

			if ( firstInvalid ) {
				event.preventDefault();
				event.stopPropagation();
				firstInvalid.input.focus();
				if ( firstInvalid.input.scrollIntoView ) {
					firstInvalid.input.scrollIntoView( { behavior: 'smooth', block: 'center' } );
				}
			}
		}, true );
	}

	document.addEventListener( 'DOMContentLoaded', function () {
		var wraps = document.querySelectorAll( '.storeengine-donation-amount-wrap' );
		for ( var i = 0; i < wraps.length; i++ ) {
			wire( wraps[ i ] );
		}

		wireToggle();
		wireSubmitGuard();
	} );
} )();
