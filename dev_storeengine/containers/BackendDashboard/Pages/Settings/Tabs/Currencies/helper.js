import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { currencies } from '@Utils/helper';

// Map currency codes to ISO-3166-1 alpha-2 country codes for flag display.
// Coverage focuses on the most common global currencies.
export const CURRENCY_TO_COUNTRY = {
	AED: 'AE',
	AFN: 'AF',
	ALL: 'AL',
	AMD: 'AM',
	ANG: 'AN',
	AOA: 'AO',
	ARS: 'AR',
	AUD: 'AU',
	AWG: 'AW',
	AZN: 'AZ',
	BAM: 'BA',
	BBD: 'BB',
	BDT: 'BD',
	BGN: 'BG',
	BHD: 'BH',
	BIF: 'BI',
	BMD: 'BM',
	BND: 'BN',
	BOB: 'BO',
	BRL: 'BR',
	BSD: 'BS',
	BTN: 'BT',
	BWP: 'BW',
	BYR: 'BY',
	BZD: 'BZ',
	CAD: 'CA',
	CDF: 'CD',
	CHF: 'CH',
	CLP: 'CL',
	CNY: 'CN',
	COP: 'CO',
	CRC: 'CR',
	CUP: 'CU',
	CVE: 'CV',
	CZK: 'CZ',
	DJF: 'DJ',
	DKK: 'DK',
	DOP: 'DO',
	DZD: 'DZ',
	EGP: 'EG',
	ERN: 'ER',
	ETB: 'ET',
	EUR: 'EU',
	FJD: 'FJ',
	FKP: 'FK',
	GBP: 'GB',
	GEL: 'GE',
	GHS: 'GH',
	GIP: 'GI',
	GMD: 'GM',
	GNF: 'GN',
	GTQ: 'GT',
	GYD: 'GY',
	HKD: 'HK',
	HNL: 'HN',
	HRK: 'HR',
	HTG: 'HT',
	HUF: 'HU',
	IDR: 'ID',
	ILS: 'IL',
	INR: 'IN',
	IQD: 'IQ',
	IRR: 'IR',
	ISK: 'IS',
	JMD: 'JM',
	JOD: 'JO',
	JPY: 'JP',
	KES: 'KE',
	KGS: 'KG',
	KHR: 'KH',
	KMF: 'KM',
	KPW: 'KP',
	KRW: 'KR',
	KWD: 'KW',
	KYD: 'KY',
	KZT: 'KZ',
	LAK: 'LA',
	LBP: 'LB',
	LKR: 'LK',
	LRD: 'LR',
	LSL: 'LS',
	LYD: 'LY',
	MAD: 'MA',
	MDL: 'MD',
	MGA: 'MG',
	MKD: 'MK',
	MMK: 'MM',
	MNT: 'MN',
	MOP: 'MO',
	MRO: 'MR',
	MUR: 'MU',
	MVR: 'MV',
	MWK: 'MW',
	MXN: 'MX',
	MYR: 'MY',
	MZN: 'MZ',
	NAD: 'NA',
	NGN: 'NG',
	NIO: 'NI',
	NOK: 'NO',
	NPR: 'NP',
	NZD: 'NZ',
	OMR: 'OM',
	PAB: 'PA',
	PEN: 'PE',
	PGK: 'PG',
	PHP: 'PH',
	PKR: 'PK',
	PLN: 'PL',
	PYG: 'PY',
	QAR: 'QA',
	RON: 'RO',
	RSD: 'RS',
	RUB: 'RU',
	RWF: 'RW',
	SAR: 'SA',
	SBD: 'SB',
	SCR: 'SC',
	SDG: 'SD',
	SEK: 'SE',
	SGD: 'SG',
	SHP: 'SH',
	SLL: 'SL',
	SOS: 'SO',
	SRD: 'SR',
	STD: 'ST',
	SVC: 'SV',
	SYP: 'SY',
	SZL: 'SZ',
	THB: 'TH',
	TJS: 'TJ',
	TMT: 'TM',
	TND: 'TN',
	TOP: 'TO',
	TRY: 'TR',
	TTD: 'TT',
	TWD: 'TW',
	TZS: 'TZ',
	UAH: 'UA',
	UGX: 'UG',
	USD: 'US',
	UYU: 'UY',
	UZS: 'UZ',
	VEF: 'VE',
	VND: 'VN',
	VUV: 'VU',
	WST: 'WS',
	XAF: 'CM',
	XCD: 'AG',
	XOF: 'SN',
	XPF: 'PF',
	YER: 'YE',
	ZAR: 'ZA',
	ZMW: 'ZM',
	ZWL: 'ZW',
};

