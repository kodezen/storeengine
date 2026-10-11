<?php
/**
 * Donation / Name-Your-Price pricing configuration helper.
 *
 * Per-price configuration is stored as a single product-meta map keyed by
 * price id, rather than on the Price entity's fixed `settings` column, so the
 * addon stays self-contained and needs no core schema change:
 *
 *     _storeengine_donation_pricing => [
 *         <price_id> => [
 *             'mode'         => 'fixed' | 'name_your_price' | 'donation',
 *             'min'          => float|null,   // floor; null = no minimum
 *             'max'          => float|null,   // cap; null = no maximum
 *             'suggested'    => float|null,   // pre-filled amount
 *             'step'         => float,        // increment (default 1)
 *             'allow_custom' => bool,         // free-typed amount vs suggested only
 *         ],
 *     ]
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Helper {

	/**
	 * Product-meta key holding the per-price pricing map.
	 */
	const META_KEY = '_storeengine_donation_pricing';

	/**
	 * Cart item_data key carrying the customer-entered amount.
	 */
	const AMOUNT_KEY = 'donation_amount';

	/**
	 * Ledger statuses whose money the store actually holds, and which therefore
	 * count toward a campaign's raised total and its analytics.
	 *
	 * A donation's status follows its order, so a paid order still being
	 * fulfilled reads `processing` while a finished one reads `completed` —
	 * both are money in. Anything else (pending, on_hold, failed, cancelled,
	 * refunded) is not.
	 */
	const COUNTED_STATUSES = [ 'processing', 'completed' ];

	/**
	 * The counted statuses as a ready-to-inline SQL list, e.g.
	 * `status IN ('processing','completed')`.
	 *
	 * The values are class constants, never user input, so inlining them is
	 * safe and keeps callers from having to thread extra placeholders through
	 * every prepare().
	 *
	 * @param string $column Column name, already trusted.
	 *
	 * @return string
	 */
	public static function counted_status_sql( string $column = 'status' ): string {
		$list = implode( ',', array_map( static fn( $s ) => "'" . $s . "'", self::COUNTED_STATUSES ) );

		return $column . ' IN (' . $list . ')';
	}

	/**
	 * Default configuration for a price with no explicit donation/NYP setup.
	 *
	 * @return array
	 */
	public static function default_config(): array {
		return [
			'mode'         => 'fixed',
			'min'          => null,
			'max'          => null,
			'suggested'    => null,
			'step'         => 1.0,
			'allow_custom' => true,
		];
	}

	/**
	 * All per-price configs for a product, keyed by price id.
	 *
	 * @param int $product_id
	 *
	 * @return array<int, array>
	 */
	public static function get_all_configs( int $product_id ): array {
		if ( ! $product_id ) {
			return [];
		}

		$map = get_post_meta( $product_id, self::META_KEY, true );

		return is_array( $map ) ? $map : [];
	}

	/**
	 * Resolve the config for a single price, merged over defaults.
	 *
	 * @param int $price_id
	 * @param int $product_id Product owning the price (avoids a Price load when known).
	 *
	 * @return array
	 */
	public static function get_price_config( int $price_id, int $product_id ): array {
		$map    = self::get_all_configs( $product_id );
		$config = isset( $map[ $price_id ] ) && is_array( $map[ $price_id ] ) ? $map[ $price_id ] : [];

		return self::normalize_config( array_merge( self::default_config(), $config ) );
	}

	/**
	 * Enforce the config invariants so downstream renderers (and the HTML number
	 * input) can never receive contradictory values that would break the UI:
	 *
	 *   - step  > 0                    (a 0/negative step makes the input invalid)
	 *   - min  >= 0                    (no negative floor)
	 *   - max  >= min, else no cap     (an inverted range is dropped)
	 *   - suggested clamped into [min, max] and aligned to the step from `min`,
	 *     so the pre-filled value always satisfies the input's own validation
	 *   - a suggested amount is guaranteed when custom amounts are disabled
	 *
	 * Applied on every read (get_price_config) so even legacy/tampered data is
	 * corrected, and on save (the editor's sanitizer) so stored data stays clean.
	 *
	 * @param array $config
	 *
	 * @return array
	 */
	public static function normalize_config( array $config ): array {
		$config = array_merge( self::default_config(), $config );

		$config['mode'] = in_array( $config['mode'], [ 'fixed', 'name_your_price', 'donation' ], true ) ? $config['mode'] : 'fixed';

		// Step must be positive.
		$step           = (float) $config['step'];
		$config['step'] = $step > 0 ? $step : 1.0;

		// Min: non-negative or null.
		$min = ( null !== $config['min'] && '' !== $config['min'] ) ? max( 0.0, (float) $config['min'] ) : null;

		// Max: null, or a positive value that is >= min (an inverted range is dropped).
		$max = ( null !== $config['max'] && '' !== $config['max'] ) ? (float) $config['max'] : null;
		if ( null !== $max && ( $max <= 0 || ( null !== $min && $max < $min ) ) ) {
			$max = null;
		}

		$config['min'] = $min;
		$config['max'] = $max;

		// Suggested: align to the step from the min baseline, then clamp into range.
		$suggested = ( null !== $config['suggested'] && '' !== $config['suggested'] ) ? (float) $config['suggested'] : null;
		if ( null !== $suggested ) {
			$base      = null !== $min ? $min : 0.0;
			$suggested = $base + round( ( $suggested - $base ) / $config['step'] ) * $config['step'];
			if ( null !== $min ) {
				$suggested = max( $suggested, $min );
			}
			if ( null !== $max ) {
				$suggested = min( $suggested, $max );
			}
		}
		$config['suggested'] = $suggested;

		$config['allow_custom'] = (bool) $config['allow_custom'];

		// Name-your-price inherently means the customer sets the amount, so custom
		// input is always allowed in that mode (a locked NYP field is a
		// contradiction). "Only the suggested amount" stays available for donation
		// mode, where a fixed "Donate $X" button is a valid pattern.
		if ( 'name_your_price' === $config['mode'] ) {
			$config['allow_custom'] = true;
		}

		// When free amounts are disabled the customer can only pick the suggested
		// amount, so guarantee one exists.
		if ( ! $config['allow_custom'] && null === $config['suggested'] ) {
			$config['suggested'] = null !== $min ? $min : $config['step'];
		}

		return $config;
	}

	/**
	 * Whether a config lets the customer set the amount.
	 *
	 * @param array $config
	 *
	 * @return bool
	 */
	public static function is_customer_priced( array $config ): bool {
		return in_array( $config['mode'] ?? 'fixed', [ 'name_your_price', 'donation' ], true );
	}

	/**
	 * Whether a config marks a true donation (vs plain name-your-price).
	 * Only donation-mode purchases are recorded in the ledger / campaigns.
	 *
	 * @param array $config
	 *
	 * @return bool
	 */
	public static function is_donation( array $config ): bool {
		return 'donation' === ( $config['mode'] ?? 'fixed' );
	}

	/**
	 * Whether a product has at least one donation-mode price.
	 *
	 * @param int $product_id
	 *
	 * @return bool
	 */
	public static function product_has_donation( int $product_id ): bool {
		foreach ( self::get_all_configs( $product_id ) as $config ) {
			if ( is_array( $config ) && self::is_donation( array_merge( self::default_config(), $config ) ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Clamp a customer-entered amount to the config's min / max / step.
	 *
	 * Always returns a value >= min (when a min is set), so a tampered payload
	 * can never drop a line below the merchant's floor.
	 *
	 * @param float $amount
	 * @param array $config
	 *
	 * @return float
	 */
	public static function clamp_amount( float $amount, array $config ): float {
		$amount = abs( $amount );

		$step = isset( $config['step'] ) ? (float) $config['step'] : 0.0;
		if ( $step > 0 ) {
			$amount = round( $amount / $step ) * $step;
		}

		if ( isset( $config['min'] ) && '' !== $config['min'] && null !== $config['min'] ) {
			$amount = max( $amount, (float) $config['min'] );
		}

		if ( isset( $config['max'] ) && '' !== $config['max'] && null !== $config['max'] ) {
			$amount = min( $amount, (float) $config['max'] );
		}

		return $amount;
	}

	/**
	 * Read a customer-submitted amount from the current request.
	 *
	 * Covers classic (non-REST) add-to-cart form posts. The REST cart routes
	 * carry the amount through the request payload into item_data instead.
	 *
	 * @return float|null
	 */
	public static function get_submitted_amount(): ?float {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- add-to-cart nonce is handled by the cart controller; this only reads a numeric amount.
		if ( ! isset( $_REQUEST[ self::AMOUNT_KEY ] ) ) {
			return null;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- the float cast is the sanitiser: nothing but a float survives it.
		return (float) wp_unslash( $_REQUEST[ self::AMOUNT_KEY ] );
	}
}

// End of file helper.php
