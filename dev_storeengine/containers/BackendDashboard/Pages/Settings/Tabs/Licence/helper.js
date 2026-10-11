import { API } from '@Utils/helper';

/**
 *
 * @type {StoreEngineSDKPayload}
 */
export const SeSdk = {
	rest_url: null,
	nonce: null,
	device_id: null,
	version: null,
	locale: null,
	wordpress: null,
	license: {
		license: '',
		status: 'inactive',
		device_id: '',
		slug: 0,
		product_id: 0,
		remaining: 0,
		activations: 0,
		limit: 1,
		unlimited: 0,
		expires: 0,
		updated_at: '',
	},
	package: {
		version: '',
		type: '',
		update: {},
		need_update: false,
	},
	// Manual-install fallback + grace info (SDK >= 1.5.5).
	upload_url: '',
	store_dashboard_url: '',
	purchase_url: '',
	license_in_grace: false,
	optin: {
		allowed: false,
		show: true,
		last_send: 0,
	},
	...( window.SE_SDK_STOREENGINE_PRO || {} ),
};

export const request = ( endpoint, payload ) =>
	API.post( SeSdk.rest_url + endpoint, payload );

export const getData = ( endpoint, payload ) =>
	API.get( SeSdk.rest_url + endpoint, { params: payload } );

export const buildPurchaseUrl = ( base, SeSdk ) => {
	try {
		const url = new URL( base );
		url.searchParams.set( 'utm_source', 'storeengine-sdk' );
		url.searchParams.set( 'utm_medium', 'license-form' );
		url.searchParams.set( 'utm_campaign', 'license-activation-upsell' );
		url.searchParams.set( 'utm_content', 'purchase-link' );
		url.searchParams.set( 'utm_term', 'storeengine-pro' );
		url.searchParams.set( 'locale', SeSdk?.locale );
		url.searchParams.set( 'wordpress', SeSdk?.wordpress );
		url.searchParams.set( 'sdk_version', SeSdk?.version );
		url.searchParams.set( 'instance', SeSdk?.device_id );
		return url.toString();
	} catch {
		return base;
	}
};
