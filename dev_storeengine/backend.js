import { createRoot } from 'react-dom/client';
import { createPortal, createElement } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import BackendDashboard from './containers/BackendDashboard';
import AdminMenu from './containers/BackendDashboard/AdminMenu';
import ProFeatureUpsell from './components/ProFeatureUpsell';
// Funnel Builder addon: registers its admin pages via the
// `storeengine.admin.pages` filter (imported for side effect).
import './containers/BackendDashboard/Pages/Funnels/registerFunnelPages';
import './containers/BackendDashboard/Pages/Donations/registerDonationPages';
// Couriers addon: the order-editor shipments section. OrderShipments returns
// null when the couriers addon is inactive, so this is a no-op unless enabled.
import OrderShipments from './containers/BackendDashboard/Pages/Couriers/OrderShipments';
import * as ReactRedux from 'react-redux';
import * as ReactRouterDOM from 'react-router-dom';
import * as Formik from 'formik';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import store from './redux/store';
import ProductPricePicker from './containers/BackendDashboard/Pages/Coupons/CreateCoupon/Options/ProductPricePicker';

// Expose the core's react-redux and react-router-dom module instances so the
// StoreEngine Pro bundle can reuse them (it externalizes these — see
// storeengine-pro/webpack.config.js). React context is module-scoped: the
// Redux <Provider> and React Router live in THIS bundle, so Pro pages rendered
// into our tree (via the `storeengine.admin.pages` etc. filters) must consume
// the SAME instances or their useSelector/useDispatch/useLocation hooks would
// see an empty context and crash. Assigned at module scope so it is ready
// before Pro's script (which depends on `storeengine-admin-scripts`) runs.
window.StoreEngineReactRedux = ReactRedux;
window.StoreEngineReactRouterDOM = ReactRouterDOM;
// Share the core's formik instance too. Pro modals reuse the core's
// ReactModalFormik (via the @Components alias) whose <Formik> provider lives in
// THIS bundle's formik copy, while Pro's modal-inner components call
// useFormikContext(). React context is module-scoped, so unless both sides use
// the SAME formik module the inner components read an empty context and crash
// ("Cannot destructure property 'values' of useFormikContext(...) as it is
// undefined"). Pro externalizes `formik` to this global — see
// storeengine-pro/webpack.config.js.
window.StoreEngineFormik = Formik;

// Coupon-editor building blocks shared with add-ons that contribute their own
// coupon fields (Pro's Buy X Get Y reuses the product/price repeater rather than
// shipping a second copy). Same reasoning as above: the picker calls
// useFormikContext() and useSelector(), so it must be THIS bundle's component
// bound to THIS bundle's contexts. Pro externalizes it — see
// storeengine-pro/webpack.config.js.
window.StoreEngineCouponComponents = { ProductPricePicker };

import '../assets/scss/backend.scss';
import '../assets/scss/admin-tailwind.scss';

// Inject the courier shipments section into the order editor, below the
// billing/shipping addresses, via the `storeengine.order_editor.after_addresses`
// filter (see FormInner.js). Now that Couriers ships with core, the injection
// lives here rather than in Pro. OrderShipments self-gates on the couriers
// addon, rendering nothing when it's inactive.
addFilter(
	'storeengine.order_editor.after_addresses',
	'storeengine/order-shipments',
	( node, ctx = {} ) =>
		createElement( OrderShipments, {
			key: 'storeengine-order-shipments',
			orderId: ctx.orderId,
		} )
);

// Default fallback for Pro-only page slugs when StoreEngine Pro is not active.
// Pro overrides individual slugs via the `storeengine.admin.pages` filter; this
// only renders when a Pro slug is reached (e.g. a stale URL) without Pro.
addFilter(
	'storeengine.admin.fallback_page',
	'storeengine/pro-feature-upsell',
	( node, ctx = {} ) => {
		if ( ! ctx.page || ! String( ctx.page ).startsWith( 'storeengine-' ) ) {
			return node;
		}
		return createElement( ProFeatureUpsell, { page: ctx.page } );
	}
);

document.addEventListener( 'DOMContentLoaded', function () {
	const container = document.getElementById( 'storeengine-admin' );
	if ( container ) {
		const root = createRoot( container );
		const menuPage = document.getElementById( 'toplevel_page_storeengine' );
		function MenuPortal( { children } ) {
			menuPage.innerHTML = '';
			return createPortal( children, menuPage );
		}
		root.render(
			<Provider store={ store }>
				<Router
					future={ {
						v7_startTransition: true,
						v7_relativeSplatPath: false,
					} }
				>
					<MenuPortal>
						<AdminMenu />
					</MenuPortal>
					<BackendDashboard />
				</Router>
			</Provider>
		);
	}
} );
