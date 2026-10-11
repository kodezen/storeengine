import React, { useState, useEffect, useRef } from 'react';
import TopBar from '@Components/TopBar';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { Form, Formik } from 'formik';
import SettingsSkeleton from '@Components/Loader/SettingsSkeleton';
import { getAddonActiveStatus } from '@Utils/helper';
import Pages, { getAddonPageFields } from './Tabs/Pages';
import Payments from './Tabs/Payments';
import SubTopBar from '@Components/SubTopBar';
import Button from '@Components/Button';
import { useDispatch, useSelector } from 'react-redux';
import {
	fetchSettings,
	updateSettings,
	updatePaymentsSettings,
	updateAffiliateSettings,
	updateEmailSettings,
	updateInvoiceSettings,
	updateMultiCurrencySettings,
	updateEuVatSettings,
} from '@Redux/Slices/settingsSlice/settingsSlice';
import { useLocationQuery } from '@Hooks';

// Tabs
import Products from './Tabs/Products';
import CatalogMode from './Tabs/CatalogMode';
import Donation from './Tabs/Donation';
import InstantCheckout from './Tabs/InstantCheckout';
import EmbeddableCheckout from './Tabs/EmbeddableCheckout';
import AbandonedCart from './Tabs/AbandonedCart';
import Email from './Tabs/Email';
import General from './Tabs/General';
import Shipping from './Tabs/Shipping';
import BrandAndStyle from './Tabs/BrandAndStyle';
import Affiliate from './Tabs/Affiliate';
import MultiVendor from './Tabs/MultiVendor';
import Taxes from './Tabs/Taxes';
import SettingsTabs from './SettingsTabs';
import Invoice from './Tabs/Invoice';
import CartAndCheckout from './Tabs/CartAndCheckout';
import Analytics from './Tabs/Analytics/index.js';
import Geolocation from './Tabs/Geolocation';
import Currencies from './Tabs/Currencies';
import Licence from './Tabs/Licence';

import EuVatSettingsTab from './Tabs/EuVat';
import SeoSettingsTab from './Tabs/Seo';
import AiSettingsTab from './Tabs/Ai';
import CouriersSettingsTab from './Tabs/Couriers';

// Built-in addon tabs. Pro/extension addons append their own tab components via
// the `storeengine.settings.addon_tab_components` filter (see e.g. the Dynamic
// Pricing addon's React registrar, and StoreEngine Pro's settings-tab
// registrars for POS, Suppliers, Returns, Couriers and Verification). Filter
// receives an object of slug→component.
const BUILTIN_ADDON_TAB_COMPONENTS = {
	'eu-vat': EuVatSettingsTab,
	seo: SeoSettingsTab,
	ai: AiSettingsTab,
	couriers: CouriersSettingsTab,
};

// `allAddons` is forwarded to the filter so addon registrars can gate a tab's
// component on the LIVE addon-active map (same source that drives the nav),
// rather than a page-load global. Without it, a tab enabled mid-session would
// appear in the nav but render the wrong component until reload.
const getAddonTabComponents = ( allAddons ) =>
	applyFilters(
		'storeengine.settings.addon_tab_components',
		{ ...BUILTIN_ADDON_TAB_COMPONENTS },
		allAddons
	);

import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import CheckoutFields from './Tabs/CheckoutFields';
import ProductForm from './Tabs/ProductForm';
import Compliance from './Tabs/Compliance';
import ScrollToField from './ScrollToField';
import { getTabs, SETTINGS_GROUPS } from './tabsConfig';

import './styles.scss';

// eslint-disable-next-line
/*global window */


// Section-merging is disabled: every settings tab now has its own nav entry
// (grouped below), matching how the main admin menu exposes explicit sub-items
// rather than folding them into a host page. Kept as an empty alias map so the
// deep-link / search path resolution below stays a no-op instead of a special
// case.
const MERGED_CHILD_TO_HOST = {};

