/**
 * Settings tab definitions and group layout.
 *
 * Extracted from Settings/index.js into a leaf module (imports only i18n + a few
 * pure helpers) so it can be shared by the global header search
 * (`@Components/GlobalSearch`) without dragging in TopBar / the whole settings
 * page and creating an import cycle.
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { getAddonActiveStatus, is_pro } from '@Utils/helper';

/**
 * Get Settings Tabs.
 *
 * @param                     allAddons
 * @param {StoreEngineGlobal} SEGlobal
 * @return {[SettingsTab]}
 */
export const getTabs = ( allAddons, SEGlobal ) => {
	const multiVendorTab = getAddonActiveStatus( allAddons, 'multi-vendor' )
		? [
				{
					slug: 'multi-vendor',
					icon: 'affiliate',
					title: __( 'Multi Vendor', 'storeengine' ),
					subtitle: (
						<>
							{ __(
								'Marketplace settings: commission, owner',
								'storeengine'
							) }
							<br />
							{ __( 'vendor, withdrawals, badges', 'storeengine' ) }
						</>
					),
					className: 'multi-vendor',
					// Top-level item in Advanced's old slot (after Marketing 60),
					// kept just before AI (74) to preserve their prior order.
					priority: 72,
				},
		  ]
		: [];

	const affiliateTab = getAddonActiveStatus( allAddons, 'affiliate' )
		? [
				{
					slug: 'affiliate',
					icon: 'affiliate',
					title: __( 'Affiliate', 'storeengine' ),
					subtitle: __(
						'Easily Manage your affiliate program',
						'storeengine'
					),
					className: 'pages',
					priority: 70,
				},
		  ]
		: [];

	const taxTab = [
		{
			slug: 'tax',
			icon: 'tax',
			title: __( 'Tax', 'storeengine' ),
			subtitle: __(
				'Set up tax rules and regional rates',
				'storeengine'
			),
			className: 'tax',
			priority: 50,
		},
	];

	const euVatTab = getAddonActiveStatus( allAddons, 'eu-vat' )
		? [
				{
					slug: 'eu-vat',
					icon: 'tax',
					title: __( 'EU/UK VAT', 'storeengine' ),
					subtitle: __(
						'Collect & validate VAT numbers at checkout',
						'storeengine'
					),
					className: 'tax',
					priority: 52,
				},
		  ]
		: [];

	const seoTab = getAddonActiveStatus( allAddons, 'seo' )
		? [
				{
					slug: 'seo',
					icon: 'general',
					title: __( 'SEO', 'storeengine' ),
					subtitle: __(
						'Schema, social cards, search visibility & integration',
						'storeengine'
					),
					className: 'advanced',
					priority: 53,
				},
		  ]
		: [];

	const aiTab = getAddonActiveStatus( allAddons, 'ai' )
		? [
				{
					slug: 'ai',
					icon: 'general',
					title: __( 'AI', 'storeengine' ),
					subtitle: __(
						'Tone, language & model for AI content generation',
						'storeengine'
					),
					className: 'advanced',
					// Top-level item in Advanced's old slot, just after Multi Vendor (72).
					priority: 74,
				},
		  ]
		: [];

	const couriersTab = getAddonActiveStatus( allAddons, 'couriers' )
		? [
				{
					slug: 'couriers',
					icon: 'shipping',
					title: __( 'Couriers', 'storeengine' ),
					subtitle: __(
						'Provider credentials, auto-push, status sync',
						'storeengine'
					),
					className: 'advanced',
					priority: 96,
				},
		  ]
		: [];

	const emailTab = getAddonActiveStatus( allAddons, 'email' )
		? [
				{
					slug: 'email',
					title: __( 'Emails', 'storeengine' ),
					subtitle: __(
						'Customize and manage email templates',
						'storeengine'
					),
					icon: 'email',
					className: 'advanced',
					priority: 80,
				},
		  ]
		: [];

	const invoiceTab = getAddonActiveStatus( allAddons, 'invoice' )
		? [
				{
					slug: 'invoice',
					title: __( 'Invoice', 'storeengine' ),
					subtitle: __( 'Set up invoice and details', 'storeengine' ),
					icon: 'invoice',
					className: 'advanced',
					priority: 80,
				},
		  ]
		: [];

	const catalogModeTab = getAddonActiveStatus( allAddons, 'catalog-mode' )
		? [
				{
					slug: 'catalog-mode',
					title: __( 'Catalog Mode', 'storeengine' ),
					subtitle: __( 'Product showcase mode only', 'storeengine' ),
					icon: 'catalog',
					className: 'advanced',
					priority: 35,
				},
		  ]
		: [];

	const donationTab = getAddonActiveStatus( allAddons, 'donation' )
		? [
				{
					slug: 'donation',
					title: __( 'Donations', 'storeengine' ),
					subtitle: __( 'Name-your-price & donation defaults', 'storeengine' ),
					icon: 'affiliate',
					className: 'advanced',
					priority: 36,
				},
		  ]
		: [];

	const complianceTab = getAddonActiveStatus( allAddons, 'eu-compliance' )
		? [
				{
					slug: 'compliance',
					icon: 'cart',
					title: __( 'Compliance', 'storeengine' ),
					subtitle: __(
						'EU/German legal: button text, VAT, consent & legal docs',
						'storeengine'
					),
					className: 'compliance',
					priority: 34,
				},
		  ]
		: [];

	// Nested children of Cart & Checkout — mirrors file 1's cartCheckoutChildren.
	const cartCheckoutChildren = [
		{
			slug: 'checkout-fields',
			title: __( 'Checkout Fields', 'storeengine' ),
			subtitle: __( 'Configure checkout fields', 'storeengine' ),
			icon: 'cart',
			priority: 10,
		},
		...( getAddonActiveStatus( allAddons, 'instant-checkout' )
			? [
					{
						slug: 'instant-checkout',
						title: __( 'Instant Checkout', 'storeengine' ),
						subtitle: __(
							'One-page / 1-click / landing-page checkout',
							'storeengine'
						),
						icon: 'instant',
						priority: 20,
					},
			  ]
			: [] ),
		...( getAddonActiveStatus( allAddons, 'embeddable-checkout' )
			? [
					{
						slug: 'embeddable-checkout',
						title: __( 'Embeddable Checkout', 'storeengine' ),
						subtitle: __(
							'Embed Instant Checkout on external sites',
							'storeengine'
						),
						icon: 'embeddable',
						priority: 30,
					},
			  ]
			: [] ),
	];

	const abandonedCartTab = getAddonActiveStatus( allAddons, 'abandoned-cart' )
		? [
				{
					slug: 'abandoned-cart',
					title: __( 'Abandoned Cart & Checkout', 'storeengine' ),
					subtitle: __(
						'Manage recovery follow-up campaigns',
						'storeengine'
					),
					icon: 'cart-outline',
					className: 'advanced',
					priority: 35,
				},
		  ]
		: [];

	const proTabs = is_pro
		? [
				{
					slug: 'license',
					title: __( 'Manage License', 'storeengine' ),
					subtitle: __( 'Manage your store license', 'storeengine' ),
					icon: 'license',
					className: 'advanced',
					// Pinned to the very bottom of the nav with a highlighted look.
					highlight: true,
					priority: 9999,
				},
		  ]
		: [];

	return [
		{
			slug: 'general',
			icon: 'general',
			title: __( 'General', 'storeengine' ),
			subtitle: __(
				'Manage core settings and preferences',
				'storeengine'
			),
			className: 'general',
			priority: 10,
		},
		{
			slug: 'brand-and-style',
			icon: 'brand-style',
			title: __( 'Brand & style', 'storeengine' ),
			subtitle: __(
				`Define your store's visual identity`,
				'storeengine'
			),
			className: 'design',
			priority: 20,
		},
		{
			slug: 'products',
			icon: 'products',
			title: __( 'Products', 'storeengine' ),
			subtitle: __(
				'Manage product settings and inventory',
				'storeengine'
			),
			className: 'design',
			// Sits in the old "Catalog" group's slot: after Store (10),
			// before Cart & Checkout (30). Renders as a top-level nav item
			// (no longer grouped — see SETTINGS_GROUPS below).
			priority: 20,
		},
		{
			slug: 'product-form',
			icon: 'products',
			title: __( 'Product Form', 'storeengine' ),
			subtitle: __(
				'Simplify the product editor for your team',
				'storeengine'
			),
			className: 'design',
			priority: 21,
		},
		{
			slug: 'currencies',
			icon: 'price',
			title: __( 'Currencies', 'storeengine' ),
			subtitle: __( 'Multi-currency display settings', 'storeengine' ),
			className: 'currencies',
			priority: 32,
		},
		{
			slug: 'cart-and-checkout',
			icon: 'cart',
			title: __( 'Cart & Checkout', 'storeengine' ),
			subtitle: __( 'Configure checkout page behavior', 'storeengine' ),
			className: 'cart-checkout',
			priority: 33,
			children: cartCheckoutChildren, // ← nested children from file 1
		},
		...complianceTab,
		...catalogModeTab,
		...donationTab,
		...abandonedCartTab,
		{
			slug: 'shipping',
			icon: 'shipping',
			title: __( 'Shipping', 'storeengine' ),
			subtitle: __( 'Set up delivery zones and methods', 'storeengine' ),
			className: 'shipping',
			priority: 40,
		},
		{
			slug: 'payment-method',
			icon: 'payment',
			title: __( 'Payment method', 'storeengine' ),
			subtitle: __(
				'Configure your store payment options',
				'storeengine'
			),
			className: 'pages',
			priority: 50,
		},
		{
			slug: 'analytics',
			icon: 'analytics',
			title: __( 'Analytics', 'storeengine' ),
			subtitle: __(
				'Configure Google/Pixel Integrations',
				'storeengine'
			),
			className: 'pages',
			priority: 50,
		},
		{
			slug: 'geolocation',
			icon: 'location',
			title: __( 'Geolocation', 'storeengine' ),
			subtitle: __( 'Location-based taxes and rules', 'storeengine' ),
			className: 'pages',
			priority: 50,
		},
		...taxTab,
		...euVatTab,
		...seoTab,
		...aiTab,
		...couriersTab,
		...affiliateTab,
		...multiVendorTab,
		...emailTab,
		...invoiceTab,
		{
			slug: 'page-setup',
			title: __( 'Page setup', 'storeengine' ),
			subtitle: __(
				'Setup essential store and user pages',
				'storeengine'
			),
			icon: 'page',
			className: 'advanced',
			priority: 150,
		},
		...proTabs,
	];
};

