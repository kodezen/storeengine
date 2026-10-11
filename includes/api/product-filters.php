<?php
/**
 * Advanced filters for the admin product list.
 *
 * The list is served by the core posts controller for the product type
 * (GET storeengine/v1/storeengine_product). A `filters` parameter carries a
 * JSON list of condition groups:
 *
 *   [ [ { field, operator, value }, … ], [ … ] ]
 *
 * Conditions inside a group must all match (AND); a product matches when any
 * group matches (OR). One group is merged straight into the WP_Query args.
 * Several groups are resolved to ID lists (one light query each) and their
 * union becomes the list's post__in, so paging, ordering and the other list
 * params keep working unchanged.
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

class ProductFilters {

	/**
	 * Query var carrying title conditions to the posts_where filter.
	 */
	const TITLE_VAR = 'storeengine_title_conditions';

	public static function init() {
		$self = new self();
		add_filter( 'rest_' . Helper::PRODUCT_POST_TYPE . '_query', [ $self, 'apply' ], 20, 2 );
		add_filter( 'posts_where', [ $self, 'title_where' ], 10, 2 );
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

		// Only for people who can manage products; the storefront never sends it.
		if ( ! current_user_can( 'edit_storeengine_products' ) ) { // phpcs:ignore WordPress.WP.Capabilities.Unknown -- StoreEngine's own product capability.
			return $args;
		}

		$groups = self::parse( $raw );
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
					'post_type'              => Helper::PRODUCT_POST_TYPE,
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
	 * Decode and validate the JSON filter payload.
	 *
	 * @param string $raw JSON.
	 *
	 * @return array[] Groups of sanitized conditions.
	 */
	public static function parse( string $raw ): array {
		return ListFilters::parse( $raw, self::fields() );
	}

	/**
	 * Allowed operators per field.
	 */
	public static function fields(): array {
		return [
			'title'        => [ 'contains', 'not_contains', 'equals', 'starts_with' ],
			'sku'          => [ 'contains', 'equals', 'empty', 'not_empty' ],
			'category'     => [ 'in', 'not_in' ],
			'tag'          => [ 'in', 'not_in' ],
			'price'        => [ 'gt', 'lt', 'eq', 'between' ],
			'type'         => [ 'is', 'is_not' ],
			'shipping'     => [ 'is', 'is_not' ],
			'stock_status' => [ 'is', 'is_not' ],
			'stock_qty'    => [ 'gt', 'lt', 'eq', 'between' ],
			'visibility'   => [ 'is' ],
			'image'        => [ 'is' ],
			'published'    => [ 'after', 'before', 'between', 'last_days' ],
		];
	}

	/**
	 * Build WP_Query args for one group of AND-ed conditions.
	 *
	 * @param array $group Conditions.
	 *
	 * @return array
	 */
	public static function group_args( array $group ): array {
		$meta   = [];
		$tax    = [];
		$date   = [];
		$titles = [];
		$ids    = null; // null = unrestricted; array = must be one of.

		foreach ( $group as [ 'field' => $field, 'operator' => $op, 'value' => $value ] ) {
			switch ( $field ) {
				case 'title':
					$titles[] = [ $op, (string) $value ];
					break;

				case 'sku':
					if ( 'empty' === $op ) {
						$meta[] = [
							'relation' => 'OR',
							[
								'key'     => '_storeengine_sku',
								'compare' => 'NOT EXISTS',
							],
							[
								'key'   => '_storeengine_sku',
								'value' => '',
							],
						];
					} elseif ( 'not_empty' === $op ) {
						$meta[] = [
							'key'     => '_storeengine_sku',
							'value'   => '',
							'compare' => '!=',
						];
					} else {
						$meta[] = [
							'key'     => '_storeengine_sku',
							'value'   => (string) $value,
							'compare' => 'equals' === $op ? '=' : 'LIKE',
						];
					}
					break;

				case 'category':
				case 'tag':
					$terms = array_filter( array_map( 'absint', (array) $value ) );
					if ( $terms ) {
						$tax[] = [
							'taxonomy' => 'category' === $field ? Helper::PRODUCT_CATEGORY_TAXONOMY : Helper::PRODUCT_TAG_TAXONOMY,
							'field'    => 'term_id',
							'terms'    => $terms,
							'operator' => 'in' === $op ? 'IN' : 'NOT IN',
						];
					}
					break;

				case 'price':
					$ids = self::intersect( $ids, self::ids_by_price( $op, $value ) );
					break;

				case 'type':
				case 'shipping':
				case 'stock_status':
					$keys   = [
						'type'         => '_storeengine_product_type',
						'shipping'     => '_storeengine_product_shipping_type',
						'stock_status' => '_storeengine_stock_status',
					];
					$meta[] = [
						'key'     => $keys[ $field ],
						'value'   => (string) $value,
						'compare' => 'is' === $op ? '=' : '!=',
					];
					break;

				case 'stock_qty':
					$meta[] = self::numeric_meta( '_storeengine_stock_quantity', $op, $value );
					break;

				case 'visibility':
					if ( 'hidden' === $value ) {
						$meta[] = [
							'key'     => '_storeengine_product_hide',
							'value'   => [ '1', 'true', 'yes', 'on' ],
							'compare' => 'IN',
						];
					} else {
						$meta[] = [
							'relation' => 'OR',
							[
								'key'     => '_storeengine_product_hide',
								'compare' => 'NOT EXISTS',
							],
							[
								'key'     => '_storeengine_product_hide',
								'value'   => [ '1', 'true', 'yes', 'on' ],
								'compare' => 'NOT IN',
							],
						];
					}
					break;

				case 'image':
					$meta[] = [
						'key'     => '_thumbnail_id',
						'compare' => 'yes' === $value ? 'EXISTS' : 'NOT EXISTS',
					];
					break;

				case 'published':
					if ( 'last_days' === $op ) {
						$date[] = [
							'after'     => absint( $value ) . ' days ago',
							'inclusive' => true,
						];
					} elseif ( 'between' === $op && is_array( $value ) ) {
						$date[] = [
							'after'     => (string) ( $value[0] ?? '' ),
							'before'    => (string) ( $value[1] ?? '' ),
							'inclusive' => true,
						];
					} else {
						$date[] = [
							$op         => (string) $value,
							'inclusive' => true,
						];
					}
					break;
			}
		}

		$args = [];
		if ( $meta ) {
			$args['meta_query'] = array_merge( [ 'relation' => 'AND' ], $meta ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
		}
		if ( $tax ) {
			$args['tax_query'] = array_merge( [ 'relation' => 'AND' ], $tax ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
		}
		if ( $date ) {
			$args['date_query'] = $date;
		}
		if ( $titles ) {
			$args[ self::TITLE_VAR ] = $titles;
		}
		if ( null !== $ids ) {
			$args['post__in'] = $ids ? $ids : [ 0 ];
		}

		return $args;
	}

	/**
	 * Title conditions (WP_Query has no LIKE on the title alone).
	 *
	 * @param string   $where SQL WHERE.
	 * @param WP_Query $query Query.
	 *
	 * @return string
	 */
	public function title_where( $where, $query ) {
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
				case 'not_contains':
					$where .= $wpdb->prepare( " AND {$wpdb->posts}.post_title NOT LIKE %s", '%' . $like . '%' );
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
	 * Product IDs with at least one price matching the condition.
	 *
	 * @param string $op    gt|lt|eq|between.
	 * @param mixed  $value Number or [min, max].
	 *
	 * @return int[]
	 */
	protected static function ids_by_price( string $op, $value ): array {
		global $wpdb;
		$table = $wpdb->prefix . 'storeengine_product_price';
		$price = 'CAST(price AS DECIMAL(20,6))';

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		if ( 'between' === $op ) {
			$range = self::range( $value );
			$ids   = $wpdb->get_col( $wpdb->prepare( "SELECT DISTINCT product_id FROM {$table} WHERE {$price} BETWEEN %f AND %f", $range[0], $range[1] ) );
		} else {
			$sign = [
				'gt' => '>',
				'lt' => '<',
				'eq' => '=',
			][ $op ] ?? '=';
			$ids  = $wpdb->get_col( $wpdb->prepare( "SELECT DISTINCT product_id FROM {$table} WHERE {$price} {$sign} %f", (float) $value ) );
		}
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return array_map( 'intval', $ids );
	}

	protected static function numeric_meta( string $key, string $op, $value ): array {
		if ( 'between' === $op ) {
			return [
				'key'     => $key,
				'value'   => self::range( $value ),
				'type'    => 'NUMERIC',
				'compare' => 'BETWEEN',
			];
		}

		return [
			'key'     => $key,
			'value'   => (float) $value,
			'type'    => 'NUMERIC',
			'compare' => [
				'gt' => '>',
				'lt' => '<',
				'eq' => '=',
			][ $op ] ?? '=',
		];
	}

	protected static function range( $value ): array {
		$min = is_array( $value ) ? (float) ( $value[0] ?? 0 ) : 0.0;
		$max = is_array( $value ) && '' !== ( $value[1] ?? '' ) ? (float) $value[1] : PHP_INT_MAX;

		return $min <= $max ? [ $min, $max ] : [ $max, $min ];
	}

	/**
	 * Merge one group's args into the list query, AND-ing with what is there.
	 */
	protected static function merge( array $args, array $extra ): array {
		foreach ( [ 'meta_query', 'tax_query' ] as $key ) {
			if ( empty( $extra[ $key ] ) ) {
				continue;
			}
			$args[ $key ] = empty( $args[ $key ] ) ? $extra[ $key ] : [
				'relation' => 'AND',
				$args[ $key ],
				$extra[ $key ],
			];
		}
		if ( ! empty( $extra['date_query'] ) ) {
			$args['date_query'] = array_merge( (array) ( $args['date_query'] ?? [] ), $extra['date_query'] );
		}
		if ( ! empty( $extra[ self::TITLE_VAR ] ) ) {
			$args[ self::TITLE_VAR ] = $extra[ self::TITLE_VAR ];
		}
		if ( isset( $extra['post__in'] ) ) {
			$args = self::restrict_ids( $args, $extra['post__in'] );
		}

		return $args;
	}

	/**
	 * Limit the query to the given IDs, intersecting any existing post__in
	 * (e.g. a vendor scope) so a filter can never widen the list.
	 */
	protected static function restrict_ids( array $args, array $ids ): array {
		$ids              = self::intersect( empty( $args['post__in'] ) ? null : array_map( 'intval', $args['post__in'] ), $ids );
		$args['post__in'] = $ids ? $ids : [ 0 ];

		return $args;
	}

	protected static function intersect( ?array $current, array $ids ): array {
		return null === $current ? $ids : array_values( array_intersect( $current, $ids ) );
	}
}
