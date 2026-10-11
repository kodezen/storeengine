/**
 * Permalink-safe REST URL builder.
 *
 * WordPress's `rest_url()` returns two different shapes depending on the site's
 * permalink setting (Settings → Permalinks):
 *
 *   - Pretty (`/%postname%/`):  https://site.test/wp-json/
 *   - Plain  (`?p=123`):        https://site.test/index.php?rest_route=/
 *
 * Any code that hardcodes `/wp-json/` breaks entirely on Plain permalinks, and
 * any code that appends a `?query` onto the Plain base produces a malformed URL
 * with two `?` (the query separator has to be `&` there). This helper joins a
 * REST root + namespace route + query params correctly for BOTH shapes, so
 * callers never have to branch on the permalink structure.
 *
 * @param {string} restRoot REST root — e.g. `window.StoreEngineGlobal.rest_url`.
 *                          May be absolute (`https://site/wp-json/`,
 *                          `https://site/index.php?rest_route=/`) or
 *                          root-relative (`/wp-json/`).
 * @param {string} route    Namespace + route WITHOUT a leading slash or query,
 *                          e.g. `storeengine/v1/checkout/state`. A trailing
 *                          `?query` is tolerated and merged into `params`.
 * @param {string|Object|URLSearchParams} [params] Optional query params.
 * @return {string} An absolute URL that resolves under both permalink shapes.
 */
export function buildRestUrl( restRoot, route, params ) {
	const origin =
		typeof window !== 'undefined' && window.location
			? window.location.origin
			: undefined;

	// Guarantee exactly one trailing slash on the root. For the Plain shape
	// (`…?rest_route=/`) this leaves the trailing slash intact so it prefixes
	// the route as a value of the `rest_route` query var.
	const root = ( restRoot || '/wp-json/' ).replace( /\/+$/, '' ) + '/';

	// A route may carry its own `?query` (legacy call sites). Split it off so it
	// gets merged through `searchParams` rather than concatenated blindly.
	const [ path, inlineQuery ] = String( route ).replace( /^\/+/, '' ).split( '?' );

	const url = new URL( root + path, origin );

	const merge = ( value ) => {
		if ( ! value ) {
			return;
		}
		const sp =
			value instanceof URLSearchParams
				? value
				: new URLSearchParams( value );
		for ( const [ key, val ] of sp ) {
			url.searchParams.append( key, val );
		}
	};

	merge( inlineQuery );
	merge( params );

	return url.toString();
}
