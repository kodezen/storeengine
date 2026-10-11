<?php
namespace StoreEngine\Classes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class LogCleanup {

	/**
	 * main cleanup logic
	 *
	 * @return int Number of log rows deleted (0 when nothing matched or the
	 *             settings disable cleanup). Callable both from the daily
	 *             Action Scheduler job and the manual "Clean up now" REST route.
	 */
	public static function execute_cleanup(): int {
		global $wpdb;
		$table = $wpdb->prefix . 'storeengine_logs';

		// admin setting
		$settings = get_option( 'storeengine_log_settings',[
			'retention_days'   => 30,
			'cleanup_statuses' => [ 'success' ]
		] );

		$days     = (int) ( $settings['retention_days'] ?? 30 );
		$statuses = $settings['cleanup_statuses'] ?? [ 'success' ];

		if ( $days <= 0 || empty( $statuses ) || ! is_array( $statuses ) ) {
			return 0;
		}

		// The logger stores `date` via current_time( 'mysql' ) — i.e. the site's
		// configured (WordPress) timezone, NOT UTC — so the retention cutoff has to
		// be expressed in that same timezone or the comparison is off by the site's
		// UTC offset. wp_date() converts the UTC instant "$days ago" into a
		// wall-clock string in the site timezone ( wp_timezone() ).
		$threshold_date = wp_date( 'Y-m-d H:i:s', time() - ( $days * DAY_IN_SECONDS ) );

		//  SQL query — table via %i identifier placeholder, all values via prepare().
		$placeholders = implode( ',', array_fill( 0, count( $statuses ), '%s' ) );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- Dynamic IN() list on a custom StoreEngine log table: %i identifier + every value (%s) bound through prepare(); $placeholders holds only literal "%s" tokens. The static analyzer cannot count the array_merge() replacement args.
		$deleted = $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM %i WHERE date < %s AND status IN ($placeholders)",
				array_merge( [ $table, $threshold_date ], $statuses )
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber

		return (int) $deleted;
	}

	/**
	 * Delete logs matching optional filters, ignoring the retention window.
	 *
	 * With no filters this clears the entire log table. Used by the manual
	 * "Clear logs" toolbar action and the `wp storeengine logs clear` command,
	 * so admins can purge log statuses (Critical, Emergency, …) that aren't part
	 * of the age-based auto-cleanup at all.
	 *
	 * @param array $filters { status?: string, module?: string, search?: string, older_than_days?: int }
	 * @return int Number of rows deleted.
	 */
	public static function clear( array $filters = [] ): int {
		global $wpdb;

		[ $where_sql, $params ] = self::build_where( $filters );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- %i identifier + all values bound via prepare(); custom StoreEngine log table, not cacheable.
		$deleted = $wpdb->query(
			$wpdb->prepare( "DELETE FROM %i{$where_sql}", $params )
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return (int) $deleted;
	}

	/**
	 * Count logs that Cleanup::clear() would remove for the given filters.
	 *
	 * @param array $filters { status?: string, module?: string, search?: string, older_than_days?: int }
	 * @return int
	 */
	public static function count_matching( array $filters = [] ): int {
		global $wpdb;

		[ $where_sql, $params ] = self::build_where( $filters );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- %i identifier + all values bound via prepare(); custom StoreEngine log table, not cacheable.
		$count = $wpdb->get_var(
			$wpdb->prepare( "SELECT COUNT(*) FROM %i{$where_sql}", $params )
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return (int) $count;
	}

	/**
	 * Build the shared WHERE clause + bound params for clear()/count_matching().
	 * The first bound param is always the table name (for the %i placeholder).
	 *
	 * @param array $filters { status?: string, module?: string, search?: string, older_than_days?: int }
	 * @return array{0:string,1:array} [ " WHERE …" | "", [ $table, …values ] ]
	 */
	protected static function build_where( array $filters ): array {
		global $wpdb;

		$table  = $wpdb->prefix . 'storeengine_logs';
		$params = [ $table ];
		$where  = [];

		if ( ! empty( $filters['status'] ) ) {
			$where[]  = 'status = %s';
			$params[] = (string) $filters['status'];
		}

		if ( ! empty( $filters['module'] ) ) {
			$where[]  = 'module = %s';
			$params[] = (string) $filters['module'];
		}

		if ( ! empty( $filters['search'] ) ) {
			$where[]  = 'title LIKE %s';
			$params[] = '%' . $wpdb->esc_like( (string) $filters['search'] ) . '%';
		}

		// Age cap: only rows older than N days. Threshold is expressed in the
		// site's WordPress timezone via wp_date() to match the local timestamps
		// the logger stores ( current_time( 'mysql' ) ) — same fix as the
		// retention cleanup. Absent/0 ⇒ no age limit (clears all matching rows).
		if ( ! empty( $filters['older_than_days'] ) ) {
			$days = (int) $filters['older_than_days'];
			if ( $days > 0 ) {
				$where[]  = 'date < %s';
				$params[] = wp_date( 'Y-m-d H:i:s', time() - ( $days * DAY_IN_SECONDS ) );
			}
		}

		$where_sql = $where ? ' WHERE ' . implode( ' AND ', $where ) : '';

		return [ $where_sql, $params ];
	}
}