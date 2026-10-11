import { API, StoreEngineDQ } from '@Utils/helper';
import { doActionAsync } from '@wordpress/hooks';

const REST_BASE = 'storeengine/v1/cart/order-bumps';

// The change handler is document-delegated, so a single binding covers every
// surface (cart + checkout). Guard against double-binding since both the
// CheckoutManager and the cart/frontend entry call OrderBumps().
let bound = false;

/**
 * Storefront order-bump checkbox handler.
 *
 * Toggling a bump checkbox calls the REST controller registered by the
 * order-bumps addon (POST /storeengine/v1/order-bumps/<id> to add,
 * DELETE to remove). Cookie + X-WP-Nonce auth via the shared `API` axios
 * instance — same pattern as the cart REST migration.
 *
 * Works on both the cart page and the checkout page; the markup and the
 * `storeengine-order-bumps-checkbox-input` class are identical on both.
 */
export const OrderBumps = () => {
	if ( bound ) {
		return;
	}
	bound = true;

	StoreEngineDQ( document ).on(
		'change',
		'.storeengine-order-bumps-checkbox-input',
		async function ( e ) {
			const checked = e.target.checked;
			const id = parseInt( e.target.value, 10 );
			if ( ! id ) {
				return;
			}

			if ( checked ) {
				const { data } = await API.post( `${ REST_BASE }/${ id }` );
				await doActionAsync(
					'storeengine.added_to_cart',
					data,
					{ id },
					'add-order-bump'
				);
			} else {
				await API.delete( `${ REST_BASE }/${ id }` );
			}

			StoreEngineDQ( window ).trigger( 'storeengine_cart_updated' );
		}
	);
};
