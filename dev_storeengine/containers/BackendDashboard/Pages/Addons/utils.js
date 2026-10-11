import { __ } from '@wordpress/i18n';
import { get_assets_url, get_route_path } from '@Utils/helper';

export const paymentAddons = [
	{
		label: __( 'PayPal', 'storeengine' ),
		name: 'paypal',
		beta: false,
		details: __(
			'Seamlessly accept payments via PayPal with built-in integration.',
			'storeengine'
		),
		required_plugin: false,
		icon: 'paypal',
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'payment-method',
			method: 'paypal',
		} ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-paypal-addon',
		is_pro: false,
		color: '#113984',
		tags: [ 'paypal', 'gateway', 'payment' ],
	},
	{
		label: __( 'Stripe', 'storeengine' ),
		name: 'stripe',
		beta: false,
		required_plugin: false,
		details: __(
			'Enable Stripe for fast, secure payment processing with no need for external plugins.',
			'storeengine'
		),
		icon: 'stripe',
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'payment-method',
			method: 'stripe',
		} ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-stripe-addon/',
		is_pro: false,
		color: '#635bff',
		tags: [ 'stripe', 'gateway', 'payment' ],
	},
	{
		label: __( 'Paddle', 'storeengine' ),
		name: 'paddle',
		beta: false,
		required_plugin: false,
		details: __(
			'Seamlessly accept payments via Paddle with built-in integration.',
			'storeengine'
		),
		icon: 'paddle',
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'payment-method',
			method: 'paddle',
		} ),
		docsUrl:
			'https://storeengine.pro/docs/storeengine-paddle-payment-integration/',
		color: '#0e1414',
		tags: [ 'paddle', 'padle', 'gateway', 'payment' ],
	},
	{
		label: __( 'Razorpay', 'storeengine' ),
		name: 'razorpay',
		beta: false,
		required_plugin: false,
		details: __(
			'Seamlessly accept payments via Razorpay with built-in integration.',
			'storeengine'
		),
		icon: '',
		svgIcon: get_assets_url( 'images/payment-methods/razorpay.svg' ),
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'payment-method',
			method: 'razorpay',
		} ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-razorpay-addon/',
		color: '#1364f1',
		tags: [ 'razorpay', 'razor', 'gateway', 'payment', 'india' ],
	},
	// Paystack moved to the storeengine-payments plugin — now a payment
	// gateway (Settings → Payment methods), not a core addon.
];

/**
 * Courier provider cards (Pathao, Steadfast, Shiprocket, …). Populated entirely
 * from the storeengine-courier satellite via `storeengine/admin/extra_addons`
 * (see getExternalAddons below). Rendered only in Settings → Couriers → "Courier
 * Add-ons", NOT in the main Add-ons list — the master `couriers` addon toggle
 * still lives on the Add-ons screen.
 *
 * @type {AddonData[]}
 */
export const courierAddons = [];

/**
 * @type {AddonData[]}
 */

