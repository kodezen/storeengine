<?php
/**
 * PHPUnit bootstrap for StoreEngine unit tests.
 *
 * Deliberately minimal — no WordPress, no DB. Tests in this suite cover
 * pure-PHP logic only: array transformations, validation helpers, value
 * objects, static defaults. Anything that needs WP hooks, $wpdb, or the
 * cart/order/license lifecycle belongs in a future integration suite
 * running under wp-env (or `wp-phpunit`), wired as a separate `testsuites`
 * entry.
 *
 * What we stub here is the bare minimum that lets the plugin's class files
 * load without exploding:
 *   - ABSPATH so the `if ( ! defined( 'ABSPATH' ) ) exit;` guards at the
 *     top of every plugin file don't short-circuit.
 *   - The plugin's existing namespace autoloader so test files can just
 *     `use \StoreEngine\Addons\Email\order\PaymentFailed` and PHP resolves
 *     the file path without per-test `require_once` boilerplate.
 *   - No-op `__()` / `_n()` / `_x()` / `apply_filters()` so any class load
 *     path that hits one (e.g. translation in a class-level default) does
 *     not fatal.
 *
 * Anything beyond that should be added per-test as a Mockery / Brain
 * Monkey stub — don't pile WP shims into the bootstrap or unit tests
 * silently start depending on shim behavior.
 */

// --- Plugin constants ------------------------------------------------------

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

if ( ! defined( 'STOREENGINE_PLUGIN_SLUG' ) ) {
	define( 'STOREENGINE_PLUGIN_SLUG', 'storeengine' );
}

if ( ! defined( 'STOREENGINE_ROOT_DIR_PATH' ) ) {
	define( 'STOREENGINE_ROOT_DIR_PATH', dirname( __DIR__ ) . '/' );
}

if ( ! defined( 'STOREENGINE_INCLUDES_DIR_PATH' ) ) {
	define( 'STOREENGINE_INCLUDES_DIR_PATH', dirname( __DIR__ ) . '/includes/' );
}

// --- Composer autoload (phpunit) -------------------------------------------

$autoload = __DIR__ . '/vendor/autoload.php';
if ( ! file_exists( $autoload ) ) {
	fwrite(
		STDERR,
		"Test dependencies are missing. Run:\n  cd " . __DIR__ . " && composer install\n"
	);
	exit( 1 );
}
require_once $autoload;

// --- WP function stubs (minimum to let class files load) -------------------
// These come BEFORE the plugin autoloader so plugin files that call them at
// load-time (translation strings in static defaults) see the stubs first.

if ( ! function_exists( 'apply_filters' ) ) {
	/**
	 * No-op apply_filters — returns the unfiltered value. Tests that need to
	 * exercise filter callbacks should use Brain Monkey instead of upgrading
	 * this stub.
	 */
	function apply_filters( $tag, $value ) { // phpcs:ignore
		return $value;
	}
}

if ( ! function_exists( '__' ) ) {
	function __( $text, $domain = 'default' ) { // phpcs:ignore
		return $text;
	}
}

if ( ! function_exists( '_n' ) ) {
	function _n( $single, $plural, $number, $domain = 'default' ) { // phpcs:ignore
		return 1 === (int) $number ? $single : $plural;
	}
}

if ( ! function_exists( '_x' ) ) {
	function _x( $text, $context, $domain = 'default' ) { // phpcs:ignore
		return $text;
	}
}

if ( ! function_exists( 'esc_html' ) ) {
	function esc_html( $text ) { // phpcs:ignore
		return $text;
	}
}

if ( ! function_exists( 'esc_attr' ) ) {
	function esc_attr( $text ) { // phpcs:ignore
		return $text;
	}
}

if ( ! function_exists( 'absint' ) ) {
	function absint( $maybeint ) { // phpcs:ignore
		return abs( (int) $maybeint );
	}
}

if ( ! function_exists( 'get_option' ) ) {
	function get_option( $name, $default = false ) { // phpcs:ignore
		return $default;
	}
}

// --- Plugin autoloader -----------------------------------------------------
// Lets `use StoreEngine\Addons\Email\order\PaymentFailed;` resolve to
// addons/email/order/payment-failed.php without per-test require_once.

require_once STOREENGINE_INCLUDES_DIR_PATH . 'autoload.php';
