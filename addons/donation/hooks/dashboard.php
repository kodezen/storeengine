<?php
/**
 * Donor account dashboard (front end).
 *
 * Adds a "Donations" tab to the customer account dashboard listing the logged-in
 * donor's contributions from the ledger. Uses the same menu-item filter +
 * per-endpoint content action the core Orders / subscription Plans tabs use.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation\Hooks;

use StoreEngine\Addons\Donation\Database;
use StoreEngine\Traits\Singleton;
use StoreEngine\Utils\Formatting;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Dashboard {

	use Singleton;

	const ENDPOINT = 'donations';

	public function __construct() {
		add_filter( 'storeengine/frontend_dashboard_menu_items', [ $this, 'menu_item' ] );
		add_action( 'storeengine/frontend/dashboard_' . self::ENDPOINT . '_endpoint', [ $this, 'render_content' ] );
	}

	/**
	 * @param array $items
	 *
	 * @return array
	 */
	public function menu_item( array $items ): array {
		return array_merge( $items, [
			self::ENDPOINT => [
				'label'    => __( 'Donations', 'storeengine' ),
				'icon'     => 'storeengine-icon storeengine-icon--invoice',
				'public'   => true,
				'priority' => 55,
				'group'    => 'orders',
			],
		] );
	}

	/**
	 * Render the current donor's contribution history.
	 */
	public function render_content(): void {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return;
		}

		global $wpdb;
		$table = Database::donations_table();

		// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		$rows = $wpdb->get_results( $wpdb->prepare(
			"SELECT product_id, amount, currency, status, is_recurring, date_created
			 FROM {$table}
			 WHERE customer_id = %d AND status <> 'pending'
			 ORDER BY id DESC",
			$user_id
		) );
		// phpcs:enable
		?>
		<div class="storeengine-dashboard-donations">
			<h3 class="storeengine-dashboard-donations__title"><?php esc_html_e( 'Your donations', 'storeengine' ); ?></h3>

			<?php if ( empty( $rows ) ) : ?>
				<p><?php esc_html_e( 'You have not made any donations yet.', 'storeengine' ); ?></p>
			<?php else : ?>
				<table class="storeengine-table storeengine-dashboard-donations__table">
					<thead>
						<tr>
							<th><?php esc_html_e( 'Date', 'storeengine' ); ?></th>
							<th><?php esc_html_e( 'Campaign', 'storeengine' ); ?></th>
							<th><?php esc_html_e( 'Amount', 'storeengine' ); ?></th>
							<th><?php esc_html_e( 'Status', 'storeengine' ); ?></th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $rows as $row ) : ?>
							<tr>
								<td><?php echo esc_html( date_i18n( get_option( 'date_format' ), strtotime( $row->date_created ) ) ); ?></td>
								<td>
									<?php echo esc_html( get_the_title( (int) $row->product_id ) ); ?>
									<?php if ( (int) $row->is_recurring ) : ?>
										<span class="storeengine-badge storeengine-badge--recurring"><?php esc_html_e( 'Recurring', 'storeengine' ); ?></span>
									<?php endif; ?>
								</td>
								<td><?php echo wp_kses_post( Formatting::price( (float) $row->amount, [ 'currency' => $row->currency ?: '' ] ) ); ?></td>
								<td><?php echo esc_html( ucfirst( $row->status ) ); ?></td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>
		</div>
		<?php
	}
}

// End of file dashboard.php
