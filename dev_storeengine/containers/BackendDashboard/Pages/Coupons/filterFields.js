import { __ } from '@wordpress/i18n';
import { OPS } from '@Components/AdvancedFilter/utils';

const NUMBER_OPS = [ OPS.gt, OPS.lt, OPS.eq, OPS.between ];

/**
 * Advanced filter fields for the Coupons list. Keep in sync with
 * API\CouponFilters::fields() (ids + operators).
 */
export const couponFilterFields = [
	{
		id: 'code',
		label: __( 'Coupon code', 'storeengine' ),
		type: 'text',
		operators: [ OPS.contains, OPS.equals, OPS.starts_with ],
	},
	{
		id: 'type',
		label: __( 'Discount type', 'storeengine' ),
		type: 'select',
		quick: true,
		operators: [ OPS.is, OPS.is_not ],
		options: [
			{ value: 'percentage', label: __( 'Percentage', 'storeengine' ) },
			{ value: 'fixedAmount', label: __( 'Fixed amount', 'storeengine' ) },
		],
	},
	{
		id: 'amount',
		label: __( 'Discount amount', 'storeengine' ),
		type: 'number',
		quick: true,
		operators: NUMBER_OPS,
	},
	{
		id: 'usage',
		label: __( 'Times used', 'storeengine' ),
		type: 'number',
		quick: true,
		operators: NUMBER_OPS,
	},
	{
		id: 'expires',
		label: __( 'Expires', 'storeengine' ),
		type: 'date',
		operators: [ OPS.after, OPS.before, OPS.between ],
	},
];
