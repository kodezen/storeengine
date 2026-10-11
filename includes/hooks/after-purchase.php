<?php

namespace StoreEngine\Hooks;

use StoreEngine\Classes\AbstractProduct;
use StoreEngine\Classes\enums\PurchaseRedirectType;
use StoreEngine\Classes\Exceptions\StoreEngineException;
use StoreEngine\Classes\Order;
use StoreEngine\Utils\Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AfterPurchase {

	public static function init() {
		if ( ! Helper::get_settings( 'enable_after_purchase_redirect', false ) ) {
			return;
		}

		add_filter( 'storeengine/order/get_checkout_order_received_url', [ __CLASS__, 'get_checkout_order_received_url', ], 10, 2 );
	}

	/**
	 * @throws StoreEngineException
	 */
	public static function get_checkout_order_received_url( string $received_url, Order $order ): string {
		if ( 'paid' !== $order->get_paid_status() || 1 !== count( $order->get_items() ) ) {
			return $received_url;
		}

		$order_items = $order->get_items();
		/** @var Order\OrderItemProduct $order_item */
		$order_item   = reset( $order_items );
		$integrations = Helper::get_integrations_by_price_id( $order_item->get_price_id() );

		foreach ( $integrations as $integration ) {
			if ( 'storeengine/membership-addon' !== $integration->get_provider() ) {
				continue;
			}

			$redirect_type = get_post_meta( $integration->get_integration_id(), '_storeengine_membership_purchase_redirect_type', true );
			if ( PurchaseRedirectType::DEFAULT === $redirect_type ) {
				continue;
			}
			$membership_redirect_url = get_post_meta( $integration->get_integration_id(), '_storeengine_membership_purchase_redirect_url', true );
			if ( empty( $membership_redirect_url ) ) {
				continue;
			}
			if ( PurchaseRedirectType::PAGE === $redirect_type ) {
				return self::with_order_hash( get_permalink( (int) $membership_redirect_url ), $order );
			}

			return self::with_order_hash( $membership_redirect_url, $order );
		}

		/** @var false|AbstractProduct $product */
		$product = $order_item->get_product();
		if ( $product && PurchaseRedirectType::DEFAULT !== $product->get_purchase_redirect_type() && ! empty( $product->get_purchase_redirect_url() ) ) {
			return self::with_order_hash( $product->get_purchase_redirect_url(), $order );
		}

		// No product/membership-specific override — fall back to the store-wide
		// custom URL if the admin set one; otherwise keep the default thank-you page.
		$global_redirect_url = Helper::get_settings( 'after_purchase_redirect_url', '' );
		if ( ! empty( $global_redirect_url ) ) {
			return self::with_order_hash( $global_redirect_url, $order );
		}

		return $received_url;
	}

	/**
	 * Carry the order key onto a custom post-purchase destination.
	 *
	 * The order shortcodes and the analytics payload both key off `order_hash`.
	 * Redirecting away from the thank-you page without it left the buyer on a
	 * page that could not show their order, and made the sale invisible to
	 * Google Analytics / Meta on every store using this setting.
	 *
	 * Off-site destinations are left untouched: the order key is a capability
	 * that grants access to the order, and it does not belong in a request to
	 * somebody else's host.
	 *
	 * @param string $url   Redirect destination.
	 * @param Order  $order Completed order.
	 *
	 * @return string
	 */
	private static function with_order_hash( string $url, Order $order ): string {
		if ( '' === $url ) {
			return $url;
		}

		$host = wp_parse_url( $url, PHP_URL_HOST );
		if ( $host && $host !== wp_parse_url( home_url(), PHP_URL_HOST ) ) {
			return $url;
		}

		return add_query_arg( 'order_hash', $order->get_order_key(), $url );
	}

}
