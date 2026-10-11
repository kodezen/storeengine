/**
 * Recently-viewed products.
 *
 * The list of product ids is kept in the shopper's own browser (localStorage) —
 * no server-side tracking. On a single product page we record the current
 * product, then ask the REST endpoint to render cards for the previously-viewed
 * ones and drop them into the server-rendered container.
 */
const KEY = 'storeengine_recently_viewed';
const MAX = 12;

const readIds = () => {
	try {
		const v = JSON.parse( localStorage.getItem( KEY ) );
		return Array.isArray( v ) ? v.map( String ) : [];
	} catch ( e ) {
		return [];
	}
};

const writeIds = ( ids ) => {
	try {
		localStorage.setItem( KEY, JSON.stringify( ids.slice( 0, MAX ) ) );
	} catch ( e ) {
		// storage unavailable (private mode / quota) — silently skip.
	}
};

// Exported so other entry points (e.g. Quick View) can record a view too.
export const trackRecentlyViewed = ( id ) => {
	const sid = String( id || '' );
	if ( ! sid || sid === '0' ) {
		return;
	}
	writeIds( [ sid, ...readIds().filter( ( x ) => x !== sid ) ] );
};

export default function () {
	const section = document.querySelector(
		'[data-storeengine-recently-viewed]'
	);
	if ( ! section ) {
		return;
	}

	// Rendered in wp_footer (reliable across themes); move it into the main
	// content area so it sits below the product rather than under the footer.
	if ( section.parentElement === document.body ) {
		const main =
			document.querySelector( 'main' ) ||
			document.querySelector( '.wp-site-blocks' );
		if ( main ) {
			main.appendChild( section );
		}
	}

	const currentId = section.getAttribute( 'data-exclude' ) || '';
	// Snapshot the previously-viewed set BEFORE recording the current product.
	const others = readIds().filter( ( x ) => x !== String( currentId ) );
	trackRecentlyViewed( currentId );

	if ( ! others.length ) {
		return;
	}

	const grid = section.querySelector(
		'[data-storeengine-recently-viewed-grid]'
	);
	const rest = section.getAttribute( 'data-rest' );
	const nonce = section.getAttribute( 'data-nonce' );
	if ( ! grid || ! rest ) {
		return;
	}

	const url = `${ rest }?ids=${ encodeURIComponent(
		others.join( ',' )
	) }&exclude=${ encodeURIComponent( currentId ) }`;

	fetch( url, { headers: { 'X-WP-Nonce': nonce || '' } } )
		.then( ( r ) => ( r.ok ? r.json() : Promise.reject( r ) ) )
		.then( ( data ) => {
			if ( data && data.html && data.html.trim() ) {
				grid.innerHTML = data.html;
				section.hidden = false;
			}
		} )
		.catch( () => {} );
}
