import { __ } from '@wordpress/i18n';

/**
 * Ready-made term lists for the "Quick add" panel of the term modal. Colors carry
 * a swatch hex (used when the attribute type is Color); everything else is names.
 */
const names = ( list ) => list.map( ( name ) => ( { name } ) );

export const getTermPresets = () => [
	{
		id: 'colors',
		label: __( 'Colors', 'storeengine' ),
		swatch: true,
		terms: [
			{ name: 'Black', color: '#000000' },
			{ name: 'White', color: '#FFFFFF' },
			{ name: 'Gray', color: '#808080' },
			{ name: 'Silver', color: '#C0C0C0' },
			{ name: 'Red', color: '#E53935' },
			{ name: 'Maroon', color: '#800000' },
			{ name: 'Orange', color: '#FB8C00' },
			{ name: 'Yellow', color: '#FDD835' },
			{ name: 'Gold', color: '#D4AF37' },
			{ name: 'Green', color: '#43A047' },
			{ name: 'Teal', color: '#00897B' },
			{ name: 'Blue', color: '#1E88E5' },
			{ name: 'Navy', color: '#1A237E' },
			{ name: 'Purple', color: '#8E24AA' },
			{ name: 'Pink', color: '#EC407A' },
			{ name: 'Brown', color: '#6D4C41' },
			{ name: 'Beige', color: '#D7C4A3' },
		],
	},
	{
		id: 'clothing-sizes',
		label: __( 'Clothing sizes', 'storeengine' ),
		terms: names( [ 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL' ] ),
	},
	{
		id: 'shoe-sizes',
		label: __( 'Shoe sizes (EU)', 'storeengine' ),
		terms: names( [ '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46' ] ),
	},
	{
		id: 'waist-sizes',
		label: __( 'Waist (inches)', 'storeengine' ),
		terms: names( [ '28', '30', '32', '34', '36', '38', '40' ] ),
	},
	{
		id: 'kids-ages',
		label: __( 'Kids ages', 'storeengine' ),
		terms: names( [ '2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y' ] ),
	},
];
