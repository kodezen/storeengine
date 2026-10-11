<?php
/**
 * Donations REST API (free).
 *
 * Powers the admin Donations list page and its summary tiles. All routes require
 * `manage_options`.
 *
 *   GET /storeengine/v1/donations?page=&per_page=&status=
 *   GET /storeengine/v1/donations/summary
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation\API;

use StoreEngine\Addons\Donation\Database;
use StoreEngine\Addons\Donation\Helper;
use StoreEngine\API\AbstractRestApiController;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Register extends AbstractRestApiController {

	protected $rest_base = 'donations';

	public static function init(): void {
		$self = new self();
		add_action( 'rest_api_init', [ $self, 'register_routes' ] );
	}

	public function permissions_check(): bool {
		return current_user_can( 'manage_options' );
	}

	public function register_routes() {
		register_rest_route( $this->namespace, '/' . $this->rest_base, [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_donations' ],
				'permission_callback' => [ $this, 'permissions_check' ],
			],
		] );

		register_rest_route( $this->namespace, '/' . $this->rest_base . '/summary', [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_summary' ],
				'permission_callback' => [ $this, 'permissions_check' ],
			],
		] );
	}

	public function get_donations( WP_REST_Request $request ) {
		global $wpdb;
		$table = Database::donations_table();

		$per_page = max( 1, min( 100, (int) ( $request->get_param( 'per_page' ) ?: 20 ) ) );
		$page     = max( 1, (int) ( $request->get_param( 'page' ) ?: 1 ) );
		$offset   = ( $page - 1 ) * $per_page;
		$status   = sanitize_text_field( (string) $request->get_param( 'status' ) );

		$where  = "WHERE status <> 'pending'";
		$params = [];
		if ( $status && in_array( $status, [ 'completed', 'refunded' ], true ) ) {
			$where    = 'WHERE status = %s';
			$params[] = $status;
		}

		// A stacked phpcs:ignore only covers the comment beneath it, so every sniff
		// for this statement has to be named on one line.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL, WordPress.DB.PreparedSQLPlaceholders -- placeholders live in $where and the values go in as one array, which the sniff cannot follow.
		$total = (int) $wpdb->get_var( $params ? $wpdb->prepare( "SELECT COUNT(*) FROM {$table} {$where}", $params ) : "SELECT COUNT(*) FROM {$table} {$where}" );

		$query = "SELECT id, campaign_id, campaign_title, product_id, donor_name, donor_email, amount, currency, status, is_recurring, is_anonymous, date_created FROM {$table} {$where} ORDER BY id DESC LIMIT %d OFFSET %d";
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		$rows = $wpdb->get_results( $wpdb->prepare( $query, array_merge( $params, [ $per_page, $offset ] ) ) );

		foreach ( $rows as $row ) {
			// Denormalised title snapshot — no per-row post lookup. Fall back to a
			// live title only for the rare legacy row saved before the snapshot.
			$row->product_title = $row->campaign_title
				? $row->campaign_title
				: ( $row->product_id ? get_the_title( (int) $row->product_id ) : '' );
			$row->amount        = (float) $row->amount;
		}

		return rest_ensure_response( [
			'items'    => $rows,
			'total'    => $total,
			'page'     => $page,
			'per_page' => $per_page,
		] );
	}

	public function get_summary() {
		global $wpdb;
		$table = Database::donations_table();

		// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		$row = $wpdb->get_row( "SELECT
			COALESCE(SUM(amount),0) AS raised,
			COUNT(*) AS donations,
			COUNT(DISTINCT COALESCE(NULLIF(customer_id,0), donor_email)) AS donors,
			COALESCE(SUM(is_recurring),0) AS recurring
			FROM {$table} WHERE " . Helper::counted_status_sql() );
		// phpcs:enable

		return rest_ensure_response( [
			'raised'    => $row ? (float) $row->raised : 0.0,
			'donations' => $row ? (int) $row->donations : 0,
			'donors'    => $row ? (int) $row->donors : 0,
			'recurring' => $row ? (int) $row->recurring : 0,
		] );
	}
}

// End of file register.php
