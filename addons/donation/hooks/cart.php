<?php
/**
 * Cart engine for customer-set pricing.
 *
 * Two hook points do all the work:
 *
 *   1. `storeengine/cart/add_item_data` — capture the customer-entered amount,
 *      validate/clamp it against the price config, and stash it on the line's
 *      item_data. Because item_data feeds the cart-item key hash, two different
 *      amounts for the same product become two distinct cart lines.
 *
 *   2. `storeengine/cart/raw_item_price` — substitute the stashed amount for the
 *      stored price whenever the line is read for totals or discounts. Reading
 *      at this point (rather than trusting the persisted line price) is robust:
 *      the cart reloads each line's price from the DB on every recalc, but that
 *      reload preserves item_data, so the override re-applies each time.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation\Hooks;

use StoreEngine\Addons\Donation\Helper;
use StoreEngine\Addons\Donation\Settings;
use StoreEngine\Classes\CartItem;
use StoreEngine\Classes\Exceptions\StoreEngineException;
use StoreEngine\Classes\Price;
use StoreEngine\Traits\Singleton;
use StoreEngine\Utils\Formatting;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Cart {

	use Singleton;

	public function __construct() {
		add_filter( 'storeengine/cart/add_item_data', [ $this, 'capture_amount' ], 10, 3 );
		add_filter( 'storeengine/cart/raw_item_price', [ $this, 'override_price' ], 10, 2 );

		// Carry the customer amount across the REST cart routes (React / instant /
		// embeddable checkouts), which otherwise accept only price/qty/variation.
		add_filter( 'storeengine/api/cart/add_item_args', [ $this, 'rest_args' ] );
		add_filter( 'storeengine/api/cart/item_data', [ $this, 'rest_item_data' ], 10, 2 );

		// A coupon on a customer-set amount (name-your-price / donation) is
		// almost always unintended — exclude those lines from coupon discounts by
		// zeroing the quantity the coupon may apply to.
		add_filter( 'storeengine/coupon_get_apply_quantity', [ $this, 'exclude_customer_priced_from_coupons' ], 10, 2 );
	}

	/**
	 * @param int    $qty
	 * @param object $item Discount item (carries price_id / product_id).
	 *
	 * @return int
	 */
	public function exclude_customer_priced_from_coupons( $qty, $item ): int {
		$price_id   = (int) ( $item->price_id ?? 0 );
		$product_id = (int) ( $item->product_id ?? 0 );

		if ( $price_id && Helper::is_customer_priced( Helper::get_price_config( $price_id, $product_id ) ) ) {
			return 0;
		}

		return (int) $qty;
	}

	/**
	 * Register the donation-amount REST arg on the add-to-cart routes.
	 *
	 * @param array $args
	 *
	 * @return array
	 */
	public function rest_args( array $args ): array {
		$args[ Helper::AMOUNT_KEY ] = [
			'type'     => 'number',
			'required' => false,
			'minimum'  => 0,
		];

		return $args;
	}

	/**
	 * Pull the submitted amount from the REST request into item_data.
	 *
	 * @param array            $item_data
	 * @param \WP_REST_Request $request
	 *
	 * @return array
	 */
	public function rest_item_data( array $item_data, $request ): array {
		$amount = $request->get_param( Helper::AMOUNT_KEY );

		if ( null !== $amount && '' !== $amount ) {
			$item_data[ Helper::AMOUNT_KEY ] = (float) $amount;
		}

		return $item_data;
	}

	/**
	 * Capture and validate the customer-entered amount at add-to-cart.
	 *
	 * @param array $item_data
	 * @param Price $price
	 * @param int   $product_id
	 *
	 * @return array
	 *
	 * @throws StoreEngineException When a donor-supplied amount is outside the
	 *                               configured [min, max] — rejecting the add-to-cart
	 *                               rather than silently clamping it, so the donor sees
	 *                               why their amount didn't go through instead of it
	 *                               quietly becoming a different number. This is caught
	 *                               by Cart::add_product_to_cart()'s try/catch and
	 *                               surfaced as a normal REST error notification.
	 */
	public function capture_amount( array $item_data, Price $price, int $product_id ): array {
		$config = Helper::get_price_config( $price->get_id(), $product_id );

		if ( ! Helper::is_customer_priced( $config ) ) {
			return $item_data;
		}

		// Prefer an amount already threaded through item_data (REST/programmatic
		// add-to-cart); fall back to the request for classic form posts.
		$amount = null;
		if ( isset( $item_data[ Helper::AMOUNT_KEY ] ) ) {
			$amount = (float) $item_data[ Helper::AMOUNT_KEY ];
		} else {
			$submitted = Helper::get_submitted_amount();
			if ( null !== $submitted ) {
				$amount = $submitted;
			}
		}

		// No amount supplied: fall back to the suggested amount, else the min,
		// else the stored price — never a zero line. Nothing was donor-typed
		// here, so there's nothing to validate.
		if ( null === $amount ) {
			$amount = $config['suggested'] ?? $config['min'] ?? $price->get_price();
		} else {
			$amount = abs( $amount );

			if (
				( null !== $config['min'] && $amount < $config['min'] )
				|| ( null !== $config['max'] && $amount > $config['max'] )
			) {
				throw new StoreEngineException(
					esc_html( $this->range_message( $amount, $config ) ),
					'donation-amount-out-of-range',
					[ 'status' => 422 ]
				);
			}
		}

		// Still snap to `step` (a minor rounding nicety, not a range violation)
		// and re-clamp as defense in depth against a config change since render.
		$item_data[ Helper::AMOUNT_KEY ] = Helper::clamp_amount( (float) $amount, $config );

		return $item_data;
	}

	/**
	 * Build the merchant-configured out-of-range message for an amount,
	 * mirroring the client-side hint shown by the amount field's own
	 * below_min_message / above_max_message.
	 *
	 * @param float $amount
	 * @param array $config
	 *
	 * @return string
	 */
	private function range_message( float $amount, array $config ): string {
		if ( null !== $config['min'] && $amount < $config['min'] ) {
			return str_replace(
				'{min}',
				wp_strip_all_tags( Formatting::price( $config['min'] ) ),
				Settings::init()->get_settings( 'below_min_message', __( 'Please enter an amount of at least {min}.', 'storeengine' ) )
			);
		}

		return str_replace(
			'{max}',
			wp_strip_all_tags( Formatting::price( $config['max'] ) ),
			Settings::init()->get_settings( 'above_max_message', __( 'Please enter an amount of at most {max}.', 'storeengine' ) )
		);
	}

	/**
	 * Substitute the customer amount for the stored line price.
	 *
	 * @param float    $price
	 * @param CartItem $cart_item
	 *
	 * @return float
	 */
	public function override_price( $price, CartItem $cart_item ): float {
		$item_data = $cart_item->item_data ?? [];

		if ( ! is_array( $item_data ) || ! isset( $item_data[ Helper::AMOUNT_KEY ] ) ) {
			return (float) $price;
		}

		// Re-clamp at read-time as defense in depth — the persisted amount is
		// ultimately client-derived, and the config may have changed since.
		$config = Helper::get_price_config( (int) $cart_item->price_id, (int) $cart_item->product_id );

		if ( ! Helper::is_customer_priced( $config ) ) {
			return (float) $price;
		}

		return Helper::clamp_amount( (float) $item_data[ Helper::AMOUNT_KEY ], $config );
	}
}

// End of file cart.php
