/**
 * Extended URLSearchParams.
 */

// noinspection CommaExpressionJS

// Escape HTML special chars to safe entities
const htmlEntities = ( s ) =>
	String( s ).replace(
		/[&<>"'`=\/]/g,
		( ch ) =>
			( {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
				'`': '&#96;',
				'=': '&#61;',
				'/': '&#x2F;',
			} )[ ch ]
	);

// Normalizer: decode URI component (if from URL), coerce, trim, then escape
const _str = ( str ) => {
	str = ( str + '' ).toString();
	try {
		// If value came URL-encoded, decode it (safeguard: decode may throw)
		str = decodeURIComponent( str );
	} catch ( e ) {
		// ignore decode errors — keep original string
	}
	return htmlEntities( str.trim() );
};

const _int = ( int ) => {
	int = parseInt( int, 10 );
	return isFinite( int ) ? int : 0;
};

// @TODO all of the mapping should throw exception, so parser can handle the defaults better.

/**
 * Data type mapping.
 */
const typeMapping = {
	id: ( id ) => Math.abs( _int( id ) ),
	number: ( num ) => {
		num = Number( num );
		return isFinite( num ) ? num : 0;
	},
	int: _int,
	float: ( float ) => {
		float = parseFloat( float );
		return isFinite( float ) ? float : 0;
	},
	bool: ( bool ) =>
		[ '1', 'yes', 'true' ].includes( ( bool + '' ).toString().trim() ),
	object: JSON.parse,
	ids: ( ids ) =>
		ids
			.split( ',' )
			.map( typeMapping.id )
			.filter( ( i ) => !! i ),
	text: _str,
	string: _str,
};

// noinspection JSUnresolvedReference
export default class StoreEngineURLSearchParams extends URLSearchParams {
	/**
	 * Get value.
	 *
	 * @param {string}                                                        name
	 * @param {*}                                                             [defaultValue]
	 * @param {*}                                                             [allowedValue]
	 * @param {'number'|'text'|'string'|'int'|'float'|'bool'|'id'|'ids'|null} [returnType]
	 *
	 * @return {string|null|*}
	 */
	getValue(
		name,
		defaultValue = null,
		allowedValue = null,
		returnType = null
	) {
		let value = this.get( name );
		if ( value ) {
			if (
				null === defaultValue &&
				returnType &&
				typeMapping.hasOwnProperty( returnType )
			) {
				value = typeMapping[ returnType ]( value );
			} else if (
				null !== defaultValue &&
				typeof defaultValue !== typeof value
			) {
				if ( null === returnType ) {
					returnType = typeof defaultValue;
				}

				if ( returnType && typeMapping.hasOwnProperty( returnType ) ) {
					try {
						value = typeMapping[ returnType ]( value );
					} catch ( e ) {
						value = defaultValue;
					}
				}
			}

			if (
				( 'string' === typeof value || 'number' === typeof value ) &&
				null !== allowedValue &&
				Array.isArray( allowedValue ) &&
				! allowedValue.includes( value )
			) {
				return defaultValue;
			}

			return value;
		}

		return defaultValue;
	}
}

// End of file StoreEngineURLSearchParams.js
