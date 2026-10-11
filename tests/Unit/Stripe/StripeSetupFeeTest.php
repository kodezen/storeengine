<?php
/**
 * Unit tests for native Stripe subscription setup-fee billing.
 *
 * The sibling Paddle bug was a DOUBLE-charge (fee baked into the recurring line
 * AND re-added). Native Stripe has the mirror-image bug: it bills the CLEAN
 * recurring price (the setup fee is stripped from the recurring cart by
 * Subscription\Hooks::set_subscription_prices_for_calculation() under the
 * `recurring_total` calculation), and the checkout flow's one-time-items loop
 * previously *skipped* subscription items entirely — so the setup fee was never
 * collected at all (an under-charge / lost revenue).
 *
 * The fix bills the fee as a one-time `add_invoice_items` line on the
 * subscription's first invoice. SubscriptionSync::build_setup_fee_invoice_item()
 * is the pure seam that decides whether/how to bill it; these tests lock down
 * its contract. The end-to-end wiring (order iteration + Stripe API) is covered
 * by the integration test plan.
 */

namespace StoreEngine\Tests\Unit\Stripe;

use PHPUnit\Framework\TestCase;
use StoreEngine\Addons\Stripe\SubscriptionSync;

class StripeSetupFeeTest extends TestCase {

	public function test_no_fee_flag_returns_null(): void {
		$this->assertNull(
			SubscriptionSync::build_setup_fee_invoice_item( false, 200.0, 'Setup Fee', 1 ),
			'When the line has no setup fee, no invoice-item line should be produced.'
		);
	}

	/**
	 * @dataProvider non_positive_price_provider
	 */
	public function test_non_positive_price_returns_null( float $price ): void {
		$this->assertNull(
			SubscriptionSync::build_setup_fee_invoice_item( true, $price, 'Setup Fee', 1 ),
			'A zero/negative fee price must not produce a charge line (no zero-value invoice items).'
		);
	}

	public function non_positive_price_provider(): array {
		return [ 'zero' => [ 0.0 ], 'negative' => [ -5.0 ] ];
	}

	public function test_builds_line_when_fee_present(): void {
		$item = SubscriptionSync::build_setup_fee_invoice_item( true, 200.0, 'Setup Fee', 1 );

		$this->assertSame(
			[ 'name' => 'Setup Fee', 'amount' => 200.0, 'quantity' => 1 ],
			$item,
			'A present fee must produce a one-time invoice-item line so Stripe bills it on the first invoice.'
		);
	}

	public function test_charges_fee_per_quantity(): void {
		// Fee is stored per-unit and the order subtotal bakes it in × qty, so the
		// one-time line must be charged `quantity` times to reconcile.
		$item = SubscriptionSync::build_setup_fee_invoice_item( true, 200.0, 'Setup Fee', 3 );

		$this->assertSame( 3, $item['quantity'], 'The setup fee is per-unit; the invoice line must use the item quantity to match the order total.' );
		$this->assertSame( 200.0, $item['amount'], 'The per-unit amount is unchanged — quantity does the multiplying.' );
	}

	/**
	 * @dataProvider non_positive_quantity_provider
	 */
	public function test_quantity_is_floored_to_one( int $quantity ): void {
		$item = SubscriptionSync::build_setup_fee_invoice_item( true, 200.0, 'Setup Fee', $quantity );

		$this->assertSame( 1, $item['quantity'], 'A zero/negative quantity must be floored to 1.' );
	}

	public function non_positive_quantity_provider(): array {
		return [ 'zero' => [ 0 ], 'negative' => [ -2 ] ];
	}

	public function test_name_falls_back_when_empty(): void {
		$item = SubscriptionSync::build_setup_fee_invoice_item( true, 200.0, '', 1 );

		$this->assertSame( 'Setup Fee', $item['name'], 'An empty fee name must fall back to "Setup Fee".' );
	}

	public function test_custom_name_is_preserved(): void {
		$item = SubscriptionSync::build_setup_fee_invoice_item( true, 200.0, 'Onboarding', 1 );

		$this->assertSame( 'Onboarding', $item['name'] );
	}

	public function test_amount_is_rounded_to_four_decimals(): void {
		$item = SubscriptionSync::build_setup_fee_invoice_item( true, 9.999949, 'Setup Fee', 1 );

		$this->assertSame( 9.9999, $item['amount'], 'The amount is rounded to 4 dp like the rest of the adapter.' );
	}

	/**
	 * End-to-end reconciliation: for a native Stripe subscription, the recurring
	 * price (clean base) plus the one-time setup-fee invoice line must equal the
	 * order subtotal `(base + fee) × qty` the customer saw at checkout. Pre-fix
	 * the fee line was absent, so the customer under-paid by `fee × qty`.
	 *
	 * @dataProvider reconciliation_provider
	 */
	public function test_first_invoice_reconciles_with_order_subtotal( float $base, float $fee, int $qty ): void {
		$order_subtotal = ( $base + $fee ) * $qty;

		// Recurring line: native Stripe bills the clean base × qty.
		$recurring_total = $base * $qty;

		// One-time setup-fee line built by the seam under test.
		$fee_item  = SubscriptionSync::build_setup_fee_invoice_item( true, $fee, 'Setup Fee', $qty );
		$fee_total = $fee_item['amount'] * $fee_item['quantity'];

		$this->assertEqualsWithDelta(
			$order_subtotal,
			$recurring_total + $fee_total,
			0.0001,
			sprintf( 'First-invoice total must equal the order subtotal for qty %d (base %s + fee %s).', $qty, $base, $fee )
		);
	}

	public function reconciliation_provider(): array {
		return [
			'qty 1' => [ 10.0, 2.0, 1 ],
			'qty 3' => [ 10.0, 2.0, 3 ], // pre-fix: under-charged by 6.00.
			'qty 5' => [ 15.5, 3.25, 5 ],
		];
	}
}