export const addonList = [
	{
		label: __( 'Email', 'storeengine' ),
		name: 'email',
		beta: false,
		required_plugin: false,
		details: __(
			'Activate email notifications to keep your customers updated automatically.',
			'storeengine'
		),
		icon: 'email',
		url: get_route_path( { page: 'storeengine-settings', path: 'email' } ),
		docsUrl:
			'https://storeengine.pro/docs/storeengine-email-notification-addon/',
		is_pro: false,
		tags: [ 'notification', 'email', 'notify' ],
	},
	{
		label: __( 'Affiliate', 'storeengine' ),
		name: 'affiliate',
		beta: false,
		required_plugin: false,
		details: __(
			'Turn on affiliate to track and manage referrals directly within StoreEngine.',
			'storeengine'
		),
		icon: 'affiliate',
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'affiliate',
		} ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-affiliate-addon',
		is_pro: false,
		tags: [ 'affiliate', 'affiliates', 'marketing', 'referral', 'growth' ],
	},
	{
		label: __( 'Dynamic Pricing', 'storeengine' ),
		name: 'dynamic-pricing',
		beta: false,
		required_plugin: false,
		details: __(
			'Auto-apply discounts or fees to cart items or orders with flexible rules — no coupon code needed.',
			'storeengine'
		),
		icon: 'dynamic_pricing',
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'dynamic-pricing',
		} ),
		docsUrl: 'https://storeengine.pro/docs/dynamic-pricing/',
		is_pro: true,
		color: '#635bff',
		tags: [
			'dynamic pricing',
			'bulk discount',
			'tiered pricing',
			'quantity discount',
			'wholesale',
			'subscription discount',
			'role pricing',
			'rule pricing',
			'cart discount',
			'auto discount',
		],
	},
	{
		label: __( 'Advanced Coupons', 'storeengine' ),
		name: 'advanced-coupon',
		beta: false,
		required_plugin: false,
		details: __(
			'BOGO deals, auto-apply coupons, spend-more-to-save nudges, and a customer coupon dashboard.',
			'storeengine'
		),
		icon: 'advanced_coupons',
		docsUrl: 'https://storeengine.pro/docs/advanced-coupons/',
		is_pro: true,
		color: '#4338ca',
		tags: [
			'coupon',
			'advanced coupon',
			'bogo',
			'buy x get y',
			'auto apply',
			'email restriction',
			'discount',
			'promotion',
		],
	},
	{
		label: __( 'Abandoned Cart', 'storeengine' ),
		name: 'abandoned-cart',
		beta: false,
		required_plugin: false,
		details: __(
			'Recover lost sales by tracking abandoned carts and sending automated recovery emails.',
			'storeengine'
		),
		icon: 'cart-fill',
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'abandoned-cart',
		} ),
		docsUrl:
			'https://storeengine.pro/docs/how-to-use-abandoned-cart-checkout-in-storeengine/',
		is_pro: true,
		color: '#635bff',
		tags: [
			'abandoned',
			'cart',
			'recovery',
			'remainder',
			'lost sale',
			'track cart',
			'tracking cart',
			'recovery email',
		],
	},
	{
		label: __( 'Membership', 'storeengine' ),
		name: 'membership',
		beta: false,
		required_plugin: false,
		details: __(
			'Enable powerful membership features to control access and sell exclusive content with ease.',
			'storeengine'
		),
		icon: 'membership',
		url: get_route_path( { page: 'storeengine-membership-rules' } ),
		docsUrl:
			'https://storeengine.pro/docs/storeengine-memberships-addon-guide/',
		is_pro: false,
		color: '#00ad6b',
		tags: [
			'membership',
			'member',
			'restrict',
			'content',
			'community',
			'paywall',
			'content dripping',
			'restriction',
			'permission',
			'role',
			'paid membership',
			'subscription',
		],
	},
	{
		label: __( 'Webhooks', 'storeengine' ),
		name: 'webhooks',
		beta: false,
		required_plugin: false,
		details: __(
			'Connect external services by enabling webhooks to automate workflows and sync data in real-time.',
			'storeengine'
		),
		icon: 'webhooks',
		url: get_route_path( { page: 'storeengine-webhooks' } ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-webhook-addon/',
		is_pro: false,
		color: '#4a8cff',
		tags: [
			'webhooks',
			'webhook',
			'external service',
			'saas',
			'external',
			'automation',
		],
	},
	{
		label: __( 'Subscription', 'storeengine' ),
		name: 'subscription',
		beta: false,
		required_plugin: false,
		details: __(
			'Offer recurring payment options with flexible billing cycles—perfect for subscription products.',
			'storeengine'
		),
		icon: 'subscription',
		url: get_route_path( { page: 'storeengine-subscriptions' } ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-subscription-addon/',
		color: '#FF5000',
		is_pro: false,
		tags: [
			'subscriptions',
			'subscription billing',
			'membership',
			'subscription',
			'software',
			'service',
			'saas',
		],
	},
	{
		label: __( 'Donations & Name Your Price', 'storeengine' ),
		name: 'donation',
		beta: false,
		required_plugin: false,
		details: __(
			'Let customers set their own amount (name your price) and run donation products with goals.',
			'storeengine'
		),
		icon: 'affiliate',
		url: get_route_path( { page: 'storeengine-settings', path: 'donation' } ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-donation-addon/',
		color: '#12b76a',
		is_pro: false,
		tags: [ 'donation', 'donations', 'name your price', 'pay what you want', 'fundraising', 'charity', 'nonprofit' ],
	},
	{
		label: __( 'Fundraising', 'storeengine' ),
		name: 'fundraising',
		beta: false,
		required_plugin: false,
		details: __(
			'Recurring donations, front-end campaigns, funds, reward crowdfunding, payouts and analytics.',
			'storeengine'
		),
		icon: 'affiliate',
		url: get_route_path( { page: 'storeengine-fundraising' } ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-fundraising-addon/',
		color: '#12b76a',
		is_pro: true,
		tags: [ 'fundraising', 'crowdfunding', 'donation', 'campaigns', 'pledges', 'charity', 'nonprofit' ],
	},	{
		label: __( 'Installment Plan', 'storeengine' ),
		name: 'installment-plan',
		beta: false,
		required_plugin: false,
		details: __(
			'Let customers pay in flexible installments rather than a single full upfront payment.',
			'storeengine'
		),
		icon: 'installment',
		url: get_route_path( { page: 'storeengine-installment-plans' } ),
		docsUrl:
			'https://storeengine.pro/docs/how-to-use-storeengine-installment-add-on/',
		color: '#6C63FF',
		is_pro: true,
		tags: [
			'payment plan',
			'flexible payment',
			'split payment',
			'deposits',
			'down payment',
			'installments',
		],
	},
	{
		label: __( 'License Management', 'storeengine' ),
		name: 'license-management',
		beta: false,
		required_plugin: false,
		details: __(
			'Sell digital products requiring licenses with activation, validation, and update access.',
			'storeengine'
		),
		icon: 'key',
		url: get_route_path( { page: 'storeengine-manage-licenses' } ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-license-management/',
		color: '#1ABC9C',
		is_pro: true,
		tags: [
			'api manager',
			'serial',
			'key',
			'license',
			'plugin license',
			'theme license',
			'software license',
			'digital license',
			'saas',
		],
	},
	{
		label: __( 'Migration Tool', 'storeengine' ),
		name: 'migration-tool',
		beta: false,
		required_plugin: false,
		details: __(
			'Migrate products, orders, and customers from WooCommerce to StoreEngine easily.',
			'storeengine'
		),
		icon: 'migration',
		url: get_route_path( { page: 'storeengine-tools', path: 'migration' } ),
		docsUrl:
			'https://storeengine.pro/docs/how-to-use-the-storeengine-migration-add-on/',
		tags: [ 'woocommerce', 'migration', 'woocommerce', 'woo' ],
	},
	{
		label: __( 'Invoice', 'storeengine' ),
		name: 'invoice',
		beta: false,
		required_plugin: false,
		details: __(
			'Create, send, and manage professional invoices effortlessly with powerful billing features.',
			'storeengine'
		),
		icon: 'invoice',
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'invoice',
		} ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-invoice-addon/',
		color: '#c4147e',
		tags: [
			'pdf',
			'invoice',
			'print',
			'chalan',
			'bill',
			'slip',
			'receipt',
			'statement',
		],
	},
	{
		label: __( 'Catalog Mode', 'storeengine' ),
		name: 'catalog-mode',
		beta: false,
		required_plugin: false,
		details: __(
			'Catalog Mode hides Add to Cart and checkout, turning your shop into a product catalogue.',
			'storeengine'
		),
		icon: 'catalog',
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'catalog-mode',
		} ),
		docsUrl: 'https://storeengine.pro/docs/storeengine-catalog-mode-addon/',
		color: '#8226cf',
		tags: [
			'hide price',
			'remove price',
			'remove add to cart',
			'product enquiry',
			'catalog only',
			'product catalog',
			'b2b',
			'quote',
			'request a quote',
		],
	},
	{
		label: __( 'EU Compliance', 'storeengine' ),
		name: 'eu-compliance',
		beta: false,
		required_plugin: false,
		details: __(
			'EU/German legal compliance — order button, VAT display, GDPR consent logging, and AGB PDF emails.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/eu_compliance.svg' ),
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'compliance',
		} ),
		docsUrl: 'https://storeengine.pro/docs/',
		color: '#1596FF',
		tags: [
			'gdpr',
			'eu',
			'german',
			'germany',
			'vat',
			'mehrwertsteuer',
			'agb',
			'widerruf',
			'consent',
			'kostenpflichtig bestellen',
		],
	},
	{
		label: __( 'CSV Import/Export', 'storeengine' ),
		name: 'csv',
		beta: false,
		required_plugin: false,
		details: __(
			'Import and export products, orders, and other data using simple CSV files.',
			'storeengine'
		),
		icon: 'csv',
		url: get_route_path( {
			page: 'storeengine-tools',
			path: 'export-import',
		} ),
		docsUrl: 'https://storeengine.pro/docs/export-import-features/',
		color: '#00AD6B',
		tags: [
			'csv',
			'excel',
			'export',
			'import',
			'exporter',
			'importer',
			'migrate',
			'product',
			'order',
			'customer',
			'rcp',
			'restrict content pro',
		],
	},
	{
		label: __( 'Funnel Builder', 'storeengine' ),
		name: 'funnel-builder',
		beta: false,
		required_plugin: false,
		details: __(
			'Build sales funnels — landing, checkout, one-click upsells and thank-you steps — designed with your block builder.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/funnel_addons.svg' ),
		url: get_route_path( { page: 'storeengine-funnels' } ),
		docsUrl: 'https://storeengine.pro/docs/funnel-builder/',
		is_pro: false,
		color: '#7c3aed',
		tags: [
			'funnel',
			'sales funnel',
			'upsell',
			'downsell',
			'checkout',
			'one click',
			'conversion',
			'landing page',
		],
	},
	{
		label: __( 'Order Bumps', 'storeengine' ),
		name: 'order-bumps',
		beta: false,
		required_plugin: false,
		details: __(
			'Offer more at checkout, earn more from every order.',
			'storeengine'
		),
		icon: 'coupon',
		url: get_route_path( { page: 'storeengine-order-bumps' } ),
		docsUrl: 'https://storeengine.pro/docs/order-bumps/',
		color: '#0077b6',
		is_pro: true,
		tags: [
			'impulse',
			'offers',
			'checkout',
			'order bumps',
			'bump',
			'funnel',
			'one time offer',
			'sales',
			'upsell',
			'cross-sell',
		],
	},
	{
		label: __( 'Currency Switcher', 'storeengine' ),
		name: 'multi-currency',
		beta: false,
		required_plugin: false,
		details: __(
			'Sell worldwide with automatic currency switching and localized pricing.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/currency_switcher.svg' ),
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'currencies',
		} ),
		docsUrl: 'https://storeengine.pro/docs/multi-currency/',
		color: '#00AD6B',
		is_pro: false,
		tags: [
			'impulse',
			'offers',
			'checkout',
			'order bumps',
			'bump',
			'funnel',
			'one time offer',
			'sales',
			'upsell',
			'cross-sell',
		],
	},
	{
		label: __( 'EU Vat', 'storeengine' ),
		name: 'eu-vat',
		required_plugin: false,
		details: __(
			'Validates EU/UK VAT numbers automatically at checkout',
			'storeengine'
		),
		icon: 'tax',
		url: get_route_path( { page: 'storeengine-settings', path: 'eu-vat' } ),
		docsUrl: 'https://storeengine.pro/docs/eu-vat/',
		color: '#00070b',
				is_pro: false,
		tags: [
			'vat',
			'eu',
			'uk',
			'tax',
			'vies',
			'b2b',
			'exemption',
			'checkout',
			'compliance',
			'validation',
		],
	},
{
		label: __( 'Instant Checkout', 'storeengine' ),
		name: 'instant-checkout',
		beta: false,
		required_plugin: false,
		details: __(
			'One-page or 1-click checkout flow for faster purchases and higher conversions.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/instant Checkout.svg' ),
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'instant-checkout',
		} ),
		docsUrl: 'https://storeengine.pro/docs/instant-checkout/',
		color: '#F97316',
		is_pro: false,
		tags: [
			'impulse',
			'offers',
			'checkout',
			'order bumps',
			'bump',
			'funnel',
			'one time offer',
			'sales',
			'upsell',
			'cross-sell',
		],
	},
	{
		label: __( 'Embeddable Checkout', 'storeengine' ),
		name: 'embeddable-checkout',
		beta: false,
		required_plugin: false,
		requires_addon: 'instant-checkout',
		details: __(
			'Embed checkout on any external site or landing page and accept payments anywhere.',
			'storeengine'
		),
		icon: 'embeddable',
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'embeddable-checkout',
		} ),
		docsUrl: 'https://storeengine.pro/docs/embeddable-checkout/',
		color: '#008DFF',
		is_pro: false,
		tags: [
			'embed',
			'checkout',
			'sdk',
			'cross-origin',
			'headless',
			'landing page',
		],
	},
	{
		label: __( 'Inventory', 'storeengine' ),
		name: 'inventory',
		beta: false,
		required_plugin: false,
		details: __(
			'Track stock levels, movements, and low-stock alerts for single-location stores.',
			'storeengine'
		),
		icon: 'inventory',
		url: get_route_path( { page: 'storeengine-inventory' } ),
		docsUrl: 'https://storeengine.pro/docs/inventory/',
		color: '#0ea5e9',
		is_pro: false,
		tags: [
			'inventory',
			'stock',
			'physical',
			'product',
			'sku',
			'barcode',
			'low stock',
			'movements',
		],
	},
	{
		label: __( 'Multi-Location Inventory', 'storeengine' ),
		name: 'inventory-pro',
		beta: false,
		required_plugin: false,
		details: __(
			'Manage stock across warehouses and shops, with transfers and bulk barcode printing.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/multi_location_inventory.svg' ),
		url: get_route_path( {
			page: 'storeengine-inventory',
			path: 'locations',
		} ),
		docsUrl: 'https://storeengine.pro/docs/multi-location-inventory/',
		color: '#00AD6B',
		is_pro: true,
		tags: [
			'multi-location',
			'warehouse',
			'shop',
			'transfers',
			'inventory',
			'pro',
			'physical',
			'barcode',
		],
	},
	{
		label: __( 'Cost & Profit Tracking', 'storeengine' ),
		name: 'cost-profit',
		beta: false,
		required_plugin: false,
		details: __(
			'See real revenue, COGS, and profit margin per order, locked to cost price at sale time.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/cost_profit_tracking.svg' ),
		// No standalone page exists for this addon — profit reporting is folded
		// into the Dashboard's OverviewCards row, so link there rather than to
		// an unregistered page slug (which fell through to the generic
		// "Pro feature" upsell fallback regardless of license state).
		url: get_route_path( { page: 'storeengine' } ),
		docsUrl: 'https://storeengine.pro/docs/cost-profit/',
		color: '#CD519D',
		is_pro: true,
		tags: [
			'cost',
			'profit',
			'margin',
			'cogs',
			'reports',
			'pro',
			'finance',
			'pricing',
		],
	},
	{
		label: __( 'POS Terminal', 'storeengine' ),
		name: 'pos',
		beta: false,
		required_plugin: false,
		details: __(
			'Browser-based POS for in-store sales — barcode scanning, split tenders, till sessions.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/pos_terminal.svg' ),
		url: get_route_path( { page: 'storeengine-pos' } ),
		docsUrl: 'https://storeengine.pro/docs/pos/',
		color: '#FFAB00',
		is_pro: true,
		tags: [
			'pos',
			'point of sale',
			'cashier',
			'register',
			'barcode',
			'terminal',
			'physical',
			'in-store',
			'cash',
			'tender',
		],
	},
	{
		label: __( 'Returns / RMA', 'storeengine' ),
		name: 'returns',
		beta: false,
		required_plugin: false,
		details: __(
			' Approve, receive, and refund returns with per-line restock and reason tracking.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/rma.svg' ),
		url: get_route_path( { page: 'storeengine-returns' } ),
		docsUrl: 'https://storeengine.pro/docs/returns-rma/',
		color: '#F97316',
		is_pro: true,
		tags: [
			'returns',
			'rma',
			'refund',
			'restock',
			'reason',
			'physical',
			'fashion',
			'after-sale',
		],
	},
	{
		label: __( 'Suppliers & Purchase Orders', 'storeengine' ),
		name: 'suppliers',
		beta: true,
		required_plugin: false,
		details: __(
			'Track suppliers, raise purchase orders, and receive stock with automatic cost and inventory updates. Includes a supplier portal (magic-link), PO approvals, and low-stock auto-reorder. Powers dropshipping fulfilment.',
			'storeengine'
		),
		icon: 'box',
		url: get_route_path( { page: 'storeengine-suppliers' } ),
		docsUrl: 'https://storeengine.pro/docs/suppliers/',
		color: '#0891b2',
		is_pro: true,
		tags: [
			'suppliers',
			'purchase order',
			'po',
			'procurement',
			'reorder',
			'stock',
			'cost',
			'dropshipping',
			'pro',
		],
	},
	{
		label: __( 'Retail (Grocery & Pharmacy)', 'storeengine' ),
		name: 'retail',
		beta: true,
		required_plugin: false,
		details: __(
			'Grocery scale barcodes and PLU lookup, plus pharmacy prescriptions with refill tracking and a tamper-evident controlled-substance register.',
			'storeengine'
		),
		icon: 'box',
		url: get_route_path( { page: 'storeengine-settings', path: 'retail' } ),
		docsUrl: 'https://storeengine.pro/docs/retail/',
		color: '#DC2626',
		is_pro: true,
		tags: [
			'retail',
			'grocery',
			'pharmacy',
			'scale barcode',
			'plu',
			'prescription',
			'controlled substance',
			'dispensing',
			'super shop',
		],
	},
	{
		label: __( 'Wholesale (B2B)', 'storeengine' ),
		name: 'wholesale',
		beta: true,
		required_plugin: false,
		details: __(
			'Customer groups, quantity price tiers, credit terms, case-quantity ordering, and locked-price quotes for trade buyers.',
			'storeengine'
		),
		icon: 'box',
		url: get_route_path( { page: 'storeengine-wholesale' } ),
		docsUrl: 'https://storeengine.pro/docs/wholesale/',
		color: '#7C3AED',
		is_pro: true,
		tags: [
			'wholesale',
			'b2b',
			'trade',
			'price tiers',
			'quotes',
			'credit terms',
			'net 30',
			'case quantity',
			'customer groups',
		],
	},
	{
		label: __( 'Couriers & Shipping', 'storeengine' ),
		name: 'couriers',
		beta: true,
		required_plugin: false,
		details: __(
			'Push orders to carriers (Pathao, Steadfast, Shiprocket, …) in one click and auto-poll tracking status until delivered. Provider keys live in Settings → Couriers.',
			'storeengine'
		),
		icon: 'shipping',
		url: get_route_path( { page: 'storeengine-couriers' } ),
		docsUrl: 'https://storeengine.pro/docs/couriers/',
		color: '#ea580c',
		is_pro: true,
		tags: [
			'couriers',
			'shipping',
			'carrier',
			'tracking',
			'fulfillment',
			'pathao',
			'steadfast',
			'shiprocket',
			'dropshipping',
			'pro',
		],
	},
	{
		label: __( 'Dropshipping', 'storeengine' ),
		name: 'dropshipping',
		beta: true,
		required_plugin: false,
		details: __(
			'Auto-route paid orders to your suppliers for direct fulfilment. Groups each order by supplier, creates and emails purchase orders (auto or via a review queue, per supplier), captures supplier tracking, and rolls fulfilment status back onto the order. Phase 2 imports external supplier catalogs (AliExpress, CJ, Spocket) and keeps price and stock in sync. Requires the Suppliers and Couriers addons.',
			'storeengine'
		),
		icon: 'shipping',
		url: get_route_path( { page: 'storeengine-dropship' } ),
		docsUrl: 'https://storeengine.pro/docs/dropshipping/',
		color: '#2563eb',
		is_pro: true,
		requires_addon: [ 'suppliers', 'couriers' ],
		tags: [
			'dropshipping',
			'dropship',
			'suppliers',
			'couriers',
			'fulfillment',
			'purchase order',
			'aliexpress',
			'cj',
			'spocket',
			'automation',
			'pro',
		],
	},
	{
		label: __( 'Multi Vendor', 'storeengine' ),
		name: 'multi-vendor',
		beta: false,
		required_plugin: false,
		details: __(
			'Turn your store into a marketplace — vendor signup, approval, products, and commissions.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/multi_vendor.svg' ),
		url: get_route_path( { page: 'storeengine-vendors' } ),
		docsUrl: 'https://storeengine.pro/docs/multi-vendor/',
		color: '#2B6379',
		is_pro: false,
		tags: [
			'vendor',
			'marketplace',
			'multi-vendor',
			'commission',
			'payouts',
		],
	},
	{
		label: __( 'Verification', 'storeengine' ),
		name: 'verification',
		beta: false,
		required_plugin: false,
		details: __(
			'Phone or email OTP login blocks fake orders — passwordless, with pluggable SMS gateways.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/verification.svg' ),
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'verification',
		} ),
		docsUrl: 'https://storeengine.pro/docs/verification/',
		color: '#008DFF',
		is_pro: true,
		tags: [
			'otp',
			'verification',
			'phone',
			'sms',
			'login',
			'fake-order',
			'twilio',
			'vonage',
		],
	},
	{
		label: __( 'SEO', 'storeengine' ),
		name: 'seo',
		beta: false,
		required_plugin: false,
		details: __(
			'Rich product schema, social cards, and an SEO API — works standalone or with Yoast/Rank Math.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/seo.svg' ),
		url: get_route_path( { page: 'storeengine-settings', path: 'seo' } ),
		docsUrl: 'https://storeengine.pro/docs/seo/',
		color: '#16A34A',
		is_pro: false,
		tags: [
			'seo',
			'schema',
			'structured data',
			'rich snippets',
			'open graph',
			'twitter card',
			'sitemap',
			'redirects',
			'404',
			'yoast',
			'rank math',
			'aioseo',
			'seopress',
			'meta',
			'search',
		],
	},
	{
		label: __( 'AI', 'storeengine' ),
		name: 'ai',
		beta: false,
		required_plugin: false,
		details: __(
			"Generate product titles, descriptions, and SEO meta using WordPress's built-in AI.",
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/ai.svg' ),
		url: get_route_path( { page: 'storeengine-settings', path: 'ai' } ),
		docsUrl: 'https://storeengine.pro/docs/ai/',
		color: '#7C3AED',
		is_pro: false,
		tags: [
			'ai',
			'artificial intelligence',
			'generate',
			'content',
			'copywriting',
			'product description',
			'alt text',
			'seo',
			'openai',
			'anthropic',
			'gemini',
			'connectors',
			'abilities',
			'automation',
		],
	},
	{
		// Real card (icon/url/toggle) is injected by storeengine-pro via the
		// `storeengine/admin/extra_addons` filter once Pro is active — see
		// getExternalAddons() below, which dedupes by name so this entry is
		// simply replaced rather than duplicated. This placeholder exists so
		// the addon still shows up (locked) on the free plugin when Pro is
		// not active, same as Dynamic Pricing, Advanced Coupons, etc.
		label: __( 'Role & Permission', 'storeengine' ),
		name: 'role-permission',
		beta: false,
		required_plugin: false,
		details: __(
			'Give staff scoped access to orders, products, and customers without full admin rights.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/roll_permissions.svg' ),
		url: get_route_path( {
			page: 'storeengine-settings',
			path: 'staff',
		} ),
		docsUrl: 'https://storeengine.pro/docs/role-permission/',
		color: '#635BFE',
		is_pro: true,
		tags: [ 'staff', 'roles', 'permissions', 'security', 'team', 'access' ],
	},
	{
		label: __( 'Brands', 'storeengine' ),
		name: 'brand',
		beta: false,
		required_plugin: false,
		details: __(
			' Group products by brand or manufacturer with logos, banners, and a shop filter.',
			'storeengine'
		),
		svgIcon: get_assets_url( 'images/addons/brands.svg' ),
		url: get_route_path( {
			page: 'storeengine-brands',
		} ),
		docsUrl: 'https://storeengine.pro/docs/brands/',
		is_pro: false,
		color: '#08B7D4',
		tags: [
			'brand',
			'brands',
			'manufacturer',
			'taxonomy',
			'product brand',
			'merchandising',
			'catalog',
		],
	},
];

