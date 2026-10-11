<?php
/**
 * Frontend rendering for customer-set pricing.
 *
 * Injects the amount input into the single-product add-to-cart form. The field
 * is named after {@see Helper::AMOUNT_KEY}, so the existing add-to-cart JS
 * (which serialises the whole form) carries it to the classic admin-ajax
 * handler, while the REST cart routes read the same key from their payload.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation\Hooks;

use StoreEngine\Addons\Donation\Helper;
use StoreEngine\Addons\Donation\Settings;
use StoreEngine\Traits\Singleton;
use StoreEngine\Utils\Template;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Frontend {

	use Singleton;

	public function __construct() {
		add_action( 'wp_enqueue_scripts', [ $this, 'register_assets' ] );
		add_action( 'storeengine/product/before_add_to_cart', [ $this, 'render_amount_field' ] );
	}

	/**
	 * Register the donation front-end assets, and enqueue them on single
	 * product pages (where the amount field can appear).
	 */
	public function register_assets(): void {
		wp_register_style(
			'storeengine-donation-frontend',
			STOREENGINE_DONATION_URL . 'assets/css/frontend.css',
			[],
			STOREENGINE_DONATION_VERSION
		);

		wp_register_script(
			'storeengine-donation-frontend',
			STOREENGINE_DONATION_URL . 'assets/js/frontend.js',
			[],
			STOREENGINE_DONATION_VERSION,
			true
		);

		if ( \StoreEngine\Utils\Helper::is_product() ) {
			wp_enqueue_style( 'storeengine-donation-frontend' );
			wp_enqueue_script( 'storeengine-donation-frontend' );
		}
	}

	/**
	 * Render the "name your price" / donation amount input(s).
	 *
	 * A product can have more than one customer-priced price (e.g. "Name your
	 * price — Monthly" alongside "Name your price — Yearly"); one field is
	 * rendered per such price, each tagged `data-price-id`, so every one of
	 * them gets its own correct min/max/step/suggested. frontend.js shows only
	 * the field matching whichever `price_id` radio is currently selected
	 * (single-price products, the overwhelming common case, render exactly one
	 * field and need no such toggling).
	 *
	 * @param object $product
	 */
	public function render_amount_field( $product ): void {
		if ( ! method_exists( $product, 'get_prices' ) ) {
			return;
		}

		$customer_priced = [];
		foreach ( $product->get_prices() as $price ) {
			$config = Helper::get_price_config( $price->get_id(), $product->get_id() );
			if ( Helper::is_customer_priced( $config ) ) {
				$customer_priced[] = [ $price, $config ];
			}
		}

		if ( ! $customer_priced ) {
			return;
		}

		// Ensure the assets are present wherever the field renders (single
		// product page, but also the campaign support panel). On product pages
		// they were already enqueued in the head by register_assets(); this dedupes.
		wp_enqueue_style( 'storeengine-donation-frontend' );
		wp_enqueue_script( 'storeengine-donation-frontend' );

		$multiple = count( $customer_priced ) > 1;

		foreach ( $customer_priced as [ $price, $config ] ) {
			// $config is normalized by Helper::get_price_config(), so min/max/step/
			// suggested are already internally consistent and safe for the input.
			$min = ( null !== $config['min'] ) ? (float) $config['min'] : 0;
			$max = ( null !== $config['max'] ) ? (float) $config['max'] : null;

			$args = [
				'price_id'         => (int) $price->get_id(),
				'label'            => Settings::init()->get_settings( 'amount_field_label', __( 'Enter your amount', 'storeengine' ) ),
				'currency'         => \StoreEngine\Utils\Helper::get_currency_symbol(),
				'min'              => $min,
				'max'              => $max,
				'step'             => ( (float) $config['step'] > 0 ) ? (float) $config['step'] : 1,
				'value'            => ( null !== $config['suggested'] ) ? (float) $config['suggested'] : '',
				'allow'            => (bool) $config['allow_custom'],
				'name'             => Helper::AMOUNT_KEY,
				// Only meaningful when more than one field renders — lets
				// frontend.js show the one matching the selected price_id radio
				// and hide (and disable, so it isn't posted) the rest.
				'toggle_by_price'  => $multiple,
				// Client-side hint only — clamp_amount() still enforces the real
				// floor/ceiling server-side, so a donor who ignores this can never
				// actually submit an amount outside [min, max].
				// Plain text (not the HTML-wrapped Formatting::price() markup used
				// elsewhere) — this lands in a data-attribute and is shown via
				// textContent by frontend.js, so it must not carry any markup.
				'below_min_message' => str_replace(
					'{min}',
					wp_strip_all_tags( \StoreEngine\Utils\Formatting::price( $min ) ),
					Settings::init()->get_settings( 'below_min_message', __( 'Please enter an amount of at least {min}.', 'storeengine' ) )
				),
				'above_max_message' => null === $max ? '' : str_replace(
					'{max}',
					wp_strip_all_tags( \StoreEngine\Utils\Formatting::price( $max ) ),
					Settings::init()->get_settings( 'above_max_message', __( 'Please enter an amount of at most {max}.', 'storeengine' ) )
				),
			];

			/**
			 * Filter the amount field's rendering args.
			 *
			 * The same field serves several contexts — a plain product page, and (with
			 * the Fundraising addon) a campaign's donate form or a reward tier, where
			 * the tier price becomes the floor. Consumers may raise `min` / `value`;
			 * the amount is re-validated server-side either way.
			 *
			 * @param array  $args
			 * @param object $product
			 * @param array  $config Normalized price config.
			 */
			$args = (array) apply_filters( 'storeengine/donation/amount_field_args', $args, $product, $config );

			Template::get_template(
				'donation/amount-field.php',
				$args,
				'',
				STOREENGINE_DONATION_DIR_PATH . 'templates/'
			);
		}
	}
}

// End of file frontend.php
