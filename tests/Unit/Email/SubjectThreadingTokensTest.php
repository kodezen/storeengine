<?php
/**
 * Threading-safe subject regression guard.
 *
 * Gmail / Outlook / Apple Mail thread emails by (Subject + Sender). When
 * subject lines for per-order emails are identical across orders, every
 * notification collapses into one "conversation" in the admin's inbox —
 * the bug we explicitly fixed earlier in the threading-subject migration.
 *
 * If anyone later "cleans up" a default subject and accidentally removes
 * the {order_id} token, the threading bug silently returns and admins
 * stop seeing distinct order notifications. These tests are the regression
 * fence around that fix.
 *
 * Scope:
 *   - Built-in defaults in Settings::get_settings_default_data() (order_*).
 *   - Per-class defaults registered by individual email classes
 *     (order_payment_failed, subscription_*, trial_ending_soon).
 *
 * Things deliberately NOT tested here:
 *   - password_reset / new_user_notification — they fire per user, not per
 *     order, so subject uniqueness isn't required for threading.
 *   - abandoned_cart_* — at most 3 emails per customer per cart, threading
 *     is actually desirable (related to one abandoned checkout).
 */

namespace StoreEngine\Tests\Unit\Email;

use PHPUnit\Framework\TestCase;
use StoreEngine\Addons\Email\Admin\Settings;
use StoreEngine\Addons\Email\order\PaymentFailed;
use StoreEngine\Addons\Email\subscription\Cancelled;
use StoreEngine\Addons\Email\subscription\Renewed;
use StoreEngine\Addons\Email\subscription\TrialEndingSoon;

class SubjectThreadingTokensTest extends TestCase {

	/**
	 * Built-in defaults that ship inside Settings::get_settings_default_data().
	 *
	 * @dataProvider built_in_subject_provider
	 */
	public function test_built_in_subject_contains_order_id_token( string $key, string $channel ): void {
		$defaults = Settings::get_settings_default_data();

		$this->assertArrayHasKey( $key, $defaults );
		$this->assertArrayHasKey( $channel, $defaults[ $key ] );
		$this->assertArrayHasKey( 'email_subject', $defaults[ $key ][ $channel ] );

		$subject = $defaults[ $key ][ $channel ]['email_subject'];

		$this->assertStringContainsString(
			'{order_id}',
			$subject,
			sprintf(
				"Default subject for %s/%s must contain {order_id} so multiple orders don't thread into one Gmail conversation. Got: %s",
				$key,
				$channel,
				$subject
			)
		);
	}

	public function built_in_subject_provider(): array {
		return [
			'order_confirmation admin'    => [ 'order_confirmation', 'admin' ],
			'order_confirmation customer' => [ 'order_confirmation', 'customer' ],
			'order_status customer'       => [ 'order_status', 'customer' ],
			'order_note customer'         => [ 'order_note', 'customer' ],
			'order_refund customer'       => [ 'order_refund', 'customer' ],
		];
	}

	/**
	 * Per-class defaults registered by the newer email classes via the
	 * `storeengine/email/settings_default_data` filter chain. We hit
	 * default_template() directly rather than running the filter chain
	 * (the bootstrap's apply_filters stub is a no-op), so this test pins
	 * the contract regardless of registration plumbing.
	 *
	 * @dataProvider per_class_subject_provider
	 */
	public function test_per_class_subject_contains_order_id_token( string $class_name, string $channel ): void {
		$this->assertTrue(
			method_exists( $class_name, 'default_template' ),
			"Class $class_name is missing default_template() — every email class must expose its defaults statically so the test suite can verify them without instantiating."
		);

		$template = $class_name::default_template();

		$this->assertArrayHasKey( $channel, $template );
		$this->assertArrayHasKey( 'email_subject', $template[ $channel ] );

		$subject = $template[ $channel ]['email_subject'];

		$this->assertStringContainsString(
			'{order_id}',
			$subject,
			sprintf(
				"%s::default_template()[%s][email_subject] must contain {order_id}. Got: %s",
				$class_name,
				$channel,
				$subject
			)
		);
	}

	public function per_class_subject_provider(): array {
		return [
			'order_payment_failed customer' => [ PaymentFailed::class, 'customer' ],
			'order_payment_failed admin'    => [ PaymentFailed::class, 'admin' ],
			'subscription_cancelled'        => [ Cancelled::class, 'customer' ],
			'subscription_renewed'          => [ Renewed::class, 'customer' ],
			'trial_ending_soon'             => [ TrialEndingSoon::class, 'customer' ],
		];
	}
}
