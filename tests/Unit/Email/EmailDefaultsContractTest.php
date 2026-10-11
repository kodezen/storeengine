<?php
/**
 * Contract test for the `register_defaults` pattern shared by every new
 * email class.
 *
 * Each class registers its default subject/heading/content into the
 * email-addon settings array via:
 *
 *     add_filter(
 *         'storeengine/email/settings_default_data',
 *         [ MyEmail::class, 'register_defaults' ]
 *     );
 *
 * The contract is small but load-bearing:
 *
 *   (a) register_defaults() ADDS the class's key when the array doesn't
 *       have one yet (otherwise the filter does nothing and the email's
 *       toggle/subject never appears in the admin UI).
 *
 *   (b) register_defaults() PRESERVES existing data when the key is
 *       already there (otherwise every save_settings() call on an existing
 *       install silently wipes the customer's edited subject — the
 *       worst-case failure mode for this pattern, exactly the kind of bug
 *       the Settings migration test also guards).
 *
 *   (c) default_template() returns the expected SHAPE — `customer` (or
 *       `admin`) channel with `is_enable`/`email_subject`/`email_heading`/
 *       `email_content`. Without this, the template loops in the
 *       PostHandler classes would explode on a partial row.
 *
 * One parameterized test method per contract, one row per email class.
 * Adding a new email class is one row in the provider — the test will
 * catch the missing pattern automatically.
 */

namespace StoreEngine\Tests\Unit\Email;

use PHPUnit\Framework\TestCase;
use StoreEngine\Addons\Email\account\PasswordReset;
use StoreEngine\Addons\Email\order\PaymentFailed;
use StoreEngine\Addons\Email\subscription\Cancelled;
use StoreEngine\Addons\Email\subscription\Renewed;
use StoreEngine\Addons\Email\subscription\TrialEndingSoon;

class EmailDefaultsContractTest extends TestCase {

	/**
	 * @dataProvider email_class_provider
	 */
	public function test_register_defaults_adds_key_when_missing( string $class_name, string $settings_key ): void {
		$result = $class_name::register_defaults( [] );

		$this->assertArrayHasKey(
			$settings_key,
			$result,
			"$class_name::register_defaults() must add its `$settings_key` key to an empty defaults array — otherwise the email never registers and the admin UI never sees it."
		);
	}

	/**
	 * The customer-data-safety guarantee — the single most important
	 * invariant in this entire test suite, because a regression here
	 * silently rewrites every customer's edited templates on upgrade.
	 *
	 * @dataProvider email_class_provider
	 */
	public function test_register_defaults_preserves_existing_data( string $class_name, string $settings_key ): void {
		$sentinel = [
			$settings_key => [
				'customer' => [
					'is_enable'     => false,
					'email_subject' => '__customized_sentinel__',
					'email_heading' => '__sentinel_heading__',
					'email_content' => '<p>__sentinel_content__</p>',
				],
			],
		];

		$result = $class_name::register_defaults( $sentinel );

		$this->assertSame(
			$sentinel[ $settings_key ],
			$result[ $settings_key ],
			"$class_name::register_defaults() must NOT overwrite an existing `$settings_key` entry. Overwriting customer-customized templates on every save_settings() call is the worst-case failure mode for this pattern."
		);
	}

	/**
	 * @dataProvider email_class_provider
	 */
	public function test_default_template_returns_complete_shape( string $class_name, string $settings_key ): void {
		$template = $class_name::default_template();

		$this->assertIsArray( $template, "$class_name::default_template() must return an array." );

		// Every template has at least the `customer` channel. (Some also
		// have an `admin` channel — we don't enforce that here because not
		// all emails go to admins.)
		$this->assertArrayHasKey(
			'customer',
			$template,
			"$class_name::default_template() must include a 'customer' channel — without it the post-handler's get_settings('customer') call returns false and the email silently disables itself."
		);

		foreach ( [ 'is_enable', 'email_subject', 'email_heading', 'email_content' ] as $required_field ) {
			$this->assertArrayHasKey(
				$required_field,
				$template['customer'],
				"$class_name::default_template()['customer'] must include the '$required_field' key — the Email trait's get_the_email_body() reads it without a fallback."
			);
		}

		$this->assertIsBool(
			$template['customer']['is_enable'],
			"$class_name::default_template()['customer']['is_enable'] must be a boolean."
		);
		$this->assertNotEmpty(
			$template['customer']['email_subject'],
			"$class_name::default_template()['customer']['email_subject'] must not be empty."
		);
	}

	public function email_class_provider(): array {
		return [
			'order_payment_failed'    => [ PaymentFailed::class, 'order_payment_failed' ],
			'password_reset'          => [ PasswordReset::class, 'password_reset' ],
			'subscription_cancelled'  => [ Cancelled::class, 'subscription_cancelled' ],
			'subscription_renewed'    => [ Renewed::class, 'subscription_renewed' ],
			'trial_ending_soon'       => [ TrialEndingSoon::class, 'trial_ending_soon' ],
		];
	}
}
