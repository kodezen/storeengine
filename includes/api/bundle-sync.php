<?php
/**
 * Bundle sync REST controller.
 *
 * Retroactively grants every product currently in a bundle to everyone who has
 * already purchased that bundle. A bundle's contents are snapshotted into the
 * order line-item `_bundles` meta at checkout, so products added to a bundle
 * later never reach past buyers. This endpoint walks the paid orders containing
 * the bundle (in batches), merges the missing items into each order's snapshot,
 * grants download permissions for them, and fires an action add-ons listen to
 * (e.g. license management) to backfill their own grants. Every step is
 * idempotent, so re-running grants nothing new.
 *
 * @package StoreEngine\API
 */

namespace StoreEngine\API;

use StoreEngine\Classes\AbstractOrder;
use StoreEngine\Classes\OrderStatus\OrderStatus;
use StoreEngine\Hooks\DownloadPermissionHooks;
use StoreEngine\Utils\Helper;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class BundleSync extends AbstractRestApiController {

	protected $rest_base = 'bundle';

	public static function init() {
		$self = new self();
		add_action( 'rest_api_init', [ $self, 'register_routes' ] );
	}

	public function register_routes() {
		register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/sync-purchasers', [
			'args' => [
				'id' => [
					'description' => __( 'Bundle product ID.', 'storeengine' ),
					'type'        => 'integer',
					'required'    => true,
				],
			],
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'sync_purchasers' ],
				'permission_callback' => [ $this, 'permissions_check' ],
				'args'                => [
					'page'     => [
						'type'    => 'integer',
						'default' => 1,
						'minimum' => 1,
					],
					'per_page' => [
						'type'    => 'integer',
						'default' => 25,
						'minimum' => 1,
						'maximum' => 100,
					],
				],
			],
		] );
	}

	public function permissions_check() {
		return Helper::check_rest_user_cap( 'manage_options' );
	}

	/**
	 * Process one page of paid orders containing the bundle.
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function sync_purchasers( WP_REST_Request $request ) {
		global $wpdb;

		$bundle_id = absint( $request->get_param( 'id' ) );
		$page      = max( 1, absint( $request->get_param( 'page' ) ) );
		$per_page  = min( 100, max( 1, absint( $request->get_param( 'per_page' ) ) ) );

		$product = Helper::get_product( $bundle_id );
		if ( ! $product || 'bundled' !== $product->get_type() ) {
			return new WP_Error( 'invalid-bundle', __( 'Bundle product not found.', 'storeengine' ), [ 'status' => 404 ] );
		}

		$bundle_items = $product->get_bundles();
		if ( empty( $bundle_items ) ) {
			return new WP_Error( 'empty-bundle', __( 'This bundle has no items to sync.', 'storeengine' ), [ 'status' => 400 ] );
		}

		// Candidate orders are filtered by *exclusion*: anything that never became
		// an entitlement (drafts, cancellations, failures) is dropped in SQL, and
		// every survivor is then checked with self::order_is_entitled(). Selecting
		// by a paid-status allow-list here would silently skip the buyers that
		// matter most — a paid order still sitting in `processing`, and every
		// subscription / installment-plan, whose entitlement lives in the paid
		// status or the `active` lifecycle status rather than in `completed`.
		$excluded_statuses = self::get_excluded_statuses();
		$placeholders      = implode( ',', array_fill( 0, count( $excluded_statuses ), '%s' ) );

		$items_table  = $wpdb->prefix . 'storeengine_order_items';
		$meta_table   = $wpdb->prefix . 'storeengine_order_item_meta';
		$orders_table = $wpdb->prefix . 'storeengine_orders';

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- Trusted $wpdb->prefix table identifiers interpolated; user values bound via prepare() with a dynamic %s IN() list (count is correct at runtime); custom StoreEngine tables.
		$total = (int) $wpdb->get_var( $wpdb->prepare(
			"SELECT COUNT( DISTINCT oi.order_id )
			FROM {$items_table} oi
			INNER JOIN {$meta_table} oim ON oim.order_item_id = oi.order_item_id
			INNER JOIN {$orders_table} o ON o.id = oi.order_id
			WHERE oi.order_item_type = 'line_item'
				AND oim.meta_key = '_product_id'
				AND oim.meta_value = %d
				AND o.status NOT IN ( {$placeholders} )",
			array_merge( [ $bundle_id ], $excluded_statuses )
		) );

		$offset    = ( $page - 1 ) * $per_page;
		$order_ids = $wpdb->get_col( $wpdb->prepare(
			"SELECT DISTINCT oi.order_id
			FROM {$items_table} oi
			INNER JOIN {$meta_table} oim ON oim.order_item_id = oi.order_item_id
			INNER JOIN {$orders_table} o ON o.id = oi.order_id
			WHERE oi.order_item_type = 'line_item'
				AND oim.meta_key = '_product_id'
				AND oim.meta_value = %d
				AND o.status NOT IN ( {$placeholders} )
			ORDER BY oi.order_id ASC
			LIMIT %d OFFSET %d",
			array_merge( [ $bundle_id ], $excluded_statuses, [ $per_page, $offset ] )
		) );
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber

		$processed         = 0;
		$skipped           = 0;
		$granted_downloads = 0;
		$synced_orders     = 0;

		foreach ( $order_ids as $order_id ) {
			$order = Helper::get_order( (int) $order_id );
			if ( is_wp_error( $order ) || ! $order ) {
				$skipped++;
				continue;
			}

			if ( ! self::order_is_entitled( $order ) ) {
				$skipped++;
				continue;
			}

			$result = $this->sync_order( $order, $bundle_id, $bundle_items );

			$processed++;
			$granted_downloads += $result['downloads'];
			if ( ! empty( $result['new_products'] ) ) {
				$synced_orders++;
			}
		}

		$done = ( $offset + $per_page ) >= $total;

		return rest_ensure_response( [
			'total'             => $total,
			'page'              => $page,
			'per_page'          => $per_page,
			'processed'         => $processed,
			'skipped'           => $skipped,
			'granted_downloads' => $granted_downloads,
			'synced_orders'     => $synced_orders,
			'done'              => $done,
			'next_page'         => $done ? null : ( $page + 1 ),
			/**
			 * Bundle items that can be granted but not actually delivered — e.g. a
			 * licensable product with no released build behind it. Without this the
			 * buyer silently ends up with a license key and no download.
			 *
			 * @param array $warnings     List of ['product_id' => int, 'product_name' => string, 'reason' => string].
			 * @param array $bundle_items Current bundle contents.
			 * @param int   $bundle_id    The bundle being synced.
			 */
			'warnings'          => array_values( (array) apply_filters( 'storeengine/bundle/sync_warnings', [], $bundle_items, $bundle_id ) ),
		] );
	}

	/**
	 * Order statuses that can never carry an entitlement, so they are dropped in SQL.
	 *
	 * @return string[]
	 */
	protected static function get_excluded_statuses(): array {
		$statuses = [
			OrderStatus::AUTO_DRAFT,
			OrderStatus::DRAFT,
			OrderStatus::TRASH,
			OrderStatus::CANCELLED,
			OrderStatus::REFUNDED,
			OrderStatus::PAYMENT_FAILED,
			OrderStatus::PAYMENT_PENDING,
		];

		/**
		 * Filter the order statuses excluded from bundle sync.
		 *
		 * @param string[] $statuses Excluded statuses.
		 */
		return array_values( array_unique( array_filter( (array) apply_filters( 'storeengine/bundle/sync_excluded_statuses', $statuses ) ) ) );
	}

	/**
	 * Whether an order still entitles its buyer to the bundle's contents.
	 *
	 * Mirrors how the rest of the codebase decides a buyer has access: one-off
	 * orders go by their paid status (a paid order in `processing` is every bit
	 * as entitled as a `completed` one), recurring orders by their lifecycle
	 * status.
	 *
	 * @param AbstractOrder $order
	 *
	 * @return bool
	 */
	protected static function order_is_entitled( AbstractOrder $order ): bool {
		if ( $order->is_type( [ 'subscription', 'installment-plan' ] ) ) {
			$entitled = $order->has_status( [ 'active', 'trialing' ] ) || $order->is_paid();
		} else {
			$entitled = $order->is_paid()
				|| $order->has_status( Helper::get_order_paid_statuses() )
				|| $order->has_status( OrderStatus::get_is_paid_statuses() );
		}

		/**
		 * Filter whether an order entitles its buyer to newly-added bundle items.
		 *
		 * @param bool          $entitled Whether the order is entitled.
		 * @param AbstractOrder $order    The order being considered.
		 */
		return (bool) apply_filters( 'storeengine/bundle/sync_order_is_entitled', $entitled, $order );
	}

	/**
	 * Ensure one order carries every current bundle item.
	 *
	 * Merges items missing from the order line's `_bundles` snapshot, grants
	 * download permissions for the newly-added products, and fires an action so
	 * add-ons can backfill their own grants (e.g. licenses).
	 *
	 * @param AbstractOrder $order
	 * @param int           $bundle_id
	 * @param array         $bundle_items Current bundle contents from BundledProduct::get_bundles().
	 *
	 * @return array{downloads:int,new_products:int[]}
	 */
	protected function sync_order( AbstractOrder $order, int $bundle_id, array $bundle_items ): array {
		$downloads    = 0;
		$new_products = [];

		foreach ( $order->get_line_product_items() as $item ) {
			if ( 'bundled' !== $item->get_product_type() || $bundle_id !== $item->get_product_id() ) {
				continue;
			}

			$snapshot     = (array) $item->get_meta( '_bundles' );
			$existing_ids = array_map( 'intval', array_filter( wp_list_pluck( $snapshot, 'product_id' ) ) );

			$added = false;
			foreach ( $bundle_items as $bundle_item ) {
				$pid = (int) ( $bundle_item['product_id'] ?? 0 );
				if ( ! $pid || in_array( $pid, $existing_ids, true ) ) {
					continue;
				}

				$snapshot[]     = $bundle_item;
				$existing_ids[] = $pid;
				$new_products[] = $pid;
				$added          = true;
			}

			if ( $added ) {
				$item->update_meta_data( '_bundles', $snapshot );
				$item->save_meta_data();
			}
		}

		$new_products = array_values( array_unique( $new_products ) );

		foreach ( $new_products as $pid ) {
			$downloads += DownloadPermissionHooks::init()->grant_product_to_order( $order, $pid );
		}

		if ( $new_products ) {
			/**
			 * Fires after newly-added bundle items are granted to an existing purchaser's order.
			 *
			 * @param AbstractOrder $order        The buyer's order.
			 * @param int[]         $new_products Product IDs newly granted on this order.
			 * @param int           $bundle_id    The bundle product being synced.
			 */
			do_action( 'storeengine/bundle/order_synced', $order, $new_products, $bundle_id );
		}

		return [
			'downloads'    => $downloads,
			'new_products' => $new_products,
		];
	}
}
