/**
 * StoreEngine Type definition
 */

import countries from './utils/countries';
import { CurrencyCode } from '@Utils/currencies';

export * from 'gtag.js';

declare global {
	interface Window {
		gtag: any;
		dataLayer: Array< any >; // Old Google Analytics.
		fbq: any;
		StoreEngineGlobal: StoreEngineGlobal;
		StoreEngineProductVariations: {
			taxonomies: Array< string >;
			pricing: Record< string, number >;
			variations: Array< ProductVariationData >;
			[ key: string ]: any;
		};
	}
}

export type ProductVariationData = {
	id: number;
	name: string;
	price: number;
	sku: string;
	pricing_id: number;
	featured_image_url: string;
	attributes: Record< string, string >;
};

export type Stringable =
	| string
	| number
	| boolean
	| bigint
	| symbol
	| { toString: () => string };

/**
 * MySQL Datetime string (Y-m-d H:i:s).
 */
export type MySQLDatetime = string;

export interface StoreEngineGlobal {
	nonce: string;
	storeengine_nonce: string;
	rest_url: string;
	locale: string;
	user_locale: string;
	namespace: string | 'storeengine/v1/';
	/** @deprecated */
	plugin_root_url: string;
	/** @deprecated */
	plugin_root_path: string;
	root_path: string;
	root_url: string;
	assets_url: string;
	ajaxurl: string;
	admin_url: string;
	admin_notices: AdminNotice[];
	site_url: string;
	route_path: string;
	admin_menu_lists: string;
	current_user_id: number | string;
	current_user_name: string;
	is_rtl: number | string | boolean | '' | '1'; // @TODO convert to proper bool
	is_admin: number | string | boolean | '' | '1'; // @TODO convert to proper bool
	addons: object;
	timezone: string;
	current_user_can: {
		manage_options: boolean;
		[ key: string ]: boolean;
	};
	first_order: string | Date;
	first_deploy_event: string | Date;
	store_country: string;
	currency_options: CurrencyOptions;
	countries: Record< string, string >;
	currencies: Array< { code: CurrencyCode; name: string; symbol: string } >;
	localeConv: LocaleConv;
	integrations: Integration[];
	/**
	 * @deprecated use page.checkout
	 */
	checkout_page_url: string;
	/**
	 * @deprecated use page.thankyou
	 */
	thankyou_page_url: string;
	page: {
		dashboard: string;
		checkout: string;
		thankyou: string;
	};
	is_page: {
		is_product: boolean;
		is_shop: boolean;
		is_cart: boolean;
		is_dashboard: boolean;
		is_address_edit: boolean;
		is_checkout: boolean;
		is_order_pay: boolean;
		is_add_payment_method: boolean;
		[ key: string ]: boolean;
	};
	payment_gateways: {
		paypal?: PayPalOptions;
		stripe?: StripeOptions;
		paddle?: PaddleOptions;
		razorpay?: RazorpayOptions;
		square?: SquareUpConfig;
	};
	payment_data: {
		currency: CurrencyCode;
		cart_total: number;
		has_subscription: boolean;
		has_trial: boolean;
		customerBillingData: null | {
			name: string;
			email: string;
			phone: string;
			address: {
				country: string;
				line1: string;
				line2: string;
				city: string;
				state: string;
				postal_code: string;
			};
		};
	};
	/**
	 * @deprecated use is_page.is_order_pay
	 */
	checkout_with_order_pay: string | number | boolean | '' | '1';
	states: object;
	state_labels: object;
	state_label: string;
	is_required: string;
	i18n_select_state_text: string;
	i18n_no_matches: string;
	i18n_ajax_error: string;
	i18n_input_too_short_1: string;
	i18n_input_too_short_n: string;
	i18n_input_too_long_1: string;
	i18n_input_too_long_n: string;
	i18n_selection_too_long_1: string;
	i18n_selection_too_long_n: string;
	i18n_load_more: string;
	i18n_searching: string;
	tokenization_data: {
		is_registration_required: boolean;
		is_logged_in: boolean;
	};
}

/**
 * Utility type that generates dot-notation paths for nested objects.
 */
type DotPath< T > = T extends object
	? {
			[ K in Extract< keyof T, string > ]: T[ K ] extends object
				? `${ K }` | `${ K }.${ DotPath< T[ K ] > }`
				: `${ K }`;
	  }[ Extract< keyof T, string > ]
	: never;

