/**
 * Vendor Product Editor — frontend dashboard mount.
 *
 * Two ways to use this bundle:
 *
 *   1. Standalone page (vendor-product-edit endpoint) — the bundle
 *      auto-mounts to `#storeengine-vendor-product-editor` on DOMContentLoaded
 *      reading the product id and redirect URL from data attributes.
 *
 *   2. Modal host (vendor-products endpoint) — the bundle exposes
 *      `window.StoreEngineVendorProductEditor.mount(container, opts)` and
 *      `unmount(container)`. The host page calls these when its Add/Edit
 *      trigger fires.
 *
 * The React component itself (AddProduct in mode='vendor') is shared between
 * the admin product editor and this vendor flow.
 */

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import store from './redux/store';
import AddProduct from './containers/BackendDashboard/Pages/Products/AddProduct';
import '../assets/scss/backend.scss';
import '../assets/scss/admin-tailwind.scss';

const LOG = '[storeengine-vendor-editor]';
// eslint-disable-next-line no-console

// Tracks active roots keyed by container element so unmount() can find the
// matching root to dispose. WeakMap so detached containers GC cleanly.
const activeRoots = new WeakMap();

function renderInto( container, opts ) {
	const productId = opts.productId | 0;
	const handleSaved = function ( data ) {

		if ( typeof opts.onSaved === 'function' ) {
			opts.onSaved( data );
			return;
		}

		// Default: after the first create, swap to edit mode by reloading
		// with the new id so the URL is shareable. Updates stay in place.
		// Modal hosts override this via opts.onSaved.
		if ( data && data.id && ! productId ) {
			const target = container.getAttribute( 'data-edit-url-template' );
			if ( target ) {
				window.location.href = target.replace(
					'__ID__',
					String( data.id )
				);
			}
		}
	};

	// Re-use the existing root if we're remounting into the same container
	// (e.g. user opened modal a second time with a different product). React
	// 18 disallows creating two roots on the same DOM node.
	let root = activeRoots.get( container );
	if ( ! root ) {
		root = createRoot( container );
		activeRoots.set( container, root );
	}

	root.render(
		<Provider store={ store }>
			<Router
				future={ {
					v7_startTransition: true,
					v7_relativeSplatPath: false,
				} }
			>
				<div className="storeengine-admin storeengine-admin--vendor">
					<AddProduct
						id={ productId || undefined }
						mode="vendor"
						onSaved={ handleSaved }
					/>
				</div>
			</Router>
		</Provider>
	);

	return root;
}

function unmountFrom( container ) {
	const root = activeRoots.get( container );
	if ( ! root ) {
		return;
	}
	root.unmount();
	activeRoots.delete( container );
}

// Public API used by the modal host on the vendor-products page.
window.StoreEngineVendorProductEditor = {
	mount( container, opts = {} ) {
		// eslint-disable-next-line no-console
		if ( ! container ) {
			// eslint-disable-next-line no-console
			console.warn( LOG, 'mount() received no container' );
			return;
		}
		return renderInto( container, opts );
	},
	unmount( container ) {
		// eslint-disable-next-line no-console
		if ( ! container ) {
			return;
		}
		unmountFrom( container );
	},
};

// eslint-disable-next-line no-console

// Standalone page mount — runs once on first load, ignored if the host
// container isn't on the page (e.g. on vendor-products which uses the
// modal API instead).
document.addEventListener( 'DOMContentLoaded', function () {
	const container = document.getElementById(
		'storeengine-vendor-product-editor'
	);
	if ( ! container ) {
		return;
	}

	const productId =
		parseInt( container.getAttribute( 'data-product-id' ), 10 ) || 0;

	renderInto( container, { productId } );
} );
