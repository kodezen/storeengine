import { __, sprintf } from '@wordpress/i18n';
import axios, { AxiosError, toFormData } from 'axios';
import { useLocation } from 'react-router-dom';
import moment from 'moment';
import { decodeEntities } from '@wordpress/html-entities';
import symbols from '@Utils/currency-symbols';
import { logger } from '@Utils/logger';

// eslint-disable-next-line
/*global window */

export const {
	admin_menu_lists,
	admin_url,
	admin_notices,
	ajaxurl,
	current_user_can,
	current_user_id,
	storeengine_nonce,
	is_admin,
	is_rtl,
	is_pro,
	namespace,
	nonce,
	addons,
	plugin_root_path,
	plugin_root_url,
	root_path,
	root_url,
	assets_url,
	rest_url,
	route_path,
	site_url,
	payment_gateways,
	checkout_page_url,
	thankyou_page,
	user_roles,
	integrations,
	currency_options,
	countries,
	currencies = [],
	timezone,
	webhooks,
	webhooks_groups,
	incoming_actions = [],
	invoice,
	is_ablocks_active,
	ablocks_status,
	customize_url,
	enable_after_purchase_redirect,
	enable_faqs = true,
	faq_mode = 'global',
	is_debug = false,
	staff_permissions = null,
} = window.StoreEngineGlobal;

/**
 * Whether the current user may write (create/update/delete) a CPT resource.
 *
 * Driven by the per-resource flags the Role & Permission addon injects. When no
 * staff-permission data is present (administrators, or the addon inactive) it
 * returns true and the server-side guard remains the backstop. Used by the CPT
 * editors to render read-only (hide Save) for a view-only staff user.
 *
 * @param {string} resource One of 'products' | 'coupons' | 'memberships'.
 * @param {string} mode     'create' | 'update' | 'delete'. Default 'update'.
 * @return {boolean} True when writing is allowed.
 */
export const canWriteResource = ( resource, mode = 'update' ) => {
	// Only managed staff are constrained. Administrators, vendors and everyone
	// else pass through untouched (the server-side guard is the backstop).
	if (
		! staff_permissions ||
		! staff_permissions.is_staff ||
		! staff_permissions[ resource ]
	) {
		return true;
	}

	return !! staff_permissions[ resource ][ mode ];
};

/**
 * The REST `context` to request for a CPT resource. A user who cannot write the
 * resource (view-only staff) gets `view` — it needs only read caps and returns
 * the same fields the editor displays — instead of `edit`, which is meant for
 * users who can actually save. Writers keep `edit`.
 *
 * @param {string} resource One of 'products' | 'coupons' | 'memberships'.
 * @return {string} 'edit' or 'view'.
 */
export const resourceRequestContext = ( resource ) => {
	const canWrite =
		canWriteResource( resource, 'update' ) ||
		canWriteResource( resource, 'create' ) ||
		canWriteResource( resource, 'delete' );

	return canWrite ? 'edit' : 'view';
};

export function noop(...args) { } // eslint-disable-line

export const isProInstalled = () => !! is_pro;

// `storeengine` and `storeengine-pro` are built as separate webpack bundles,
// each compiling its own copy of this module (unlike react-redux/react-router-dom/
// formik, `@Utils` is not in storeengine-pro's `externals`). A module-level
// variable here would only ever be updated in whichever bundle's copy calls
// setLiveAddons(), so the live addon map is bridged through `window` instead —
// the same mechanism already used to share react-redux/router/formik across
// the two bundles. Guarded so whichever bundle's copy of this module evaluates
// first (script load order isn't guaranteed) seeds it once, without clobbering
// a value the other bundle may have already set.
if ( typeof window.StoreEngineLiveAddons === 'undefined' ) {
	window.StoreEngineLiveAddons = addons;
}

/**
 * Push a fresh addon-active map (e.g. from a saveAddon/fetchAddons response)
 * so every bundle's isAddonActive() sees it immediately, without a reload.
 *
 * @param {Object} next Addon slug => boolean map.
 */
export const setLiveAddons = ( next ) => {
	window.StoreEngineLiveAddons = next;
};

/**
 * Whether a given addon is currently activated in StoreEngine settings.
 *
 * @param {string} slug e.g. "inventory", "inventory-pro", "cost-profit"
 * @return {boolean}
 */
export const isAddonActive = ( slug ) => {
	const current = window.StoreEngineLiveAddons;
	if ( ! slug || ! current ) return false;
	if ( typeof current === 'object' && current !== null ) {
		return !! current[ slug ];
	}
	return false;
};

/**
 *
 * @param {string|Stringable} str
 * @return {string|*} decoded string.
 *
 * @deprecated Please use decodeEntities function from '@wordpress/html-entities' package.
 *
 * Example: `import { decodeEntities } from '@wordpress/html-entities';`
 */
export function decodeHtmlEntities( str ) {
	if ( str ) {
		const txt = document.createElement( 'textarea' );
		txt.innerHTML = str;
		return txt.value;
	}

	return str;
}

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 *
 * @return {boolean} True if value is an Array, otherwise false
 */
const { isArray } = Array;
// const { getPrototypeOf } = Object;
export const { toString, hasOwnProperty } = Object.prototype;

const kindOf = ( ( cache ) => ( thing ) => {
	const str = toString.call( thing );
	return cache[ str ] || ( cache[ str ] = str.slice( 8, -1 ).toLowerCase() );
} )( Object.create( null ) );

const kindOfTest = ( type ) => ( thing ) =>
	kindOf( thing ) === type.toLowerCase();

const typeOfTest = ( type ) => ( thing ) => typeof thing === type;

const instanceOfTest = ( object ) => ( thing ) => thing instanceof object;

const isA = ( thing, object ) => instanceOfTest( object )( thing );

/**
 * Determine if a value is undefined
 *
 * @param {*} val The value to test
 *
 * @return {boolean} True if the value is undefined, otherwise false
 */
export const isUndefined = typeOfTest( 'undefined' );

/**
 * Determine if a value is a String
 *
 * @param {*} val The value to test
 *
 * @return {boolean} True if value is a String, otherwise false
 */
const isString = typeOfTest( 'string' );

/**
 * Determine if a value is a Function
 *
 * @param {*} val The value to test
 * @return {boolean} True if value is a Function, otherwise false
 */
export const isFunction = typeOfTest( 'function' );

/**
 * Determine if a value is a Number
 *
 * @param {*} val The value to test
 *
 * @return {boolean} True if value is a Number, otherwise false
 */
// const isNumber = typeOfTest( 'number' );

/**
 * Determine if a value is an Object
 *
 * @param {*} thing The value to test
 *
 * @return {boolean} True if value is an Object, otherwise false
 */
export const isObject = ( thing ) =>
	thing !== null && typeof thing === 'object';

/**
 * Determine if a value is a Boolean
 *
 * @param {*} thing The value to test
 * @return {boolean} True if value is a Boolean, otherwise false
 */
const isBoolean = ( thing ) => thing === true || thing === false;

/**
 * Determine if a value is a plain Object
 *
 * @param {*} val The value to test
 *
 * @return {boolean} True if value is a plain Object, otherwise false
 */
// const isPlainObject = ( val ) => {
// 	if ( kindOf( val ) !== 'object' ) {
// 		return false;
// 	}
//
// 	const prototype = getPrototypeOf( val );
// 	return (
// 		( prototype === null ||
// 			prototype === Object.prototype ||
// 			Object.getPrototypeOf( prototype ) === null ) &&
// 		! ( Symbol.toStringTag in val ) &&
// 		! ( Symbol.iterator in val )
// 	);
// };

/**
 * Determine if a value is a Date
 *
 * @param {*} val The value to test
 *
 * @return {boolean} True if value is a Date, otherwise false
 */
// const isDate = kindOfTest( 'Date' );
//
// const isAsyncFn = kindOfTest( 'AsyncFunction' );

// const isThenable = ( thing ) =>
// 	thing &&
// 	( isObject( thing ) || isFunction( thing ) ) &&
// 	isFunction( thing.then ) &&
// 	isFunction( thing.catch );

// const isPromise = ( thing ) => thing && kindOf( thing ) === 'promise' && isThenable( thing );

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {*} val The value to test
 *
 * @return {boolean} True if value is a URLSearchParams object, otherwise false
 */
const isURLSearchParams = kindOfTest( 'URLSearchParams' );

/**
 * Get a value from the global `StoreEngineGlobal` object.
 *
 * Supports dot-notation paths for nested properties.
 * Only own-properties are accessed (prototype chain is ignored).
 *
 * @template {DotPath<StoreEngineGlobal>} P
 * @template D
 *
 * @param {P} [path]
 *                           Dot-notation path (e.g. "checkout.settings.currency").
 *                           If omitted, the entire `StoreEngineGlobal` object is returned.
 *
 * @param {D} [defaultValue]
 *                           Value returned if the path does not exist or resolves to `undefined`.
 *                           The function's return type will match the type of this value when provided.
 *
 * @return {DotPathValue<StoreEngineGlobal> | D} // Return type should be `DotPathValue<StoreEngineGlobal, P>`, which ide not understanding well.
 *          - If `path` is provided: the resolved value at the path.
 *          - If the path is not found: `defaultValue`.
 *          - If `path` is omitted: the full `StoreEngineGlobal` object.
 */
export function getSeGlobal( path, defaultValue ) {
	const root = window.StoreEngineGlobal;
	if ( ! path ) {
		return root;
	}

	const value = path.split( '.' ).reduce( ( obj, key ) => {
		if ( obj === undefined || obj === null ) {
			return undefined;
		}

		// Only access own properties
		return hasOwnProperty.call( obj, key ) ? obj[ key ] : undefined;
	}, root );

	return value === undefined ? defaultValue : value;
}

/**
 * Check if current page is requested page.
 *
 * ### Example usage
 *
 * ```js
 * if ( isPage( 'shop' ) ) {
 *    // Do something in shop (product archive) page.
 * }
 * if ( isPage( 'product' ) ) {
 *    // Do something in single-product page.
 * }
 * if ( isPage( 'cart' ) ) {
 *    // Do something in cart page.
 * }
 * if ( isPage( 'checkout' ) ) {
 *    // Do something in checkout (new order) page.
 * }
 * if ( isPage( 'order_pay' ) ) {
 *    // Do something in checkout (order page) page.
 * }
 * ```
 *
 * @param {'shop'|'product'|'cart'|'checkout'|'order_pay'} page
 * @return {boolean}
 */
export const isPage = ( page ) => !! getSeGlobal( 'is_page.is_' + page, false );

/**
 * get Sanitized param value from current url
 *
 * @param {string} param name of the url param.
 */
