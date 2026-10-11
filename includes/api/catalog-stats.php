<?php

namespace StoreEngine\API;

use StoreEngine\Utils\Helper;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Catalog totals for the admin dashboard: product count, sellable items
 * (simple products + variations) and stock value at cost.
 *
 * Built for large catalogs: three aggregate SQL queries (no per-product
 * loops), cached in a transient that expires after a few minutes and is
 * dropped whenever products, variations, stock or cost change.
 */
class CatalogStats extends WP_REST_Controller {

	const CACHE_KEY = 'storeengine_catalog_stats';

	const CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	public static function init() {
		$self            = new self();
		$self->namespace = STOREENGINE_PLUGIN_SLUG . '/v1';
		$self->rest_base = 'dashboard/catalog-stats';

		add_action( 'rest_api_init', [ $self, 'register_routes' ] );

		// Invalidation: any product / variation / stock / cost change.
		$flush = [ __CLASS__, 'flush' ];
		add_action( 'save_post_' . Helper::PRODUCT_POST_TYPE, $flush );
		add_action( 'rest_after_insert_' . Helper::PRODUCT_POST_TYPE, $flush );
		add_action( 'deleted_post', $flush );
		add_action( 'trashed_post', $flush );
		add_action( 'untrashed_post', $flush );
		add_action( 'storeengine/inventory/stock_quantity_set', $flush );
		add_action( 'storeengine/order/stock_reduced', $flush );
		add_action( 'storeengine/order/stock_restored', $flush );
		add_action( 'storeengine/stock_status_changed', $flush );
		foreach ( [ 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ] as $hook ) {
			add_action( $hook, [ __CLASS__, 'maybe_flush_on_meta' ], 10, 3 );
		}
	}

	public function register_routes() {
		register_rest_route( $this->namespace, '/' . $this->rest_base, [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_item' ],
				'permission_callback' => [ $this, 'get_item_permissions_check' ],
			],
		] );
	}

	public function get_item_permissions_check( $request ) {
		return Helper::check_rest_user_cap( 'manage_options' );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 */
	public function get_item( $request ) {
		$stats = get_transient( self::CACHE_KEY );

		if ( ! is_array( $stats ) ) {
			$stats = self::compute();
			set_transient( self::CACHE_KEY, $stats, self::CACHE_TTL );
		}

		return new WP_REST_Response( $stats, 200 );
	}

	public static function flush(): void {
		delete_transient( self::CACHE_KEY );
	}

	/**
	 * Only the meta that feeds these numbers invalidates the cache.
	 *
	 * @param int|int[] $meta_id  Meta id(s).
	 * @param int       $post_id  Post id.
	 * @param string    $meta_key Meta key.
	 */
	public static function maybe_flush_on_meta( $meta_id, $post_id, $meta_key ): void {
		if ( in_array( $meta_key, [ '_storeengine_cost_price', '_storeengine_stock_quantity', '_storeengine_manage_stock' ], true ) ) {
			self::flush();
		}
	}

	/**
	 * @return array{products:int, published:int, variable_products:int, variations:int, items:int, tracked_units:float, stock_value:float, currency:string}
	 */
	public static function compute(): array {
		global $wpdb;

		$post_type  = Helper::PRODUCT_POST_TYPE;
		$variations = $wpdb->prefix . 'storeengine_product_variations';
		// Everything except trashed / never-saved posts.
		$live = "p.post_type = %s AND p.post_status NOT IN ( 'trash', 'auto-draft', 'inherit' )";

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- aggregate-only counts over a custom table + core posts; cached in a transient above. %i-free: table name is the prefixed constant.

		// 1) Products.
		$products = $wpdb->get_row( $wpdb->prepare(
			"SELECT COUNT(*) AS total, SUM( p.post_status = 'publish' ) AS published
			FROM {$wpdb->posts} p
			WHERE {$live}",
			$post_type
		) );

		// 2) Variations: count, and stock value of those that track stock.
		// Cost falls back to the product's cost when the variation has none
		// (same rule the order snapshot uses).
		$variation_row = $wpdb->get_row( $wpdb->prepare(
			"SELECT COUNT( v.id ) AS variations,
				COUNT( DISTINCT v.product_id ) AS variable_products,
				SUM( CASE WHEN v.manage_stock = 1 THEN GREATEST( COALESCE( v.stock_quantity, 0 ), 0 ) ELSE 0 END ) AS units,
				SUM( CASE WHEN v.manage_stock = 1
					THEN GREATEST( COALESCE( v.stock_quantity, 0 ), 0 ) * COALESCE( v.cost_price, CAST( cost.meta_value AS DECIMAL( 26, 8 ) ), 0 )
					ELSE 0 END ) AS value
			FROM {$variations} v
			INNER JOIN {$wpdb->posts} p ON p.ID = v.product_id
			LEFT JOIN {$wpdb->postmeta} cost ON cost.post_id = v.product_id AND cost.meta_key = '_storeengine_cost_price'
			WHERE {$live}",
			$post_type
		) );

		// 3) Product-level stock: simple products, and variable products whose
		// variations don't track their own quantity (stock kept on the parent).
		$product_row = $wpdb->get_row( $wpdb->prepare(
			"SELECT SUM( GREATEST( CAST( qty.meta_value AS DECIMAL( 26, 8 ) ), 0 ) ) AS units,
				SUM( GREATEST( CAST( qty.meta_value AS DECIMAL( 26, 8 ) ), 0 ) * COALESCE( CAST( cost.meta_value AS DECIMAL( 26, 8 ) ), 0 ) ) AS value
			FROM {$wpdb->posts} p
			INNER JOIN {$wpdb->postmeta} ms ON ms.post_id = p.ID AND ms.meta_key = '_storeengine_manage_stock' AND ms.meta_value IN ( '1', 'yes', 'true' )
			INNER JOIN {$wpdb->postmeta} qty ON qty.post_id = p.ID AND qty.meta_key = '_storeengine_stock_quantity'
			LEFT JOIN {$wpdb->postmeta} cost ON cost.post_id = p.ID AND cost.meta_key = '_storeengine_cost_price'
			LEFT JOIN {$variations} tv ON tv.product_id = p.ID AND tv.manage_stock = 1
			WHERE {$live} AND tv.id IS NULL",
			$post_type
		) );

		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		$total             = (int) ( $products->total ?? 0 );
		$variation_count   = (int) ( $variation_row->variations ?? 0 );
		$variable_products = (int) ( $variation_row->variable_products ?? 0 );

		return [
			'products'          => $total,
			'published'         => (int) ( $products->published ?? 0 ),
			'variable_products' => $variable_products,
			'variations'        => $variation_count,
			// Sellable items: each simple product once, each variation once.
			'items'             => max( 0, $total - $variable_products ) + $variation_count,
			'tracked_units'     => round( (float) ( $variation_row->units ?? 0 ) + (float) ( $product_row->units ?? 0 ), 3 ),
			'stock_value'       => round( (float) ( $variation_row->value ?? 0 ) + (float) ( $product_row->value ?? 0 ), 2 ),
			'currency'          => (string) Helper::get_settings( 'store_currency', 'USD' ),
			'generated_at'      => time(),
		];
	}
}