type DotPathValue< T, P extends DotPath< T > > = P extends keyof T
	? T[ P ]
	: P extends `${ infer K }.${ infer Rest }`
	? K extends keyof T
		? DotPathValue< T[ K ], Rest >
		: never
	: never;

// declare function getSeGlobal<P extends DotPath<StoreEngineGlobal>>(
// 	path: P
// ): DotPathValue<StoreEngineGlobal, P> | undefined;
//
// declare function getSeGlobal<P extends DotPath<StoreEngineGlobal>, D>(
// 	path: P,
// 	defaultValue: D
// ): DotPathValue<StoreEngineGlobal, P> | D;

export type PostMetaObject = {
	[ key: string ]: any;
};

export type PostStatus = 'publish' | 'draft' | 'auto-draft' | string;

export type StoreEngineProductType = 'simple' | 'bundled' | 'variable';

export type StoreEngineProductShippingType = 'digital' | 'physical';

export type ProductPricePriceSettings = {
	setup_fee: boolean;
	setup_fee_name: string;
	setup_fee_price: number;
	setup_fee_type: 'fee';
	trial: boolean;
	trial_days: number;
	expire: boolean;
	expire_days: number;
	payment_duration: boolean;
	payment_duration_type: IntervalOption;
	upgradeable: boolean;
	tax_status: ProductTaxStatus;
	enable_license_activation_limit: boolean;
	license_activation_limit: number;
	license_prefix?: string;
	license_segments?: string | string[];
	down_payment?: number;
	installments?: Array< InstallmentData >;
	is_hidden: boolean;
};

export type ProductPrice = {
	id: number;
	price_name: string;
	price_type: string;
	price: number | null;
	compare_price: number | null;
	product_id: number | null;
	settings: ProductPricePriceSettings;
	order: number | null;
	checkout_link: string;
};

export type ProductBundle = {
	product_id: number | null;
	price_id: number | null;
};

export type ProductVariation = {
	id: number;
	taxonomies: {
		[ key: string ]: number;
	};
	data: Array< {
		label: string;
		value: string;
	} >;
	featured_image_id: number;
	pricing_id: number;
	price: number | null;
	sku: string | null;
};

export type ProductIntegrationData = {
	id: number;
	product_id: number;
	price_id: number;
	integration_id: number;
	provider: 'string';
	course_ids?: Array< number >;
};

export type StoreEngineProduct = {
	title: string;
	content: string;
	status: PostStatus;
	prices: Array< ProductPrice >;
	integrations: Array< ProductIntegrationData >;
	storeengine_product_category: Array< Number >;
	storeengine_product_tag: Array< Number >;
	storeengine_product_template: Array< unknown >;
	variants: Array< ProductVariation >;
	bundles: Array< ProductBundle >;
	attributes: Array< {
		label: string;
		ids: Array< number >;
	} >;
	featured_media: Number;
	product_type: StoreEngineProductType;
	meta: {
		_storeengine_product_gallery_ids: [];
		_storeengine_product_downloadable_files: [];
		_storeengine_product_shipping_type: StoreEngineProductShippingType;
		_storeengine_product_physical_weight: string;
		_storeengine_product_physical_weight_unit: string;
		_storeengine_product_digital_auto_complete: boolean;
		_storeengine_product_download_type: 'instant' | 'versioned';
		_storeengine_product_enable_license_creation: boolean;
		_storeengine_has_free_version: boolean;
		_storeengine_free_version_source: 'wporg' | 'store';
		_storeengine_free_version_slug: string;
		_storeengine_free_version_name: string;
		_storeengine_free_version_guide_url: string;
		_storeengine_crosssell_ids: Array< number >;
		_storeengine_upsell_ids: Array< number >;
		_storeengine_product_hide: boolean;
		_storeengine_paddle_tax_category: string;
		_storeengine_product_purchase_redirect_type: string;
		_storeengine_product_purchase_redirect_url: string;
	} & PostMetaObject;
} & { [ key: string ]: any };

declare function get_assets_url( path: undefined | Stringable ): string;

interface DOMEvent extends Event {
	target: EventTarget | HTMLElement | HTMLInputElement;
}

export type EV_Options = boolean | AddEventListenerOptions;

export interface StoreEngineDQ {
	elements: HTMLElement[] | NodeList | NodeListOf< HTMLElement >;
	length: number;

	exists: () => boolean;

	show(): this;

	hide(): this;

