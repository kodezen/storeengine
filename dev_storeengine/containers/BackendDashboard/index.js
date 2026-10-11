import React, { useEffect, useMemo } from 'react';
import { applyFilters } from '@wordpress/hooks';
import { useLocationQuery } from '@Hooks';
import ScreenMeta from '@Components/ScreenMeta';

import Products from './Pages/Products';
import Orders from './Pages/Orders';
import OrderEditor from './Pages/Orders/OrderEditor';
import Attributes from './Pages/Attributes';
import Tag from './Pages/Tag';
import Coupons from './Pages/Coupons';
import Customers from './Pages/Customers';
import Settings from './Pages/Settings';
import Dashboard from './Pages/Dashboard';
import Notification from '@Components/Notification';
import Category from './Pages/Category';
import Brands from './Pages/Brands';
import Reviews from './Pages/Reviews';
import Faqs from './Pages/Faqs';
import SizeCharts from './Pages/SizeCharts';
import CreateCoupon from './Pages/Coupons/CreateCoupon';
import AddProduct from './Pages/Products/AddProduct';
import ProductAnalytics from './Pages/Products/ProductAnalytics';
import ProductAnalyticsList from './Pages/Products/ProductAnalytics/List';
import Tools from './Pages/Tools';
import Addons from './Pages/Addons';
import Payments from './Pages/Payments';
import UpdateSubscriptions from './Pages/Subscriptions/UpdateSubscriptions/index';
import Subscriptions from './Pages/Subscriptions';
import EditCustomer from './Pages/Customers/EditCustomer';
import Affiliate from './Pages/Affiliate';
import Clicks from './Pages/Affiliate/Clicks';
import Commissions from './Pages/Affiliate/Commissions';
import Payouts from './Pages/Affiliate/Payouts';
import AccessGroup from './Pages/AccessGroup';
import AccessGroupCreate from './Pages/AccessGroup/AccessGroupCreate';
import Members from './Pages/Members';
import MembershipAnalytics from './Pages/Members/Analytics';
import ScrollToTop from '../../components/ScrollToTop';
import Webhooks from './Pages/Webhooks';
import AdminNotices from '@Components/AdminNotices';
import LicenseNotice from '@Components/LicenseNotice';
import Logs from './Pages/Logs';
import Inventory from './Pages/Inventory';
import Couriers from './Pages/Couriers';
import Vendors from './Pages/Vendors';
import VendorDetails from './Pages/Vendors/VendorDetails';
import VendorWithdrawals from './Pages/VendorWithdrawals';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings } from '@Redux/Slices/settingsSlice/settingsSlice';
import { isAddonActive } from '@Utils/helper';

