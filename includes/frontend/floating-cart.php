<?php

namespace StoreEngine\Frontend;

use StoreEngine\Traits\Singleton;
use StoreEngine\Utils\Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FloatingCart {
	use Singleton;

	public function __construct() {
		add_action( 'wp_footer', [ $this, 'display_cart_button' ] );
	}

	public function display_cart_button() {
		/**
		 * Whether to render the floating mini-cart on the current request.
		 *
		 * Lets other plugins hide it on pages that provide their own cart/app
		 * UI (e.g. a full-screen community, dashboard, or builder app) without
		 * disabling the feature site-wide. Fires on `wp_footer`, so the main
		 * query is parsed and conditional tags / query vars are available.
		 *
		 * @param bool $show Whether to render the floating cart. Default true.
		 */
		if ( ! apply_filters( 'storeengine/frontend/show_floating_cart', true ) ) {
			return;
		}

		if ( Helper::is_cart() || Helper::is_checkout() ) {
			return;
		}

		// The cart is only loaded for frontend requests (Frontend::init_frontend).
		// If it isn't here, render an empty button instead of a fatal in the
		// footer (storeengine_cart() is typed to return a Cart).
		$cart  = \StoreEngine::init()->get_cart();
		$count = $cart ? $cart->get_count() : 0;
		// A badge sized for the floating icon can't grow to fit an arbitrarily
		// large count without overwhelming the button, so cap what's shown.
		$count_label = $count > 99 ? '99+' : (string) $count;
		?>
		<button style="display: <?php echo esc_attr( 0 === $count ? 'none' : 'block' ); ?>" type="button" data-storeengine-mini-cart-open-drawer class="storeengine-floating-cart">
			<div class="storeengine-floating-cart-button">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
					<path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
				</svg>
				<span class="storeengine-floating-cart-count storeengine-cart-count"><?php echo esc_html( $count_label ); ?></span>
			</div>
		</button>
		<div id="storeengine-mini-cart-drawer-root"></div>
		<?php
	}
}
