<?php
/**
 * Advanced filters for the admin Orders and Payments lists.
 *
 * Both lists query the orders table through OrderCollection, so a filter
 * becomes one more `where` group: OR between condition groups, AND inside a
 * group. Money and IDs use inclusive BETWEEN bounds (bound as strings), since
 * the collection binds plain numeric comparisons as %d and would drop
 * decimals.
 *
 * @package StoreEngine\API
 */

namespace StoreEngine\API;

use StoreEngine\Utils\ListFilters;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class OrderListFilters {

	/**
	 * Allowed fields + operators. $screen is 'orders' or 'payments'.
	 */
	public static function fields( string $screen = 'orders' ): array {
		$fields = [
			'id'            => [ 'gt', 'lt', 'eq', 'between' ],
			'status'        => [ 'in', 'not_in' ],
			'total'         => [ 'gt', 'lt', 'eq', 'between' ],
			'date'          => [ 'last_days', 'after', 'before', 'between' ],
			'payment'       => [ 'contains', 'equals' ],
			'email'         => [ 'contains', 'equals' ],
			'customer_type' => [ 'is' ],
			'currency'      => [ 'is', 'is_not' ],
			'transaction'   => [ 'contains', 'empty', 'not_empty' ],
		];

		if ( 'orders' === $screen ) {
			$fields['note'] = [ 'empty', 'not_empty' ];
		}

		return $fields;
	}

	/**
	 * The `where` group for the request's filters, or null when none.
	 *
	 * @param WP_REST_Request $request Request.
	 * @param string          $screen  'orders' | 'payments'.
	 *
	 * @return array|null
	 */
	public static function where( WP_REST_Request $request, string $screen = 'orders' ): ?array {
		$groups = ListFilters::parse( $request->get_param( 'filters' ), self::fields( $screen ) );
		if ( ! $groups ) {
			return null;
		}

		$built = [];
		foreach ( $groups as $group ) {
			$conditions = array_values( array_filter( array_map( [ __CLASS__, 'condition' ], $group ) ) );
			if ( $conditions ) {
				$built[] = array_merge( [ 'relation' => 'AND' ], $conditions );
			}
		}

		if ( ! $built ) {
			return null;
		}

		return 1 === count( $built ) ? $built[0] : array_merge( [ 'relation' => 'OR' ], $built );
	}

	/**
	 * One condition as an OrderCollection where clause.
	 *
	 * @param array $c { field, operator, value }.
	 *
	 * @return array|null
	 */
	protected static function condition( array $c ): ?array {
		[ 'field' => $field, 'operator' => $op, 'value' => $value ] = $c;

		switch ( $field ) {
			case 'id':
			case 'total':
				return [
					'key'     => 'id' === $field ? 'id' : 'total_amount',
					'value'   => array_map( fn( $n ) => (string) $n, ListFilters::number_bounds( $op, $value ) ),
					'compare' => 'BETWEEN',
				];

			case 'status':
				$statuses = array_values( array_filter( array_map( 'sanitize_key', (array) $value ) ) );

				return $statuses ? [
					'key'     => 'status',
					'value'   => $statuses,
					'compare' => 'in' === $op ? 'IN' : 'NOT IN',
				] : null;

			case 'date':
				[ $from, $to ] = ListFilters::date_bounds_gmt( $op, $value );
				if ( $from && $to ) {
					return [
						'key'     => 'date_created_gmt',
						'value'   => [ $from, $to ],
						'compare' => 'BETWEEN',
					];
				}
				if ( $from ) {
					return [
						'key'     => 'date_created_gmt',
						'value'   => $from,
						'compare' => '>=',
					];
				}

				return $to ? [
					'key'     => 'date_created_gmt',
					'value'   => $to,
					'compare' => '<=',
				] : null;

			case 'payment':
				return self::text( 'payment_method_title', $op, $value );

			case 'email':
				return self::text( 'billing_email', $op, $value );

			case 'transaction':
				return self::text( 'transaction_id', $op, $value );

			case 'note':
				return self::text( 'customer_note', $op, $value );

			case 'customer_type':
				if ( 'registered' === $value ) {
					return [
						'key'     => 'customer_id',
						'value'   => '0',
						'compare' => '>',
					];
				}

				return [
					'relation' => 'OR',
					[
						'key'     => 'customer_id',
						'value'   => '0',
						'compare' => '=',
					],
					[
						'key'     => 'customer_id',
						'compare' => 'IS NULL',
					],
				];

			case 'currency':
				return [
					'key'     => 'currency',
					'value'   => strtoupper( (string) $value ),
					'compare' => 'is' === $op ? '=' : '!=',
				];
		}

		return null;
	}

	/**
	 * Text column condition: contains / equals / empty / not empty.
	 */
	protected static function text( string $key, string $op, $value ): array {
		switch ( $op ) {
			case 'empty':
				return [
					'relation' => 'OR',
					[
						'key'     => $key,
						'value'   => '',
						'compare' => '=',
					],
					[
						'key'     => $key,
						'compare' => 'IS NULL',
					],
				];
			case 'not_empty':
				return [
					'key'     => $key,
					'value'   => '',
					'compare' => '!=',
				];
			case 'equals':
				return [
					'key'     => $key,
					'value'   => (string) $value,
					'compare' => '=',
				];
			default:
				return [
					'key'     => $key,
					'value'   => '%' . $value . '%',
					'compare' => 'LIKE',
				];
		}
	}
}
