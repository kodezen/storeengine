import { applyProductFormDefaults } from './productFormConfig';
import { applyFilters } from '@wordpress/hooks';
import {
	getInitialPricingMode,
	isPlainOnetime,
} from './Options/Price/helper';

/**
 * Copy only the named keys out of a meta object.
 *
 * @param {Object}        meta
 * @param {Array<string>} keys
 * @return {Object} Subset of `meta` limited to `keys` that are actually set.
 */
const pickMeta = ( meta, keys ) => {
	const out = {};

	( Array.isArray( keys ) ? keys : [] ).forEach( ( key ) => {
		if ( meta && undefined !== meta[ key ] ) {
			out[ key ] = meta[ key ];
		}
	} );

	return out;
};

// Number-typed product meta. The REST layer rejects '' or a non-numeric value
// for these with a 400, which fails the whole product save, so an empty field
// is sent as the value the server already treats as "unset".
const NUMERIC_META_FALLBACKS = {
	_storeengine_qty_step: 0,
	_storeengine_purchase_factor: 1,
	_storeengine_cost_price: 0,
};

/**
 * Coerce the number-typed meta keys to numbers before they are posted.
 *
 * @param {Object} meta Product meta from the form.
 * @return {Object} Meta safe to send to the REST API.
 */
export const normalizeNumericMeta = ( meta = {} ) => {
	const next = { ...meta };
	Object.entries( NUMERIC_META_FALLBACKS ).forEach( ( [ key, fallback ] ) => {
		if ( key in next ) {
			const parsed = parseFloat( next[ key ] );
			next[ key ] = Number.isFinite( parsed ) ? parsed : fallback;
		}
	} );
	return next;
};

/**
 *
 * @param {number|null}           ID
 * @param {StoreEngineProduct|{}} data
 * @return {StoreEngineProduct}
 */