export default function BackendDashboard() {
	const query = useLocationQuery();
	const settings = useSelector( ( state ) => state.settings.data );
	// Live addon-active map from the Redux store. Unlike isAddonActive() (which
	// reads the static window.StoreEngineGlobal snapshot captured at page load),
	// this reflects toggles made in the Addons SPA without a reload — so a brand
	// route resolved right after enabling the addon renders <Brands />, not the
	// <Products /> fallback.
	const activeAddons = useSelector( ( state ) => state.addons );
	const isBrandActive = !! activeAddons?.brand;
	const dispatch = useDispatch();

	// Page registry: extensions (e.g. StoreEngine Pro) register admin pages by
	// `?page=` slug via the `storeengine.admin.pages` filter. Mirrors the
	// `storeengine.settings.addon_tab_components` object-map convention. Each
	// entry is either a render fn `({ id, action, path, query }) => ReactNode`,
	// or `{ render, stableTransitionKey }`.
	const pageRegistry = useMemo(
		() => applyFilters( 'storeengine.admin.pages', {} ),
		[]
	);

	// Resolve a registry entry for `key` and render it, or hand off to the
	// upsell fallback when no extension registered the route.
	const renderRegisteredPage = ( key, { id, action, path } ) => {
		const entry = pageRegistry[ key ];
		const render = 'function' === typeof entry ? entry : entry?.render;
		if ( render ) {
			return render( { id, action, path, query } );
		}
		return applyFilters( 'storeengine.admin.fallback_page', null, {
			page: key,
			id,
			action,
			path,
		} );
	};

	useEffect( () => {
		if ( ! settings ) {
			dispatch( fetchSettings() );
		}
	}, [ settings ] );

	const renderSwitch = ( page, id, action, path ) => {
		switch ( page ) {
			case 'storeengine':
				return <Dashboard />;
			// Raw-route taxonomy/attribute pages (folded under the Products
			// group in the sidebar).
			case 'storeengine-category':
				return <Category />;
			case 'storeengine-tags':
				return <Tag />;
			case 'storeengine-attributes':
				return <Attributes />;
			case 'storeengine-brands':
				return isBrandActive ? <Brands /> : <Products />;
			case 'storeengine-reviews':
				return <Reviews />;
			case 'storeengine-faqs':
				return <Faqs />;
			case 'storeengine-size-charts':
				return <SizeCharts />;
			case 'storeengine-products':
				if ( 'analytics' === path ) {
					return id ? (
						<ProductAnalytics id={ id } />
					) : (
						<ProductAnalyticsList />
					);
				}
				if ( id || action ) {
					return <AddProduct id={ id } />;
				} else if ( 'category' === path ) {
					// Legacy ?path= fallback — kept so any un-migrated internal
					// link still resolves.
					return <Category />;
				} else if ( 'brands' === path && isBrandActive ) {
					return <Brands />;
				} else if ( 'tags' === path ) {
					return <Tag />;
				} else if ( 'attributes' === path ) {
					return <Attributes />;
				}
				return <Products />;
			case 'storeengine-orders':
				if ( ! path && ( id || action ) ) {
					return <OrderEditor ID={ id } />;
				} else if ( path ) {
					// Sub-routes of Orders (e.g. Abandoned Carts) may be
					// supplied by extensions via the `storeengine.admin.pages`
					// filter using a `slug/subpath` key.
					return renderRegisteredPage(
						`storeengine-orders/${ path }`,
						{ id, action, path }
					);
				}
				return <Orders />;
			case 'storeengine-coupons':
				if ( id || action ) {
					return <CreateCoupon id={ id } />;
				}
				return <Coupons />;
			case 'storeengine-customers':
				if ( id || action ) {
					return <EditCustomer ID={ id } />;
				}
				return <Customers />;
			case 'storeengine-payments':
				return <Payments />;
			case 'storeengine-subscriptions':
				if ( id || action ) {
					return <UpdateSubscriptions id={ id } />;
				}
				return <Subscriptions />;
			case 'storeengine-logs':
				return <Logs />;
			case 'storeengine-addons':
				return <Addons />;
			case 'storeengine-vendors':
				if ( id ) {
					return <VendorDetails id={ id } />;
				}
				return <Vendors />;
			case 'storeengine-vendor-withdrawals':
				return <VendorWithdrawals />;
			case 'storeengine-withdrawals':
				if ( 'affiliate' === path ) {
					return <Payouts />;
				}
				// The shared "Withdrawals" menu is also shown when only the
				// affiliate addon is active (multi-vendor off). In that case
				// there is no vendor sub-item, so land on affiliate Payouts
				// instead of the (unavailable) vendor withdrawals screen.
				if ( ! isAddonActive( 'multi-vendor' ) ) {
					return <Payouts />;
				}
				return <VendorWithdrawals />;
			case 'storeengine-tools':
				return <Tools />;
			case 'storeengine-settings':
				return <Settings />;
			case 'storeengine-affiliates':
				if ( 'clicks' === path ) {
					return <Clicks />;
				} else if ( 'commissions' === path ) {
					return <Commissions />;
				}
				return <Affiliate />;
			case 'storeengine-webhooks':
				return <Webhooks />;
			case 'storeengine-membership-rules':
				if ( id || action ) {
					return <AccessGroupCreate id={ id } action={ action } />;
				}
				return <AccessGroup />;
			case 'storeengine-membership-members':
				return <Members />;
			case 'storeengine-membership-analytics':
				return <MembershipAnalytics />;
			case 'storeengine-inventory':
				return <Inventory />;
			case 'storeengine-couriers':
				return <Couriers />;
			default:
				// Fall through to extension-registered pages (StoreEngine Pro
				// etc.), then to the upsell fallback for known-but-unregistered
				// Pro slugs on a free-only install.
				return renderRegisteredPage( page, { id, action, path } );
		}
	};

	const page = query.getValue( 'page', null, null, 'string' );
	const path = query.getValue( 'path', null, null, 'string' );
	const id = query.getValue( 'id', null, null, 'id' );
	const action = query.getValue( 'action', null, null, 'string' );

	let transitionKey = `${ page }-${ path }-${ id }-${ action }`;

	const registryEntry = pageRegistry[ page ];
	const registryWantsStableKey =
		registryEntry &&
		'object' === typeof registryEntry &&
		registryEntry.stableTransitionKey;

	if (
		page === 'storeengine-settings' ||
		page === 'storeengine-tools' ||
		registryWantsStableKey ||
		( page === 'storeengine-products' && ( id || action ) ) ||
		// Keep the access-group editor mounted across the create→edit
		// transition so submitting the "new group" modal re-renders in place
		// instead of remounting (which read as a full-page reload).
		( page === 'storeengine-membership-rules' && ( id || action ) )
	) {
		transitionKey = page;
	}

	return (
		<>
			<ScreenMeta />
			<AdminNotices />
			<LicenseNotice />
			<Notification />
			<div className="storeengine-page-transition" key={ transitionKey }>
				{ renderSwitch( page, id, action, path ) }
			</div>
		</>
	);
}
