import { getSeGlobal, isPage, wait } from '@Utils/helper';
import { doActionAsync } from '@wordpress/hooks';
import { gtag_integration } from './google';
import { fbq_integration } from './facebook';
import { SEPixelData } from './types';

const initPageHooks = async (): Promise< void > => {
	await wait( 100 );

	try {
		const sePixelData: SEPixelData | undefined = window?.SEPixelData;

		if ( isPage( 'shop' ) && sePixelData ) {
			doActionAsync( 'storeengine.view_page.view_shop', sePixelData );
		}

		if ( isPage( 'product' ) && sePixelData ) {
			doActionAsync( 'storeengine.view_page.view_product', sePixelData );
		}

		// @TODO remove mini cart from cart & checkout page.

		if ( isPage( 'cart' ) && sePixelData ) {
			doActionAsync( 'storeengine.cart.view_cart', sePixelData );
		}

		if ( isPage( 'checkout' ) ) {
			doActionAsync(
				'storeengine.checkout.checkout_initialized',
				sePixelData
			);
		}
	} catch ( e ) {
		if ( process.env.NODE_ENV !== 'production' ) {
			console.error( e ); // eslint-disable-line
		}
	}
};

export const initPixelIntegrations = () => {
	if ( getSeGlobal( 'settings.analytics.google', false ) ) {
		gtag_integration();
	}

	if ( getSeGlobal( 'settings.analytics.facebook', false ) ) {
		fbq_integration();
	}

	initPageHooks().catch();
};