// Every slug that exists (top-level + nested), regardless of merge — used for
// path validation so absorbed pages stay reachable (then aliased to the host).
const collectAllSlugs = ( tabs ) =>
	tabs.reduce( ( acc, t ) => {
		acc.push( t.slug );
		( t.children || [] ).forEach( ( c ) => {
			acc.push( ...collectAllSlugs( [ c ] ) );
		} );
		return acc;
	}, [] );


// Recursively collect every leaf tab. A former parent (e.g. Cart & Checkout) is
// also emitted as a leaf, minus its `children`, so it becomes its own page and
// its old sub-tabs become sibling group members.
const flattenAllTabs = ( tabs ) =>
	tabs.reduce( ( out, tab ) => {
		const { children, ...rest } = tab;
		out.push( rest );
		( children || [] ).forEach( ( child ) =>
			out.push( ...flattenAllTabs( [ child ] ) )
		);
		return out;
	}, [] );

const byPriority = ( a, b ) => ( a.priority || 0 ) - ( b.priority || 0 );

/**
 * Build the grouped nav from the (addon-filtered) tab list. Only tabs actually
 * present (addon active) become group children; empty groups are dropped. Tabs
 * not assigned to any group are appended as their own top-level items so
 * addon-injected tabs never disappear.
 *
 * @param {Array} tabs
 * @return {Array} group parents (with `children`) followed by any leftovers
 */
const buildGroupedTabs = ( tabs ) => {
	const leaves = flattenAllTabs( tabs );
	const placed = new Set();
	const groups = [];

	SETTINGS_GROUPS.forEach( ( def ) => {
		const children = def.order
			.map( ( slug ) => leaves.find( ( leaf ) => leaf.slug === slug ) )
			.filter( Boolean );
		if ( ! children.length ) {
			return;
		}
		// Re-index priority to the SETTINGS_GROUPS order so SettingsTabs (which
		// sorts children by priority) keeps the intended sequence inside the group.
		const ordered = children.map( ( child, index ) => ( {
			...child,
			priority: index,
		} ) );
		ordered.forEach( ( child ) => placed.add( child.slug ) );
		groups.push( {
			slug: `group-${ def.key }`,
			title: def.title,
			icon: def.icon,
			isGroup: true,
			landing: ordered[ 0 ].slug,
			priority: def.priority,
			children: ordered,
		} );
	} );

	const extras = leaves.filter( ( leaf ) => ! placed.has( leaf.slug ) );

	return [ ...groups.sort( byPriority ), ...extras.sort( byPriority ) ];
};

