<?php
/**
 * Integration smoke test.
 *
 * If this passes, the wp-env Docker stack is up, WordPress's test
 * framework loaded, our integration bootstrap ran, and both plugins are
 * activated with their classes/tables in place. If THIS fails, every
 * other integration test will fail with confusing errors — so this is
 * the first test to run and the first to fix when the suite goes red.
 *
 * Deliberately makes only the cheapest, most-reliable assertions. The
 * point is to isolate environmental problems from logic problems.
 */

namespace StoreEngine\Tests\Integration\Smoke;

use WP_UnitTestCase;

class EnvironmentTest extends WP_UnitTestCase {

	public function test_wordpress_is_loaded(): void {
		$this->assertTrue(
			function_exists( 'wp_loaded' ),
			'wp_loaded() should be defined. If this fails, the WP test framework bootstrap did not run.'
		);

		$this->assertNotEmpty(
			home_url(),
			'home_url() should return a non-empty value. If this fails, WP is loaded but options are not.'
		);
	}

	public function test_storeengine_plugin_is_active(): void {
		$this->assertTrue(
			class_exists( '\\StoreEngine' ),
			'\\StoreEngine class should be loaded — this is the free plugin\'s main class. If this fails, the muplugins_loaded hook in integration-bootstrap.php is not requiring storeengine.php correctly.'
		);
	}

	public function test_wpdb_works(): void {
		global $wpdb;

		$this->assertNotEmpty( $wpdb, '$wpdb global should be available inside WP_UnitTestCase.' );
		$this->assertSame(
			1,
			(int) $wpdb->get_var( 'SELECT 1' ),
			'$wpdb should be able to execute a trivial query. If this fails, the test DB is not initialised.'
		);
	}
}