/**
 * Addon cards injected by other plugins via the PHP filter
 * `storeengine/admin/extra_addons` (localized into StoreEngineGlobal.extra_addons).
 * This is how external payment plugins (e.g. storeengine-payments) surface their
 * gateways as cards in the Add-ons → Payments tab. Normalised to the card shape
 * AddonCard expects; cards default to OFF until the merchant enables them.
 */
const getExternalAddons = () => {
	const extra =
		( typeof window !== 'undefined' &&
			window.StoreEngineGlobal &&
			window.StoreEngineGlobal.extra_addons ) ||
		[];

	if ( ! Array.isArray( extra ) ) {
		return [];
	}

	return extra
		.filter( ( a ) => a && a.name )
		.map( ( a ) => ( {
			label: a.label || a.name,
			name: a.name,
			beta: !! a.beta,
			required_plugin: a.required_plugin || false,
			details: a.details || '',
			icon: a.icon || '',
			svgIcon: a.svgIcon || '',
			url: a.url || '',
			docsUrl: a.docsUrl || '',
			is_pro: !! a.is_pro,
			color: a.color || '',
			// Resolve a category for cards injected before they declared one:
			// payment-tagged gateways → Payment Gateways, everything else → Tools.
			category:
				a.category ||
				( Array.isArray( a.tags ) && a.tags.includes( 'payment' )
					? 'payments'
					: 'tools' ),
			tags: Array.isArray( a.tags ) ? a.tags : [ 'payment' ],
		} ) );
};

