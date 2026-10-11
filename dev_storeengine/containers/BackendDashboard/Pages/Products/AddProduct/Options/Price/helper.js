import { __, sprintf } from '@wordpress/i18n';
import { makeRequest2 } from '@Utils/helper';

/**
 * A one-time price is "plain" (safe to edit through the simplified single
 * price field) only when it carries none of the advanced settings. This
 * matters because `update_product_price` rebuilds the whole settings blob
 * from the payload and resets any omitted key to its default — so driving an
 * advanced price through the simple field would silently wipe its trial,
 * setup fee, expiry, license, or hidden state.
 *
 * @param {Object} price
 * @return {boolean} True when the price is a bare one-time price.
 */
export const isPlainOnetime = ( price ) => {
	if ( ! price || price.price_type !== 'onetime' ) {
		return false;
	}
	const s = price.settings ?? {};
	return (
		! s.expire &&
		! s.setup_fee &&
		! s.trial &&
		! s.upgradeable &&
		! s.enable_license_activation_limit &&
		! s.is_hidden &&
		! s.down_payment &&
		( ! s.installments || s.installments.length === 0 )
	);
};

/**
 * Decide whether the pricing panel should open in the simplified single-price
 * view or the full multi-price (advanced) view. Simple is only offered for
 * simple products that have at most one bare one-time price; anything richer
 * (variable/bundled products, multiple prices, subscriptions, installment
 * plans, or a one-time price using advanced settings) opens in advanced so
 * nothing is ever hidden or at risk of being overwritten.
 *
 * @param {Object} values Product form values ({ product_type, prices }).
 * @return {'simple'|'advanced'} The initial pricing mode.
 */
export const getInitialPricingMode = ( values ) => {
	const type = values?.product_type ?? 'simple';
	if ( type !== 'simple' ) {
		return 'advanced';
	}
	const prices = values?.prices ?? [];
	if ( prices.length > 1 ) {
		return 'advanced';
	}
	if ( prices.length === 1 && ! isPlainOnetime( prices[ 0 ] ) ) {
		return 'advanced';
	}
	return 'simple';
};

/**
 * Default label for the simplified single price. The merchant never sees or
 * sets this label in simple mode, but the table column is NOT NULL and the
 * storefront prints it next to the price — so use a short, generic label.
 * Deriving it from the product title would overflow for long titles (both in
 * the DB and on the product page), which is exactly what we want to avoid.
 *
 * @return {string} A short, non-empty price label.
 */
export const getDefaultPriceName = () => __( 'Standard', 'storeengine' );

/**
 * What one unit of Price actually buys, driven by the product's "Sold by"
 * setting (Quantity::sell_by_modes()/units() from PHP, mirrored client-side
 * via window.StoreEngineGlobal.quantity_units). Empty for "each" mode, where
 * "Price" already reads unambiguously as "per item" and needs no caption.
 *
 * This exists because Price is stored and charged per sold-by unit (per kg,
 * per litre, per metre) regardless of Purchase unit / Stock units per
 * purchase unit, which only affect stock received — a distinction that was
 * previously invisible in the Pricing panel itself.
 *
 * @param {Object} values Product form values.
 * @return {string} e.g. "Price is per 1 kg." or '' for "each" mode.
 */
export const getPriceUnitCaption = ( values ) => {
	const mode = values?.meta?._storeengine_sell_by || 'each';

	if ( 'each' === mode ) {
		return '';
	}

	const units = window?.StoreEngineGlobal?.quantity_units?.units?.[ mode ] ?? {};
	const code = values?.meta?._storeengine_unit || Object.keys( units )[ 0 ] || '';

	if ( ! code ) {
		return '';
	}

	return sprintf(
		/* translators: %s: unit code, e.g. "kg", "l", "m". */
		__( 'Price is per 1 %s.', 'storeengine' ),
		code
	);
};

/**
 * Persist the single one-time price for the simplified UI, reusing the
 * existing price AJAX endpoints (no DB/schema change). Creates the price when
 * the product has none yet, otherwise updates the existing one-time row.
 *
 * @param {Object}      args
 * @param {number}      args.productId
 * @param {number|null} [args.priceId]   Existing one-time price id, if any.
 * @param {string}      args.priceName
 * @param {string}      args.price
 * @param {string}      [args.comparePrice]
 * @return {Promise<Object>} The saved price object.
 */