	animate(
		properties: Object,
		duration: number,
		callback?: ( this: HTMLElement ) => void
	): this;

	fadeIn( duration: number, callback?: ( this: HTMLElement ) => void ): this;

	fadeOut( duration: number, callback?: ( this: HTMLElement ) => void ): this;

	slideDown(
		duration: number,
		callback?: ( this: HTMLElement ) => void
	): this;

	slideUp( duration: number, callback?: ( this: HTMLElement ) => void ): this;

	on< K extends keyof HTMLElementEventMap >(
		eventName: K,
		selector?: string,
		listener?: (
			this: HTMLElement,
			event: HTMLElementEventMap[ K ]
		) => void,
		options?: EV_Options
	): this;

	on< K extends keyof HTMLElementEventMap >(
		eventName: K,
		listener: (
			this: HTMLElement,
			event: HTMLElementEventMap[ K ]
		) => void,
		options?: EV_Options
	): this;

	on(
		eventName: string,
		selector?: string,
		listener?: ( this: HTMLElement, event: Event ) => void,
		options?: EV_Options
	): this;

	on(
		eventName: string,
		listener: ( this: HTMLElement, event: Event ) => void,
		options?: EV_Options
	): this;

	one< K extends keyof HTMLElementEventMap >(
		eventName: K,
		selector?: string,
		listener?: (
			this: HTMLElement,
			event: HTMLElementEventMap[ K ]
		) => void
	): this;

	one< K extends keyof HTMLElementEventMap >(
		eventName: K,
		listener: ( this: HTMLElement, event: HTMLElementEventMap[ K ] ) => void
	): this;

	one(
		eventName: string,
		selector?: string,
		listener?: ( this: HTMLElement, event: Event ) => void
	): this;

	one(
		eventName: string,
		listener: ( this: HTMLElement, event: Event ) => void
	): this;

	off< K extends keyof HTMLElementEventMap >(
		eventName: K,
		selector?: string,
		listener?: (
			this: HTMLElement,
			event: HTMLElementEventMap[ K ]
		) => void
	): this;

	off< K extends keyof HTMLElementEventMap >(
		eventName: K,
		listener?: (
			this: HTMLElement,
			event: HTMLElementEventMap[ K ]
		) => void
	): this;

	off(
		eventName: string,
		selector?: string,
		listener?: ( this: HTMLElement, event: Event ) => void
	): this;

	off(
		eventName: string,
		listener?: ( this: HTMLElement, event: Event ) => void
	): this;

	trigger(
		eventName: string,
		args?: { bubbles?: boolean; cancelable?: boolean; [ key: string ]: any }
	): this;

	css(
		property: string | Record< string, any >,
		value?: string | number
	): this | string;

	addClass( className: string | string[] ): this;

	removeClass( className: string | string[] ): this;

	toggleClass( className: string, force?: boolean ): this;

	hasClass: ( className: string ) => boolean;

	html: ( ( content: string ) => this ) & ( () => string | undefined );

	/**
	 * Appends HTML, element, array, NodeList or StoreEngineDQ instance.
	 */
	append(
		content: string | HTMLElement | NodeList | HTMLElement[] | StoreEngineDQ
	): this;

	text: ( ( content: string ) => this ) & ( () => string );

	val: ( ( value: any ) => this ) & ( () => any );

	prop: ( ( prop: string, value: any ) => this ) &
		( ( prop: string ) => any );

	removeProp( prop: string ): this;

	attr: ( ( name: string, value: string ) => this ) &
		( ( name: string ) => string );

	removeAttr( name: string ): this;

	data: ( ( name: string, value: any ) => this ) &
		( ( name: string ) => any );

	remove(): this;

	not: ( selector: string ) => StoreEngineDQ;

	find: ( selector: string ) => StoreEngineDQ;

	closest: ( selector: string ) => StoreEngineDQ;

	parent: ( selector: string ) => StoreEngineDQ;

	each(
		callback: ( this: HTMLElement, index: number, el: HTMLElement ) => void
	): this;

	each< T >(
		items: Array< T >,
		callback: ( this: T, index: number, item: T ) => void
	): this;

	forEach(
		callback: ( this: HTMLElement, el: HTMLElement, index: number ) => void
	): this;

	forEach< T >(
		items: Array< T >,
		callback: ( this: T, item: T, index: number ) => void
	): this;

	getFormData: < T extends {} >() => T;

