<?php
/**
 * Donations & Name Your Price addon.
 *
 * Lets a customer set the amount they pay for a product ("name your price")
 * and powers store-owner donation products. The customer-entered amount is
 * captured into the cart item's `item_data` and substituted for the stored
 * price at read-time via the `storeengine/cart/raw_item_price` filter, so it
 * flows through the normal cart / checkout / order / coupon / tax pipeline.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation;

use StoreEngine\Classes\AbstractAddon;
use StoreEngine\Traits\Singleton;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Donation extends AbstractAddon {

	use Singleton;

	protected string $addon_name = 'donation';

	public function define_constants() {
		define( 'STOREENGINE_DONATION_VERSION', '1.0.0' );
		define( 'STOREENGINE_DONATION_DIR_PATH', STOREENGINE_ADDONS_DIR_PATH . 'donation/' );
		define( 'STOREENGINE_DONATION_URL', STOREENGINE_PLUGIN_ROOT_URI . 'addons/donation/' );
		define( 'STOREENGINE_DONATION_SETTINGS_NAME', 'storeengine_donation_settings' );
	}

	public function init_addon() {
		Settings::init();
		Hooks\Cart::init();
		Hooks\Order::init();
		Hooks\Product::init();
		Hooks\PriceEditor::init();
		Hooks\Dashboard::init();
		Shortcodes::init();
		API\Register::init();

		add_filter( 'storeengine/admin_menu_list', [ $this, 'admin_menu_items' ] );

		// Dummy-data seeder compatibility (only fires when the seeder addon is active).
		add_filter( 'storeengine/seeder/providers', [ $this, 'register_seeder_providers' ] );
		add_filter( 'storeengine/seeder/delete_object', [ $this, 'seeder_delete_object' ], 10, 3 );

		if ( ! is_admin() ) {
			Hooks\Frontend::init();
		}
	}

	/**
	 * Register the top-level Donations admin page.
	 *
	 * @param array $items
	 *
	 * @return array
	 */
	public function admin_menu_items( array $items ): array {
		$items[ STOREENGINE_PLUGIN_SLUG . '-donations' ] = [
			'title'      => __( 'Donations', 'storeengine' ),
			'capability' => 'manage_options',
			'priority'   => 58,
		];

		return $items;
	}

	/**
	 * @param array $providers
	 *
	 * @return array
	 */
	public function register_seeder_providers( array $providers ): array {
		$providers[] = new Providers\DonationProvider();

		return $providers;
	}

	/**
	 * Clean up seeded donation-ledger rows.
	 *
	 * @param bool   $handled
	 * @param string $type
	 * @param int    $id
	 *
	 * @return bool
	 */
	public function seeder_delete_object( $handled, $type, $id ) {
		if ( 'donation' === $type ) {
			global $wpdb;
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			return (bool) $wpdb->delete( Database::donations_table(), [ 'id' => (int) $id ] );
		}

		return $handled;
	}

	public function get_db_version(): string {
		return Database::schema_version();
	}

	public function install_tables(): void {
		Database::install();
	}

	public function addon_activation_hook() {
		Settings::init()->save_default_settings();
		Database::install();
	}
}

// End of file donation.php
