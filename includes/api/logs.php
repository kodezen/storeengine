<?php
namespace StoreEngine\API;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Server;
use WP_Error;
use StoreEngine\Utils\Helper;
use StoreEngine\Classes\LogItem;
use StoreEngine\Classes\LogItemCollection;
use StoreEngine\Classes\LogCleanup;

class Logs extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = STOREENGINE_PLUGIN_SLUG . '/v1';
		$this->rest_base = 'logs';
	}

	/**
	 * Init the API class.
	 */
	public static function init() {
		$self = new self();
		add_action( 'rest_api_init',[ $self, 'register_routes' ] );
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		// Route to fetch and delete logs.
		register_rest_route( $this->namespace, '/' . $this->rest_base, [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_items' ],
				// Log entries carry order data, gateway errors, customer emails
				// and stack traces — same admin gate as every other route here.
				'permission_callback' => [ $this, 'permissions_check' ],
				'args'                => $this->get_collection_params(),
			],
			[
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'delete_items' ],
				'permission_callback' => [ $this, 'permissions_check' ],
				'args'                => [
					'ids' => [
						'required' => true,
						'type'     => 'array',
						'items'    => [
							'type' => 'integer',
						],
					],
				],
			],
		] );

		// Route to run the retention cleanup on demand (independent of the daily
		// Action Scheduler job — useful when loopback/WP-Cron doesn't run on the
		// server, which is the usual reason auto-cleanup "doesn't work" on live).
		register_rest_route( $this->namespace, '/' . $this->rest_base . '/cleanup', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'run_cleanup' ],
				'permission_callback' => [ $this, 'permissions_check' ],
			],
		] );

		// Route to clear logs by the current filter (status/module/search) or all
		// of them. Distinct from /cleanup: this ignores the retention window and
		// can remove any status, so admins can purge e.g. Critical/Emergency logs
		// that the age-based auto-cleanup never touches.
		register_rest_route( $this->namespace, '/' . $this->rest_base . '/clear', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'clear_logs' ],
				'permission_callback' => [ $this, 'permissions_check' ],
				'args'                => [
					'status' => [ 'sanitize_callback' => 'sanitize_text_field' ],
					'module' => [ 'sanitize_callback' => 'sanitize_text_field' ],
					'search' => [ 'sanitize_callback' => 'sanitize_text_field' ],
					// 0 / absent = clear all matching rows; >0 = only rows older
					// than that many days.
					'days'   => [ 'default' => 0, 'sanitize_callback' => 'absint' ],
				],
			],
		] );

		// Route to get and save log cleanup settings.
		register_rest_route( $this->namespace, '/' . $this->rest_base . '/settings', [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_settings' ],
				'permission_callback' => [ $this, 'permissions_check' ],
			],
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'save_settings' ],
				'permission_callback' => [ $this, 'permissions_check' ],
				'args'                => $this->get_settings_params(),
			],
		] );
	}

	/**
	 * Get a collection of logs.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_items( $request ) {
		$args =[
			'page'     => (int) $request->get_param( 'page' ),
			'per_page' => (int) $request->get_param( 'per_page' ),
			'where'    => []
		];

		if ( $status = $request->get_param( 'status' ) ) {
			$args['where'][] =[ 'key' => 'status', 'value' => $status ];
		}

		if ( $module = $request->get_param( 'module' ) ) {
			$args['where'][] =[ 'key' => 'module', 'value' => $module ];
		}

		if ( $search = $request->get_param( 'search' ) ) {
			$args['where'][] =[ 'key' => 'title', 'value' => $search, 'compare' => 'LIKE' ];
		}

		// Best-effort entity filters: the storeengine_logs.content column holds a
		// JSON blob (when Logger::log was called with an array). Most relevant
		// modules — checkout, gateways, abandoned-cart-email — pass order_id /
		// customer_id / abandoned_cart_id keys. Match via LIKE so per-entity
		// detail pages can surface "anything we logged about this order/customer/cart"
		// without us migrating every Logger call site to write structured columns.
		// Brittle if log writers stop including these keys, but acceptable as a
		// best-effort view (the canonical audit still lives in storeengine_email_log).
		if ( $order_id = (int) $request->get_param( 'order_id' ) ) {
			$args['where'][] = [
				'key'     => 'content',
				'value'   => '%"order_id":' . $order_id . '%',
				'compare' => 'LIKE',
			];
		}

		if ( $customer_id = (int) $request->get_param( 'customer_id' ) ) {
			$args['where'][] = [
				'key'     => 'content',
				'value'   => '%"customer_id":' . $customer_id . '%',
				'compare' => 'LIKE',
			];
		}

		if ( $abc_id = (int) $request->get_param( 'abandoned_cart_id' ) ) {
			$args['where'][] = [
				'key'     => 'content',
				'value'   => '%"abandoned_cart":' . $abc_id . '%',
				'compare' => 'LIKE',
			];
		}

		$collection = new LogItemCollection( $args );

		$results = $collection->get_results();
		$data    =[];

		foreach ( $results as $log ) {
			$data[] = $log->get_data();
		}

		$response = rest_ensure_response( $data );
		$response->header( 'X-WP-Total', (string) $collection->get_found_results() );
		$response->header( 'X-WP-TotalPages', (string) $collection->get_max_num_pages() );

		return $response;
	}

	/**
	 * Delete single or multiple logs.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function delete_items( $request ) {
		$ids = $request->get_param( 'ids' );

		if ( empty( $ids ) || ! is_array( $ids ) ) {
			return new WP_Error( 'invalid_log_ids', __( 'Invalid or empty IDs provided.', 'storeengine' ), [ 'status' => 400 ] );
		}

		$query = new LogItemCollection( [
			'per_page' => - 1,
			'where'    => [
				'key'     => 'id',
				'value'   => array_filter( array_unique( array_map( 'absint', $ids ) ) ),
				'compare' => 'IN',
			]
		] );

		$deleted = [];

		while ( $query->have_results() ) {
			$query->the_result();
			global $log;

			try {
				$id = $log->get_id();
				$log->delete( true );
				$deleted[] = $id;
			} catch ( \Throwable $e ) {
				// No op.
			}
		}

		$deleted_count = count( $deleted );

		return rest_ensure_response( [
			'message' => sprintf(
			// translators: %d is the number of deleted logs.
				_n( '%d log deleted successfully.', '%d logs deleted successfully.', $deleted_count, 'storeengine' ),
				$deleted_count
			),
			'deleted' => $deleted,
		] );
	}

	/**
	 * Run the retention cleanup immediately using the saved settings.
	 *
	 * Applies the same rules as the daily job (retention_days + cleanup_statuses),
	 * so it only removes the log statuses the admin opted to auto-delete. Returns
	 * the number of rows removed so the UI can report it.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function run_cleanup( $request ) {
		$deleted = LogCleanup::execute_cleanup();

		return rest_ensure_response( [
			'message' => sprintf(
			// translators: %d is the number of deleted logs.
				_n( '%d log deleted.', '%d logs deleted.', $deleted, 'storeengine' ),
				$deleted
			),
			'deleted' => $deleted,
		] );
	}

	/**
	 * Clear logs matching the given filters (or all logs when none are given).
	 *
	 * Ignores the retention window and can delete any status, so it can remove
	 * logs the age-based cleanup never touches. Returns the number removed.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function clear_logs( $request ) {
		$deleted = LogCleanup::clear( [
			'status'          => (string) $request->get_param( 'status' ),
			'module'          => (string) $request->get_param( 'module' ),
			'search'          => (string) $request->get_param( 'search' ),
			'older_than_days' => (int) $request->get_param( 'days' ),
		] );

		return rest_ensure_response( [
			'message' => sprintf(
			// translators: %d is the number of deleted logs.
				_n( '%d log cleared.', '%d logs cleared.', $deleted, 'storeengine' ),
				$deleted
			),
			'deleted' => $deleted,
		] );
	}

	/**
	 * Retrieve log cleanup settings from the database.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_settings( $request ) {
		$settings = get_option( 'storeengine_log_settings',[
			'retention_days'   => 30,
			'cleanup_statuses' => [ 'success' ]
		] );

		return rest_ensure_response( $settings );
	}

	/**
	 * Save log cleanup settings to the database.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function save_settings( $request ) {
		$retention_days   = (int) $request->get_param( 'retention_days' );
		$cleanup_statuses = $request->get_param( 'cleanup_statuses' );

		// Security check: Fallback to an empty array if not a valid array.
		if ( ! is_array( $cleanup_statuses ) ) {
			$cleanup_statuses = [];
		}

		$settings =[
			'retention_days'   => $retention_days,
			'cleanup_statuses' => array_map( 'sanitize_text_field', $cleanup_statuses )
		];

		update_option( 'storeengine_log_settings', $settings );

		return rest_ensure_response([
			'message'  => __( 'Log settings saved successfully.', 'storeengine' ),
			'settings' => $settings
		] );
	}

	/**
	 * Check if a given request has access to the logs.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|\WP_Error
	 */
	public function permissions_check( $request ) {
		return Helper::check_rest_user_cap( 'manage_options' );
	}

	/**
	 * Get the query params for collections.
	 *
	 * @return array
	 */
	public function get_collection_params(): array {
		return [
			'page'              => [ 'default' => 1, 'sanitize_callback' => 'absint' ],
			'per_page'          => [ 'default' => 20, 'sanitize_callback' => 'absint' ],
			'status'            => [ 'sanitize_callback' => 'sanitize_text_field' ],
			'module'            => [ 'sanitize_callback' => 'sanitize_text_field' ],
			'search'            => [ 'sanitize_callback' => 'sanitize_text_field' ],
			'order_id'          => [ 'sanitize_callback' => 'absint' ],
			'customer_id'       => [ 'sanitize_callback' => 'absint' ],
			'abandoned_cart_id' => [ 'sanitize_callback' => 'absint' ],
		];
	}

	/**
	 * Get the validation parameters for saving settings.
	 *
	 * @return array
	 */
	public function get_settings_params(): array {
		return [
			'retention_days' =>[
				'required'          => true,
				'type'              => 'integer',
				'sanitize_callback' => 'absint'
			],
			'cleanup_statuses' =>[
				'required'          => true,
				'type'              => 'array',
				'items'             =>[
					'type' => 'string'
				]
			]
		];
	}
}
