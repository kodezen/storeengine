<?php
/**
 * PHPStan Bootstrap File
 *
 * This file prepares the static analysis environment for PHPStan.
 *
 * IMPORTANT:
 * This file is ONLY used during development and static analysis.
 * It is NOT part of the WordPress runtime bootstrap process.
 *
 * ------------------------------------------------------------------------
 * Why This File Exists
 * ------------------------------------------------------------------------
 *
 * The StoreEngine plugin:
 *
 * - Uses a custom autoloader
 * - Loads prefixed Composer dependencies (to avoid dependency conflicts)
 * - Registers addon namespaces dynamically at runtime
 *
 * PHPStan runs in a CLI context outside of WordPress and does NOT execute:
 *
 * - WordPress hooks
 * - Plugin activation logic
 * - Runtime addon registration
 * - Dynamic autoloader injections
 *
 * Therefore, we must recreate a deterministic, static loading environment
 * so PHPStan can correctly:
 *
 * - Discover all classes
 * - Resolve namespaces
 * - Infer types
 * - Analyze cross-addon dependencies
 *
 *
 * ------------------------------------------------------------------------
 * What This Bootstrap Does
 * ------------------------------------------------------------------------
 *
 * 1. Loads Composer's development autoloader (vendor/autoload.php)
 *    - Used for development-only dependencies and tooling.
 *
 * 2. Loads prefixed vendor autoloader (vendor/prefixed/autoload.php)
 *    - Required because StoreEngine source code references prefixed
 *      dependencies (e.g. StoreEngine\GuzzleHttp\Client).
 *    - This mirrors production runtime behavior.
 *
 * 3. Loads StoreEngine's custom autoloader.
 *    - Registers core namespace resolution logic.
 *
 * 4. Loads frontend template helpers (if required for analysis).
 *
 * 5. Registers all addon namespace directories deterministically.
 *    - This replaces runtime registration that would normally happen
 *      through WordPress hooks.
 *    - Ensures PHPStan can resolve addon classes.
 *
 *
 * ------------------------------------------------------------------------
 * Architectural Notes
 * ------------------------------------------------------------------------
 *
 * - Autoload registration must be deterministic.
 * - No WordPress hooks should be relied upon here.
 * - No environment-dependent logic should exist in this file.
 * - All class resolution must be filesystem-based.
 *
 * This file should remain simple and predictable.
 *
 *
 * ------------------------------------------------------------------------
 * When To Update This File
 * ------------------------------------------------------------------------
 *
 * - When a new addon is added
 * - When namespace structure changes
 * - When prefixed vendor location changes
 * - When autoload architecture is modified
 *
 *
 * ------------------------------------------------------------------------
 * DO NOT:
 * ------------------------------------------------------------------------
 *
 * - Add business logic
 * - Add WordPress lifecycle logic
 * - Depend on plugin activation state
 * - Load unnecessary runtime files
 *
 * This file exists purely to support static analysis tooling.
 *
 * ------------------------------------------------------------------------
 */

// Constants.

/** @noinspection PhpDefineCanBeReplacedWithConstInspection */
define( 'STOREENGINE_VERSION', 'dev' );
define( 'STOREENGINE_DB_VERSION', 'dev' );
define( 'STOREENGINE_PLUGIN_FILE', __DIR__ . '/storeengine.php' );
define( 'STOREENGINE_PLUGIN_BASENAME', 'storeengine/storeengine.php' );
define( 'STOREENGINE_PLUGIN_SLUG', 'storeengine' );
define( 'STOREENGINE_SETTINGS_NAME', 'storeengine_settings' );
define( 'STOREENGINE_ADDONS_SETTINGS_NAME', 'storeengine_addons' );
define( 'STOREENGINE_PAYMENTS_SETTINGS_NAME', 'storeengine_payments_settings' );
define( 'STOREENGINE_PLUGIN_ROOT_URI', 'https://wp-plugin-dev.test/wp-content/plugins/storeengine/' );
define( 'STOREENGINE_ROOT_DIR_PATH', __DIR__ . '/' );
define( 'STOREENGINE_INCLUDES_DIR_PATH', __DIR__ . '/includes/' );
define( 'STOREENGINE_ASSETS_DIR_PATH', __DIR__ . '/assets/' );
define( 'STOREENGINE_ASSETS_URI', __DIR__ . '/assets/' );
define( 'STOREENGINE_ADDONS_DIR_PATH', __DIR__ . '/addons/' );
define( 'STOREENGINE_LIBRARY_PATH', __DIR__ . '/libraries/' );
define( 'STOREENGINE_TEMPLATE_DEBUG_MODE', false );
define( 'STOREENGINE_TEMPLATE_PATH', __DIR__ . '/templates/' );
define( 'STOREENGINE_BLOCK_TEMPLATES_DIR_PATH', __DIR__ . '/templates/block-templates/' );
define( 'STOREENGINE_SECURE_UPLOADS_DIR', __DIR__ . '/../../uploads/storeengine_uploads' );

// Autoload other packages.
if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
	require_once __DIR__ . '/vendor/autoload.php';
}

// Autoload prefixed packages.
if ( file_exists( __DIR__ . '/vendor/prefixed/autoload.php' ) ) {
	require_once __DIR__ . '/vendor/prefixed/autoload.php';
}

require_once __DIR__ . '/includes/autoload.php';

// Frontend Template and Hooks
require_once __DIR__ . '/includes/frontend/functions.php';
require_once __DIR__ . '/includes/frontend/hooks.php';

$addons = [
	'StoreEngine\\Addons\\Paypal'        => __DIR__ . '/addons/paypal',
	'StoreEngine\\Addons\\Stripe'        => __DIR__ . '/addons/stripe',
	'StoreEngine\\Addons\\Affiliate'     => __DIR__ . '/addons/affiliate',
	'StoreEngine\\Addons\\Membership'    => __DIR__ . '/addons/membership',
	'StoreEngine\\Addons\\Subscription'  => __DIR__ . '/addons/subscription',
	'StoreEngine\\Addons\\Invoice'       => __DIR__ . '/addons/invoice',
	'StoreEngine\\Addons\\Email'         => __DIR__ . '/addons/email',
	'StoreEngine\\Addons\\Webhooks'      => __DIR__ . '/addons/webhooks',
	'StoreEngine\\Addons\\MigrationTool' => __DIR__ . '/addons/migration-tool',
	'StoreEngine\\Addons\\Csv'           => __DIR__ . '/addons/csv',
	'StoreEngine\\Addons\\CatalogMode'   => __DIR__ . '/addons/catalog-mode',
	'StoreEngine\\Addons\\Razorpay'      => __DIR__ . '/addons/razorpay',
	'StoreEngine\\Addons\\Paddle'        => __DIR__ . '/addons/paddle',
];
foreach ( $addons as $ns => $path ) {
	\StoreEngine\Autoload::get_instance()->add_namespace_directory( $ns, $path );
}

// End of file phpstan-bootstrap.php.
