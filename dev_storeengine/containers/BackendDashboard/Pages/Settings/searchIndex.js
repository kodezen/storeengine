/**
 * StoreEngine settings search index.
 *
 * Built at render time (NOT a module-level const) so `__()` runs after the
 * @wordpress/i18n locale data is registered. Addon-dependent slices are gated by
 * `getAddonActiveStatus` exactly like `getTabs` gates its tabs, so the index
 * never offers a field whose tab isn't mounted.
 *
 * Entry shape:
 *   { tab, parent, field, label, section, keywords }
 *   - `tab`      routable slug (the CHILD slug for nested tabs).
 *   - `parent`   parent group slug or null (for the "Group › Tab" breadcrumb).
 *   - `field`    setting key — resolved to a DOM node by ScrollToField via
 *                getElementById → [name] → [data-se-field]. OMIT `field` for
 *                dynamic/CRUD areas (e.g. payment gateways, shipping zones) and
 *                self-saving addon tabs — those navigate to the tab only.
 *   - `label`    human label shown in results.
 *   - `section`  in-tab section name (display only).
 *   - `keywords` extra synonyms for matching.
 *
 * Extensible via `applyFilters('storeengine.settings.search_index', …)` — see
 * Settings/index.js. Pro/addons append their own slices the same way they add
 * tabs.
 */
import { __ } from '@wordpress/i18n';
import { getAddonActiveStatus, is_pro } from '@Utils/helper';

/**
 * @param {Object}            allAddons addon slug → active map.
 * @param {StoreEngineGlobal} SEGlobal  global config.
 * @return {Array} search index entries.
 */
