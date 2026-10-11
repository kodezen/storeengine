/**
 * StoreEngine product-archive card enhancements — vanilla JS.
 * Card image carousel + Quick View modal (Quick View reuses the single-product
 * gallery lib via the `storeengine:gallery:refresh` event).
 */
import './styles.scss';
import CardCarousel from './CardCarousel';
import QuickView from './QuickView';

const cfg = window.StoreEngineArchive || { features: {}, i18n: {} };

const init = () => {
	if ( cfg.features && cfg.features.carousel ) {
		document
			.querySelectorAll( '.storeengine-product__header' )
			.forEach( ( header ) => {
				if ( header.__seCardCarousel ) {
					return;
				}
				const data = header.querySelector(
					'.storeengine-card-gallery-data'
				);
				if ( ! data ) {
					return;
				}
				try {
					header.__seCardCarousel = new CardCarousel( header, data );
				} catch ( e ) {
					// eslint-disable-next-line no-console
					console.error( '[StoreEngine card carousel]', e );
				}
			} );
	}

	if ( cfg.features && cfg.features.quick_view ) {
		QuickView.bind();
	}
};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
