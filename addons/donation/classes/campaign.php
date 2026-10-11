<?php
/**
 * Campaign model + running-total maintenance.
 *
 * A donation product is auto-mapped to one campaign row so goal/progress logic
 * is uniform whether the campaign is a plain product (Free) or a campaign CPT
 * (Pro Fundraising). The progress bar reads the cached raised_amount rather than
 * summing orders; totals are incremented when a donation order is paid and
 * reversed on refund (mirrors the affiliate addon's ledger approach).
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation\Classes;

use StoreEngine\Addons\Donation\Database;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Campaign {

	/**
	 * Product-meta keys for campaign configuration.
	 */
	const GOAL_META      = '_storeengine_donation_goal';
	const GOAL_TYPE_META = '_storeengine_donation_goal_type';
	const ENDS_META      = '_storeengine_donation_ends_at';

	/**
	 * Resolve — creating if needed — the campaign row id for a donation product.
	 *
	 * @param int $product_id
	 *
	 * @return int Campaign id (0 on failure).
	 */
	public static function get_or_create_for_product( int $product_id ): int {
		global $wpdb;
		$table = Database::campaigns_table();

		// Prefer a real campaign (a CPT campaign built in the campaign builder and
		// linked to this product, i.e. post_id IS NOT NULL) over the auto-created
		// product row, so donations for a product-backed campaign land on that
		// campaign's totals — not a hidden duplicate.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		$id = (int) $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE product_id = %d ORDER BY ( post_id IS NOT NULL ) DESC, id ASC LIMIT 1", $product_id ) );

		if ( $id ) {
			return $id;
		}

		$now   = current_time( 'mysql', true );
		$title = get_the_title( $product_id );
		$goal  = get_post_meta( $product_id, self::GOAL_META, true );
		$ends  = get_post_meta( $product_id, self::ENDS_META, true );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery
		$wpdb->insert( $table, [
			'title'         => $title ?: '',
			'slug'          => sanitize_title( $title ) . '-' . $product_id,
			'type'          => 'donation',
			'product_id'    => $product_id,
			'goal_type'     => get_post_meta( $product_id, self::GOAL_TYPE_META, true ) ?: 'amount',
			'goal_amount'   => '' !== $goal ? (float) $goal : null,
			'raised_amount' => 0,
			'ends_at'       => $ends ?: null,
			'status'        => 'active',
			'date_created'  => $now,
			'date_modified' => $now,
		] );
		// phpcs:enable

		return (int) $wpdb->insert_id;
	}

	/**
	 * A campaign's title (for denormalized snapshots on the ledger).
	 *
	 * @param int $campaign_id
	 *
	 * @return string
	 */
	public static function get_title( int $campaign_id ): string {
		global $wpdb;
		$table = Database::campaigns_table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		return (string) $wpdb->get_var( $wpdb->prepare( "SELECT title FROM {$table} WHERE id = %d", $campaign_id ) );
	}

	/**
	 * Add a paid contribution to a campaign's running totals.
	 *
	 * @param int   $campaign_id
	 * @param float $amount
	 * @param bool  $new_contributor Whether this is the donor's first contribution.
	 */
	public static function add_contribution( int $campaign_id, float $amount, bool $new_contributor = true ): void {
		global $wpdb;
		$table = Database::campaigns_table();

		// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		$wpdb->query( $wpdb->prepare(
			"UPDATE {$table}
			 SET raised_amount = raised_amount + %f,
			     contribution_count = contribution_count + 1,
			     contributor_count = contributor_count + %d,
			     date_modified = %s
			 WHERE id = %d",
			$amount,
			$new_contributor ? 1 : 0,
			current_time( 'mysql', true ),
			$campaign_id
		) );
		// phpcs:enable
	}

	/**
	 * Reverse a contribution that no longer counts (refunded, cancelled, failed)
	 * from a campaign's running totals. Clamped at zero so a total can never go
	 * negative.
	 *
	 * @param int   $campaign_id
	 * @param float $amount
	 * @param bool  $drop_contributor Whether the donor has no counted contribution
	 *                                left, so the distinct-donor count drops too.
	 *                                Callers that can't tell should pass false —
	 *                                the count is only ever too high, never wrong
	 *                                in a way that hides donors.
	 */
	public static function reverse_contribution( int $campaign_id, float $amount, bool $drop_contributor = false ): void {
		global $wpdb;
		$table = Database::campaigns_table();

		// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		$wpdb->query( $wpdb->prepare(
			"UPDATE {$table}
			 SET raised_amount = GREATEST(0, raised_amount - %f),
			     contribution_count = GREATEST(0, contribution_count - 1),
			     contributor_count = GREATEST(0, contributor_count - %d),
			     date_modified = %s
			 WHERE id = %d",
			$amount,
			$drop_contributor ? 1 : 0,
			current_time( 'mysql', true ),
			$campaign_id
		) );
		// phpcs:enable
	}

	/**
	 * Whether a campaign row exists.
	 *
	 * @param int $campaign_id
	 *
	 * @return bool
	 */
	public static function exists( int $campaign_id ): bool {
		global $wpdb;
		$table = Database::campaigns_table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		return (bool) $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE id = %d", $campaign_id ) );
	}

	/**
	 * Progress snapshot for a campaign row.
	 *
	 * @param int $campaign_id
	 *
	 * @return array{raised:float,goal:?float,percent:float,contributions:int,contributors:int}
	 */
	public static function get_progress( int $campaign_id ): array {
		global $wpdb;
		$table = Database::campaigns_table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT raised_amount, goal_amount, contribution_count, contributor_count FROM {$table} WHERE id = %d", $campaign_id ) );

		$raised = $row ? (float) $row->raised_amount : 0.0;
		$goal   = ( $row && null !== $row->goal_amount ) ? (float) $row->goal_amount : null;

		return [
			'raised'        => $raised,
			'goal'          => $goal,
			'percent'       => ( $goal && $goal > 0 ) ? min( 100, round( ( $raised / $goal ) * 100, 2 ) ) : 0.0,
			'contributions' => $row ? (int) $row->contribution_count : 0,
			'contributors'  => $row ? (int) $row->contributor_count : 0,
		];
	}

	/**
	 * Progress for a product (resolves its campaign, without creating one).
	 *
	 * @param int $product_id
	 *
	 * @return array|null
	 */
	public static function get_progress_for_product( int $product_id ): ?array {
		global $wpdb;
		$table = Database::campaigns_table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		$id = (int) $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE product_id = %d ORDER BY ( post_id IS NOT NULL ) DESC, id ASC LIMIT 1", $product_id ) );

		return $id ? self::get_progress( $id ) : null;
	}
}

// End of file campaign.php
