export const DIAL_CODES = [
	{ code: '+1',   name: 'US / Canada' },
	{ code: '+7',   name: 'Russia / Kazakhstan' },
	{ code: '+20',  name: 'Egypt' },
	{ code: '+27',  name: 'South Africa' },
	{ code: '+30',  name: 'Greece' },
	{ code: '+31',  name: 'Netherlands' },
	{ code: '+32',  name: 'Belgium' },
	{ code: '+33',  name: 'France' },
	{ code: '+34',  name: 'Spain' },
	{ code: '+36',  name: 'Hungary' },
	{ code: '+39',  name: 'Italy' },
	{ code: '+40',  name: 'Romania' },
	{ code: '+41',  name: 'Switzerland' },
	{ code: '+43',  name: 'Austria' },
	{ code: '+44',  name: 'UK' },
	{ code: '+45',  name: 'Denmark' },
	{ code: '+46',  name: 'Sweden' },
	{ code: '+47',  name: 'Norway' },
	{ code: '+48',  name: 'Poland' },
	{ code: '+49',  name: 'Germany' },
	{ code: '+51',  name: 'Peru' },
	{ code: '+52',  name: 'Mexico' },
	{ code: '+54',  name: 'Argentina' },
	{ code: '+55',  name: 'Brazil' },
	{ code: '+56',  name: 'Chile' },
	{ code: '+57',  name: 'Colombia' },
	{ code: '+58',  name: 'Venezuela' },
	{ code: '+60',  name: 'Malaysia' },
	{ code: '+61',  name: 'Australia' },
	{ code: '+62',  name: 'Indonesia' },
	{ code: '+63',  name: 'Philippines' },
	{ code: '+64',  name: 'New Zealand' },
	{ code: '+65',  name: 'Singapore' },
	{ code: '+66',  name: 'Thailand' },
	{ code: '+81',  name: 'Japan' },
	{ code: '+82',  name: 'South Korea' },
	{ code: '+84',  name: 'Vietnam' },
	{ code: '+86',  name: 'China' },
	{ code: '+90',  name: 'Turkey' },
	{ code: '+91',  name: 'India' },
	{ code: '+92',  name: 'Pakistan' },
	{ code: '+93',  name: 'Afghanistan' },
	{ code: '+94',  name: 'Sri Lanka' },
	{ code: '+95',  name: 'Myanmar' },
	{ code: '+98',  name: 'Iran' },
	{ code: '+212', name: 'Morocco' },
	{ code: '+213', name: 'Algeria' },
	{ code: '+216', name: 'Tunisia' },
	{ code: '+218', name: 'Libya' },
	{ code: '+234', name: 'Nigeria' },
	{ code: '+249', name: 'Sudan' },
	{ code: '+251', name: 'Ethiopia' },
	{ code: '+254', name: 'Kenya' },
	{ code: '+255', name: 'Tanzania' },
	{ code: '+256', name: 'Uganda' },
	{ code: '+880', name: 'Bangladesh' },
	{ code: '+886', name: 'Taiwan' },
	{ code: '+960', name: 'Maldives' },
	{ code: '+961', name: 'Lebanon' },
	{ code: '+962', name: 'Jordan' },
	{ code: '+963', name: 'Syria' },
	{ code: '+964', name: 'Iraq' },
	{ code: '+965', name: 'Kuwait' },
	{ code: '+966', name: 'Saudi Arabia' },
	{ code: '+967', name: 'Yemen' },
	{ code: '+968', name: 'Oman' },
	{ code: '+971', name: 'UAE' },
	{ code: '+972', name: 'Israel' },
	{ code: '+973', name: 'Bahrain' },
	{ code: '+974', name: 'Qatar' },
	{ code: '+977', name: 'Nepal' },
	{ code: '+992', name: 'Tajikistan' },
	{ code: '+994', name: 'Azerbaijan' },
	{ code: '+995', name: 'Georgia' },
	{ code: '+998', name: 'Uzbekistan' },
];