const Settings = () => {
	const [ path, setPath ] = useState( null );
	const [ settingsLoading, setSettingsLoading ] = useState( false );
	const tabSaveFnRef = useRef( null );
	const [ hasTabSave, setHasTabSave ] = useState( false );
	const [ tabSaving, setTabSaving ] = useState( false );
	const [ hasTabChanges, setHasTabChanges ] = useState( false );
	const settings = useSelector( ( state ) => state.settings );
	const allAddons = useSelector( ( state ) => state.addons );
	const dispatch = useDispatch();
	const location = useLocationQuery();

	// Extension point: pro/extension addons can append settings tab entries via
	// the `storeengine.settings.tabs` filter (paired with
	// `storeengine.settings.addon_tab_components` for the rendered component).
	const tabs = React.useMemo(
		() =>
			applyFilters(
				'storeengine.settings.tabs',
				getTabs( allAddons, window.StoreEngineGlobal ),
				allAddons,
				window.StoreEngineGlobal
			),
		[ allAddons, window.StoreEngineGlobal ]
	);

	// Grouped nav: tabs organised into collapsible groups (SETTINGS_GROUPS) that
	// mirror the main admin menu. `tabs` still drives search and path validation.
	const groupedTabs = React.useMemo(
		() => buildGroupedTabs( tabs ),
		[ tabs ]
	);

	const addonTabComponents = React.useMemo(
		() => getAddonTabComponents( allAddons ),
		[ allAddons ]
	);

	// Collect all valid slugs including nested children for path validation.
	const allSlugs = React.useMemo( () => {
		return tabs.reduce( ( acc, t ) => {
			acc.push( t.slug );
			if ( Array.isArray( t.children ) ) {
				t.children.forEach( ( c ) => acc.push( c.slug ) );
			}
			return acc;
		}, [] );
	}, [ tabs ] );

	const isAddonTab = React.useCallback(
		( slug ) => Boolean( addonTabComponents[ slug ] ),
		[ addonTabComponents ]
	);
	// Every tab now has its own page, so the path resolves to itself
	// (MERGED_CHILD_TO_HOST is an empty no-op alias map kept for compatibility).
	const rawPath = location.getValue( 'path', 'general', allSlugs );
	const currentPath = MERGED_CHILD_TO_HOST[ rawPath ] || rawPath;


	useEffect( () => {
		setPath( currentPath );
	}, [ currentPath ] );

	useEffect( () => {
		// Do NOT reset tabSaveFnRef or hasTabSave here.
		// React runs parent update effects AFTER child mount effects, so resetting
		// them here clobbers whatever the new tab just registered — making the
		// top-bar Save button invisible (hasTabSave) or a no-op (tabSaveFnRef).
		// The tab's own cleanup (return () => onRegisterSave?.(null)) handles both
		// when it unmounts, which always runs before the new tab's mount effect.
		setTabSaving( false );
		setHasTabChanges( false );
	}, [ path ] );

	useEffect( () => {
		( async () => {
			if ( ! settings?.data ) {
				setSettingsLoading( true );
				await dispatch( fetchSettings() );
				setSettingsLoading( false );
			}
		} )();
	}, [ settings ] );

	const onSubmitHandler = async ( values, actions ) => {
		actions.setSubmitting( true );
		// Skips the closing fetchSettings() below only when a rejected save
		// (see the base_settings branch) would otherwise reinitialize the form
		// back to the still-unfixed server state, forcing the admin to redo
		// every change just to fix the one field the error pointed at.
		let skipRefetch = false;

		if ( path === 'eu-vat' ) {
			await dispatch( updateEuVatSettings( values.eu_vat ) );
			await dispatch( fetchSettings() );
			actions.setSubmitting( false );
			return;
		}

		if ( isAddonTab( path ) ) {
			actions.setSubmitting( false );
			return;
		}

		if ( 'payment-method' === path ) {
			await dispatch( updatePaymentsSettings( values.payments ) );
		} else if ( 'currencies' === path ) {
			const {
				store_currency,
				store_currency_position,
				store_currency_thousand_separator,
				store_currency_decimal_separator,
				store_currency_decimal_limit,
			} = values;

			await dispatch( updateSettings( { values } ) );
			await dispatch(
				updateMultiCurrencySettings( { ...values.multi_currency } )
			);
		} else if ( 'affiliate' === path ) {
			await dispatch(
				updateAffiliateSettings( { ...values.affiliate } )
			);
		} else if ( path === 'email' ) {
			await dispatch(
				updateEmailSettings( {
					values: { ...values.email },
					action: 'save_email_settings',
				} )
			);
		} else if ( path === 'invoice' ) {
			const updatedInvoice = {
				...values.invoice,
				invoice_mail_attachment: Array.isArray(
					values.invoice.invoice_mail_attachment
				)
					? values.invoice.invoice_mail_attachment.join( ',' )
					: values.invoice.invoice_mail_attachment,
			};
			await dispatch(
				updateInvoiceSettings( {
					values: updatedInvoice,
					action: 'update_settings',
				} )
			);
		} else {
			const {
				store_name,
				store_email,
				store_currency,
				store_currency_position,
				store_currency_thousand_separator,
				store_currency_decimal_separator,
				store_currency_decimal_limit,
				store_country,
				store_address_1,
				store_address_2,
				store_city,
				store_state,
				store_postcode,
				store_logo,
				global_primary_color,
				global_secondary_color,
				global_text_color,
				global_subtitle_color,
				global_input_text_color,
				global_background_color,
				global_placeholder_color,
				global_border_color,
				auth_redirect_type,
				auth_redirect_url,
				enable_direct_checkout,
				hide_quantity_selector = false,
				hide_add_to_cart = false,
				enable_product_reviews,
				enable_product_comments,
				review_permission = 'completed_order',
				review_media_max = 5,
				review_approval = 'auto',
				enable_faqs = true,
				faq_mode = 'global',
				enable_related_products,
				enable_product_tax,
				catalog_mode,
				instant_checkout,
				embeddable_checkout,
				checkout_fields,
				product_form,
				product_archive_sidebar_position,
				product_archive_filters,
				product_archive_products_per_row,
				product_archive_products_per_page,
				product_archive_multi_price_display,
				product_single_price_display,
				default_product_shipping_type,
				single_product_gallery_layout,
				product_archive_card_carousel,
				product_archive_card_swatches,
				product_archive_quick_view,
				quick_view_position,
				quick_view_animation,
				enable_recently_viewed,
				enable_size_guide,
				enable_product_compare,
				enable_wishlist,
				product_archive_products_order,
				shop_page,
				cart_page,
				checkout_page,
				thankyou_page,
				dashboard_page,
				maxmind_license = '',
				default_customer_address = '',
				enable_caching_support = false,
				// Selling / Shipping locations (Woo-parity)
				allowed_countries = 'all',
				all_except_countries = [],
				specific_allowed_countries = [],
				ship_to_countries = '',
				specific_ship_to_countries = [],
				// Tax
				prices_include_tax = false,
				tax_based_on = 'shipping',
				shipping_tax_class = '',
				tax_round_at_subtotal = false,
				tax_classes = '',
				tax_display_shop = 'excl',
				tax_display_cart = 'excl',
				price_display_suffix = '',
				tax_total_display = 'itemized',
				enable_stripe_tax = false,
				stripe_tax_default_code = 'txcd_99999999',
				stripe_tax_shipping_code = 'txcd_92010001',
				stripe_tax_fallback_to_local = false,
				checkout_default_country = '',
				enable_floating_cart = true,
				auto_open_cart_drawer = false,
				sticky_add_to_cart = true,
				enable_after_purchase_redirect = false,
				// SKU & Barcode auto-generation
				auto_generate_sku = false,
				sku_pattern = '{category}-{number}',
				sku_number_padding = 4,
				auto_generate_barcode = false,
				barcode_ean_prefix = '20',
				abandoned_cart,
				analytics,
				// EU/German compliance
				place_order_button_text = '',
				compliance_vat_breakdown = true,
				compliance_legal_docs = {},
				compliance_consent_checkboxes = [],
			} = values;

			const base_settings = {
				store_name,
				store_email,
				store_currency,
				store_currency_position,
				store_currency_thousand_separator,
				store_currency_decimal_separator,
				store_currency_decimal_limit,
				store_country,
				store_address_1,
				store_address_2,
				store_city,
				store_state,
				store_postcode,
				store_logo,
				global_primary_color,
				global_secondary_color,
				global_text_color,
				global_subtitle_color,
				global_input_text_color,
				global_border_color,
				global_background_color,
				global_placeholder_color,
				auth_redirect_type,
				auth_redirect_url,
				enable_direct_checkout,
				hide_quantity_selector,
				hide_add_to_cart,
				enable_product_reviews,
				enable_product_comments,
				review_permission,
				review_media_max,
				review_approval,
				enable_faqs,
				faq_mode,
				enable_related_products,
				enable_product_tax,
				catalog_mode,
				instant_checkout,
				embeddable_checkout,
				checkout_fields,
				product_form,
				product_archive_sidebar_position,
				product_archive_filters,
				product_archive_products_per_row,
				product_archive_products_per_page,
				product_archive_multi_price_display,
				product_single_price_display,
				default_product_shipping_type,
				single_product_gallery_layout,
				product_archive_card_carousel,
				product_archive_card_swatches,
				product_archive_quick_view,
				quick_view_position,
				quick_view_animation,
				enable_recently_viewed,
				enable_size_guide,
				enable_product_compare,
				enable_wishlist,
				product_archive_products_order,
				shop_page,
				cart_page,
				checkout_page,
				thankyou_page,
				dashboard_page,
				maxmind_license,
				default_customer_address,
				enable_caching_support,
				// Selling / Shipping locations (Woo-parity).
				// The explicit-whitelist payload shape means a new
				// settings key won't persist unless it's listed here
				// AND in `update_base_settings` schema (ajax/settings.php)
				// AND in base.php defaults.
				allowed_countries,
				all_except_countries,
				specific_allowed_countries,
				ship_to_countries,
				specific_ship_to_countries,
				// Tax
				prices_include_tax,
				tax_based_on,
				shipping_tax_class,
				tax_round_at_subtotal,
				tax_classes,
				tax_display_shop,
				tax_display_cart,
				price_display_suffix,
				tax_total_display,
				enable_stripe_tax,
				stripe_tax_default_code,
				stripe_tax_shipping_code,
				stripe_tax_fallback_to_local,
				checkout_default_country,
				enable_floating_cart,
				auto_open_cart_drawer,
				sticky_add_to_cart,
				enable_after_purchase_redirect,
				// SKU & Barcode auto-generation
				auto_generate_sku,
				sku_pattern,
				sku_number_padding,
				auto_generate_barcode,
				barcode_ean_prefix,
				abandoned_cart,
				analytics,
				// EU/German compliance
				place_order_button_text,
				compliance_vat_breakdown,
				compliance_legal_docs,
				compliance_consent_checkboxes,
			};

			if ( getAddonActiveStatus( allAddons, 'membership' ) ) {
				base_settings.membership_pricing_page =
					values.membership_pricing_page;
			}

			if ( getAddonActiveStatus( allAddons, 'affiliate' ) ) {
				base_settings.affiliate_registration_page =
					values.affiliate_registration_page;
			}

			// Page selectors contributed by addons (see the Pages tab). Saved
			// generically so a new addon page needs no change here.
			getAddonPageFields().forEach( ( field ) => {
				if (
					( ! field.addon ||
						getAddonActiveStatus( allAddons, field.addon ) ) &&
					undefined !== values[ field.name ]
				) {
					base_settings[ field.name ] = values[ field.name ];
				}
			} );

			if ( getAddonActiveStatus( allAddons, 'invoice' ) ) {
				base_settings.invoice = {
					...values.invoice,
					invoice_mail_attachment: Array.isArray(
						values.invoice.invoice_mail_attachment
					)
						? values.invoice.invoice_mail_attachment.join( ',' )
						: values.invoice.invoice_mail_attachment,
				};
			}

			if ( getAddonActiveStatus( allAddons, 'donation' ) ) {
				base_settings.donation = values.donation;
			}

			const result = await dispatch(
				updateSettings( { values: base_settings } )
			);
			// A server-side validation error (e.g. a Product Form rule such as
			// "hidden field needs a default value") makes updateSettings reject.
			// It already shows its own error toast; showing "saved successfully"
			// on top of that used to tell the admin their rejected, unsaved
			// change had gone through.
			if ( updateSettings.fulfilled.match( result ) ) {
				dispatch(
					showNotification( {
						message: __(
							'Settings saved successfully.',
							'storeengine'
						),
						isShow: true,
						type: 'success',
					} )
				);
			} else {
				skipRefetch = true;
			}
		}

		if ( ! skipRefetch ) {
			await dispatch( fetchSettings() );
		}
		actions.setSubmitting( false );
	};

	const renderSwitch = ( renderPath ) => {
		const AddonTabComponent = addonTabComponents[ renderPath ];
		if ( AddonTabComponent ) {
			return (
				<AddonTabComponent
					onRegisterSave={ ( fn ) => {
						tabSaveFnRef.current = fn;
						setHasTabSave( !! fn );
					} }
					onSavingChange={ setTabSaving }
					onDirtyChange={ setHasTabChanges }
				/>
			);
		}

		switch ( renderPath ) {
			case 'brand-and-style':
				return <BrandAndStyle />;
			case 'products':
				return <Products />;
			case 'catalog-mode':
				return <CatalogMode />;
			case 'donation':
				return <Donation />;
			case 'currencies':
				return <Currencies />;
			case 'page-setup':
				return <Pages />;
			case 'cart-and-checkout':
				return <CartAndCheckout />;
			case 'checkout-fields':
				return <CheckoutFields />;
			case 'product-form':
				return <ProductForm />;
			case 'instant-checkout':
				return <InstantCheckout />;
			case 'embeddable-checkout':
				return <EmbeddableCheckout />;
			case 'compliance':
				return <Compliance />;
			case 'abandoned-cart':
				return <AbandonedCart />;
			case 'affiliate':
				return <Affiliate />;
			case 'multi-vendor':
				return (
					<MultiVendor
						onRegisterSave={ ( fn ) => {
							tabSaveFnRef.current = fn;
							setHasTabSave( !! fn );
						} }
						onSavingChange={ setTabSaving }
						onDirtyChange={ setHasTabChanges }
					/>
				);
			case 'tax':
				return <Taxes />;
			case 'shipping':
				return <Shipping />;
			case 'geolocation':
				return <Geolocation />;
			case 'payment-method':
				return <Payments />;
			case 'analytics':
				return <Analytics />;
			case 'email':
				return <Email />;
			case 'invoice':
				return <Invoice />;
			case 'license':
				return <Licence />;
			case 'general':
			default:
				return <General />;
		}
	};

	const handleInitialValues = () => {
		const { payment_gateways = [], ...initialValues } =
			settings?.data || {};
		initialValues.payments = {};
		payment_gateways.map( ( { id, settings } ) => {
			initialValues.payments[ id ] = settings;
		} );
		return initialValues;
	};

	return (
		<Formik
			enableReinitialize={ true }
			initialValues={ { ...handleInitialValues() } }
			onSubmit={ onSubmitHandler }
		>
			{ ( { handleSubmit, dirty, isSubmitting } ) => {
				return (
					<Form>
						<TopBar
							title={ __( 'Settings', 'storeengine' ) }
							render={ () => {
								if ( isAddonTab( path ) && path !== 'eu-vat' && ! hasTabSave ) {
									return null;
								}
								return (
									<Button
										type={ hasTabSave ? 'button' : 'submit' }
										onClick={ hasTabSave ? () => tabSaveFnRef.current?.() : handleSubmit }
										label={ __( 'Save', 'storeengine' ) }
										isDisabled={ hasTabSave ? ! hasTabChanges : ! dirty }
										isLoading={ hasTabSave ? tabSaving : isSubmitting }
									/>
								);
							} }
						/>

						<SubTopBar
							heading={ __( 'Settings', 'storeengine' ) }
						/>

						<div className="storeengine-settings storeengine-page-content">
							<div className="storeengine-page-content--settings">
								<div className="storeengine-tab-panel">
									<SettingsTabs
										tabs={ groupedTabs }
										path={ path }
										setPath={ setPath }
										validSlugs={ allSlugs }
										aliasMap={ MERGED_CHILD_TO_HOST }
									/>
								</div>

								<div className="storeengine-tab-panel-content">
									{ ! settingsLoading ? (
										<div
											key={ path }
											className="storeengine-fade-in"
										>
											<ScrollToField
												path={ path }
												settingsReady={
													!! settings?.data
												}
											/>
											{ renderSwitch( path ) }
										</div>
									) : (
										<SettingsSkeleton />
									) }
								</div>
							</div>
						</div>
					</Form>
				);
			} }
		</Formik>
	);
};

export default Settings;
