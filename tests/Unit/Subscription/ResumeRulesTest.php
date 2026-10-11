<?php
/**
 * Resume after cancel: a customer who cancelled (pending_cancel) can resume while the
 * prepaid term runs, for any gateway, and the next renewal goes back to the end of that term.
 */

namespace StoreEngine\Tests\Unit\Subscription;

use PHPUnit\Framework\TestCase;
use StoreEngine\Addons\Subscription\Classes\Subscription;

if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
	define( 'HOUR_IN_SECONDS', 3600 );
}

if ( ! defined( 'DAY_IN_SECONDS' ) ) {
	define( 'DAY_IN_SECONDS', 86400 );
}

class ResumeRulesTest extends TestCase {

	private int $now = 1_800_000_000;

	public function test_pending_cancel_with_future_end_can_resume(): void {
		$this->assertTrue( Subscription::can_resume_from_pending_cancel( 'pending_cancel', $this->now + DAY_IN_SECONDS, $this->now ) );
	}

	public function test_pending_cancel_after_term_ended_can_not_resume(): void {
		$this->assertFalse( Subscription::can_resume_from_pending_cancel( 'pending_cancel', $this->now - 1, $this->now ) );
		$this->assertFalse( Subscription::can_resume_from_pending_cancel( 'pending_cancel', $this->now, $this->now ) );
		$this->assertFalse( Subscription::can_resume_from_pending_cancel( 'pending_cancel', 0, $this->now ), 'No end date means nothing to resume into.' );
	}

	/**
	 * @dataProvider other_status_provider
	 */
	public function test_other_statuses_are_not_a_resume( string $status ): void {
		$this->assertFalse( Subscription::can_resume_from_pending_cancel( $status, $this->now + DAY_IN_SECONDS, $this->now ) );
	}

	public function other_status_provider(): array {
		return [
			'active'    => [ 'active' ],
			'on hold'   => [ 'on_hold' ],
			'cancelled' => [ 'cancelled' ],
			'expired'   => [ 'expired' ],
		];
	}

	public function test_next_payment_is_restored_to_end_of_prepaid_term(): void {
		$term_end = $this->now + 10 * DAY_IN_SECONDS;

		$this->assertSame( $term_end, Subscription::resolve_resume_next_payment_time( $term_end, 0, $this->now ) );
	}

	public function test_next_payment_kept_when_plan_ends_later(): void {
		$term_end = $this->now + 10 * DAY_IN_SECONDS;

		$this->assertSame( $term_end, Subscription::resolve_resume_next_payment_time( $term_end, $term_end + 30 * DAY_IN_SECONDS, $this->now ) );
	}

	public function test_no_renewal_when_the_plan_ends_at_the_term_end(): void {
		$term_end = $this->now + 10 * DAY_IN_SECONDS;

		$this->assertSame( 0, Subscription::resolve_resume_next_payment_time( $term_end, $term_end, $this->now ), 'A fixed-length plan ending with this term has no renewal left.' );
		$this->assertSame( 0, Subscription::resolve_resume_next_payment_time( $term_end, $term_end + HOUR_IN_SECONDS, $this->now ) );
	}

	public function test_past_term_end_falls_back_to_calculation(): void {
		$this->assertSame( 0, Subscription::resolve_resume_next_payment_time( $this->now - 1, 0, $this->now ) );
	}
}