const TZ_DIAL = {
	'America/New_York': '+1', 'America/Chicago': '+1', 'America/Denver': '+1',
	'America/Los_Angeles': '+1', 'America/Toronto': '+1', 'America/Vancouver': '+1',
	'America/Sao_Paulo': '+55', 'America/Argentina/Buenos_Aires': '+54',
	'America/Bogota': '+57', 'America/Lima': '+51', 'America/Santiago': '+56',
	'America/Mexico_City': '+52', 'America/Caracas': '+58',
	'Europe/London': '+44', 'Europe/Paris': '+33', 'Europe/Berlin': '+49',
	'Europe/Madrid': '+34', 'Europe/Rome': '+39', 'Europe/Amsterdam': '+31',
	'Europe/Brussels': '+32', 'Europe/Vienna': '+43', 'Europe/Zurich': '+41',
	'Europe/Stockholm': '+46', 'Europe/Oslo': '+47', 'Europe/Copenhagen': '+45',
	'Europe/Warsaw': '+48', 'Europe/Budapest': '+36', 'Europe/Bucharest': '+40',
	'Europe/Athens': '+30', 'Europe/Moscow': '+7', 'Europe/Istanbul': '+90',
	'Asia/Dubai': '+971', 'Asia/Riyadh': '+966', 'Asia/Kuwait': '+965',
	'Asia/Qatar': '+974', 'Asia/Bahrain': '+973', 'Asia/Muscat': '+968',
	'Asia/Baghdad': '+964', 'Asia/Beirut': '+961', 'Asia/Amman': '+962',
	'Asia/Jerusalem': '+972', 'Asia/Tehran': '+98', 'Asia/Kabul': '+93',
	'Asia/Karachi': '+92', 'Asia/Kolkata': '+91', 'Asia/Dhaka': '+880',
	'Asia/Colombo': '+94', 'Asia/Kathmandu': '+977', 'Asia/Rangoon': '+95',
	'Asia/Bangkok': '+66', 'Asia/Jakarta': '+62', 'Asia/Singapore': '+65',
	'Asia/Kuala_Lumpur': '+60', 'Asia/Manila': '+63', 'Asia/Shanghai': '+86',
	'Asia/Tokyo': '+81', 'Asia/Seoul': '+82', 'Asia/Ho_Chi_Minh': '+84',
	'Asia/Taipei': '+886', 'Asia/Tashkent': '+998', 'Asia/Tbilisi': '+995',
	'Asia/Baku': '+994',
	'Africa/Cairo': '+20', 'Africa/Lagos': '+234', 'Africa/Nairobi': '+254',
	'Africa/Johannesburg': '+27', 'Africa/Casablanca': '+212',
	'Africa/Algiers': '+213', 'Africa/Tunis': '+216', 'Africa/Khartoum': '+249',
	'Africa/Addis_Ababa': '+251', 'Africa/Dar_es_Salaam': '+255',
	'Pacific/Auckland': '+64', 'Australia/Sydney': '+61', 'Australia/Melbourne': '+61',
};

/**
 * Detect the best default dial code:
 *   1. savedPhone — E.164 from user meta (extract prefix)
 *   2. Browser timezone
 *   3. storeDefault — the store's configured dial code
 *   4. First in list
 */
export function detectDialCode( savedPhone, storeDefault ) {
	const codes = DIAL_CODES.map( ( d ) => d.code );

	if ( savedPhone && savedPhone.startsWith( '+' ) ) {
		const digits = savedPhone.replace( /\D/g, '' );
		for ( const len of [ 3, 2, 1 ] ) {
			const candidate = '+' + digits.slice( 0, len );
			if ( codes.includes( candidate ) ) return candidate;
		}
	}

	try {
		const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const code = TZ_DIAL[ tz ];
		if ( code && codes.includes( code ) ) return code;
	} catch ( _ ) {}

	if ( storeDefault ) {
		const norm = storeDefault.startsWith( '+' ) ? storeDefault : '+' + storeDefault;
		if ( codes.includes( norm ) ) return norm;
	}

	return DIAL_CODES[ 0 ].code;
}

/** Combine a dial code + local number into E.164. Strips leading trunk zeros. */
export function combinePhone( dialCode, localNumber ) {
	const local = ( localNumber || '' ).replace( /^0+/, '' ).replace( /\D/g, '' );
	return local ? dialCode + local : '';
}

/** Extract the longest matching dial code prefix from an E.164 string. */
export function extractDialCode( e164 ) {
	const codes  = DIAL_CODES.map( ( d ) => d.code );
	const digits = e164.replace( /\D/g, '' );
	for ( const len of [ 3, 2, 1 ] ) {
		const candidate = '+' + digits.slice( 0, len );
		if ( codes.includes( candidate ) ) return candidate;
	}
	return '';
}

/** Returns true if the value looks like an E.164 phone number. */
export function isPhoneE164( val ) {
	return !! val && /^\+\d{7,15}$/.test( val.trim() );
}
