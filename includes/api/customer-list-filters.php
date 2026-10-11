<?php
/**
 * Advanced filters for the admin Customers list.
 *
 * Customers are WP users (WP_User_Query). Each condition group resolves to a
 * set of user IDs; the union of the groups becomes the query's `include`,
 * intersected with any include already on the request, so a filter can never
 * widen the list. Order-based fields aggregate the orders table; a condition
 * that zero satisfies (e.g. "orders = 0") also matches customers who never
 * ordered.
 *
 * @package StoreEngine\API
 */

namespace StoreEngine\API;

use StoreEngine\Utils\Helper;
use StoreEngine\Utils\ListFilters;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CustomerListFilters {

	/**
	 * Every user ID, loaded once and only when a condition needs "everyone
	 * except …" (a zero-matching order condition).
	 *
	 * @var int[]|null
	 */
	protected ?array $all_ids = null;

	public static function fields(): array {
		return [
			'name'       => [ 'contains', 'equals' ],
			'email'      => [ 'contains', 'equals' ],
			'registered' => [ 'last_days', 'after', 'before', 'between' ],
			'orders'     => [ 'gt', 'lt', 'eq', 'between' ],
			'spent'      => [ 'gt', 'lt', 'eq', 'between' ],
			'last_order' => [ 'last_days', 'after', 'before', 'between' ],
		];
	}

	/**
	 * Restrict WP_User_Query args to the request's filters.
	 *
	 * @param array           $args    WP_User_Query args.
	 * @param WP_REST_Request $request Request.
	 *
	 * @return array
	 */
	public static function apply( array $args, WP_REST_Request $request ): array {
		$groups = ListFilters::parse( $request->get_param( 'filters' ), self::fields() );
		if ( ! $groups ) {
			return $args;
		}

		$self = new self();
		$ids  = [];
		foreach ( $groups as $group ) {
			$ids = array_merge( $ids, $self->group_ids( $group ) );
		}
		$ids = array_values( array_unique( array_map( 'intval', $ids ) ) );

		if ( ! empty( $args['include'] ) ) {
			$ids = array_values( array_intersect( $ids, array_map( 'intval', (array) $args['include'] ) ) );
		}

		// An empty include means "no restriction" to WP_User_Query; 0 matches nobody.
		$args['include'] = $ids ? $ids : [ 0 ];

		return $args;
	}

	/**
	 * User IDs matching every condition in a group.
	 *
	 * @param array $group Conditions.
	 *
	 * @return int[]
	 */
	protected function group_ids( array $group ): array {
		$ids = null;
		foreach ( $group as $condition ) {
			$matched = $this->condition_ids( $condition );
			$ids     = null === $ids ? $matched : array_values( array_intersect( $ids, $matched ) );
			if ( ! $ids ) {
				return [];
			}
		}

		return $ids ?? [];
	}

	/**
	 * User IDs matching one condition.
	 *
	 * @param array $c { field, operator, value }.
	 *
	 * @return int[]
	 */
	protected function condition_ids( array $c ): array {
		global $wpdb;
		[ 'field' => $field, 'operator' => $op, 'value' => $value ] = $c;

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		switch ( $field ) {
			case 'name':
				// "equals" compares with LIKE on an escaped value, so both operators share one prepared query.
				$term = 'equals' === $op ? $wpdb->esc_like( (string) $value ) : '%' . $wpdb->esc_like( (string) $value ) . '%';

				return array_map( 'intval', $wpdb->get_col( $wpdb->prepare(
					"SELECT u.ID FROM {$wpdb->users} u
					LEFT JOIN {$wpdb->usermeta} fn ON fn.user_id = u.ID AND fn.meta_key = 'first_name'
					LEFT JOIN {$wpdb->usermeta} ln ON ln.user_id = u.ID AND ln.meta_key = 'last_name'
					WHERE u.display_name LIKE %s OR fn.meta_value LIKE %s OR ln.meta_value LIKE %s
					OR CONCAT_WS(' ', fn.meta_value, ln.meta_value) LIKE %s",
					$term,
					$term,
					$term,
					$term
				) ) );

			case 'email':
				if ( 'equals' === $op ) {
					return array_map( 'intval', $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->users} WHERE user_email = %s", (string) $value ) ) );
				}

				return array_map( 'intval', $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->users} WHERE user_email LIKE %s", '%' . $wpdb->esc_like( (string) $value ) . '%' ) ) );

			case 'registered':
				[ $from, $to ] = ListFilters::date_bounds_gmt( $op, $value );

				return array_map( 'intval', $wpdb->get_col( $wpdb->prepare(
					"SELECT ID FROM {$wpdb->users} WHERE user_registered >= %s AND user_registered <= %s",
					$from ?? '1000-01-01 00:00:00',
					$to ?? '9999-12-31 23:59:59'
				) ) );

			case 'orders':
			case 'spent':
				return $this->aggregate_ids( $field, $op, $value );

			case 'last_order':
				[ $from, $to ] = ListFilters::date_bounds_gmt( $op, $value );

				return array_map( 'intval', $wpdb->get_col( $wpdb->prepare(
					"SELECT customer_id FROM {$wpdb->prefix}storeengine_orders
					WHERE type = 'order' AND customer_id > 0 AND status NOT IN ('draft', 'auto-draft', 'trash')
					GROUP BY customer_id HAVING MAX(date_created_gmt) >= %s AND MAX(date_created_gmt) <= %s",
					$from ?? '1000-01-01 00:00:00',
					$to ?? '9999-12-31 23:59:59'
				) ) );
		}
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return [];
	}

	/**
	 * Customers whose order count / paid total matches. Customers without
	 * orders count as 0, so they match when 0 satisfies the condition.
	 *
	 * @param string $field orders|spent.
	 * @param string $op    Operator.
	 * @param mixed  $value Value.
	 *
	 * @return int[]
	 */
	protected function aggregate_ids( string $field, string $op, $value ): array {
		global $wpdb;
		$table = $wpdb->prefix . 'storeengine_orders';

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- $table is the prefixed orders table; $placeholders is a run of %s.
		if ( 'orders' === $field ) {
			$rows = $wpdb->get_results(
				"SELECT customer_id AS id, COUNT(*) AS n FROM {$table}
				WHERE type = 'order' AND customer_id > 0 AND status NOT IN ('draft', 'auto-draft', 'trash')
				GROUP BY customer_id"
			);
		} else {
			$paid         = array_values( (array) Helper::get_order_paid_statuses() );
			$placeholders = implode( ', ', array_fill( 0, max( 1, count( $paid ) ), '%s' ) );
			$rows         = $wpdb->get_results( $wpdb->prepare(
				"SELECT customer_id AS id, SUM(total_amount) AS n FROM {$table}
				WHERE type = 'order' AND customer_id > 0 AND status IN ({$placeholders})
				GROUP BY customer_id",
				...( $paid ? $paid : [ '' ] )
			) );
		}
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare

		$totals = [];
		foreach ( $rows as $row ) {
			$totals[ (int) $row->id ] = (float) $row->n;
		}

		if ( ListFilters::number_matches( 0.0, $op, $value ) ) {
			// Zero qualifies: everyone except those whose total fails.
			$fails = array_keys( array_filter( $totals, fn( $n ) => ! ListFilters::number_matches( $n, $op, $value ) ) );

			return array_values( array_diff( $this->all_ids(), $fails ) );
		}

		return array_keys( array_filter( $totals, fn( $n ) => ListFilters::number_matches( $n, $op, $value ) ) );
	}

	protected function all_ids(): array {
		if ( null === $this->all_ids ) {
			global $wpdb;
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->all_ids = array_map( 'intval', $wpdb->get_col( "SELECT ID FROM {$wpdb->users}" ) );
		}

		return $this->all_ids;
	}
}
