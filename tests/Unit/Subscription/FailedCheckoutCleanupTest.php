<?php
/**
 * Failed first payment: subscriptions a failed checkout created are removed only when they never had a
 * successful payment, and gateway results that report a failure trigger the cleanup.
 */

namespace StoreEngine\Tests\Unit\Subscription;

use PHPUnit\Framework\TestCase;
use StoreEngine\Addons\Subscription\Events\CreateSubscription;
use StoreEngine\Classes\CheckoutService;

class FailedCheckoutCleanupTest extends TestCase {

	/**
	 * @dataProvider unpaid_status_provider
	 */
	public function test_unpaid_new_subscription_is_removed( string $status ): void {
		$this->assertTrue( CreateSubscription::should_remove_after_failed_checkout( $status, 'failed', false, 0 ) );
		$this->assertTrue( CreateSubscription::should_remove_after_failed_checkout( $status, 'unpaid', false, 0 ) );
	}

	public function unpaid_status_provider(): array {
		return [
			'on hold (created state)' => [ 'on_hold' ],
			'pending'                 => [ 'pending' ],
		];
	}

	public function test_paid_order_keeps_subscription(): void {
		$this->assertFalse( CreateSubscription::should_remove_after_failed_checkout( 'on_hold', 'unpaid', true, 0 ) );
	}

	public function test_paid_subscription_is_kept(): void {
		$this->assertFalse( CreateSubscription::should_remove_after_failed_checkout( 'on_hold', 'paid', false, 0 ) );
	}

	public function test_subscription_with_renewals_is_kept(): void {
		$this->assertFalse( CreateSubscription::should_remove_after_failed_checkout( 'on_hold', 'failed', false, 1 ) );
	}

	/**
	 * @dataProvider live_status_provider
	 */
	public function test_live_or_ended_subscription_is_kept( string $status ): void {
		$this->assertFalse( CreateSubscription::should_remove_after_failed_checkout( $status, 'unpaid', false, 0 ) );
	}

	public function live_status_provider(): array {
		return [
			'active'         => [ 'active' ],
			'pending cancel' => [ 'pending_cancel' ],
			'cancelled'      => [ 'cancelled' ],
		];
	}

	public function test_failed_gateway_results(): void {
		$this->assertTrue( CheckoutService::is_failed_payment_result( [ 'result' => 'failure' ] ) );
		$this->assertTrue( CheckoutService::is_failed_payment_result( [ 'result' => 'fail', 'message' => 'Declined' ] ) );
		$this->assertFalse( CheckoutService::is_failed_payment_result( [ 'result' => 'success', 'redirect' => '/thanks' ] ) );
		$this->assertFalse( CheckoutService::is_failed_payment_result( [] ) );
		$this->assertFalse( CheckoutService::is_failed_payment_result( null ) );
	}
}