	get: ( index?: number ) => HTMLElement | undefined;

	at: ( index?: number ) => StoreEngineDQ;

	first: () => StoreEngineDQ;

	last: () => StoreEngineDQ;

	filter: (
		predicate: (
			this: HTMLElement,
			el: HTMLElement,
			index: number,
			array: HTMLElement[]
		) => boolean
	) => StoreEngineDQ;

	clearOptions(): this;

	addOptions( options: { label: string; value: string | number }[] ): this;

	toArray: () => HTMLElement[];

	siblings: () => StoreEngineDQ;

	children: () => StoreEngineDQ;
}

export function StoreEngineDQ(
	selector:
		| string
		| Window
		| Document
		| HTMLElement
		| HTMLElement[]
		| NodeList
		| NodeListOf< HTMLElement >,
	context?: Document | HTMLElement
): StoreEngineDQ;

export interface SettingsTab {
	slug: string;
	icon: string;
	title: string;
	className: string;
	priority: number;
}

export interface AdminNotice {
	key: string;
	type: string | 'info' | 'success' | 'warning' | 'error';
	icon: string;
	alt: boolean;
	large: boolean;
	classes: string[];
	title: string;
	message: string;
	button_text: string;
	button_action: string;
	button_class: string;
	button_target: string;
	dismissible: boolean;
	has_buttons: boolean;
}

export interface PayPalOptions {
	client_id: string;
}

export interface StripeOptions {
	is_production: boolean;
	publishable_key: string;
}

export interface PaddleOptions {
	client_token: string;
	sandbox_mode: boolean;
	theme: string;
	variant: string;
	order_id?: number;
	billing_email?: string;
}

export interface RazorpayOptions {
	cart_total?: string;
	key_id?: string;
	store_name?: string;
	store_logo?: string;
	order_id?: string;
	store_primary_color?: string;
}

export interface SquareUpConfig {
	application_id?: string;
	is_sandbox: boolean;
	location_id?: string;
}

export interface CurrencyOptions {
	currency: string;
	currency_position: string;
	currency_thousand_separator: string;
	currency_decimal_separator: string;
	currency_decimal_limit: number;
	rounding_precision: number;
	currency_symbol: string;
}

export interface Integration {
	value: string;
	label: string;
	icon: string;
}

export type AdminRouteOptions = {
	status?: string;
	page?: number;
	per_page?: number;
	search?: string;
	sub_path?: string;
	[ key: string ]: any; // Allow extra query params
};

export type CustomerAddress = {
	first_name: string;
	last_name: string;
	company?: string;
	address_1: string;
	address_2: string;
	state: string;
	city: string;
	postcode: string;
	country: string;
	email: string;
	phone: string;
	address_type: 'billing' | 'shipping';
};

export type StripePaymentIntent = {
	id: string;
	object: string;
	amount: number;
	amount_details: object | { tip: Object };
	automatic_payment_methods: {
		allow_redirects: string;
		enabled: boolean;
	};
	canceled_at: string | null | number | Date;
	cancellation_reason: string | null;
	capture_method: string | 'manual' | 'auto';
	client_secret: string;
	confirmation_method: string | 'automatic';
	created: number;
	currency: string;
	description: string;
	last_payment_error: string | null;
	livemode: boolean;
	next_action: string | null;
	payment_method: string;
	payment_method_configuration_details: {
		id: string;
		parent: string | null;
	};
	payment_method_types: string[];
	processing: string | null;
	receipt_email: string | null;
	setup_future_usage: 'on_session' | 'off_session' | string;
	shipping: string | null;
	source: string | null;
	status: string | 'requires_capture';
};

export type CommonDropdownOption = {
	label: string;
	value: string | number;
};

export type CommonDropdownOptions = Array< CommonDropdownOption >;

export type DateTime = string | null;

export type ProductLicense = {
	id: number;
	order_id: number | null;
	product_id: number | null;
	price_id: number | null;
	customer_id: number | null;
	license_key: string | null;
	activation_limit: number;
	activation_count: number;
	status: 'active' | 'inactive' | 'expired' | 'revoked';
	enable_whitelist: boolean;
	domain_whitelist: string[];
	product_name: string | null;
	price_name: string | null;
	customer_name: string | null;
	// Dates
	revoked_at: DateTime;
	expires_at: DateTime;
	created_at: DateTime;
	updated_at: DateTime;
};