export const getSanitizedURLParam = ( param ) => {
	const value = new URLSearchParams( window.location.search ).get( param );
	if ( ! value ) {
		return '';
	}

	return value
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#x27;' )
		.replace( /\//g, '&#x2F;' );
};

/**
 * @param {string} str
 * @param {string} charMask
 * @return {string}
 */
export const ltrim = ( str, charMask = ' \n\r\t\v\0' ) => {
	const escaped = charMask.replace( /[-/\\^$*+?.()|[\]{}]/g, '\\$&' );
	const regex = new RegExp( '^[' + escaped + ']+' );
	return str.replace( regex, '' );
};

/**
 * @param {string} str
 * @param {string} charMask
 * @return {string}
 */
export const rtrim = ( str, charMask = ' \n\r\t\v\0' ) => {
	const escaped = charMask.replace( /[-/\\^$*+?.()|[\]{}]/g, '\\$&' );
	const regex = new RegExp( '[' + escaped + ']+$' );
	return str.replace( regex, '' );
};

const normalize_url = ( str ) => str.trim().replace( /^\//, '' );

export const untrailingslashit = ( str ) =>
	rtrim( normalize_url( str ), '/\\' );

export const trailingslashit = ( str ) => untrailingslashit( normalize_url( str ) ) + '/'; // eslint-disable-line

export const get_assets_url = ( path ) =>
	assets_url + ltrim( normalize_url( path ), '/\\' );

/**
 * Remove items from object with filter callback.
 *
 * @param {{}}       obj
 * @param {Function} filter
 * @return {{}} Return cleaned object
 */
function removeBy( obj, filter ) {
	return Object.entries( obj )
		.filter( filter )
		.reduce(
			( acc, [ k, val ] ) => ( {
				...acc,
				[ k ]: val === Object( val ) ? removeBy( val, filter ) : val,
			} ),
			{}
		);
}

/**
 * Remove undefined, null & empty ('') items from object.
 *
 * @param {{}} obj
 * @return {{}} Returns cleaned object
 */
function removeEmpty( obj ) {
	return removeBy(
		obj,
		([_, val]) => val !== null && val !== '' && !isUndefined(val) // eslint-disable-line
	);
}

/**
 * Convert plain object into URLSearchParams.
 * @param {Record<string, string | string[]>|Object} obj
 * @return {URLSearchParams} returns URLSearchParams instance created with the input object.
 */
function objectToSearchParams( obj ) {
	const params = new window.URLSearchParams();
	for ( const [ key, value ] of Object.entries( obj ) ) {
		if ( isArray( value ) ) {
			for ( const v of value ) {
				params.append( key, v );
			}
		} else {
			params.append( key, value );
		}
	}

	return params;
}

/**
 * Convert URLSearchParams to plain object.
 *
 * @param {URLSearchParams} params
 * @return {Record<string, string | string[]>} Returns the converted object.
 */
function searchParamsToObject( params ) {
	const result = {};
	for ( const [ key, value ] of params.entries() ) {
		if ( key in result ) {
			result[ key ] = isArray( result[ key ] )
				? [ ...result[ key ], value ]
				: [ result[ key ], value ];
		} else {
			result[ key ] = value;
		}
	}

	return result;
}

/**
 * Get Admin Route Path.
 *
 * @example `get_route_path({page:'storeengine-orders',status:'completed',page_no:1,perPage:10})`
 *
 * @param {string|{}|URLSearchParams} query
 * @return {string} get admin route path.
 */
export const get_route_path = ( query = '' ) => {
	if ( ! isURLSearchParams( query ) && ! isObject( query ) ) {
		if ( isString( query ) && query.startsWith( 'storeengine-' ) ) {
			return `${ route_path }admin.php?page=${ query }`; // Dashboard sub-page.
		}

		return `${ route_path }admin.php?page=storeengine`; // Fallback to dashboard.
	}

	if ( ! isURLSearchParams( query ) ) {
		if ( isString( query ) ) {
			query = new URLSearchParams( query );
		} else if ( isObject( query ) ) {
			query = objectToSearchParams( removeEmpty( query ) );
		}
	}

	// It's possible to forcefully set page=storeengine if page is not plugin dashboard or sub-page.
	// But it will make this function unusable for redirecting user to other wp-admin path.

	return `${ route_path }admin.php?${ query.toString() }`;
};

/**
 * Get route path with options.
 *
 * @param {string}                                   path
 * @param {AdminRouteOptions|URLSearchParams|Object} [options] // eslint-disable-line
 * @return {string} Returns admin route path
 */
export const prepare_admin_route_path = ( path, options = {} ) => {
	if ( isURLSearchParams( options ) ) {
		options = searchParamsToObject( options );
	}

	const {
		status = '',
		page = 1,
		per_page = 10,
		search = '',
		sub_path = '',
		...query
	} = options;

	const prepared = {
		page: 'storeengine-' + path.replace( /^storeengine-/i, '' ),
	};

	if ( sub_path ) {
		prepared.path = sub_path;
	}

	if ( status ) {
		if ( status !== 'all' ) {
			prepared.status = status;
		} else {
			prepared.status = 'all';
		}
	}

	if ( page > 1 ) {
		prepared.page_no = page;
	}

	if ( per_page && per_page !== 10 ) {
		prepared.perPage = per_page;
	}

	if ( search ) {
		prepared.search = search;
	}

	// @xxx maybe use filter.

	return get_route_path( { ...prepared, ...query } );
};

/**
 * Get API route path.
 *
 * Generate storeengine api endpoint url for correct permalink structure with optional query params.
 *
 * @example `API.post( get_api_route( 'order/12' ) )`
 *
 * Outputs:
 *
 * `http://example.com/wp-json/storeengine/v1/order/12` // Pretty permalink
 * `http://example.com/index.php?rest_route=/storeengine/v1/order/12` // Plain permalink
 *
 * @example `API.post( get_api_route( 'order/12', {context: 'edit'} ) )` OR `API.post( get_api_route( 'order/12', 'context=edit' ) )`
 *
 * Outputs:
 *
 * `http://example.com/wp-json/storeengine/v1/order/12?context=edit` // Pretty permalink
 * `http://example.com/index.php?rest_route=/storeengine/v1/order/12&context=edit` // Plain permalink
 *
 * @example `API.post( get_api_route( 'order/12', {context: 'edit', status: 'processing'} ) )` OR `API.post( get_api_route( 'order', '?context=edit&status=processing' ) )`
 *
 * Outputs:
 *
 * `http://example.com/wp-json/storeengine/v1/order/12?context=edit&status=processing` // Pretty permalink
 * `http://example.com/index.php?rest_route=/storeengine/v1/order/12&context=edit&status=processing` // Plain permalink
 *
 * @param {string}                    path
 * @param {string|{}|URLSearchParams} [params]
 * @return {string} Returns api route (path).
 */
export const get_api_route = ( path, params ) => {
	if ( ! path ) {
		throw new Error( 'API route path is required' );
	}

	if ( ! isString( path ) ) {
		throw new Error( 'API route path must be a string.' );
	}

	const route = new URL( rest_url + namespace + path );

	if ( ! params ) {
		return route.toString();
	}

	if (
		! isURLSearchParams( params ) &&
		! isObject( params ) &&
		! isString( params )
	) {
		throw new Error(
			'API route params must be a valid url parameter string or an object or a valid URLSearchParams instance.'
		);
	}

	// Convert object or string into URLSearchParams.
	if ( ! isURLSearchParams( params ) ) {
		if ( isString( params ) ) {
			params = new URLSearchParams( params );
		} else if ( isObject( params ) ) {
			params = new URLSearchParams( removeEmpty( params ) );
		}
	}

	const query = new URLSearchParams( [
		...route.searchParams,
		...params,
	] ).toString();

	if ( ! query ) {
		return route.toString();
	}

	return route.toString().split( '?' )[ 0 ] + '?' + query.toString();
};

export const API = axios.create( {
	baseURL: rest_url,
	headers: {
		'content-type': 'application/json',
		'X-WP-Nonce': nonce,
	},
} );

let refreshingNonce = null;

async function refreshNonce() {
	if ( ! refreshingNonce ) {
		refreshingNonce = axios
			.get( ajaxurl + '?action=rest-nonce', { withCredentials: true } )
			.then( ( { data } ) => {
				API.defaults.headers[ 'X-WP-Nonce' ] = data;

				return data;
			} )
			.finally( () => {
				refreshingNonce = null;
			} );
	}

	return refreshingNonce;
}

API.interceptors.response.use(
	( response ) => response,
	async ( error ) => {
		const { response, config } = error;
		if (
			response &&
			response.status === 403 &&
			response.data?.code === 'rest_cookie_invalid_nonce' &&
			! config._retry
		) {
			config._retry = true;
			config.headers[ 'X-WP-Nonce' ] = await refreshNonce();
			return API( config );
		}
		return Promise.reject( error );
	}
);

/**
 * Country data for dropdown.
 *
 * @deprecated
 * @see utils/countries.js
 * @type {CommonDropdownOptions} // eslint-disable-line
 */
export const countryData = countries
	? Object.entries( countries ).reduce( ( acc, [ key, value ] ) => {
			acc.push( { label: value, value: key } );
			return acc;
	  }, [] )
	: [];

export const objectToArraySelectData = ( data ) => {
	return Object.entries( data ).reduce( ( acc, [ key, value ] ) => {
		acc.push( {
			label: value,
			value: key,
		} );
		return acc;
	}, [] );
};

/**
 *
 * @param {string|number} num
 * @param {number}        decimals
 * @param {string}        decimal_separator
 * @param {string}        thousands_separator
 * @return {string} Returns formatted number
 */
export const number_format = (
	num,
	decimals = 0,
	decimal_separator = '.',
	thousands_separator = ','
) => {
	num = Number( num );
	const formattedNumber = new Intl.NumberFormat( 'en-US', {
		//minimumFractionDigits: decimals, // This rounds the int part of decimal.
		maximumFractionDigits: decimals,
	} );
	return formattedNumber
		.format( num )
		.toString()
		.replaceAll( '.', decimal_separator )
		.replaceAll( '/', thousands_separator );
};

/**
 * Format decimal numbers ready for DB storage.
 *
 * Sanitize, optionally remove decimals, and optionally round + trim off zeros.
 *
 * This function does not remove thousands - this should be done before passing a value to the function.
 *
 * @param {number|string}  number    Expects either a float or a string with a decimal separator only (no thousands).
 * @param {boolean|number} dp        number.  Number of decimal points to use, blank to use storeengine/price_num_decimals, or false to avoid all rounding.
 * @param {boolean}        trimZeros From end of string.
 *
 * @return {string}
 */
export function formatDecimal( number, dp = false, trimZeros = false ) {
	number ??= '';

	const decimals = [
		getSeGlobal( 'currency_options.currency_decimal_separator', '.' ),
		getSeGlobal( 'localeConv.decimal_point' ),
		getSeGlobal( 'localeConv.mon_decimal_point' ),
	].filter( Boolean );

	// Normalize string input
	if ( typeof number !== 'number' ) {
		number = String( number );

		// Replace all known decimal separators with "."
		decimals.forEach( ( d ) => {
			number = number.split( d ).join( '.' );
		} );

		// Remove invalid chars + keep only last dot
		number = number
			.replace( /[^0-9.\-]/g, '' )
			.replace( /\.(?=.*\.)/g, '' );
	}

	if ( dp !== false ) {
		dp = parseInt(
			dp === ''
				? getSeGlobal( 'currency_options.currency_decimal_limit', 2 )
				: dp,
			10
		);

		number = Number.parseFloat( number || 0 ).toFixed( dp );
	} else if ( typeof number === 'number' ) {
		// Avoid scientific notation using sprintf
		number = sprintf(
			`%.${ getSeGlobal( 'currency_options.rounding_precision' ) }f`,
			number
		);

		// Normalize decimals again
		decimals.forEach( ( d ) => {
			number = number.split( d ).join( '.' );
		} );

		// Floats don't need trailing zeros
		trimZeros = true;
	}

	// Trim trailing zeros (PHP-style)
	if ( trimZeros && number.includes( '.' ) ) {
		number = maybeTrimZeros( number );
	}

	return number;
}

/**
 * Trim tailing zeros.
 *
 * @param {string | number} value
 * @param {string}          decSep
 * @return {string}
 */
export const maybeTrimZeros = ( value, decSep = '.' ) => {
	if ( value == null ) {
		return '';
	}

	const str = String( value );

	// Fast path: no decimal separator → nothing to trim
	if ( ! str.includes( decSep ) ) {
		return str;
	}

	// Escape separator for regex safety
	const escaped = decSep.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

	return str
		.replace( new RegExp( `${ escaped }0+$` ), '' )
		.replace( new RegExp( `${ escaped }$` ), '' );
};

const bigNums = [
	{ name: 'thousand', exp: 1e3, short: 'K' },
	{ name: 'million', exp: 1e6, short: 'M' },
	{ name: 'billion', exp: 1e9, short: 'B' },
	{ name: 'trillion', exp: 1e12, short: 'T' },
	{ name: 'quadrillion', exp: 1e15, short: 'QA' },
	{ name: 'quintillion', exp: 1e18, short: 'QI' },
	{ name: 'sextillion', exp: 1e21, short: 'SX' },
	{ name: 'septillion', exp: 1e24, short: 'SP' },
	{ name: 'octillion', exp: 1e27, short: 'OC' },
	{ name: 'nonillion', exp: 1e30, short: 'NO' },
	{ name: 'decillion', exp: 1e33, short: 'DC' },
	{ name: 'undecillion', exp: 1e36, short: 'UD' },
	{ name: 'duodecillion', exp: 1e39, short: 'DD' },
	{ name: 'tredecillion', exp: 1e42, short: 'TD' },
	{ name: 'quattuordecillion', exp: 1e45, short: 'QAD' },
	{ name: 'quindecillion', exp: 1e48, short: 'QID' },
	{ name: 'sexdecillion', exp: 1e51, short: 'SXD' },
	{ name: 'septendecillion', exp: 1e54, short: 'SPD' },
	{ name: 'octodecillion', exp: 1e57, short: 'OCD' },
	{ name: 'novemdecillion', exp: 1e60, short: 'NOD' },
	{ name: 'vigintillion', exp: 1e63, short: 'V' },
	{ name: 'centillion', exp: 1e303, short: 'C' },
];

/**
 * Convert number to short notation.
 *
 * @param {string|number} number
 * @param {number}        precision
 * @param {boolean}       trimZeros
 * @return {string}
 */
export const formatNumberShorthand = (
	number,
	precision = 2,
	trimZeros = false
) => {
	number = Number( number );
	// Intl.NumberFormat doesn't support number > 1,000,000
	// And treating number >= 850 as 0.85k
	// Iterate backwards to find the largest matching scale first
	for ( let i = bigNums.length - 1; i >= 0; i-- ) {
		if ( number >= bigNums[ i ].exp ) {
			// Note: For very large numbers (above 1e15),
			// manual division can lose precision.
			let scaled = number / bigNums[ i ].exp;
			if ( precision >= 0 ) {
				scaled = scaled.toFixed( precision );
			}
			if ( trimZeros ) {
				scaled = maybeTrimZeros( scaled );
			}
			return scaled + bigNums[ i ].short;
		}
	}

	if ( number >= 850 ) {
		let scaled = number / 1000;
		if ( precision >= 0 ) {
			scaled = scaled.toFixed( precision );
		}
		if ( trimZeros ) {
			scaled = maybeTrimZeros( scaled );
		}
		return scaled + 'K';
	}

	if ( precision >= 0 ) {
		number = number.toFixed( precision );
	}
	if ( trimZeros ) {
		number = maybeTrimZeros( number );
	}

	return number.toString();
};

/**
 * Format currency value.
 * @param {string|number} value
 * @return {string} Returns formatted number.
 *
 * @deprecated 1.7.1
 * @see number_format
 */
export const currencyFormatter = ( value ) => {
	const formattedNumber = new Intl.NumberFormat( 'en-US', {
		//minimumFractionDigits: currency_decimal_limit, // This rounds the int part of decimal.
		maximumFractionDigits: getSeGlobal(
			'currency_options.currency_decimal_limit'
		),
	} );

	return formattedNumber.format( Number( value ) );
};

export const get_currency_format = () => {
	// %1$s symbol
	// %2$s value
	// default is left no space
	// E.g. $1.99
	let format = '%1$s%2$s';

	switch ( getSeGlobal( 'currency_options.currency_position' ) ) {
		case 'left':
			format = '%1$s%2$s';
			break;
		case 'right':
			format = '%2$s%1$s';
			break;
		case 'left_space':
			format = '%1$s&nbsp;%2$s';
			break;
		case 'right_space':
			format = '%2$s&nbsp;%1$s';
			break;
	}

	return format;
};

export const format_currency = ( value, symbol ) =>
	sprintf(
		get_currency_format(),
		decodeEntities( symbol ),
		number_format(
			value,
			getSeGlobal( 'currency_options.currency_decimal_limit', 2 ),
			getSeGlobal( 'currency_options.currency_decimal_separator', '.' ),
			getSeGlobal( 'currency_options.currency_thousand_separator', ',' )
		)
	);

export const format_price = ( value, currency ) => {
	if ( ! currency ) {
		return format_currency(
			value,
			getSeGlobal( 'currency_options.currency_symbol', '$' )
		);
	}

	return format_currency( value, symbols[ currency ] );
};

/**
 *
 * @param {null|string} external
 * @return {{currency: string, currency_symbol: string}}
 */
const currencyArgs = ( external = null ) => {
	if ( ! external ) {
		return {
			currency: getSeGlobal( 'currency_options.currency', 'USD' ),
			currency_symbol: getSeGlobal(
				'currency_options.currency_symbol',
				'$'
			),
		};
	}

	if ( ! symbols[ external ] ) {
		console.warn( 'Invalid Currency' );
	}

	return {
		currency: external,
		currency_symbol: symbols[ external ] || external,
	};
};

export const renderCurrencyWithPrice = (
	value,
	symbol = true,
	withoutCurrency = false,
	externalCurrency = null
) => {
	const currency_args = currencyArgs( externalCurrency );

	if ( ! symbol && ! withoutCurrency ) {
		return format_currency( value, currency_args.currency );
	}

	if ( withoutCurrency ) {
		return number_format(
			value,
			getSeGlobal( 'currency_options.currency_decimal_limit', 2 ),
			getSeGlobal( 'currency_options.currency_decimal_separator', '.' ),
			getSeGlobal( 'currency_options.currency_thousand_separator', ',' )
		);
	}

	return format_currency( value, currency_args.currency_symbol );
};

export const formatCurrencyShorthand = (
	value,
	symbol = true,
	withoutCurrency = false,
	externalCurrency = null
) => {
	const currency_args = currencyArgs( externalCurrency );

	if ( ! symbol && ! withoutCurrency ) {
		return sprintf(
			get_currency_format(),
			currency_args.currency,
			formatNumberShorthand( value )
		);
	}

	return sprintf(
		get_currency_format(),
		currency_args.currency_symbol,
		formatNumberShorthand( value )
	);
};

/**
 * @deprecated
 * @param {string} type
 * @return {string|undefined} Returns payment method name.
 */
export const renderPaymentMethod = ( type ) => {
	const methods = {
		bank_transfer: __( 'Bank Transfer', 'storeengine' ),
		check_payment: __( 'Check Payment', 'storeengine' ),
		cash_on_delivery: __( 'Cash On Delivery', 'storeengine' ),
		paypal: __( 'Paypal', 'storeengine' ),
		stripe: __( 'Stripe', 'storeengine' ),
	};

	return methods[ type ];
};

export const modalFullWidthStyles = {
	overlay: {
		background: 'rgba(35, 40, 45, 0.62)',
		zIndex: 9999,
	},
	content: {
		top: '50%',
		left: '50%',
		right: 'auto',
		bottom: 'auto',
		width: '50%',
		marginRight: '-50%',
		padding: 0,
		transform: 'translate(-50%, -50%)',
	},
};

export const generateSlug = ( value ) => {
	return value
		.toLowerCase()
		.replace( /\s+/g, '-' )
		.replace( /[^a-z0-9-]/g, '' );
};

export const generateRandomSlug = ( length = 3 ) => {
	return (
		Math.random().toString( 20 ).substr( 2, length ) +
		new Date().getMilliseconds()
	);
};

/**
 * Convert datetime (input) to server timezone.
 *
 * @param {object | number | string} [date]
 * @param {string|false}             format
 * @return {moment.Moment|string} Returns moment object or formated datetime string.
 */
export const convertToServerTime = ( date, format = 'YYYY-MM-DD HH:mm:ss' ) => {
	let new_date;
	if ( timezone.includes( ':' ) ) {
		new_date = moment( date ).clone().utcOffset( timezone );
	} else if ( timezone.includes( '/' ) ) {
		new_date = moment( date ).clone().tz( timezone );
	} else {
		new_date = moment( date ).utc();
	}

	if ( ! format || ! isString( format ) ) {
		return new_date;
	}

	return new_date.format( format );
};

/**
 * Parse datetime string into moment object from specified format.
 * @param {string}                        date   datetime string to parse.
 * @param {string|'mysql'|'php'|'server'} format Format to parse from.
 * @return {moment.Moment} Returns moment object.
 */
export const momentFrom = ( date, format ) => {
	if ( ! format || [ 'php', 'mysql', 'server' ].includes( format ) ) {
		format = 'YYYY-MM-DD HH:mm:ss';
	}

	return moment( date, format );
};

/**
 * Copy content to clipboard.
 * @param {string} text
 * @return {Promise<boolean>}
 */
export const copyToClipboard = async ( text ) => {
	// Modern async API (most browsers)
	if ( navigator.clipboard && window.isSecureContext ) {
		try {
			await navigator.clipboard.writeText( text );
			return true;
		} catch ( e ) {
			logger.error( 'Failed to write clipboard', {
				context: 'copyToClipboard',
				data: { text, error: e },
			} );
			// fallback below
		}
	}

	// Fallback: textarea method (supports multiline)
	const textarea = document.createElement( 'textarea' );
	textarea.value = text;
	textarea.style.position = 'fixed'; // avoid scroll jump
	textarea.style.opacity = '0';
	textarea.style.left = '-9999px';
	document.body.appendChild( textarea );

	textarea.focus();
	textarea.select();

	try {
		document.execCommand( 'copy' );
		document.body.removeChild( textarea );
		return true;
	} catch ( e ) {
		logger.error( 'Failed to write clipboard', {
			context: 'copyToClipboard: Fallback',
			data: { text, error: e },
		} );
		document.body.removeChild( textarea );
		return false;
	}
};

export const prepare_term_data = ( terms, parentId = 0 ) => {
	if ( ! terms ) {
		return [];
	}
	const data = [];
	terms.forEach( ( term ) => {
		if ( parseInt( term?.parent ) === parseInt( parentId ) ) {
			const updatedTerm = {
				...term,
				children: prepare_term_data( terms, term.id ),
			};
			data.push( updatedTerm );
		}
	} );
	return data;
};

export const getTagSuggestions = ( data ) => {
	return (
		data &&
		data.reduce( function ( acc, item ) {
			acc.push( item.name );
			return acc;
		}, [] )
	);
};

export const prepareSavedTags = ( data, values ) => {
	if ( values && data ) {
		return data.reduce( function ( acc, item ) {
			if ( values.includes( item.id ) ) {
				acc.push( item.name );
				return acc;
			}
			return acc;
		}, [] );
	}
	return [];
};

export const IsJsonString = ( str ) => {
	try {
		JSON.parse( str );
	} catch ( e ) {
		return false;
	}
	return true;
};

export const getUserInitialValues = ( data ) => {
	if ( data ) {
		const {
			first_name,
			last_name,
			profile_photo,
			cover_photo,
			phone_number,
			designation,
			bio,
			website_url,
			github_url,
			facebook_url,
			twitter_url,
			linkedin_url,
		} = data?.storeengine_meta;
		return {
			first_name,
			last_name,
			storeengine_profile_photo: profile_photo,
			storeengine_cover_photo: cover_photo,
			storeengine_phone_number: phone_number,
			storeengine_profile_designation: designation,
			storeengine_profile_bio: bio,
			storeengine_website_url: website_url,
			storeengine_github_url: github_url,
			storeengine_facebook_url: facebook_url,
			storeengine_twitter_url: twitter_url,
			storeengine_linkedin_url: linkedin_url,
		};
	}
};

export const generateUserName = ( item ) => {
	if ( item?.first_name || item?.last_name ) {
		return item.first_name + ' ' + item.last_name;
	}
	return item?.user_nicename;
};

/**
 *
 * @param {'error'|'info'|'warning'|'success'} type
 * @return {string} Returns icon class based on notification type.
 */
const getIconClass = ( type ) => {
	switch ( type ) {
		case 'success':
			return 'notify-success';
		case 'warning':
			return 'notify-warning';
		case 'error':
			return 'notify-error';
		case 'info':
		default:
			return 'notify-information';
	}
};

/**
 * Shows Notification toast.
 *
 * @param {string|[{code:string,message:string}]|{code:string,message:string}} message Message to show.
 * @param {'error'|'info'|'warning'|'success'}                                 [type]  [Optional] Notification type. Default type is `info`
 * @param {number}                                                             closeIn wait before auto close (ms).
 *
 * @return Promise<void>
 */
export const notification = ( message, type = 'info', closeIn = 5000 ) => {
	return new Promise( ( resolve ) => {
		let timer = null;
		closeIn = Math.abs( closeIn || 5000 );
		let ttl = closeIn;

		if ( ! message ) {
			resolve();
			return;
		}

		type = [ 'success', 'warning', 'error', 'info' ].includes( type )
			? type
			: 'info';

		const closeHandler = ( e ) => {
			if ( e ) {
				e.preventDefault();
			}

			notificationDiv.remove();

			if ( timer ) {
				clearInterval( timer );
				timer = null;
			}

			resolve();
		};

		const checkInterval = () => {
			ttl -= 1000;

			if ( ttl <= 0 ) {
				closeHandler();
			}
		};

		const notificationDiv = document.createElement( 'div' );

		notificationDiv.className = `storeengine-notification storeengine-notification--dashboard storeengine-notification--${ type }`;
		notificationDiv.style.boxShadow =
			'3px 3px 8px -2px rgba(29, 35, 39,0.63)';
		notificationDiv.setAttribute( 'aria-live', 'polite' );
		notificationDiv.onmouseenter = () => clearInterval( timer );
		notificationDiv.onmouseleave = () =>
			( timer = setInterval( checkInterval, 1000 ) );

		const messageParagraph = document.createElement( 'div' );
		messageParagraph.className = 'storeengine-notification__message';

		if ( isArray( message ) && message[ 0 ].code && message[ 0 ].message ) {
			if ( message.length === 1 ) {
				message = message[ 0 ].message;
			} else {
				const errors = [ ...message ];
				message =
					'<ul class="storeengine-m-0" style="padding-left:1rem;">';
				for ( const err of errors ) {
					message += `<li><label class="error-msg" for="${ err.code }">${ err.message }</label></li>`;
				}

				message += '</ul>';
			}
		} else if ( message?.error?.message ) {
			message = message?.error.message;
		}

		let icon = getIconClass( type );
		icon = `<span class="storeengine-icon storeengine-icon--${ icon }" aria-hidden="true"></span>`;

		if (
			message.includes( '<' ) &&
			( message.includes( '</' ) || message.includes( '/>' ) )
		) {
			message = icon + message;
		} else {
			message = icon + '<p class="storeengine-m-0">' + message + '</p>';
		}

		messageParagraph.innerHTML = message;

		notificationDiv.appendChild( messageParagraph );

		const closeButton = document.createElement( 'button' );
		closeButton.className =
			'storeengine-btn storeengine-btn--bg-transparent storeengine-btn--close';
		closeButton.setAttribute( 'data-suffix', 'close-notification' );
		closeButton.setAttribute( 'aria-label', __( 'Close', 'storeengine' ) );
		closeButton.innerHTML = `<span class="storeengine-icon storeengine-icon--close" aria-hidden="true"></span>`;
		closeButton.onclick = closeHandler;

		notificationDiv.appendChild( closeButton );

		timer = setInterval( checkInterval, 1000 );

		document.body.appendChild( notificationDiv );

		try {
			const links = document.querySelectorAll(
				'.storeengine-notification__message a'
			);
			for ( const idx in links ) {
				if ( links[ idx ].href && '#' !== links[ idx ].href ) {
					links[ idx ].target = '_blank';
				}
			}
		} catch ( er ) {}
	} );
};

export const parseAjaxError = ( error ) => {
	let message = error;
	if ( error instanceof Error ) {
		message = error.message;
		// noinspection JSUnresolvedReference
		// If Axios error and server sends error details.
		if ( error.isAxiosError ) {
			if ( error?.response?.data?.message ) {
				message = error.response.data.message;
			} else if ( error?.response?.data?.data ) {
				message = error?.response?.data?.data;
			}
		}
	}

	return message;
};

/**
 * Display Error message with notification toast.
 *
 * @param {Error | AxiosError | string} error
 * @param {number}                      closeIn
 */
export const renderErrorNotification = ( error, closeIn = 5000 ) => {
	notification( parseAjaxError( error ), 'error', closeIn );
};

export const isValidHttpUrl = ( string ) => {
	let url;

	try {
		url = new URL( string );
	} catch ( _ ) {
		return false;
	}

	return url.protocol === 'http:' || url.protocol === 'https:';
};

export const parseRedirectResponse = ( response ) => {
	if ( isA( response, URL ) ) {
		return response.toString();
	}

	if ( typeof response === 'string' && isValidHttpUrl( response ) ) {
		return response;
	}

	if ( typeof response === 'object' ) {
		const { redirect, redirect_to } = response;

		if ( redirect && isValidHttpUrl( redirect ) ) {
			return redirect;
		}

		if ( redirect_to && isValidHttpUrl( redirect_to ) ) {
			return redirect_to;
		}
	}

	return false;
};

/**
 * Handle response contains url backend suggesting redirecting the user to.
 *
 * @param {string|Object|URL} response
 * @param {number}            sleep    Wait/sleep before redirect.
 * @return {Promise<void>}
 */
export const handleRedirectResponse = async ( response, sleep = 1000 ) => {
	if ( sleep ) {
		await wait( sleep );
	}

	const url = parseRedirectResponse( response );

	if ( url ) {
		window.location.href = url;
	}
};

/**
 * Handle response contains url backend suggesting redirecting the user to.
 * If url not present in response, than reload the page.
 *
 * @param {string|Object|URL} response
 * @param {number}            sleep
 * @return {Promise<void>}
 */
export const redirectOrReload = async ( response, sleep = 1000 ) => {
	if ( sleep ) {
		await wait( sleep );
	}

	const url = parseRedirectResponse( response );

	if ( url ) {
		window.location.href = url;
		return;
	}

	window.location.reload();
};

/**
 * Prepare request payload with FormData.
 *
 * @deprecated Use `toFormData` from axios which can transform nested object into proper
 *             FormData and submit without having to use `Content-Type: application/json` header.
 * @see axios.toFormData()
 *
 * @param {string}  action   Form action (wp-ajax action).
 * @param {Object}  payload  Form data object.
 * @param {string}  [suffix] Hook suffix for the action.
 * @param {boolean} [isRaw]  Send raw object (E.G. File object) or apply `JSON.stringify`.
 *                           Default is false, stringify nested object.
 * @return {FormData} Prepared form data.
 */
const preparePayload = (action, payload = {}, suffix = '', isRaw = false) => { // eslint-disable-line
	const form_data = new FormData();
	form_data.append( 'action', `storeengine${ suffix }/${ action }` );
	if ( ! payload.security ) {
		form_data.append( 'security', storeengine_nonce );
	}
	for ( const key in payload ) {
		const value = payload[ key ];
		if ( ! isRaw && typeof value === 'object' && value !== null ) {
			form_data.append( key, JSON.stringify( value ) );
		} else {
			form_data.append( key, value );
		}
	}

	return form_data;
};

/**
 * Make AxiosError object.
 *
 * @param {string}              message
 * @param {axios.AxiosResponse} response
 * @param {string}              code
 * @return {AxiosError} Returns axios Error object.
 */
const makeAxiosError = ( message, response, code = 'UNKNOWN' ) => {
	return new AxiosError(
		message,
		'ERR_' + ( code ? code : 'UNKNOWN' ),
		response.config,
		response.request,
		response
	);
};

/**
 * Process ajax error data and throw error.
 *
 * @template T Object with {code: string, message:string}
 *
 * @param {string|T|[T]}        data
 * @param {axios.AxiosResponse} response
 *
 * @throws {Error|AxiosError}
 */
export const processAjaxError = ( data, response ) => {
	if ( 'string' === typeof data ) {
		throw new Error( data );
	}

	if ( data && 'object' === typeof data && data?.message ) {
		const error = new Error( data.message );
		if ( data?.code ) {
			error.code = data.code;
		}

		throw error;
	}

	if (
		data &&
		isArray( data ) &&
		data.length &&
		data[ 0 ].code &&
		data[ 0 ].message
	) {
		if ( 1 === data.length ) {
			const error = new Error( data[ 0 ].message );
			error.code = data[ 0 ].code;

			throw error;
		} else {
			const errors = [ ...data ];
			const codes = [];
			let message =
				'<ul class="storeengine-m-0" style="padding-left:1rem;">';

			for ( const err of errors ) {
				codes.push( err.code );
				message += `<li id="error-${ err.code }">${ err.message }</li>`;
			}

			message += '</ul>';

			throw makeAxiosError( message, response, codes.join( '.' ) );
		}
	}

	throw new Error(
		__(
			'Something went wrong. Please try again after sometime.',
			'storeengine'
		)
	);
};

/**
 * Extract a human-readable message out of a `wp_send_json_error()` payload,
 * whose `data` may be a string, a `{ message }` object, or an array of
 * `{ code, message }` entries (e.g. a WP_Error). Returns '' when none is found.
 *
 * @param {*} data The `data` field of a wp_send_json_error() body.
 * @return {string} The message, or ''.
 */
export const getAjaxErrorMessage = ( data ) => {
	if ( 'string' === typeof data ) {
		return data;
	}

	if ( data && 'object' === typeof data && ! isArray( data ) && data.message ) {
		return data.message;
	}

	if ( isArray( data ) && data.length && data[ 0 ]?.message ) {
		return data
			.map( ( err ) => err?.message )
			.filter( Boolean )
			.join( ' ' );
	}

	return '';
};

/**
 * Send post request to WP ajax endpoint action.
 *
 * @deprecated use makeRequest2
 * @see makeRequest2
 *
 * @template {keyof ResponseMapping|string} Action
 *
 * @param {string} action        Ajax Action name.
 * @param {Object} payload       Payload data
 * @param {null}   [deprecated]  Optional. If true will not stringify nested object. Default false (stringify nested object).
 * @param {null}   [deprecated2] Optional. Suffix for plugin slug.
 * @return {Promise<axios.AxiosResponse<Action extends keyof ResponseMapping ? ResponseMapping[Action] : object|string>>} Returns axios response object.
 */
export const makeRequest = async (
	action,
	payload = {},
	deprecated = null,
	deprecated2 = null
) => {
	if ( isBoolean( deprecated ) ) {
		// eslint-disable-next-line
		console.warn(
			`Function \`makeRequest\` was called with \`isRaw\` argument which is deprecated.`
		);
	}

	payload.action = `storeengine/${ action }`;
	if ( isString( deprecated2 ) ) {
		// eslint-disable-next-line
		console.warn(
			`Function \`makeRequest\` was called with \`suffix\` argument which is deprecated.`
		);
		payload.action = `storeengine${ deprecated2 }/${ action }`;
	}

	if ( ! payload.security ) {
		payload.security = storeengine_nonce;
	}

	let response;
	try {
		response = await axios.post( ajaxurl, toFormData( payload ) );
	} catch ( error ) {
		// A wp_send_json_error() sent with an HTTP error status (e.g. a
		// permission denial → 4xx) rejects here with the real reason nested under
		// `data`. Lift it to `response.data.message` so callers reading that path
		// show the clear message instead of the generic "Request failed with
		// status code N".
		const body = error?.response?.data;
		if ( body && false === body.success && ! body.message ) {
			const message = getAjaxErrorMessage( body.data );
			if ( message ) {
				error.response.data = { ...body, message };
			}
		}
		throw error;
	}

	if ( ! response.data.success ) {
		processAjaxError( response.data.data, response );
	}

	return response;
};

/**
 * Send post request to WP ajax endpoint action.
 *
 * Send post request and throw if success false, enhancing error handling.
 *
 * @template {keyof AjaxResponseMapping|keyof AjaxRequestMapping|string|false|null|undefined} Action
 *
 * @param {Action}                                                                        action        Ajax Action name. Action will be get suffixed by the plugin slug.
 *                                                                                                      To use custom action set it empty or false, and set action inside payload.
 * @param {Action extends keyof AjaxRequestMapping ? AjaxRequestMapping[Action] : Object} payload       Payload data
 * @param {null}                                                                          [deprecated]  Optional. If true will not stringify nested object. Default false (stringify nested object).
 * @param {null}                                                                          [deprecated2] Optional. Suffix for plugin slug.
 * @return {Promise<Action extends keyof AjaxResponseMapping ? AjaxResponseMapping[Action] : object|string>} Returns response data.
 * @throws {Error|AxiosError}
 */
/**
 * Phase-2 / Phase-4 unified REST helper for the core /checkout/* surface.
 *
 *   await makeRestRequest('/place', { fields, payment_method })
 *   await makeRestRequest('/state', null, 'GET')
 *
 * Returns the parsed JSON body directly (REST does not wrap in success/data).
 * Throws on non-2xx with the server's `message` and full body on `err.data`.
 * @param path
 * @param body
 * @param method
 * @param extraHeaders
 */
export const makeRestRequest = async (
	path,
	body = null,
	method = 'POST',
	extraHeaders = {}
) => {
	// Paths starting with `/` are interpreted as relative to /checkout (the
	// original Phase-2 helper signature). Anything else is treated as a
	// full namespace + route under /wp-json/ — e.g. `storeengine/v1/payment-methods/123`.
	const SE =
		( typeof window !== 'undefined' && window.StoreEngineGlobal ) || {};
	const restUrl = ( SE.rest_url || '/wp-json/' ).replace( /\/+$/, '/' );
	const url = path.startsWith( '/' )
		? restUrl + 'storeengine/v1/checkout' + path
		: restUrl + path.replace( /^\/+/, '' );
	const init = {
		method,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': SE.nonce || '',
			...extraHeaders,
		},
	};
	if ( body && method !== 'GET' ) {
		init.body = JSON.stringify( body );
	}
	const res = await fetch( url, init );
	let data = null;
	try {
		const text = await res.text();
		data = text ? JSON.parse( text ) : null;
	} catch ( e ) {
		/* ignore */
	}
	if ( ! res.ok ) {
		const err = new Error(
			( data && ( data.message || data.code ) ) ||
				`Request failed (${ res.status })`
		);
		err.status = res.status;
		err.data = data;
		throw err;
	}
	return data;
};

export const makeRequest2 = async (
	action,
	payload = {},
	deprecated = null,
	deprecated2 = null
) => {
	if ( isBoolean( deprecated ) ) {
		// eslint-disable-next-line
		console.warn(
			`Function \`makeRequest2\` was called with \`isRaw\` argument which is deprecated.`
		);
	}

	if ( action ) {
		payload.action = `storeengine/${ action }`;
		if ( isString( deprecated2 ) ) {
			// eslint-disable-next-line
			console.warn(
				`Function \`makeRequest2\` was called with \`suffix\` argument which is deprecated.`
			);
			payload.action = `storeengine${ deprecated2 }/${ action }`;
		}
	}

	if ( ! payload.security ) {
		payload.security = storeengine_nonce;
	}

	if ( ! payload.action ) {
		throw new Error( 'Action is not defined for the request' );
	}

	let response;
	try {
		response = await axios.post( ajaxurl, toFormData( payload ) );
	} catch ( error ) {
		// See makeRequest(): surface a wp_send_json_error() message that arrived
		// with an HTTP error status so callers show the real reason.
		const body = error?.response?.data;
		if ( body && false === body.success && ! body.message ) {
			const message = getAjaxErrorMessage( body.data );
			if ( message ) {
				error.response.data = { ...body, message };
			}
		}
		throw error;
	}

	const {
		data: { success, data },
	} = response;

	if ( ! success ) {
		processAjaxError( data, response );
	}

	return data;
};

export const safeMax = ( ...n ) => {
	const num = [];
	for ( const x of n ) {
		if ( ! isNaN( x ) || isFinite( x ) ) {
			num.push( x );
		}
	}

	return Math.max( ...num );
};

/**
 * @deprecated use useLocationQuery from `@Hooks` E.g. `import { useLocationQuery } from '@Hooks';`
 * @see useLocationQuery
 * @return {module:url.URLSearchParams} returns URLSearchParams.
 */
export const useQuery = () => {
	return new URLSearchParams( useLocation().search );
};

export const debounce = ( callback, wait ) => {
	let timeout;
	return ( ...args ) => {
		clearTimeout( timeout );
		timeout = setTimeout( function () {
			callback.apply( this, args );
		}, wait );
	};
};

/**
 * @param {string} message
 * @param {string} type
 * @param {string} position
 * @deprecated use ssr.notification()
 */
export const fireNotify = (message, type = '', position = 'top-right') => { // eslint-disable-line
	notification( type, message );
	// eslint-disable-next-line
	console.warn(
		'`fireNotify` is deprecated, use `ssr.notification` instead.'
	);
};

export const runUploader = ( config = {}, isMulti = false ) => {
	return new Promise( ( resolve ) => {
		let frame; // eslint-disable-line
		// If the media frame already exists, reopen it.
		if ( frame ) {
			frame.open();
			return;
		}

		config = {
			attachment_id: 0,
			title: __( 'Select or Upload Media', 'storeengine' ),
			button_text: __( 'Use this media', 'storeengine' ),
			...config,
		};

		const { title, button_text, attachment_id } = config;

		delete config.title;
		delete config.button_text;
		delete config.attachment_id;

		// @see wp-admin/js/site-icon.js for cropping support.

		// Create a new media frame
		frame = wp.media( {
			title,
			button: { text: button_text },
			multiple: isMulti, // Set to true to allow multiple files to be selected
			...config,
		} );

		if ( attachment_id ) {
			frame.on( 'open', function () {
				const selection = frame.state().get( 'selection' );
				const attachment = wp.media.attachment( attachment_id );
				attachment.fetch();
				selection.add( attachment ? [ attachment ] : [] ); // Pre-select the attachment
			} );
		}

		// When an image is selected in the media frame...
		frame.on( 'select', function () {
			const selection = frame.state().get( 'selection' );
			const selected = isMulti
				? selection.toArray().map( ( item ) => item.toJSON() )
				: selection.first().toJSON();
			resolve( selected );
		} );

		// Finally, open the modal on click
		frame.open();
	} );
};

export const sliceString = ( text, length = 20, more = '...' ) => {
	if ( ! text || text.length < length ) {
		return text;
	}
	return text.slice( 0, length ).replace( /(^[\s]+|[\s]+$)/g, '' ) + more;
};

const statusLabel = {
	publish: __( 'Published', 'storeengine' ),
	submitted: __( 'Submitted', 'storeengine' ),
	pending: __( 'Pending', 'storeengine' ),
	draft: __( 'Draft', 'storeengine' ),
	trash: __( 'Trash', 'storeengine' ),
	completed: __( 'Completed', 'storeengine' ),
	approved: __( 'Approve', 'storeengine' ),
	processing: __( 'Processing', 'storeengine' ),
	cancel: __( 'Cancel', 'storeengine' ),
	private: __( 'Private', 'storeengine' ),
	pass: __( 'Pass', 'storeengine' ),
	passed: __( 'Passed', 'storeengine' ),
	success: __( 'Success', 'storeengine' ),
	answered: __( 'Answered', 'storeengine' ),
	active: __( 'Active', 'storeengine' ),
	expired: __( 'Expired', 'storeengine' ),
	running: __( 'Running', 'storeengine' ),
	rejected: __( 'Rejected', 'storeengine' ),
	failed: __( 'Failed', 'storeengine' ),
	paid: __( 'Paid', 'storeengine' ),
	payment_confirmed: __( 'Payment Confirmed', 'storeengine' ),
	pending_payment: __( 'Pending Payment', 'storeengine' ),
	cancelled: __( 'Cancelled', 'storeengine' ),
};

export const getTranslatedStatus = ( status ) => statusLabel[ status ];

export const getAddonActiveStatus = ( allAddons, addonName, isPro = false ) => {
	// if pro is inactive
	if ( isPro && ! is_pro ) {
		return false;
	}

	return (
		hasOwnProperty.call( allAddons, addonName ) && allAddons[ addonName ]
	);
};

export const capitalizeFirstLetter = ( string = '' ) => {
	const cleanedString = string.replace( /_/g, ' ' );

	return cleanedString.charAt( 0 ).toUpperCase() + cleanedString.slice( 1 );
};

export function ucfirst( str ) {
	return ! str ? '' : str.charAt( 0 ).toUpperCase() + str.slice( 1 );
}

export function ucwords( str ) {
	return ! str ? '' : str.split( ' ' ).map( ucfirst ).join( ' ' );
}

export function uppercaseWordMatches( str, words ) {
	// Escape regex special chars and join with word boundaries
	const pattern = new RegExp(
		`\\b(${ words
			.map( ( w ) => w.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) )
			.join( '|' ) })\\b`,
		'gi'
	);

	return str.replace( pattern, ( match ) => match.toUpperCase() );
}

/**
 * Check if an IP address is in a private/local range.
 * Works for IPv4 only.
 *
 * @param {string} ip - The IPv4 address (e.g., "192.168.1.1").
 * @return {boolean} - True if private, false if public.
 */
export function isPrivateIP( ip ) {
	const parts = ip.split( '.' ).map( Number );
	if ( parts.length !== 4 || parts.some( isNaN ) ) {
		return false;
	}

	const [ a, b ] = parts;

	return (
		a === 10 || // 10.0.0.0 – 10.255.255.255
		( a === 172 && b >= 16 && b <= 31 ) || // 172.16.0.0 – 172.31.255.255
		( a === 192 && b === 168 ) || // 192.168.0.0 – 192.168.255.255
		a === 127 || // 127.0.0.0 – 127.255.255.255 (loopback)
		( a === 169 && b === 254 ) // 169.254.0.0 – 169.254.255.255 (link-local)
	);
}

const numberToRomanLookup = {
	M: 1000,
	CM: 900,
	D: 500,
	CD: 400,
	C: 100,
	XC: 90,
	L: 50,
	XL: 40,
	X: 10,
	IX: 9,
	V: 5,
	IV: 4,
	I: 1,
};

export const numberToRoman = ( num ) => {
	let roman = '';
	for ( const i in numberToRomanLookup ) {
		const q = Math.floor( num / numberToRomanLookup[ i ] );
		num -= q * numberToRomanLookup[ i ];
		roman += i.repeat( q );
	}
	return roman;
};

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 *
 * @see https://stackoverflow.com/a/1527820/3423996
 *
 * @param {number} min
 * @param {number} max
 * @return {number} random inteser between min & max.
 */
export function getRandomInt( min, max ) {
	min = Math.ceil( min );
	max = Math.floor( max );
	return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
}

/**
 * Generates a random password drawn from the defined set of characters.
 *
 * @param {number}  length              Optional. The length of password to generate. Default 12.
 * @param {boolean} special_chars       Optional. Whether to include standard special characters.
 *                                      Default true.
 * @param {boolean} extra_special_chars Optional. Whether to include other special characters.
 *                                      Used when generating secret keys and salts. Default false.
 * @return {string} The random password.
 */
export function generate_password(
	length = 12,
	special_chars = true,
	extra_special_chars = false
) {
	let password = '';
	let chars =
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

	if ( special_chars ) {
		chars += '!@#$%^&*()';
	}

	if ( extra_special_chars ) {
		chars += '-_[]{}<>~`+=,.;:/?|';
	}

	while ( password.length < length ) {
		const rand = getRandomInt( 0, chars.length - 1 );
		password += chars.substring( rand + 1, rand );
	}

	return password;
}

/**
 * Wait/Sleep util.
 *
 * @param {number} sleep wait/sleep time in ms.
 * @return {Promise<void>}
 */
export const wait = ( sleep ) =>
	new Promise( ( resolve ) => setTimeout( resolve, sleep ) );

export const userConfirm = ( message ) => {
	// eslint-disable-next-line no-alert
	return window.confirm( message );
};

export const userAlert = ( message ) => {
	// eslint-disable-next-line no-alert
	window.alert( message );
};
export const userPrompt = ( message, _default = null ) => {
	// eslint-disable-next-line no-alert
	return window.prompt( message );
};

/**
 *
 * @param {string|HTMLElement|Node|window|object|undefined|null} selector
 * @param {HTMLElement}                                          context
 * @return {HTMLElement[]|[]} Normalized element array.
 */
const normalizeElements = ( selector, context ) => {
	if ( isUndefined( selector ) || null === selector ) {
		return [];
	}

	if ( isString( selector ) ) {
		// HTML string → build detached DOM nodes (jQuery-style `$('<div/>')`).
		const trimmed = selector.trim();
		if (
			trimmed.length >= 3 &&
			trimmed[ 0 ] === '<' &&
			trimmed[ trimmed.length - 1 ] === '>'
		) {
			const template = document.createElement( 'template' );
			template.innerHTML = trimmed;
			return Array.from( template.content.childNodes ).filter(
				( node ) => node.nodeType === 1
			);
		}
		return Array.from( ( context || document ).querySelectorAll( selector ) );
	}

	// eslint-disable-next-line
	if (selector instanceof Node || selector.nodeType) {
		return [ selector ];
	}

	// eslint-disable-next-line
	if (selector instanceof NodeList || Array.isArray(selector)) {
		return Array.from( selector );
	}

	if ( selector === selector.window ) {
		return [ selector ];
	}

	return [];
};

const acceptData = function (node) { // eslint-disable-line
	if ( ! node ) {
		return false;
	}

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return node.nodeType === 1 || node.nodeType === 9 || ! +node.nodeType;
};

// Matches dashed string for camelizing
const rmsPrefix = /^-ms-/;
const rdashAlpha = /-([a-z])/g;
const rnothtmlwhite = /[^\x20\t\r\n\f]+/g;

// Used by camelCase as callback to replace()
function fcamelCase( _all, letter ) {
	return letter.toUpperCase();
}

// Convert dashed to camelCase; used by the css and data modules
// Support: IE <=9 - 11, Edge 12 - 15
// Microsoft forgot to hump their vendor prefix (trac-9572)
export function camelCase( string ) {
	return string.replace( rmsPrefix, 'ms-' ).replace( rdashAlpha, fcamelCase );
}

function toKebabCase( str ) {
	return str.replace( /([A-Z])/g, '-$1' ).toLowerCase();
}

export const getFormData = ( form ) =>
	Object.fromEntries( new FormData( form.get( 0 ) ) );

const siblings = function ( n, elem ) {
	const matched = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType === 1 && n !== elem ) {
			matched.push( n );
		}
	}

	return matched;
};