export const buildBuiltinSearchIndex = ( allAddons, SEGlobal ) => { // eslint-disable-line no-unused-vars
	const index = [];

	/**
	 * Push an entry.
	 *
	 * @param {string}      tab
	 * @param {string|null} parent
	 * @param {string|undefined} field
	 * @param {string}      label
	 * @param {string}      section
	 * @param {string[]}    keywords
	 */
	const e = ( tab, parent, field, label, section = '', keywords = [] ) =>
		index.push( { tab, parent, field, label, section, keywords } );

	const has = ( slug, pro = false ) =>
		getAddonActiveStatus( allAddons, slug, pro );

	/* ----------------------------- General ----------------------------- */
	e( 'general', null, 'store_name', __( 'Store Name', 'storeengine' ), __( 'General', 'storeengine' ), [ 'shop name', 'site title', 'brand' ] );
	e( 'general', null, 'store_email', __( 'Store email', 'storeengine' ), __( 'General', 'storeengine' ), [ 'contact email', 'sender' ] );
	e( 'general', null, 'auth_redirect_type', __( 'Auth Redirect', 'storeengine' ), __( 'Auth Redirect', 'storeengine' ), [ 'login redirect', 'after login', 'custom login url' ] );
	e( 'general', null, 'store_country', __( 'Country', 'storeengine' ), __( 'Store Address', 'storeengine' ), [ 'location' ] );
	e( 'general', null, 'store_city', __( 'City', 'storeengine' ), __( 'Store Address', 'storeengine' ) );
	e( 'general', null, 'store_state', __( 'State/Province', 'storeengine' ), __( 'Store Address', 'storeengine' ), [ 'region' ] );
	e( 'general', null, 'store_address_1', __( 'Address (Area and Street)', 'storeengine' ), __( 'Store Address', 'storeengine' ) );
	e( 'general', null, 'store_address_2', __( 'Address 2 (If any)', 'storeengine' ), __( 'Store Address', 'storeengine' ) );
	e( 'general', null, 'store_postcode', __( 'Postcode', 'storeengine' ), __( 'Store Address', 'storeengine' ), [ 'zip', 'postal code' ] );
	e( 'general', null, 'allowed_countries', __( 'Selling location(s)', 'storeengine' ), __( 'Selling Locations', 'storeengine' ), [ 'sell to countries' ] );
	e( 'general', null, 'ship_to_countries', __( 'Shipping location(s)', 'storeengine' ), __( 'Selling Locations', 'storeengine' ), [ 'ship to countries' ] );

	/* -------------------------- Brand & Style -------------------------- */
	e( 'brand-and-style', null, 'store_logo', __( 'Store Logo', 'storeengine' ), __( 'Add Logo', 'storeengine' ), [ 'brand image' ] );
	e( 'brand-and-style', null, 'global_primary_color', __( 'Primary Color', 'storeengine' ), __( 'Brand Color', 'storeengine' ) );
	e( 'brand-and-style', null, 'global_secondary_color', __( 'Secondary Color', 'storeengine' ), __( 'Brand Color', 'storeengine' ) );
	e( 'brand-and-style', null, 'global_text_color', __( 'Text Color', 'storeengine' ), __( 'Brand Color', 'storeengine' ) );
	e( 'brand-and-style', null, 'global_subtitle_color', __( 'Secondary Text Color', 'storeengine' ), __( 'Brand Color', 'storeengine' ) );
	e( 'brand-and-style', null, 'global_border_color', __( 'Border Color', 'storeengine' ), __( 'Brand Color', 'storeengine' ) );
	e( 'brand-and-style', null, 'global_input_text_color', __( 'Input Text Color', 'storeengine' ), __( 'Brand Color', 'storeengine' ) );
	e( 'brand-and-style', null, 'global_placeholder_color', __( 'Placeholder Color', 'storeengine' ), __( 'Brand Color', 'storeengine' ) );
	e( 'brand-and-style', null, 'global_background_color', __( 'Background Color', 'storeengine' ), __( 'Brand Color', 'storeengine' ) );

	/* ----------------------------- Products ---------------------------- */
	e( 'products', null, 'default_product_shipping_type', __( 'Default product type', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'physical', 'digital' ] );
	e( 'products', null, 'enable_direct_checkout', __( 'Enable Direct Checkout', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'buy now' ] );
	e( 'products', null, 'hide_quantity_selector', __( 'Hide quantity selector', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'qty' ] );
	e( 'products', null, 'hide_add_to_cart', __( 'Hide Add to Cart (Buy Now only)', 'storeengine' ), __( 'Products', 'storeengine' ) );
	e( 'products', null, 'enable_product_reviews', __( 'Enable reviews', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'ratings' ] );
	e( 'products', null, 'enable_product_comments', __( 'Enable Comments', 'storeengine' ), __( 'Products', 'storeengine' ) );
	e( 'products', null, 'auto_generate_sku', __( 'Auto-generate SKU', 'storeengine' ), __( 'SKU & Barcode', 'storeengine' ) );
	e( 'products', null, 'auto_generate_barcode', __( 'Auto-generate barcode', 'storeengine' ), __( 'SKU & Barcode', 'storeengine' ) );
	e( 'products', null, 'product_archive_products_per_page', __( 'Product Archive Per Page', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'pagination', 'shop page' ] );
	e( 'products', null, 'product_archive_multi_price_display', __( 'Multi Price Display Settings', 'storeengine' ), __( 'Products', 'storeengine' ) );
	e( 'products', null, 'product_single_price_display', __( 'Single Product Price Display', 'storeengine' ), __( 'Products', 'storeengine' ) );
	e( 'products', null, 'single_product_gallery_layout', __( 'Product Gallery Layout', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'gallery', 'carousel', 'stacked', 'grid' ] );
	e( 'products', null, 'product_archive_card_carousel', __( 'Shop cards: image carousel', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'archive', 'shop', 'carousel', 'card' ] );
	e( 'products', null, 'product_archive_card_swatches', __( 'Shop cards: variant swatches', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'archive', 'shop', 'swatch', 'variant', 'card' ] );
	e( 'products', null, 'product_archive_quick_view', __( 'Shop cards: Quick View', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'archive', 'shop', 'quick view', 'modal' ] );
	e( 'products', null, 'product_archive_sidebar_position', __( 'Product Archive Sidebar Widgets', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'sidebar' ] );
	e( 'products', null, 'product_archive_products_order', __( 'Product Archive Order', 'storeengine' ), __( 'Products', 'storeengine' ), [ 'sorting', 'sort by' ] );

	/* ---------------------------- Currencies --------------------------- */
	e( 'currencies', null, 'store_currency', __( 'Currency', 'storeengine' ), __( 'Currency Options', 'storeengine' ) );
	e( 'currencies', null, 'store_currency_position', __( 'Currency Position', 'storeengine' ), __( 'Currency Options', 'storeengine' ) );
	e( 'currencies', null, 'store_currency_thousand_separator', __( 'Thousand Separator', 'storeengine' ), __( 'Currency Options', 'storeengine' ) );
	e( 'currencies', null, 'store_currency_decimal_separator', __( 'Decimal Separator', 'storeengine' ), __( 'Currency Options', 'storeengine' ) );
	e( 'currencies', null, 'store_currency_decimal_limit', __( 'Number Of Decimal', 'storeengine' ), __( 'Currency Options', 'storeengine' ), [ 'decimals' ] );
	if ( has( 'multi-currency' ) ) {
		e( 'currencies', null, 'multi_currency.rate_source', __( 'Rate Source', 'storeengine' ), __( 'Exchange Rate Settings', 'storeengine' ), [ 'multi currency', 'exchange rate' ] );
		e( 'currencies', null, 'multi_currency.refresh_interval_hours', __( 'Rate Refresh Interval (hours)', 'storeengine' ), __( 'Exchange Rate Settings', 'storeengine' ) );
		e( 'currencies', null, 'multi_currency.show_switcher', __( 'Show Currency Switcher', 'storeengine' ), __( 'Currency Switcher', 'storeengine' ) );
		e( 'currencies', null, 'multi_currency.formatting_locale', __( 'Display Locale', 'storeengine' ), __( 'Currency Formatting', 'storeengine' ) );
		e( 'currencies', null, 'multi_currency.geolocation_enabled', __( 'Enable Geo-Currency Detection', 'storeengine' ), __( 'Geo-Detection', 'storeengine' ) );
	}

	/* ------------------------- Cart & Checkout ------------------------- */
	e( 'cart-and-checkout', null, 'enable_floating_cart', __( 'Mini Cart', 'storeengine' ), __( 'Cart', 'storeengine' ), [ 'floating cart' ] );
	e( 'cart-and-checkout', null, 'enable_after_purchase_redirect', __( 'Enable After Purchase Redirect', 'storeengine' ), __( 'Checkout', 'storeengine' ) );
	e( 'cart-and-checkout', null, 'checkout_default_country', __( 'Default Country', 'storeengine' ), __( 'Checkout', 'storeengine' ) );

	/* ---- Cart & Checkout children ---- */
	e( 'product-form', 'products', undefined, __( 'Product Form', 'storeengine' ), __( 'Product Form', 'storeengine' ), [ 'hide fields', 'required fields', 'default value', 'simple product form', 'preset' ] );
	e( 'checkout-fields', 'cart-and-checkout', undefined, __( 'Checkout Fields', 'storeengine' ), __( 'Checkout Fields', 'storeengine' ), [ 'billing fields', 'shipping fields', 'address fields', 'required fields' ] );
	e( 'instant-checkout', 'cart-and-checkout', 'instant_checkout.show_on_archive', __( 'Show on shop archive', 'storeengine' ), __( 'Instant Checkout', 'storeengine' ), [ 'quick checkout' ] );
	e( 'instant-checkout', 'cart-and-checkout', 'instant_checkout.show_on_single', __( 'Show on single product page', 'storeengine' ), __( 'Instant Checkout', 'storeengine' ), [ 'quick checkout' ] );
	e( 'embeddable-checkout', 'cart-and-checkout', 'embeddable_checkout.session_rate_limit', __( 'Session rate limit', 'storeengine' ), __( 'Embeddable Checkout', 'storeengine' ) );
	e( 'embeddable-checkout', 'cart-and-checkout', undefined, __( 'Embed Keys', 'storeengine' ), __( 'Embeddable Checkout', 'storeengine' ), [ 'api key', 'allowed origins' ] );

	/* ---------------------------- Compliance --------------------------- */
	e( 'compliance', null, 'place_order_button_text', __( 'Place-order button text', 'storeengine' ), __( 'Checkout Button', 'storeengine' ) );
	e( 'compliance', null, 'compliance_vat_breakdown', __( 'Show VAT breakdown on cart & checkout', 'storeengine' ), __( 'VAT Transparency', 'storeengine' ), [ 'net total', 'per-rate' ] );
	e( 'compliance', null, 'compliance_legal_docs.agb_page', __( 'Terms & Conditions (AGB) page', 'storeengine' ), __( 'Legal Documents', 'storeengine' ) );
	e( 'compliance', null, 'compliance_legal_docs.widerruf_page', __( 'Revocation Policy page', 'storeengine' ), __( 'Legal Documents', 'storeengine' ) );
	e( 'compliance', null, undefined, __( 'Consent Checkboxes', 'storeengine' ), __( 'Consent Checkboxes', 'storeengine' ), [ 'newsletter', 'gdpr consent' ] );

	/* --------------------------- Catalog Mode -------------------------- */
	e( 'catalog-mode', null, 'catalog_mode.enabled', __( 'Enable Catalog Mode', 'storeengine' ), __( 'Catalog Mode', 'storeengine' ) );
	e( 'catalog-mode', null, 'catalog_mode.disable_price', __( 'Hide Prices', 'storeengine' ), __( 'Catalog Mode', 'storeengine' ) );
	e( 'catalog-mode', null, 'catalog_mode.hide_add_to_cart_in', __( 'Hide "Add to Cart" Button in', 'storeengine' ), __( 'Catalog Mode', 'storeengine' ) );
	e( 'catalog-mode', null, 'catalog_mode.disable_cart_checkout', __( 'Hide Cart & Checkout Page', 'storeengine' ), __( 'Catalog Mode', 'storeengine' ) );
	e( 'catalog-mode', null, 'catalog_mode_exclude_user_role', __( 'Exclude Users by Role', 'storeengine' ), __( 'Catalog Mode', 'storeengine' ) );
	e( 'catalog-mode', null, 'catalog_mode.customize_add_to_cart', __( 'Customize "Add to Cart" Button', 'storeengine' ), __( 'Catalog Mode', 'storeengine' ) );

	/* ----------------------- Abandoned Cart ---------------------------- */
	if ( has( 'abandoned-cart' ) ) {
		e( 'abandoned-cart', null, 'abandoned_cart.cut_off_time', __( 'Cart cut off time', 'storeengine' ), __( 'Abandoned Cart & Checkout', 'storeengine' ) );
		e( 'abandoned-cart', null, 'abandoned_cart.early_track', __( 'Start Tracking When User Add To Cart', 'storeengine' ), __( 'Abandoned Cart & Checkout', 'storeengine' ) );
		e( 'abandoned-cart', null, 'abandoned_cart.first_email', __( 'First Reminder Email', 'storeengine' ), __( 'Email Settings', 'storeengine' ) );
		e( 'abandoned-cart', null, 'abandoned_cart.second_email', __( 'Second Reminder Email', 'storeengine' ), __( 'Email Settings', 'storeengine' ) );
		e( 'abandoned-cart', null, 'abandoned_cart.third_email', __( 'Third Reminder Email', 'storeengine' ), __( 'Email Settings', 'storeengine' ) );
		e( 'abandoned-cart', null, 'abandoned_cart.enable_discount', __( 'Enable Discount', 'storeengine' ), __( 'Discount Settings', 'storeengine' ), [ 'recovery coupon' ] );
	}

	/* ----------------------------- Shipping ---------------------------- */
	e( 'shipping', null, undefined, __( 'Shipping Zones', 'storeengine' ), __( 'Shipping', 'storeengine' ), [ 'zones', 'regions' ] );
	e( 'shipping', null, undefined, __( 'Shipping Methods', 'storeengine' ), __( 'Shipping', 'storeengine' ), [ 'flat rate', 'free shipping', 'local pickup' ] );

	/* ------------------------- Payment Method -------------------------- */
	e( 'payment-method', null, undefined, __( 'Payment Methods', 'storeengine' ), __( 'Payment Methods', 'storeengine' ), [ 'gateways', 'stripe', 'paypal', 'payment gateway' ] );

	/* ----------------------------- Analytics --------------------------- */
	e( 'analytics', null, 'analytics.google', __( 'Google Analytics / Google Tag', 'storeengine' ), __( 'Analytics', 'storeengine' ), [ 'ga4', 'gtag' ] );
	e( 'analytics', null, 'analytics.facebook', __( 'Meta (Facebook) Pixel', 'storeengine' ), __( 'Analytics', 'storeengine' ), [ 'pixel' ] );

	/* ---------------------------- Geolocation -------------------------- */
	e( 'geolocation', null, 'default_customer_address', __( 'Default customer location', 'storeengine' ), __( 'Geolocation', 'storeengine' ) );
	e( 'geolocation', null, 'enable_caching_support', __( 'Enable Caching support', 'storeengine' ), __( 'Geolocation', 'storeengine' ) );
	e( 'geolocation', null, 'maxmind_license', __( 'MaxMind License Key', 'storeengine' ), __( 'MaxMind Geolocation', 'storeengine' ) );
	e( 'geolocation', null, 'maxmind_db_path', __( 'MaxMind Database Path', 'storeengine' ), __( 'MaxMind Geolocation', 'storeengine' ) );

	/* ------------------------------- Tax ------------------------------- */
	e( 'tax', null, 'enable_product_tax', __( 'Enable tax calculations', 'storeengine' ), __( 'Tax Settings', 'storeengine' ), [ 'vat', 'sales tax' ] );
	e( 'tax', null, 'enable_stripe_tax', __( 'Enable Stripe Automatic Tax', 'storeengine' ), __( 'Tax Settings', 'storeengine' ) );
	e( 'tax', null, 'prices_include_tax', __( 'Prices entered with tax', 'storeengine' ), __( 'Tax Settings', 'storeengine' ), [ 'inclusive', 'exclusive' ] );
	e( 'tax', null, 'tax_round_at_subtotal', __( 'Rounding', 'storeengine' ), __( 'Tax Settings', 'storeengine' ) );
	e( 'tax', null, 'tax_display_cart', __( 'Display prices during cart and checkout', 'storeengine' ), __( 'Tax Settings', 'storeengine' ) );
	e( 'tax', null, 'tax_total_display', __( 'Display tax totals', 'storeengine' ), __( 'Tax Settings', 'storeengine' ) );

	/* ------------------------------ Emails ----------------------------- */
	e( 'email', null, 'email.form_name', __( 'Sender Name', 'storeengine' ), __( 'Email', 'storeengine' ), [ 'from name' ] );
	e( 'email', null, 'email.email_address', __( 'Sender E-Mail Address', 'storeengine' ), __( 'Email', 'storeengine' ), [ 'from email' ] );
	e( 'email', null, 'email.email_content_type', __( 'Email Content Type', 'storeengine' ), __( 'Email', 'storeengine' ), [ 'html', 'plain text' ] );
	e( 'email', null, 'email.footer_text', __( 'Email Footer Text', 'storeengine' ), __( 'Email', 'storeengine' ) );
	const emailRow = ( key, label ) =>
		e( 'email', null, `email.${ key }.is_enable`, label, __( 'Email Templates', 'storeengine' ), [ 'email template', 'notification' ] );
	emailRow( 'order_confirmation.customer', __( 'Order Confirmation (Customer) email', 'storeengine' ) );
	emailRow( 'order_confirmation.admin', __( 'Order Confirmation (Admin) email', 'storeengine' ) );
	emailRow( 'order_note.customer', __( 'Order Note (Customer) email', 'storeengine' ) );
	emailRow( 'order_refund.customer', __( 'Order Refund (Customer) email', 'storeengine' ) );
	emailRow( 'order_status.customer', __( 'Order Status (Customer) email', 'storeengine' ) );
	emailRow( 'order_payment_failed.customer', __( 'Order Payment Failed email', 'storeengine' ) );
	emailRow( 'new_user_notification.customer', __( 'New User Notification email', 'storeengine' ) );
	emailRow( 'password_reset.customer', __( 'Password Reset email', 'storeengine' ) );
	emailRow( 'abandoned_cart_first.customer', __( 'Abandoned Cart Recovery #1 email', 'storeengine' ) );
	emailRow( 'abandoned_cart_second.customer', __( 'Abandoned Cart Recovery #2 email', 'storeengine' ) );
	emailRow( 'abandoned_cart_third.customer', __( 'Abandoned Cart Recovery #3 email', 'storeengine' ) );
	if ( has( 'invoice' ) ) {
		emailRow( 'order_invoice.customer', __( 'Order Invoice (Customer) email', 'storeengine' ) );
	}
	if ( has( 'returns', true ) ) {
		emailRow( 'return_approved.customer', __( 'Return Approved (Customer) email', 'storeengine' ) );
		emailRow( 'return_shipped.customer', __( 'Return Shipped (Customer) email', 'storeengine' ) );
		emailRow( 'return_received.customer', __( 'Return Received (Customer) email', 'storeengine' ) );
		emailRow( 'return_refunded.customer', __( 'Return Refunded (Customer) email', 'storeengine' ) );
	}
	if ( has( 'subscription' ) ) {
		emailRow( 'subscription_cancelled.customer', __( 'Subscription Cancelled email', 'storeengine' ) );
		emailRow( 'subscription_renewed.customer', __( 'Subscription Renewed email', 'storeengine' ) );
		emailRow( 'trial_ending_soon.customer', __( 'Trial Ending Soon email', 'storeengine' ) );
	}
	if ( has( 'installment-plan', true ) ) {
		emailRow( 'installment_payment_failed.customer', __( 'Installment Payment Failed email', 'storeengine' ) );
	}
	if ( has( 'license-management', true ) ) {
		emailRow( 'license_renewal_failed.customer', __( 'License Renewal Failed email', 'storeengine' ) );
		emailRow( 'license_expiring_soon.customer', __( 'License Expiring Soon email', 'storeengine' ) );
	}

	/* ------------------------------ Invoice ---------------------------- */
	e( 'invoice', null, 'invoice_paper_size', __( 'Paper Size', 'storeengine' ), __( 'Invoice', 'storeengine' ), [ 'a4', 'letter' ] );
	e( 'invoice', null, 'date_format', __( 'Invoice Date Format', 'storeengine' ), __( 'Invoice', 'storeengine' ) );
	e( 'invoice', null, 'invoice_front_btn', __( 'Display Invoice Button', 'storeengine' ), __( 'Invoice', 'storeengine' ) );
	e( 'invoice', null, 'invoice_mail_attachment', __( 'Invoice Attach to', 'storeengine' ), __( 'Invoice', 'storeengine' ), [ 'pdf attachment' ] );
	e( 'invoice', null, 'invoice.invoice_front_view', __( 'View Pdf', 'storeengine' ), __( 'Invoice', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_date_from', __( 'Date to show in the invoice', 'storeengine' ), __( 'Invoice', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_show_product_image', __( 'Show product image', 'storeengine' ), __( 'Invoice', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_default_note', __( 'Invoice Note', 'storeengine' ), __( 'Invoice', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_footer_text', __( 'Invoice Footer Text', 'storeengine' ), __( 'Invoice', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_number_prefix', __( 'Invoice Number prefix', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_number_padding', __( 'Invoice Number minimum digits', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_number_next', __( 'Next invoice number', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice_number_reset', __( 'Reset invoice numbering', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_seller_legal_name', __( 'Legal company name', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_tax_number', __( 'Tax number (Steuernummer)', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_vat_id', __( 'VAT ID (USt-IdNr.)', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_seller_extra', __( 'Additional legal info', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_show_delivery_note', __( 'Show delivery/service date note', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_kleinunternehmer', __( 'Small business (Kleinunternehmer §19 UStG)', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );
	e( 'invoice', null, 'invoice.invoice_kleinunternehmer_note', __( 'Small-business note', 'storeengine' ), __( 'Legal / Germany (§14 UStG)', 'storeengine' ) );

	/* ---------------------------- Page Setup --------------------------- */
	e( 'page-setup', null, 'cart_page', __( 'Cart Page', 'storeengine' ), __( 'Pages', 'storeengine' ) );
	e( 'page-setup', null, 'checkout_page', __( 'Checkout Page', 'storeengine' ), __( 'Pages', 'storeengine' ) );
	e( 'page-setup', null, 'thankyou_page', __( 'Thankyou Page', 'storeengine' ), __( 'Pages', 'storeengine' ), [ 'order received' ] );
	e( 'page-setup', null, 'dashboard_page', __( 'Dashboard Page', 'storeengine' ), __( 'Pages', 'storeengine' ), [ 'my account' ] );
	if ( has( 'affiliate' ) ) {
		e( 'page-setup', null, 'affiliate_registration_page', __( 'Affiliate Registration Page', 'storeengine' ), __( 'Pages', 'storeengine' ) );
	}
	if ( has( 'membership' ) ) {
		e( 'page-setup', null, 'membership_pricing_page', __( 'Membership Pricing Page', 'storeengine' ), __( 'Pages', 'storeengine' ) );
	}

	/* ----------------------------- Affiliate --------------------------- */
	if ( has( 'affiliate' ) ) {
		e( 'affiliate', null, 'affiliate.allow_referral_tracking', __( 'Allow Referral Tracking', 'storeengine' ), __( 'Referral Tracking', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.referral_type', __( 'Referral Type', 'storeengine' ), __( 'Referral Tracking', 'storeengine' ), [ 'first referrer', 'last referrer' ] );
		e( 'affiliate', null, 'affiliate.referral_tracking_length', __( 'Referral Tracking Length', 'storeengine' ), __( 'Referral Tracking', 'storeengine' ), [ 'cookie days' ] );
		e( 'affiliate', null, 'affiliate.referral_link_target', __( 'Referral Link Target', 'storeengine' ), __( 'Referral Tracking', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.terms_url', __( 'Terms & Conditions Page / Link', 'storeengine' ), __( 'Registration', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.commission_type', __( 'Commission Type', 'storeengine' ), __( 'Commissions & Payouts', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.commission_rate', __( 'Commission Rate', 'storeengine' ), __( 'Commissions & Payouts', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.allow_auto_commission', __( 'Allow Auto Commission', 'storeengine' ), __( 'Commissions & Payouts', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.allow_zero_commission', __( 'Allow Zero Commission', 'storeengine' ), __( 'Commissions & Payouts', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.minimum_withdraw_amount', __( 'Minimum Withdrawal Amount', 'storeengine' ), __( 'Withdrawal', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.is_enabled_paypal_withdraw', __( 'Enable PayPal Withdrawal', 'storeengine' ), __( 'Withdrawal', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.is_enabled_echeck_withdraw', __( 'Enable E-Check Withdrawal', 'storeengine' ), __( 'Withdrawal', 'storeengine' ) );
		e( 'affiliate', null, 'affiliate.is_enabled_bank_withdraw', __( 'Enable Bank Transfer Withdrawal', 'storeengine' ), __( 'Withdrawal', 'storeengine' ) );
	}

	/* --------------------------- Multi Vendor -------------------------- */
	if ( has( 'multi-vendor' ) ) {
		e( 'multi-vendor', null, undefined, __( 'Multi Vendor Settings', 'storeengine' ), __( 'Multi Vendor', 'storeengine' ), [ 'marketplace', 'commission', 'vendor signup', 'withdrawals', 'badges' ] );
	}

	/* ------------------------- Addon tabs (self-saving) ---------------- */
	if ( has( 'eu-vat' ) ) {
		e( 'eu-vat', null, undefined, __( 'EU/UK VAT', 'storeengine' ), __( 'EU/UK VAT', 'storeengine' ), [ 'vat number', 'vies', 'reverse charge', 'exemption' ] );
	}
	if ( has( 'seo' ) ) {
		e( 'seo', null, undefined, __( 'SEO', 'storeengine' ), __( 'SEO', 'storeengine' ), [ 'meta tags', 'schema', 'open graph', 'sitemap', 'noindex', 'twitter card' ] );
	}
	if ( has( 'ai' ) ) {
		e( 'ai', null, undefined, __( 'AI', 'storeengine' ), __( 'AI', 'storeengine' ), [ 'ai generation', 'tone', 'language', 'alt text' ] );
	}

	/* ------------------------------ License ---------------------------- */
	if ( is_pro ) {
		e( 'license', null, undefined, __( 'Manage License', 'storeengine' ), __( 'License', 'storeengine' ), [ 'activate', 'license key', 'updates', 'rollback' ] );
	}

	return index;
};
