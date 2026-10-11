import { addAction } from '@wordpress/hooks';
import { getSeGlobal } from '@Utils/helper';
import { triggerTag } from '@Utils/pixel/google';
import { getCachedCartInfo } from '@Utils/pixel/utils';

import {
	CartInfo,
	CartItem,
	CheckoutResponse,
	OrderItemProduct,
} from '../index';
import { PixelCart, PixelCartItem, SEPixelData } from './types';

const toNumber = ( value: unknown ): number => {
	const n = Number( value );
	return Number.isFinite( n ) ? n : 0;
};

/**
 * Two different cart-item shapes reach this helper:
 *
 * - the REST cart (`CartItem`: product_id / name / line_subtotal / line_total /
 *   variation), used by the add/update/remove hooks and getCachedCartInfo();
 * - the PHP-localized cart (`PixelCartItem`: item_id / item_name /
 *   item_variant), built by Pixel::get_cart_info() for view_cart and
 *   begin_checkout.
 *
 * Reading only the first shape emitted `item_id: undefined` on every view_cart
 * and begin_checkout item. GA4 discards items with no id or name, so the middle
 * of the funnel reported no products at all and never joined up with
 * add_to_cart or purchase. Normalize both shapes here.
 *
 * @param item     A cart item in either shape.
 * @param currency Store currency code.
 *
 * @return GA4 item object.
 */
const cartItemObject = (
	item: CartItem | PixelCartItem,
	currency: string
): Record< string, string | number > => {
	const cartItem = item as Partial< CartItem > & Partial< PixelCartItem >;
	const quantity = toNumber( cartItem.quantity );

	const lineDiscount = Math.max(
		0,
		toNumber( cartItem.line_subtotal ) - toNumber( cartItem.line_total )
	);
	const perUnitDiscount = quantity > 0 ? lineDiscount / quantity : 0;

	const itemId = cartItem.product_id ?? cartItem.item_id;
	const itemName = cartItem.name ?? cartItem.item_name;

	const obj: Record< string, string | number > = {
		currency,
		discount: perUnitDiscount || toNumber( cartItem.discount ),
		price: toNumber( cartItem.price ),
		quantity,
	};

	if ( undefined !== itemId ) {
		obj.item_id = itemId;
	}

	if ( undefined !== itemName ) {
		obj.item_name = itemName;
	}

	const variant = cartItem.variation
		? Object.values( cartItem.variation ).filter( Boolean ).join( ' / ' )
		: cartItem.item_variant;

	if ( variant ) {
		obj.item_variant = variant;
	}

	return obj;
};

const orderItemObject = (
	item: OrderItemProduct,
	currency: string
): Record< string, string | number > => {
	const lineDiscount = Math.max(
		0,
		toNumber( item.subtotal ) - toNumber( item.total )
	);
	const perUnitDiscount =
		item.quantity > 0 ? lineDiscount / item.quantity : 0;

	const data: Record< string, string | number > = {
		// The same id space as view_item / add_to_cart / view_cart. This used to
		// be `product_id-price_id`, which GA4 read as a different product
		// entirely: every item showed up twice in the reports and the
		// view → cart → purchase funnel never joined up. What distinguishes one
		// price from another belongs in item_variant, below.
		item_id: item.product_id,
		item_name: item.name,
		currency,
		discount: perUnitDiscount,
		price: toNumber( item.price ),
		quantity: item.quantity,
	};

	// GA4 models "same product, different option" as item_variant. Prefer the
	// variation attributes; fall back to the price name so a product sold under
	// several prices (monthly vs yearly, say) is still tellable apart.
	const variant = item.variation_id
		? item.meta
				.filter( ( m ) => m.key.startsWith( 'se_pa_' ) && m.value )
				.map( ( m ) => m.value )
				.join( ' / ' )
		: '';

	if ( variant ) {
		data.item_variant = variant;
	} else if ( item.price_name ) {
		data.item_variant = item.price_name;
	}

	return data;
};

/**
 * The identifier analytics reports the sale under.
 *
 * The order id is the only one that is stable across payment methods and that a
 * merchant can look up in the admin. The gateway's transaction id is empty for
 * manual, free and offline orders, and the order key matches nothing they ever
 * see — which made purchases impossible to reconcile against real orders.
 *
 * @param order Completed order from SEPixelData.
 *
 * @return Identifier to report as GA4's transaction_id.
 */
const transactionId = ( order: CheckoutResponse[ 'order' ] ): string =>
	order.id
		? String( order.id )
		: String( order.transaction_id || order.order_key || '' );