// Locale options for the formatting dropdown.
export const LOCALE_OPTIONS = [
	{
		value: '',
		label: __( 'Site Locale - English (United States)', 'storeengine' ),
	},
	{ value: 'en-US', label: __( 'English (United States)', 'storeengine' ) },
	{ value: 'en-GB', label: __( 'English (United Kingdom)', 'storeengine' ) },
	{ value: 'de-DE', label: __( 'German (Germany)', 'storeengine' ) },
	{ value: 'fr-FR', label: __( 'French (France)', 'storeengine' ) },
	{ value: 'es-ES', label: __( 'Spanish (Spain)', 'storeengine' ) },
	{ value: 'it-IT', label: __( 'Italian (Italy)', 'storeengine' ) },
	{ value: 'pt-BR', label: __( 'Portuguese (Brazil)', 'storeengine' ) },
	{ value: 'nl-NL', label: __( 'Dutch (Netherlands)', 'storeengine' ) },
	{ value: 'ja-JP', label: __( 'Japanese (Japan)', 'storeengine' ) },
	{ value: 'zh-CN', label: __( 'Chinese (Simplified)', 'storeengine' ) },
	{ value: 'zh-TW', label: __( 'Chinese (Traditional)', 'storeengine' ) },
	{ value: 'ko-KR', label: __( 'Korean (Korea)', 'storeengine' ) },
	{ value: 'ar-SA', label: __( 'Arabic (Saudi Arabia)', 'storeengine' ) },
	{ value: 'ru-RU', label: __( 'Russian (Russia)', 'storeengine' ) },
	{ value: 'tr-TR', label: __( 'Turkish (Turkey)', 'storeengine' ) },
	{ value: 'pl-PL', label: __( 'Polish (Poland)', 'storeengine' ) },
	{ value: 'sv-SE', label: __( 'Swedish (Sweden)', 'storeengine' ) },
	{ value: 'da-DK', label: __( 'Danish (Denmark)', 'storeengine' ) },
	{ value: 'fi-FI', label: __( 'Finnish (Finland)', 'storeengine' ) },
	{ value: 'nb-NO', label: __( 'Norwegian Bokmål (Norway)', 'storeengine' ) },
	{ value: 'cs-CZ', label: __( 'Czech (Czech Republic)', 'storeengine' ) },
	{ value: 'hu-HU', label: __( 'Hungarian (Hungary)', 'storeengine' ) },
	{ value: 'ro-RO', label: __( 'Romanian (Romania)', 'storeengine' ) },
	{ value: 'el-GR', label: __( 'Greek (Greece)', 'storeengine' ) },
	{ value: 'th-TH', label: __( 'Thai (Thailand)', 'storeengine' ) },
	{
		value: 'id-ID',
		label: __( 'Indonesian (Indonesia)', 'storeengine' ),
	},
	{ value: 'vi-VN', label: __( 'Vietnamese (Vietnam)', 'storeengine' ) },
	{ value: 'hi-IN', label: __( 'Hindi (India)', 'storeengine' ) },
	{ value: 'bn-BD', label: __( 'Bengali (Bangladesh)', 'storeengine' ) },
	{ value: 'uk-UA', label: __( 'Ukrainian (Ukraine)', 'storeengine' ) },
	{ value: 'he-IL', label: __( 'Hebrew (Israel)', 'storeengine' ) },
];

/**
 * Convert an ISO-3166-1 alpha-2 country code to its flag emoji.
 *
 * @param {string} countryCode Two-letter country code (e.g. "US").
 * @return {string} Flag emoji or empty string.
 */
export function countryCodeToFlag( countryCode ) {
	if ( ! countryCode || countryCode.length !== 2 ) {
		return '';
	}
	const upper = countryCode.toUpperCase();
	return Array.from( upper )
		.map( ( char ) =>
			String.fromCodePoint( 0x1f1e6 - 65 + char.charCodeAt( 0 ) )
		)
		.join( '' );
}

/**
 * Get a flag emoji for a given currency code.
 *
 * @param {string} currencyCode Three-letter currency code (e.g. "EUR").
 * @return {string} Flag emoji or fallback icon character.
 */
export function getCurrencyFlag( currencyCode ) {
	const country = CURRENCY_TO_COUNTRY[ currencyCode?.toUpperCase() ];
	if ( ! country ) {
		return '💱';
	}
	return countryCodeToFlag( country );
}

/**
 * Format an exchange rate number for display.
 *
 * @param {number|string} rate
 * @return {string}
 */
export function formatRate( rate ) {
	const n = parseFloat( rate );
	if ( isNaN( n ) ) {
		return '-';
	}
	return n.toFixed( 6 ).replace( /\.?0+$/, '' );
}

/**
 * Format a preview price in the given currency/symbol.
 *
 * @param {string} symbol
 * @return {string}
 */
export function formatPreview( symbol ) {
	return `${ decodeEntities( symbol ) }1,234.56`;
}

/**
 * Get the exchange rate for a currency relative to the store base currency.
 *
 * @param {string} code             Target currency code.
 * @param {Object} rates            Rates keyed by currency code.
 * @param {string} ratesBase        The base currency of the rates object (usually "USD").
 * @param {string} baseCurrencyCode The store's base currency code.
 * @return {string|null} Formatted rate string, or null if target === base.
 */
export function getExchangeRate( code, rates, ratesBase, baseCurrencyCode ) {
	const upperCode = code.toUpperCase();
	const upperBase = baseCurrencyCode.toUpperCase();
	const upperRatesBase = ratesBase.toUpperCase();

	if ( upperCode === upperBase ) {
		return null; // base currency — no rate shown
	}

	// Rates object is keyed relative to ratesBase (usually USD).
	if ( upperRatesBase === upperBase ) {
		// Direct lookup.
		const rate = rates[ upperCode ];
		return rate != null ? formatRate( rate ) : '-';
	}

	// Cross-rate: convert ratesBase→base first, then to target.
	const baseRate = rates[ upperBase ];
	const targetRate = rates[ upperCode ];

	if ( baseRate && targetRate ) {
		return formatRate( targetRate / baseRate );
	}

	return '-';
}

export const CURRENCY_OPTIONS = currencies.map( ( c ) => ( {
	value: c.code,
	label: decodeEntities( `${ c.name } (${ c.symbol }) — ${ c.code }` ),
	_currency: c,
} ) );

export const fetchExchangeRates = async () => {
	try {
		const response = await fetch( 'https://api.frankfurter.dev/v2/rates' );
		const data = await response.json();
		return data;
	} catch ( error ) {
		console.error( error );
	}
};