export type ProductLicenseStore = {
	data: ProductLicense[];
	rowsPerPage: number;
	page: number;
	status: string;
	search: string;
	totalItems: number;
};

export type InstallationEvent = {
	id: number;
	license_id: number | null;
	product_id: number | null;
	product_name: string | null;
	customer_id: number | null;
	customer_name: string | null;
	device_id: string | null;
	item_slug: string | null;
	site_url: string | null;
	status: 'active' | 'inactive' | 'license-inactive';
	opt_in: string | number | 0 | 1;
	reason: string | null;
	message: string | null;
	activated_at: DateTime;
	deactivated_at: DateTime;
	created_at: DateTime;
	updated_at: DateTime;
};

export type InstallationEventStore = {
	data: [ InstallationEvent ];
	rowsPerPage: number;
	page: number;
	status: string;
	search: string;
	totalItems: number;
};

export type ProductUsageLog = {
	id: number;
	install_id: number;
	product_id: number;
	item_slug: string;
	item_version: string;
	core_name: string;
	core_version: string;
	server_name: string;
	server_version: string;
	db_name: string;
	db_version: string;
	runtime: string;
	runtime_version: string;
	os_name: string;
	os_version: string;
	os_arch: string;
	site_url: string;
	ip_address: string;
	sdk_version: string;
	usage_log: Object;
	user_agent: string;
	log_time: DateTime;
};

export type ProductUsageLogStore = {
	data: [ ProductUsageLog ];
	rowsPerPage: number;
	page: number;
	status: string;
	search: string;
	totalItems: number;
};

export type DeploymentItem = {
	id: number;
	product_name: string;
	status: string;
	description: string;
	thumbnail: string;
	version: string;
	download: string;
	product_type: string | null;
	plan_type: 'free' | 'pro';
	product_slug: string | null;
	premium_slug: string | null;
	has_free: boolean;
	icon: {
		id: number;
		url: string;
	};
	deployed_at: DateTime;
	created_at: DateTime;
	updated_at: DateTime;
};

export type DeploymentItemStore = {
	data: [ DeploymentItem ];
	rowsPerPage: number;
	page: number;
	status: string;
	search: string;
	totalItems: number;
};

export type WP_Plugin_Header = {
	Name: string;
	PluginURI: string;
	Version: string;
	Description: string;
	Author: string;
	AuthorURI: string;
	TextDomain: string;
	DomainPath: string;
	Network: string;
	RequiresPHP: string;
	RequiresWP: string;
	TestedUpTo: string;
	UpdateURI: string;
	RequiresPlugins: string[];
};

export type WP_Theme_Header = {
	Name: string;
	ThemeURI: string;
	Author: string;
	Template: string;
	AuthorURI: string;
	Description: string;
	Version: string;
	RequiresWP: string;
	TestedUpTo: string;
	RequiresPHP: string;
	License: string;
	LicenseURI: string;
	TextDomain: string;
	DomainPath: string;
	AMP: string;
};

export type DeploymentVersion = {
	id: number;
	deployment_id: number;
	product_name: string | null;
	version: string | null;
	file_name: string;
	file_hash: string;
	status: string;
	sdk_version: string | null;
	info:
		| Object
		| {
				deployment_version: string | undefined;
				original_filename: string;
				deployment_type: string | 'free' | 'pro';
				package_type: string | 'wordpress-plugin' | 'wordpress-theme';
				package_info: object | WP_Plugin_Header | WP_Theme_Header;
				sdk_path: string;
				init_path: string;
				slug: string;
				pro_slug: string;
				[ key: string ]: any;
				[ key: string ]: {
					data: WP_Plugin_Header | WP_Theme_Header;
					basename: string;
					filename: string;
				};
		  };
	dl_link: string | null;

	dl_free: string | null;
	free_name: string | null;
	dl_pro: string | null;
	pro_name: string | null;

	requires: string | null;
	tested: string | null;
	min_php: string | null;

	staged_rollout: string | null;
	download_count: number;
	deployed_at: DateTime;
	created_at: DateTime;
	updated_at: DateTime;
};

export type DeploymentVersionStore = {
	data: [ DeploymentVersion ];
	rowsPerPage: number;
	page: number;
	status: string;
	search: string;
	totalItems: number;
};

export type AbandonedCart = {
	id: number;
};

export type CountryCode = ( typeof countries )[ number ][ 'value' ];