const propFix = {
	for: 'htmlFor',
	class: 'className',
};

[
	'tabIndex',
	'readOnly',
	'maxLength',
	'cellSpacing',
	'cellPadding',
	'rowSpan',
	'colSpan',
	'useMap',
	'frameBorder',
	'contentEditable',
].forEach( function ( attr ) {
	propFix[ attr.toLowerCase() ] = attr;
} );

const _eventRegistry = new WeakMap();

/**
 * A lightweight utility inspired by jQuery for DOM manipulation, event handling,
 * and traversal using modern JavaScript. Designed for internal StoreEngine use.
 *
 * ### Example usage:
 *
 * ```js
 * // Select elements and add a class
 * StoreEngineDQ('.btn').addClass('active');
 *
 * // Set input value
 * StoreEngineDQ('input.name').val('John');
 *
 * // Event delegation: handle 'change' or 'keyup' on .input-field
 * StoreEngineDQ(document).on('change keyup', '.input-field', function(e) {
 *   console.log('Input value:', this.value);
 * });
 *
 * // Chain multiple DOM operations
 * StoreEngineDQ('.box')
 *   .css('color', 'red')
 *   .addClass('highlight')
 *   .html('<strong>Updated</strong>');
 *
 * // Data attribute manipulation
 * StoreEngineDQ('#user').data('role', 'admin');
 * console.log(StoreEngineDQ('#user').data('role')); // "admin"
 *
 * // DOM traversal
 * StoreEngineDQ('.item').closest('.container').addClass('active');
 *
 * // Iterate over matched elements
 * StoreEngineDQ('.my-input').each(function(index, el) {
 *   console.log('Index:', index);
 *   console.log('Element value:', el.value);
 *   console.log('This value:', this.value);
 * });
 * ```
 *
 * @param {string|Window|Document|HTMLElement|NodeList|Array<HTMLElement>} selector           - A CSS selector string, single HTMLElement, NodeList, or array of elements.
 * @param {Document|HTMLElement}                                           [context=document] - Context to query from; defaults to `document`.
 *
 * @return {StoreEngineDQ} Returns StoreEngineDQ object similar to jQuery.
 */
