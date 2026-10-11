<?php
/**
 * Shared parsing for admin list advanced filters.
 *
 * A list sends `filters` as JSON: groups of { field, operator, value }
 * conditions. Conditions in a group are AND-ed; groups are OR-ed. Each list
 * declares its fields (id => allowed operators) and turns the parsed groups
 * into its own query (see API\ProductFilters, API\OrderListFilters,
 * API\CustomerListFilters).
 *
 * @package StoreEngine\Utils
 */

namespace StoreEngine\Utils;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ListFilters {

	const MAX_GROUPS     = 5;
	const MAX_CONDITIONS = 20;

	/**
	 * Decode and validate a JSON filter payload.
	 *
	 * @param mixed $raw    JSON string from the request.
	 * @param array $fields Allowed fields: id => [ operators ].
	 *
	 * @return array[] Groups of sanitized conditions (empty when nothing valid).
	 */
	public static function parse( $raw, array $fields ): array {
		if ( empty( $raw ) || ! is_string( $raw ) ) {
			return [];
		}

		$data = json_decode( wp_unslash( $raw ), true );
		if ( ! is_array( $data ) ) {
			return [];
		}

		$groups = [];
		$count  = 0;

		foreach ( array_slice( $data, 0, self::MAX_GROUPS ) as $group ) {
			if ( ! is_array( $group ) ) {
				continue;
			}
			$clean = [];
			foreach ( $group as $condition ) {
				if ( ++$count > self::MAX_CONDITIONS ) {
					break 2;
				}
				if ( ! is_array( $condition ) ) {
					continue;
				}
				$field    = sanitize_key( $condition['field'] ?? '' );
				$operator = sanitize_key( $condition['operator'] ?? '' );
				if ( ! isset( $fields[ $field ] ) || ! in_array( $operator, $fields[ $field ], true ) ) {
					continue;
				}
				$value = self::sanitize_value( $condition['value'] ?? '' );
				if ( self::needs_value( $operator ) && self::is_blank( $value ) ) {
					continue;
				}
				$clean[] = compact( 'field', 'operator', 'value' );
			}
			if ( $clean ) {
				$groups[] = $clean;
			}
		}

		return $groups;
	}

	/**
	 * [min, max] for a numeric condition. Open ends use a huge bound so every
	 * operator can be expressed as an inclusive BETWEEN (which keeps decimals;
	 * see OrderListFilters).
	 *
	 * @param string $op    gt|lt|eq|between.
	 * @param mixed  $value Number or [min, max].
	 *
	 * @return float[]
	 */
	public static function number_bounds( string $op, $value ): array {
		$big  = 1e15;
		$step = 0.000001;

		switch ( $op ) {
			case 'gt':
				return [ (float) $value + $step, $big ];
			case 'lt':
				return [ -$big, (float) $value - $step ];
			case 'eq':
				return [ (float) $value, (float) $value ];
			default:
				$min = is_array( $value ) && '' !== ( $value[0] ?? '' ) ? (float) $value[0] : -$big;
				$max = is_array( $value ) && '' !== ( $value[1] ?? '' ) ? (float) $value[1] : $big;

				return $min <= $max ? [ $min, $max ] : [ $max, $min ];
		}
	}

	/**
	 * Whether a number satisfies a numeric condition.
	 */
	public static function number_matches( float $number, string $op, $value ): bool {
		[ $min, $max ] = self::number_bounds( $op, $value );

		return $number >= $min && $number <= $max;
	}

	/**
	 * GMT [from, to] datetimes for a date condition entered in the site's
	 * timezone. Either end may be null (open).
	 *
	 * @param string $op    after|before|between|last_days.
	 * @param mixed  $value Y-m-d, [Y-m-d, Y-m-d] or a number of days.
	 *
	 * @return array{0:?string,1:?string}
	 */
	public static function date_bounds_gmt( string $op, $value ): array {
		$start = fn( $d ) => self::valid_date( $d ) ? get_gmt_from_date( $d . ' 00:00:00' ) : null;
		$end   = fn( $d ) => self::valid_date( $d ) ? get_gmt_from_date( $d . ' 23:59:59' ) : null;

		switch ( $op ) {
			case 'last_days':
				return [ gmdate( 'Y-m-d H:i:s', time() - max( 1, absint( $value ) ) * DAY_IN_SECONDS ), null ];
			case 'after':
				return [ $start( $value ), null ];
			case 'before':
				return [ null, $end( $value ) ];
			default:
				return [ $start( $value[0] ?? '' ), $end( $value[1] ?? '' ) ];
		}
	}

	protected static function valid_date( $date ): bool {
		return is_string( $date ) && (bool) preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date );
	}

	public static function sanitize_value( $value ) {
		if ( is_array( $value ) ) {
			return array_map( fn( $v ) => sanitize_text_field( (string) $v ), array_slice( $value, 0, 200 ) );
		}

		return sanitize_text_field( (string) $value );
	}

	public static function needs_value( string $op ): bool {
		return ! in_array( $op, [ 'empty', 'not_empty' ], true );
	}

	public static function is_blank( $value ): bool {
		if ( is_array( $value ) ) {
			return ! array_filter( $value, fn( $v ) => '' !== $v );
		}

		return '' === $value;
	}
}
