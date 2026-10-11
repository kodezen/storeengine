<?php
/**
 * Coupon::is_valid_for_product() must match every product/price a multi-product
 * coupon targets, regardless of whether the stored ids are ints or numeric
 * strings.
 *
 * Regression guard for: "coupon works on the first product but not the second."
 * That happened when product 1 used "All prices" (always valid) while product 2
 * targeted a specific price whose id was stored as a string — the old strict
 * in_array(..., true) matched the int cart price against a string and failed
 * only on the second line.
 *
 * @package StoreEngine\Tests\Unit\Coupon
 */

namespace StoreEngine\Tests\Unit\Coupon;

use PHPUnit\Framework\TestCase;
use ReflectionClass;
use StoreEngine\Classes\Coupon;

class ValidForProductTest extends TestCase {

	/**
	 * Build a coupon with the given `coupon_valid_prices` restriction rows.
	 *
	 * @param array $valid_prices
	 *
	 * @return Coupon
	 */
	private function couponWithValidPrices( array $valid_prices ): Coupon {
		$coupon   = new Coupon();
		$settings = ( new ReflectionClass( Coupon::class ) )->getProperty( 'settings' );
		$settings->setAccessible( true );
		$settings->setValue( $coupon, [
			'coupon_type'         => 'percentage',
			'coupon_amount'       => '10',
			'coupon_valid_prices' => $valid_prices,
		] );

		return $coupon;
	}

	public function test_int_ids_all_products_match(): void {
		$coupon = $this->couponWithValidPrices( [
			[ 'product_id' => 742, 'price_ids' => [] ],
			[ 'product_id' => 744, 'price_ids' => [] ],
		] );

		$this->assertTrue( $coupon->is_valid_for_product( 742, 10, null ) );
		$this->assertTrue( $coupon->is_valid_for_product( 744, 20, null ) );
	}

	public function test_string_product_ids_still_match(): void {
		$coupon = $this->couponWithValidPrices( [
			[ 'product_id' => '742', 'price_ids' => [] ],
			[ 'product_id' => '744', 'price_ids' => [] ],
		] );

		$this->assertTrue( $coupon->is_valid_for_product( 742, 10, null ) );
		$this->assertTrue( $coupon->is_valid_for_product( 744, 20, null ) );
	}

	/**
	 * The exact "second product doesn't work" case: product 1 = all prices,
	 * product 2 = a specific price stored as a numeric string.
	 */
	public function test_string_specific_price_on_second_product_matches(): void {
		$coupon = $this->couponWithValidPrices( [
			[ 'product_id' => 742, 'price_ids' => [] ],
			[ 'product_id' => 744, 'price_ids' => [ '20' ] ],
		] );

		$this->assertTrue( $coupon->is_valid_for_product( 742, 10, null ), 'First product (all prices) is valid.' );
		$this->assertTrue( $coupon->is_valid_for_product( 744, 20, null ), 'Second product with a matching (string) price id is valid.' );
	}

	/**
	 * Single row, single specific price, matching cart price → valid.
	 */
	public function test_single_specific_price_matches(): void {
		$coupon = $this->couponWithValidPrices( [
			[ 'product_id' => 744, 'price_ids' => [ 120 ] ],
		] );

		$this->assertTrue( $coupon->is_valid_for_product( 744, 120, null ) );
	}

	/**
	 * The "same product added multiple times with different prices" case: the
	 * product is listed in two rows, each targeting a different price. A cart
	 * item at the SECOND row's price must still validate — the matcher must not
	 * stop at the first product-id match whose price didn't line up.
	 */
	public function test_same_product_multiple_rows_second_price_matches(): void {
		$coupon = $this->couponWithValidPrices( [
			[ 'product_id' => 744, 'price_ids' => [ 118 ] ],
			[ 'product_id' => 744, 'price_ids' => [ 120 ] ],
		] );

		$this->assertTrue( $coupon->is_valid_for_product( 744, 118, null ), 'First row price matches.' );
		$this->assertTrue( $coupon->is_valid_for_product( 744, 120, null ), 'Second row price matches (regression: matcher no longer breaks on the first row).' );
		$this->assertFalse( $coupon->is_valid_for_product( 744, 999, null ), 'A price in neither row is rejected.' );
	}

	public function test_specific_price_mismatch_is_rejected(): void {
		$coupon = $this->couponWithValidPrices( [
			[ 'product_id' => 744, 'price_ids' => [ 20 ] ],
		] );

		$this->assertFalse( $coupon->is_valid_for_product( 744, 99, null ), 'A non-listed price for the product is rejected.' );
	}

	public function test_unlisted_product_is_rejected(): void {
		$coupon = $this->couponWithValidPrices( [
			[ 'product_id' => 742, 'price_ids' => [] ],
		] );

		$this->assertFalse( $coupon->is_valid_for_product( 999, 1, null ), 'A product not in the coupon is rejected.' );
	}
}
