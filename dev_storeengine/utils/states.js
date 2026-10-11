/**
 * States
 *
 * Returns an array of country states. This deprecates and replaces the /states/ directory found in older versions.
 *
 * States should be defined in English and translated native through localisation files.
 *
 * Country codes and states (or province) names should follow the Unicode CLDR recommendation (https://cldr.unicode.org/translation/displaynames/countryregion-territory-names).
 *
 * Countries defined with empty arrays have no states. These should also be defined in class-wc-countries.php to mark the state field as not required and hidden.
 */

import { __, _x } from '@wordpress/i18n';

// noinspection SpellCheckingInspection
export default {
	AF: [
		// Afghanistan Provinces
		{
			label: __( 'Badakhshan', 'storeengine' ),
			value: 'AF-BDS',
		},
		{
			label: __( 'Badghis', 'storeengine' ),
			value: 'AF-BDG',
		},
		{
			label: __( 'Baghlan', 'storeengine' ),
			value: 'AF-BGL',
		},
		{
			label: __( 'Balkh', 'storeengine' ),
			value: 'AF-BAL',
		},
		{
			label: __( 'Bamyan', 'storeengine' ),
			value: 'AF-BAM',
		},
		{
			label: __( 'Daykundi', 'storeengine' ),
			value: 'AF-DAY',
		},
		{
			label: __( 'Farah', 'storeengine' ),
			value: 'AF-FRA',
		},
		{
			label: __( 'Faryab', 'storeengine' ),
			value: 'AF-FYB',
		},
		{
			label: __( 'Ghazni', 'storeengine' ),
			value: 'AF-GHA',
		},
		{
			label: __( 'Ghor', 'storeengine' ),
			value: 'AF-GHO',
		},
		{
			label: __( 'Helmand', 'storeengine' ),
			value: 'AF-HEL',
		},
		{
			label: __( 'Herat', 'storeengine' ),
			value: 'AF-HER',
		},
		{
			label: __( 'Jowzjan', 'storeengine' ),
			value: 'AF-JOW',
		},
		{
			label: __( 'Kabul', 'storeengine' ),
			value: 'AF-KAB',
		},
		{
			label: __( 'Kandahar', 'storeengine' ),
			value: 'AF-KAN',
		},
		{
			label: __( 'Kapisa', 'storeengine' ),
			value: 'AF-KAP',
		},
		{
			label: __( 'Khost', 'storeengine' ),
			value: 'AF-KHO',
		},
		{
			label: __( 'Kunar', 'storeengine' ),
			value: 'AF-KNR',
		},
		{
			label: __( 'Kunduz', 'storeengine' ),
			value: 'AF-KDZ',
		},
		{
			label: __( 'Laghman', 'storeengine' ),
			value: 'AF-LAG',
		},
		{
			label: __( 'Logar', 'storeengine' ),
			value: 'AF-LOG',
		},
		{
			label: __( 'Nangarhar', 'storeengine' ),
			value: 'AF-NAN',
		},
		{
			label: __( 'Nimruz', 'storeengine' ),
			value: 'AF-NIM',
		},
		{
			label: __( 'Nuristan', 'storeengine' ),
			value: 'AF-NUR',
		},
		{
			label: __( 'Paktia', 'storeengine' ),
			value: 'AF-PIA',
		},
		{
			label: __( 'Paktika', 'storeengine' ),
			value: 'AF-PKA',
		},
		{
			label: __( 'Panjshir', 'storeengine' ),
			value: 'AF-PAN',
		},
		{
			label: __( 'Parwan', 'storeengine' ),
			value: 'AF-PAR',
		},
		{
			label: __( 'Samangan', 'storeengine' ),
			value: 'AF-SAM',
		},
		{
			label: __( 'Sar-e Pol', 'storeengine' ),
			value: 'AF-SAR',
		},
		{
			label: __( 'Takhar', 'storeengine' ),
			value: 'AF-TAK',
		},
		{
			label: __( 'Uruzgan', 'storeengine' ),
			value: 'AF-URU',
		},
		{
			label: __( 'Wardak', 'storeengine' ),
			value: 'AF-WAR',
		},
		{
			label: __( 'Zabul', 'storeengine' ),
			value: 'AF-ZAB',
		},
	],
	AL: [
		// Albanian states.
		{
			label: __( 'Berat', 'storeengine' ),
			value: 'AL-01',
		},
		{
			label: __( 'Dibër', 'storeengine' ),
			value: 'AL-09',
		},
		{
			label: __( 'Durrës', 'storeengine' ),
			value: 'AL-02',
		},
		{
			label: __( 'Elbasan', 'storeengine' ),
			value: 'AL-03',
		},
		{
			label: __( 'Fier', 'storeengine' ),
			value: 'AL-04',
		},
		{
			label: __( 'Gjirokastër', 'storeengine' ),
			value: 'AL-05',
		},
		{
			label: __( 'Korçë', 'storeengine' ),
			value: 'AL-06',
		},
		{
			label: __( 'Kukës', 'storeengine' ),
			value: 'AL-07',
		},
		{
			label: __( 'Lezhë', 'storeengine' ),
			value: 'AL-08',
		},
		{
			label: __( 'Shkodër', 'storeengine' ),
			value: 'AL-10',
		},
		{
			label: __( 'Tirana', 'storeengine' ),
			value: 'AL-11',
		},
		{
			label: __( 'Vlorë', 'storeengine' ),
			value: 'AL-12',
		},
	],
	AO: [
		// Angolan states.
		{
			label: __( 'Bengo', 'storeengine' ),
			value: 'BGO',
		},
		{
			label: __( 'Benguela', 'storeengine' ),
			value: 'BLU',
		},
		{
			label: __( 'Bié', 'storeengine' ),
			value: 'BIE',
		},
		{
			label: __( 'Cabinda', 'storeengine' ),
			value: 'CAB',
		},
		{
			label: __( 'Cunene', 'storeengine' ),
			value: 'CNN',
		},
		{
			label: __( 'Huambo', 'storeengine' ),
			value: 'HUA',
		},
		{
			label: __( 'Huíla', 'storeengine' ),
			value: 'HUI',
		},
		{
			label: __( 'Kuando Kubango', 'storeengine' ),
			value: 'CCU',
		},
		{
			label: __( 'Kwanza-Norte', 'storeengine' ),
			value: 'CNO',
		},
		{
			label: __( 'Kwanza-Sul', 'storeengine' ),
			value: 'CUS',
		},
		{
			label: __( 'Luanda', 'storeengine' ),
			value: 'LUA',
		},
		{
			label: __( 'Lunda-Norte', 'storeengine' ),
			value: 'LNO',
		},
		{
			label: __( 'Lunda-Sul', 'storeengine' ),
			value: 'LSU',
		},
		{
			label: __( 'Malanje', 'storeengine' ),
			value: 'MAL',
		},
		{
			label: __( 'Moxico', 'storeengine' ),
			value: 'MOX',
		},
		{
			label: __( 'Namibe', 'storeengine' ),
			value: 'NAM',
		},
		{
			label: __( 'Uíge', 'storeengine' ),
			value: 'UIG',
		},
		{
			label: __( 'Zaire', 'storeengine' ),
			value: 'ZAI',
		},
	],
	AR: [
		// Argentinian provinces.
		{
			label: __( 'Ciudad Autónoma de Buenos Aires', 'storeengine' ),
			value: 'C',
		},
		{
			label: __( 'Buenos Aires', 'storeengine' ),
			value: 'B',
		},
		{
			label: __( 'Catamarca', 'storeengine' ),
			value: 'K',
		},
		{
			label: __( 'Chaco', 'storeengine' ),
			value: 'H',
		},
		{
			label: __( 'Chubut', 'storeengine' ),
			value: 'U',
		},
		{
			label: __( 'Córdoba', 'storeengine' ),
			value: 'X',
		},
		{
			label: __( 'Corrientes', 'storeengine' ),
			value: 'W',
		},
		{
			label: __( 'Entre Ríos', 'storeengine' ),
			value: 'E',
		},
		{
			label: __( 'Formosa', 'storeengine' ),
			value: 'P',
		},
		{
			label: __( 'Jujuy', 'storeengine' ),
			value: 'Y',
		},
		{
			label: __( 'La Pampa', 'storeengine' ),
			value: 'L',
		},
		{
			label: __( 'La Rioja', 'storeengine' ),
			value: 'F',
		},
		{
			label: __( 'Mendoza', 'storeengine' ),
			value: 'M',
		},
		{
			label: __( 'Misiones', 'storeengine' ),
			value: 'N',
		},
		{
			label: __( 'Neuquén', 'storeengine' ),
			value: 'Q',
		},
		{
			label: __( 'Río Negro', 'storeengine' ),
			value: 'R',
		},
		{
			label: __( 'Salta', 'storeengine' ),
			value: 'A',
		},
		{
			label: __( 'San Juan', 'storeengine' ),
			value: 'J',
		},
		{
			label: __( 'San Luis', 'storeengine' ),
			value: 'D',
		},
		{
			label: __( 'Santa Cruz', 'storeengine' ),
			value: 'Z',
		},
		{
			label: __( 'Santa Fe', 'storeengine' ),
			value: 'S',
		},
		{
			label: __( 'Santiago del Estero', 'storeengine' ),
			value: 'G',
		},
		{
			label: __( 'Tierra del Fuego', 'storeengine' ),
			value: 'V',
		},
		{
			label: __( 'Tucumán', 'storeengine' ),
			value: 'T',
		},
	],

	/**
	 * Austria Subdivision.
	 *
	 * English name of subdivisions conform to the name of subdivision names are listed as in the ISO 3166-2
	 * standard published by the ISO 3166 Maintenance Agency (ISO 3166/MA).
	 */
	AT: [
		{
			label: __( 'Burgenland', 'storeengine' ),
			value: 'AT-1',
		},
		{
			label: __( 'Carinthia', 'storeengine' ),
			value: 'AT-2',
		},
		{
			label: __( 'Lower Austria', 'storeengine' ),
			value: 'AT-3',
		},
		{
			label: __( 'Upper Austria', 'storeengine' ),
			value: 'AT-4',
		},
		{
			label: __( 'Salzburg', 'storeengine' ),
			value: 'AT-5',
		},
		{
			label: __( 'Styria', 'storeengine' ),
			value: 'AT-6',
		},
		{
			label: __( 'Tyrol', 'storeengine' ),
			value: 'AT-7',
		},
		{
			label: __( 'Vorarlberg', 'storeengine' ),
			value: 'AT-8',
		},
		{
			label: __( 'Vienna', 'storeengine' ),
			value: 'AT-9',
		},
	],
	AU: [
		// Australian states.
		{
			label: __( 'Australian Capital Territory', 'storeengine' ),
			value: 'ACT',
		},
		{
			label: __( 'New South Wales', 'storeengine' ),
			value: 'NSW',
		},
		{
			label: __( 'Northern Territory', 'storeengine' ),
			value: 'NT',
		},
		{
			label: __( 'Queensland', 'storeengine' ),
			value: 'QLD',
		},
		{
			label: __( 'South Australia', 'storeengine' ),
			value: 'SA',
		},
		{
			label: __( 'Tasmania', 'storeengine' ),
			value: 'TAS',
		},
		{
			label: __( 'Victoria', 'storeengine' ),
			value: 'VIC',
		},
		{
			label: __( 'Western Australia', 'storeengine' ),
			value: 'WA',
		},
	],
	AX: [],
	BD: [
		// Bangladeshi districts.
		{
			label: __( 'Bagerhat', 'storeengine' ),
			value: 'BD-05',
		},
		{
			label: __( 'Bandarban', 'storeengine' ),
			value: 'BD-01',
		},
		{
			label: __( 'Barguna', 'storeengine' ),
			value: 'BD-02',
		},
		{
			label: __( 'Barishal', 'storeengine' ),
			value: 'BD-06',
		},
		{
			label: __( 'Bhola', 'storeengine' ),
			value: 'BD-07',
		},
		{
			label: __( 'Bogura', 'storeengine' ),
			value: 'BD-03',
		},
		{
			label: __( 'Brahmanbaria', 'storeengine' ),
			value: 'BD-04',
		},
		{
			label: __( 'Chandpur', 'storeengine' ),
			value: 'BD-09',
		},
		{
			label: __( 'Chattogram', 'storeengine' ),
			value: 'BD-10',
		},
		{
			label: __( 'Chuadanga', 'storeengine' ),
			value: 'BD-12',
		},
		{
			label: __( "Cox's Bazar", 'storeengine' ),
			value: 'BD-11',
		},
		{
			label: __( 'Cumilla', 'storeengine' ),
			value: 'BD-08',
		},
		{
			label: __( 'Dhaka', 'storeengine' ),
			value: 'BD-13',
		},
		{
			label: __( 'Dinajpur', 'storeengine' ),
			value: 'BD-14',
		},
		{
			label: __( 'Faridpur', 'storeengine' ),
			value: 'BD-15',
		},
		{
			label: __( 'Feni', 'storeengine' ),
			value: 'BD-16',
		},
		{
			label: __( 'Gaibandha', 'storeengine' ),
			value: 'BD-19',
		},
		{
			label: __( 'Gazipur', 'storeengine' ),
			value: 'BD-18',
		},
		{
			label: __( 'Gopalganj', 'storeengine' ),
			value: 'BD-17',
		},
		{
			label: __( 'Habiganj', 'storeengine' ),
			value: 'BD-20',
		},
		{
			label: __( 'Jamalpur', 'storeengine' ),
			value: 'BD-21',
		},
		{
			label: __( 'Jashore', 'storeengine' ),
			value: 'BD-22',
		},
		{
			label: __( 'Jhalokati', 'storeengine' ),
			value: 'BD-25',
		},
		{
			label: __( 'Jhenaidah', 'storeengine' ),
			value: 'BD-23',
		},
		{
			label: __( 'Joypurhat', 'storeengine' ),
			value: 'BD-24',
		},
		{
			label: __( 'Khagrachhari', 'storeengine' ),
			value: 'BD-29',
		},
		{
			label: __( 'Khulna', 'storeengine' ),
			value: 'BD-27',
		},
		{
			label: __( 'Kishoreganj', 'storeengine' ),
			value: 'BD-26',
		},
		{
			label: __( 'Kurigram', 'storeengine' ),
			value: 'BD-28',
		},
		{
			label: __( 'Kushtia', 'storeengine' ),
			value: 'BD-30',
		},
		{
			label: __( 'Lakshmipur', 'storeengine' ),
			value: 'BD-31',
		},
		{
			label: __( 'Lalmonirhat', 'storeengine' ),
			value: 'BD-32',
		},
		{
			label: __( 'Madaripur', 'storeengine' ),
			value: 'BD-36',
		},
		{
			label: __( 'Magura', 'storeengine' ),
			value: 'BD-37',
		},
		{
			label: __( 'Manikganj', 'storeengine' ),
			value: 'BD-33',
		},
		{
			label: __( 'Meherpur', 'storeengine' ),
			value: 'BD-39',
		},
		{
			label: __( 'Moulvibazar', 'storeengine' ),
			value: 'BD-38',
		},
		{
			label: __( 'Munshiganj', 'storeengine' ),
			value: 'BD-35',
		},
		{
			label: __( 'Mymensingh', 'storeengine' ),
			value: 'BD-34',
		},
		{
			label: __( 'Naogaon', 'storeengine' ),
			value: 'BD-48',
		},
		{
			label: __( 'Narail', 'storeengine' ),
			value: 'BD-43',
		},
		{
			label: __( 'Narayanganj', 'storeengine' ),
			value: 'BD-40',
		},
		{
			label: __( 'Narsingdi', 'storeengine' ),
			value: 'BD-42',
		},
		{
			label: __( 'Natore', 'storeengine' ),
			value: 'BD-44',
		},
		{
			label: __( 'Nawabganj', 'storeengine' ),
			value: 'BD-45',
		},
		{
			label: __( 'Netrakona', 'storeengine' ),
			value: 'BD-41',
		},
		{
			label: __( 'Nilphamari', 'storeengine' ),
			value: 'BD-46',
		},
		{
			label: __( 'Noakhali', 'storeengine' ),
			value: 'BD-47',
		},
		{
			label: __( 'Pabna', 'storeengine' ),
			value: 'BD-49',
		},
		{
			label: __( 'Panchagarh', 'storeengine' ),
			value: 'BD-52',
		},
		{
			label: __( 'Patuakhali', 'storeengine' ),
			value: 'BD-51',
		},
		{
			label: __( 'Pirojpur', 'storeengine' ),
			value: 'BD-50',
		},
		{
			label: __( 'Rajbari', 'storeengine' ),
			value: 'BD-53',
		},
		{
			label: __( 'Rajshahi', 'storeengine' ),
			value: 'BD-54',
		},
		{
			label: __( 'Rangamati', 'storeengine' ),
			value: 'BD-56',
		},
		{
			label: __( 'Rangpur', 'storeengine' ),
			value: 'BD-55',
		},
		{
			label: __( 'Satkhira', 'storeengine' ),
			value: 'BD-58',
		},
		{
			label: __( 'Shariatpur', 'storeengine' ),
			value: 'BD-62',
		},
		{
			label: __( 'Sherpur', 'storeengine' ),
			value: 'BD-57',
		},
		{
			label: __( 'Sirajganj', 'storeengine' ),
			value: 'BD-59',
		},
		{
			label: __( 'Sunamganj', 'storeengine' ),
			value: 'BD-61',
		},
		{
			label: __( 'Sylhet', 'storeengine' ),
			value: 'BD-60',
		},
		{
			label: __( 'Tangail', 'storeengine' ),
			value: 'BD-63',
		},
		{
			label: __( 'Thakurgaon', 'storeengine' ),
			value: 'BD-64',
		},
	],
	BE: [],
	BG: [
		// Bulgarian states.
		{
			label: __( 'Blagoevgrad', 'storeengine' ),
			value: 'BG-01',
		},
		{
			label: __( 'Burgas', 'storeengine' ),
			value: 'BG-02',
		},
		{
			label: __( 'Dobrich', 'storeengine' ),
			value: 'BG-08',
		},
		{
			label: __( 'Gabrovo', 'storeengine' ),
			value: 'BG-07',
		},
		{
			label: __( 'Haskovo', 'storeengine' ),
			value: 'BG-26',
		},
		{
			label: __( 'Kardzhali', 'storeengine' ),
			value: 'BG-09',
		},
		{
			label: __( 'Kyustendil', 'storeengine' ),
			value: 'BG-10',
		},
		{
			label: __( 'Lovech', 'storeengine' ),
			value: 'BG-11',
		},
		{
			label: __( 'Montana', 'storeengine' ),
			value: 'BG-12',
		},
		{
			label: __( 'Pazardzhik', 'storeengine' ),
			value: 'BG-13',
		},
		{
			label: __( 'Pernik', 'storeengine' ),
			value: 'BG-14',
		},
		{
			label: __( 'Pleven', 'storeengine' ),
			value: 'BG-15',
		},
		{
			label: __( 'Plovdiv', 'storeengine' ),
			value: 'BG-16',
		},
		{
			label: __( 'Razgrad', 'storeengine' ),
			value: 'BG-17',
		},
		{
			label: __( 'Ruse', 'storeengine' ),
			value: 'BG-18',
		},
		{
			label: __( 'Shumen', 'storeengine' ),
			value: 'BG-27',
		},
		{
			label: __( 'Silistra', 'storeengine' ),
			value: 'BG-19',
		},
		{
			label: __( 'Sliven', 'storeengine' ),
			value: 'BG-20',
		},
		{
			label: __( 'Smolyan', 'storeengine' ),
			value: 'BG-21',
		},
		{
			label: __( 'Sofia District', 'storeengine' ),
			value: 'BG-23',
		},
		{
			label: __( 'Sofia', 'storeengine' ),
			value: 'BG-22',
		},
		{
			label: __( 'Stara Zagora', 'storeengine' ),
			value: 'BG-24',
		},
		{
			label: __( 'Targovishte', 'storeengine' ),
			value: 'BG-25',
		},
		{
			label: __( 'Varna', 'storeengine' ),
			value: 'BG-03',
		},
		{
			label: __( 'Veliko Tarnovo', 'storeengine' ),
			value: 'BG-04',
		},
		{
			label: __( 'Vidin', 'storeengine' ),
			value: 'BG-05',
		},
		{
			label: __( 'Vratsa', 'storeengine' ),
			value: 'BG-06',
		},
		{
			label: __( 'Yambol', 'storeengine' ),
			value: 'BG-28',
		},
	],
	BH: [],
	BI: [],
	BJ: [
		// Beninese states.
		{
			label: __( 'Alibori', 'storeengine' ),
			value: 'AL',
		},
		{
			label: __( 'Atakora', 'storeengine' ),
			value: 'AK',
		},
		{
			label: __( 'Atlantique', 'storeengine' ),
			value: 'AQ',
		},
		{
			label: __( 'Borgou', 'storeengine' ),
			value: 'BO',
		},
		{
			label: __( 'Collines', 'storeengine' ),
			value: 'CO',
		},
		{
			label: __( 'Kouffo', 'storeengine' ),
			value: 'KO',
		},
		{
			label: __( 'Donga', 'storeengine' ),
			value: 'DO',
		},
		{
			label: __( 'Littoral', 'storeengine' ),
			value: 'LI',
		},
		{
			label: __( 'Mono', 'storeengine' ),
			value: 'MO',
		},
		{
			label: __( 'Ouémé', 'storeengine' ),
			value: 'OU',
		},
		{
			label: __( 'Plateau', 'storeengine' ),
			value: 'PL',
		},
		{
			label: __( 'Zou', 'storeengine' ),
			value: 'ZO',
		},
	],
	BO: [
		// Bolivian states.
		{
			label: __( 'Beni', 'storeengine' ),
			value: 'BO-B',
		},
		{
			label: __( 'Chuquisaca', 'storeengine' ),
			value: 'BO-H',
		},
		{
			label: __( 'Cochabamba', 'storeengine' ),
			value: 'BO-C',
		},
		{
			label: __( 'La Paz', 'storeengine' ),
			value: 'BO-L',
		},
		{
			label: __( 'Oruro', 'storeengine' ),
			value: 'BO-O',
		},
		{
			label: __( 'Pando', 'storeengine' ),
			value: 'BO-N',
		},
		{
			label: __( 'Potosí', 'storeengine' ),
			value: 'BO-P',
		},
		{
			label: __( 'Santa Cruz', 'storeengine' ),
			value: 'BO-S',
		},
		{
			label: __( 'Tarija', 'storeengine' ),
			value: 'BO-T',
		},
	],
	BR: [
		// Brazilian states.
		{
			label: __( 'Acre', 'storeengine' ),
			value: 'AC',
		},
		{
			label: __( 'Alagoas', 'storeengine' ),
			value: 'AL',
		},
		{
			label: __( 'Amapá', 'storeengine' ),
			value: 'AP',
		},
		{
			label: __( 'Amazonas', 'storeengine' ),
			value: 'AM',
		},
		{
			label: __( 'Bahia', 'storeengine' ),
			value: 'BA',
		},
		{
			label: __( 'Ceará', 'storeengine' ),
			value: 'CE',
		},
		{
			label: __( 'Distrito Federal', 'storeengine' ),
			value: 'DF',
		},
		{
			label: __( 'Espírito Santo', 'storeengine' ),
			value: 'ES',
		},
		{
			label: __( 'Goiás', 'storeengine' ),
			value: 'GO',
		},
		{
			label: __( 'Maranhão', 'storeengine' ),
			value: 'MA',
		},
		{
			label: __( 'Mato Grosso', 'storeengine' ),
			value: 'MT',
		},
		{
			label: __( 'Mato Grosso do Sul', 'storeengine' ),
			value: 'MS',
		},
		{
			label: __( 'Minas Gerais', 'storeengine' ),
			value: 'MG',
		},
		{
			label: __( 'Pará', 'storeengine' ),
			value: 'PA',
		},
		{
			label: __( 'Paraíba', 'storeengine' ),
			value: 'PB',
		},
		{
			label: __( 'Paraná', 'storeengine' ),
			value: 'PR',
		},
		{
			label: __( 'Pernambuco', 'storeengine' ),
			value: 'PE',
		},
		{
			label: __( 'Piauí', 'storeengine' ),
			value: 'PI',
		},
		{
			label: __( 'Rio de Janeiro', 'storeengine' ),
			value: 'RJ',
		},
		{
			label: __( 'Rio Grande do Norte', 'storeengine' ),
			value: 'RN',
		},
		{
			label: __( 'Rio Grande do Sul', 'storeengine' ),
			value: 'RS',
		},
		{
			label: __( 'Rondônia', 'storeengine' ),
			value: 'RO',
		},
		{
			label: __( 'Roraima', 'storeengine' ),
			value: 'RR',
		},
		{
			label: __( 'Santa Catarina', 'storeengine' ),
			value: 'SC',
		},
		{
			label: __( 'São Paulo', 'storeengine' ),
			value: 'SP',
		},
		{
			label: __( 'Sergipe', 'storeengine' ),
			value: 'SE',
		},
		{
			label: __( 'Tocantins', 'storeengine' ),
			value: 'TO',
		},
	],
	CA: [
		// Canadian states.
		{
			label: __( 'Alberta', 'storeengine' ),
			value: 'AB',
		},
		{
			label: __( 'British Columbia', 'storeengine' ),
			value: 'BC',
		},
		{
			label: __( 'Manitoba', 'storeengine' ),
			value: 'MB',
		},
		{
			label: __( 'New Brunswick', 'storeengine' ),
			value: 'NB',
		},
		{
			label: __( 'Newfoundland and Labrador', 'storeengine' ),
			value: 'NL',
		},
		{
			label: __( 'Northwest Territories', 'storeengine' ),
			value: 'NT',
		},
		{
			label: __( 'Nova Scotia', 'storeengine' ),
			value: 'NS',
		},
		{
			label: __( 'Nunavut', 'storeengine' ),
			value: 'NU',
		},
		{
			label: __( 'Ontario', 'storeengine' ),
			value: 'ON',
		},
		{
			label: __( 'Prince Edward Island', 'storeengine' ),
			value: 'PE',
		},
		{
			label: __( 'Quebec', 'storeengine' ),
			value: 'QC',
		},
		{
			label: __( 'Saskatchewan', 'storeengine' ),
			value: 'SK',
		},
		{
			label: __( 'Yukon Territory', 'storeengine' ),
			value: 'YT',
		},
	],
	CH: [
		// Swiss cantons.
		{
			label: __( 'Aargau', 'storeengine' ),
			value: 'AG',
		},
		{
			label: __( 'Appenzell Ausserrhoden', 'storeengine' ),
			value: 'AR',
		},
		{
			label: __( 'Appenzell Innerrhoden', 'storeengine' ),
			value: 'AI',
		},
		{
			label: __( 'Basel-Landschaft', 'storeengine' ),
			value: 'BL',
		},
		{
			label: __( 'Basel-Stadt', 'storeengine' ),
			value: 'BS',
		},
		{
			label: __( 'Bern', 'storeengine' ),
			value: 'BE',
		},
		{
			label: __( 'Fribourg', 'storeengine' ),
			value: 'FR',
		},
		{
			label: __( 'Geneva', 'storeengine' ),
			value: 'GE',
		},
		{
			label: __( 'Glarus', 'storeengine' ),
			value: 'GL',
		},
		{
			label: __( 'Graubünden', 'storeengine' ),
			value: 'GR',
		},
		{
			label: __( 'Jura', 'storeengine' ),
			value: 'JU',
		},
		{
			label: __( 'Luzern', 'storeengine' ),
			value: 'LU',
		},
		{
			label: __( 'Neuchâtel', 'storeengine' ),
			value: 'NE',
		},
		{
			label: __( 'Nidwalden', 'storeengine' ),
			value: 'NW',
		},
		{
			label: __( 'Obwalden', 'storeengine' ),
			value: 'OW',
		},
		{
			label: __( 'Schaffhausen', 'storeengine' ),
			value: 'SH',
		},
		{
			label: __( 'Schwyz', 'storeengine' ),
			value: 'SZ',
		},
		{
			label: __( 'Solothurn', 'storeengine' ),
			value: 'SO',
		},
		{
			label: __( 'St. Gallen', 'storeengine' ),
			value: 'SG',
		},
		{
			label: __( 'Thurgau', 'storeengine' ),
			value: 'TG',
		},
		{
			label: __( 'Ticino', 'storeengine' ),
			value: 'TI',
		},
		{
			label: __( 'Uri', 'storeengine' ),
			value: 'UR',
		},
		{
			label: __( 'Valais', 'storeengine' ),
			value: 'VS',
		},
		{
			label: __( 'Vaud', 'storeengine' ),
			value: 'VD',
		},
		{
			label: __( 'Zug', 'storeengine' ),
			value: 'ZG',
		},
		{
			label: __( 'Zürich', 'storeengine' ),
			value: 'ZH',
		},
	],
	CL: [
		// Chilean states.
		{
			label: __(
				'Aisén del General Carlos Ibañez del Campo',
				'storeengine'
			),
			value: 'CL-AI',
		},
		{
			label: __( 'Antofagasta', 'storeengine' ),
			value: 'CL-AN',
		},
		{
			label: __( 'Arica y Parinacota', 'storeengine' ),
			value: 'CL-AP',
		},
		{
			label: __( 'La Araucanía', 'storeengine' ),
			value: 'CL-AR',
		},
		{
			label: __( 'Atacama', 'storeengine' ),
			value: 'CL-AT',
		},
		{
			label: __( 'Biobío', 'storeengine' ),
			value: 'CL-BI',
		},
		{
			label: __( 'Coquimbo', 'storeengine' ),
			value: 'CL-CO',
		},
		{
			label: __( "Libertador General Bernardo O'Higgins", 'storeengine' ),
			value: 'CL-LI',
		},
		{
			label: __( 'Los Lagos', 'storeengine' ),
			value: 'CL-LL',
		},
		{
			label: __( 'Los Ríos', 'storeengine' ),
			value: 'CL-LR',
		},
		{
			label: __( 'Magallanes', 'storeengine' ),
			value: 'CL-MA',
		},
		{
			label: __( 'Maule', 'storeengine' ),
			value: 'CL-ML',
		},
		{
			label: __( 'Ñuble', 'storeengine' ),
			value: 'CL-NB',
		},
		{
			label: __( 'Región Metropolitana de Santiago', 'storeengine' ),
			value: 'CL-RM',
		},
		{
			label: __( 'Tarapacá', 'storeengine' ),
			value: 'CL-TA',
		},
		{
			label: __( 'Valparaíso', 'storeengine' ),
			value: 'CL-VS',
		},
	],
	CN: [
		// Chinese states.
		{
			label: __( 'Yunnan / 云南', 'storeengine' ),
			value: 'CN1',
		},
		{
			label: __( 'Beijing / 北京', 'storeengine' ),
			value: 'CN2',
		},
		{
			label: __( 'Tianjin / 天津', 'storeengine' ),
			value: 'CN3',
		},
		{
			label: __( 'Hebei / 河北', 'storeengine' ),
			value: 'CN4',
		},
		{
			label: __( 'Shanxi / 山西', 'storeengine' ),
			value: 'CN5',
		},
		{
			label: __( 'Inner Mongolia / 內蒙古', 'storeengine' ),
			value: 'CN6',
		},
		{
			label: __( 'Liaoning / 辽宁', 'storeengine' ),
			value: 'CN7',
		},
		{
			label: __( 'Jilin / 吉林', 'storeengine' ),
			value: 'CN8',
		},
		{
			label: __( 'Heilongjiang / 黑龙江', 'storeengine' ),
			value: 'CN9',
		},
		{
			label: __( 'Shanghai / 上海', 'storeengine' ),
			value: 'CN10',
		},
		{
			label: __( 'Jiangsu / 江苏', 'storeengine' ),
			value: 'CN11',
		},
		{
			label: __( 'Zhejiang / 浙江', 'storeengine' ),
			value: 'CN12',
		},
		{
			label: __( 'Anhui / 安徽', 'storeengine' ),
			value: 'CN13',
		},
		{
			label: __( 'Fujian / 福建', 'storeengine' ),
			value: 'CN14',
		},
		{
			label: __( 'Jiangxi / 江西', 'storeengine' ),
			value: 'CN15',
		},
		{
			label: __( 'Shandong / 山东', 'storeengine' ),
			value: 'CN16',
		},
		{
			label: __( 'Henan / 河南', 'storeengine' ),
			value: 'CN17',
		},
		{
			label: __( 'Hubei / 湖北', 'storeengine' ),
			value: 'CN18',
		},
		{
			label: __( 'Hunan / 湖南', 'storeengine' ),
			value: 'CN19',
		},
		{
			label: __( 'Guangdong / 广东', 'storeengine' ),
			value: 'CN20',
		},
		{
			label: __( 'Guangxi Zhuang / 广西壮族', 'storeengine' ),
			value: 'CN21',
		},
		{
			label: __( 'Hainan / 海南', 'storeengine' ),
			value: 'CN22',
		},
		{
			label: __( 'Chongqing / 重庆', 'storeengine' ),
			value: 'CN23',
		},
		{
			label: __( 'Sichuan / 四川', 'storeengine' ),
			value: 'CN24',
		},
		{
			label: __( 'Guizhou / 贵州', 'storeengine' ),
			value: 'CN25',
		},
		{
			label: __( 'Shaanxi / 陕西', 'storeengine' ),
			value: 'CN26',
		},
		{
			label: __( 'Gansu / 甘肃', 'storeengine' ),
			value: 'CN27',
		},
		{
			label: __( 'Qinghai / 青海', 'storeengine' ),
			value: 'CN28',
		},
		{
			label: __( 'Ningxia Hui / 宁夏', 'storeengine' ),
			value: 'CN29',
		},
		{
			label: __( 'Macao / 澳门', 'storeengine' ),
			value: 'CN30',
		},
		{
			label: __( 'Tibet / 西藏', 'storeengine' ),
			value: 'CN31',
		},
		{
			label: __( 'Xinjiang / 新疆', 'storeengine' ),
			value: 'CN32',
		},
	],
	CO: [
		// Colombian states.
		{
			label: __( 'Amazonas', 'storeengine' ),
			value: 'CO-AMA',
		},
		{
			label: __( 'Antioquia', 'storeengine' ),
			value: 'CO-ANT',
		},
		{
			label: __( 'Arauca', 'storeengine' ),
			value: 'CO-ARA',
		},
		{
			label: __( 'Atlántico', 'storeengine' ),
			value: 'CO-ATL',
		},
		{
			label: __( 'Bolívar', 'storeengine' ),
			value: 'CO-BOL',
		},
		{
			label: __( 'Boyacá', 'storeengine' ),
			value: 'CO-BOY',
		},
		{
			label: __( 'Caldas', 'storeengine' ),
			value: 'CO-CAL',
		},
		{
			label: __( 'Caquetá', 'storeengine' ),
			value: 'CO-CAQ',
		},
		{
			label: __( 'Casanare', 'storeengine' ),
			value: 'CO-CAS',
		},
		{
			label: __( 'Cauca', 'storeengine' ),
			value: 'CO-CAU',
		},
		{
			label: __( 'Cesar', 'storeengine' ),
			value: 'CO-CES',
		},
		{
			label: __( 'Chocó', 'storeengine' ),
			value: 'CO-CHO',
		},
		{
			label: __( 'Córdoba', 'storeengine' ),
			value: 'CO-COR',
		},
		{
			label: __( 'Cundinamarca', 'storeengine' ),
			value: 'CO-CUN',
		},
		{
			label: __( 'Capital District', 'storeengine' ),
			value: 'CO-DC',
		},
		{
			label: __( 'Guainía', 'storeengine' ),
			value: 'CO-GUA',
		},
		{
			label: __( 'Guaviare', 'storeengine' ),
			value: 'CO-GUV',
		},
		{
			label: __( 'Huila', 'storeengine' ),
			value: 'CO-HUI',
		},
		{
			label: __( 'La Guajira', 'storeengine' ),
			value: 'CO-LAG',
		},
		{
			label: __( 'Magdalena', 'storeengine' ),
			value: 'CO-MAG',
		},
		{
			label: __( 'Meta', 'storeengine' ),
			value: 'CO-MET',
		},
		{
			label: __( 'Nariño', 'storeengine' ),
			value: 'CO-NAR',
		},
		{
			label: __( 'Norte de Santander', 'storeengine' ),
			value: 'CO-NSA',
		},
		{
			label: __( 'Putumayo', 'storeengine' ),
			value: 'CO-PUT',
		},
		{
			label: __( 'Quindío', 'storeengine' ),
			value: 'CO-QUI',
		},
		{
			label: __( 'Risaralda', 'storeengine' ),
			value: 'CO-RIS',
		},
		{
			label: __( 'Santander', 'storeengine' ),
			value: 'CO-SAN',
		},
		{
			label: __( 'San Andrés & Providencia', 'storeengine' ),
			value: 'CO-SAP',
		},
		{
			label: __( 'Sucre', 'storeengine' ),
			value: 'CO-SUC',
		},
		{
			label: __( 'Tolima', 'storeengine' ),
			value: 'CO-TOL',
		},
		{
			label: __( 'Valle del Cauca', 'storeengine' ),
			value: 'CO-VAC',
		},
		{
			label: __( 'Vaupés', 'storeengine' ),
			value: 'CO-VAU',
		},
		{
			label: __( 'Vichada', 'storeengine' ),
			value: 'CO-VID',
		},
	],
	CR: [
		// Costa Rican states.
		{
			label: __( 'Alajuela', 'storeengine' ),
			value: 'CR-A',
		},
		{
			label: __( 'Cartago', 'storeengine' ),
			value: 'CR-C',
		},
		{
			label: __( 'Guanacaste', 'storeengine' ),
			value: 'CR-G',
		},
		{
			label: __( 'Heredia', 'storeengine' ),
			value: 'CR-H',
		},
		{
			label: __( 'Limón', 'storeengine' ),
			value: 'CR-L',
		},
		{
			label: __( 'Puntarenas', 'storeengine' ),
			value: 'CR-P',
		},
		{
			label: __( 'San José', 'storeengine' ),
			value: 'CR-SJ',
		},
	],
	CZ: [],
	DE: [
		// German states.
		{
			label: __( 'Baden-Württemberg', 'storeengine' ),
			value: 'DE-BW',
		},
		{
			label: __( 'Bavaria', 'storeengine' ),
			value: 'DE-BY',
		},
		{
			label: __( 'Berlin', 'storeengine' ),
			value: 'DE-BE',
		},
		{
			label: __( 'Brandenburg', 'storeengine' ),
			value: 'DE-BB',
		},
		{
			label: __( 'Bremen', 'storeengine' ),
			value: 'DE-HB',
		},
		{
			label: __( 'Hamburg', 'storeengine' ),
			value: 'DE-HH',
		},
		{
			label: __( 'Hesse', 'storeengine' ),
			value: 'DE-HE',
		},
		{
			label: __( 'Mecklenburg-Vorpommern', 'storeengine' ),
			value: 'DE-MV',
		},
		{
			label: __( 'Lower Saxony', 'storeengine' ),
			value: 'DE-NI',
		},
		{
			label: __( 'North Rhine-Westphalia', 'storeengine' ),
			value: 'DE-NW',
		},
		{
			label: __( 'Rhineland-Palatinate', 'storeengine' ),
			value: 'DE-RP',
		},
		{
			label: __( 'Saarland', 'storeengine' ),
			value: 'DE-SL',
		},
		{
			label: __( 'Saxony', 'storeengine' ),
			value: 'DE-SN',
		},
		{
			label: __( 'Saxony-Anhalt', 'storeengine' ),
			value: 'DE-ST',
		},
		{
			label: __( 'Schleswig-Holstein', 'storeengine' ),
			value: 'DE-SH',
		},
		{
			label: __( 'Thuringia', 'storeengine' ),
			value: 'DE-TH',
		},
	],
	DK: [],
	DO: [
		// Dominican states.
		{
			label: __( 'Distrito Nacional', 'storeengine' ),
			value: 'DO-01',
		},
		{
			label: __( 'Azua', 'storeengine' ),
			value: 'DO-02',
		},
		{
			label: __( 'Baoruco', 'storeengine' ),
			value: 'DO-03',
		},
		{
			label: __( 'Barahona', 'storeengine' ),
			value: 'DO-04',
		},
		{
			label: __( 'Cibao Nordeste', 'storeengine' ),
			value: 'DO-33',
		},
		{
			label: __( 'Cibao Noroeste', 'storeengine' ),
			value: 'DO-34',
		},
		{
			label: __( 'Cibao Norte', 'storeengine' ),
			value: 'DO-35',
		},
		{
			label: __( 'Cibao Sur', 'storeengine' ),
			value: 'DO-36',
		},
		{
			label: __( 'Dajabón', 'storeengine' ),
			value: 'DO-05',
		},
		{
			label: __( 'Duarte', 'storeengine' ),
			value: 'DO-06',
		},
		{
			label: __( 'El Seibo', 'storeengine' ),
			value: 'DO-08',
		},
		{
			label: __( 'El Valle', 'storeengine' ),
			value: 'DO-37',
		},
		{
			label: __( 'Elías Piña', 'storeengine' ),
			value: 'DO-07',
		},
		{
			label: __( 'Enriquillo', 'storeengine' ),
			value: 'DO-38',
		},
		{
			label: __( 'Espaillat', 'storeengine' ),
			value: 'DO-09',
		},
		{
			label: __( 'Hato Mayor', 'storeengine' ),
			value: 'DO-30',
		},
		{
			label: __( 'Hermanas Mirabal', 'storeengine' ),
			value: 'DO-19',
		},
		{
			label: __( 'Higüamo', 'storeengine' ),
			value: 'DO-39',
		},
		{
			label: __( 'Independencia', 'storeengine' ),
			value: 'DO-10',
		},
		{
			label: __( 'La Altagracia', 'storeengine' ),
			value: 'DO-11',
		},
		{
			label: __( 'La Romana', 'storeengine' ),
			value: 'DO-12',
		},
		{
			label: __( 'La Vega', 'storeengine' ),
			value: 'DO-13',
		},
		{
			label: __( 'María Trinidad Sánchez', 'storeengine' ),
			value: 'DO-14',
		},
		{
			label: __( 'Monseñor Nouel', 'storeengine' ),
			value: 'DO-28',
		},
		{
			label: __( 'Monte Cristi', 'storeengine' ),
			value: 'DO-15',
		},
		{
			label: __( 'Monte Plata', 'storeengine' ),
			value: 'DO-29',
		},
		{
			label: __( 'Ozama', 'storeengine' ),
			value: 'DO-40',
		},
		{
			label: __( 'Pedernales', 'storeengine' ),
			value: 'DO-16',
		},
		{
			label: __( 'Peravia', 'storeengine' ),
			value: 'DO-17',
		},
		{
			label: __( 'Puerto Plata', 'storeengine' ),
			value: 'DO-18',
		},
		{
			label: __( 'Samaná', 'storeengine' ),
			value: 'DO-20',
		},
		{
			label: __( 'San Cristóbal', 'storeengine' ),
			value: 'DO-21',
		},
		{
			label: __( 'San José de Ocoa', 'storeengine' ),
			value: 'DO-31',
		},
		{
			label: __( 'San Juan', 'storeengine' ),
			value: 'DO-22',
		},
		{
			label: __( 'San Pedro de Macorís', 'storeengine' ),
			value: 'DO-23',
		},
		{
			label: __( 'Sánchez Ramírez', 'storeengine' ),
			value: 'DO-24',
		},
		{
			label: __( 'Santiago', 'storeengine' ),
			value: 'DO-25',
		},
		{
			label: __( 'Santiago Rodríguez', 'storeengine' ),
			value: 'DO-26',
		},
		{
			label: __( 'Santo Domingo', 'storeengine' ),
			value: 'DO-32',
		},
		{
			label: __( 'Valdesia', 'storeengine' ),
			value: 'DO-41',
		},
		{
			label: __( 'Valverde', 'storeengine' ),
			value: 'DO-27',
		},
		{
			label: __( 'Yuma', 'storeengine' ),
			value: 'DO-42',
		},
	],
	DZ: [
		// Algerian states.
		{
			label: __( 'Adrar', 'storeengine' ),
			value: 'DZ-01',
		},
		{
			label: __( 'Chlef', 'storeengine' ),
			value: 'DZ-02',
		},
		{
			label: __( 'Laghouat', 'storeengine' ),
			value: 'DZ-03',
		},
		{
			label: __( 'Oum El Bouaghi', 'storeengine' ),
			value: 'DZ-04',
		},
		{
			label: __( 'Batna', 'storeengine' ),
			value: 'DZ-05',
		},
		{
			label: __( 'Béjaïa', 'storeengine' ),
			value: 'DZ-06',
		},
		{
			label: __( 'Biskra', 'storeengine' ),
			value: 'DZ-07',
		},
		{
			label: __( 'Béchar', 'storeengine' ),
			value: 'DZ-08',
		},
		{
			label: __( 'Blida', 'storeengine' ),
			value: 'DZ-09',
		},
		{
			label: __( 'Bouira', 'storeengine' ),
			value: 'DZ-10',
		},
		{
			label: __( 'Tamanghasset', 'storeengine' ),
			value: 'DZ-11',
		},
		{
			label: __( 'Tébessa', 'storeengine' ),
			value: 'DZ-12',
		},
		{
			label: __( 'Tlemcen', 'storeengine' ),
			value: 'DZ-13',
		},
		{
			label: __( 'Tiaret', 'storeengine' ),
			value: 'DZ-14',
		},
		{
			label: __( 'Tizi Ouzou', 'storeengine' ),
			value: 'DZ-15',
		},
		{
			label: __( 'Algiers', 'storeengine' ),
			value: 'DZ-16',
		},
		{
			label: __( 'Djelfa', 'storeengine' ),
			value: 'DZ-17',
		},
		{
			label: __( 'Jijel', 'storeengine' ),
			value: 'DZ-18',
		},
		{
			label: __( 'Sétif', 'storeengine' ),
			value: 'DZ-19',
		},
		{
			label: __( 'Saïda', 'storeengine' ),
			value: 'DZ-20',
		},
		{
			label: __( 'Skikda', 'storeengine' ),
			value: 'DZ-21',
		},
		{
			label: __( 'Sidi Bel Abbès', 'storeengine' ),
			value: 'DZ-22',
		},
		{
			label: __( 'Annaba', 'storeengine' ),
			value: 'DZ-23',
		},
		{
			label: __( 'Guelma', 'storeengine' ),
			value: 'DZ-24',
		},
		{
			label: __( 'Constantine', 'storeengine' ),
			value: 'DZ-25',
		},
		{
			label: __( 'Médéa', 'storeengine' ),
			value: 'DZ-26',
		},
		{
			label: __( 'Mostaganem', 'storeengine' ),
			value: 'DZ-27',
		},
		{
			label: __( 'M’Sila', 'storeengine' ),
			value: 'DZ-28',
		},
		{
			label: __( 'Mascara', 'storeengine' ),
			value: 'DZ-29',
		},
		{
			label: __( 'Ouargla', 'storeengine' ),
			value: 'DZ-30',
		},
		{
			label: __( 'Oran', 'storeengine' ),
			value: 'DZ-31',
		},
		{
			label: __( 'El Bayadh', 'storeengine' ),
			value: 'DZ-32',
		},
		{
			label: __( 'Illizi', 'storeengine' ),
			value: 'DZ-33',
		},
		{
			label: __( 'Bordj Bou Arréridj', 'storeengine' ),
			value: 'DZ-34',
		},
		{
			label: __( 'Boumerdès', 'storeengine' ),
			value: 'DZ-35',
		},
		{
			label: __( 'El Tarf', 'storeengine' ),
			value: 'DZ-36',
		},
		{
			label: __( 'Tindouf', 'storeengine' ),
			value: 'DZ-37',
		},
		{
			label: __( 'Tissemsilt', 'storeengine' ),
			value: 'DZ-38',
		},
		{
			label: __( 'El Oued', 'storeengine' ),
			value: 'DZ-39',
		},
		{
			label: __( 'Khenchela', 'storeengine' ),
			value: 'DZ-40',
		},
		{
			label: __( 'Souk Ahras', 'storeengine' ),
			value: 'DZ-41',
		},
		{
			label: __( 'Tipasa', 'storeengine' ),
			value: 'DZ-42',
		},
		{
			label: __( 'Mila', 'storeengine' ),
			value: 'DZ-43',
		},
		{
			label: __( 'Aïn Defla', 'storeengine' ),
			value: 'DZ-44',
		},
		{
			label: __( 'Naama', 'storeengine' ),
			value: 'DZ-45',
		},
		{
			label: __( 'Aïn Témouchent', 'storeengine' ),
			value: 'DZ-46',
		},
		{
			label: __( 'Ghardaïa', 'storeengine' ),
			value: 'DZ-47',
		},
		{
			label: __( 'Relizane', 'storeengine' ),
			value: 'DZ-48',
		},
	],
	EE: [],
	EC: [
		// Ecuadorian states.
		{
			label: __( 'Azuay', 'storeengine' ),
			value: 'EC-A',
		},
		{
			label: __( 'Bolívar', 'storeengine' ),
			value: 'EC-B',
		},
		{
			label: __( 'Cañar', 'storeengine' ),
			value: 'EC-F',
		},
		{
			label: __( 'Carchi', 'storeengine' ),
			value: 'EC-C',
		},
		{
			label: __( 'Chimborazo', 'storeengine' ),
			value: 'EC-H',
		},
		{
			label: __( 'Cotopaxi', 'storeengine' ),
			value: 'EC-X',
		},
		{
			label: __( 'El Oro', 'storeengine' ),
			value: 'EC-O',
		},
		{
			label: __( 'Esmeraldas', 'storeengine' ),
			value: 'EC-E',
		},
		{
			label: __( 'Galápagos', 'storeengine' ),
			value: 'EC-W',
		},
		{
			label: __( 'Guayas', 'storeengine' ),
			value: 'EC-G',
		},
		{
			label: __( 'Imbabura', 'storeengine' ),
			value: 'EC-I',
		},
		{
			label: __( 'Loja', 'storeengine' ),
			value: 'EC-L',
		},
		{
			label: __( 'Los Ríos', 'storeengine' ),
			value: 'EC-R',
		},
		{
			label: __( 'Manabí', 'storeengine' ),
			value: 'EC-M',
		},
		{
			label: __( 'Morona-Santiago', 'storeengine' ),
			value: 'EC-S',
		},
		{
			label: __( 'Napo', 'storeengine' ),
			value: 'EC-N',
		},
		{
			label: __( 'Orellana', 'storeengine' ),
			value: 'EC-D',
		},
		{
			label: __( 'Pastaza', 'storeengine' ),
			value: 'EC-Y',
		},
		{
			label: __( 'Pichincha', 'storeengine' ),
			value: 'EC-P',
		},
		{
			label: __( 'Santa Elena', 'storeengine' ),
			value: 'EC-SE',
		},
		{
			label: __( 'Santo Domingo de los Tsáchilas', 'storeengine' ),
			value: 'EC-SD',
		},
		{
			label: __( 'Sucumbíos', 'storeengine' ),
			value: 'EC-U',
		},
		{
			label: __( 'Tungurahua', 'storeengine' ),
			value: 'EC-T',
		},
		{
			label: __( 'Zamora-Chinchipe', 'storeengine' ),
			value: 'EC-Z',
		},
	],
	EG: [
		// Egyptian states.
		{
			label: __( 'Alexandria', 'storeengine' ),
			value: 'EGALX',
		},
		{
			label: __( 'Aswan', 'storeengine' ),
			value: 'EGASN',
		},
		{
			label: __( 'Asyut', 'storeengine' ),
			value: 'EGAST',
		},
		{
			label: __( 'Red Sea', 'storeengine' ),
			value: 'EGBA',
		},
		{
			label: __( 'Beheira', 'storeengine' ),
			value: 'EGBH',
		},
		{
			label: __( 'Beni Suef', 'storeengine' ),
			value: 'EGBNS',
		},
		{
			label: __( 'Cairo', 'storeengine' ),
			value: 'EGC',
		},
		{
			label: __( 'Dakahlia', 'storeengine' ),
			value: 'EGDK',
		},
		{
			label: __( 'Damietta', 'storeengine' ),
			value: 'EGDT',
		},
		{
			label: __( 'Faiyum', 'storeengine' ),
			value: 'EGFYM',
		},
		{
			label: __( 'Gharbia', 'storeengine' ),
			value: 'EGGH',
		},
		{
			label: __( 'Giza', 'storeengine' ),
			value: 'EGGZ',
		},
		{
			label: __( 'Ismailia', 'storeengine' ),
			value: 'EGIS',
		},
		{
			label: __( 'South Sinai', 'storeengine' ),
			value: 'EGJS',
		},
		{
			label: __( 'Qalyubia', 'storeengine' ),
			value: 'EGKB',
		},
		{
			label: __( 'Kafr el-Sheikh', 'storeengine' ),
			value: 'EGKFS',
		},
		{
			label: __( 'Qena', 'storeengine' ),
			value: 'EGKN',
		},
		{
			label: __( 'Luxor', 'storeengine' ),
			value: 'EGLX',
		},
		{
			label: __( 'Minya', 'storeengine' ),
			value: 'EGMN',
		},
		{
			label: __( 'Monufia', 'storeengine' ),
			value: 'EGMNF',
		},
		{
			label: __( 'Matrouh', 'storeengine' ),
			value: 'EGMT',
		},
		{
			label: __( 'Port Said', 'storeengine' ),
			value: 'EGPTS',
		},
		{
			label: __( 'Sohag', 'storeengine' ),
			value: 'EGSHG',
		},
		{
			label: __( 'Al Sharqia', 'storeengine' ),
			value: 'EGSHR',
		},
		{
			label: __( 'North Sinai', 'storeengine' ),
			value: 'EGSIN',
		},
		{
			label: __( 'Suez', 'storeengine' ),
			value: 'EGSUZ',
		},
		{
			label: __( 'New Valley', 'storeengine' ),
			value: 'EGWAD',
		},
	],
	ES: [
		// Spanish states.
		{
			label: __( 'A Coruña', 'storeengine' ),
			value: 'C',
		},
		{
			label: __( 'Araba/Álava', 'storeengine' ),
			value: 'VI',
		},
		{
			label: __( 'Albacete', 'storeengine' ),
			value: 'AB',
		},
		{
			label: __( 'Alicante', 'storeengine' ),
			value: 'A',
		},
		{
			label: __( 'Almería', 'storeengine' ),
			value: 'AL',
		},
		{
			label: __( 'Asturias', 'storeengine' ),
			value: 'O',
		},
		{
			label: __( 'Ávila', 'storeengine' ),
			value: 'AV',
		},
		{
			label: __( 'Badajoz', 'storeengine' ),
			value: 'BA',
		},
		{
			label: __( 'Baleares', 'storeengine' ),
			value: 'PM',
		},
		{
			label: __( 'Barcelona', 'storeengine' ),
			value: 'B',
		},
		{
			label: __( 'Burgos', 'storeengine' ),
			value: 'BU',
		},
		{
			label: __( 'Cáceres', 'storeengine' ),
			value: 'CC',
		},
		{
			label: __( 'Cádiz', 'storeengine' ),
			value: 'CA',
		},
		{
			label: __( 'Cantabria', 'storeengine' ),
			value: 'S',
		},
		{
			label: __( 'Castellón', 'storeengine' ),
			value: 'CS',
		},
		{
			label: __( 'Ceuta', 'storeengine' ),
			value: 'CE',
		},
		{
			label: __( 'Ciudad Real', 'storeengine' ),
			value: 'CR',
		},
		{
			label: __( 'Córdoba', 'storeengine' ),
			value: 'CO',
		},
		{
			label: __( 'Cuenca', 'storeengine' ),
			value: 'CU',
		},
		{
			label: __( 'Girona', 'storeengine' ),
			value: 'GI',
		},
		{
			label: __( 'Granada', 'storeengine' ),
			value: 'GR',
		},
		{
			label: __( 'Guadalajara', 'storeengine' ),
			value: 'GU',
		},
		{
			label: __( 'Gipuzkoa', 'storeengine' ),
			value: 'SS',
		},
		{
			label: __( 'Huelva', 'storeengine' ),
			value: 'H',
		},
		{
			label: __( 'Huesca', 'storeengine' ),
			value: 'HU',
		},
		{
			label: __( 'Jaén', 'storeengine' ),
			value: 'J',
		},
		{
			label: __( 'La Rioja', 'storeengine' ),
			value: 'LO',
		},
		{
			label: __( 'Las Palmas', 'storeengine' ),
			value: 'GC',
		},
		{
			label: __( 'León', 'storeengine' ),
			value: 'LE',
		},
		{
			label: __( 'Lleida', 'storeengine' ),
			value: 'L',
		},
		{
			label: __( 'Lugo', 'storeengine' ),
			value: 'LU',
		},
		{
			label: __( 'Madrid', 'storeengine' ),
			value: 'M',
		},
		{
			label: __( 'Málaga', 'storeengine' ),
			value: 'MA',
		},
		{
			label: __( 'Melilla', 'storeengine' ),
			value: 'ML',
		},
		{
			label: __( 'Murcia', 'storeengine' ),
			value: 'MU',
		},
		{
			label: __( 'Navarra', 'storeengine' ),
			value: 'NA',
		},
		{
			label: __( 'Ourense', 'storeengine' ),
			value: 'OR',
		},
		{
			label: __( 'Palencia', 'storeengine' ),
			value: 'P',
		},
		{
			label: __( 'Pontevedra', 'storeengine' ),
			value: 'PO',
		},
		{
			label: __( 'Salamanca', 'storeengine' ),
			value: 'SA',
		},
		{
			label: __( 'Santa Cruz de Tenerife', 'storeengine' ),
			value: 'TF',
		},
		{
			label: __( 'Segovia', 'storeengine' ),
			value: 'SG',
		},
		{
			label: __( 'Sevilla', 'storeengine' ),
			value: 'SE',
		},
		{
			label: __( 'Soria', 'storeengine' ),
			value: 'SO',
		},
		{
			label: __( 'Tarragona', 'storeengine' ),
			value: 'T',
		},
		{
			label: __( 'Teruel', 'storeengine' ),
			value: 'TE',
		},
		{
			label: __( 'Toledo', 'storeengine' ),
			value: 'TO',
		},
		{
			label: __( 'Valencia', 'storeengine' ),
			value: 'V',
		},
		{
			label: __( 'Valladolid', 'storeengine' ),
			value: 'VA',
		},
		{
			label: __( 'Biscay', 'storeengine' ),
			value: 'BI',
		},
		{
			label: __( 'Zamora', 'storeengine' ),
			value: 'ZA',
		},
		{
			label: __( 'Zaragoza', 'storeengine' ),
			value: 'Z',
		},
	],
	ET: [],
	FI: [],
	FR: [],
	GF: [],
	GH: [
		// Ghanaian regions.
		{
			label: __( 'Ahafo', 'storeengine' ),
			value: 'AF',
		},
		{
			label: __( 'Ashanti', 'storeengine' ),
			value: 'AH',
		},
		{
			label: __( 'Brong-Ahafo', 'storeengine' ),
			value: 'BA',
		},
		{
			label: __( 'Bono', 'storeengine' ),
			value: 'BO',
		},
		{
			label: __( 'Bono East', 'storeengine' ),
			value: 'BE',
		},
		{
			label: __( 'Central', 'storeengine' ),
			value: 'CP',
		},
		{
			label: __( 'Eastern', 'storeengine' ),
			value: 'EP',
		},
		{
			label: __( 'Greater Accra', 'storeengine' ),
			value: 'AA',
		},
		{
			label: __( 'North East', 'storeengine' ),
			value: 'NE',
		},
		{
			label: __( 'Northern', 'storeengine' ),
			value: 'NP',
		},
		{
			label: __( 'Oti', 'storeengine' ),
			value: 'OT',
		},
		{
			label: __( 'Savannah', 'storeengine' ),
			value: 'SV',
		},
		{
			label: __( 'Upper East', 'storeengine' ),
			value: 'UE',
		},
		{
			label: __( 'Upper West', 'storeengine' ),
			value: 'UW',
		},
		{
			label: __( 'Volta', 'storeengine' ),
			value: 'TV',
		},
		{
			label: __( 'Western', 'storeengine' ),
			value: 'WP',
		},
		{
			label: __( 'Western North', 'storeengine' ),
			value: 'WN',
		},
	],
	GP: [],
	GR: [
		// Greek regions.
		{
			label: __( 'Attica', 'storeengine' ),
			value: 'I',
		},
		{
			label: __( 'East Macedonia and Thrace', 'storeengine' ),
			value: 'A',
		},
		{
			label: __( 'Central Macedonia', 'storeengine' ),
			value: 'B',
		},
		{
			label: __( 'West Macedonia', 'storeengine' ),
			value: 'C',
		},
		{
			label: __( 'Epirus', 'storeengine' ),
			value: 'D',
		},
		{
			label: __( 'Thessaly', 'storeengine' ),
			value: 'E',
		},
		{
			label: __( 'Ionian Islands', 'storeengine' ),
			value: 'F',
		},
		{
			label: __( 'West Greece', 'storeengine' ),
			value: 'G',
		},
		{
			label: __( 'Central Greece', 'storeengine' ),
			value: 'H',
		},
		{
			label: __( 'Peloponnese', 'storeengine' ),
			value: 'J',
		},
		{
			label: __( 'North Aegean', 'storeengine' ),
			value: 'K',
		},
		{
			label: __( 'South Aegean', 'storeengine' ),
			value: 'L',
		},
		{
			label: __( 'Crete', 'storeengine' ),
			value: 'M',
		},
	],
	GT: [
		// Guatemalan states.
		{
			label: __( 'Alta Verapaz', 'storeengine' ),
			value: 'GT-AV',
		},
		{
			label: __( 'Baja Verapaz', 'storeengine' ),
			value: 'GT-BV',
		},
		{
			label: __( 'Chimaltenango', 'storeengine' ),
			value: 'GT-CM',
		},
		{
			label: __( 'Chiquimula', 'storeengine' ),
			value: 'GT-CQ',
		},
		{
			label: __( 'El Progreso', 'storeengine' ),
			value: 'GT-PR',
		},
		{
			label: __( 'Escuintla', 'storeengine' ),
			value: 'GT-ES',
		},
		{
			label: __( 'Guatemala', 'storeengine' ),
			value: 'GT-GU',
		},
		{
			label: __( 'Huehuetenango', 'storeengine' ),
			value: 'GT-HU',
		},
		{
			label: __( 'Izabal', 'storeengine' ),
			value: 'GT-IZ',
		},
		{
			label: __( 'Jalapa', 'storeengine' ),
			value: 'GT-JA',
		},
		{
			label: __( 'Jutiapa', 'storeengine' ),
			value: 'GT-JU',
		},
		{
			label: __( 'Petén', 'storeengine' ),
			value: 'GT-PE',
		},
		{
			label: __( 'Quetzaltenango', 'storeengine' ),
			value: 'GT-QZ',
		},
		{
			label: __( 'Quiché', 'storeengine' ),
			value: 'GT-QC',
		},
		{
			label: __( 'Retalhuleu', 'storeengine' ),
			value: 'GT-RE',
		},
		{
			label: __( 'Sacatepéquez', 'storeengine' ),
			value: 'GT-SA',
		},
		{
			label: __( 'San Marcos', 'storeengine' ),
			value: 'GT-SM',
		},
		{
			label: __( 'Santa Rosa', 'storeengine' ),
			value: 'GT-SR',
		},
		{
			label: __( 'Sololá', 'storeengine' ),
			value: 'GT-SO',
		},
		{
			label: __( 'Suchitepéquez', 'storeengine' ),
			value: 'GT-SU',
		},
		{
			label: __( 'Totonicapán', 'storeengine' ),
			value: 'GT-TO',
		},
		{
			label: __( 'Zacapa', 'storeengine' ),
			value: 'GT-ZA',
		},
	],
	HK: [
		// Hong Kong states.
		{
			label: __( 'Hong Kong Island', 'storeengine' ),
			value: 'HONG KONG',
		},
		{
			label: __( 'Kowloon', 'storeengine' ),
			value: 'KOWLOON',
		},
		{
			label: __( 'New Territories', 'storeengine' ),
			value: 'NEW TERRITORIES',
		},
	],
	HN: [
		// Honduran states.
		{
			label: __( 'Atlántida', 'storeengine' ),
			value: 'HN-AT',
		},
		{
			label: __( 'Bay Islands', 'storeengine' ),
			value: 'HN-IB',
		},
		{
			label: __( 'Choluteca', 'storeengine' ),
			value: 'HN-CH',
		},
		{
			label: __( 'Colón', 'storeengine' ),
			value: 'HN-CL',
		},
		{
			label: __( 'Comayagua', 'storeengine' ),
			value: 'HN-CM',
		},
		{
			label: __( 'Copán', 'storeengine' ),
			value: 'HN-CP',
		},
		{
			label: __( 'Cortés', 'storeengine' ),
			value: 'HN-CR',
		},
		{
			label: __( 'El Paraíso', 'storeengine' ),
			value: 'HN-EP',
		},
		{
			label: __( 'Francisco Morazán', 'storeengine' ),
			value: 'HN-FM',
		},
		{
			label: __( 'Gracias a Dios', 'storeengine' ),
			value: 'HN-GD',
		},
		{
			label: __( 'Intibucá', 'storeengine' ),
			value: 'HN-IN',
		},
		{
			label: __( 'Lempira', 'storeengine' ),
			value: 'HN-LE',
		},
		{
			label: __( 'La Paz', 'storeengine' ),
			value: 'HN-LP',
		},
		{
			label: __( 'Ocotepeque', 'storeengine' ),
			value: 'HN-OC',
		},
		{
			label: __( 'Olancho', 'storeengine' ),
			value: 'HN-OL',
		},
		{
			label: __( 'Santa Bárbara', 'storeengine' ),
			value: 'HN-SB',
		},
		{
			label: __( 'Valle', 'storeengine' ),
			value: 'HN-VA',
		},
		{
			label: __( 'Yoro', 'storeengine' ),
			value: 'HN-YO',
		},
	],
	HU: [
		// Hungarian states.
		{
			label: __( 'Bács-Kiskun', 'storeengine' ),
			value: 'BK',
		},
		{
			label: __( 'Békés', 'storeengine' ),
			value: 'BE',
		},
		{
			label: __( 'Baranya', 'storeengine' ),
			value: 'BA',
		},
		{
			label: __( 'Borsod-Abaúj-Zemplén', 'storeengine' ),
			value: 'BZ',
		},
		{
			label: __( 'Budapest', 'storeengine' ),
			value: 'BU',
		},
		{
			label: __( 'Csongrád-Csanád', 'storeengine' ),
			value: 'CS',
		},
		{
			label: __( 'Fejér', 'storeengine' ),
			value: 'FE',
		},
		{
			label: __( 'Győr-Moson-Sopron', 'storeengine' ),
			value: 'GS',
		},
		{
			label: __( 'Hajdú-Bihar', 'storeengine' ),
			value: 'HB',
		},
		{
			label: __( 'Heves', 'storeengine' ),
			value: 'HE',
		},
		{
			label: __( 'Jász-Nagykun-Szolnok', 'storeengine' ),
			value: 'JN',
		},
		{
			label: __( 'Komárom-Esztergom', 'storeengine' ),
			value: 'KE',
		},
		{
			label: __( 'Nógrád', 'storeengine' ),
			value: 'NO',
		},
		{
			label: __( 'Pest', 'storeengine' ),
			value: 'PE',
		},
		{
			label: __( 'Somogy', 'storeengine' ),
			value: 'SO',
		},
		{
			label: __( 'Szabolcs-Szatmár-Bereg', 'storeengine' ),
			value: 'SZ',
		},
		{
			label: __( 'Tolna', 'storeengine' ),
			value: 'TO',
		},
		{
			label: __( 'Vas', 'storeengine' ),
			value: 'VA',
		},
		{
			label: __( 'Veszprém', 'storeengine' ),
			value: 'VE',
		},
		{
			label: __( 'Zala', 'storeengine' ),
			value: 'ZA',
		},
	],
	ID: [
		// Indonesian provinces.
		{
			label: __( 'Daerah Istimewa Aceh', 'storeengine' ),
			value: 'AC',
		},
		{
			label: __( 'Sumatera Utara', 'storeengine' ),
			value: 'SU',
		},
		{
			label: __( 'Sumatera Barat', 'storeengine' ),
			value: 'SB',
		},
		{
			label: __( 'Riau', 'storeengine' ),
			value: 'RI',
		},
		{
			label: __( 'Kepulauan Riau', 'storeengine' ),
			value: 'KR',
		},
		{
			label: __( 'Jambi', 'storeengine' ),
			value: 'JA',
		},
		{
			label: __( 'Sumatera Selatan', 'storeengine' ),
			value: 'SS',
		},
		{
			label: __( 'Bangka Belitung', 'storeengine' ),
			value: 'BB',
		},
		{
			label: __( 'Bengkulu', 'storeengine' ),
			value: 'BE',
		},
		{
			label: __( 'Lampung', 'storeengine' ),
			value: 'LA',
		},
		{
			label: __( 'DKI Jakarta', 'storeengine' ),
			value: 'JK',
		},
		{
			label: __( 'Jawa Barat', 'storeengine' ),
			value: 'JB',
		},
		{
			label: __( 'Banten', 'storeengine' ),
			value: 'BT',
		},
		{
			label: __( 'Jawa Tengah', 'storeengine' ),
			value: 'JT',
		},
		{
			label: __( 'Jawa Timur', 'storeengine' ),
			value: 'JI',
		},
		{
			label: __( 'Daerah Istimewa Yogyakarta', 'storeengine' ),
			value: 'YO',
		},
		{
			label: __( 'Bali', 'storeengine' ),
			value: 'BA',
		},
		{
			label: __( 'Nusa Tenggara Barat', 'storeengine' ),
			value: 'NB',
		},
		{
			label: __( 'Nusa Tenggara Timur', 'storeengine' ),
			value: 'NT',
		},
		{
			label: __( 'Kalimantan Barat', 'storeengine' ),
			value: 'KB',
		},
		{
			label: __( 'Kalimantan Tengah', 'storeengine' ),
			value: 'KT',
		},
		{
			label: __( 'Kalimantan Timur', 'storeengine' ),
			value: 'KI',
		},
		{
			label: __( 'Kalimantan Selatan', 'storeengine' ),
			value: 'KS',
		},
		{
			label: __( 'Kalimantan Utara', 'storeengine' ),
			value: 'KU',
		},
		{
			label: __( 'Sulawesi Utara', 'storeengine' ),
			value: 'SA',
		},
		{
			label: __( 'Sulawesi Tengah', 'storeengine' ),
			value: 'ST',
		},
		{
			label: __( 'Sulawesi Tenggara', 'storeengine' ),
			value: 'SG',
		},
		{
			label: __( 'Sulawesi Barat', 'storeengine' ),
			value: 'SR',
		},
		{
			label: __( 'Sulawesi Selatan', 'storeengine' ),
			value: 'SN',
		},
		{
			label: __( 'Gorontalo', 'storeengine' ),
			value: 'GO',
		},
		{
			label: __( 'Maluku', 'storeengine' ),
			value: 'MA',
		},
		{
			label: __( 'Maluku Utara', 'storeengine' ),
			value: 'MU',
		},
		{
			label: __( 'Papua', 'storeengine' ),
			value: 'PA',
		},
		{
			label: __( 'Papua Barat', 'storeengine' ),
			value: 'PB',
		},
	],
	IE: [
		// Irish states.
		{
			label: __( 'Carlow', 'storeengine' ),
			value: 'CW',
		},
		{
			label: __( 'Cavan', 'storeengine' ),
			value: 'CN',
		},
		{
			label: __( 'Clare', 'storeengine' ),
			value: 'CE',
		},
		{
			label: __( 'Cork', 'storeengine' ),
			value: 'CO',
		},
		{
			label: __( 'Donegal', 'storeengine' ),
			value: 'DL',
		},
		{
			label: __( 'Dublin', 'storeengine' ),
			value: 'D',
		},
		{
			label: __( 'Galway', 'storeengine' ),
			value: 'G',
		},
		{
			label: __( 'Kerry', 'storeengine' ),
			value: 'KY',
		},
		{
			label: __( 'Kildare', 'storeengine' ),
			value: 'KE',
		},
		{
			label: __( 'Kilkenny', 'storeengine' ),
			value: 'KK',
		},
		{
			label: __( 'Laois', 'storeengine' ),
			value: 'LS',
		},
		{
			label: __( 'Leitrim', 'storeengine' ),
			value: 'LM',
		},
		{
			label: __( 'Limerick', 'storeengine' ),
			value: 'LK',
		},
		{
			label: __( 'Longford', 'storeengine' ),
			value: 'LD',
		},
		{
			label: __( 'Louth', 'storeengine' ),
			value: 'LH',
		},
		{
			label: __( 'Mayo', 'storeengine' ),
			value: 'MO',
		},
		{
			label: __( 'Meath', 'storeengine' ),
			value: 'MH',
		},
		{
			label: __( 'Monaghan', 'storeengine' ),
			value: 'MN',
		},
		{
			label: __( 'Offaly', 'storeengine' ),
			value: 'OY',
		},
		{
			label: __( 'Roscommon', 'storeengine' ),
			value: 'RN',
		},
		{
			label: __( 'Sligo', 'storeengine' ),
			value: 'SO',
		},
		{
			label: __( 'Tipperary', 'storeengine' ),
			value: 'TA',
		},
		{
			label: __( 'Waterford', 'storeengine' ),
			value: 'WD',
		},
		{
			label: __( 'Westmeath', 'storeengine' ),
			value: 'WH',
		},
		{
			label: __( 'Wexford', 'storeengine' ),
			value: 'WX',
		},
		{
			label: __( 'Wicklow', 'storeengine' ),
			value: 'WW',
		},
	],
	IN: [
		// Indian states.
		{
			label: __( 'Andhra Pradesh', 'storeengine' ),
			value: 'AP',
		},
		{
			label: __( 'Arunachal Pradesh', 'storeengine' ),
			value: 'AR',
		},
		{
			label: __( 'Assam', 'storeengine' ),
			value: 'AS',
		},
		{
			label: __( 'Bihar', 'storeengine' ),
			value: 'BR',
		},
		{
			label: __( 'Chhattisgarh', 'storeengine' ),
			value: 'CT',
		},
		{
			label: __( 'Goa', 'storeengine' ),
			value: 'GA',
		},
		{
			label: __( 'Gujarat', 'storeengine' ),
			value: 'GJ',
		},
		{
			label: __( 'Haryana', 'storeengine' ),
			value: 'HR',
		},
		{
			label: __( 'Himachal Pradesh', 'storeengine' ),
			value: 'HP',
		},
		{
			label: __( 'Jammu and Kashmir', 'storeengine' ),
			value: 'JK',
		},
		{
			label: __( 'Jharkhand', 'storeengine' ),
			value: 'JH',
		},
		{
			label: __( 'Karnataka', 'storeengine' ),
			value: 'KA',
		},
		{
			label: __( 'Kerala', 'storeengine' ),
			value: 'KL',
		},
		{
			label: __( 'Ladakh', 'storeengine' ),
			value: 'LA',
		},
		{
			label: __( 'Madhya Pradesh', 'storeengine' ),
			value: 'MP',
		},
		{
			label: __( 'Maharashtra', 'storeengine' ),
			value: 'MH',
		},
		{
			label: __( 'Manipur', 'storeengine' ),
			value: 'MN',
		},
		{
			label: __( 'Meghalaya', 'storeengine' ),
			value: 'ML',
		},
		{
			label: __( 'Mizoram', 'storeengine' ),
			value: 'MZ',
		},
		{
			label: __( 'Nagaland', 'storeengine' ),
			value: 'NL',
		},
		{
			label: __( 'Odisha', 'storeengine' ),
			value: 'OR',
		},
		{
			label: __( 'Punjab', 'storeengine' ),
			value: 'PB',
		},
		{
			label: __( 'Rajasthan', 'storeengine' ),
			value: 'RJ',
		},
		{
			label: __( 'Sikkim', 'storeengine' ),
			value: 'SK',
		},
		{
			label: __( 'Tamil Nadu', 'storeengine' ),
			value: 'TN',
		},
		{
			label: __( 'Telangana', 'storeengine' ),
			value: 'TS',
		},
		{
			label: __( 'Tripura', 'storeengine' ),
			value: 'TR',
		},
		{
			label: __( 'Uttarakhand', 'storeengine' ),
			value: 'UK',
		},
		{
			label: __( 'Uttar Pradesh', 'storeengine' ),
			value: 'UP',
		},
		{
			label: __( 'West Bengal', 'storeengine' ),
			value: 'WB',
		},
		{
			label: __( 'Andaman and Nicobar Islands', 'storeengine' ),
			value: 'AN',
		},
		{
			label: __( 'Chandigarh', 'storeengine' ),
			value: 'CH',
		},
		{
			label: __( 'Dadra and Nagar Haveli', 'storeengine' ),
			value: 'DN',
		},
		{
			label: __( 'Daman and Diu', 'storeengine' ),
			value: 'DD',
		},
		{
			label: __( 'Delhi', 'storeengine' ),
			value: 'DL',
		},
		{
			label: __( 'Lakshadeep', 'storeengine' ),
			value: 'LD',
		},
		{
			label: __( 'Pondicherry (Puducherry)', 'storeengine' ),
			value: 'PY',
		},
	],
	IR: [
		// Iranian states.
		{
			label: __( 'Khuzestan (خوزستان)', 'storeengine' ),
			value: 'KHZ',
		},
		{
			label: __( 'Tehran (تهران)', 'storeengine' ),
			value: 'THR',
		},
		{
			label: __( 'Ilaam (ایلام)', 'storeengine' ),
			value: 'ILM',
		},
		{
			label: __( 'Bushehr (بوشهر)', 'storeengine' ),
			value: 'BHR',
		},
		{
			label: __( 'Ardabil (اردبیل)', 'storeengine' ),
			value: 'ADL',
		},
		{
			label: __( 'Isfahan (اصفهان)', 'storeengine' ),
			value: 'ESF',
		},
		{
			label: __( 'Yazd (یزد)', 'storeengine' ),
			value: 'YZD',
		},
		{
			label: __( 'Kermanshah (کرمانشاه)', 'storeengine' ),
			value: 'KRH',
		},
		{
			label: __( 'Kerman (کرمان)', 'storeengine' ),
			value: 'KRN',
		},
		{
			label: __( 'Hamadan (همدان)', 'storeengine' ),
			value: 'HDN',
		},
		{
			label: __( 'Ghazvin (قزوین)', 'storeengine' ),
			value: 'GZN',
		},
		{
			label: __( 'Zanjan (زنجان)', 'storeengine' ),
			value: 'ZJN',
		},
		{
			label: __( 'Luristan (لرستان)', 'storeengine' ),
			value: 'LRS',
		},
		{
			label: __( 'Alborz (البرز)', 'storeengine' ),
			value: 'ABZ',
		},
		{
			label: __( 'East Azarbaijan (آذربایجان شرقی)', 'storeengine' ),
			value: 'EAZ',
		},
		{
			label: __( 'West Azarbaijan (آذربایجان غربی)', 'storeengine' ),
			value: 'WAZ',
		},
		{
			label: __(
				'Chaharmahal and Bakhtiari (چهارمحال و بختیاری)',
				'storeengine'
			),
			value: 'CHB',
		},
		{
			label: __( 'South Khorasan (خراسان جنوبی)', 'storeengine' ),
			value: 'SKH',
		},
		{
			label: __( 'Razavi Khorasan (خراسان رضوی)', 'storeengine' ),
			value: 'RKH',
		},
		{
			label: __( 'North Khorasan (خراسان شمالی)', 'storeengine' ),
			value: 'NKH',
		},
		{
			label: __( 'Semnan (سمنان)', 'storeengine' ),
			value: 'SMN',
		},
		{
			label: __( 'Fars (فارس)', 'storeengine' ),
			value: 'FRS',
		},
		{
			label: __( 'Qom (قم)', 'storeengine' ),
			value: 'QHM',
		},
		{
			label: __( 'Kurdistan / کردستان)', 'storeengine' ),
			value: 'KRD',
		},
		{
			label: __(
				'Kohgiluyeh and BoyerAhmad (کهگیلوییه و بویراحمد)',
				'storeengine'
			),
			value: 'KBD',
		},
		{
			label: __( 'Golestan (گلستان)', 'storeengine' ),
			value: 'GLS',
		},
		{
			label: __( 'Gilan (گیلان)', 'storeengine' ),
			value: 'GIL',
		},
		{
			label: __( 'Mazandaran (مازندران)', 'storeengine' ),
			value: 'MZN',
		},
		{
			label: __( 'Markazi (مرکزی)', 'storeengine' ),
			value: 'MKZ',
		},
		{
			label: __( 'Hormozgan (هرمزگان)', 'storeengine' ),
			value: 'HRZ',
		},
		{
			label: __(
				'Sistan and Baluchestan (سیستان و بلوچستان)',
				'storeengine'
			),
			value: 'SBN',
		},
	],
	IS: [],
	IT: [
		// Italian provinces.
		{
			label: __( 'Agrigento', 'storeengine' ),
			value: 'AG',
		},
		{
			label: __( 'Alessandria', 'storeengine' ),
			value: 'AL',
		},
		{
			label: __( 'Ancona', 'storeengine' ),
			value: 'AN',
		},
		{
			label: __( 'Aosta', 'storeengine' ),
			value: 'AO',
		},
		{
			label: __( 'Arezzo', 'storeengine' ),
			value: 'AR',
		},
		{
			label: __( 'Ascoli Piceno', 'storeengine' ),
			value: 'AP',
		},
		{
			label: __( 'Asti', 'storeengine' ),
			value: 'AT',
		},
		{
			label: __( 'Avellino', 'storeengine' ),
			value: 'AV',
		},
		{
			label: __( 'Bari', 'storeengine' ),
			value: 'BA',
		},
		{
			label: __( 'Barletta-Andria-Trani', 'storeengine' ),
			value: 'BT',
		},
		{
			label: __( 'Belluno', 'storeengine' ),
			value: 'BL',
		},
		{
			label: __( 'Benevento', 'storeengine' ),
			value: 'BN',
		},
		{
			label: __( 'Bergamo', 'storeengine' ),
			value: 'BG',
		},
		{
			label: __( 'Biella', 'storeengine' ),
			value: 'BI',
		},
		{
			label: __( 'Bologna', 'storeengine' ),
			value: 'BO',
		},
		{
			label: __( 'Bolzano', 'storeengine' ),
			value: 'BZ',
		},
		{
			label: __( 'Brescia', 'storeengine' ),
			value: 'BS',
		},
		{
			label: __( 'Brindisi', 'storeengine' ),
			value: 'BR',
		},
		{
			label: __( 'Cagliari', 'storeengine' ),
			value: 'CA',
		},
		{
			label: __( 'Caltanissetta', 'storeengine' ),
			value: 'CL',
		},
		{
			label: __( 'Campobasso', 'storeengine' ),
			value: 'CB',
		},
		{
			label: __( 'Caserta', 'storeengine' ),
			value: 'CE',
		},
		{
			label: __( 'Catania', 'storeengine' ),
			value: 'CT',
		},
		{
			label: __( 'Catanzaro', 'storeengine' ),
			value: 'CZ',
		},
		{
			label: __( 'Chieti', 'storeengine' ),
			value: 'CH',
		},
		{
			label: __( 'Como', 'storeengine' ),
			value: 'CO',
		},
		{
			label: __( 'Cosenza', 'storeengine' ),
			value: 'CS',
		},
		{
			label: __( 'Cremona', 'storeengine' ),
			value: 'CR',
		},
		{
			label: __( 'Crotone', 'storeengine' ),
			value: 'KR',
		},
		{
			label: __( 'Cuneo', 'storeengine' ),
			value: 'CN',
		},
		{
			label: __( 'Enna', 'storeengine' ),
			value: 'EN',
		},
		{
			label: __( 'Fermo', 'storeengine' ),
			value: 'FM',
		},
		{
			label: __( 'Ferrara', 'storeengine' ),
			value: 'FE',
		},
		{
			label: __( 'Firenze', 'storeengine' ),
			value: 'FI',
		},
		{
			label: __( 'Foggia', 'storeengine' ),
			value: 'FG',
		},
		{
			label: __( 'Forlì-Cesena', 'storeengine' ),
			value: 'FC',
		},
		{
			label: __( 'Frosinone', 'storeengine' ),
			value: 'FR',
		},
		{
			label: __( 'Genova', 'storeengine' ),
			value: 'GE',
		},
		{
			label: __( 'Gorizia', 'storeengine' ),
			value: 'GO',
		},
		{
			label: __( 'Grosseto', 'storeengine' ),
			value: 'GR',
		},
		{
			label: __( 'Imperia', 'storeengine' ),
			value: 'IM',
		},
		{
			label: __( 'Isernia', 'storeengine' ),
			value: 'IS',
		},
		{
			label: __( 'La Spezia', 'storeengine' ),
			value: 'SP',
		},
		{
			label: __( "L'Aquila", 'storeengine' ),
			value: 'AQ',
		},
		{
			label: __( 'Latina', 'storeengine' ),
			value: 'LT',
		},
		{
			label: __( 'Lecce', 'storeengine' ),
			value: 'LE',
		},
		{
			label: __( 'Lecco', 'storeengine' ),
			value: 'LC',
		},
		{
			label: __( 'Livorno', 'storeengine' ),
			value: 'LI',
		},
		{
			label: __( 'Lodi', 'storeengine' ),
			value: 'LO',
		},
		{
			label: __( 'Lucca', 'storeengine' ),
			value: 'LU',
		},
		{
			label: __( 'Macerata', 'storeengine' ),
			value: 'MC',
		},
		{
			label: __( 'Mantova', 'storeengine' ),
			value: 'MN',
		},
		{
			label: __( 'Massa-Carrara', 'storeengine' ),
			value: 'MS',
		},
		{
			label: __( 'Matera', 'storeengine' ),
			value: 'MT',
		},
		{
			label: __( 'Messina', 'storeengine' ),
			value: 'ME',
		},
		{
			label: __( 'Milano', 'storeengine' ),
			value: 'MI',
		},
		{
			label: __( 'Modena', 'storeengine' ),
			value: 'MO',
		},
		{
			label: __( 'Monza e della Brianza', 'storeengine' ),
			value: 'MB',
		},
		{
			label: __( 'Napoli', 'storeengine' ),
			value: 'NA',
		},
		{
			label: __( 'Novara', 'storeengine' ),
			value: 'NO',
		},
		{
			label: __( 'Nuoro', 'storeengine' ),
			value: 'NU',
		},
		{
			label: __( 'Oristano', 'storeengine' ),
			value: 'OR',
		},
		{
			label: __( 'Padova', 'storeengine' ),
			value: 'PD',
		},
		{
			label: __( 'Palermo', 'storeengine' ),
			value: 'PA',
		},
		{
			label: __( 'Parma', 'storeengine' ),
			value: 'PR',
		},
		{
			label: __( 'Pavia', 'storeengine' ),
			value: 'PV',
		},
		{
			label: __( 'Perugia', 'storeengine' ),
			value: 'PG',
		},
		{
			label: __( 'Pesaro e Urbino', 'storeengine' ),
			value: 'PU',
		},
		{
			label: __( 'Pescara', 'storeengine' ),
			value: 'PE',
		},
		{
			label: __( 'Piacenza', 'storeengine' ),
			value: 'PC',
		},
		{
			label: __( 'Pisa', 'storeengine' ),
			value: 'PI',
		},
		{
			label: __( 'Pistoia', 'storeengine' ),
			value: 'PT',
		},
		{
			label: __( 'Pordenone', 'storeengine' ),
			value: 'PN',
		},
		{
			label: __( 'Potenza', 'storeengine' ),
			value: 'PZ',
		},
		{
			label: __( 'Prato', 'storeengine' ),
			value: 'PO',
		},
		{
			label: __( 'Ragusa', 'storeengine' ),
			value: 'RG',
		},
		{
			label: __( 'Ravenna', 'storeengine' ),
			value: 'RA',
		},
		{
			label: __( 'Reggio Calabria', 'storeengine' ),
			value: 'RC',
		},
		{
			label: __( 'Reggio Emilia', 'storeengine' ),
			value: 'RE',
		},
		{
			label: __( 'Rieti', 'storeengine' ),
			value: 'RI',
		},
		{
			label: __( 'Rimini', 'storeengine' ),
			value: 'RN',
		},
		{
			label: __( 'Roma', 'storeengine' ),
			value: 'RM',
		},
		{
			label: __( 'Rovigo', 'storeengine' ),
			value: 'RO',
		},
		{
			label: __( 'Salerno', 'storeengine' ),
			value: 'SA',
		},
		{
			label: __( 'Sassari', 'storeengine' ),
			value: 'SS',
		},
		{
			label: __( 'Savona', 'storeengine' ),
			value: 'SV',
		},
		{
			label: __( 'Siena', 'storeengine' ),
			value: 'SI',
		},
		{
			label: __( 'Siracusa', 'storeengine' ),
			value: 'SR',
		},
		{
			label: __( 'Sondrio', 'storeengine' ),
			value: 'SO',
		},
		{
			label: __( 'Sud Sardegna', 'storeengine' ),
			value: 'SU',
		},
		{
			label: __( 'Taranto', 'storeengine' ),
			value: 'TA',
		},
		{
			label: __( 'Teramo', 'storeengine' ),
			value: 'TE',
		},
		{
			label: __( 'Terni', 'storeengine' ),
			value: 'TR',
		},
		{
			label: __( 'Torino', 'storeengine' ),
			value: 'TO',
		},
		{
			label: __( 'Trapani', 'storeengine' ),
			value: 'TP',
		},
		{
			label: __( 'Trento', 'storeengine' ),
			value: 'TN',
		},
		{
			label: __( 'Treviso', 'storeengine' ),
			value: 'TV',
		},
		{
			label: __( 'Trieste', 'storeengine' ),
			value: 'TS',
		},
		{
			label: __( 'Udine', 'storeengine' ),
			value: 'UD',
		},
		{
			label: __( 'Varese', 'storeengine' ),
			value: 'VA',
		},
		{
			label: __( 'Venezia', 'storeengine' ),
			value: 'VE',
		},
		{
			label: __( 'Verbano-Cusio-Ossola', 'storeengine' ),
			value: 'VB',
		},
		{
			label: __( 'Vercelli', 'storeengine' ),
			value: 'VC',
		},
		{
			label: __( 'Verona', 'storeengine' ),
			value: 'VR',
		},
		{
			label: __( 'Vibo Valentia', 'storeengine' ),
			value: 'VV',
		},
		{
			label: __( 'Vicenza', 'storeengine' ),
			value: 'VI',
		},
		{
			label: __( 'Viterbo', 'storeengine' ),
			value: 'VT',
		},
	],
	IL: [],
	IM: [],
	JM: [
		// Jamaican parishes.
		{
			label: __( 'Kingston', 'storeengine' ),
			value: 'JM-01',
		},
		{
			label: __( 'Saint Andrew', 'storeengine' ),
			value: 'JM-02',
		},
		{
			label: __( 'Saint Thomas', 'storeengine' ),
			value: 'JM-03',
		},
		{
			label: __( 'Portland', 'storeengine' ),
			value: 'JM-04',
		},
		{
			label: __( 'Saint Mary', 'storeengine' ),
			value: 'JM-05',
		},
		{
			label: __( 'Saint Ann', 'storeengine' ),
			value: 'JM-06',
		},
		{
			label: __( 'Trelawny', 'storeengine' ),
			value: 'JM-07',
		},
		{
			label: __( 'Saint James', 'storeengine' ),
			value: 'JM-08',
		},
		{
			label: __( 'Hanover', 'storeengine' ),
			value: 'JM-09',
		},
		{
			label: __( 'Westmoreland', 'storeengine' ),
			value: 'JM-10',
		},
		{
			label: __( 'Saint Elizabeth', 'storeengine' ),
			value: 'JM-11',
		},
		{
			label: __( 'Manchester', 'storeengine' ),
			value: 'JM-12',
		},
		{
			label: __( 'Clarendon', 'storeengine' ),
			value: 'JM-13',
		},
		{
			label: __( 'Saint Catherine', 'storeengine' ),
			value: 'JM-14',
		},
	],

	/**
	 * Japanese states.
	 *
	 * English notation of prefectures conform to the notation of Japan Post.
	 * The suffix corresponds with the Japanese translation file.
	 */
	JP: [
		{
			label: __( 'Hokkaido', 'storeengine' ),
			value: 'JP01',
		},
		{
			label: __( 'Aomori', 'storeengine' ),
			value: 'JP02',
		},
		{
			label: __( 'Iwate', 'storeengine' ),
			value: 'JP03',
		},
		{
			label: __( 'Miyagi', 'storeengine' ),
			value: 'JP04',
		},
		{
			label: __( 'Akita', 'storeengine' ),
			value: 'JP05',
		},
		{
			label: __( 'Yamagata', 'storeengine' ),
			value: 'JP06',
		},
		{
			label: __( 'Fukushima', 'storeengine' ),
			value: 'JP07',
		},
		{
			label: __( 'Ibaraki', 'storeengine' ),
			value: 'JP08',
		},
		{
			label: __( 'Tochigi', 'storeengine' ),
			value: 'JP09',
		},
		{
			label: __( 'Gunma', 'storeengine' ),
			value: 'JP10',
		},
		{
			label: __( 'Saitama', 'storeengine' ),
			value: 'JP11',
		},
		{
			label: __( 'Chiba', 'storeengine' ),
			value: 'JP12',
		},
		{
			label: __( 'Tokyo', 'storeengine' ),
			value: 'JP13',
		},
		{
			label: __( 'Kanagawa', 'storeengine' ),
			value: 'JP14',
		},
		{
			label: __( 'Niigata', 'storeengine' ),
			value: 'JP15',
		},
		{
			label: __( 'Toyama', 'storeengine' ),
			value: 'JP16',
		},
		{
			label: __( 'Ishikawa', 'storeengine' ),
			value: 'JP17',
		},
		{
			label: __( 'Fukui', 'storeengine' ),
			value: 'JP18',
		},
		{
			label: __( 'Yamanashi', 'storeengine' ),
			value: 'JP19',
		},
		{
			label: __( 'Nagano', 'storeengine' ),
			value: 'JP20',
		},
		{
			label: __( 'Gifu', 'storeengine' ),
			value: 'JP21',
		},
		{
			label: __( 'Shizuoka', 'storeengine' ),
			value: 'JP22',
		},
		{
			label: __( 'Aichi', 'storeengine' ),
			value: 'JP23',
		},
		{
			label: __( 'Mie', 'storeengine' ),
			value: 'JP24',
		},
		{
			label: __( 'Shiga', 'storeengine' ),
			value: 'JP25',
		},
		{
			label: __( 'Kyoto', 'storeengine' ),
			value: 'JP26',
		},
		{
			label: __( 'Osaka', 'storeengine' ),
			value: 'JP27',
		},
		{
			label: __( 'Hyogo', 'storeengine' ),
			value: 'JP28',
		},
		{
			label: __( 'Nara', 'storeengine' ),
			value: 'JP29',
		},
		{
			label: __( 'Wakayama', 'storeengine' ),
			value: 'JP30',
		},
		{
			label: __( 'Tottori', 'storeengine' ),
			value: 'JP31',
		},
		{
			label: __( 'Shimane', 'storeengine' ),
			value: 'JP32',
		},
		{
			label: __( 'Okayama', 'storeengine' ),
			value: 'JP33',
		},
		{
			label: __( 'Hiroshima', 'storeengine' ),
			value: 'JP34',
		},
		{
			label: __( 'Yamaguchi', 'storeengine' ),
			value: 'JP35',
		},
		{
			label: __( 'Tokushima', 'storeengine' ),
			value: 'JP36',
		},
		{
			label: __( 'Kagawa', 'storeengine' ),
			value: 'JP37',
		},
		{
			label: __( 'Ehime', 'storeengine' ),
			value: 'JP38',
		},
		{
			label: __( 'Kochi', 'storeengine' ),
			value: 'JP39',
		},
		{
			label: __( 'Fukuoka', 'storeengine' ),
			value: 'JP40',
		},
		{
			label: __( 'Saga', 'storeengine' ),
			value: 'JP41',
		},
		{
			label: __( 'Nagasaki', 'storeengine' ),
			value: 'JP42',
		},
		{
			label: __( 'Kumamoto', 'storeengine' ),
			value: 'JP43',
		},
		{
			label: __( 'Oita', 'storeengine' ),
			value: 'JP44',
		},
		{
			label: __( 'Miyazaki', 'storeengine' ),
			value: 'JP45',
		},
		{
			label: __( 'Kagoshima', 'storeengine' ),
			value: 'JP46',
		},
		{
			label: __( 'Okinawa', 'storeengine' ),
			value: 'JP47',
		},
	],
	KE: [
		// Kenyan counties.
		{
			label: __( 'Baringo', 'storeengine' ),
			value: 'KE01',
		},
		{
			label: __( 'Bomet', 'storeengine' ),
			value: 'KE02',
		},
		{
			label: __( 'Bungoma', 'storeengine' ),
			value: 'KE03',
		},
		{
			label: __( 'Busia', 'storeengine' ),
			value: 'KE04',
		},
		{
			label: __( 'Elgeyo-Marakwet', 'storeengine' ),
			value: 'KE05',
		},
		{
			label: __( 'Embu', 'storeengine' ),
			value: 'KE06',
		},
		{
			label: __( 'Garissa', 'storeengine' ),
			value: 'KE07',
		},
		{
			label: __( 'Homa Bay', 'storeengine' ),
			value: 'KE08',
		},
		{
			label: __( 'Isiolo', 'storeengine' ),
			value: 'KE09',
		},
		{
			label: __( 'Kajiado', 'storeengine' ),
			value: 'KE10',
		},
		{
			label: __( 'Kakamega', 'storeengine' ),
			value: 'KE11',
		},
		{
			label: __( 'Kericho', 'storeengine' ),
			value: 'KE12',
		},
		{
			label: __( 'Kiambu', 'storeengine' ),
			value: 'KE13',
		},
		{
			label: __( 'Kilifi', 'storeengine' ),
			value: 'KE14',
		},
		{
			label: __( 'Kirinyaga', 'storeengine' ),
			value: 'KE15',
		},
		{
			label: __( 'Kisii', 'storeengine' ),
			value: 'KE16',
		},
		{
			label: __( 'Kisumu', 'storeengine' ),
			value: 'KE17',
		},
		{
			label: __( 'Kitui', 'storeengine' ),
			value: 'KE18',
		},
		{
			label: __( 'Kwale', 'storeengine' ),
			value: 'KE19',
		},
		{
			label: __( 'Laikipia', 'storeengine' ),
			value: 'KE20',
		},
		{
			label: __( 'Lamu', 'storeengine' ),
			value: 'KE21',
		},
		{
			label: __( 'Machakos', 'storeengine' ),
			value: 'KE22',
		},
		{
			label: __( 'Makueni', 'storeengine' ),
			value: 'KE23',
		},
		{
			label: __( 'Mandera', 'storeengine' ),
			value: 'KE24',
		},
		{
			label: __( 'Marsabit', 'storeengine' ),
			value: 'KE25',
		},
		{
			label: __( 'Meru', 'storeengine' ),
			value: 'KE26',
		},
		{
			label: __( 'Migori', 'storeengine' ),
			value: 'KE27',
		},
		{
			label: __( 'Mombasa', 'storeengine' ),
			value: 'KE28',
		},
		{
			label: __( 'Murang’a', 'storeengine' ),
			value: 'KE29',
		},
		{
			label: __( 'Nairobi County', 'storeengine' ),
			value: 'KE30',
		},
		{
			label: __( 'Nakuru', 'storeengine' ),
			value: 'KE31',
		},
		{
			label: __( 'Nandi', 'storeengine' ),
			value: 'KE32',
		},
		{
			label: __( 'Narok', 'storeengine' ),
			value: 'KE33',
		},
		{
			label: __( 'Nyamira', 'storeengine' ),
			value: 'KE34',
		},
		{
			label: __( 'Nyandarua', 'storeengine' ),
			value: 'KE35',
		},
		{
			label: __( 'Nyeri', 'storeengine' ),
			value: 'KE36',
		},
		{
			label: __( 'Samburu', 'storeengine' ),
			value: 'KE37',
		},
		{
			label: __( 'Siaya', 'storeengine' ),
			value: 'KE38',
		},
		{
			label: __( 'Taita-Taveta', 'storeengine' ),
			value: 'KE39',
		},
		{
			label: __( 'Tana River', 'storeengine' ),
			value: 'KE40',
		},
		{
			label: __( 'Tharaka-Nithi', 'storeengine' ),
			value: 'KE41',
		},
		{
			label: __( 'Trans Nzoia', 'storeengine' ),
			value: 'KE42',
		},
		{
			label: __( 'Turkana', 'storeengine' ),
			value: 'KE43',
		},
		{
			label: __( 'Uasin Gishu', 'storeengine' ),
			value: 'KE44',
		},
		{
			label: __( 'Vihiga', 'storeengine' ),
			value: 'KE45',
		},
		{
			label: __( 'Wajir', 'storeengine' ),
			value: 'KE46',
		},
		{
			label: __( 'West Pokot', 'storeengine' ),
			value: 'KE47',
		},
	],
	KN: [
		// Saint Kitts and Nevis parishes.
		{
			label: __( 'Saint Kitts', 'storeengine' ),
			value: 'KNK',
		},
		{
			label: __( 'Nevis', 'storeengine' ),
			value: 'KNN',
		},
		{
			label: __( 'Christ Church Nichola Town', 'storeengine' ),
			value: 'KN01',
		},
		{
			label: __( 'Saint Anne Sandy Point', 'storeengine' ),
			value: 'KN02',
		},
		{
			label: __( 'Saint George Basseterre', 'storeengine' ),
			value: 'KN03',
		},
		{
			label: __( 'Saint George Gingerland', 'storeengine' ),
			value: 'KN04',
		},
		{
			label: __( 'Saint James Windward', 'storeengine' ),
			value: 'KN05',
		},
		{
			label: __( 'Saint John Capisterre', 'storeengine' ),
			value: 'KN06',
		},
		{
			label: __( 'Saint John Figtree', 'storeengine' ),
			value: 'KN07',
		},
		{
			label: __( 'Saint Mary Cayon', 'storeengine' ),
			value: 'KN08',
		},
		{
			label: __( 'Saint Paul Capisterre', 'storeengine' ),
			value: 'KN09',
		},
		{
			label: __( 'Saint Paul Charlestown', 'storeengine' ),
			value: 'KN10',
		},
		{
			label: __( 'Saint Peter Basseterre', 'storeengine' ),
			value: 'KN11',
		},
		{
			label: __( 'Saint Thomas Lowland', 'storeengine' ),
			value: 'KN12',
		},
		{
			label: __( 'Saint Thomas Middle Island', 'storeengine' ),
			value: 'KN13',
		},
		{
			label: __( 'Trinity Palmetto Point', 'storeengine' ),
			value: 'KN15',
		},
	],
	KR: [],
	KW: [],
	LA: [
		// Laotian provinces.
		{
			label: __( 'Attapeu', 'storeengine' ),
			value: 'AT',
		},
		{
			label: __( 'Bokeo', 'storeengine' ),
			value: 'BK',
		},
		{
			label: __( 'Bolikhamsai', 'storeengine' ),
			value: 'BL',
		},
		{
			label: __( 'Champasak', 'storeengine' ),
			value: 'CH',
		},
		{
			label: __( 'Houaphanh', 'storeengine' ),
			value: 'HO',
		},
		{
			label: __( 'Khammouane', 'storeengine' ),
			value: 'KH',
		},
		{
			label: __( 'Luang Namtha', 'storeengine' ),
			value: 'LM',
		},
		{
			label: __( 'Luang Prabang', 'storeengine' ),
			value: 'LP',
		},
		{
			label: __( 'Oudomxay', 'storeengine' ),
			value: 'OU',
		},
		{
			label: __( 'Phongsaly', 'storeengine' ),
			value: 'PH',
		},
		{
			label: __( 'Salavan', 'storeengine' ),
			value: 'SL',
		},
		{
			label: __( 'Savannakhet', 'storeengine' ),
			value: 'SV',
		},
		{
			label: __( 'Vientiane Province', 'storeengine' ),
			value: 'VI',
		},
		{
			label: __( 'Vientiane', 'storeengine' ),
			value: 'VT',
		},
		{
			label: __( 'Sainyabuli', 'storeengine' ),
			value: 'XA',
		},
		{
			label: __( 'Sekong', 'storeengine' ),
			value: 'XE',
		},
		{
			label: __( 'Xiangkhouang', 'storeengine' ),
			value: 'XI',
		},
		{
			label: __( 'Xaisomboun', 'storeengine' ),
			value: 'XS',
		},
	],
	LB: [],
	LI: [],
	LR: [
		// Liberian provinces.
		{
			label: __( 'Bomi', 'storeengine' ),
			value: 'BM',
		},
		{
			label: __( 'Bong', 'storeengine' ),
			value: 'BN',
		},
		{
			label: __( 'Gbarpolu', 'storeengine' ),
			value: 'GA',
		},
		{
			label: __( 'Grand Bassa', 'storeengine' ),
			value: 'GB',
		},
		{
			label: __( 'Grand Cape Mount', 'storeengine' ),
			value: 'GC',
		},
		{
			label: __( 'Grand Gedeh', 'storeengine' ),
			value: 'GG',
		},
		{
			label: __( 'Grand Kru', 'storeengine' ),
			value: 'GK',
		},
		{
			label: __( 'Lofa', 'storeengine' ),
			value: 'LO',
		},
		{
			label: __( 'Margibi', 'storeengine' ),
			value: 'MA',
		},
		{
			label: __( 'Maryland', 'storeengine' ),
			value: 'MY',
		},
		{
			label: __( 'Montserrado', 'storeengine' ),
			value: 'MO',
		},
		{
			label: __( 'Nimba', 'storeengine' ),
			value: 'NM',
		},
		{
			label: __( 'Rivercess', 'storeengine' ),
			value: 'RV',
		},
		{
			label: __( 'River Gee', 'storeengine' ),
			value: 'RG',
		},
		{
			label: __( 'Sinoe', 'storeengine' ),
			value: 'SN',
		},
	],
	LU: [],
	MA: [
		// Moroccan regions.
		{
			label: __( 'Agadir-Ida Ou Tanane', 'storeengine' ),
			value: 'maagd',
		},
		{
			label: __( 'Azilal', 'storeengine' ),
			value: 'maazi',
		},
		{
			label: __( 'Béni-Mellal', 'storeengine' ),
			value: 'mabem',
		},
		{
			label: __( 'Berkane', 'storeengine' ),
			value: 'maber',
		},
		{
			label: __( 'Ben Slimane', 'storeengine' ),
			value: 'mabes',
		},
		{
			label: __( 'Boujdour', 'storeengine' ),
			value: 'mabod',
		},
		{
			label: __( 'Boulemane', 'storeengine' ),
			value: 'mabom',
		},
		{
			label: __( 'Berrechid', 'storeengine' ),
			value: 'mabrr',
		},
		{
			label: __( 'Casablanca', 'storeengine' ),
			value: 'macas',
		},
		{
			label: __( 'Chefchaouen', 'storeengine' ),
			value: 'mache',
		},
		{
			label: __( 'Chichaoua', 'storeengine' ),
			value: 'machi',
		},
		{
			label: __( 'Chtouka Aït Baha', 'storeengine' ),
			value: 'macht',
		},
		{
			label: __( 'Driouch', 'storeengine' ),
			value: 'madri',
		},
		{
			label: __( 'Essaouira', 'storeengine' ),
			value: 'maedi',
		},
		{
			label: __( 'Errachidia', 'storeengine' ),
			value: 'maerr',
		},
		{
			label: __( 'Fahs-Beni Makada', 'storeengine' ),
			value: 'mafah',
		},
		{
			label: __( 'Fès-Dar-Dbibegh', 'storeengine' ),
			value: 'mafes',
		},
		{
			label: __( 'Figuig', 'storeengine' ),
			value: 'mafig',
		},
		{
			label: __( 'Fquih Ben Salah', 'storeengine' ),
			value: 'mafqh',
		},
		{
			label: __( 'Guelmim', 'storeengine' ),
			value: 'mague',
		},
		{
			label: __( 'Guercif', 'storeengine' ),
			value: 'maguf',
		},
		{
			label: __( 'El Hajeb', 'storeengine' ),
			value: 'mahaj',
		},
		{
			label: __( 'Al Haouz', 'storeengine' ),
			value: 'mahao',
		},
		{
			label: __( 'Al Hoceïma', 'storeengine' ),
			value: 'mahoc',
		},
		{
			label: __( 'Ifrane', 'storeengine' ),
			value: 'maifr',
		},
		{
			label: __( 'Inezgane-Aït Melloul', 'storeengine' ),
			value: 'maine',
		},
		{
			label: __( 'El Jadida', 'storeengine' ),
			value: 'majdi',
		},
		{
			label: __( 'Jerada', 'storeengine' ),
			value: 'majra',
		},
		{
			label: __( 'Kénitra', 'storeengine' ),
			value: 'maken',
		},
		{
			label: __( 'Kelaat Sraghna', 'storeengine' ),
			value: 'makes',
		},
		{
			label: __( 'Khemisset', 'storeengine' ),
			value: 'makhe',
		},
		{
			label: __( 'Khénifra', 'storeengine' ),
			value: 'makhn',
		},
		{
			label: __( 'Khouribga', 'storeengine' ),
			value: 'makho',
		},
		{
			label: __( 'Laâyoune', 'storeengine' ),
			value: 'malaa',
		},
		{
			label: __( 'Larache', 'storeengine' ),
			value: 'malar',
		},
		{
			label: __( 'Marrakech', 'storeengine' ),
			value: 'mamar',
		},
		{
			label: __( 'M’diq-Fnideq', 'storeengine' ),
			value: 'mamdf',
		},
		{
			label: __( 'Médiouna', 'storeengine' ),
			value: 'mamed',
		},
		{
			label: __( 'Meknès', 'storeengine' ),
			value: 'mamek',
		},
		{
			label: __( 'Midelt', 'storeengine' ),
			value: 'mamid',
		},
		{
			label: __( 'Marrakech-Medina', 'storeengine' ),
			value: 'mammd',
		},
		{
			label: __( 'Marrakech-Menara', 'storeengine' ),
			value: 'mammn',
		},
		{
			label: __( 'Mohammedia', 'storeengine' ),
			value: 'mamoh',
		},
		{
			label: __( 'Moulay Yacoub', 'storeengine' ),
			value: 'mamou',
		},
		{
			label: __( 'Nador', 'storeengine' ),
			value: 'manad',
		},
		{
			label: __( 'Nouaceur', 'storeengine' ),
			value: 'manou',
		},
		{
			label: __( 'Ouarzazate', 'storeengine' ),
			value: 'maoua',
		},
		{
			label: __( 'Oued Ed-Dahab', 'storeengine' ),
			value: 'maoud',
		},
		{
			label: __( 'Oujda-Angad', 'storeengine' ),
			value: 'maouj',
		},
		{
			label: __( 'Ouezzane', 'storeengine' ),
			value: 'maouz',
		},
		{
			label: __( 'Rabat', 'storeengine' ),
			value: 'marab',
		},
		{
			label: __( 'Rehamna', 'storeengine' ),
			value: 'mareh',
		},
		{
			label: __( 'Safi', 'storeengine' ),
			value: 'masaf',
		},
		{
			label: __( 'Salé', 'storeengine' ),
			value: 'masal',
		},
		{
			label: __( 'Sefrou', 'storeengine' ),
			value: 'masef',
		},
		{
			label: __( 'Settat', 'storeengine' ),
			value: 'maset',
		},
		{
			label: __( 'Sidi Bennour', 'storeengine' ),
			value: 'masib',
		},
		{
			label: __( 'Sidi Ifni', 'storeengine' ),
			value: 'masif',
		},
		{
			label: __( 'Sidi Kacem', 'storeengine' ),
			value: 'masik',
		},
		{
			label: __( 'Sidi Slimane', 'storeengine' ),
			value: 'masil',
		},
		{
			label: __( 'Skhirat-Témara', 'storeengine' ),
			value: 'maskh',
		},
		{
			label: __( 'Sidi Youssef Ben Ali', 'storeengine' ),
			value: 'masyb',
		},
		{
			label: __( 'Tarfaya (EH-partial)', 'storeengine' ),
			value: 'mataf',
		},
		{
			label: __( 'Taourirt', 'storeengine' ),
			value: 'matai',
		},
		{
			label: __( 'Taounate', 'storeengine' ),
			value: 'matao',
		},
		{
			label: __( 'Taroudant', 'storeengine' ),
			value: 'matar',
		},
		{
			label: __( 'Tata', 'storeengine' ),
			value: 'matat',
		},
		{
			label: __( 'Taza', 'storeengine' ),
			value: 'mataz',
		},
		{
			label: __( 'Tétouan', 'storeengine' ),
			value: 'matet',
		},
		{
			label: __( 'Tinghir', 'storeengine' ),
			value: 'matin',
		},
		{
			label: __( 'Tiznit', 'storeengine' ),
			value: 'matiz',
		},
		{
			label: __( 'Tangier-Assilah', 'storeengine' ),
			value: 'matng',
		},
		{
			label: __( 'Tan-Tan', 'storeengine' ),
			value: 'matnt',
		},
		{
			label: __( 'Youssoufia', 'storeengine' ),
			value: 'mayus',
		},
		{
			label: __( 'Zagora', 'storeengine' ),
			value: 'mazag',
		},
	],
	MD: [
		// Moldovan states.
		{
			label: __( 'Chișinău', 'storeengine' ),
			value: 'C',
		},
		{
			label: __( 'Bălți', 'storeengine' ),
			value: 'BL',
		},
		{
			label: __( 'Anenii Noi', 'storeengine' ),
			value: 'AN',
		},
		{
			label: __( 'Basarabeasca', 'storeengine' ),
			value: 'BS',
		},
		{
			label: __( 'Briceni', 'storeengine' ),
			value: 'BR',
		},
		{
			label: __( 'Cahul', 'storeengine' ),
			value: 'CH',
		},
		{
			label: __( 'Cantemir', 'storeengine' ),
			value: 'CT',
		},
		{
			label: __( 'Călărași', 'storeengine' ),
			value: 'CL',
		},
		{
			label: __( 'Căușeni', 'storeengine' ),
			value: 'CS',
		},
		{
			label: __( 'Cimișlia', 'storeengine' ),
			value: 'CM',
		},
		{
			label: __( 'Criuleni', 'storeengine' ),
			value: 'CR',
		},
		{
			label: __( 'Dondușeni', 'storeengine' ),
			value: 'DN',
		},
		{
			label: __( 'Drochia', 'storeengine' ),
			value: 'DR',
		},
		{
			label: __( 'Dubăsari', 'storeengine' ),
			value: 'DB',
		},
		{
			label: __( 'Edineț', 'storeengine' ),
			value: 'ED',
		},
		{
			label: __( 'Fălești', 'storeengine' ),
			value: 'FL',
		},
		{
			label: __( 'Florești', 'storeengine' ),
			value: 'FR',
		},
		{
			label: __( 'UTA Găgăuzia', 'storeengine' ),
			value: 'GE',
		},
		{
			label: __( 'Glodeni', 'storeengine' ),
			value: 'GL',
		},
		{
			label: __( 'Hîncești', 'storeengine' ),
			value: 'HN',
		},
		{
			label: __( 'Ialoveni', 'storeengine' ),
			value: 'IL',
		},
		{
			label: __( 'Leova', 'storeengine' ),
			value: 'LV',
		},
		{
			label: __( 'Nisporeni', 'storeengine' ),
			value: 'NS',
		},
		{
			label: __( 'Ocnița', 'storeengine' ),
			value: 'OC',
		},
		{
			label: __( 'Orhei', 'storeengine' ),
			value: 'OR',
		},
		{
			label: __( 'Rezina', 'storeengine' ),
			value: 'RZ',
		},
		{
			label: __( 'Rîșcani', 'storeengine' ),
			value: 'RS',
		},
		{
			label: __( 'Sîngerei', 'storeengine' ),
			value: 'SG',
		},
		{
			label: __( 'Soroca', 'storeengine' ),
			value: 'SR',
		},
		{
			label: __( 'Strășeni', 'storeengine' ),
			value: 'ST',
		},
		{
			label: __( 'Șoldănești', 'storeengine' ),
			value: 'SD',
		},
		{
			label: __( 'Ștefan Vodă', 'storeengine' ),
			value: 'SV',
		},
		{
			label: __( 'Taraclia', 'storeengine' ),
			value: 'TR',
		},
		{
			label: __( 'Telenești', 'storeengine' ),
			value: 'TL',
		},
		{
			label: __( 'Ungheni', 'storeengine' ),
			value: 'UN',
		},
	],
	MF: [],
	MQ: [],
	MT: [],
	MX: [
		// Mexican states.
		{
			label: __( 'Ciudad de México', 'storeengine' ),
			value: 'DF',
		},
		{
			label: __( 'Jalisco', 'storeengine' ),
			value: 'JA',
		},
		{
			label: __( 'Nuevo León', 'storeengine' ),
			value: 'NL',
		},
		{
			label: __( 'Aguascalientes', 'storeengine' ),
			value: 'AG',
		},
		{
			label: __( 'Baja California', 'storeengine' ),
			value: 'BC',
		},
		{
			label: __( 'Baja California Sur', 'storeengine' ),
			value: 'BS',
		},
		{
			label: __( 'Campeche', 'storeengine' ),
			value: 'CM',
		},
		{
			label: __( 'Chiapas', 'storeengine' ),
			value: 'CS',
		},
		{
			label: __( 'Chihuahua', 'storeengine' ),
			value: 'CH',
		},
		{
			label: __( 'Coahuila', 'storeengine' ),
			value: 'CO',
		},
		{
			label: __( 'Colima', 'storeengine' ),
			value: 'CL',
		},
		{
			label: __( 'Durango', 'storeengine' ),
			value: 'DG',
		},
		{
			label: __( 'Guanajuato', 'storeengine' ),
			value: 'GT',
		},
		{
			label: __( 'Guerrero', 'storeengine' ),
			value: 'GR',
		},
		{
			label: __( 'Hidalgo', 'storeengine' ),
			value: 'HG',
		},
		{
			label: __( 'Estado de México', 'storeengine' ),
			value: 'MX',
		},
		{
			label: __( 'Michoacán', 'storeengine' ),
			value: 'MI',
		},
		{
			label: __( 'Morelos', 'storeengine' ),
			value: 'MO',
		},
		{
			label: __( 'Nayarit', 'storeengine' ),
			value: 'NA',
		},
		{
			label: __( 'Oaxaca', 'storeengine' ),
			value: 'OA',
		},
		{
			label: __( 'Puebla', 'storeengine' ),
			value: 'PU',
		},
		{
			label: __( 'Querétaro', 'storeengine' ),
			value: 'QT',
		},
		{
			label: __( 'Quintana Roo', 'storeengine' ),
			value: 'QR',
		},
		{
			label: __( 'San Luis Potosí', 'storeengine' ),
			value: 'SL',
		},
		{
			label: __( 'Sinaloa', 'storeengine' ),
			value: 'SI',
		},
		{
			label: __( 'Sonora', 'storeengine' ),
			value: 'SO',
		},
		{
			label: __( 'Tabasco', 'storeengine' ),
			value: 'TB',
		},
		{
			label: __( 'Tamaulipas', 'storeengine' ),
			value: 'TM',
		},
		{
			label: __( 'Tlaxcala', 'storeengine' ),
			value: 'TL',
		},
		{
			label: __( 'Veracruz', 'storeengine' ),
			value: 'VE',
		},
		{
			label: __( 'Yucatán', 'storeengine' ),
			value: 'YU',
		},
		{
			label: __( 'Zacatecas', 'storeengine' ),
			value: 'ZA',
		},
	],
	MY: [
		// Malaysian states.
		{
			label: __( 'Johor', 'storeengine' ),
			value: 'JHR',
		},
		{
			label: __( 'Kedah', 'storeengine' ),
			value: 'KDH',
		},
		{
			label: __( 'Kelantan', 'storeengine' ),
			value: 'KTN',
		},
		{
			label: __( 'Labuan', 'storeengine' ),
			value: 'LBN',
		},
		{
			label: __( 'Malacca (Melaka)', 'storeengine' ),
			value: 'MLK',
		},
		{
			label: __( 'Negeri Sembilan', 'storeengine' ),
			value: 'NSN',
		},
		{
			label: __( 'Pahang', 'storeengine' ),
			value: 'PHG',
		},
		{
			label: __( 'Penang (Pulau Pinang)', 'storeengine' ),
			value: 'PNG',
		},
		{
			label: __( 'Perak', 'storeengine' ),
			value: 'PRK',
		},
		{
			label: __( 'Perlis', 'storeengine' ),
			value: 'PLS',
		},
		{
			label: __( 'Sabah', 'storeengine' ),
			value: 'SBH',
		},
		{
			label: __( 'Sarawak', 'storeengine' ),
			value: 'SWK',
		},
		{
			label: __( 'Selangor', 'storeengine' ),
			value: 'SGR',
		},
		{
			label: __( 'Terengganu', 'storeengine' ),
			value: 'TRG',
		},
		{
			label: __( 'Putrajaya', 'storeengine' ),
			value: 'PJY',
		},
		{
			label: __( 'Kuala Lumpur', 'storeengine' ),
			value: 'KUL',
		},
	],
	MZ: [
		// Mozambican provinces.
		{
			label: __( 'Cabo Delgado', 'storeengine' ),
			value: 'MZP',
		},
		{
			label: __( 'Gaza', 'storeengine' ),
			value: 'MZG',
		},
		{
			label: __( 'Inhambane', 'storeengine' ),
			value: 'MZI',
		},
		{
			label: __( 'Manica', 'storeengine' ),
			value: 'MZB',
		},
		{
			label: __( 'Maputo Province', 'storeengine' ),
			value: 'MZL',
		},
		{
			label: __( 'Maputo', 'storeengine' ),
			value: 'MZMPM',
		},
		{
			label: __( 'Nampula', 'storeengine' ),
			value: 'MZN',
		},
		{
			label: __( 'Niassa', 'storeengine' ),
			value: 'MZA',
		},
		{
			label: __( 'Sofala', 'storeengine' ),
			value: 'MZS',
		},
		{
			label: __( 'Tete', 'storeengine' ),
			value: 'MZT',
		},
		{
			label: __( 'Zambézia', 'storeengine' ),
			value: 'MZQ',
		},
	],
	NA: [
		// Namibian regions.
		{
			label: __( 'Erongo', 'storeengine' ),
			value: 'ER',
		},
		{
			label: __( 'Hardap', 'storeengine' ),
			value: 'HA',
		},
		{
			label: __( 'Karas', 'storeengine' ),
			value: 'KA',
		},
		{
			label: __( 'Kavango East', 'storeengine' ),
			value: 'KE',
		},
		{
			label: __( 'Kavango West', 'storeengine' ),
			value: 'KW',
		},
		{
			label: __( 'Khomas', 'storeengine' ),
			value: 'KH',
		},
		{
			label: __( 'Kunene', 'storeengine' ),
			value: 'KU',
		},
		{
			label: __( 'Ohangwena', 'storeengine' ),
			value: 'OW',
		},
		{
			label: __( 'Omaheke', 'storeengine' ),
			value: 'OH',
		},
		{
			label: __( 'Omusati', 'storeengine' ),
			value: 'OS',
		},
		{
			label: __( 'Oshana', 'storeengine' ),
			value: 'ON',
		},
		{
			label: __( 'Oshikoto', 'storeengine' ),
			value: 'OT',
		},
		{
			label: __( 'Otjozondjupa', 'storeengine' ),
			value: 'OD',
		},
		{
			label: __( 'Zambezi', 'storeengine' ),
			value: 'CA',
		},
	],
	NG: [
		// Nigerian provinces.
		{
			label: __( 'Abia', 'storeengine' ),
			value: 'AB',
		},
		{
			label: __( 'Abuja', 'storeengine' ),
			value: 'FC',
		},
		{
			label: __( 'Adamawa', 'storeengine' ),
			value: 'AD',
		},
		{
			label: __( 'Akwa Ibom', 'storeengine' ),
			value: 'AK',
		},
		{
			label: __( 'Anambra', 'storeengine' ),
			value: 'AN',
		},
		{
			label: __( 'Bauchi', 'storeengine' ),
			value: 'BA',
		},
		{
			label: __( 'Bayelsa', 'storeengine' ),
			value: 'BY',
		},
		{
			label: __( 'Benue', 'storeengine' ),
			value: 'BE',
		},
		{
			label: __( 'Borno', 'storeengine' ),
			value: 'BO',
		},
		{
			label: __( 'Cross River', 'storeengine' ),
			value: 'CR',
		},
		{
			label: __( 'Delta', 'storeengine' ),
			value: 'DE',
		},
		{
			label: __( 'Ebonyi', 'storeengine' ),
			value: 'EB',
		},
		{
			label: __( 'Edo', 'storeengine' ),
			value: 'ED',
		},
		{
			label: __( 'Ekiti', 'storeengine' ),
			value: 'EK',
		},
		{
			label: __( 'Enugu', 'storeengine' ),
			value: 'EN',
		},
		{
			label: __( 'Gombe', 'storeengine' ),
			value: 'GO',
		},
		{
			label: __( 'Imo', 'storeengine' ),
			value: 'IM',
		},
		{
			label: __( 'Jigawa', 'storeengine' ),
			value: 'JI',
		},
		{
			label: __( 'Kaduna', 'storeengine' ),
			value: 'KD',
		},
		{
			label: __( 'Kano', 'storeengine' ),
			value: 'KN',
		},
		{
			label: __( 'Katsina', 'storeengine' ),
			value: 'KT',
		},
		{
			label: __( 'Kebbi', 'storeengine' ),
			value: 'KE',
		},
		{
			label: __( 'Kogi', 'storeengine' ),
			value: 'KO',
		},
		{
			label: __( 'Kwara', 'storeengine' ),
			value: 'KW',
		},
		{
			label: __( 'Lagos', 'storeengine' ),
			value: 'LA',
		},
		{
			label: __( 'Nasarawa', 'storeengine' ),
			value: 'NA',
		},
		{
			label: __( 'Niger', 'storeengine' ),
			value: 'NI',
		},
		{
			label: __( 'Ogun', 'storeengine' ),
			value: 'OG',
		},
		{
			label: __( 'Ondo', 'storeengine' ),
			value: 'ON',
		},
		{
			label: __( 'Osun', 'storeengine' ),
			value: 'OS',
		},
		{
			label: __( 'Oyo', 'storeengine' ),
			value: 'OY',
		},
		{
			label: __( 'Plateau', 'storeengine' ),
			value: 'PL',
		},
		{
			label: __( 'Rivers', 'storeengine' ),
			value: 'RI',
		},
		{
			label: __( 'Sokoto', 'storeengine' ),
			value: 'SO',
		},
		{
			label: __( 'Taraba', 'storeengine' ),
			value: 'TA',
		},
		{
			label: __( 'Yobe', 'storeengine' ),
			value: 'YO',
		},
		{
			label: __( 'Zamfara', 'storeengine' ),
			value: 'ZA',
		},
	],
	NL: [],
	NO: [],
	NP: [
		// Nepalese zones.
		{
			label: __( 'Bagmati', 'storeengine' ),
			value: 'BAG',
		},
		{
			label: __( 'Bheri', 'storeengine' ),
			value: 'BHE',
		},
		{
			label: __( 'Dhaulagiri', 'storeengine' ),
			value: 'DHA',
		},
		{
			label: __( 'Gandaki', 'storeengine' ),
			value: 'GAN',
		},
		{
			label: __( 'Janakpur', 'storeengine' ),
			value: 'JAN',
		},
		{
			label: __( 'Karnali', 'storeengine' ),
			value: 'KAR',
		},
		{
			label: __( 'Koshi', 'storeengine' ),
			value: 'KOS',
		},
		{
			label: __( 'Lumbini', 'storeengine' ),
			value: 'LUM',
		},
		{
			label: __( 'Mahakali', 'storeengine' ),
			value: 'MAH',
		},
		{
			label: __( 'Mechi', 'storeengine' ),
			value: 'MEC',
		},
		{
			label: __( 'Narayani', 'storeengine' ),
			value: 'NAR',
		},
		{
			label: __( 'Rapti', 'storeengine' ),
			value: 'RAP',
		},
		{
			label: __( 'Sagarmatha', 'storeengine' ),
			value: 'SAG',
		},
		{
			label: __( 'Seti', 'storeengine' ),
			value: 'SET',
		},
	],
	NI: [
		// Nicaraguan states.
		{
			label: __( 'Atlántico Norte', 'storeengine' ),
			value: 'NI-AN',
		},
		{
			label: __( 'Atlántico Sur', 'storeengine' ),
			value: 'NI-AS',
		},
		{
			label: __( 'Boaco', 'storeengine' ),
			value: 'NI-BO',
		},
		{
			label: __( 'Carazo', 'storeengine' ),
			value: 'NI-CA',
		},
		{
			label: __( 'Chinandega', 'storeengine' ),
			value: 'NI-CI',
		},
		{
			label: __( 'Chontales', 'storeengine' ),
			value: 'NI-CO',
		},
		{
			label: __( 'Estelí', 'storeengine' ),
			value: 'NI-ES',
		},
		{
			label: __( 'Granada', 'storeengine' ),
			value: 'NI-GR',
		},
		{
			label: __( 'Jinotega', 'storeengine' ),
			value: 'NI-JI',
		},
		{
			label: __( 'León', 'storeengine' ),
			value: 'NI-LE',
		},
		{
			label: __( 'Madriz', 'storeengine' ),
			value: 'NI-MD',
		},
		{
			label: __( 'Managua', 'storeengine' ),
			value: 'NI-MN',
		},
		{
			label: __( 'Masaya', 'storeengine' ),
			value: 'NI-MS',
		},
		{
			label: __( 'Matagalpa', 'storeengine' ),
			value: 'NI-MT',
		},
		{
			label: __( 'Nueva Segovia', 'storeengine' ),
			value: 'NI-NS',
		},
		{
			label: __( 'Rivas', 'storeengine' ),
			value: 'NI-RI',
		},
		{
			label: __( 'Río San Juan', 'storeengine' ),
			value: 'NI-SJ',
		},
	],
	NZ: [
		// New Zealand states.
		{
			label: __( 'Northland', 'storeengine' ),
			value: 'NTL',
		},
		{
			label: __( 'Auckland', 'storeengine' ),
			value: 'AUK',
		},
		{
			label: __( 'Waikato', 'storeengine' ),
			value: 'WKO',
		},
		{
			label: __( 'Bay of Plenty', 'storeengine' ),
			value: 'BOP',
		},
		{
			label: __( 'Taranaki', 'storeengine' ),
			value: 'TKI',
		},
		{
			label: __( 'Gisborne', 'storeengine' ),
			value: 'GIS',
		},
		{
			label: __( 'Hawke’s Bay', 'storeengine' ),
			value: 'HKB',
		},
		{
			label: __( 'Manawatu-Wanganui', 'storeengine' ),
			value: 'MWT',
		},
		{
			label: __( 'Wellington', 'storeengine' ),
			value: 'WGN',
		},
		{
			label: __( 'Nelson', 'storeengine' ),
			value: 'NSN',
		},
		{
			label: __( 'Marlborough', 'storeengine' ),
			value: 'MBH',
		},
		{
			label: __( 'Tasman', 'storeengine' ),
			value: 'TAS',
		},
		{
			label: __( 'West Coast', 'storeengine' ),
			value: 'WTC',
		},
		{
			label: __( 'Canterbury', 'storeengine' ),
			value: 'CAN',
		},
		{
			label: __( 'Otago', 'storeengine' ),
			value: 'OTA',
		},
		{
			label: __( 'Southland', 'storeengine' ),
			value: 'STL',
		},
	],
	PA: [
		// Panamanian states.
		{
			label: __( 'Bocas del Toro', 'storeengine' ),
			value: 'PA-1',
		},
		{
			label: __( 'Coclé', 'storeengine' ),
			value: 'PA-2',
		},
		{
			label: __( 'Colón', 'storeengine' ),
			value: 'PA-3',
		},
		{
			label: __( 'Chiriquí', 'storeengine' ),
			value: 'PA-4',
		},
		{
			label: __( 'Darién', 'storeengine' ),
			value: 'PA-5',
		},
		{
			label: __( 'Herrera', 'storeengine' ),
			value: 'PA-6',
		},
		{
			label: __( 'Los Santos', 'storeengine' ),
			value: 'PA-7',
		},
		{
			label: __( 'Panamá', 'storeengine' ),
			value: 'PA-8',
		},
		{
			label: __( 'Veraguas', 'storeengine' ),
			value: 'PA-9',
		},
		{
			label: __( 'West Panamá', 'storeengine' ),
			value: 'PA-10',
		},
		{
			label: __( 'Emberá', 'storeengine' ),
			value: 'PA-EM',
		},
		{
			label: __( 'Guna Yala', 'storeengine' ),
			value: 'PA-KY',
		},
		{
			label: __( 'Ngöbe-Buglé', 'storeengine' ),
			value: 'PA-NB',
		},
	],
	PE: [
		// Peruvian states.
		{
			label: __( 'El Callao', 'storeengine' ),
			value: 'CAL',
		},
		{
			label: __( 'Municipalidad Metropolitana de Lima', 'storeengine' ),
			value: 'LMA',
		},
		{
			label: __( 'Amazonas', 'storeengine' ),
			value: 'AMA',
		},
		{
			label: __( 'Ancash', 'storeengine' ),
			value: 'ANC',
		},
		{
			label: __( 'Apurímac', 'storeengine' ),
			value: 'APU',
		},
		{
			label: __( 'Arequipa', 'storeengine' ),
			value: 'ARE',
		},
		{
			label: __( 'Ayacucho', 'storeengine' ),
			value: 'AYA',
		},
		{
			label: __( 'Cajamarca', 'storeengine' ),
			value: 'CAJ',
		},
		{
			label: __( 'Cusco', 'storeengine' ),
			value: 'CUS',
		},
		{
			label: __( 'Huancavelica', 'storeengine' ),
			value: 'HUV',
		},
		{
			label: __( 'Huánuco', 'storeengine' ),
			value: 'HUC',
		},
		{
			label: __( 'Ica', 'storeengine' ),
			value: 'ICA',
		},
		{
			label: __( 'Junín', 'storeengine' ),
			value: 'JUN',
		},
		{
			label: __( 'La Libertad', 'storeengine' ),
			value: 'LAL',
		},
		{
			label: __( 'Lambayeque', 'storeengine' ),
			value: 'LAM',
		},
		{
			label: __( 'Lima', 'storeengine' ),
			value: 'LIM',
		},
		{
			label: __( 'Loreto', 'storeengine' ),
			value: 'LOR',
		},
		{
			label: __( 'Madre de Dios', 'storeengine' ),
			value: 'MDD',
		},
		{
			label: __( 'Moquegua', 'storeengine' ),
			value: 'MOQ',
		},
		{
			label: __( 'Pasco', 'storeengine' ),
			value: 'PAS',
		},
		{
			label: __( 'Piura', 'storeengine' ),
			value: 'PIU',
		},
		{
			label: __( 'Puno', 'storeengine' ),
			value: 'PUN',
		},
		{
			label: __( 'San Martín', 'storeengine' ),
			value: 'SAM',
		},
		{
			label: __( 'Tacna', 'storeengine' ),
			value: 'TAC',
		},
		{
			label: __( 'Tumbes', 'storeengine' ),
			value: 'TUM',
		},
		{
			label: __( 'Ucayali', 'storeengine' ),
			value: 'UCA',
		},
	],
	PH: [
		// Philippine provinces.
		{
			label: __( 'Abra', 'storeengine' ),
			value: 'ABR',
		},
		{
			label: __( 'Agusan del Norte', 'storeengine' ),
			value: 'AGN',
		},
		{
			label: __( 'Agusan del Sur', 'storeengine' ),
			value: 'AGS',
		},
		{
			label: __( 'Aklan', 'storeengine' ),
			value: 'AKL',
		},
		{
			label: __( 'Albay', 'storeengine' ),
			value: 'ALB',
		},
		{
			label: __( 'Antique', 'storeengine' ),
			value: 'ANT',
		},
		{
			label: __( 'Apayao', 'storeengine' ),
			value: 'APA',
		},
		{
			label: __( 'Aurora', 'storeengine' ),
			value: 'AUR',
		},
		{
			label: __( 'Basilan', 'storeengine' ),
			value: 'BAS',
		},
		{
			label: __( 'Bataan', 'storeengine' ),
			value: 'BAN',
		},
		{
			label: __( 'Batanes', 'storeengine' ),
			value: 'BTN',
		},
		{
			label: __( 'Batangas', 'storeengine' ),
			value: 'BTG',
		},
		{
			label: __( 'Benguet', 'storeengine' ),
			value: 'BEN',
		},
		{
			label: __( 'Biliran', 'storeengine' ),
			value: 'BIL',
		},
		{
			label: __( 'Bohol', 'storeengine' ),
			value: 'BOH',
		},
		{
			label: __( 'Bukidnon', 'storeengine' ),
			value: 'BUK',
		},
		{
			label: __( 'Bulacan', 'storeengine' ),
			value: 'BUL',
		},
		{
			label: __( 'Cagayan', 'storeengine' ),
			value: 'CAG',
		},
		{
			label: __( 'Camarines Norte', 'storeengine' ),
			value: 'CAN',
		},
		{
			label: __( 'Camarines Sur', 'storeengine' ),
			value: 'CAS',
		},
		{
			label: __( 'Camiguin', 'storeengine' ),
			value: 'CAM',
		},
		{
			label: __( 'Capiz', 'storeengine' ),
			value: 'CAP',
		},
		{
			label: __( 'Catanduanes', 'storeengine' ),
			value: 'CAT',
		},
		{
			label: __( 'Cavite', 'storeengine' ),
			value: 'CAV',
		},
		{
			label: __( 'Cebu', 'storeengine' ),
			value: 'CEB',
		},
		{
			label: __( 'Compostela Valley', 'storeengine' ),
			value: 'COM',
		},
		{
			label: __( 'Cotabato', 'storeengine' ),
			value: 'NCO',
		},
		{
			label: __( 'Davao del Norte', 'storeengine' ),
			value: 'DAV',
		},
		{
			label: __( 'Davao del Sur', 'storeengine' ),
			value: 'DAS',
		},
		{
			label: __( 'Davao Occidental', 'storeengine' ),
			value: 'DAC',
		},
		{
			label: __( 'Davao Oriental', 'storeengine' ),
			value: 'DAO',
		},
		{
			label: __( 'Dinagat Islands', 'storeengine' ),
			value: 'DIN',
		},
		{
			label: __( 'Eastern Samar', 'storeengine' ),
			value: 'EAS',
		},
		{
			label: __( 'Guimaras', 'storeengine' ),
			value: 'GUI',
		},
		{
			label: __( 'Ifugao', 'storeengine' ),
			value: 'IFU',
		},
		{
			label: __( 'Ilocos Norte', 'storeengine' ),
			value: 'ILN',
		},
		{
			label: __( 'Ilocos Sur', 'storeengine' ),
			value: 'ILS',
		},
		{
			label: __( 'Iloilo', 'storeengine' ),
			value: 'ILI',
		},
		{
			label: __( 'Isabela', 'storeengine' ),
			value: 'ISA',
		},
		{
			label: __( 'Kalinga', 'storeengine' ),
			value: 'KAL',
		},
		{
			label: __( 'La Union', 'storeengine' ),
			value: 'LUN',
		},
		{
			label: __( 'Laguna', 'storeengine' ),
			value: 'LAG',
		},
		{
			label: __( 'Lanao del Norte', 'storeengine' ),
			value: 'LAN',
		},
		{
			label: __( 'Lanao del Sur', 'storeengine' ),
			value: 'LAS',
		},
		{
			label: __( 'Leyte', 'storeengine' ),
			value: 'LEY',
		},
		{
			label: __( 'Maguindanao', 'storeengine' ),
			value: 'MAG',
		},
		{
			label: __( 'Marinduque', 'storeengine' ),
			value: 'MAD',
		},
		{
			label: __( 'Masbate', 'storeengine' ),
			value: 'MAS',
		},
		{
			label: __( 'Misamis Occidental', 'storeengine' ),
			value: 'MSC',
		},
		{
			label: __( 'Misamis Oriental', 'storeengine' ),
			value: 'MSR',
		},
		{
			label: __( 'Mountain Province', 'storeengine' ),
			value: 'MOU',
		},
		{
			label: __( 'Negros Occidental', 'storeengine' ),
			value: 'NEC',
		},
		{
			label: __( 'Negros Oriental', 'storeengine' ),
			value: 'NER',
		},
		{
			label: __( 'Northern Samar', 'storeengine' ),
			value: 'NSA',
		},
		{
			label: __( 'Nueva Ecija', 'storeengine' ),
			value: 'NUE',
		},
		{
			label: __( 'Nueva Vizcaya', 'storeengine' ),
			value: 'NUV',
		},
		{
			label: __( 'Occidental Mindoro', 'storeengine' ),
			value: 'MDC',
		},
		{
			label: __( 'Oriental Mindoro', 'storeengine' ),
			value: 'MDR',
		},
		{
			label: __( 'Palawan', 'storeengine' ),
			value: 'PLW',
		},
		{
			label: __( 'Pampanga', 'storeengine' ),
			value: 'PAM',
		},
		{
			label: __( 'Pangasinan', 'storeengine' ),
			value: 'PAN',
		},
		{
			label: __( 'Quezon', 'storeengine' ),
			value: 'QUE',
		},
		{
			label: __( 'Quirino', 'storeengine' ),
			value: 'QUI',
		},
		{
			label: __( 'Rizal', 'storeengine' ),
			value: 'RIZ',
		},
		{
			label: __( 'Romblon', 'storeengine' ),
			value: 'ROM',
		},
		{
			label: __( 'Samar', 'storeengine' ),
			value: 'WSA',
		},
		{
			label: __( 'Sarangani', 'storeengine' ),
			value: 'SAR',
		},
		{
			label: __( 'Siquijor', 'storeengine' ),
			value: 'SIQ',
		},
		{
			label: __( 'Sorsogon', 'storeengine' ),
			value: 'SOR',
		},
		{
			label: __( 'South Cotabato', 'storeengine' ),
			value: 'SCO',
		},
		{
			label: __( 'Southern Leyte', 'storeengine' ),
			value: 'SLE',
		},
		{
			label: __( 'Sultan Kudarat', 'storeengine' ),
			value: 'SUK',
		},
		{
			label: __( 'Sulu', 'storeengine' ),
			value: 'SLU',
		},
		{
			label: __( 'Surigao del Norte', 'storeengine' ),
			value: 'SUN',
		},
		{
			label: __( 'Surigao del Sur', 'storeengine' ),
			value: 'SUR',
		},
		{
			label: __( 'Tarlac', 'storeengine' ),
			value: 'TAR',
		},
		{
			label: __( 'Tawi-Tawi', 'storeengine' ),
			value: 'TAW',
		},
		{
			label: __( 'Zambales', 'storeengine' ),
			value: 'ZMB',
		},
		{
			label: __( 'Zamboanga del Norte', 'storeengine' ),
			value: 'ZAN',
		},
		{
			label: __( 'Zamboanga del Sur', 'storeengine' ),
			value: 'ZAS',
		},
		{
			label: __( 'Zamboanga Sibugay', 'storeengine' ),
			value: 'ZSI',
		},
		{
			label: __( 'Metro Manila', 'storeengine' ),
			value: '00',
		},
	],
	PK: [
		// Pakistani states.
		{
			label: __( 'Azad Kashmir', 'storeengine' ),
			value: 'JK',
		},
		{
			label: __( 'Balochistan', 'storeengine' ),
			value: 'BA',
		},
		{
			label: __( 'FATA', 'storeengine' ),
			value: 'TA',
		},
		{
			label: __( 'Gilgit Baltistan', 'storeengine' ),
			value: 'GB',
		},
		{
			label: __( 'Islamabad Capital Territory', 'storeengine' ),
			value: 'IS',
		},
		{
			label: __( 'Khyber Pakhtunkhwa', 'storeengine' ),
			value: 'KP',
		},
		{
			label: __( 'Punjab', 'storeengine' ),
			value: 'PB',
		},
		{
			label: __( 'Sindh', 'storeengine' ),
			value: 'SD',
		},
	],
	PL: [],
	PR: [],
	PT: [],
	PY: [
		// Paraguayan states.
		{
			label: __( 'Asunción', 'storeengine' ),
			value: 'PY-ASU',
		},
		{
			label: __( 'Concepción', 'storeengine' ),
			value: 'PY-1',
		},
		{
			label: __( 'San Pedro', 'storeengine' ),
			value: 'PY-2',
		},
		{
			label: __( 'Cordillera', 'storeengine' ),
			value: 'PY-3',
		},
		{
			label: __( 'Guairá', 'storeengine' ),
			value: 'PY-4',
		},
		{
			label: __( 'Caaguazú', 'storeengine' ),
			value: 'PY-5',
		},
		{
			label: __( 'Caazapá', 'storeengine' ),
			value: 'PY-6',
		},
		{
			label: __( 'Itapúa', 'storeengine' ),
			value: 'PY-7',
		},
		{
			label: __( 'Misiones', 'storeengine' ),
			value: 'PY-8',
		},
		{
			label: __( 'Paraguarí', 'storeengine' ),
			value: 'PY-9',
		},
		{
			label: __( 'Alto Paraná', 'storeengine' ),
			value: 'PY-10',
		},
		{
			label: __( 'Central', 'storeengine' ),
			value: 'PY-11',
		},
		{
			label: __( 'Ñeembucú', 'storeengine' ),
			value: 'PY-12',
		},
		{
			label: __( 'Amambay', 'storeengine' ),
			value: 'PY-13',
		},
		{
			label: __( 'Canindeyú', 'storeengine' ),
			value: 'PY-14',
		},
		{
			label: __( 'Presidente Hayes', 'storeengine' ),
			value: 'PY-15',
		},
		{
			label: __( 'Alto Paraguay', 'storeengine' ),
			value: 'PY-16',
		},
		{
			label: __( 'Boquerón', 'storeengine' ),
			value: 'PY-17',
		},
	],
	RE: [],
	RO: [
		// Romanian states.
		{
			label: __( 'Alba', 'storeengine' ),
			value: 'AB',
		},
		{
			label: __( 'Arad', 'storeengine' ),
			value: 'AR',
		},
		{
			label: __( 'Argeș', 'storeengine' ),
			value: 'AG',
		},
		{
			label: __( 'Bacău', 'storeengine' ),
			value: 'BC',
		},
		{
			label: __( 'Bihor', 'storeengine' ),
			value: 'BH',
		},
		{
			label: __( 'Bistrița-Năsăud', 'storeengine' ),
			value: 'BN',
		},
		{
			label: __( 'Botoșani', 'storeengine' ),
			value: 'BT',
		},
		{
			label: __( 'Brăila', 'storeengine' ),
			value: 'BR',
		},
		{
			label: __( 'Brașov', 'storeengine' ),
			value: 'BV',
		},
		{
			label: __( 'București', 'storeengine' ),
			value: 'B',
		},
		{
			label: __( 'Buzău', 'storeengine' ),
			value: 'BZ',
		},
		{
			label: __( 'Călărași', 'storeengine' ),
			value: 'CL',
		},
		{
			label: __( 'Caraș-Severin', 'storeengine' ),
			value: 'CS',
		},
		{
			label: __( 'Cluj', 'storeengine' ),
			value: 'CJ',
		},
		{
			label: __( 'Constanța', 'storeengine' ),
			value: 'CT',
		},
		{
			label: __( 'Covasna', 'storeengine' ),
			value: 'CV',
		},
		{
			label: __( 'Dâmbovița', 'storeengine' ),
			value: 'DB',
		},
		{
			label: __( 'Dolj', 'storeengine' ),
			value: 'DJ',
		},
		{
			label: __( 'Galați', 'storeengine' ),
			value: 'GL',
		},
		{
			label: __( 'Giurgiu', 'storeengine' ),
			value: 'GR',
		},
		{
			label: __( 'Gorj', 'storeengine' ),
			value: 'GJ',
		},
		{
			label: __( 'Harghita', 'storeengine' ),
			value: 'HR',
		},
		{
			label: __( 'Hunedoara', 'storeengine' ),
			value: 'HD',
		},
		{
			label: __( 'Ialomița', 'storeengine' ),
			value: 'IL',
		},
		{
			label: __( 'Iași', 'storeengine' ),
			value: 'IS',
		},
		{
			label: __( 'Ilfov', 'storeengine' ),
			value: 'IF',
		},
		{
			label: __( 'Maramureș', 'storeengine' ),
			value: 'MM',
		},
		{
			label: __( 'Mehedinți', 'storeengine' ),
			value: 'MH',
		},
		{
			label: __( 'Mureș', 'storeengine' ),
			value: 'MS',
		},
		{
			label: __( 'Neamț', 'storeengine' ),
			value: 'NT',
		},
		{
			label: __( 'Olt', 'storeengine' ),
			value: 'OT',
		},
		{
			label: __( 'Prahova', 'storeengine' ),
			value: 'PH',
		},
		{
			label: __( 'Sălaj', 'storeengine' ),
			value: 'SJ',
		},
		{
			label: __( 'Satu Mare', 'storeengine' ),
			value: 'SM',
		},
		{
			label: __( 'Sibiu', 'storeengine' ),
			value: 'SB',
		},
		{
			label: __( 'Suceava', 'storeengine' ),
			value: 'SV',
		},
		{
			label: __( 'Teleorman', 'storeengine' ),
			value: 'TR',
		},
		{
			label: __( 'Timiș', 'storeengine' ),
			value: 'TM',
		},
		{
			label: __( 'Tulcea', 'storeengine' ),
			value: 'TL',
		},
		{
			label: __( 'Vâlcea', 'storeengine' ),
			value: 'VL',
		},
		{
			label: __( 'Vaslui', 'storeengine' ),
			value: 'VS',
		},
		{
			label: __( 'Vrancea', 'storeengine' ),
			value: 'VN',
		},
	],
	SN: [
		// Regions of Senegal. Ref: https://github.com/unicode-org/cldr/blob/release-42/common/subdivisions/en.xml#L4801.
		{
			label: __( 'Diourbel', 'storeengine' ),
			value: 'SNDB',
		},
		{
			label: __( 'Dakar', 'storeengine' ),
			value: 'SNDK',
		},
		{
			label: __( 'Fatick', 'storeengine' ),
			value: 'SNFK',
		},
		{
			label: __( 'Kaffrine', 'storeengine' ),
			value: 'SNKA',
		},
		{
			label: __( 'Kolda', 'storeengine' ),
			value: 'SNKD',
		},
		{
			label: __( 'Kédougou', 'storeengine' ),
			value: 'SNKE',
		},
		{
			label: __( 'Kaolack', 'storeengine' ),
			value: 'SNKL',
		},
		{
			label: __( 'Louga', 'storeengine' ),
			value: 'SNLG',
		},
		{
			label: __( 'Matam', 'storeengine' ),
			value: 'SNMT',
		},
		{
			label: __( 'Sédhiou', 'storeengine' ),
			value: 'SNSE',
		},
		{
			label: __( 'Saint-Louis', 'storeengine' ),
			value: 'SNSL',
		},
		{
			label: __( 'Tambacounda', 'storeengine' ),
			value: 'SNTC',
		},
		{
			label: __( 'Thiès', 'storeengine' ),
			value: 'SNTH',
		},
		{
			label: __( 'Ziguinchor', 'storeengine' ),
			value: 'SNZG',
		},
	],
	SG: [],
	SK: [],
	SI: [],
	SV: [
		// Salvadoran states.
		{
			label: __( 'Ahuachapán', 'storeengine' ),
			value: 'SV-AH',
		},
		{
			label: __( 'Cabañas', 'storeengine' ),
			value: 'SV-CA',
		},
		{
			label: __( 'Chalatenango', 'storeengine' ),
			value: 'SV-CH',
		},
		{
			label: __( 'Cuscatlán', 'storeengine' ),
			value: 'SV-CU',
		},
		{
			label: __( 'La Libertad', 'storeengine' ),
			value: 'SV-LI',
		},
		{
			label: __( 'Morazán', 'storeengine' ),
			value: 'SV-MO',
		},
		{
			label: __( 'La Paz', 'storeengine' ),
			value: 'SV-PA',
		},
		{
			label: __( 'Santa Ana', 'storeengine' ),
			value: 'SV-SA',
		},
		{
			label: __( 'San Miguel', 'storeengine' ),
			value: 'SV-SM',
		},
		{
			label: __( 'Sonsonate', 'storeengine' ),
			value: 'SV-SO',
		},
		{
			label: __( 'San Salvador', 'storeengine' ),
			value: 'SV-SS',
		},
		{
			label: __( 'San Vicente', 'storeengine' ),
			value: 'SV-SV',
		},
		{
			label: __( 'La Unión', 'storeengine' ),
			value: 'SV-UN',
		},
		{
			label: __( 'Usulután', 'storeengine' ),
			value: 'SV-US',
		},
	],
	TH: [
		// Thai states.
		{
			label: __( 'Amnat Charoen', 'storeengine' ),
			value: 'TH-37',
		},
		{
			label: __( 'Ang Thong', 'storeengine' ),
			value: 'TH-15',
		},
		{
			label: __( 'Ayutthaya', 'storeengine' ),
			value: 'TH-14',
		},
		{
			label: __( 'Bangkok', 'storeengine' ),
			value: 'TH-10',
		},
		{
			label: __( 'Bueng Kan', 'storeengine' ),
			value: 'TH-38',
		},
		{
			label: __( 'Buri Ram', 'storeengine' ),
			value: 'TH-31',
		},
		{
			label: __( 'Chachoengsao', 'storeengine' ),
			value: 'TH-24',
		},
		{
			label: __( 'Chai Nat', 'storeengine' ),
			value: 'TH-18',
		},
		{
			label: __( 'Chaiyaphum', 'storeengine' ),
			value: 'TH-36',
		},
		{
			label: __( 'Chanthaburi', 'storeengine' ),
			value: 'TH-22',
		},
		{
			label: __( 'Chiang Mai', 'storeengine' ),
			value: 'TH-50',
		},
		{
			label: __( 'Chiang Rai', 'storeengine' ),
			value: 'TH-57',
		},
		{
			label: __( 'Chonburi', 'storeengine' ),
			value: 'TH-20',
		},
		{
			label: __( 'Chumphon', 'storeengine' ),
			value: 'TH-86',
		},
		{
			label: __( 'Kalasin', 'storeengine' ),
			value: 'TH-46',
		},
		{
			label: __( 'Kamphaeng Phet', 'storeengine' ),
			value: 'TH-62',
		},
		{
			label: __( 'Kanchanaburi', 'storeengine' ),
			value: 'TH-71',
		},
		{
			label: __( 'Khon Kaen', 'storeengine' ),
			value: 'TH-40',
		},
		{
			label: __( 'Krabi', 'storeengine' ),
			value: 'TH-81',
		},
		{
			label: __( 'Lampang', 'storeengine' ),
			value: 'TH-52',
		},
		{
			label: __( 'Lamphun', 'storeengine' ),
			value: 'TH-51',
		},
		{
			label: __( 'Loei', 'storeengine' ),
			value: 'TH-42',
		},
		{
			label: __( 'Lopburi', 'storeengine' ),
			value: 'TH-16',
		},
		{
			label: __( 'Mae Hong Son', 'storeengine' ),
			value: 'TH-58',
		},
		{
			label: __( 'Maha Sarakham', 'storeengine' ),
			value: 'TH-44',
		},
		{
			label: __( 'Mukdahan', 'storeengine' ),
			value: 'TH-49',
		},
		{
			label: __( 'Nakhon Nayok', 'storeengine' ),
			value: 'TH-26',
		},
		{
			label: __( 'Nakhon Pathom', 'storeengine' ),
			value: 'TH-73',
		},
		{
			label: __( 'Nakhon Phanom', 'storeengine' ),
			value: 'TH-48',
		},
		{
			label: __( 'Nakhon Ratchasima', 'storeengine' ),
			value: 'TH-30',
		},
		{
			label: __( 'Nakhon Sawan', 'storeengine' ),
			value: 'TH-60',
		},
		{
			label: __( 'Nakhon Si Thammarat', 'storeengine' ),
			value: 'TH-80',
		},
		{
			label: __( 'Nan', 'storeengine' ),
			value: 'TH-55',
		},
		{
			label: __( 'Narathiwat', 'storeengine' ),
			value: 'TH-96',
		},
		{
			label: __( 'Nong Bua Lam Phu', 'storeengine' ),
			value: 'TH-39',
		},
		{
			label: __( 'Nong Khai', 'storeengine' ),
			value: 'TH-43',
		},
		{
			label: __( 'Nonthaburi', 'storeengine' ),
			value: 'TH-12',
		},
		{
			label: __( 'Pathum Thani', 'storeengine' ),
			value: 'TH-13',
		},
		{
			label: __( 'Pattani', 'storeengine' ),
			value: 'TH-94',
		},
		{
			label: __( 'Phang Nga', 'storeengine' ),
			value: 'TH-82',
		},
		{
			label: __( 'Phatthalung', 'storeengine' ),
			value: 'TH-93',
		},
		{
			label: __( 'Phayao', 'storeengine' ),
			value: 'TH-56',
		},
		{
			label: __( 'Phetchabun', 'storeengine' ),
			value: 'TH-67',
		},
		{
			label: __( 'Phetchaburi', 'storeengine' ),
			value: 'TH-76',
		},
		{
			label: __( 'Phichit', 'storeengine' ),
			value: 'TH-66',
		},
		{
			label: __( 'Phitsanulok', 'storeengine' ),
			value: 'TH-65',
		},
		{
			label: __( 'Phrae', 'storeengine' ),
			value: 'TH-54',
		},
		{
			label: __( 'Phuket', 'storeengine' ),
			value: 'TH-83',
		},
		{
			label: __( 'Prachin Buri', 'storeengine' ),
			value: 'TH-25',
		},
		{
			label: __( 'Prachuap Khiri Khan', 'storeengine' ),
			value: 'TH-77',
		},
		{
			label: __( 'Ranong', 'storeengine' ),
			value: 'TH-85',
		},
		{
			label: __( 'Ratchaburi', 'storeengine' ),
			value: 'TH-70',
		},
		{
			label: __( 'Rayong', 'storeengine' ),
			value: 'TH-21',
		},
		{
			label: __( 'Roi Et', 'storeengine' ),
			value: 'TH-45',
		},
		{
			label: __( 'Sa Kaeo', 'storeengine' ),
			value: 'TH-27',
		},
		{
			label: __( 'Sakon Nakhon', 'storeengine' ),
			value: 'TH-47',
		},
		{
			label: __( 'Samut Prakan', 'storeengine' ),
			value: 'TH-11',
		},
		{
			label: __( 'Samut Sakhon', 'storeengine' ),
			value: 'TH-74',
		},
		{
			label: __( 'Samut Songkhram', 'storeengine' ),
			value: 'TH-75',
		},
		{
			label: __( 'Saraburi', 'storeengine' ),
			value: 'TH-19',
		},
		{
			label: __( 'Satun', 'storeengine' ),
			value: 'TH-91',
		},
		{
			label: __( 'Sing Buri', 'storeengine' ),
			value: 'TH-17',
		},
		{
			label: __( 'Sisaket', 'storeengine' ),
			value: 'TH-33',
		},
		{
			label: __( 'Songkhla', 'storeengine' ),
			value: 'TH-90',
		},
		{
			label: __( 'Sukhothai', 'storeengine' ),
			value: 'TH-64',
		},
		{
			label: __( 'Suphan Buri', 'storeengine' ),
			value: 'TH-72',
		},
		{
			label: __( 'Surat Thani', 'storeengine' ),
			value: 'TH-84',
		},
		{
			label: __( 'Surin', 'storeengine' ),
			value: 'TH-32',
		},
		{
			label: __( 'Tak', 'storeengine' ),
			value: 'TH-63',
		},
		{
			label: __( 'Trang', 'storeengine' ),
			value: 'TH-92',
		},
		{
			label: __( 'Trat', 'storeengine' ),
			value: 'TH-23',
		},
		{
			label: __( 'Ubon Ratchathani', 'storeengine' ),
			value: 'TH-34',
		},
		{
			label: __( 'Udon Thani', 'storeengine' ),
			value: 'TH-41',
		},
		{
			label: __( 'Uthai Thani', 'storeengine' ),
			value: 'TH-61',
		},
		{
			label: __( 'Uttaradit', 'storeengine' ),
			value: 'TH-53',
		},
		{
			label: __( 'Yala', 'storeengine' ),
			value: 'TH-95',
		},
		{
			label: __( 'Yasothon', 'storeengine' ),
			value: 'TH-35',
		},
	],
	TR: [
		// Turkish states.
		{
			label: __( 'Adana', 'storeengine' ),
			value: 'TR01',
		},
		{
			label: __( 'Adıyaman', 'storeengine' ),
			value: 'TR02',
		},
		{
			label: __( 'Afyon', 'storeengine' ),
			value: 'TR03',
		},
		{
			label: __( 'Ağrı', 'storeengine' ),
			value: 'TR04',
		},
		{
			label: __( 'Amasya', 'storeengine' ),
			value: 'TR05',
		},
		{
			label: __( 'Ankara', 'storeengine' ),
			value: 'TR06',
		},
		{
			label: __( 'Antalya', 'storeengine' ),
			value: 'TR07',
		},
		{
			label: __( 'Artvin', 'storeengine' ),
			value: 'TR08',
		},
		{
			label: __( 'Aydın', 'storeengine' ),
			value: 'TR09',
		},
		{
			label: __( 'Balıkesir', 'storeengine' ),
			value: 'TR10',
		},
		{
			label: __( 'Bilecik', 'storeengine' ),
			value: 'TR11',
		},
		{
			label: __( 'Bingöl', 'storeengine' ),
			value: 'TR12',
		},
		{
			label: __( 'Bitlis', 'storeengine' ),
			value: 'TR13',
		},
		{
			label: __( 'Bolu', 'storeengine' ),
			value: 'TR14',
		},
		{
			label: __( 'Burdur', 'storeengine' ),
			value: 'TR15',
		},
		{
			label: __( 'Bursa', 'storeengine' ),
			value: 'TR16',
		},
		{
			label: __( 'Çanakkale', 'storeengine' ),
			value: 'TR17',
		},
		{
			label: __( 'Çankırı', 'storeengine' ),
			value: 'TR18',
		},
		{
			label: __( 'Çorum', 'storeengine' ),
			value: 'TR19',
		},
		{
			label: __( 'Denizli', 'storeengine' ),
			value: 'TR20',
		},
		{
			label: __( 'Diyarbakır', 'storeengine' ),
			value: 'TR21',
		},
		{
			label: __( 'Edirne', 'storeengine' ),
			value: 'TR22',
		},
		{
			label: __( 'Elazığ', 'storeengine' ),
			value: 'TR23',
		},
		{
			label: __( 'Erzincan', 'storeengine' ),
			value: 'TR24',
		},
		{
			label: __( 'Erzurum', 'storeengine' ),
			value: 'TR25',
		},
		{
			label: __( 'Eskişehir', 'storeengine' ),
			value: 'TR26',
		},
		{
			label: __( 'Gaziantep', 'storeengine' ),
			value: 'TR27',
		},
		{
			label: __( 'Giresun', 'storeengine' ),
			value: 'TR28',
		},
		{
			label: __( 'Gümüşhane', 'storeengine' ),
			value: 'TR29',
		},
		{
			label: __( 'Hakkari', 'storeengine' ),
			value: 'TR30',
		},
		{
			label: __( 'Hatay', 'storeengine' ),
			value: 'TR31',
		},
		{
			label: __( 'Isparta', 'storeengine' ),
			value: 'TR32',
		},
		{
			label: __( 'İçel', 'storeengine' ),
			value: 'TR33',
		},
		{
			label: __( 'İstanbul', 'storeengine' ),
			value: 'TR34',
		},
		{
			label: __( 'İzmir', 'storeengine' ),
			value: 'TR35',
		},
		{
			label: __( 'Kars', 'storeengine' ),
			value: 'TR36',
		},
		{
			label: __( 'Kastamonu', 'storeengine' ),
			value: 'TR37',
		},
		{
			label: __( 'Kayseri', 'storeengine' ),
			value: 'TR38',
		},
		{
			label: __( 'Kırklareli', 'storeengine' ),
			value: 'TR39',
		},
		{
			label: __( 'Kırşehir', 'storeengine' ),
			value: 'TR40',
		},
		{
			label: __( 'Kocaeli', 'storeengine' ),
			value: 'TR41',
		},
		{
			label: __( 'Konya', 'storeengine' ),
			value: 'TR42',
		},
		{
			label: __( 'Kütahya', 'storeengine' ),
			value: 'TR43',
		},
		{
			label: __( 'Malatya', 'storeengine' ),
			value: 'TR44',
		},
		{
			label: __( 'Manisa', 'storeengine' ),
			value: 'TR45',
		},
		{
			label: __( 'Kahramanmaraş', 'storeengine' ),
			value: 'TR46',
		},
		{
			label: __( 'Mardin', 'storeengine' ),
			value: 'TR47',
		},
		{
			label: __( 'Muğla', 'storeengine' ),
			value: 'TR48',
		},
		{
			label: __( 'Muş', 'storeengine' ),
			value: 'TR49',
		},
		{
			label: __( 'Nevşehir', 'storeengine' ),
			value: 'TR50',
		},
		{
			label: __( 'Niğde', 'storeengine' ),
			value: 'TR51',
		},
		{
			label: __( 'Ordu', 'storeengine' ),
			value: 'TR52',
		},
		{
			label: __( 'Rize', 'storeengine' ),
			value: 'TR53',
		},
		{
			label: __( 'Sakarya', 'storeengine' ),
			value: 'TR54',
		},
		{
			label: __( 'Samsun', 'storeengine' ),
			value: 'TR55',
		},
		{
			label: __( 'Siirt', 'storeengine' ),
			value: 'TR56',
		},
		{
			label: __( 'Sinop', 'storeengine' ),
			value: 'TR57',
		},
		{
			label: __( 'Sivas', 'storeengine' ),
			value: 'TR58',
		},
		{
			label: __( 'Tekirdağ', 'storeengine' ),
			value: 'TR59',
		},
		{
			label: __( 'Tokat', 'storeengine' ),
			value: 'TR60',
		},
		{
			label: __( 'Trabzon', 'storeengine' ),
			value: 'TR61',
		},
		{
			label: __( 'Tunceli', 'storeengine' ),
			value: 'TR62',
		},
		{
			label: __( 'Şanlıurfa', 'storeengine' ),
			value: 'TR63',
		},
		{
			label: __( 'Uşak', 'storeengine' ),
			value: 'TR64',
		},
		{
			label: __( 'Van', 'storeengine' ),
			value: 'TR65',
		},
		{
			label: __( 'Yozgat', 'storeengine' ),
			value: 'TR66',
		},
		{
			label: __( 'Zonguldak', 'storeengine' ),
			value: 'TR67',
		},
		{
			label: __( 'Aksaray', 'storeengine' ),
			value: 'TR68',
		},
		{
			label: __( 'Bayburt', 'storeengine' ),
			value: 'TR69',
		},
		{
			label: __( 'Karaman', 'storeengine' ),
			value: 'TR70',
		},
		{
			label: __( 'Kırıkkale', 'storeengine' ),
			value: 'TR71',
		},
		{
			label: __( 'Batman', 'storeengine' ),
			value: 'TR72',
		},
		{
			label: __( 'Şırnak', 'storeengine' ),
			value: 'TR73',
		},
		{
			label: __( 'Bartın', 'storeengine' ),
			value: 'TR74',
		},
		{
			label: __( 'Ardahan', 'storeengine' ),
			value: 'TR75',
		},
		{
			label: __( 'Iğdır', 'storeengine' ),
			value: 'TR76',
		},
		{
			label: __( 'Yalova', 'storeengine' ),
			value: 'TR77',
		},
		{
			label: __( 'Karabük', 'storeengine' ),
			value: 'TR78',
		},
		{
			label: __( 'Kilis', 'storeengine' ),
			value: 'TR79',
		},
		{
			label: __( 'Osmaniye', 'storeengine' ),
			value: 'TR80',
		},
		{
			label: __( 'Düzce', 'storeengine' ),
			value: 'TR81',
		},
	],
	TZ: [
		// Tanzanian states.
		{
			label: __( 'Arusha', 'storeengine' ),
			value: 'TZ01',
		},
		{
			label: __( 'Dar es Salaam', 'storeengine' ),
			value: 'TZ02',
		},
		{
			label: __( 'Dodoma', 'storeengine' ),
			value: 'TZ03',
		},
		{
			label: __( 'Iringa', 'storeengine' ),
			value: 'TZ04',
		},
		{
			label: __( 'Kagera', 'storeengine' ),
			value: 'TZ05',
		},
		{
			label: __( 'Pemba North', 'storeengine' ),
			value: 'TZ06',
		},
		{
			label: __( 'Zanzibar North', 'storeengine' ),
			value: 'TZ07',
		},
		{
			label: __( 'Kigoma', 'storeengine' ),
			value: 'TZ08',
		},
		{
			label: __( 'Kilimanjaro', 'storeengine' ),
			value: 'TZ09',
		},
		{
			label: __( 'Pemba South', 'storeengine' ),
			value: 'TZ10',
		},
		{
			label: __( 'Zanzibar South', 'storeengine' ),
			value: 'TZ11',
		},
		{
			label: __( 'Lindi', 'storeengine' ),
			value: 'TZ12',
		},
		{
			label: __( 'Mara', 'storeengine' ),
			value: 'TZ13',
		},
		{
			label: __( 'Mbeya', 'storeengine' ),
			value: 'TZ14',
		},
		{
			label: __( 'Zanzibar West', 'storeengine' ),
			value: 'TZ15',
		},
		{
			label: __( 'Morogoro', 'storeengine' ),
			value: 'TZ16',
		},
		{
			label: __( 'Mtwara', 'storeengine' ),
			value: 'TZ17',
		},
		{
			label: __( 'Mwanza', 'storeengine' ),
			value: 'TZ18',
		},
		{
			label: __( 'Coast', 'storeengine' ),
			value: 'TZ19',
		},
		{
			label: __( 'Rukwa', 'storeengine' ),
			value: 'TZ20',
		},
		{
			label: __( 'Ruvuma', 'storeengine' ),
			value: 'TZ21',
		},
		{
			label: __( 'Shinyanga', 'storeengine' ),
			value: 'TZ22',
		},
		{
			label: __( 'Singida', 'storeengine' ),
			value: 'TZ23',
		},
		{
			label: __( 'Tabora', 'storeengine' ),
			value: 'TZ24',
		},
		{
			label: __( 'Tanga', 'storeengine' ),
			value: 'TZ25',
		},
		{
			label: __( 'Manyara', 'storeengine' ),
			value: 'TZ26',
		},
		{
			label: __( 'Geita', 'storeengine' ),
			value: 'TZ27',
		},
		{
			label: __( 'Katavi', 'storeengine' ),
			value: 'TZ28',
		},
		{
			label: __( 'Njombe', 'storeengine' ),
			value: 'TZ29',
		},
		{
			label: __( 'Simiyu', 'storeengine' ),
			value: 'TZ30',
		},
	],
	LK: [],
	RS: [
		// Serbian districts.
		{
			label: _x( 'Belgrade', 'district', 'storeengine' ),
			value: 'RS00',
		},
		{
			label: _x( 'Bor', 'district', 'storeengine' ),
			value: 'RS14',
		},
		{
			label: _x( 'Braničevo', 'district', 'storeengine' ),
			value: 'RS11',
		},
		{
			label: _x( 'Central Banat', 'district', 'storeengine' ),
			value: 'RS02',
		},
		{
			label: _x( 'Danube', 'district', 'storeengine' ),
			value: 'RS10',
		},
		{
			label: _x( 'Jablanica', 'district', 'storeengine' ),
			value: 'RS23',
		},
		{
			label: _x( 'Kolubara', 'district', 'storeengine' ),
			value: 'RS09',
		},
		{
			label: _x( 'Mačva', 'district', 'storeengine' ),
			value: 'RS08',
		},
		{
			label: _x( 'Morava', 'district', 'storeengine' ),
			value: 'RS17',
		},
		{
			label: _x( 'Nišava', 'district', 'storeengine' ),
			value: 'RS20',
		},
		{
			label: _x( 'North Bačka', 'district', 'storeengine' ),
			value: 'RS01',
		},
		{
			label: _x( 'North Banat', 'district', 'storeengine' ),
			value: 'RS03',
		},
		{
			label: _x( 'Pčinja', 'district', 'storeengine' ),
			value: 'RS24',
		},
		{
			label: _x( 'Pirot', 'district', 'storeengine' ),
			value: 'RS22',
		},
		{
			label: _x( 'Pomoravlje', 'district', 'storeengine' ),
			value: 'RS13',
		},
		{
			label: _x( 'Rasina', 'district', 'storeengine' ),
			value: 'RS19',
		},
		{
			label: _x( 'Raška', 'district', 'storeengine' ),
			value: 'RS18',
		},
		{
			label: _x( 'South Bačka', 'district', 'storeengine' ),
			value: 'RS06',
		},
		{
			label: _x( 'South Banat', 'district', 'storeengine' ),
			value: 'RS04',
		},
		{
			label: _x( 'Srem', 'district', 'storeengine' ),
			value: 'RS07',
		},
		{
			label: _x( 'Šumadija', 'district', 'storeengine' ),
			value: 'RS12',
		},
		{
			label: _x( 'Toplica', 'district', 'storeengine' ),
			value: 'RS21',
		},
		{
			label: _x( 'West Bačka', 'district', 'storeengine' ),
			value: 'RS05',
		},
		{
			label: _x( 'Zaječar', 'district', 'storeengine' ),
			value: 'RS15',
		},
		{
			label: _x( 'Zlatibor', 'district', 'storeengine' ),
			value: 'RS16',
		},
		{
			label: _x( 'Kosovo', 'district', 'storeengine' ),
			value: 'RS25',
		},
		{
			label: _x( 'Peć', 'district', 'storeengine' ),
			value: 'RS26',
		},
		{
			label: _x( 'Prizren', 'district', 'storeengine' ),
			value: 'RS27',
		},
		{
			label: _x( 'Kosovska Mitrovica', 'district', 'storeengine' ),
			value: 'RS28',
		},
		{
			label: _x( 'Kosovo-Pomoravlje', 'district', 'storeengine' ),
			value: 'RS29',
		},
		{
			label: _x( 'Kosovo-Metohija', 'district', 'storeengine' ),
			value: 'RSKM',
		},
		{
			label: _x( 'Vojvodina', 'district', 'storeengine' ),
			value: 'RSVO',
		},
	],
	RW: [],
	SE: [],
	UA: [
		// Ukrainian oblasts. https://github.com/unicode-org/cldr/blob/release-42/common/subdivisions/en.xml#L5243.
		{
			label: __( 'Vinnychchyna', 'storeengine' ),
			value: 'UA05',
		},
		{
			label: __( 'Volyn', 'storeengine' ),
			value: 'UA07',
		},
		{
			label: __( 'Luhanshchyna', 'storeengine' ),
			value: 'UA09',
		},
		{
			label: __( 'Dnipropetrovshchyna', 'storeengine' ),
			value: 'UA12',
		},
		{
			label: __( 'Donechchyna', 'storeengine' ),
			value: 'UA14',
		},
		{
			label: __( 'Zhytomyrshchyna', 'storeengine' ),
			value: 'UA18',
		},
		{
			label: __( 'Zakarpattia', 'storeengine' ),
			value: 'UA21',
		},
		{
			label: __( 'Zaporizhzhya', 'storeengine' ),
			value: 'UA23',
		},
		{
			label: __( 'Prykarpattia', 'storeengine' ),
			value: 'UA26',
		},
		{
			label: __( 'Kyiv', 'storeengine' ),
			value: 'UA30',
		},
		{
			label: __( 'Kyivshchyna', 'storeengine' ),
			value: 'UA32',
		},
		{
			label: __( 'Kirovohradschyna', 'storeengine' ),
			value: 'UA35',
		},
		{
			label: __( 'Sevastopol', 'storeengine' ),
			value: 'UA40',
		},
		{
			label: __( 'Crimea', 'storeengine' ),
			value: 'UA43',
		},
		{
			label: __( 'Lvivshchyna', 'storeengine' ),
			value: 'UA46',
		},
		{
			label: __( 'Mykolayivschyna', 'storeengine' ),
			value: 'UA48',
		},
		{
			label: __( 'Odeshchyna', 'storeengine' ),
			value: 'UA51',
		},
		{
			label: __( 'Poltavshchyna', 'storeengine' ),
			value: 'UA53',
		},
		{
			label: __( 'Rivnenshchyna', 'storeengine' ),
			value: 'UA56',
		},
		{
			label: __( 'Sumshchyna', 'storeengine' ),
			value: 'UA59',
		},
		{
			label: __( 'Ternopilshchyna', 'storeengine' ),
			value: 'UA61',
		},
		{
			label: __( 'Kharkivshchyna', 'storeengine' ),
			value: 'UA63',
		},
		{
			label: __( 'Khersonshchyna', 'storeengine' ),
			value: 'UA65',
		},
		{
			label: __( 'Khmelnychchyna', 'storeengine' ),
			value: 'UA68',
		},
		{
			label: __( 'Cherkashchyna', 'storeengine' ),
			value: 'UA71',
		},
		{
			label: __( 'Chernihivshchyna', 'storeengine' ),
			value: 'UA74',
		},
		{
			label: __( 'Chernivtsi Oblast', 'storeengine' ),
			value: 'UA77',
		},
	],
	UG: [
		// Ugandan districts.
		{
			label: __( 'Abim', 'storeengine' ),
			value: 'UG314',
		},
		{
			label: __( 'Adjumani', 'storeengine' ),
			value: 'UG301',
		},
		{
			label: __( 'Agago', 'storeengine' ),
			value: 'UG322',
		},
		{
			label: __( 'Alebtong', 'storeengine' ),
			value: 'UG323',
		},
		{
			label: __( 'Amolatar', 'storeengine' ),
			value: 'UG315',
		},
		{
			label: __( 'Amudat', 'storeengine' ),
			value: 'UG324',
		},
		{
			label: __( 'Amuria', 'storeengine' ),
			value: 'UG216',
		},
		{
			label: __( 'Amuru', 'storeengine' ),
			value: 'UG316',
		},
		{
			label: __( 'Apac', 'storeengine' ),
			value: 'UG302',
		},
		{
			label: __( 'Arua', 'storeengine' ),
			value: 'UG303',
		},
		{
			label: __( 'Budaka', 'storeengine' ),
			value: 'UG217',
		},
		{
			label: __( 'Bududa', 'storeengine' ),
			value: 'UG218',
		},
		{
			label: __( 'Bugiri', 'storeengine' ),
			value: 'UG201',
		},
		{
			label: __( 'Bugweri', 'storeengine' ),
			value: 'UG235',
		},
		{
			label: __( 'Buhweju', 'storeengine' ),
			value: 'UG420',
		},
		{
			label: __( 'Buikwe', 'storeengine' ),
			value: 'UG117',
		},
		{
			label: __( 'Bukedea', 'storeengine' ),
			value: 'UG219',
		},
		{
			label: __( 'Bukomansimbi', 'storeengine' ),
			value: 'UG118',
		},
		{
			label: __( 'Bukwa', 'storeengine' ),
			value: 'UG220',
		},
		{
			label: __( 'Bulambuli', 'storeengine' ),
			value: 'UG225',
		},
		{
			label: __( 'Buliisa', 'storeengine' ),
			value: 'UG416',
		},
		{
			label: __( 'Bundibugyo', 'storeengine' ),
			value: 'UG401',
		},
		{
			label: __( 'Bunyangabu', 'storeengine' ),
			value: 'UG430',
		},
		{
			label: __( 'Bushenyi', 'storeengine' ),
			value: 'UG402',
		},
		{
			label: __( 'Busia', 'storeengine' ),
			value: 'UG202',
		},
		{
			label: __( 'Butaleja', 'storeengine' ),
			value: 'UG221',
		},
		{
			label: __( 'Butambala', 'storeengine' ),
			value: 'UG119',
		},
		{
			label: __( 'Butebo', 'storeengine' ),
			value: 'UG233',
		},
		{
			label: __( 'Buvuma', 'storeengine' ),
			value: 'UG120',
		},
		{
			label: __( 'Buyende', 'storeengine' ),
			value: 'UG226',
		},
		{
			label: __( 'Dokolo', 'storeengine' ),
			value: 'UG317',
		},
		{
			label: __( 'Gomba', 'storeengine' ),
			value: 'UG121',
		},
		{
			label: __( 'Gulu', 'storeengine' ),
			value: 'UG304',
		},
		{
			label: __( 'Hoima', 'storeengine' ),
			value: 'UG403',
		},
		{
			label: __( 'Ibanda', 'storeengine' ),
			value: 'UG417',
		},
		{
			label: __( 'Iganga', 'storeengine' ),
			value: 'UG203',
		},
		{
			label: __( 'Isingiro', 'storeengine' ),
			value: 'UG418',
		},
		{
			label: __( 'Jinja', 'storeengine' ),
			value: 'UG204',
		},
		{
			label: __( 'Kaabong', 'storeengine' ),
			value: 'UG318',
		},
		{
			label: __( 'Kabale', 'storeengine' ),
			value: 'UG404',
		},
		{
			label: __( 'Kabarole', 'storeengine' ),
			value: 'UG405',
		},
		{
			label: __( 'Kaberamaido', 'storeengine' ),
			value: 'UG213',
		},
		{
			label: __( 'Kagadi', 'storeengine' ),
			value: 'UG427',
		},
		{
			label: __( 'Kakumiro', 'storeengine' ),
			value: 'UG428',
		},
		{
			label: __( 'Kalangala', 'storeengine' ),
			value: 'UG101',
		},
		{
			label: __( 'Kaliro', 'storeengine' ),
			value: 'UG222',
		},
		{
			label: __( 'Kalungu', 'storeengine' ),
			value: 'UG122',
		},
		{
			label: __( 'Kampala', 'storeengine' ),
			value: 'UG102',
		},
		{
			label: __( 'Kamuli', 'storeengine' ),
			value: 'UG205',
		},
		{
			label: __( 'Kamwenge', 'storeengine' ),
			value: 'UG413',
		},
		{
			label: __( 'Kanungu', 'storeengine' ),
			value: 'UG414',
		},
		{
			label: __( 'Kapchorwa', 'storeengine' ),
			value: 'UG206',
		},
		{
			label: __( 'Kapelebyong', 'storeengine' ),
			value: 'UG236',
		},
		{
			label: __( 'Kasanda', 'storeengine' ),
			value: 'UG126',
		},
		{
			label: __( 'Kasese', 'storeengine' ),
			value: 'UG406',
		},
		{
			label: __( 'Katakwi', 'storeengine' ),
			value: 'UG207',
		},
		{
			label: __( 'Kayunga', 'storeengine' ),
			value: 'UG112',
		},
		{
			label: __( 'Kibaale', 'storeengine' ),
			value: 'UG407',
		},
		{
			label: __( 'Kiboga', 'storeengine' ),
			value: 'UG103',
		},
		{
			label: __( 'Kibuku', 'storeengine' ),
			value: 'UG227',
		},
		{
			label: __( 'Kikuube', 'storeengine' ),
			value: 'UG432',
		},
		{
			label: __( 'Kiruhura', 'storeengine' ),
			value: 'UG419',
		},
		{
			label: __( 'Kiryandongo', 'storeengine' ),
			value: 'UG421',
		},
		{
			label: __( 'Kisoro', 'storeengine' ),
			value: 'UG408',
		},
		{
			label: __( 'Kitgum', 'storeengine' ),
			value: 'UG305',
		},
		{
			label: __( 'Koboko', 'storeengine' ),
			value: 'UG319',
		},
		{
			label: __( 'Kole', 'storeengine' ),
			value: 'UG325',
		},
		{
			label: __( 'Kotido', 'storeengine' ),
			value: 'UG306',
		},
		{
			label: __( 'Kumi', 'storeengine' ),
			value: 'UG208',
		},
		{
			label: __( 'Kwania', 'storeengine' ),
			value: 'UG333',
		},
		{
			label: __( 'Kween', 'storeengine' ),
			value: 'UG228',
		},
		{
			label: __( 'Kyankwanzi', 'storeengine' ),
			value: 'UG123',
		},
		{
			label: __( 'Kyegegwa', 'storeengine' ),
			value: 'UG422',
		},
		{
			label: __( 'Kyenjojo', 'storeengine' ),
			value: 'UG415',
		},
		{
			label: __( 'Kyotera', 'storeengine' ),
			value: 'UG125',
		},
		{
			label: __( 'Lamwo', 'storeengine' ),
			value: 'UG326',
		},
		{
			label: __( 'Lira', 'storeengine' ),
			value: 'UG307',
		},
		{
			label: __( 'Luuka', 'storeengine' ),
			value: 'UG229',
		},
		{
			label: __( 'Luwero', 'storeengine' ),
			value: 'UG104',
		},
		{
			label: __( 'Lwengo', 'storeengine' ),
			value: 'UG124',
		},
		{
			label: __( 'Lyantonde', 'storeengine' ),
			value: 'UG114',
		},
		{
			label: __( 'Manafwa', 'storeengine' ),
			value: 'UG223',
		},
		{
			label: __( 'Maracha', 'storeengine' ),
			value: 'UG320',
		},
		{
			label: __( 'Masaka', 'storeengine' ),
			value: 'UG105',
		},
		{
			label: __( 'Masindi', 'storeengine' ),
			value: 'UG409',
		},
		{
			label: __( 'Mayuge', 'storeengine' ),
			value: 'UG214',
		},
		{
			label: __( 'Mbale', 'storeengine' ),
			value: 'UG209',
		},
		{
			label: __( 'Mbarara', 'storeengine' ),
			value: 'UG410',
		},
		{
			label: __( 'Mitooma', 'storeengine' ),
			value: 'UG423',
		},
		{
			label: __( 'Mityana', 'storeengine' ),
			value: 'UG115',
		},
		{
			label: __( 'Moroto', 'storeengine' ),
			value: 'UG308',
		},
		{
			label: __( 'Moyo', 'storeengine' ),
			value: 'UG309',
		},
		{
			label: __( 'Mpigi', 'storeengine' ),
			value: 'UG106',
		},
		{
			label: __( 'Mubende', 'storeengine' ),
			value: 'UG107',
		},
		{
			label: __( 'Mukono', 'storeengine' ),
			value: 'UG108',
		},
		{
			label: __( 'Nabilatuk', 'storeengine' ),
			value: 'UG334',
		},
		{
			label: __( 'Nakapiripirit', 'storeengine' ),
			value: 'UG311',
		},
		{
			label: __( 'Nakaseke', 'storeengine' ),
			value: 'UG116',
		},
		{
			label: __( 'Nakasongola', 'storeengine' ),
			value: 'UG109',
		},
		{
			label: __( 'Namayingo', 'storeengine' ),
			value: 'UG230',
		},
		{
			label: __( 'Namisindwa', 'storeengine' ),
			value: 'UG234',
		},
		{
			label: __( 'Namutumba', 'storeengine' ),
			value: 'UG224',
		},
		{
			label: __( 'Napak', 'storeengine' ),
			value: 'UG327',
		},
		{
			label: __( 'Nebbi', 'storeengine' ),
			value: 'UG310',
		},
		{
			label: __( 'Ngora', 'storeengine' ),
			value: 'UG231',
		},
		{
			label: __( 'Ntoroko', 'storeengine' ),
			value: 'UG424',
		},
		{
			label: __( 'Ntungamo', 'storeengine' ),
			value: 'UG411',
		},
		{
			label: __( 'Nwoya', 'storeengine' ),
			value: 'UG328',
		},
		{
			label: __( 'Omoro', 'storeengine' ),
			value: 'UG331',
		},
		{
			label: __( 'Otuke', 'storeengine' ),
			value: 'UG329',
		},
		{
			label: __( 'Oyam', 'storeengine' ),
			value: 'UG321',
		},
		{
			label: __( 'Pader', 'storeengine' ),
			value: 'UG312',
		},
		{
			label: __( 'Pakwach', 'storeengine' ),
			value: 'UG332',
		},
		{
			label: __( 'Pallisa', 'storeengine' ),
			value: 'UG210',
		},
		{
			label: __( 'Rakai', 'storeengine' ),
			value: 'UG110',
		},
		{
			label: __( 'Rubanda', 'storeengine' ),
			value: 'UG429',
		},
		{
			label: __( 'Rubirizi', 'storeengine' ),
			value: 'UG425',
		},
		{
			label: __( 'Rukiga', 'storeengine' ),
			value: 'UG431',
		},
		{
			label: __( 'Rukungiri', 'storeengine' ),
			value: 'UG412',
		},
		{
			label: __( 'Sembabule', 'storeengine' ),
			value: 'UG111',
		},
		{
			label: __( 'Serere', 'storeengine' ),
			value: 'UG232',
		},
		{
			label: __( 'Sheema', 'storeengine' ),
			value: 'UG426',
		},
		{
			label: __( 'Sironko', 'storeengine' ),
			value: 'UG215',
		},
		{
			label: __( 'Soroti', 'storeengine' ),
			value: 'UG211',
		},
		{
			label: __( 'Tororo', 'storeengine' ),
			value: 'UG212',
		},
		{
			label: __( 'Wakiso', 'storeengine' ),
			value: 'UG113',
		},
		{
			label: __( 'Yumbe', 'storeengine' ),
			value: 'UG313',
		},
		{
			label: __( 'Zombo', 'storeengine' ),
			value: 'UG330',
		},
	],
	UM: [
		{
			label: __( 'Baker Island', 'storeengine' ),
			value: '81',
		},
		{
			label: __( 'Howland Island', 'storeengine' ),
			value: '84',
		},
		{
			label: __( 'Jarvis Island', 'storeengine' ),
			value: '86',
		},
		{
			label: __( 'Johnston Atoll', 'storeengine' ),
			value: '67',
		},
		{
			label: __( 'Kingman Reef', 'storeengine' ),
			value: '89',
		},
		{
			label: __( 'Midway Atoll', 'storeengine' ),
			value: '71',
		},
		{
			label: __( 'Navassa Island', 'storeengine' ),
			value: '76',
		},
		{
			label: __( 'Palmyra Atoll', 'storeengine' ),
			value: '95',
		},
		{
			label: __( 'Wake Island', 'storeengine' ),
			value: '79',
		},
	],
	US: [
		// U.S. states.
		{
			label: __( 'Alabama', 'storeengine' ),
			value: 'AL',
		},
		{
			label: __( 'Alaska', 'storeengine' ),
			value: 'AK',
		},
		{
			label: __( 'Arizona', 'storeengine' ),
			value: 'AZ',
		},
		{
			label: __( 'Arkansas', 'storeengine' ),
			value: 'AR',
		},
		{
			label: __( 'California', 'storeengine' ),
			value: 'CA',
		},
		{
			label: __( 'Colorado', 'storeengine' ),
			value: 'CO',
		},
		{
			label: __( 'Connecticut', 'storeengine' ),
			value: 'CT',
		},
		{
			label: __( 'Delaware', 'storeengine' ),
			value: 'DE',
		},
		{
			label: __( 'District Of Columbia', 'storeengine' ),
			value: 'DC',
		},
		{
			label: __( 'Florida', 'storeengine' ),
			value: 'FL',
		},
		{
			label: _x( 'Georgia', 'US state of Georgia', 'storeengine' ),
			value: 'GA',
		},
		{
			label: __( 'Hawaii', 'storeengine' ),
			value: 'HI',
		},
		{
			label: __( 'Idaho', 'storeengine' ),
			value: 'ID',
		},
		{
			label: __( 'Illinois', 'storeengine' ),
			value: 'IL',
		},
		{
			label: __( 'Indiana', 'storeengine' ),
			value: 'IN',
		},
		{
			label: __( 'Iowa', 'storeengine' ),
			value: 'IA',
		},
		{
			label: __( 'Kansas', 'storeengine' ),
			value: 'KS',
		},
		{
			label: __( 'Kentucky', 'storeengine' ),
			value: 'KY',
		},
		{
			label: __( 'Louisiana', 'storeengine' ),
			value: 'LA',
		},
		{
			label: __( 'Maine', 'storeengine' ),
			value: 'ME',
		},
		{
			label: __( 'Maryland', 'storeengine' ),
			value: 'MD',
		},
		{
			label: __( 'Massachusetts', 'storeengine' ),
			value: 'MA',
		},
		{
			label: __( 'Michigan', 'storeengine' ),
			value: 'MI',
		},
		{
			label: __( 'Minnesota', 'storeengine' ),
			value: 'MN',
		},
		{
			label: __( 'Mississippi', 'storeengine' ),
			value: 'MS',
		},
		{
			label: __( 'Missouri', 'storeengine' ),
			value: 'MO',
		},
		{
			label: __( 'Montana', 'storeengine' ),
			value: 'MT',
		},
		{
			label: __( 'Nebraska', 'storeengine' ),
			value: 'NE',
		},
		{
			label: __( 'Nevada', 'storeengine' ),
			value: 'NV',
		},
		{
			label: __( 'New Hampshire', 'storeengine' ),
			value: 'NH',
		},
		{
			label: __( 'New Jersey', 'storeengine' ),
			value: 'NJ',
		},
		{
			label: __( 'New Mexico', 'storeengine' ),
			value: 'NM',
		},
		{
			label: __( 'New York', 'storeengine' ),
			value: 'NY',
		},
		{
			label: __( 'North Carolina', 'storeengine' ),
			value: 'NC',
		},
		{
			label: __( 'North Dakota', 'storeengine' ),
			value: 'ND',
		},
		{
			label: __( 'Ohio', 'storeengine' ),
			value: 'OH',
		},
		{
			label: __( 'Oklahoma', 'storeengine' ),
			value: 'OK',
		},
		{
			label: __( 'Oregon', 'storeengine' ),
			value: 'OR',
		},
		{
			label: __( 'Pennsylvania', 'storeengine' ),
			value: 'PA',
		},
		{
			label: __( 'Rhode Island', 'storeengine' ),
			value: 'RI',
		},
		{
			label: __( 'South Carolina', 'storeengine' ),
			value: 'SC',
		},
		{
			label: __( 'South Dakota', 'storeengine' ),
			value: 'SD',
		},
		{
			label: __( 'Tennessee', 'storeengine' ),
			value: 'TN',
		},
		{
			label: __( 'Texas', 'storeengine' ),
			value: 'TX',
		},
		{
			label: __( 'Utah', 'storeengine' ),
			value: 'UT',
		},
		{
			label: __( 'Vermont', 'storeengine' ),
			value: 'VT',
		},
		{
			label: __( 'Virginia', 'storeengine' ),
			value: 'VA',
		},
		{
			label: __( 'Washington', 'storeengine' ),
			value: 'WA',
		},
		{
			label: __( 'West Virginia', 'storeengine' ),
			value: 'WV',
		},
		{
			label: __( 'Wisconsin', 'storeengine' ),
			value: 'WI',
		},
		{
			label: __( 'Wyoming', 'storeengine' ),
			value: 'WY',
		},
		{
			label: __( 'Armed Forces (AA)', 'storeengine' ),
			value: 'AA',
		},
		{
			label: __( 'Armed Forces (AE)', 'storeengine' ),
			value: 'AE',
		},
		{
			label: __( 'Armed Forces (AP)', 'storeengine' ),
			value: 'AP',
		},
	],
	UY: [
		// Uruguayan states.
		{
			label: __( 'Artigas', 'storeengine' ),
			value: 'UY-AR',
		},
		{
			label: __( 'Canelones', 'storeengine' ),
			value: 'UY-CA',
		},
		{
			label: __( 'Cerro Largo', 'storeengine' ),
			value: 'UY-CL',
		},
		{
			label: __( 'Colonia', 'storeengine' ),
			value: 'UY-CO',
		},
		{
			label: __( 'Durazno', 'storeengine' ),
			value: 'UY-DU',
		},
		{
			label: __( 'Flores', 'storeengine' ),
			value: 'UY-FS',
		},
		{
			label: __( 'Florida', 'storeengine' ),
			value: 'UY-FD',
		},
		{
			label: __( 'Lavalleja', 'storeengine' ),
			value: 'UY-LA',
		},
		{
			label: __( 'Maldonado', 'storeengine' ),
			value: 'UY-MA',
		},
		{
			label: __( 'Montevideo', 'storeengine' ),
			value: 'UY-MO',
		},
		{
			label: __( 'Paysandú', 'storeengine' ),
			value: 'UY-PA',
		},
		{
			label: __( 'Río Negro', 'storeengine' ),
			value: 'UY-RN',
		},
		{
			label: __( 'Rivera', 'storeengine' ),
			value: 'UY-RV',
		},
		{
			label: __( 'Rocha', 'storeengine' ),
			value: 'UY-RO',
		},
		{
			label: __( 'Salto', 'storeengine' ),
			value: 'UY-SA',
		},
		{
			label: __( 'San José', 'storeengine' ),
			value: 'UY-SJ',
		},
		{
			label: __( 'Soriano', 'storeengine' ),
			value: 'UY-SO',
		},
		{
			label: __( 'Tacuarembó', 'storeengine' ),
			value: 'UY-TA',
		},
		{
			label: __( 'Treinta y Tres', 'storeengine' ),
			value: 'UY-TT',
		},
	],
	VE: [
		// Venezuelan states.
		{
			label: __( 'Capital', 'storeengine' ),
			value: 'VE-A',
		},
		{
			label: __( 'Anzoátegui', 'storeengine' ),
			value: 'VE-B',
		},
		{
			label: __( 'Apure', 'storeengine' ),
			value: 'VE-C',
		},
		{
			label: __( 'Aragua', 'storeengine' ),
			value: 'VE-D',
		},
		{
			label: __( 'Barinas', 'storeengine' ),
			value: 'VE-E',
		},
		{
			label: __( 'Bolívar', 'storeengine' ),
			value: 'VE-F',
		},
		{
			label: __( 'Carabobo', 'storeengine' ),
			value: 'VE-G',
		},
		{
			label: __( 'Cojedes', 'storeengine' ),
			value: 'VE-H',
		},
		{
			label: __( 'Falcón', 'storeengine' ),
			value: 'VE-I',
		},
		{
			label: __( 'Guárico', 'storeengine' ),
			value: 'VE-J',
		},
		{
			label: __( 'Lara', 'storeengine' ),
			value: 'VE-K',
		},
		{
			label: __( 'Mérida', 'storeengine' ),
			value: 'VE-L',
		},
		{
			label: __( 'Miranda', 'storeengine' ),
			value: 'VE-M',
		},
		{
			label: __( 'Monagas', 'storeengine' ),
			value: 'VE-N',
		},
		{
			label: __( 'Nueva Esparta', 'storeengine' ),
			value: 'VE-O',
		},
		{
			label: __( 'Portuguesa', 'storeengine' ),
			value: 'VE-P',
		},
		{
			label: __( 'Sucre', 'storeengine' ),
			value: 'VE-R',
		},
		{
			label: __( 'Táchira', 'storeengine' ),
			value: 'VE-S',
		},
		{
			label: __( 'Trujillo', 'storeengine' ),
			value: 'VE-T',
		},
		{
			label: __( 'Yaracuy', 'storeengine' ),
			value: 'VE-U',
		},
		{
			label: __( 'Zulia', 'storeengine' ),
			value: 'VE-V',
		},
		{
			label: __( 'Federal Dependencies', 'storeengine' ),
			value: 'VE-W',
		},
		{
			label: __( 'La Guaira (Vargas)', 'storeengine' ),
			value: 'VE-X',
		},
		{
			label: __( 'Delta Amacuro', 'storeengine' ),
			value: 'VE-Y',
		},
		{
			label: __( 'Amazonas', 'storeengine' ),
			value: 'VE-Z',
		},
	],
	VN: [],
	YT: [],
	ZA: [
		// South African states.
		{
			label: __( 'Eastern Cape', 'storeengine' ),
			value: 'EC',
		},
		{
			label: __( 'Free State', 'storeengine' ),
			value: 'FS',
		},
		{
			label: __( 'Gauteng', 'storeengine' ),
			value: 'GP',
		},
		{
			label: __( 'KwaZulu-Natal', 'storeengine' ),
			value: 'KZN',
		},
		{
			label: __( 'Limpopo', 'storeengine' ),
			value: 'LP',
		},
		{
			label: __( 'Mpumalanga', 'storeengine' ),
			value: 'MP',
		},
		{
			label: __( 'Northern Cape', 'storeengine' ),
			value: 'NC',
		},
		{
			label: __( 'North West', 'storeengine' ),
			value: 'NW',
		},
		{
			label: __( 'Western Cape', 'storeengine' ),
			value: 'WC',
		},
	],
	ZM: [
		// Zambian provinces.
		{
			label: __( 'Western', 'storeengine' ),
			value: 'ZM-01',
		},
		{
			label: __( 'Central', 'storeengine' ),
			value: 'ZM-02',
		},
		{
			label: __( 'Eastern', 'storeengine' ),
			value: 'ZM-03',
		},
		{
			label: __( 'Luapula', 'storeengine' ),
			value: 'ZM-04',
		},
		{
			label: __( 'Northern', 'storeengine' ),
			value: 'ZM-05',
		},
		{
			label: __( 'North-Western', 'storeengine' ),
			value: 'ZM-06',
		},
		{
			label: __( 'Southern', 'storeengine' ),
			value: 'ZM-07',
		},
		{
			label: __( 'Copperbelt', 'storeengine' ),
			value: 'ZM-08',
		},
		{
			label: __( 'Lusaka', 'storeengine' ),
			value: 'ZM-09',
		},
		{
			label: __( 'Muchinga', 'storeengine' ),
			value: 'ZM-10',
		},
	],
};

// End of file states.js