export type CheckoutFormData = {
	order_id: number | string;
	order_key: string;
	user_email: string;
	shipping_first_name: string;
	shipping_last_name: string;
	shipping_phone: string;
	shipping_address_1: string;
	shipping_address_2: string;
	shipping_country: CountryCode;
	shipping_city: string;
	shipping_state: 'BD-13';
	shipping_postal_code: '1216';
	same_as_shipping: 'true' | 'false';
	billing_first_name: string;
	billing_last_name: string;
	billing_email: string;
	billing_phone: '0173402952';
	billing_address_1: string;
	billing_address_2: string;
	billing_country: CountryCode;
	billing_city: string;
	billing_state: 'BD-13';
	billing_postcode: '1216';
	payment_method:
		| 'cod'
		| 'bacs'
		| 'check'
		| 'paypal'
		| 'stripe'
		| 'paddle'
		| 'razorpay';
	[ 'storeengine-stripe-payment-token' ]?: '1';
	[ key: string ]: any;
};

export type AddonData = {
	label: string;
	name: string;
	required_plugin: false | string[];
	details: string;
	icon: string;
	svgIcon?: string;
	url?: string;
	docsUrl?: string;
	color?: string;
	is_pro?: boolean;
	tags: string[];
};

export type OrderNoteData = {
	id: number;
	date_created: MySQLDatetime;
	content: string;
	customer_note: boolean;
	added_by: string;
	order_id: number;
};

export type PriceOption = 'onetime' | 'subscription' | 'installment-plan';
export type ProductTaxStatus = 'taxable' | 'shipping' | 'none';
export type IntervalOption = 'day' | 'week' | 'month' | 'year';

export type InstallmentData = {
	percentage: number;
	delay: number;
	period: IntervalOption;
};

export type PriceSettings = {
	setup_fee: boolean;
	setup_fee_name: string;
	setup_fee_price: number;
	setup_fee_type: 'fee';
	trial: boolean;
	trial_days: number;
	expire: boolean;
	expire_days: number;
	payment_duration: boolean;
	payment_duration_type: IntervalOption;
	upgradeable: boolean;
	tax_status: ProductTaxStatus;
	enable_license_activation_limit: boolean;
	license_activation_limit: number;
	license_prefix?: string;
	license_segments?: string | string[];
	down_payment?: number;
	installments?: Array< InstallmentData >;
	is_hidden: boolean;
};

export type CartItem = {
	key: string;
	product_id: number;
	variation_id: number;
	variation: Record< string, string >;
	price_id: number;
	name: string;
	price_name: string;
	price_type: PriceOption;
	price: number;
	compare_price?: number;
	quantity: 1;
	item_data: [];
	line_subtotal: number;
	tax_class?: string;
	taxable: boolean;
	line_total: number;
	line_subtotal_tax?: number;
	line_tax?: number;
	line_tax_data: Record< string, Record< string, number > >;
	setup_fee: boolean;
	setup_fee_name: string;
	setup_fee_price: number;
	setup_fee_type: string | 'fee';
	trial: boolean;
	trial_days: number;
	expire: false;
	expire_days: number;
	payment_duration: number;
	payment_duration_type: IntervalOption;
	upgradeable: number;
	tax_status: ProductTaxStatus;
	enable_license_activation_limit: number;
	license_activation_limit: number;
	license_prefix?: string | null;
	license_segments?: any;
	down_payment?: number;
	installments?: Array< InstallmentData >;
	is_hidden: boolean;
};

export type CartFee = {
	id: string;
	name: string;
	tax_class: string;
	taxable: boolean;
	amount: number;
};

export type CartTaxes = Record< string, number >;

export type CartTotals = {
	subtotal: number;
	subtotal_tax: number;
	shipping_total: number;
	shipping_tax: number;
	shipping_taxes: CartTaxes;
	discount_total: number;
	discount_tax: number;
	cart_contents_total: number;
	cart_contents_tax: number;
	cart_contents_taxes: CartTaxes;
	fee_total: number;
	fee_tax: number;
	fee_taxes: CartTaxes;
	total: number;
	total_tax: number;
};

export type CartInfo< render extends boolean = false > = {
	is_empty: boolean;
	tax_itemized: boolean;
	subtotal: number;
	total: number;
	taxes_total: number;
	tax_totals: CartTaxes;
	tax_or_vat: string;
	tax_label_suffix: string;
	cart_items_count: 0;
	totals: CartTotals;
	cart_items: Record< string, CartItem >;
	cart_fees: Record< string, CartFee >;
	cart_items_html: render extends true ? string : null;
	cart_url: string;
	checkout_url: string;
	shop_url: string;
};