// Settings groups — the single-column nav is organised into collapsible groups
// that mirror the main admin menu's vocabulary (Catalog, Payments, Shipping…).
// Each group lists its member tab slugs in display order; the group's landing
// page is its first available member. SettingsTabs renders these as expandable
// dropdowns. Any tab injected by an addon via the `storeengine.settings.tabs`
// filter that isn't listed here falls through as its own top-level nav item.
export const SETTINGS_GROUPS = [
	{ key: 'store', title: __( 'Store', 'storeengine' ), icon: 'general', priority: 10,
		order: [ 'general', 'brand-and-style', 'currencies', 'page-setup' ] },
	// Products group: the product settings page plus the Product Form editor
	// config, in Catalog's old slot right after Store. Catalog Mode (addon)
	// still surfaces as its own top-level item when active.
	{ key: 'products', title: __( 'Products', 'storeengine' ), icon: 'products', priority: 20,
		order: [ 'products', 'product-form' ] },
	{ key: 'checkout', title: __( 'Cart & Checkout', 'storeengine' ), icon: 'cart', priority: 30,
		order: [ 'cart-and-checkout', 'checkout-fields', 'instant-checkout', 'embeddable-checkout', 'compliance' ] },
	{ key: 'payments', title: __( 'Payments & Tax', 'storeengine' ), icon: 'payment', priority: 40,
		order: [ 'payment-method', 'tax', 'eu-vat', 'invoice' ] },
	{ key: 'shipping', title: __( 'Shipping', 'storeengine' ), icon: 'shipping', priority: 50,
		order: [ 'shipping', 'couriers', 'geolocation' ] },
	{ key: 'marketing', title: __( 'Marketing', 'storeengine' ), icon: 'analytics', priority: 60,
		order: [ 'affiliate', 'abandoned-cart', 'email', 'seo', 'analytics' ] },
	// The "Advanced" group is gone: Multi Vendor and AI are now their own
	// top-level nav items (they fall through, ungrouped, at their own tab
	// priorities — 72 and 74 — so they stay adjacent in Advanced's old slot,
	// right after Marketing).
];
