import { applyFilters } from '@wordpress/hooks';

/**
 * Coupon meta contributed by add-ons, as `{ metaKey: defaultValue }`.
 *
 * Whatever an add-on registers here is seeded into a new coupon's form values,
 * read back when editing, and therefore posted on save — so an add-on can own a
 * coupon field end to end without core knowing anything about it.
 *
 * The matching PHP side must register the same meta keys on the
 * `storeengine/coupon/internal_meta_keys` filter, or the value will not load
 * back into the coupon's settings.
 *
 * @return {Object} Meta key => default value.
 */
export const getAddonCouponMeta = () =>
	applyFilters( 'storeengine.coupon_editor.default_meta', {} );

export const getCouponInitialValues = ( id = null, data = [] ) => {
	const addonMeta = getAddonCouponMeta();

	const schema = {
		title: '',
		content: '',
		status: 'publish',
		coupon_set_end_date_time: false,
		meta: {
			_storeengine_coupon_name: '',
			_storeengine_coupon_type: 'percentage',
			_storeengine_coupon_valid_customers: [],
			_storeengine_coupon_valid_prices: [],
			_storeengine_coupon_amount: 10,
			_storeengine_coupon_time_type: 'forever_time',
			_storeengine_coupon_start_date_time: {
				date: '',
				time: '',
				timezone: '',
			},
			_storeengine_coupon_end_date_time: {
				date: '',
				time: '',
				timezone: '',
			},
			_storeengine_coupon_type_of_min_requirement: 'none',
			_storeengine_coupon_usage_limit: '',
			_storeengine_coupon_customer_usage_limit: 1, // default 1.
			_storeengine_coupon_min_purchase_quantity: 0,
			_storeengine_coupon_min_purchase_amount: 0,
			_storeengine_coupon_who_can_use: 'allCustomer',
			// Product / category restrictions.
			_storeengine_product_ids: [],
			_storeengine_excluded_product_ids: [],
			_storeengine_product_categories: [],
			_storeengine_excluded_product_categories: [],
			// Usage restrictions.
			_storeengine_exclude_sale_items: false,
			_storeengine_email_restrictions: [],
			// Subscription recurring discount.
			_storeengine_coupon_recurring_discount: false,
			_storeengine_coupon_recurring_discount_limit: 0,
			// Auto-apply.
			_storeengine_coupon_auto_apply: false,
			// Promote in cart (Advanced Coupons).
			_storeengine_coupon_promote: false,
			_storeengine_coupon_promote_text: '',
			// Add-on owned fields (e.g. Pro Buy X Get Y).
			...addonMeta,
		},
		select_items: [],
	};

	if ( id && data && data.length ) {
		data = data.filter(
			( item ) => parseInt( item.id ) === parseInt( id )
		);

		const { title, content, status, meta, select_items } = data[ 0 ];

		const {
			_storeengine_coupon_name,
			_storeengine_coupon_type,
			_storeengine_coupon_amount,
			_storeengine_coupon_time_type,
			_storeengine_coupon_start_date_time,
			_storeengine_coupon_end_date_time,
			_storeengine_coupon_usage_limit = '',
			_storeengine_coupon_customer_usage_limit = '',
			_storeengine_coupon_type_of_min_requirement,
			_storeengine_coupon_min_purchase_quantity,
			_storeengine_coupon_min_purchase_amount,
			_storeengine_coupon_who_can_use,
			_storeengine_coupon_valid_customers,
			_storeengine_coupon_valid_prices,
			_storeengine_product_ids = [],
			_storeengine_excluded_product_ids = [],
			_storeengine_product_categories = [],
			_storeengine_excluded_product_categories = [],
			_storeengine_exclude_sale_items = false,
			_storeengine_email_restrictions = [],
			_storeengine_coupon_recurring_discount = false,
			_storeengine_coupon_recurring_discount_limit = 0,
			_storeengine_coupon_auto_apply = false,
			_storeengine_coupon_promote = false,
			_storeengine_coupon_promote_text = '',
		} = meta;

		// Carry add-on meta through edit → save. Falling back to the registered
		// default keeps a coupon saved before the add-on existed editable.
		const savedAddonMeta = {};
		Object.keys( addonMeta ).forEach( ( key ) => {
			savedAddonMeta[ key ] =
				meta[ key ] !== undefined && meta[ key ] !== null
					? meta[ key ]
					: addonMeta[ key ];
		} );

		return {
			id,
			title: title.rendered,
			content: content.rendered,
			status,
			meta: {
				_storeengine_coupon_name,
				_storeengine_coupon_type,
				_storeengine_coupon_amount,
				_storeengine_coupon_time_type,
				_storeengine_coupon_start_date_time,
				_storeengine_coupon_end_date_time,
				_storeengine_coupon_valid_customers,
				_storeengine_coupon_valid_prices,
				_storeengine_coupon_usage_limit:
					_storeengine_coupon_usage_limit > 0
						? _storeengine_coupon_usage_limit
						: '',
				_storeengine_coupon_customer_usage_limit:
					_storeengine_coupon_customer_usage_limit > 0
						? _storeengine_coupon_customer_usage_limit
						: '',
				_storeengine_coupon_type_of_min_requirement,
				_storeengine_coupon_min_purchase_quantity,
				_storeengine_coupon_min_purchase_amount,
				_storeengine_coupon_who_can_use,
				_storeengine_product_ids,
				_storeengine_excluded_product_ids,
				_storeengine_product_categories,
				_storeengine_excluded_product_categories,
				_storeengine_exclude_sale_items,
				_storeengine_email_restrictions,
				_storeengine_coupon_recurring_discount,
				_storeengine_coupon_recurring_discount_limit,
				_storeengine_coupon_auto_apply,
				_storeengine_coupon_promote,
				_storeengine_coupon_promote_text,
				...savedAddonMeta,
			},
			select_items: select_items ?? [],
		};
	}

	return schema;
};
