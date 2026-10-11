import { addAction } from '@wordpress/hooks';
import { getSeGlobal } from '@Utils/helper';
import { triggerTag } from '@Utils/pixel/facebook';

import { CartItem, CheckoutResponse, PriceSettings } from '../index';
import { PixelCartItem, ProductArchivePixelData, SEPixelData } from './types';

export const fbq_integration = () => {
	const store_currency = getSeGlobal( 'currency_options.currency', 'USD' );

	addAction(
		'storeengine.shop.after_product_filter',
		'se.fbq.after_product_filter',
		function ( { response: { pixel_data }, payload: filterData } ) {
			if ( ! filterData.search ) {
				return;
			}

			return triggerTag( 'Search', {
				content_category: undefined,
				search_string: filterData.search,
				content_ids:
					pixel_data.products?.map(
						( product: ProductArchivePixelData ) => product.item_id
					) ?? [],
			} );
		}
	);

	addAction(
		'storeengine.view_page.view_product',
		'se.fbq.view_product',
		function ( { product, currency }: SEPixelData ) {
			if ( ! product ) {
				return;
			}

			return triggerTag( 'ViewContent', {
				content_category: undefined,
				content_type: 'product',
				content_name: product.item_name,
				content_ids: [ product.item_id ],
				value: product.price,
				currency,
				contents: [
					{
						id: product.item_id,
						quantity: 1,
					},
				],
			} );
		}
	);

	addAction(
		'storeengine.added_to_cart',
		'se.fbq.added_to_cart',
		function ( item: CartItem ) {
			return triggerTag( 'AddToCart', {
				content_ids: [ item.product_id ],
				content_name:
					item.name +
					( item.variation_id
						? ' – ' + Object.values( item.variation ).join( ' / ' )
						: '' ),
				content_type: 'product',
				contents: [ { id: item.product_id, quantity: item.quantity } ],
				currency: store_currency,
				value: item.price,
			} );
		}
	);

	addAction(
		'storeengine.checkout.checkout_initialized',
		'se.fbq.checkout_initialized',
		function ( { cart_info, currency }: SEPixelData ) {
			if ( cart_info.is_empty ) {
				return;
			}

			const cartItems: PixelCartItem[] = cart_info.cart_items;
			return triggerTag( 'InitiateCheckout', {
				content_ids: cartItems.map( ( item ) => item.item_id ),
				contents: cartItems.map( ( item ) => ( {
					id: item.item_id,
					quantity: item.quantity,
				} ) ),
				currency,
				num_items: cartItems.length,
				value: cart_info.total,
			} );
		}
	);

	addAction(
		'storeengine.checkout.purchase_completed',
		'se.fbq.purchase_completed',
		async function ( { order }: CheckoutResponse ) {
			let subscriptionTotal = 0;
			let subscriptionTrialTotal = 0;
			const items = order.line_items.map( ( item ) => {
				if ( 'subscription' === item.price_type ) {
					subscriptionTotal += Number( item.total ) * item.quantity;

					const priceSettings: null | PriceSettings =
						item.meta.find( ( m ) => m.key === '_price_settings' )
							?.value || null;

					if ( priceSettings && priceSettings.trial ) {
						subscriptionTrialTotal +=
							Number( item.total ) * item.quantity;
					}
				}

				const data: Record< string, number | string > = {
					// Must match the ids in `content_ids` below — and the ids
					// AddToCart/ViewContent report — or Meta treats the purchase
					// as being for a product it has never seen.
					id: item.product_id,
					quantity: item.quantity,
				};

				return data;
			} );

			await triggerTag( 'Purchase', {
				content_ids: order.line_items.map(
					( item ) => item.product_id
				),
				content_name: 'Purchase',
				content_type: 'product',
				contents: items,
				currency: store_currency,
				num_items: order.line_items.length,
				value: Number( order.total ),
			} );

			if ( subscriptionTrialTotal > 0 ) {
				await triggerTag( 'StartTrial', {
					currency: store_currency,
					value: subscriptionTrialTotal,
				} );
			}

			if ( subscriptionTotal > 0 ) {
				await triggerTag( 'Subscribe', {
					currency: store_currency,
					value: subscriptionTotal,
				} );
			}
		}
	);

	addAction(
		'storeengine.checkout.payment_info_added',
		'se.fbq.payment_info_added',
		async function () {
			return triggerTag( 'AddPaymentInfo', {
				content_category: 'Payment Info Added',
				currency: store_currency,
			} );
		}
	);
};
