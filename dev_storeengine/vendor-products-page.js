/**
 * Vendor — My Products full-page React mount.
 *
 * Mounts a single React tree on `#storeengine-vendor-products-mount` that
 * owns:
 *   - the products table (via @Components/ListTable + redux state.products)
 *   - the Add/Edit modal (via @Components/Modal hosting AddProduct)
 *
 * Replaces the prior hybrid where PHP rendered the table and an inline
 * script bridged a separate React modal — one React tree is easier to
 * reason about and avoids cross-boundary state-sync bugs.
 */

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import store from './redux/store';
import VendorProducts from './containers/BackendDashboard/Pages/VendorProducts';
import '../assets/scss/backend.scss';
import '../assets/scss/admin-tailwind.scss';

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById(
		'storeengine-vendor-products-mount'
	);
	if ( ! container ) {
		return;
	}

	const root = createRoot( container );

	root.render(
		<Provider store={ store }>
			<Router
				basename={ window.location.pathname }
				future={ {
					v7_startTransition: true,
					v7_relativeSplatPath: false,
				} }
			>
				<div className="storeengine-admin storeengine-admin--vendor se-admin-tw">
					<VendorProducts />
				</div>
			</Router>
		</Provider>
	);
} );
