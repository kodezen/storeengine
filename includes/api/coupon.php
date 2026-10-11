<?php

namespace StoreEngine\API;

use stdClass;
use StoreEngine\Classes\Exceptions\StoreEngineException;
use StoreEngine\Utils\Formatting;
use StoreEngine\Utils\Helper;
use WP_Error;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Coupon {

	/**
	 * Derived, queryable copy of the coupon end date/time as a single unix
	 * timestamp. The authoritative value (`_storeengine_coupon_end_date_time`)
	 * is a serialized `{date, time, timezone}` object, which cannot be compared
	 * in a meta_query — so we mirror it into this scalar on every save and
	 * filter the admin list against it. `0` means "no end date" (never expires).
	 */
	const END_TS_META = '_storeengine_coupon_end_ts';

	/**
	 * Meta storing which time mode a coupon uses. `set_time_limit` means it has a
	 * start/end window; anything else (default `forever_time`, or unset on legacy
	 * coupons) means it is open-ended.
	 */
	const TIME_TYPE_META = '_storeengine_coupon_time_type';

	/**
	 * Meta storing the coupon code — the string shoppers type at checkout.
	 *
	 * The post title is the coupon's human label ("Summer sale"), a field the
	 * merchant fills in separately, so WP's built-in title/content search never
	 * matches a code. See `search_by_code()`.
	 */
	const CODE_META = '_storeengine_coupon_name';

	public static function init() {
		$self = new self();
		add_filter( 'rest_pre_insert_storeengine_coupon', [ $self, 'validate_request_data' ], 10, 2 );

		// Keep the queryable end-timestamp mirror in sync on create/update.
		add_action( 'rest_after_insert_' . Helper::COUPON_POST_TYPE, [ $self, 'sync_end_timestamp' ], 10, 1 );

		// Expose the `se_expiry` filter on the coupon REST collection and turn it
		// into a meta_query against the mirrored timestamp.
		add_filter( 'rest_' . Helper::COUPON_POST_TYPE . '_collection_params', [ $self, 'register_expiry_param' ] );
		add_filter( 'rest_' . Helper::COUPON_POST_TYPE . '_query', [ $self, 'filter_by_expiry' ], 10, 2 );

		// The list renders each coupon by name *and* code, so `search` has to cover
		// both. The code lives in meta, which WP's search never reads.
		add_filter( 'rest_' . Helper::COUPON_POST_TYPE . '_query', [ $self, 'search_by_code' ], 10, 2 );

		// The category/product restriction meta only stores ids. Resolve them to
		// names here so the coupons list table can render readable labels
		// without an N-requests-per-row lookup on the client.
		add_action( 'rest_api_init', [ $self, 'register_restriction_labels_field' ] );
	}

	/**
	 * Register the `restriction_labels` computed field on the coupon REST response.
	 */
	public function register_restriction_labels_field() {
		register_rest_field(
			Helper::COUPON_POST_TYPE,
			'restriction_labels',
			[
				'get_callback' => [ $this, 'get_restriction_labels' ],
				'schema'       => [
					'type'    => 'object',
					'context' => [ 'view', 'edit' ],
				],
			]
		);
	}

	/**
	 * Resolve a coupon's category/product restriction ids to `{id, name}` pairs.
	 *
	 * @param array $object Prepared REST response data for the coupon post.
	 * @return array{include_categories: array, exclude_categories: array, include_products: array, exclude_products: array}
	 */
	public function get_restriction_labels( array $object ): array {
		$post_id = $object['id'] ?? 0;

		if ( ! $post_id ) {
			return [
				'include_categories' => [],
				'exclude_categories' => [],
				'include_products'   => [],
				'exclude_products'   => [],
			];
		}

		$map_categories = static function ( $ids ): array {
			$ids = array_filter( array_map( 'absint', (array) $ids ) );
			if ( ! $ids ) {
				return [];
			}

			$terms = get_terms( [
				'taxonomy'   => Helper::PRODUCT_CATEGORY_TAXONOMY,
				'include'    => $ids,
				'hide_empty' => false,
			] );

			if ( is_wp_error( $terms ) ) {
				return [];
			}

			return array_map( static fn( $term ) => [
				'id'   => $term->term_id,
				'name' => $term->name,
			], $terms );
		};

		$map_products = static function ( $ids ): array {
			$ids   = array_filter( array_map( 'absint', (array) $ids ) );
			$names = [];
			foreach ( $ids as $id ) {
				$title = get_the_title( $id );
				if ( $title ) {
					$names[] = [ 'id' => $id, 'name' => $title ];
				}
			}
			return $names;
		};

		$valid_prices        = (array) get_post_meta( $post_id, '_storeengine_coupon_valid_prices', true );
		$include_product_ids = array_map( static fn( $price ) => $price['product_id'] ?? 0, $valid_prices );

		return [
			'include_categories' => $map_categories( get_post_meta( $post_id, '_storeengine_product_categories', true ) ),
			'exclude_categories' => $map_categories( get_post_meta( $post_id, '_storeengine_excluded_product_categories', true ) ),
			'include_products'   => $map_products( $include_product_ids ),
			'exclude_products'   => $map_products( get_post_meta( $post_id, '_storeengine_excluded_product_ids', true ) ),
		];
	}

	/**
	 * Reduce the serialized end date/time meta to a single unix timestamp.
	 *
	 * Uses the same `strtotime( "date time" )` reading as the coupon-expiry
	 * validator (see Coupon::check_coupon_between_start_and_end_date) so the
	 * "expired" list filter and the real checkout expiry agree. Returns `0`
	 * when no end date is set, which is the sentinel for "never expires".
	 *
	 * @param mixed $end_date_time The `_storeengine_coupon_end_date_time` meta value.
	 */
	public static function compute_end_timestamp( $end_date_time ): int {
		if ( ! is_array( $end_date_time ) || empty( $end_date_time['date'] ) ) {
			return 0;
		}

		$time = $end_date_time['time'] ?? '';
		$ts   = strtotime( trim( $end_date_time['date'] . ' ' . $time ) );

		return $ts ? (int) $ts : 0;
	}

	/**
	 * Mirror the coupon end date/time into the queryable timestamp meta.
	 *
	 * @param \WP_Post $post The saved coupon post.
	 */
	public function sync_end_timestamp( $post ) {
		if ( ! $post || Helper::COUPON_POST_TYPE !== $post->post_type ) {
			return;
		}

		$end_date_time = get_post_meta( $post->ID, '_storeengine_coupon_end_date_time', true );
		update_post_meta( $post->ID, self::END_TS_META, self::compute_end_timestamp( $end_date_time ) );
	}

	/**
	 * Register the `se_expiry` query param on the coupon REST collection.
	 *
	 * @param array $params Collection params.
	 * @return array
	 */
	public function register_expiry_param( array $params ): array {
		$params['se_expiry'] = [
			'description' => __( 'Limit coupons by expiry state: "expired" (past end date), "no_end" (time limit set but no end date) or "forever" (open-ended, no time limit).', 'storeengine' ),
			'type'        => 'string',
			'enum'        => [ 'expired', 'no_end', 'forever' ],
		];

		return $params;
	}

	/**
	 * Translate the `se_expiry` param into a meta_query on the mirrored timestamp.
	 *
	 * @param array           $args    WP_Query args.
	 * @param WP_REST_Request $request REST request.
	 * @return array
	 */
	public function filter_by_expiry( array $args, WP_REST_Request $request ): array {
		$expiry = $request->get_param( 'se_expiry' );
		if ( ! $expiry ) {
			return $args;
		}

		$meta_query = $args['meta_query'] ?? [];

		if ( 'expired' === $expiry ) {
			// A set, in-the-past end date. Bounded below by 1 so "no end date"
			// (stored as 0) is never counted as expired.
			$meta_query[] = [
				'key'     => self::END_TS_META,
				'value'   => [ 1, time() ],
				'compare' => 'BETWEEN',
				'type'    => 'NUMERIC',
			];
		} elseif ( 'no_end' === $expiry ) {
			// A time limit was chosen but the end date left blank — the risky
			// case. Requires the `set_time_limit` mode so intentionally
			// open-ended ("Forever") coupons fall under the `forever` filter
			// instead. The mirror is 0, or absent on coupons predating it.
			$meta_query[] = [
				'relation' => 'AND',
				[
					'key'     => self::TIME_TYPE_META,
					'value'   => 'set_time_limit',
					'compare' => '=',
				],
				[
					'relation' => 'OR',
					[
						'key'     => self::END_TS_META,
						'compare' => 'NOT EXISTS',
					],
					[
						'key'     => self::END_TS_META,
						'value'   => 0,
						'compare' => '=',
						'type'    => 'NUMERIC',
					],
				],
			];
		} elseif ( 'forever' === $expiry ) {
			// Open-ended by choice: any mode that is not `set_time_limit`,
			// including legacy coupons with the meta unset (default is
			// `forever_time`).
			$meta_query[] = [
				'relation' => 'OR',
				[
					'key'     => self::TIME_TYPE_META,
					'compare' => 'NOT EXISTS',
				],
				[
					'key'     => self::TIME_TYPE_META,
					'value'   => 'set_time_limit',
					'compare' => '!=',
				],
			];
		}

		$args['meta_query'] = $meta_query;

		return $args;
	}

	/**
	 * Widen the coupon collection's `search` param so it also matches the code.
	 *
	 * A coupon carries two names: the post title (the label the merchant gives
	 * it) and the code shoppers type. Both are shown on every row of the list,
	 * so searching "SUMMER20" is expected to find it — but WP's search reads
	 * post columns only, and `s` cannot be OR'd with a `meta_query` (WP_Query
	 * always ANDs the two). So arm a one-shot `posts_search` filter here, right
	 * before the controller runs its WP_Query, and OR the code in there.
	 *
	 * @param array           $args    WP_Query args.
	 * @param WP_REST_Request $request REST request.
	 * @return array
	 */
	public function search_by_code( array $args, WP_REST_Request $request ): array {
		if ( '' === trim( (string) $request->get_param( 'search' ) ) ) {
			return $args;
		}

		add_filter( 'posts_search', [ $this, 'add_code_search_clause' ], 10, 2 );

		return $args;
	}

	/**
	 * OR a coupon-code match into WP's title/content search clause.
	 *
	 * Removes itself on the first call: it is armed for one specific query by
	 * `search_by_code()` and must never leak into another one.
	 *
	 * @param string    $search Search SQL, e.g. " AND ((wp_posts.post_title LIKE '%x%') ...)".
	 * @param \WP_Query $query  The query being built.
	 * @return string
	 */
	public function add_code_search_clause( string $search, $query ): string {
		remove_filter( 'posts_search', [ $this, 'add_code_search_clause' ], 10 );

		$term = $query instanceof \WP_Query ? (string) $query->get( 's' ) : '';

		// Nothing to widen: WP found no search terms, or this is not the query we
		// armed the filter for.
		if ( '' === trim( $search ) || '' === $term || Helper::COUPON_POST_TYPE !== $query->get( 'post_type' ) ) {
			return $search;
		}

		global $wpdb;

		// WP renders the clause as " AND (<title/content conditions>)" and, for
		// logged-out visitors only, appends a password check. Peel that check off
		// so it stays ANDed — only the content conditions may become optional.
		$password_clause = " AND ({$wpdb->posts}.post_password = '')";
		$suffix          = '';

		if ( substr( $search, - strlen( $password_clause ) ) === $password_clause ) {
			$search = substr( $search, 0, - strlen( $password_clause ) );
			$suffix = $password_clause;
		}

		// Subquery rather than a pre-resolved id list: a store with thousands of
		// coupons would otherwise build an `IN (...)` of every partial match.
		$code_clause = $wpdb->prepare(
			"{$wpdb->posts}.ID IN ( SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = %s AND meta_value LIKE %s )",
			self::CODE_META,
			'%' . $wpdb->esc_like( $term ) . '%'
		);

		$conditions = preg_replace( '/^\s*AND\s+/i', '', trim( $search ) );

		return ' AND ( ' . $conditions . ' OR ' . $code_clause . ' )' . $suffix;
	}

	public function validate_request_data( stdClass $prepared_post, WP_REST_Request $request ) {
		$meta = $request->get_param( 'meta' );

		$customers = $meta['_storeengine_coupon_valid_customers'] ?? [];
		foreach ( $customers as $customer_id ) {
			if ( ! is_numeric( $customer_id ) || ! get_userdata( $customer_id ) ) {
				return new WP_Error( 'invalid_customer_id', esc_html__( 'Invalid customer ID provided.', 'storeengine' ), [ 'status' => 400 ] );
			}
		}

		$prices = $meta['_storeengine_coupon_valid_prices'] ?? [];

		foreach ( $prices as $index => $price_data ) {
			$product_id = absint( $price_data['product_id'] );
			if ( ! $product_id || ! get_post( $product_id ) ) {
				return new WP_Error( 'invalid_product_id', esc_html(
					sprintf(
						// translators: %s. Item index.
						__( 'Invalid product ID provided at %s item', 'storeengine' ),
						Formatting::append_numeral_suffix( $index + 1 )
					)
				), [ 'status' => 400 ] );
			}

			$price_ids = array_map( 'absint', $price_data['price_ids'] );
			foreach ( $price_ids as $price_id ) {
				try {
					$price = Helper::get_price( $price_id );
					if ( $price->get_product_id() !== $product_id ) {
						return new WP_Error(
							'invalid_price_id',
							esc_html(
								sprintf(
									// translators: %s. Item index.
									__( 'Invalid product & price combination at %s item.', 'storeengine' ),
									Formatting::append_numeral_suffix( $index + 1 )
								)
							),
							[ 'status' => 400 ]
						);
					}
				} catch ( StoreEngineException $e ) {
					return new WP_Error( 'invalid_price_id', esc_html(
						sprintf(
							// translators: %s. Item index.
							__( 'Invalid price selected at %s item.', 'storeengine' ),
							Formatting::append_numeral_suffix( $index + 1 )
						)
					), [ 'status' => 400 ] );
				}
			}
		}

		return $prepared_post;
	}

}
