<?php
/**
 * Change payment method: when the action is offered, and which saved payment method is current.
 */

namespace StoreEngine\Tests\Unit\Subscription;

use PHPUnit\Framework\TestCase;
use StoreEngine\Addons\Subscription\Classes\PaymentMethodChange;

class PaymentMethodChangeRulesTest extends TestCase {

	/**
	 * @dataProvider support_provider
	 */
	public function test_gateway_support_rule( bool $customer_change, bool $tokenization, bool $handler, bool $expected ): void {
		$this->assertSame( $expected, PaymentMethodChange::is_supported( $customer_change, $tokenization, $handler ) );
	}

	public function support_provider(): array {
		return [
			'saved-card gateway with a handler'      => [ true, true, true, true ],
			'no customer change support'             => [ false, true, true, false ],
			'hosted/redirect gateway (no saved methods)' => [ true, false, true, false ],
			'no handler registered for the gateway'  => [ true, true, false, false ],
			'offline gateway'                        => [ false, false, false, false ],
		];
	}

	/**
	 * @dataProvider status_provider
	 */
	public function test_allowed_statuses( string $status, bool $expected ): void {
		$this->assertSame( $expected, PaymentMethodChange::is_allowed_status( $status ) );
	}

	public function status_provider(): array {
		return [
			'active'         => [ 'active', true ],
			'on hold'        => [ 'on_hold', true ],
			'pending cancel' => [ 'pending_cancel', true ],
			'cancelled'      => [ 'cancelled', false ],
			'expired'        => [ 'expired', false ],
			'pending'        => [ 'pending', false ],
		];
	}

	public function test_source_id_identifies_current_token(): void {
		$tokens = [
			[ 'id' => 11, 'token' => 'pm_old' ],
			[ 'id' => 12, 'token' => 'pm_new' ],
		];

		$this->assertSame( 12, PaymentMethodChange::resolve_current_token_id( [ 11 ], $tokens, 'pm_new' ), 'The source the renewal charges wins over the stored token id.' );
	}

	public function test_falls_back_to_latest_stored_token_id(): void {
		$tokens = [
			[ 'id' => 11, 'token' => 'pm_a' ],
			[ 'id' => 12, 'token' => 'pm_b' ],
		];

		$this->assertSame( 12, PaymentMethodChange::resolve_current_token_id( [ 11, 12 ], $tokens, '' ) );
		$this->assertSame( 11, PaymentMethodChange::resolve_current_token_id( [ 99, 11 ], $tokens, 'pm_gone' ) );
	}

	public function test_unknown_when_nothing_matches(): void {
		$this->assertSame( 0, PaymentMethodChange::resolve_current_token_id( [ 5 ], [ [ 'id' => 11, 'token' => 'pm_a' ] ], 'pm_x' ) );
		$this->assertSame( 0, PaymentMethodChange::resolve_current_token_id( [], [], '' ) );
	}
}