export const StoreEngineDQ = ( selector, context = document ) => {
	const elements = normalizeElements( selector, context );

	return {
		elements,

		get length() {
			return this.elements.length;
		},

		exists() {
			return this.length > 0;
		},

		show() {
			this.elements.forEach( ( el ) => {
				el.style.display = '';
			} );
			return this;
		},

		hide() {
			this.elements.forEach( ( el ) => {
				el.style.display = 'none';
			} );
			return this;
		},

		/**
		 * Generic animation engine similar to jQuery.animate.
		 *
		 * @param {Object}   properties - CSS properties to animate (e.g. {opacity: 1, height: 100}).
		 * @param {number}   duration   - Animation duration in ms.
		 * @param {Function} callback   - Completion callback.
		 * @return {this} returns current instance.
		 */
		animate( properties, duration = 400, callback ) {
			this.elements.forEach( ( el ) => {
				const startValues = {};
				const endValues = {};

				for ( const prop in properties ) {
					const camelProp = camelCase( prop );
					const targetValue = properties[ prop ];
					let startValue;

					if ( prop === 'opacity' ) {
						startValue =
							parseFloat(
								window.getComputedStyle( el ).opacity
							) || 0;
					} else {
						startValue =
							parseFloat(
								window.getComputedStyle( el )[ camelProp ]
							) || 0;
					}

					startValues[ prop ] = startValue;
					endValues[ prop ] =
						typeof targetValue === 'number'
							? targetValue
							: parseFloat( targetValue );
				}

				let start = null;
				const step = ( timestamp ) => {
					if ( ! start ) {
						start = timestamp;
					}
					const progress = Math.min(
						( timestamp - start ) / duration,
						1
					);

					for ( const prop in properties ) {
						const camelProp = camelCase( prop );
						const value =
							startValues[ prop ] +
							( endValues[ prop ] - startValues[ prop ] ) *
								progress;
						if ( prop === 'opacity' ) {
							el.style.opacity = value;
						} else {
							el.style[ camelProp ] = value + 'px';
						}
					}

					if ( progress < 1 ) {
						window.requestAnimationFrame( step );
					} else if ( typeof callback === 'function' ) {
						callback.call( el );
					}
				};
				window.requestAnimationFrame( step );
			} );
			return this;
		},

		fadeIn( duration = 400, callback ) {
			this.elements.forEach( ( el ) => {
				el.style.opacity = 0;
				el.style.display = '';
				if ( window.getComputedStyle( el ).display === 'none' ) {
					el.style.display = 'block';
				}
			} );
			return this.animate( { opacity: 1 }, duration, callback );
		},

		fadeOut( duration = 400, callback ) {
			return this.animate( { opacity: 0 }, duration, function () {
				this.style.display = 'none';
				if ( typeof callback === 'function' ) {
					callback.call( this );
				}
			} );
		},

		slideDown( duration = 400, callback ) {
			this.elements.forEach( ( el ) => {
				el.style.display = 'block';
				const targetHeight = el.scrollHeight;
				el.style.height = '0px';
				el.style.overflow = 'hidden';

				StoreEngineDQ( el ).animate(
					{ height: targetHeight },
					duration,
					function () {
						this.style.height = '';
						this.style.overflow = '';
						if ( typeof callback === 'function' ) {
							callback.call( this );
						}
					}
				);
			} );
			return this;
		},

		slideUp( duration = 400, callback ) {
			this.elements.forEach( ( el ) => {
				const startHeight = el.offsetHeight;
				el.style.overflow = 'hidden';

				StoreEngineDQ( el ).animate(
					{ height: 0 },
					duration,
					function () {
						this.style.display = 'none';
						this.style.height = '';
						this.style.overflow = '';
						if ( typeof callback === 'function' ) {
							callback.call( this );
						}
					}
				);
			} );
			return this;
		},

		/**
		 * Attach event.
		 *
		 * @param {string}                                        events           - Event name(s), e.g., 'click' or 'input change'.
		 * @param {(string|function(Event): void)}                targetOrListener - A CSS selector for delegation or a direct event listener.
		 * @param {AddEventListenerOptions|function(Event): void} [listener]       - Event listener function (only needed if the second argument is a selector).
		 * @param {AddEventListenerOptions}                       [options]        - Event listener function (only needed if the second argument is a selector).
		 * @return {this} returns current instance.
		 */
		on( events, targetOrListener, listener, options ) {
			const eventList = events.split( /\s+/ );

			this.elements.forEach( ( el ) => {
				eventList.forEach( ( event ) => {
					let handler;

					if ( typeof targetOrListener === 'string' ) {
						handler = function ( e ) {
							const delegateTarget =
								e.target.closest( targetOrListener );
							if (
								delegateTarget &&
								el.contains( delegateTarget )
							) {
								listener.call( delegateTarget, e );
							}
						};
					} else {
						handler = targetOrListener;
						if (
							( listener && isObject( listener ) ) ||
							isBoolean( listener )
						) {
							options = listener;
						}
					}

					el.addEventListener( event, handler, options );

					// Store in registry
					const elEvents = _eventRegistry.get( el ) || {};
					elEvents[ event ] ??= [];
					elEvents[ event ].push( {
						original: listener || targetOrListener,
						elSelector:
							typeof targetOrListener === 'string'
								? targetOrListener
								: null,
						handler,
						options,
					} );
					_eventRegistry.set( el, elEvents );
				} );
			} );

			return this;
		},

		one( events, targetOrListener, listener ) {
			return this.on( events, targetOrListener, listener, {
				once: true,
			} );
		},

		/**
		 * Detach event listener(s).
		 *
		 * @param {string}                         [events]           - Event name(s), e.g., 'click' or 'input change'.
		 * @param {(string|function(Event): void)} [delegateSelector] - A CSS selector for delegation or the listener function.
		 * @param {function(Event): void}          [listener]         - The event listener function (required if second argument is a selector).
		 * @return {this} returns current instance.
		 */
		off( events, delegateSelector, listener ) {
			const allArgsMissing = arguments.length === 0;

			this.elements.forEach( ( el ) => {
				const /** @member {Object} */ elEvents =
						_eventRegistry.get( el );

				if ( ! elEvents ) {
					return;
				}

				const eventList = allArgsMissing
					? Object.keys( elEvents )
					: events.split( /\s+/ );

				eventList.forEach( ( event ) => {
					const handlers = elEvents[ event ];
					if ( ! handlers ) {
						return;
					}

					// Remove matching handlers
					elEvents[ event ] = handlers.filter(
						( { handler, original, elSelector, options } ) => {
							const matches =
								allArgsMissing ||
								arguments.length === 1 || // just events → remove all for this event
								( typeof delegateSelector === 'function' &&
									original === delegateSelector ) ||
								( typeof delegateSelector === 'string' &&
									listener &&
									elSelector === delegateSelector &&
									original === listener );

							if ( matches ) {
								el.removeEventListener(
									event,
									handler,
									options
								);
							}
							return ! matches;
						}
					);

					// Clean up
					if ( elEvents[ event ].length === 0 ) {
						delete elEvents[ event ];
					}
				} );

				if ( Object.keys( elEvents ).length === 0 ) {
					_eventRegistry.delete( el );
				}
			} );

			return this;
		},

		trigger( events, args ) {
			const eventList = events.split( /\s+/ );
			const { bubbles = true, cancelable = true, ...detail } = args || {};
			const nativeEvents = [
				'click',
				'focus',
				'blur',
				'submit',
				'select',
			];
			const hasData = Object.keys( detail ).length > 0;
			const self = this;

			self.forEach( ( elem ) => {
				self.forEach( eventList, ( event ) => {
					let _event;

					if ( hasData ) {
						_event = new CustomEvent( event, {
							bubbles,
							cancelable,
							detail,
						} );
					} else {
						_event = new Event( event, { bubbles, cancelable } ); // Use standard Event for better compatibility with native listeners
					}

					// Dispatch the event.
					elem.dispatchEvent( _event );

					// Trigger native method if it exists and wasn't prevented
					// Note: Some native methods (like click) may fire another event.
					if (
						! _event.defaultPrevented &&
						typeof elem[ event ] === 'function' &&
						nativeEvents.includes( event )
					) {
						elem[ event ]();
					}
				} );
			} );

			return this;
		},

		css( property, value ) {
			const setStyle = ( el, prop, val ) => {
				if ( ! el || ! el.style ) {
					return;
				}

				if ( prop.startsWith( '--' ) ) {
					el.style.setProperty( prop, val );
					return;
				}

				const camelProp = camelCase( prop );
				el.style[ camelProp ] = val === null || val === '' ? '' : val;
			};

			// If first argument is an object → set multiple properties
			if ( isObject( property ) ) {
				this.elements.forEach( ( element ) => {
					for ( const key in property ) {
						if ( hasOwnProperty.call( property, key ) ) {
							setStyle( element, key, property[ key ] );
						}
					}
				} );

				return this;
			}

			// GETTER (css('color'))
			if ( isUndefined( value ) ) {
				if ( isUndefined( property ) ) {
					return undefined;
				}

				const element = this.elements?.[ 0 ];

				if ( ! element ) {
					return undefined;
				}

				if ( property.startsWith( '--' ) ) {
					const inline = element.style.getPropertyValue( property );
					if ( ! inline ) {
						return window
							.getComputedStyle( element )
							.getPropertyValue( property );
					}

					return inline;
				}

				const camelProp = camelCase( property );
				const inline = element.style[ camelProp ];

				// If inline style isn't set, return computed style
				if ( ! inline ) {
					const kebabProp = toKebabCase( property );
					return window.getComputedStyle( element )[ kebabProp ];
				}

				return inline;
			}

			// SETTER (css('color', 'red'))
			this.elements.forEach( ( element ) => {
				setStyle( element, property, value );
			} );

			return this;
		},

		addClass( className ) {
			className = Array.isArray( className )
				? className
				: className.split( /\s+/ );
			this.elements.forEach( ( el ) =>
				el.classList?.add( ...className )
			);
			return this;
		},

		removeClass( className ) {
			className = Array.isArray( className )
				? className
				: className.split( /\s+/ );
			this.elements.forEach( ( el ) =>
				el.classList?.remove( ...className )
			);
			return this;
		},

		/**
		 * Toggle class
		 * @param {string}  className
		 * @param {boolean} [force]
		 * @return {this} return current instance.
		 */
		toggleClass( className, force ) {
			this.elements.forEach( ( el ) =>
				el.classList?.toggle( className, force )
			);
			return this;
		},

		hasClass( className ) {
			let elem,
				i = 0;
			while ( ( elem = this.elements[ i++ ] ) ) {
				if (
					elem.nodeType === 1 &&
					elem.classList.contains( className )
				) {
					return true;
				}
			}

			return false;
		},

		/**
		 * Check whether at least one matched element matches the given
		 * selector, element, collection or predicate — jQuery-compatible `.is()`.
		 *
		 * A small set of form-state pseudo-classes (`:checked`, `:disabled`,
		 * `:selected`, `:focus`) are handled explicitly because they map to live
		 * DOM properties rather than CSS matching.
		 *
		 * @param {string|Element|StoreEngineDQ|Function} selector
		 * @return {boolean} true when any element matches.
		 */
		is( selector ) {
			if ( ! this.length || selector === undefined || selector === null ) {
				return false;
			}

			// Function predicate — called with (index, element) like jQuery.
			if ( isFunction( selector ) ) {
				return this.elements.some( ( el, index ) =>
					selector.call( el, index, el )
				);
			}

			// A raw element or a StoreEngineDQ collection → identity check.
			if ( selector.nodeType ) {
				return this.elements.includes( selector );
			}
			if ( selector.elements ) {
				return this.elements.some( ( el ) =>
					selector.elements.includes( el )
				);
			}

			if ( ! isString( selector ) ) {
				return false;
			}

			const pseudo = {
				':checked': ( el ) => !! el.checked,
				':disabled': ( el ) => !! el.disabled,
				':selected': ( el ) => !! el.selected,
				':focus': ( el ) => el === el.ownerDocument.activeElement,
			};

			if ( pseudo[ selector ] ) {
				return this.elements.some( ( el ) => pseudo[ selector ]( el ) );
			}

			return this.elements.some(
				( el ) => el.nodeType === 1 && el.matches( selector )
			);
		},

		append( content ) {
			if ( ! content ) {
				return this;
			}

			let nodesToAppend = [];

			// Case 1: HTML string → convert to DOM nodes
			if ( typeof content === 'string' ) {
				const template = document.createElement( 'template' );
				template.innerHTML = content.trim();
				nodesToAppend = Array.from( template.content.childNodes );
			}
			// Case 2: Single HTMLElement
			else if ( content instanceof HTMLElement ) {
				nodesToAppend = [ content ];
			}
			// Case 3: NodeList or Array of HTMLElements
			else if (
				content instanceof NodeList ||
				Array.isArray( content )
			) {
				nodesToAppend = Array.from( content );
			}
			// Case 4: StoreEngineDQ collection. It's a factory (arrow function)
			// returning a plain object, so `instanceof StoreEngineDQ` throws
			// ("non-object prototype 'undefined'") — duck-type on `.elements`
			// instead, matching how `is()` detects a collection.
			else if ( content && Array.isArray( content.elements ) ) {
				nodesToAppend = content.elements;
			}

			// Append to each matched element
			this.elements.forEach( ( target, index ) => {
				nodesToAppend.forEach( ( node ) => {
					// Clone if appending to more than one parent
					const toInsert =
						index === 0 ? node : node.cloneNode( true );

					target.appendChild( toInsert );
				} );
			} );

			return this;
		},

		html( content ) {
			if ( content !== undefined ) {
				this.elements.forEach( ( el ) => ( el.innerHTML = content ) );

				return this;
			}

			return this.elements[ 0 ]?.innerHTML;
		},

		remove(selector) { // eslint-disable-line
			if ( selector === undefined ) {
				return this.each( ( _, el ) => el.remove() );
			}

			return this.find( selector ).each( ( _, el ) => el.remove() );
		},

		text( content ) {
			if ( content !== undefined ) {
				this.elements.forEach( ( el ) => ( el.innerText = content ) );

				return this;
			}

			return this.elements[ 0 ]?.innerText ?? '';
		},

		val( value ) {
			if ( value !== undefined ) {
				this.elements.forEach( ( el ) => {
					if ( 'value' in el ) {
						el.value = value;
					}
				} );

				return this;
			}

			return this.elements[ 0 ]?.value;
		},

		prop( prop, value ) {
			const _prop = propFix[ prop ] || prop;
			if ( value !== undefined ) {
				this.elements.forEach( ( el ) => {
					// Don't get/set properties on text, comment and attribute nodes
					if ( [ 3, 8, 2 ].includes( el.nodeType ) ) {
						return;
					}

					if ( prop in el ) {
						el[ _prop ] = value;
					}
				} );

				return this;
			}

			if ( this.elements[ 0 ] ) {
				return this.elements[ 0 ][ _prop ];
			}

			return undefined;
		},

		removeProp( name ) {
			return this.each( function () {
				delete this[ propFix[ name ] || name ];
			} );
		},

		attr( attrName, value ) {
			if ( value !== undefined ) {
				if ( value === null ) {
					return this.removeAttribute( attrName );
				}

				this.elements.forEach( ( el ) =>
					el.setAttribute( propFix[ attrName ] || attrName, value )
				);

				return this;
			}

			return this.elements[ 0 ]?.getAttribute(
				propFix[ attrName ] || attrName
			);
		},

		removeAttr( attrName ) {
			const attrNames = attrName && attrName.match( rnothtmlwhite );
			if ( ! attrNames.length ) {
				return this;
			}

			this.elements.forEach( ( el ) => {
				if ( el.nodeType === 1 ) {
					attrNames.forEach( ( name ) => {
						el.removeAttribute( propFix[ name ] || name );
					} );
				}
			} );

			return this;
		},

		data( key, value ) {
			let data;

			if ( ! this.elements.length ) {
				return data;
			}

			if ( key === undefined ) {
				return this.elements[ 0 ]?.dataset;
			}

			if ( key.indexOf( 'data-' ) === 0 ) {
				key = key.slice( 5 );
			}

			key = camelCase( key );

			if ( value !== undefined ) {
				this.elements.forEach(
					( el ) => ( el.dataset[ key ] = value )
				);
				return this;
			}

			return this.parseVal( this.elements[ 0 ]?.dataset[ key ] );
		},

		parseVal( value ) {
			if ( 'false' === value ) {
				return false;
			}

			if ( 'true' === value ) {
				return true;
			}

			if ( ! isNaN( value ) ) {
				return Number( value );
			}

			return value;
		},

		getFormData() {
			const maybeForm = this.elements.at( 0 );

			if ( maybeForm.nodeName !== 'FORM' ) {
				return {};
			}

			return Object.fromEntries( new FormData( maybeForm ) );
		},

		get( index = 0 ) {
			return this.elements.at( index );
		},

		at( index = 0 ) {
			return StoreEngineDQ( this.elements.at( index ) );
		},

		first() {
			return StoreEngineDQ( this.elements.at( 0 ) );
		},

		last() {
			return StoreEngineDQ( this.elements.at( -1 ) );
		},

		filter( predicate ) {
			return StoreEngineDQ(
				this.elements.filter( ( el, index, array ) =>
					predicate.call( el, el, index, array )
				)
			);
		},

		not(selector) { // eslint-disable-line
			if ( isUndefined( selector ) || selector === null ) {
				return this;
			}

			let predicate;

			if ( isString( selector ) ) {
				predicate = ( el ) => ! el.matches( selector );
			} else if ( isFunction( selector ) ) {
				predicate = ( el, index, array ) =>
					! selector.call( el, el, index, array );
			} else if ( selector.nodeType ) {
				predicate = ( el ) => el !== selector;
			} else if ( Array.isArray( selector ) ) {
				predicate = ( el ) => ! selector.includes( el );
			} else if ( selector.elements ) {
				predicate = ( el ) => ! selector.elements.includes( el );
			} else {
				return this;
			}

			return this.filter( predicate );
		},

		find( childSelector ) {
			return StoreEngineDQ(
				this.elements.flatMap( ( el ) =>
					Array.from( el.querySelectorAll( childSelector ) )
				)
			);
		},

		closest( parentSelector ) {
			return StoreEngineDQ(
				this.elements
					.map( ( el ) => el.closest( parentSelector ) )
					.filter( Boolean )
			);
		},

		parent( parentSelector ) {
			const parents = this.elements
				.map( ( el ) => el.parentNode )
				.filter( ( node ) => node && node.nodeType === 1 );

			// Distinct parents
			const uniqueParents = [ ...new Set( parents ) ];

			if ( isUndefined( parentSelector ) ) {
				return StoreEngineDQ( uniqueParents );
			}

			return StoreEngineDQ( uniqueParents ).filter( ( el ) =>
				el.matches( parentSelector )
			);
		},

		each( arrayOrCallback, callback ) {
			if ( arrayOrCallback && typeof arrayOrCallback === 'function' ) {
				callback = arrayOrCallback;
			}

			if ( Array.isArray( arrayOrCallback ) ) {
				arrayOrCallback.forEach( ( item, index ) =>
					callback.call( item, index, item )
				);
			}

			this.elements.forEach( ( el, index ) =>
				callback.call( el, index, el )
			);

			return this;
		},

		forEach( arrayOrCallback, callback ) {
			if ( arrayOrCallback && typeof arrayOrCallback === 'function' ) {
				callback = arrayOrCallback;
			}

			if ( Array.isArray( arrayOrCallback ) ) {
				arrayOrCallback.forEach( ( item, index ) =>
					callback.call( item, item, index )
				);
			}

			this.elements.forEach( ( el, index ) =>
				callback.call( el, el, index )
			);

			return this;
		},

		clearOptions() {
			this.elements.forEach( ( el ) => {
				if ( el.tagName === 'SELECT' ) {
					const firstOption = el.options[ 0 ];
					if ( firstOption && firstOption.value ) {
						// First option has value: remove all options
						while ( el.options.length > 0 ) {
							el.remove( 0 );
						}
					} else {
						// First option is empty: keep only the first option
						while ( el.options.length > 1 ) {
							el.remove( 1 );
						}
					}
				}
			} );

			return this;
		},

		addOptions( options = [] ) {
			this.elements.forEach( ( el ) => {
				if ( el.tagName === 'SELECT' ) {
					options.forEach( ( { value, label } ) => {
						const option = document.createElement( 'option' );
						option.value = value;
						option.textContent = label;
						el.appendChild( option );
					} );
				}
			} );

			return this;
		},

		toArray() {
			return [].slice.call( this.elements );
		},

		siblings( selector ) {
			if ( this.length === 0 ) {
				return StoreEngineDQ( null );
			}

			const matched = siblings(
				( this.get( 0 ).parentNode || {} ).firstChild,
				this.get( 0 )
			);

			if ( isUndefined( selector ) || selector === null ) {
				return StoreEngineDQ( matched );
			}

			return StoreEngineDQ(
				matched.filter( ( el ) => el.matches( selector ) )
			);
		},

		children() {
			if ( this.length === 0 ) {
				return StoreEngineDQ( null );
			}

			return StoreEngineDQ( siblings( this.get( 0 ).firstChild ) );
		},

		/**
		 * Immediately-preceding sibling of each element, optionally filtered by
		 * a selector — jQuery-compatible `.prev()`.
		 *
		 * @param {string} [selector]
		 * @return {StoreEngineDQ} matched previous siblings.
		 */
		prev( selector ) {
			const matched = this.elements
				.map( ( el ) => el.previousElementSibling )
				.filter( Boolean )
				.filter(
					( el ) =>
						isUndefined( selector ) ||
						selector === null ||
						el.matches( selector )
				);
			return StoreEngineDQ( matched );
		},

		/**
		 * Immediately-following sibling of each element, optionally filtered by
		 * a selector — jQuery-compatible `.next()`.
		 *
		 * @param {string} [selector]
		 * @return {StoreEngineDQ} matched next siblings.
		 */
		next( selector ) {
			const matched = this.elements
				.map( ( el ) => el.nextElementSibling )
				.filter( Boolean )
				.filter(
					( el ) =>
						isUndefined( selector ) ||
						selector === null ||
						el.matches( selector )
				);
			return StoreEngineDQ( matched );
		},

		/**
		 * Insert content before each matched element — jQuery-compatible
		 * `.before()`. Accepts an HTML string, Node, NodeList/Array or a
		 * StoreEngineDQ collection.
		 *
		 * @param {string|Node|NodeList|Array|StoreEngineDQ} content
		 * @return {this} current instance.
		 */
		before( content ) {
			if ( ! content ) {
				return this;
			}

			let nodes = [];
			if ( typeof content === 'string' ) {
				const template = document.createElement( 'template' );
				template.innerHTML = content.trim();
				nodes = Array.from( template.content.childNodes );
			} else if ( content instanceof Node ) {
				nodes = [ content ];
			} else if (
				content instanceof NodeList ||
				Array.isArray( content )
			) {
				nodes = Array.from( content );
			} else if ( content.elements ) {
				nodes = content.elements;
			}

			this.elements.forEach( ( target, index ) => {
				if ( ! target.parentNode ) {
					return;
				}
				nodes.forEach( ( node ) => {
					const toInsert =
						index === 0 ? node : node.cloneNode( true );
					target.parentNode.insertBefore( toInsert, target );
				} );
			} );

			return this;
		},

		/**
		 * Outer height of the first element in pixels — jQuery-compatible
		 * `.outerHeight()`. Pass `true` to include vertical margins.
		 *
		 * @param {boolean} [includeMargin=false]
		 * @return {number} outer height in px (0 when empty).
		 */
		outerHeight( includeMargin = false ) {
			const el = this.elements[ 0 ];
			if ( ! el ) {
				return 0;
			}
			let height = el.offsetHeight;
			if ( includeMargin ) {
				const style = window.getComputedStyle( el );
				height +=
					( parseFloat( style.marginTop ) || 0 ) +
					( parseFloat( style.marginBottom ) || 0 );
			}
			return height;
		},
	};
};
