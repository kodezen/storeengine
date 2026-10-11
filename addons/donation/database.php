<?php
/**
 * Donation addon database schema.
 *
 * Two tables owned by the free addon:
 *
 *   - storeengine_donation_campaigns : one row per donation product (auto-
 *     created) or, under the Pro Fundraising addon, per campaign CPT. Holds the
 *     goal and a running raised/contributor total so the progress bar reads a
 *     single cached row instead of scanning orders.
 *   - storeengine_donations          : the contribution ledger — one row per
 *     paid donation line (and per recurring renewal), the audit trail behind the
 *     campaign running totals.
 *
 * Table creation is driven by the core addon manager, which compares
 * get_db_version() against the shared version map and calls install_tables()
 * (→ Database::install) on a mismatch. dbDelta is idempotent.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Database {

	const DB_VERSION = '1.1.0';

	/**
	 * The version the schema manager compares against.
	 *
	 * Core hashes the contents of its schema files rather than trusting a
	 * hand-typed constant, precisely so adding a column cannot be forgotten
	 * about — see Database::maybe_sync_schema(). This addon keeps one schema
	 * file, so hashing that gives the same guarantee: edit the table definition
	 * and install() re-runs on its own.
	 *
	 * DB_VERSION stays on the front so the stored value still reads like a
	 * version when you look at the option, and bumping it by hand still forces a
	 * run — the hash only adds the case somebody forgot to.
	 *
	 * @return string
	 */
	public static function schema_version(): string {
		$hash = is_readable( __FILE__ ) ? md5_file( __FILE__ ) : '';

		return self::DB_VERSION . ( $hash ? '-' . substr( $hash, 0, 12 ) : '' );
	}

	public static function campaigns_table(): string {
		global $wpdb;
		return $wpdb->prefix . 'storeengine_donation_campaigns';
	}

	public static function donations_table(): string {
		global $wpdb;
		return $wpdb->prefix . 'storeengine_donations';
	}

	public static function install(): void {
		global $wpdb;
		if ( ! function_exists( 'dbDelta' ) ) {
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		}
		$cc = $wpdb->has_cap( 'collation' ) ? $wpdb->get_charset_collate() : '';

		$campaigns = self::campaigns_table();
		$donations = self::donations_table();

		dbDelta( "CREATE TABLE IF NOT EXISTS {$campaigns} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			title VARCHAR(191) NOT NULL DEFAULT '',
			slug VARCHAR(191) NOT NULL DEFAULT '',
			type VARCHAR(20) NOT NULL DEFAULT 'donation',
			post_id BIGINT(20) UNSIGNED DEFAULT NULL,
			product_id BIGINT(20) UNSIGNED NOT NULL,
			fund_id BIGINT(20) UNSIGNED DEFAULT NULL,
			fundraiser_id BIGINT(20) UNSIGNED DEFAULT NULL,
			goal_type VARCHAR(20) NOT NULL DEFAULT 'amount',
			goal_amount DECIMAL(20,4) DEFAULT NULL,
			raised_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
			contribution_count BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
			contributor_count BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
			reaching_action VARCHAR(20) NOT NULL DEFAULT 'continue',
			platform_fee_percent DECIMAL(6,3) DEFAULT NULL,
			currency VARCHAR(3) DEFAULT NULL,
			starts_at DATETIME DEFAULT NULL,
			ends_at DATETIME DEFAULT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			date_created DATETIME NOT NULL,
			date_modified DATETIME NOT NULL,
			PRIMARY KEY (id),
			KEY slug (slug),
			KEY product_id (product_id),
			KEY post_id (post_id),
			KEY fund_id (fund_id),
			KEY fundraiser_id (fundraiser_id),
			KEY status (status)
		) {$cc};" );

		dbDelta( "CREATE TABLE IF NOT EXISTS {$donations} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			uid VARCHAR(40) NOT NULL DEFAULT '',
			campaign_id BIGINT(20) UNSIGNED DEFAULT NULL,
			fund_id BIGINT(20) UNSIGNED DEFAULT NULL,
			order_id BIGINT(20) UNSIGNED NOT NULL,
			order_item_id BIGINT(20) UNSIGNED NOT NULL,
			subscription_id BIGINT(20) UNSIGNED DEFAULT NULL,
			product_id BIGINT(20) UNSIGNED NOT NULL,
			price_id BIGINT(20) UNSIGNED NOT NULL,
			customer_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
			campaign_title VARCHAR(191) DEFAULT NULL,
			donor_name VARCHAR(191) DEFAULT NULL,
			donor_email VARCHAR(190) DEFAULT NULL,
			amount DECIMAL(20,4) NOT NULL DEFAULT 0,
			recovery_fee DECIMAL(20,4) NOT NULL DEFAULT 0,
			currency VARCHAR(3) DEFAULT NULL,
			is_recurring TINYINT(1) NOT NULL DEFAULT 0,
			is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
			is_manual TINYINT(1) NOT NULL DEFAULT 0,
			is_company TINYINT(1) NOT NULL DEFAULT 0,
			company_name VARCHAR(191) DEFAULT NULL,
			tribute_type VARCHAR(20) DEFAULT NULL,
			tribute_to VARCHAR(191) DEFAULT NULL,
			tribute_recipient_name VARCHAR(191) DEFAULT NULL,
			tribute_recipient_email VARCHAR(190) DEFAULT NULL,
			tribute_notify_channel VARCHAR(20) DEFAULT NULL,
			tribute_recipient_address TEXT DEFAULT NULL,
			dedication TEXT DEFAULT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'pending',
			date_created DATETIME NOT NULL,
			date_updated DATETIME NOT NULL,
			PRIMARY KEY (id),
			KEY uid (uid),
			KEY order_id (order_id),
			KEY campaign_id (campaign_id),
			KEY fund_id (fund_id),
			KEY customer_id (customer_id),
			KEY price_id (price_id),
			KEY status (status)
		) {$cc};" );

		// dbDelta's column-diff/ALTER is unreliable (especially with
		// IF NOT EXISTS), so add newer columns explicitly on installs created
		// under an earlier DB version.
		self::maybe_add_column( $donations, 'campaign_title', 'VARCHAR(191) DEFAULT NULL AFTER customer_id' );
	}

	/**
	 * Add a column to a table if it isn't already present.
	 *
	 * @param string $table
	 * @param string $column
	 * @param string $definition
	 */
	protected static function maybe_add_column( string $table, string $column, string $definition ): void {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$exists = $wpdb->get_var( $wpdb->prepare( "SHOW COLUMNS FROM {$table} LIKE %s", $column ) );
		if ( $exists ) {
			return;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "ALTER TABLE {$table} ADD COLUMN {$column} {$definition}" );
	}
}

// End of file database.php
