<?php
/**
 * Utilities for dealing with product quantities and units of measure.
 */

namespace StoreEngine\Utils;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Quantity and unit-of-measure helper.
 *
 * Quantities are stored as DECIMAL(15,3) so goods that are weighed or measured
 * rather than counted (0.750 kg of rice, 1.35 m of cable) can be stocked and
 * sold. Products default to `each`, which behaves exactly as before this
 * existed: whole numbers only, formatted without a unit suffix.
 *
 * Every quantity entering the system should pass through Quantity::parse() so
 * it is clamped to the product's step and to the column's 3-decimal scale.
 */
final class Quantity {

	/**
	 * How a product is sold.
	 */
	public const SELL_BY_EACH   = 'each';
	public const SELL_BY_WEIGHT = 'weight';
	public const SELL_BY_VOLUME = 'volume';
	public const SELL_BY_LENGTH = 'length';

	/**
	 * Decimal places available in the quantity columns. Matches DECIMAL(15,3).
	 */
	public const SCALE = 3;

	public const META_SELL_BY         = '_storeengine_sell_by';
	public const META_UNIT            = '_storeengine_unit';
	public const META_STEP            = '_storeengine_qty_step';
	public const META_PURCHASE_UNIT   = '_storeengine_purchase_unit';
	public const META_PURCHASE_FACTOR = '_storeengine_purchase_factor';

	/**
	 * Supported sell-by modes.
	 *
	 * @return array<string, string> mode => label.
	 */
	public static function sell_by_modes(): array {
		return [
			self::SELL_BY_EACH   => __( 'Each (whole units)', 'storeengine' ),
			self::SELL_BY_WEIGHT => __( 'By weight', 'storeengine' ),
			self::SELL_BY_VOLUME => __( 'By volume', 'storeengine' ),
			self::SELL_BY_LENGTH => __( 'By length', 'storeengine' ),
		];
	}

	/**
	 * Units available per sell-by mode.
	 *
	 * @return array<string, array<string, string>> mode => [ unit => label ].
	 */
	public static function units(): array {
		$units = [
			self::SELL_BY_EACH   => [
				'pcs'  => __( 'Piece', 'storeengine' ),
				'pack' => __( 'Pack', 'storeengine' ),
				'box'  => __( 'Box', 'storeengine' ),
			],
			self::SELL_BY_WEIGHT => [
				'kg' => __( 'Kilogram', 'storeengine' ),
				'g'  => __( 'Gram', 'storeengine' ),
				'lb' => __( 'Pound', 'storeengine' ),
				'oz' => __( 'Ounce', 'storeengine' ),
			],
			self::SELL_BY_VOLUME => [
				'l'  => __( 'Litre', 'storeengine' ),
				'ml' => __( 'Millilitre', 'storeengine' ),
			],
			self::SELL_BY_LENGTH => [
				'm'  => __( 'Metre', 'storeengine' ),
				'cm' => __( 'Centimetre', 'storeengine' ),
				'ft' => __( 'Foot', 'storeengine' ),
			],
		];

		/**
		 * Filter the units available for each sell-by mode.
		 *
		 * @param array<string, array<string, string>> $units
		 */
		return apply_filters( 'storeengine/quantity/units', $units );
	}

	/**
	 * How the given product is sold. Falls back to `each`.
	 *
	 * @param int $product_id Product or variation parent id.
	 */
	public static function sell_by( int $product_id ): string {
		if ( ! $product_id ) {
			return self::SELL_BY_EACH;
		}

		$mode = get_post_meta( $product_id, self::META_SELL_BY, true );

		if ( ! is_string( $mode ) || ! array_key_exists( $mode, self::sell_by_modes() ) ) {
			return self::SELL_BY_EACH;
		}

		return $mode;
	}

	/**
	 * Whether the product accepts fractional quantities.
	 */
	public static function is_fractional( int $product_id ): bool {
		return self::SELL_BY_EACH !== self::sell_by( $product_id );
	}

	/**
	 * Unit symbol for the product, e.g. `kg`. Empty string for `each`, which is
	 * displayed without a suffix.
	 */
	public static function unit( int $product_id ): string {
		$mode = self::sell_by( $product_id );

		if ( self::SELL_BY_EACH === $mode ) {
			return '';
		}

		$unit  = (string) get_post_meta( $product_id, self::META_UNIT, true );
		$valid = self::units()[ $mode ] ?? [];

		if ( '' === $unit || ! array_key_exists( $unit, $valid ) ) {
			// First unit of the mode is the sensible default (kg, l, m).
			$unit = (string) array_key_first( $valid );
		}

		return $unit;
	}

	/**
	 * Decimal places to display and accept for this product.
	 */
	public static function decimals( int $product_id ): int {
		return self::is_fractional( $product_id ) ? self::SCALE : 0;
	}