const wasSent = ( key: string ): boolean => {
	try {
		return !! window.sessionStorage?.getItem( key );
	} catch {
		return false;
	}
};

const markSent = ( key: string ): void => {
	try {
		window.sessionStorage?.setItem( key, '1' );
	} catch {}
};

const prepareCartData = function (
	cartInfo: CartInfo | PixelCart,
	currency: string
) {
	const cart = cartInfo as Partial< CartInfo > & Partial< PixelCart >;

	// The REST cart carries a `totals` object; the PHP-localized one reports a
	// flat `discount_total`. Read whichever is present so view_cart and
	// begin_checkout report the discount the checkout actually applied.
	const totalDiscount = toNumber(
		cart.totals?.discount_total ?? cart.discount_total
	);

	const payload: Record< string, unknown > = {
		currency,
		value: toNumber( cart.total ),
		items: Object.values( cart.cart_items ?? {} ).map( ( i ) =>
			cartItemObject( i, currency )
		),
	};

	if ( totalDiscount > 0 ) {
		payload.discount = totalDiscount;
	}

	return payload;
};

export const gtag_integration = () => {
	// We're inside dom ready wrapper.

	const store_currency = getSeGlobal( 'currency_options.currency', 'USD' );

	let currentSearch: string = '';

	addAction(
		'storeengine.view_page.view_shop',
		'se.gtag.view_shop',
		function ( {
			page_title: item_list_name,
			products: items,
		}: {
			page_title: string;
			products: Array< {
				item_id: string;
				item_name: string;
				item_list_name: string;
			} >;
		} ) {
			return triggerTag( 'view_item_list', { item_list_name, items } );
		}
	);

	addAction(
		'storeengine.shop.after_product_filter',
		'se.gtag.product_filter',
		function ( { response, payload: filterData } ) {
			let eventName: Gtag.EventNames = 'view_item_list';
			if ( filterData.search && filterData.search !== currentSearch ) {
				currentSearch = filterData.search;
				eventName = 'search';
			}

			return triggerTag( eventName, {
				item_list_name: response.pixel_data.page_title,
				items: response.pixel_data.products,
			} );
		}
	);

	addAction(
		'storeengine.view_page.view_product',
		'se.gtag.view_product',
		async function ( data: SEPixelData ) {
			if ( ! data.product ) {
				return;
			}

			const {
				page_title: item_list_name,
				product,
				products: items,
				currency,
			} = data;
			await triggerTag( 'view_item', {
				value: product.price,
				currency,
				items: [
					{
						...product,
						discount: 0,
						currency,
						quantity: 1,
					},
				],
			} ).catch();

			if ( items.length ) {
				await triggerTag( 'view_item_list', {
					item_list_name,
					items,
				} ).catch();
			}
		}
	);

	addAction(
		'storeengine.cart.view_cart',
		'se.gtag.view_cart',
		function ( {
			cart_info,
			currency,
		}: SEPixelData & { cart_info: CartInfo; mini_cart?: boolean } ) {
			if ( cart_info.is_empty ) {
				return;
			}

			return triggerTag(
				'view_cart',
				prepareCartData( cart_info, currency )
			);
		}
	);

	addAction(
		'storeengine.added_to_cart',
		'se.gtag.added_to_cart',
		function ( item: CartItem ) {
			return triggerTag( 'add_to_cart', {
				currency: store_currency,
				value: toNumber( item.price ) * toNumber( item.quantity ),
				items: [ cartItemObject( item, store_currency ) ],
			} );
		}
	);

	addAction(
		'storeengine.updated_cart_item_quantity',
		'se.gtag.updated_cart_item_quantity',
		function ( item: CartItem ) {
			return triggerTag( 'add_to_cart', {
				currency: store_currency,
				value: toNumber( item.price ) * toNumber( item.quantity ),
				items: [ cartItemObject( item, store_currency ) ],
			} );
		}
	);

	addAction(
		'storeengine.removed_from_cart',
		'se.gtag.removed_from_cart',
		function ( item: CartItem ) {
			return triggerTag( 'remove_from_cart', {
				currency: store_currency,
				value: toNumber( item.price ) * toNumber( item.quantity ),
				items: [ cartItemObject( item, store_currency ) ],
			} );
		}
	);

	addAction(
		'storeengine.checkout.checkout_initialized',
		'se.gtag.begin_checkout',
		function ( {
			cart_info,
			currency,
		}: SEPixelData & { cart_info: CartInfo } ) {
			if ( ! cart_info || cart_info.is_empty ) {
				return;
			}

			return triggerTag( 'begin_checkout', {
				...prepareCartData( cart_info, currency ),
			} );
		}
	);

	// Fire the `purchase` event on the page the buyer lands on AFTER paying,
	// rather than from the checkout page's `storeengine.checkout.purchase_completed`
	// hook (which runs ~850ms before the redirect). Firing pre-redirect made GA4
	// stamp the conversion — and its revenue — with the checkout page path.
	// PHP localizes the completed order into SEPixelData.order on whichever page
	// that turns out to be: the thank-you page, a custom after-purchase
	// redirect, or a funnel upsell step (see Assets::get_purchase_pixel_order()).
	const firePurchase = async ( order?: CheckoutResponse[ 'order' ] ) => {
		if ( ! order || ! order.line_items || ! order.line_items.length ) {
			return;
		}

		// Keyed on the order id so the guard holds across every post-purchase
		// page the buyer may pass through, not just a refresh of one of them.
		const dedupeKey = 'se_ga_purchase_' + transactionId( order );

		if ( wasSent( dedupeKey ) ) {
			return;
		}

		const subscriptions: Array< OrderItemProduct > = [];
		const items = order.line_items.map( ( item ) => {
			if ( 'subscription' === item.price_type ) {
				subscriptions.push( item );
			}
			return orderItemObject( item, order.currency );
		} );

		const couponCodes =
			order.coupon_lines && order.coupon_lines.length
				? order.coupon_lines
						.map( ( c ) => c.code )
						.filter( Boolean )
						.join( ',' )
				: undefined;

		const purchasePayload: Record< string, unknown > = {
			transaction_id: transactionId( order ),
			value: toNumber( order.total ),
			tax: toNumber( order.total_tax ),
			shipping: toNumber( order.shipping_total_amount ),
			currency: order.currency,
			items,
		};

		if ( couponCodes ) {
			purchasePayload.coupon = couponCodes;
		}

		const totalDiscount = toNumber( order.discount_total_amount );
		if ( totalDiscount > 0 ) {
			// Non-standard but useful: many GTM templates read this.
			purchasePayload.discount = totalDiscount;
		}

		// waitForTag: the purchase is the one event we cannot afford to drop, and
		// nothing is awaiting this call — it runs on page load, off the
		// interaction path — so holding it for a late tag costs the buyer
		// nothing.
		const delivered = await triggerTag( 'purchase', purchasePayload, {
			waitForTag: true,
		} ).catch( () => false );

		// Only remember the purchase once a tag actually took it. Recording it
		// unconditionally lost the conversion for good whenever GA loaded late:
		// the event was dropped, and the flag then suppressed every retry —
		// including a reload of the same page.
		if ( ! delivered ) {
			return;
		}

		markSent( dedupeKey );

		if ( subscriptions.length ) {
			// Custom GA4 event for recurring revenue tracking. Mirrors the
			// purchase shape so funnels in Looker / BQ exports can join them.
			triggerTag(
				'subscription_start' as Gtag.EventNames,
				{
					transaction_id: purchasePayload.transaction_id,
					currency: order.currency,
					value: subscriptions.reduce(
						( sum, s ) =>
							sum + toNumber( s.price ) * toNumber( s.quantity ),
						0
					),
					items: subscriptions.map( ( s ) =>
						orderItemObject( s, order.currency )
					),
				},
				{ waitForTag: true }
			).catch();
		}
	};

	firePurchase( window?.SEPixelData?.order ).catch( () => {} );

	addAction(
		'storeengine.checkout.checkout_updated',
		'se.gtag.shipping_info_added',
		async function ( formData: Record< string, unknown > ) {
			if ( ! formData.shipping_method ) {
				return;
			}

			const cartInfo = await getCachedCartInfo();

			if ( cartInfo.is_empty ) {
				return;
			}

			return triggerTag( 'add_shipping_info', {
				shipping_tier: formData.shipping_method,
				...prepareCartData( cartInfo, store_currency ),
			} );
		}
	);

	addAction(
		'storeengine.checkout.payment_info_added',
		'se.gtag.payment_info_added',
		async function ( payload?: { payment_gateway?: string } ) {
			const cartInfo = await getCachedCartInfo();

			if ( cartInfo.is_empty ) {
				return;
			}

			return triggerTag( 'add_payment_info', {
				payment_type: payload?.payment_gateway,
				...prepareCartData( cartInfo, store_currency ),
			} );
		}
	);
};
