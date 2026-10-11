<?php
/**
 * Integration-test bootstrap.
 *
 * Runs INSIDE the wp-env tests-cli Docker container. Sets up the
 * WordPress test framework, then activates both StoreEngine plugins
 * during the `muplugins_loaded` phase so every WP hook fires as it
 * would on a real install.
 *
 * Do not run this from the host — there's no WordPress on the host.
 * Always invoke via `npm run test:integration` from the project root,
 * which proxies to `wp-env run tests-cli vendor/bin/phpunit -c
 * phpunit-integration.xml.dist`.
 *
 * Container paths:
 *   - /var/www/html/                                  WordPress root
 *   - /var/www/html/wp-content/plugins/storeengine/   This plugin
 *   - /var/www/html/wp-content/plugins/storeengine-pro/  Pro plugin
 *   - /wordpress-phpunit/includes/                    WP test framework
 *
 * The WP_TESTS_DIR env var (set by wp-env's tests-cli image) points at
 * the WP test framework's includes directory. We respect it if set so
 * future wp-env upgrades can move the framework without breaking us.
 */

$tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $tests_dir ) {
	$tests_dir = '/wordpress-phpunit';
}

if ( ! file_exists( $tests_dir . '/includes/functions.php' ) ) {
	fwrite(
		STDERR,
		"Could not find WP test framework at $tests_dir.\n" .
		"This bootstrap must run inside the wp-env tests-cli container.\n" .
		"From the project root: npm run test:integration\n"
	);
	exit( 1 );
}

require_once $tests_dir . '/includes/functions.php';

/**
 * Load both StoreEngine plugins during the WP test bootstrap's
 * `muplugins_loaded` phase so activation-time hooks (DB schema, option
 * defaults, scheduled actions) all run before the first test executes.
 *
 * Pro plugin is conditional — if someone runs free-plugin tests without
 * pro present, we don't want a hard failure. The free plugin file is
 * required; the pro plugin file is best-effort.
 */
function storeengine_integration_load_plugins(): void {
	require_once '/var/www/html/wp-content/plugins/storeengine/storeengine.php';

	$pro = '/var/www/html/wp-content/plugins/storeengine-pro/storeengine-pro.php';
	if ( file_exists( $pro ) ) {
		require_once $pro;
	}
}

tests_add_filter( 'muplugins_loaded', 'storeengine_integration_load_plugins' );

require_once $tests_dir . '/includes/bootstrap.php';
