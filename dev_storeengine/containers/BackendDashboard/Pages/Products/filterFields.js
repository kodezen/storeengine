import { __ } from '@wordpress/i18n';
import { OPS } from '@Components/AdvancedFilter/utils';
import { decodeEntities } from '@wordpress/html-entities';

const termOptions = ( terms ) =>
	terms.map( ( t ) => ( {
		value: String( t.id ),
		label: decodeEntities( t.name ),
	} ) );

/**
 * Fields for the product list's advanced filter. Keep in sync with
 * API\ProductFilters::fields() (ids + operators).
 *
 * @param {Array} categories Product categories from the store.
 * @param {Array} tags       Product tags from the store.
 * @return {Array} Field configs.
 */
export const productFilterFields = ( categories, tags ) => [
	{
		id: 'title',
		label: __( 'Title', 'storeengine' ),
		type: 'text',
		operators: [
			OPS.contains,
			OPS.not_contains,
			OPS.equals,
			OPS.starts_with,
		],
	},
	{
		id: 'sku',
		label: __( 'SKU', 'storeengine' ),
		type: 'text',
		operators: [ OPS.contains, OPS.equals, OPS.empty, OPS.not_empty ],
	},
	{
		id: 'category',
		quick: true,
		label: __( 'Category', 'storeengine' ),
		type: 'multiselect',
		operators: [ OPS.in, OPS.not_in ],
		options: termOptions( categories ),
	},
	{
		id: 'tag',
		label: __( 'Tag', 'storeengine' ),
		type: 'multiselect',
		operators: [ OPS.in, OPS.not_in ],
		options: termOptions( tags ),
	},
	{
		id: 'price',
		quick: true,
		label: __( 'Price', 'storeengine' ),
		type: 'number',
		operators: [ OPS.gt, OPS.lt, OPS.eq, OPS.between ],
	},
	{
		id: 'type',
		label: __( 'Product type', 'storeengine' ),
		type: 'select',
		operators: [ OPS.is, OPS.is_not ],
		options: [
			{ value: 'simple', label: __( 'Simple', 'storeengine' ) },
			{ value: 'variable', label: __( 'Variable', 'storeengine' ) },
		],
	},
	{
		id: 'shipping',
		quick: true,
		label: __( 'Shipping', 'storeengine' ),
		type: 'select',
		operators: [ OPS.is, OPS.is_not ],
		options: [
			{ value: 'physical', label: __( 'Physical', 'storeengine' ) },
			{ value: 'digital', label: __( 'Digital', 'storeengine' ) },
		],
	},
	{
		id: 'stock_status',
		quick: true,
		label: __( 'Stock status', 'storeengine' ),
		type: 'select',
		operators: [ OPS.is, OPS.is_not ],
		options: [
			{ value: 'instock', label: __( 'In stock', 'storeengine' ) },
			{ value: 'outofstock', label: __( 'Out of stock', 'storeengine' ) },
			{
				value: 'onbackorder',
				label: __( 'On backorder', 'storeengine' ),
			},
		],
	},
	{
		id: 'stock_qty',
		label: __( 'Stock quantity', 'storeengine' ),
		type: 'number',
		operators: [ OPS.gt, OPS.lt, OPS.eq, OPS.between ],
	},
	{
		id: 'visibility',
		label: __( 'Visibility', 'storeengine' ),
		type: 'select',
		operators: [ OPS.is ],
		options: [
			{ value: 'visible', label: __( 'Shown in shop', 'storeengine' ) },
			{ value: 'hidden', label: __( 'Hidden from shop', 'storeengine' ) },
		],
	},
	{
		id: 'image',
		label: __( 'Featured image', 'storeengine' ),
		type: 'select',
		operators: [ OPS.is ],
		options: [
			{ value: 'yes', label: __( 'Set', 'storeengine' ) },
			{ value: 'no', label: __( 'Missing', 'storeengine' ) },
		],
	},
	{
		id: 'published',
		label: __( 'Published', 'storeengine' ),
		type: 'date',
		operators: [ OPS.last_days, OPS.after, OPS.before, OPS.between ],
	},
];
