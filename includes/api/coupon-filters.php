<?php
/**
 * Advanced filters for the admin coupon list.
 *
 * The list is served by the core posts controller for the coupon type
 * (GET storeengine/v1/storeengine_coupon). A `filters` parameter carries a JSON
 * list of condition groups (see Utils\ListFilters): conditions inside a group
 * must all match, a coupon matches when any group matches. A single group is
 * merged straight into the WP_Query args; several groups are resolved to ID
 * lists and their union becomes `post__in`, so paging and ordering keep working.
 *
 * The filter only ever narrows the list; it never widens what the request (or
 * a vendor scope) already allows.
 *
 * @package StoreEngine\API
 */

namespace StoreEngine\API;

use StoreEngine\Utils\Helper;
use StoreEngine\Utils\ListFilters;
use WP_Query;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CouponFilters {

	/**
	 * Query var carrying code (title) conditions to the posts_where filter.
	 */
	const TITLE_VAR = 'storeengine_coupon_code_conditions';

	public static function init() {
		$self = new self();
		add_filter( 'rest_' . Helper::COUPON_POST_TYPE . '_query', [ $self, 'apply' ], 20, 2 );
		add_filter( 'posts_where', [ $self, 'code_where' ], 10, 2 );
	}

	/**
	 * Allowed operators per field.
	 */
	public static function fields(): array {
		return [
			'code'    => [ 'contains', 'equals', 'starts_with' ],
			'type'    => [ 'is', 'is_not' ],
			'amount'  => [ 'gt', 'lt', 'eq', 'between' ],
			'usage'   => [ 'gt', 'lt', 'eq', 'between' ],
			'expires' => [ 'after', 'before', 'between' ],
		];
	}

	/**
	 * Apply the `filters` request param to the list query.
	 *
	 * @param array           $args    WP_Query args.
	 * @param WP_REST_Request $request Request.
	 *
	 * @return array
	 */
	public function apply( $args, $request ) {
		$raw = $request->get_param( 'filters' );
		if ( empty( $raw ) || ! is_string( $raw ) ) {
			return $args;
		}

		$groups = ListFilters::parse( $raw, self::fields() );
		if ( ! $groups ) {
			return $args;
		}

		if ( 1 === count( $groups ) ) {
			return self::merge( $args, self::group_args( $groups[0] ) );
		}

		// Several groups (OR): union of each group's matching IDs.
		$ids = [];
		foreach ( $groups as $group ) {
			$query = new WP_Query( array_merge(
				self::group_args( $group ),
				[
					'post_type'              => Helper::COUPON_POST_TYPE,
					'post_status'            => $args['post_status'] ?? 'any',
					'fields'                 => 'ids',
					'posts_per_page'         => -1,
					'no_found_rows'          => true,
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
					'suppress_filters'       => false,
				]
			) );
			$ids   = array_merge( $ids, array_map( 'intval', $query->posts ) );
		}

		return self::restrict_ids( $args, array_values( array_unique( $ids ) ) );
	}

	/**
	 * Build WP_Query args for one group of AND-ed conditions.
	 *
	 * @param array $group Conditions.
	 *
	 * @return array
	 */
	public static function group_args( array $group ): array {
		$meta  = [];
		$codes = [];

		foreach ( $group as [ 'field' => $field, 'operator' => $op, 'value' => $value ] ) {
			switch ( $field ) {
				case 'code':
					$codes[] = [ $op, (string) $value ];
					break;

				case 'type':
					$meta[] = [
						'key'     => '_storeengine_coupon_type',
						'value'   => (string) $value,
						'compare' => 'is' === $op ? '=' : '!=',
					];
					break;

				case 'amount':
					$meta[] = self::numeric_meta( '_storeengine_coupon_amount', $op, $value );
					break;

				case 'usage':
					$cond = self::numeric_meta( '_storeengine_coupon_usage_count', $op, $value );
					// A coupon that was never used has no counter yet; it counts as 0.
					if ( ListFilters::number_matches( 0.0, $op, $value ) ) {
						$cond = [
							'relation' => 'OR',
							$cond,
							[
								'key'     => '_storeengine_coupon_usage_count',
								'compare' => 'NOT EXISTS',
							],
						];
					}
					$meta[] = $cond;
					break;

				case 'expires':
					// Only coupons with a real end date have a timestamp (0 = never).
					$range = self::end_bounds( $op, $value );
					$meta[] = [
						'key'     => \StoreEngine\API\Coupon::END_TS_META,
						'value'   => $range,
						'type'    => 'NUMERIC',
						'compare' => 'BETWEEN',
					];
					break;
			}
		}

		$args = [];
		if ( $meta ) {
			$args['meta_query'] = array_merge( [ 'relation' => 'AND' ], $meta ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
		}
		if ( $codes ) {
			$args[ self::TITLE_VAR ] = $codes;
		}

		return $args;
	}

	/**
	 * Code conditions (WP_Query has no LIKE on the title alone).
	 *
	 * @param string   $where SQL WHERE.
	 * @param WP_Query $query Query.
	 *
	 * @return string
	 */
	public function code_where( $where, $query ) {
		$conditions = $query->get( self::TITLE_VAR );
		if ( empty( $conditions ) || ! is_array( $conditions ) ) {
			return $where;
		}

		global $wpdb;
		foreach ( $conditions as [ $op, $value ] ) {
			$like = $wpdb->esc_like( $value );
			switch ( $op ) {
				case 'contains':
					$where .= $wpdb->prepare( " AND {$wpdb->posts}.post_title LIKE %s", '%' . $like . '%' );
					break;
				case 'equals':
					$where .= $wpdb->prepare( " AND {$wpdb->posts}.post_title = %s", $value );
					break;
				case 'starts_with':
					$where .= $wpdb->prepare( " AND {$wpdb->posts}.post_title LIKE %s", $like . '%' );
					break;
			}
		}

		return $where;
	}

	/**
	 * [from, to] unix timestamps for an expiry condition. The stored end
	 * timestamp is read with the same strtotime() the checkout uses, so the
	 * bounds are built the same way.
	 *
	 * @param string $op    after|before|between.
	 * @param mixed  $value Y-m-d or [Y-m-d, Y-m-d].
	 *
	 * @return int[]
	 */
	protected static function end_bounds( string $op, $value ): array {
		$start = static fn( $d ) => ( is_string( $d ) && preg_match( '/^\d{4}-\d{2}-\d{2}$/', $d ) ) ? (int) strtotime( $d . ' 00:00:00' ) : 0;
		$end   = static fn( $d ) => ( is_string( $d ) && preg_match( '/^\d{4}-\d{2}-\d{2}$/', $d ) ) ? (int) strtotime( $d . ' 23:59:59' ) : 0;
		$max   = PHP_INT_MAX;

		switch ( $op ) {
			case 'after':
				return [ max( 1, $start( $value ) ), $max ];
			case 'before':
				return [ 1, $end( $value ) ? $end( $value ) : $max ];
			default:
				$from = is_array( $value ) ? $start( $value[0] ?? '' ) : 0;
				$to   = is_array( $value ) ? $end( $value[1] ?? '' ) : 0;

				return [ max( 1, $from ), $to ? $to : $max ];
		}
	}

	protected static function numeric_meta( string $key, string $op, $value ): array {
		[ $min, $max ] = ListFilters::number_bounds( $op, $value );

		return [
			'key'     => $key,
			'value'   => [ $min, $max ],
			'type'    => 'NUMERIC',
			'compare' => 'BETWEEN',
		];
	}

	/**
	 * Merge one group's args into the list query, AND-ing with what is there.
	 */
	protected static function merge( array $args, array $extra ): array {
		if ( ! empty( $extra['meta_query'] ) ) {
			$args['meta_query'] = empty( $args['meta_query'] ) ? $extra['meta_query'] : [
				'relation' => 'AND',
				$args['meta_query'],
				$extra['meta_query'],
			];
		}
		if ( ! empty( $extra[ self::TITLE_VAR ] ) ) {
			$args[ self::TITLE_VAR ] = $extra[ self::TITLE_VAR ];
		}

		return $args;
	}

	/**
	 * Limit the query to the given IDs, intersecting any existing post__in.
	 */
	protected static function restrict_ids( array $args, array $ids ): array {
		if ( ! empty( $args['post__in'] ) ) {
			$ids = array_values( array_intersect( array_map( 'intval', $args['post__in'] ), $ids ) );
		}
		$args['post__in'] = $ids ? $ids : [ 0 ];

		return $args;
	}
}
