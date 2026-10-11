<?php
/**
 * Regression tests for the email-settings threading-safe-subject migration.
 *
 * This migration runs on *every* StoreEngine install upgrade via
 * Settings::save_settings(), so a regression here would silently rewrite
 * subject lines on customer sites — the highest-blast-radius logic we
 * ship. Three tests pin the contract:
 *
 *   - exact-match old defaults get upgraded (the happy path)
 *   - anything else is left alone (the customization-safety guarantee)
 *   - running the migration twice is a no-op (idempotence)
 *
 * The migration is `protected`; we reach it via ReflectionMethod rather
 * than weaken visibility on production code.
 */

namespace StoreEngine\Tests\Unit\Email;

use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use StoreEngine\Addons\Email\Admin\Settings;

class SettingsMigrationTest extends TestCase {

	/**
	 * @var ReflectionMethod
	 */
	private ReflectionMethod $migrate;

	protected function setUp(): void {
		parent::setUp();

		// The migration is `protected static`. We bypass visibility once
		// here in setUp and reuse the reflection across each test —
		// repeating the reflection dance in every test obscures intent.
		if ( ! class_exists( Settings::class ) ) {
			require_once dirname( __DIR__, 3 ) . '/addons/email/admin/settings.php';
		}

		$this->migrate = new ReflectionMethod( Settings::class, 'migrate_threading_safe_subjects' );
		$this->migrate->setAccessible( true );
	}

	/**
	 * @param array $input
	 * @return array
	 */
	private function run_migration( array $input ): array {
		return $this->migrate->invokeArgs( null, [ $input ] );
	}

	public function test_upgrades_exact_match_old_default_subjects(): void {
		$result = $this->run_migration( [
			'order_confirmation' => [
				'admin'    => [ 'email_subject' => 'A new order placed' ],
				'customer' => [ 'email_subject' => 'Your order has been placed' ],
			],
			'order_status'       => [
				'customer' => [ 'email_subject' => 'Your order status has been changed' ],
			],
		] );

		$this->assertSame(
			'New order #{order_id} placed',
			$result['order_confirmation']['admin']['email_subject'],
			'Exact match of the historic admin default should upgrade to the {order_id}-tokenized version.'
		);
		$this->assertSame(
			'Your order #{order_id} has been placed',
			$result['order_confirmation']['customer']['email_subject'],
		);
		$this->assertSame(
			'Your order #{order_id} status has been changed',
			$result['order_status']['customer']['email_subject'],
		);
	}

	public function test_preserves_user_customizations(): void {
		$customized = [
			'order_confirmation' => [
				'admin'    => [ 'email_subject' => 'Howdy — order arrived!' ],
				'customer' => [ 'email_subject' => 'Thanks for your order' ],
			],
			'order_status'       => [
				'customer' => [ 'email_subject' => 'Update on order #{order_id}' ],
			],
		];

		$result = $this->run_migration( $customized );

		$this->assertSame(
			$customized,
			$result,
			'Subjects that do not exactly match the historic default must be passed through untouched — overwriting a customization is the worst-case failure mode for this migration.'
		);
	}

	public function test_migration_is_idempotent(): void {
		$initial = [
			'order_confirmation' => [
				'admin'    => [ 'email_subject' => 'A new order placed' ],
				'customer' => [ 'email_subject' => 'Your order has been placed' ],
			],
			'order_status'       => [
				'customer' => [ 'email_subject' => 'Your order status has been changed' ],
			],
		];

		$after_first  = $this->run_migration( $initial );
		$after_second = $this->run_migration( $after_first );

		$this->assertSame(
			$after_first,
			$after_second,
			'Running the migration twice must produce identical output — once upgraded, the new subject no longer matches the old default and the second run is a no-op.'
		);
	}
}