// Route plugin-injected cards (deduped by name). Payment gateways and courier
// providers surface ONLY in their own settings panels — Settings → Payment
// method ("Payment Gateway Add-ons") and Settings → Couriers ("Courier
// Add-ons") — to keep the main Add-ons list from ballooning. Everything else
// lands on the Add-ons screen.
getExternalAddons().forEach( ( card ) => {
	const tags = Array.isArray( card.tags ) ? card.tags : [];

	if ( tags.includes( 'payment' ) ) {
		if ( ! paymentAddons.some( ( a ) => a.name === card.name ) ) {
			paymentAddons.push( card );
		}
		return;
	}

	if ( tags.includes( 'courier' ) || card.category === 'couriers' ) {
		if ( ! courierAddons.some( ( a ) => a.name === card.name ) ) {
			courierAddons.push( card );
		}
		return;
	}

	if ( ! addonList.some( ( a ) => a.name === card.name ) ) {
		addonList.push( card );
	}
} );

/**
 * Functional categories used by the Add-ons page category filter row.
 * `all` is the implicit "show everything" chip. Keep slugs in sync with the
 * `addonCategories` map below and any PHP `register_addon_card` cards.
 */
export const categoryOptions = [
	{ slug: 'all', title: __( 'All', 'storeengine' ) },
	// Payment Gateways are managed in Settings → Payment method, so no chip here.
	{ slug: 'checkout', title: __( 'Checkout & Conversion', 'storeengine' ) },
	{ slug: 'pricing', title: __( 'Pricing & Discounts', 'storeengine' ) },
	{
		slug: 'subscriptions',
		title: __( 'Subscriptions & Memberships', 'storeengine' ),
	},
	{ slug: 'marketing', title: __( 'Marketing & Email', 'storeengine' ) },
	{ slug: 'content', title: __( 'SEO & AI Content', 'storeengine' ) },
	{ slug: 'products', title: __( 'Products & Catalog', 'storeengine' ) },
	{ slug: 'inventory', title: __( 'Inventory & Suppliers', 'storeengine' ) },
	{ slug: 'shipping', title: __( 'Shipping & Returns', 'storeengine' ) },
	{ slug: 'channels', title: __( 'Selling Channels', 'storeengine' ) },
	{ slug: 'tax', title: __( 'Tax & Compliance', 'storeengine' ) },
	{ slug: 'security', title: __( 'Security & Access', 'storeengine' ) },
	{ slug: 'tools', title: __( 'Tools & Insights', 'storeengine' ) },
	// External / downloadable companion plugins (not bundled in StoreEngine).
	// This chip shows only the ExternalAddons section, not the bundled grid.
	{ slug: 'extensions', title: __( 'Extensions', 'storeengine' ) },
];

