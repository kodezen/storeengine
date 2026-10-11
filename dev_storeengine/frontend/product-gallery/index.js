/**
 * StoreEngine custom product gallery — vanilla JS, no jQuery / no Flickity.
 *
 * Enhances the server-rendered `[data-se-gallery]` markup into one of three
 * layouts (carousel | stacked | grid) and wires the lightbox + zoom. Loaded
 * only on product pages that actually have gallery media.
 */
import './styles.scss';
import Gallery from './Gallery';

const init = ( scope = document ) => {
	scope.querySelectorAll( '[data-se-gallery]' ).forEach( ( root ) => {
		if ( root.__seGallery ) {
			return;
		}
		try {
			root.__seGallery = new Gallery( root );
			// The variant picker may have announced an image before this
			// gallery was enhanced: apply it now.
			const pending = window.__seVariationImage;
			if ( pending && ( pending.scope === document || pending.scope.contains( root ) ) ) {
				root.__seGallery.showVariationImage( pending.image );
			}
		} catch ( e ) {
			// Never let a gallery error take down the page — fall back to the
			// server-rendered markup (which is a usable stacked gallery).
			// eslint-disable-next-line no-console
			console.error( '[StoreEngine gallery]', e );
		}
	} );
};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', () => init() );
} else {
	init();
}

// Variant picker → gallery: show the selected variation's image (or restore
// with `image: null`). `scope` limits it to the picker's own product (Quick
// View modal vs the page).
document.addEventListener( 'storeengine:variation:image', ( e ) => {
	const scope = e?.detail?.scope || document;
	window.__seVariationImage = { scope, image: e?.detail?.image || null };
	scope.querySelectorAll( '[data-se-gallery]' ).forEach( ( root ) => {
		root.__seGallery?.showVariationImage?.( e?.detail?.image || null );
	} );
} );

// Allow future re-init (e.g. a variation-driven gallery swap replaces the root).
document.addEventListener( 'storeengine:gallery:refresh', ( e ) =>
	init( e?.detail?.scope || document )
);
