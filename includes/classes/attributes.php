<?php

namespace StoreEngine\Classes;

use StoreEngine\Utils\Formatting;

class Attributes extends AbstractWpdb {

	private int $page;
	private int $limit;

	public function __construct( int $page = 1, int $per_page = 10 ) {
		$this->page  = max( 1, $page );
		$this->limit = $per_page ?: 10;

		parent::__construct();

		global $wpdb;
		$this->table = "{$wpdb->prefix}storeengine_attribute_taxonomies";
	}

	public function get( $search = '' ) {
		$cache_key = Attribute::CACHE_KEY . Attribute::get_cache_version() . md5( wp_json_encode( [
			'search' => $search,
			'page'   => $this->page,
			'limit'  => $this->limit,
		] ) );
		$has_cache = wp_cache_get( $cache_key, Attribute::CACHE_GROUP );
		if ( $has_cache ) {
			return $has_cache;
		}

		global $wpdb;
		$query = "SELECT * FROM $this->table";
		if ( ! empty( $search ) ) {
			$query .= $wpdb->prepare( ' WHERE attribute_label LIKE %s', '%' . $wpdb->esc_like( $search ) . '%' );
		}
		$query .= ' ORDER BY ' . Attribute::order_by_sql();

		if ( $this->limit > 0 ) {
			$offset = ( $this->limit * $this->page ) - $this->limit;
			$query .= $wpdb->prepare( ' LIMIT %d, %d', $offset, $this->limit );
		}

		// phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared -- Prepared query below.
		$results = $wpdb->get_results( $query );
		// phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared
		if ( empty( $results ) ) {
			return [];
		}

		$attributes = [];
		foreach ( $results as $result ) {
			$attributes[] = ( new Attribute() )->set_data( $result );
		}
		wp_cache_set( $cache_key, $attributes, Attribute::CACHE_GROUP );

		return $attributes;
	}

	public function get_all_names() {
		$cache_key = Attribute::CACHE_KEY . Attribute::get_cache_version() . 'all_names';
		$has_cache = wp_cache_get( $cache_key, Attribute::CACHE_GROUP );
		if ( $has_cache ) {
			return $has_cache;
		}
		global $wpdb;
		// ORDER BY comes from a fixed string in Attribute::order_by_sql(); nothing user-supplied.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared
		$results = $wpdb->get_results( "SELECT attribute_name, attribute_label, attribute_public FROM {$wpdb->prefix}storeengine_attribute_taxonomies ORDER BY " . Attribute::order_by_sql() );

		if ( empty( $results ) ) {
			return [];
		}

		$names = [];
		foreach ( $results as $result ) {
			$names[ $result->attribute_name ] = [
				'label'  => $result->attribute_label,
				'public' => Formatting::string_to_bool( $result->attribute_public ),
			];
		}

		wp_cache_set( $cache_key, $names, Attribute::CACHE_GROUP );

		return $names;
	}

	/**
	 * Save a manual order (drag-and-drop in the Attributes screen).
	 *
	 * The screen may show only part of the list (paged or filtered), so the
	 * given IDs are placed back into the positions they already hold in the
	 * full list, in their new order; every other attribute keeps its place.
	 *
	 * @param int[] $ids Attribute IDs in their new relative order.
	 *
	 * @return bool False when the order column isn't available yet.
	 */
	public function reorder( array $ids ): bool {
		if ( ! Attribute::has_order_column() ) {
			return false;
		}

		global $wpdb;
		$ids = array_values( array_unique( array_filter( array_map( 'absint', $ids ) ) ) );
		// ORDER BY comes from a fixed string in Attribute::order_by_sql(); nothing user-supplied.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared
		$all = array_map( 'absint', $wpdb->get_col( "SELECT attribute_id FROM {$this->table} ORDER BY " . Attribute::order_by_sql() ) );

		$ids   = array_values( array_intersect( $ids, $all ) );
		$slots = array_keys( array_intersect( $all, $ids ) );
		if ( count( $slots ) < 2 ) {
			return true;
		}
		foreach ( $slots as $i => $slot ) {
			$all[ $slot ] = $ids[ $i ];
		}

		foreach ( $all as $position => $attribute_id ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->update( $this->table, [ 'attribute_order' => $position ], [ 'attribute_id' => $attribute_id ], [ '%d' ], [ '%d' ] );
		}

		Attribute::bump_cache_version();
		wp_cache_flush_group( Attribute::CACHE_GROUP );

		return true;
	}

	public function get_total_count( string $search = '' ): int {
		$cache_key = Attribute::CACHE_KEY . Attribute::get_cache_version() . 'count' . $search;
		$has_cache = wp_cache_get( $cache_key, Attribute::CACHE_GROUP );
		if ( $has_cache ) {
			return (int) $has_cache;
		}

		global $wpdb;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		if ( $search ) {
			$count = $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $this->table WHERE attribute_label LIKE %s", '%' . $wpdb->esc_like( $search ) . '%' ) );
		} else {
			$count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $this->table" );
		}
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		wp_cache_set( $cache_key, $count, Attribute::CACHE_GROUP );

		return $count;
	}

}
