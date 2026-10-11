<?php

namespace StoreEngine\Cli;

use StoreEngine\Classes\LogCleanup;
use WP_CLI;
use WP_CLI_Command;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Manage the StoreEngine system logs (the storeengine_logs table).
 */
class Logs extends WP_CLI_Command {

	/**
	 * Run the retention cleanup now, using the saved log settings.
	 *
	 * Applies the same rules as the daily scheduled job (retention_days +
	 * cleanup_statuses), so it only removes the statuses the admin opted to
	 * auto-delete. Useful on servers where WP-Cron / Action Scheduler doesn't
	 * run and the automatic cleanup never fires.
	 *
	 * ## EXAMPLES
	 *
	 *     wp storeengine logs cleanup
	 *
	 * @when after_wp_load
	 */
	public function cleanup( $args, $assoc_args ) {
		$deleted = LogCleanup::execute_cleanup();

		WP_CLI::success( sprintf(
			/* translators: %d: number of deleted log rows. */
			_n( 'Retention cleanup removed %d log.', 'Retention cleanup removed %d logs.', $deleted, 'storeengine' ),
			$deleted
		) );
	}

	/**
	 * Clear logs by filter (or all of them), ignoring the retention window.
	 *
	 * Unlike `cleanup`, this can delete any status — including Critical /
	 * Emergency / Alert logs that the age-based cleanup never touches.
	 *
	 * ## OPTIONS
	 *
	 * [--status=<status>]
	 * : Only clear logs with this status (e.g. critical, error, success).
	 *
	 * [--module=<module>]
	 * : Only clear logs from this module (e.g. system, checkout, stripe).
	 *
	 * [--search=<search>]
	 * : Only clear logs whose title matches this text.
	 *
	 * [--days=<days>]
	 * : Only clear logs older than this many days (0/omitted = no age limit).
	 *
	 * [--all]
	 * : Required to clear the whole table when no other filter is given.
	 *
	 * [--dry-run]
	 * : Show how many logs would be removed without deleting anything.
	 *
	 * [--yes]
	 * : Skip the confirmation prompt.
	 *
	 * ## EXAMPLES
	 *
	 *     wp storeengine logs clear --status=critical
	 *     wp storeengine logs clear --module=system --dry-run
	 *     wp storeengine logs clear --days=30 --all --yes
	 *     wp storeengine logs clear --all --yes
	 *
	 * @when after_wp_load
	 */
	public function clear( $args, $assoc_args ) {
		$days = isset( $assoc_args['days'] ) ? absint( $assoc_args['days'] ) : 0;

		$filters = [
			'status'          => isset( $assoc_args['status'] ) ? sanitize_text_field( $assoc_args['status'] ) : '',
			'module'          => isset( $assoc_args['module'] ) ? sanitize_text_field( $assoc_args['module'] ) : '',
			'search'          => isset( $assoc_args['search'] ) ? sanitize_text_field( $assoc_args['search'] ) : '',
			'older_than_days' => $days,
		];

		$has_filter = '' !== $filters['status'] || '' !== $filters['module'] || '' !== $filters['search'] || $days > 0;

		// Guard against an accidental full wipe: clearing everything (no filter
		// and no age limit) needs --all.
		if ( ! $has_filter && ! isset( $assoc_args['all'] ) ) {
			WP_CLI::error( 'Refusing to clear ALL logs without --all. Pass --all, or narrow with --status/--module/--search/--days.' );
		}

		$count = LogCleanup::count_matching( $filters );

		if ( 0 === $count ) {
			WP_CLI::success( 'No matching logs to clear.' );

			return;
		}

		$scope = $has_filter ? 'matching' : 'ALL';

		if ( isset( $assoc_args['dry-run'] ) ) {
			WP_CLI::success( sprintf( 'Dry run: %d %s log(s) would be cleared.', $count, $scope ) );

			return;
		}

		WP_CLI::confirm( sprintf( 'Clear %d %s log(s)? This cannot be undone.', $count, $scope ), $assoc_args );

		$deleted = LogCleanup::clear( $filters );

		WP_CLI::success( sprintf(
			/* translators: %d: number of cleared log rows. */
			_n( 'Cleared %d log.', 'Cleared %d logs.', $deleted, 'storeengine' ),
			$deleted
		) );
	}
}