export type MetaData< K extends string = string, V = any > = {
	id?: number | null;
	key: K;
	value: V;
};

export type Order = {
	id: number;
	status: string;
	currency: string;
	type: string;
	tax_amount: string | number;
	total_amount: string | number;
	customer_id: 1;
	order_email: string;
	date_created_gmt: string;
	date_updated_gmt: string;
	parent_order_id: 57;
	payment_method: string;
	payment_method_title: string;
	transaction_id: string;
	ip_address: string;
	user_agent: string;
	customer_note: string;
	hash: string;
	operational_id: string;
	created_via: string;
	version: string;
	prices_include_tax: boolean;
	coupon_usages_are_counted: boolean;
	download_permission_granted: boolean;
	cart_hash: string;
	new_order_email_sent: boolean;
	order_key: string;
	order_stock_reduced: boolean;
	date_paid_gmt: string;
	date_completed_gmt: string;
	shipping_tax_amount: string | Number;
	shipping_total_amount: string | Number;
	discount_tax_amount: string | Number;
	discount_total_amount: string | Number;
	recorded_sales: boolean;
	total: string | Number;
	subtotal: string | Number;
	total_tax: string | Number;
	cart_tax: string | Number;
	order_placed_date_gmt: string;
	paid_status: 'paid';
	billing: CustomerAddress; // Check..
	shipping: CustomerAddress; // Check..
	download_permissions_granted: boolean;
	auto_complete_digital_order: boolean;
	number: string; // Order ID filtered (can have other chars).
	line_items: Array< OrderItemProduct >;
	tax_lines: Array< OrderItemTax >;
	shipping_lines: Array< OrderItemShipping >;
	fee_lines: Array< OrderItemFee >;
	coupon_lines: Array< OrderItemCoupon >;
	meta: Array< MetaData >;
};

export type OrderItem = {
	order_id: number;
	name: string;
};

export type OrderItemProduct = OrderItem & {
	product_id: number;
	variation_id: number;
	quantity: number;
	tax_class: string;
	subtotal: string | number;
	subtotal_tax: string | number;
	total: string | number;
	total_tax: string | number;
	taxes: {
		total: Record< string, string | number >;
		subtotal: Record< string, string | number >;
	};
	tax_status: ProductTaxStatus;
	product_type: string | 'simple';
	shipping_type: string | 'digital';
	digital_auto_complete: 'yes' | 'no';
	price_type: PriceOption;
	price_id: number;
	price_name: string;
	price: string | number;
	setup_fee: string;
	setup_fee_name: string;
	setup_fee_price: string | number;
	setup_fee_type: 'fee';
	trial: string;
	trial_days: string | number;
	expire: string;
	expire_days: string | number;
	payment_duration: string | number;
	payment_duration_type: IntervalOption;
	upgradeable: string;
	meta: Array< MetaData | MetaData< '_price_settings', PriceSettings > >;
};

export type OrderItemFee = OrderItem & {
	tax_class: string;
	tax_status: ProductTaxStatus;
	amount: string;
	total: string;
	total_tax: string;
	taxes: {
		total: Record< string, string | number >;
	};
};

export type OrderItemTax = OrderItem & {
	rate_code: string;
	rate_id: number;
	label: string;
	compound: boolean;
	tax_total: string | number;
	shipping_tax_total: number;
	rate_percent: number;
};

export type OrderItemShipping = OrderItem & {
	method_title: string;
	method_id: string;
	instance_id: string;
	total: string | number;
	total_tax: string | number;
	taxes: {
		total: Record< string, string | number >;
	};
	tax_status: ProductTaxStatus;
};

export type OrderItemCoupon = OrderItem & {
	code: string;
	discount: string | number;
	discount_tax: string | number;
};

export type CheckoutResponse = {
	result: 'success' | string;
	redirect: string; // Redirect URL.
	order: Order;
};

export type CartJSData = {
	labels: string[];
	datasets: Array< {
		label: string;
		format: boolean;
		data: Array< Number | any >;
		borderColor?: string;
		backgroundColor?: string;
		[ key: string ]: any;
	} >;
};