	/**
	 * Smallest sellable increment. Defaults to 1 for counted goods and 0.001
	 * for measured goods, but a merchant can set e.g. 0.25 for quarter-kilos.
	 */
	public static function step( int $product_id ): float {
		$step = get_post_meta( $product_id, self::META_STEP, true );

		if ( is_numeric( $step ) && (float) $step > 0 ) {
			return self::round( (float) $step );
		}

		return self::is_fractional( $product_id ) ? 0.001 : 1.0;
	}

	/**
	 * Round to the quantity column's scale.
	 *
	 * Always use this before comparing or persisting a computed quantity —
	 * binary floats make 0.1 + 0.2 !== 0.3, and an unrounded value silently
	 * truncates on insert into DECIMAL(15,3).
	 */
	public static function round( float $qty, ?int $decimals = null ): float {
		return NumberUtil::round( $qty, null === $decimals ? self::SCALE : $decimals );
	}

	/**
	 * Normalise any incoming quantity into a storable float.
	 *
	 * Non-numeric input becomes 0. When a product is given, the value is
	 * snapped to that product's step and, for counted goods, floored to a whole
	 * number so `each` products can never acquire a fraction.
	 *
	 * @param mixed $value      Raw quantity from a request, import or cart.
	 * @param int   $product_id Optional product to take step/mode from.
	 */
	public static function parse( $value, int $product_id = 0 ): float {
		if ( is_string( $value ) ) {
			// Tolerate "1,5" from locales that type a comma decimal separator.
			$value = str_replace( ',', '.', trim( $value ) );
		}

		if ( ! is_numeric( $value ) ) {
			return 0.0;
		}

		$qty = (float) $value;

		if ( ! $product_id ) {
			return self::round( $qty );
		}

		if ( ! self::is_fractional( $product_id ) ) {
			// Counted goods stay whole. Truncate toward zero so a stray 2.9
			// cannot silently become 3 items.
			return (float) (int) $qty;
		}

		$step = self::step( $product_id );

		if ( $step > 0 ) {
			$qty = round( $qty / $step ) * $step;
		}

		return self::round( $qty );
	}

	/**
	 * REST sanitize callback for quantity fields.
	 *
	 * The float equivalent of absint(): non-negative, and clamped to the
	 * column's scale. Product context is not available at sanitize time, so
	 * per-product step snapping happens later in set_quantity()/adjust_stock().
	 *
	 * @param mixed $value Raw request value.
	 */
	public static function sanitize( $value ): float {
		return max( 0, self::parse( $value ) );
	}

	/**
	 * Human-readable quantity, e.g. `1.35 kg` or `3`.
	 *
	 * Trailing zeros are trimmed so 1.500 kg reads as 1.5 kg.
	 */
	public static function format( float $qty, int $product_id = 0 ): string {
		$decimals = self::decimals( $product_id );

		if ( $decimals > 0 ) {
			$formatted = rtrim( rtrim( number_format( $qty, $decimals, '.', '' ), '0' ), '.' );

			if ( '' === $formatted || '-' === $formatted ) {
				$formatted = '0';
			}
		} else {
			$formatted = number_format( $qty, 0, '.', '' );
		}

		$unit = self::unit( $product_id );

		return '' === $unit ? $formatted : $formatted . ' ' . $unit;
	}

	/**
	 * Convert a quantity expressed in the product's *purchase* unit into stock
	 * units.
	 *
	 * Receiving is done in the unit a supplier ships in — a carton, a sack, a
	 * case — while stock is held in the unit the shop sells in. A carton of 20
	 * strips of 10 tablets has a factor of 200: receiving 1 carton adds 200
	 * tablets. Factor defaults to 1, i.e. purchase unit == stock unit.
	 */
	public static function to_stock_units( float $qty, int $product_id ): float {
		return self::round( $qty * self::purchase_factor( $product_id ) );
	}

	/**
	 * Convert stock units back into the purchase unit, for supplier-facing
	 * documents such as purchase orders and return notes.
	 */
	public static function to_purchase_units( float $qty, int $product_id ): float {
		$factor = self::purchase_factor( $product_id );

		return $factor > 0 ? self::round( $qty / $factor ) : self::round( $qty );
	}

	/**
	 * Stock units contained in one purchase unit. Always >= the smallest
	 * representable step; never zero, so callers can divide safely.
	 */
	public static function purchase_factor( int $product_id ): float {
		$factor = get_post_meta( $product_id, self::META_PURCHASE_FACTOR, true );

		if ( is_numeric( $factor ) && (float) $factor > 0 ) {
			return self::round( (float) $factor );
		}

		return 1.0;
	}

	/**
	 * Label for the unit a product is purchased in, e.g. `carton`. Falls back
	 * to the stock unit when no separate purchase unit is configured.
	 */
	public static function purchase_unit( int $product_id ): string {
		$unit = (string) get_post_meta( $product_id, self::META_PURCHASE_UNIT, true );

		return '' !== $unit ? $unit : self::unit( $product_id );
	}
}