// Catch-all category for any addon/card that hasn't declared one.
export const DEFAULT_CATEGORY = 'tools';

// Category slug that surfaces the external ("satellite") companion-plugin
// section instead of the bundled addon grid. Shared by the Addons page and the
// ExternalAddons section so the chip and the section agree.
export const EXTERNAL_CATEGORY = 'extensions';

/**
 * Single source of truth mapping each built-in addon to ONE primary category.
 * External cards carry their own `category` (set in getExternalAddons); this
 * loop only fills in addons that don't already have one.
 */
const addonCategories = {
	// Payment Gateways
	paypal: 'payments',
	stripe: 'payments',
	paddle: 'payments',
	razorpay: 'payments',
	// Checkout & Conversion
	'funnel-builder': 'checkout',
	'instant-checkout': 'checkout',
	'embeddable-checkout': 'checkout',
	'order-bumps': 'checkout',
	'catalog-mode': 'checkout',
	// Pricing & Discounts
	'dynamic-pricing': 'pricing',
	'advanced-coupon': 'pricing',
	'multi-currency': 'pricing',
	// Subscriptions & Memberships
	subscription: 'subscriptions',
	membership: 'subscriptions',
	'installment-plan': 'subscriptions',
	'license-management': 'subscriptions',
	// Marketing & Email
	affiliate: 'marketing',
	email: 'marketing',
	'abandoned-cart': 'marketing',
	// SEO & AI Content
	seo: 'content',
	ai: 'content',
	// Products & Catalog
	brand: 'products',
	csv: 'products',
	// Inventory & Suppliers
	inventory: 'inventory',
	'inventory-pro': 'inventory',
	suppliers: 'inventory',
	// Shipping & Returns
	couriers: 'shipping',
	returns: 'shipping',
	// Selling Channels
	pos: 'channels',
	'multi-vendor': 'channels',
	retail: 'channels',
	wholesale: 'channels',
	// Tax & Compliance
	'eu-compliance': 'tax',
	'eu-vat': 'tax',
	gdpr: 'tax',
	invoice: 'tax',
	// Security & Access
	verification: 'security',
	'fraud-shield': 'security',
	'role-permission': 'security',
	// Tools & Insights
	'cost-profit': 'tools',
	webhooks: 'tools',
	'migration-tool': 'tools',
	seeder: 'tools',
};

addonList.forEach( ( addon ) => {
	if ( ! addon.category ) {
		addon.category = addonCategories[ addon.name ] || DEFAULT_CATEGORY;
	}
} );

// Plan (tier) axis — rendered as the "All Plans" header dropdown.
export const planOptions = [
	{ value: 'all', label: __( 'All Plans', 'storeengine' ) },
	{ value: 'free', label: __( 'Free', 'storeengine' ) },
	{ value: 'pro', label: __( 'Pro', 'storeengine' ) },
];

// Status axis — rendered as the "All Status" header dropdown. Independent of plan.
export const statusOptions = [
	{ value: 'all', label: __( 'All Status', 'storeengine' ) },
	{ value: 'active', label: __( 'Active', 'storeengine' ) },
	{ value: 'inactive', label: __( 'Inactive', 'storeengine' ) },
];
