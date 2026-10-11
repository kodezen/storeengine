<?php
/**
 * Product-behaviour adjustments for donation products.
 *
 * A donation-mode product is intangible: it should never require shipping.
 * (Stock is left untouched — donation products simply don't opt into stock
 * management, and the cart's stock checks are already method_exists-guarded.)
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation\Hooks;

use StoreEngine\Addons\Donation\Helper;
use StoreEngine\Traits\Singleton;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Product {

	use Singleton;

	public function __construct() {
		add_filter( 'storeengine/product/needs_shipping', [ $this, 'no_shipping_for_donation' ], 10, 2 );
	}

	/**
	 * @param bool   $needs
	 * @param object $product
	 *
	 * @return bool
	 */
	public function no_shipping_for_donation( bool $needs, $product ): bool {
		if ( $needs && method_exists( $product, 'get_id' ) && Helper::product_has_donation( (int) $product->get_id() ) ) {
			return false;
		}

		return $needs;
	}
}

// End of file product.php
