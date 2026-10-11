/**
 * Price-type filter for the single product page.
 *
 * The template renders a `.storeengine-price-filter` bar (one button per distinct
 * price-type group: Lifetime / Yearly / Installment / …) only when a product
 * offers more than one type. This module wires those buttons: clicking one shows
 * just that group's prices and selects its first price. It also keeps the active
 * filter in sync with whatever price is selected — so a `?price_id=…` deep-link
 * (handled by SelectPriceFromQuery) that lands on a hidden group reveals it.
 *
 * Init order: must run BEFORE SelectPriceFromQuery() so the `change` it dispatches
 * is caught here and the right group is revealed.
 */
export default function ( root = document ) {
	// `root` scopes the query so Quick View can re-run this on just the injected
	// modal markup (default is the whole document for the full product page).
	root
		.querySelectorAll( '.storeengine-single-product-prices' )
		.forEach( ( container ) => {
			const filter = container.querySelector(
				'.storeengine-price-filter'
			);
			if ( ! filter ) {
				return; // single price-type — no filter to wire.
			}

			const buttons = filter.querySelectorAll( '[data-price-group]' );
			const prices = container.querySelectorAll(
				'.storeengine-single-product-price[data-price-group]'
			);

			const showGroup = ( group, selectFirst ) => {
				buttons.forEach( ( b ) =>
					b.classList.toggle(
						'is-active',
						b.getAttribute( 'data-price-group' ) === group
					)
				);

				let firstRadio = null;
				prices.forEach( ( p ) => {
					const match =
						p.getAttribute( 'data-price-group' ) === group;
					p.style.display = match ? '' : 'none';
					p.classList.toggle( 'storeengine-price--hidden', ! match );
					if ( match && ! firstRadio ) {
						firstRadio = p.querySelector(
							'input[name="price_id"]'
						);
					}
				} );

				if ( selectFirst && firstRadio && ! firstRadio.checked ) {
					firstRadio.checked = true;
					firstRadio.dispatchEvent(
						new Event( 'change', { bubbles: true } )
					);
				}
			};

			buttons.forEach( ( btn ) => {
				btn.addEventListener( 'click', ( e ) => {
					e.preventDefault();
					showGroup( btn.getAttribute( 'data-price-group' ), true );
				} );
			} );

			// Keep the filter in sync with the selected price (e.g. ?price_id=…
			// selecting a price in a currently-hidden group). selectFirst=false
			// avoids re-selecting / event loops.
			container.addEventListener( 'change', ( e ) => {
				const input = e.target;
				if (
					! input ||
					input.name !== 'price_id' ||
					! input.checked
				) {
					return;
				}
				const label = input.closest(
					'.storeengine-single-product-price[data-price-group]'
				);
				if ( ! label ) {
					return;
				}
				const group = label.getAttribute( 'data-price-group' );
				const active = filter.querySelector( '.is-active' );
				if (
					! active ||
					active.getAttribute( 'data-price-group' ) !== group
				) {
					showGroup( group, false );
				}
			} );
		} );
}
