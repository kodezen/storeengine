<?php
/**
 * Unit tests for the Paddle subscription setup-fee line.
 *
 * IMPORTANT — the runtime fact these tests encode (verified live against the
 * cart + checkout-service, not assumed):
 *
 *   The subscription setup fee is NOT baked into the per-item `line_subtotal`
 *   (nor the order item's `subtotal`). Those carry the CLEAN recurring amount
 *   (e.g. 100). The fee (e.g. 10) surfaces only in the cart's AGGREGATE subtotal
 *   and is billed to Paddle as its own one-time line. Subscriptions are always
 *   quantity 1 (Subscription\Hooks::set_add_to_cart_item_quantity()).
 *
 * So the recurring unit price is sent as-is and the fee is ADDED once — there is
 * nothing to "strip out". An earlier revision subtracted the fee from the
 * recurring line on the false premise that it was baked in; that under-charged
 * the first payment (100 → 90). These tests lock the corrected behaviour.
 *
 * Pure-PHP suite: build_setup_fee_item() is invoked via reflection with a
 * zero-decimal currency (JPY) so get_paddle_amount() reduces to absint(round())
 * — no WP/Formatting environment required.
 */

namespace StoreEngine\Tests\Unit\Paddle;

use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use StoreEngine\Addons\Paddle\PaddleService;

class PaddleSetupFeeTest extends TestCase {

	/**
	 * Invoke the private static build_setup_fee_item() via reflection.
	 */
	private function build_setup_fee_item(
		string $fee_name,
		float $fee_price,
		string $product_name = 'Widget',
		string $tax_mode = 'internal',
		$tax_category = 'standard',
		string $currency = 'JPY'
	): array {
		$method = new ReflectionMethod( PaddleService::class, 'build_setup_fee_item' );
		$method->setAccessible( true );

		return $method->invoke( null, $fee_name, $fee_price, $product_name, $tax_mode, $tax_category, $currency );
	}

	public function test_setup_fee_line_is_always_quantity_one(): void {
		$item = $this->build_setup_fee_item( 'Setup Fee', 10.0 );

		$this->assertSame(
			1,
			$item['quantity'],
			'Subscriptions are quantity 1 and the fee is billed once — the setup-fee line must be quantity 1.'
		);
	}

	public function test_setup_fee_line_is_one_time_never_recurring(): void {
		$item = $this->build_setup_fee_item( 'Setup Fee', 10.0 );

		$this->assertArrayNotHasKey(
			'billing_cycle',
			$item['price'],
			'The setup fee line must NOT carry a billing_cycle — a recurring fee here would leak onto every renewal.'
		);
	}

	public function test_setup_fee_amount_uses_the_line_currency(): void {
		// JPY is zero-decimal: the amount must NOT be multiplied by 100.
		$item = $this->build_setup_fee_item( 'Setup Fee', 10.0, 'Widget', 'internal', 'standard', 'JPY' );

		$this->assertSame( '10', $item['price']['unit_price']['amount'], 'A zero-decimal currency (JPY) must send the raw integer amount, not amount × 100.' );
		$this->assertSame( 'JPY', $item['price']['unit_price']['currency_code'], 'The line currency must be echoed back on the price.' );
	}

	public function test_setup_fee_name_falls_back_when_empty(): void {
		$item = $this->build_setup_fee_item( '', 10.0 );

		$this->assertSame( 'Setup Fee', $item['price']['name'], 'Paddle rejects an empty price name — an empty fee name must fall back to "Setup Fee".' );
	}

	public function test_setup_fee_custom_name_is_preserved(): void {
		$item = $this->build_setup_fee_item( 'Onboarding', 10.0, 'Widget' );

		$this->assertSame( 'Onboarding', $item['price']['name'] );
		$this->assertSame( 'Widget — Onboarding', $item['price']['product']['name'], 'The Paddle product name combines the product and fee names.' );
	}

	/**
	 * End-to-end reconciliation for a subscription (qty 1): the recurring line
	 * (clean base, sent as-is) plus the one-time setup-fee line must equal the
	 * price + fee the customer expects. The recurring line is NEVER reduced by
	 * the fee — that was the 100 → 90 under-charge bug.
	 *
	 * @dataProvider reconciliation_provider
	 */
	public function test_paddle_total_is_base_plus_fee( float $base, float $fee ): void {
		// The recurring line carries the clean base (line_subtotal / qty, qty 1);
		// the adapter sends it unchanged — model that as get_paddle_amount(base).
		$recurring = PaddleService::get_paddle_amount( $base, 'JPY' );

		$fee_item  = $this->build_setup_fee_item( 'Setup Fee', $fee, 'Widget', 'internal', 'standard', 'JPY' );
		$fee_total = (int) $fee_item['price']['unit_price']['amount'] * $fee_item['quantity'];

		$this->assertSame(
			(int) round( $base + $fee ),
			$recurring + $fee_total,
			sprintf( 'First payment must equal base %s + fee %s — the recurring line must NOT be reduced by the fee.', $base, $fee )
		);
	}

	public function reconciliation_provider(): array {
		return [
			'100 + 10' => [ 100.0, 10.0 ], // the user-reported case: must be 110, not 90.
			'49 + 9'   => [ 49.0, 9.0 ],
			'1500 + 0' => [ 1500.0, 0.0 ],
		];
	}
}