export const persistSimplePrice = ( {
	productId,
	priceId = null,
	priceName,
	price,
	comparePrice = '',
	donation = null,
} ) => {
	const payload = {
		product_id: productId,
		price_name: priceName,
		price_type: 'onetime',
		price,
		// Optional: empty, null or a non-positive value (e.g. 0) all mean
		// "no compare-at price", so store null rather than a literal 0.
		compare_price:
			parseFloat( comparePrice ) > 0 ? comparePrice : null,
		// Name-your-price / donation config (donation addon). Persisted to the
		// product-meta map by the addon's price-save hooks.
		...( donation ? { donation } : {} ),
	};

	if ( priceId ) {
		return makeRequest2( 'update_product_price', { ...payload, id: priceId } );
	}

	return makeRequest2( 'create_product_price', payload );
};

export const initialValues = ( editingPrice ) => {
	const schema = {
		price_name: '',
		price_type: 'onetime',
		price: '',
		compare_price: '',
		expire: false,
		expire_days: 30,
		setup_fee: false,
		setup_fee_name: '',
		setup_fee_price: '',
		setup_fee_type: 'fee',
		trial: false,
		trial_days: 15,
		trial_days_type: 'day',
		payment_duration: 1,
		upgradeable: false,
		payment_duration_type: 'month',
		enable_license_activation_limit: false,
		license_activation_limit: 1,
		down_payment: null,
		installments: null,
		donation: {
			mode: 'fixed',
			min: '',
			max: '',
			suggested: '',
			step: 1,
			allow_custom: true,
		},
	};

	if ( editingPrice?.id ) {
		const { settings, ...restData } = editingPrice;
		const {
			expire,
			expire_days,
			payment_duration,
			payment_duration_type,
			setup_fee,
			setup_fee_name,
			setup_fee_price,
			setup_fee_type,
			trial,
			trial_days,
			upgradeable,
			enable_license_activation_limit,
			license_activation_limit,
			down_payment,
			installments,
			donation,
		} = settings;

		return {
			...restData,
			id: editingPrice?.id,
			price_name: editingPrice?.price_name,
			price_type: editingPrice?.price_type,
			price: editingPrice?.price,
			// Compare-at price is optional; a stored 0/null shows as an empty
			// field rather than a literal 0.
			compare_price:
				parseFloat( editingPrice?.compare_price ) > 0
					? editingPrice.compare_price
					: '',
			expire,
			expire_days,
			setup_fee,
			setup_fee_name,
			setup_fee_price,
			setup_fee_type,
			trial,
			trial_days,
			payment_duration,
			upgradeable,
			payment_duration_type,
			enable_license_activation_limit,
			license_activation_limit,
			down_payment,
			installments,
			donation: {
				mode: 'fixed',
				min: '',
				max: '',
				suggested: '',
				step: 1,
				allow_custom: true,
				...( donation ?? {} ),
			},
		};
	}

	return schema;
};

export const setupFee = [
	{
		value: 'fee',
		label: __( 'Fee', 'storeengine' ),
		disabled: false,
	},
	{
		value: 'discount',
		label: __( 'Discount', 'storeengine' ),
		isDisabled: true,
	},
];

export const paymentDurations = [
	{ value: 'day', label: __( 'Days', 'storeengine' ) },
	{ value: 'week', label: __( 'Weeks', 'storeengine' ) },
	{ value: 'month', label: __( 'Months', 'storeengine' ) },
	{ value: 'year', label: __( 'Years', 'storeengine' ) },
];

export const trialDaysType = [
	{ value: 'day', label: __( 'Days', 'storeengine' ), isDisabled: true },
	{ value: 'week', label: __( 'Weeks', 'storeengine' ), isDisabled: true },
	{ value: 'month', label: __( 'Months', 'storeengine' ), isDisabled: true },
	{ value: 'year', label: __( 'Years', 'storeengine' ), isDisabled: true },
];

export const installmentPeriods = [
	{
		label: __( 'Day(s)', 'storeengine' ),
		value: 'day',
	},
	{
		label: __( 'Week(s)', 'storeengine' ),
		value: 'week',
	},
	{
		label: __( 'Month(s)', 'storeengine' ),
		value: 'month',
	},
	{
		label: __( 'Year(s)', 'storeengine' ),
		value: 'year',
	},
];