export type DashboardAnalyticsData = {
	stats: Array< {
		label: string;
		icon: string;
		data: {
			count: number;
			format: boolean;
			rate: number;
		};
	} >;
	growth: CartJSData & {
		totals: {
			sales: number;
			refunds: number;
			orders: number;
			avg_return: number;
		};
	};
	heat_map: Array< {
		cc: string;
		name: string;
		value: number;
	} >;
	recent_orders: Array< {
		product: string;
		customer: string;
		amount: number;
		status: string;
		payment: string;
		date: MySQLDatetime;
		since: string;
	} >;
	top_products: Array< {
		product_id: number;
		product_name: string;
		total_sales: number;
		units_sold: number;
		compare_sales: number;
		compare_units: number;
		sales_rate: number;
		units_rate: number;
	} >;
};

// Utility type to generate a range of numbers from 0 up to (but not including) N
export type Range<
	N extends number,
	Acc extends number[] = [],
> = Acc[ 'length' ] extends N
	? Acc[ number ]
	: Range< N, [ ...Acc, Acc[ 'length' ] ] >;

// PHP CHAR_MAX equivalent
export type CharMax = 127;

// Utility: 0–4
export type SignPosition = 0 | 1 | 2 | 3 | 4;

// Utility: boolean-like flags from PHP (0,1, or CHAR_MAX)
export type LocaleBool = 0 | 1 | CharMax;

export type GroupingValue = number | 0 | CharMax;

export interface LocaleConv {
	// Numeric formatting
	decimal_point: string;
	thousands_sep: string;
	grouping: GroupingValue[];

	// Monetary formatting
	int_curr_symbol: string;
	currency_symbol: string;
	mon_decimal_point: string;
	mon_thousands_sep: string;
	mon_grouping: GroupingValue[];

	// Signs
	positive_sign: string;
	negative_sign: string;

	// Fraction digits (can be CHAR_MAX)
	int_frac_digits: number | CharMax;
	frac_digits: number | CharMax;

	// Currency symbol placement
	p_cs_precedes: LocaleBool;
	p_sep_by_space: LocaleBool;
	n_cs_precedes: LocaleBool;
	n_sep_by_space: LocaleBool;

	/**
	 * 0 - Parentheses surround the quantity and currency_symbol
	 * 1 - Sign precedes value and currency
	 * 2 - Sign succeeds value and currency
	 * 3 - Sign immediately precedes currency_symbol
	 * 4 - Sign immediately succeeds currency_symbol
	 * 127 - Not available
	 */
	p_sign_posn: SignPosition | CharMax;
	n_sign_posn: SignPosition | CharMax;
}

export type AddToCartRequest = {
	quantity: string | number;
	product_id: string | number;
	variation_id: string | number;
	price_id: string | number;
	[ key: string ]: any;
};

export type AddToCartResponse = {
	item: CartItem;
	message: string | undefined | null;
	redirect: string | undefined | null;
};

export type RemoveFromCartResponse = {
	item: CartItem;
	product_id: number | null;
	price_id: number | null;
	message: string;
};

export type UpdateCartItemQtyResponse = {
	item: CartItem;
	product_id: number | null;
	price_id: number | null;
	message: string;
	subtotal: string;
};

export type RefreshCartResponse = {
	[ selector: string ]: string;
};

export type UpdateCheckoutResponse = {
	order: {
		user_email: string;
		shipping_method: string;
		same_as_shipping: boolean;
		billing_first_name: string;
		billing_last_name: string;
		billing_address_1: string;
		billing_address_2: string;
		billing_city: string;
		billing_state: string;
		billing_postcode: string;
		billing_country: string;
		billing_email: string;
		billing_phone: string;
		shipping_first_name: string;
		shipping_last_name: string;
		shipping_phone: string;
		shipping_address_1: string;
		shipping_address_2: string;
		shipping_country: string;
		shipping_city: string;
		shipping_state: string;
		shipping_postal_code: string;
		payment_method: string;
		order: number;
	};
	massage: string;
	hash: string;
	refresh_payment_methods: boolean;
	needs_shipping: boolean;
	same_as_shipping: boolean;
	refresh: boolean;
};

export type AjaxRequestMapping = {
	refresh_cart: Object;
	update_checkout: Object;
	update_cart_item_quantity: {
		item_key: string;
		quantity: number;
	};
};

export type AjaxResponseMapping = {
	refresh_cart: RefreshCartResponse;
	update_checkout: UpdateCheckoutResponse;
	update_cart_item_quantity: UpdateCartItemQtyResponse;
};
