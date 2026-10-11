import { __ } from '@wordpress/i18n';

/**
 * Shop-card variant switcher (Shopify-style).
 *
 * Each variable card server-renders a swatch/pill strip
 * (`[data-storeengine-card-variants]`) + an inline variation matrix. Picking
 * options resolves the variant: swap the card image, update the price, gate
 * sold-out options, and fill the hidden price_id / variation_id so the existing
 * delegated add-to-cart handler adds the exact variant.
 *
 * Lives in the frontend bundle (loads everywhere) so it also enhances variable
 * cards injected into Recently Viewed / the Wishlist page, not just the shop.
 */
function initCard( root ) {
	if ( root.__seVariantInit ) {
		return;
	}
	root.__seVariantInit = true;

	const dataEl = root.querySelector( '.storeengine-card-variants-data' );
	if ( ! dataEl ) {
		return;
	}
	let variations = [];
	try {
		variations = ( JSON.parse( dataEl.textContent ) || {} ).variations || [];
	} catch ( e ) {
		return;
	}
	if ( ! variations.length ) {
		return;
	}

	const card =
		root.closest( '.storeengine-product-wrapper' ) ||
		root.closest( '.storeengine-product' );
	if ( ! card ) {
		return;
	}

	const groups = Array.from(
		root.querySelectorAll( '.storeengine-card-variants__group' )
	);
	const taxonomies = groups.map( ( g ) => g.getAttribute( 'data-taxonomy' ) );
	const priceEl = card.querySelector( '[data-storeengine-card-price]' );
	const priceIdInput = card.querySelector( '[data-storeengine-card-price-id]' );
	const variationIdInput = card.querySelector(
		'[data-storeengine-card-variation-id]'
	);
	const button = card.querySelector(
		'.storeengine-card-variant-form .storeengine-btn--add-to-cart'
	);
	const image = card.querySelector( '.storeengine-product__thumbnail-image' );
	const header = card.querySelector( '.storeengine-product__header' );

	const defaultImage = image ? image.getAttribute( 'src' ) : '';
	const defaultPrice = priceEl ? priceEl.innerHTML : '';
	const selected = {}; // taxonomy -> slug

	const matches = ( v, sel ) =>
		Object.keys( sel ).every( ( t ) => v.attributes[ t ] === sel[ t ] );

	const swapImage = ( src ) => {
		if ( ! image || ! src || image.getAttribute( 'src' ) === src ) {
			return;
		}
		image.src = src;
		// If the card carousel is active, keep it on the (now swapped) first slide.
		const carousel = header && header.__seCardCarousel;
		if ( carousel && typeof carousel.set === 'function' ) {
			try {
				carousel.set( 0 );
			} catch ( e ) {}
		}
	};

	function update() {
		// 1) Mark options with no in-stock variation (given the other picks).
		groups.forEach( ( group ) => {
			const tax = group.getAttribute( 'data-taxonomy' );
			const others = {};
			Object.keys( selected ).forEach( ( t ) => {
				if ( t !== tax ) {
					others[ t ] = selected[ t ];
				}
			} );
			group
				.querySelectorAll( '.storeengine-card-variants__opt' )
				.forEach( ( opt ) => {
					const test = {
						...others,
						[ tax ]: opt.getAttribute( 'data-slug' ),
					};
					const available = variations.some(
						( v ) => matches( v, test ) && v.in_stock
					);
					opt.classList.toggle( 'is-unavailable', ! available );
				} );
		} );

		// 2) Swap the image to match the current (possibly partial) selection.
		if ( Object.keys( selected ).length ) {
			const withImg = variations.find(
				( v ) => matches( v, selected ) && v.image
			);
			if ( withImg ) {
				swapImage( withImg.image );
			}
		} else {
			swapImage( defaultImage );
		}

		// 3) Fully resolved → wire price + add-to-cart to that variant.
		const complete = taxonomies.every( ( t ) => selected[ t ] );
		const variation = complete
			? variations.find( ( v ) => matches( v, selected ) )
			: null;

		if ( variation ) {
			if ( priceEl && variation.price_html ) {
				priceEl.innerHTML = variation.price_html;
			}
			if ( priceIdInput ) {
				priceIdInput.value = variation.price_id;
			}
			if ( variationIdInput ) {
				variationIdInput.value = variation.id;
			}
			if ( variation.image ) {
				swapImage( variation.image );
			}
			if ( button ) {
				const ok = !! variation.in_stock;
				button.disabled = ! ok;
				button.textContent = ok
					? __( 'Add to Cart', 'storeengine' )
					: __( 'Out of stock', 'storeengine' );
				button.classList.toggle( 'storeengine-btn--out-of-stock', ! ok );
			}
			return;
		}

		// Not resolved yet.
		if ( variationIdInput ) {
			variationIdInput.value = '0';
		}
		if ( priceIdInput ) {
			priceIdInput.value = '';
		}
		if ( button ) {
			button.disabled = true;
			button.textContent = __( 'Select options', 'storeengine' );
			button.classList.remove( 'storeengine-btn--out-of-stock' );
		}
		if ( priceEl && ! Object.keys( selected ).length ) {
			priceEl.innerHTML = defaultPrice;
		}
	}

	groups.forEach( ( group ) => {
		const tax = group.getAttribute( 'data-taxonomy' );
		group
			.querySelectorAll( '.storeengine-card-variants__opt' )
			.forEach( ( opt ) => {
				opt.addEventListener( 'click', () => {
					const slug = opt.getAttribute( 'data-slug' );
					if ( selected[ tax ] === slug ) {
						delete selected[ tax ];
					} else {
						selected[ tax ] = slug;
					}
					group
						.querySelectorAll( '.storeengine-card-variants__opt' )
						.forEach( ( o ) => {
							const active =
								selected[ tax ] === o.getAttribute( 'data-slug' );
							o.classList.toggle( 'is-active', active );
							o.setAttribute( 'aria-checked', String( active ) );
						} );
					update();
				} );
			} );
	} );

	update();
}

const initAll = ( scope ) =>
	( scope || document )
		.querySelectorAll( '[data-storeengine-card-variants]' )
		.forEach( initCard );

export default function () {
	initAll( document );

	// Enhance variable cards injected later (Recently Viewed, Wishlist page).
	let scheduled = false;
	const observer = new MutationObserver( ( muts ) => {
		if ( scheduled ) {
			return;
		}
		for ( const m of muts ) {
			for ( const node of m.addedNodes ) {
				if (
					node.nodeType === 1 &&
					( ( node.matches &&
						node.matches( '[data-storeengine-card-variants]' ) ) ||
						( node.querySelector &&
							node.querySelector(
								'[data-storeengine-card-variants]'
							) ) )
				) {
					scheduled = true;
					requestAnimationFrame( () => {
						scheduled = false;
						initAll( document );
					} );
					return;
				}
			}
		}
	} );
	observer.observe( document.body, { childList: true, subtree: true } );
}