export const getProductInitialValues = ( ID = null, data ) => {
	// Pick the store-wide default product shipping type set in Settings →
	// Products. Falls back to 'digital' for backwards compatibility with
	// installs that have never visited the settings page.
	const defaultShippingType =
		( typeof window !== 'undefined' &&
			window?.StoreEngineGlobal?.default_product_shipping_type ) ||
		'digital';

	const schema = {
		title: '',
		content: '',
		excerpt: '',
		status: 'draft',
		product_type: 'simple',
		// Simple-product identifiers. Variable products carry per-variant
		// sku/barcode in `variants[]`; ignored at save time when product_type
		// is variable.
		sku: '',
		barcode: '',
		quantity: '',
		prices: [],
		// Working fields for the simplified single-price UI. They never leave
		// the form — the product Save handler strips them and persists the
		// value through the existing price endpoints. `_pricing_mode` chooses
		// the simple single-price view vs the full multi-price (advanced) UI.
		_pricing_mode: 'simple',
		_simple_price: '',
		_simple_compare_price: '',
		integrations: [],
		storeengine_product_category: [],
		storeengine_product_brand: [],
		storeengine_product_tag: [],
		storeengine_product_template: [],
		variants: [],
		bundles: [],
		attributes: [],
		featured_media: 0,
		stock: {
			manages_stock: false,
			stock_quantity: '',
			stock_status: 'instock',
			backorders: 'no',
			low_stock_threshold: '',
			sold_individually: false,
		},
		meta: {
			_storeengine_product_gallery: [],
			_storeengine_product_gallery_ids: [],
			_storeengine_product_gallery_videos: [],
			_storeengine_product_downloadable_files: [],
			_storeengine_product_shipping_type: defaultShippingType,
			_storeengine_product_description_editor_type: 'classic',
			_storeengine_product_physical_weight: '',
			_storeengine_product_physical_weight_unit: 'g',
			_storeengine_product_digital_auto_complete: true,
			_storeengine_product_download_type: 'instant',
			_storeengine_product_enable_license_creation: false,
			_storeengine_crosssell_ids: [],
			_storeengine_upsell_ids: [],
			_storeengine_product_hide: false,
			_storeengine_paddle_tax_category: '',
			_storeengine_product_purchase_redirect_type: 'default',
			_storeengine_product_purchase_redirect_url: '',
			_storeengine_cost_price: 0,
			_storeengine_product_faqs: [],
			_storeengine_variant_image_attribute: '',
			// Unit of measure defaults — "each" keeps whole-unit behaviour. Without
			// them a new product's Sold by select starts blank.
			_storeengine_sell_by: 'each',
			_storeengine_unit: '',
			_storeengine_qty_step: '',
			_storeengine_purchase_unit: '',
			_storeengine_purchase_factor: 1,
		},
	};

	if ( ! ID || ! data ) {
		// New product: pre-fill the defaults configured in Settings → Product form
		// (a no-op unless the current user is restricted). Saved products never
		// come through here, so a default can't overwrite stored data.
		return applyProductFormDefaults( schema );
	}

	const {
		id,
		title,
		content,
		excerpt,
		status,
		date,
		product_type,
		link,
		quantity,
		prices,
		attributes,
		variants,
		bundles = [],
		integrations,
		storeengine_product_template,
		storeengine_product_category,
		storeengine_product_brand,
		storeengine_product_tag,
		featured_media,
		meta,
		stock = {},
		sku,
		barcode,
	} = data ?? {};

	// When the product carries exactly one bare one-time price, the simplified
	// view binds to it; otherwise the panel opens in advanced and the simple
	// fields stay empty so they can never overwrite a richer price.
	const simpleOnetime =
		Array.isArray( prices ) &&
		prices.length === 1 &&
		isPlainOnetime( prices[ 0 ] )
			? prices[ 0 ]
			: null;

	const product = {
		id,
		title: title?.raw,
		_pricing_mode: getInitialPricingMode( {
			product_type: product_type ?? 'simple',
			prices: prices ?? [],
		} ),
		_simple_price: simpleOnetime ? simpleOnetime.price ?? '' : '',
		// Compare-at price is optional; a stored 0 (or null) means "unset", so
		// show an empty field rather than a literal 0.
		_simple_compare_price:
			simpleOnetime && parseFloat( simpleOnetime.compare_price ) > 0
				? simpleOnetime.compare_price
				: '',
		// Surface the one-time price's donation / name-your-price config so the
		// simplified view keeps it after a save: the post-save refetch rebinds the
		// whole form via setValues(getProductInitialValues(...)), and SimplePrice's
		// mount-effect that seeds `donation` only runs once — so without this the
		// pricing mode + amount fields reset to empty on every save.
		donation:
			simpleOnetime?.settings?.donation &&
			simpleOnetime.settings.donation.mode
				? simpleOnetime.settings.donation
				: {
						mode: 'fixed',
						min: '',
						max: '',
						suggested: '',
						step: 1,
						allow_custom: true,
				  },
		// Create responses don't always include `content`/`excerpt`
		// as { raw }-shaped objects — sometimes they come back as
		// strings or are omitted entirely. Guard with optional
		// chaining so setValues doesn't blow up the form tree after
		// a vendor-mode create, which would leave the modal looking
		// empty until the user reopens.
		content: typeof content === 'object' ? content?.raw : content || '',
		excerpt: typeof excerpt === 'object' ? excerpt?.raw : excerpt || '',
		status,
		// Publish date: only meaningful for a Scheduled product, but kept so the
		// picker reopens on the saved time.
		date: date ?? '',
		product_type: product_type ?? 'simple',
		sku: sku ?? '',
		barcode: barcode ?? '',
		quantity,
		link,
		attributes,
		variants,
		bundles,
		storeengine_product_template,
		prices,
		integrations: integrations ?? [],
		storeengine_product_category: storeengine_product_category ?? [],
		storeengine_product_brand: storeengine_product_brand ?? [],
		storeengine_product_tag,
		featured_media: featured_media ? featured_media : 0,
		stock: {
			manages_stock: !! stock?.manages_stock,
			stock_quantity:
				stock?.stock_quantity === null || stock?.stock_quantity === undefined
					? ''
					: stock.stock_quantity,
			stock_status: stock?.stock_status ?? 'instock',
			backorders: stock?.backorders ?? 'no',
			low_stock_threshold:
				stock?.low_stock_threshold === null || stock?.low_stock_threshold === undefined
					? ''
					: stock.low_stock_threshold,
			sold_individually: !! stock?.sold_individually,
		},
		meta: {
			// Keys contributed by add-ons. The list below stays explicit so an
			// unrelated meta cannot ride along on save, but an add-on that
			// renders fields into the editor must be able to have them
			// persisted — a sidebar panel whose values are dropped on save is
			// worse than no panel at all. Spread first so core keys win.
			...pickMeta( meta, applyFilters( 'storeengine.product.editor.meta_keys', [] ) ),

			// Unit of measure. Without these the editor silently discards a
			// product's sell-by mode and step every time it is saved.
			// The API returns '' / 0 for a product that never set these, and
			// `??` keeps both — so Sold by rendered blank and the purchase factor
			// showed 0. Fall back to the real defaults instead ("each", 1, none).
			_storeengine_sell_by: meta?._storeengine_sell_by || 'each',
			_storeengine_unit: meta?._storeengine_unit ?? '',
			_storeengine_qty_step:
				Number( meta?._storeengine_qty_step ) > 0
					? meta._storeengine_qty_step
					: '',
			_storeengine_purchase_unit: meta?._storeengine_purchase_unit ?? '',
			_storeengine_purchase_factor:
				Number( meta?._storeengine_purchase_factor ) > 0
					? meta._storeengine_purchase_factor
					: 1,

			_storeengine_product_hide: meta?._storeengine_product_hide,
			_storeengine_product_description_editor_type:
				meta?._storeengine_product_description_editor_type || 'classic',
			_storeengine_product_downloadable_files:
				meta?._storeengine_product_downloadable_files ?? [],
			_storeengine_product_gallery:
				meta?._storeengine_product_gallery ?? [],
			_storeengine_product_gallery_ids:
				meta?._storeengine_product_gallery_ids ?? [],
			_storeengine_product_gallery_videos:
				meta?._storeengine_product_gallery_videos ?? [],
			_storeengine_product_shipping_type:
				meta?._storeengine_product_shipping_type || 'digital',
			_storeengine_product_physical_weight:
				meta?._storeengine_product_physical_weight ?? '',
			_storeengine_product_physical_weight_unit:
				meta?._storeengine_product_physical_weight_unit || 'g',
			_storeengine_product_digital_auto_complete:
				meta?._storeengine_product_digital_auto_complete ?? true,
			_storeengine_product_download_type:
				meta?._storeengine_product_download_type || 'instant',
			_storeengine_product_enable_license_creation:
				meta?._storeengine_product_enable_license_creation ?? false,
			_storeengine_crosssell_ids: meta._storeengine_crosssell_ids ?? [],
			_storeengine_upsell_ids: meta._storeengine_upsell_ids ?? [],
			_storeengine_paddle_tax_category:
				meta._storeengine_paddle_tax_category ?? '',
			_storeengine_product_purchase_redirect_type:
				meta._storeengine_product_purchase_redirect_type ?? '',
			_storeengine_product_purchase_redirect_url:
				meta._storeengine_product_purchase_redirect_url ?? '',
			_storeengine_cost_price:
				meta._storeengine_cost_price === null ||
				meta._storeengine_cost_price === undefined
					? ''
					: meta._storeengine_cost_price,
			_storeengine_product_faqs: Array.isArray(
				meta?._storeengine_product_faqs
			)
				? meta._storeengine_product_faqs
				: [],
			// "Images by <attribute>" for variant images ('' = not chosen).
			_storeengine_variant_image_attribute:
				meta?._storeengine_variant_image_attribute ?? '',
		},
	};

	return { ...schema, ...product, meta: { ...schema.meta, ...product.meta } };
};
