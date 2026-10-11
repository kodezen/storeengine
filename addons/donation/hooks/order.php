<?php
/**
 * Order → ledger wiring.
 *
 * Flow:
 *   1. At checkout, `create_order_line_item` stamps donation lines with meta
 *      (`_is_donation`, `_donation_amount`) read from the cart item's item_data,
 *      and corrects the stored unit price to the customer-set amount.
 *   2. When the order is paid, each donation line is written to the donations
 *      ledger and its campaign's running total is incremented — once per line
 *      (guarded by order_item_id) so re-firing the paid hook is idempotent.
 *   3. From then on the ledger row's status tracks the order: an order still
 *      being fulfilled reads `processing`, a finished one `completed`, and one
 *      that is refunded, cancelled or failed drops out of the campaign total.
 *      Previously a row was stamped `completed` at payment and never moved
 *      again, so the ledger claimed money an abandoned order never delivered.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation\Hooks;

use StoreEngine\Addons\Donation\Classes\Campaign;
use StoreEngine\Addons\Donation\Database;
use StoreEngine\Addons\Donation\Helper;
use StoreEngine\Classes\Order as OrderObject;
use StoreEngine\Traits\Singleton;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Order {

	use Singleton;

	public function __construct() {
		add_action( 'storeengine/checkout/create_order_line_item', [ $this, 'stamp_line_item' ], 10, 2 );
		add_action( 'storeengine/order/payment_status_changed', [ $this, 'on_payment_status' ], 20, 3 );

		// Fulfilment moves independently of payment — an order can be paid and
		// then cancelled, or sit in processing for days. Without this the ledger
		// only ever heard about payment.
		add_action( 'storeengine/order/status_changed', [ $this, 'on_order_status' ], 20, 4 );
	}

	/**
	 * The ledger status an order's donation lines should currently have.
	 *
	 * Payment answers "do we hold the money", fulfilment answers "is it done" —
	 * a donation needs both, so the two are folded into one status here.
	 *
	 * @param OrderObject $order
	 *
	 * @return string
	 */
	public static function status_for_order( OrderObject $order ): string {
		$paid  = (string) $order->get_paid_status();
		$state = (string) $order->get_status();

		if ( 'refunded' === $paid || 'refunded' === $state ) {
			return 'refunded';
		}

		// Both spellings are in use across the codebase's status constants.
		if ( in_array( $state, [ 'cancelled', 'canceled', 'trash' ], true ) ) {
			return 'cancelled';
		}

		if ( 'failed' === $paid || 'failed' === $state ) {
			return 'failed';
		}

		if ( 'on_hold' === $paid || 'on_hold' === $state ) {
			return 'on_hold';
		}

		if ( 'paid' === $paid ) {
			return 'completed' === $state ? 'completed' : 'processing';
		}

		// A part-paid order holds less than the ledger row's amount, so counting
		// it would overstate the campaign. It joins the total when the balance
		// clears.
		return 'pending';
	}

	/**
	 * @param string $status
	 *
	 * @return bool
	 */
	protected static function counts_toward_total( string $status ): bool {
		return in_array( $status, Helper::COUNTED_STATUSES, true );
	}

	/**
	 * Stamp a donation line with its customer-set amount at order creation.
	 *
	 * @param object $item   OrderItemProduct
	 * @param object $values CartItem (carries item_data)
	 */
	public function stamp_line_item( $item, $values ): void {
		$item_data = ( is_object( $values ) && isset( $values->item_data ) && is_array( $values->item_data ) ) ? $values->item_data : [];

		if ( ! isset( $item_data[ Helper::AMOUNT_KEY ] ) ) {
			return;
		}

		$product_id = (int) $item->get_product_id();
		$price_id   = (int) $item->get_price_id();
		$config     = Helper::get_price_config( $price_id, $product_id );

		if ( ! Helper::is_customer_priced( $config ) ) {
			return;
		}

		$amount = Helper::clamp_amount( (float) $item_data[ Helper::AMOUNT_KEY ], $config );

		// Correct the unit price to the customer amount (line totals already
		// reflect it via the cart, but the stored unit price defaulted to the
		// base price row).
		if ( method_exists( $item, 'set_price' ) ) {
			$item->set_price( $amount );
		}

		$item->add_meta_data( '_donation_amount', $amount, true );

		if ( Helper::is_donation( $config ) ) {
			$item->add_meta_data( '_is_donation', 1, true );
		}
	}

	/**
	 * Record / reverse ledger entries as the order's paid status changes.
	 *
	 * @param OrderObject|mixed $order      Order object (guarded below).
	 * @param string            $status     New paid status.
	 * @param string            $old_status Previous paid status.
	 */
	public function on_payment_status( $order, string $status, string $old_status ): void {
		if ( ! $this->is_recordable_order( $order ) ) {
			return;
		}

		if ( 'paid' === $status ) {
			$this->record_donations( $order );
		}

		$this->sync_donations( $order );
	}

	/**
	 * Re-sync the ledger when the order's fulfilment status moves.
	 *
	 * @param int         $order_id
	 * @param string      $old_status
	 * @param string      $new_status
	 * @param mixed       $order      Order object (guarded below).
	 */
	public function on_order_status( $order_id, $old_status, $new_status, $order = null ): void {
		if ( ! $this->is_recordable_order( $order ) ) {
			return;
		}

		$this->sync_donations( $order );
	}

	/**
	 * Whether `$order` represents a real, billable transaction the ledger
	 * should track.
	 *
	 * A subscription's own record (`Subscription extends Order`, saved as an
	 * `orders` row with `type = 'subscription'`) fires the same
	 * payment/status-changed actions as any other order — e.g. once at
	 * creation, when it's activated after the first payment — but it isn't a
	 * transaction itself; each actual payment (initial or renewal) is its own
	 * separate `type = 'order'` row. Recording against the subscription row
	 * too double-counted every recurring donation's first payment.
	 *
	 * @param mixed $order
	 *
	 * @return bool
	 */
	protected function is_recordable_order( $order ): bool {
		return $order instanceof OrderObject && 'subscription' !== $order->get_type();
	}

	/**
	 * Bring an order's ledger rows in line with the order, adjusting the
	 * campaign totals for every row that crosses the counted/uncounted line.
	 *
	 * Safe to call repeatedly: a row already at the target status is skipped, so
	 * a total is never adjusted twice for the same transition.
	 *
	 * @param OrderObject $order
	 */
	protected function sync_donations( OrderObject $order ): void {
		global $wpdb;
		$table    = Database::donations_table();
		$order_id = (int) $order->get_id();

		// Offline and seeded donations carry order_id 0, so an unsaved or
		// half-built order (id 0) would match every one of them and rewrite the
		// whole ledger. Only a real order may move rows.
		if ( $order_id <= 0 ) {
			return;
		}

		$target = self::status_for_order( $order );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT id, campaign_id, amount, status, customer_id, donor_email FROM {$table} WHERE order_id = %d AND order_id > 0", $order_id ) );

		foreach ( $rows as $row ) {
			$current = (string) $row->status;
			if ( $current === $target ) {
				continue;
			}

			// phpcs:disable WordPress.DB.DirectDatabaseQuery
			$wpdb->update(
				$table,
				[
					'status'       => $target,
					'date_updated' => current_time( 'mysql', true ),
				],
				[ 'id' => (int) $row->id ]
			);
			// phpcs:enable

			$campaign_id = (int) $row->campaign_id;
			if ( ! $campaign_id ) {
				continue;
			}

			$was = self::counts_toward_total( $current );
			$now = self::counts_toward_total( $target );

			if ( $was && ! $now ) {
				Campaign::reverse_contribution(
					$campaign_id,
					(float) $row->amount,
					$this->was_last_contribution( $campaign_id, (int) $row->customer_id, (string) $row->donor_email, (int) $row->id )
				);
			} elseif ( ! $was && $now ) {
				Campaign::add_contribution(
					$campaign_id,
					(float) $row->amount,
					$this->is_new_contributor( $campaign_id, (int) $row->customer_id, (string) $row->donor_email, (int) $row->id )
				);
			}

			/**
			 * Fires when a donation's ledger status follows its order.
			 *
			 * @param int         $donation_id
			 * @param string      $target  New ledger status.
			 * @param string      $current Previous ledger status.
			 * @param OrderObject $order
			 */
			do_action( 'storeengine/donation/status_changed', (int) $row->id, $target, $current, $order );
		}
	}

	/**
	 * Insert ledger rows for each donation line and bump campaign totals.
	 *
	 * @param OrderObject $order
	 */
	protected function record_donations( OrderObject $order ): void {
		global $wpdb;
		$table = Database::donations_table();

		foreach ( $order->get_items( 'line_item' ) as $item ) {
			if ( ! $item->get_meta( '_is_donation' ) ) {
				continue;
			}

			$order_item_id = (int) $item->get_id();
			if ( $order_item_id <= 0 ) {
				continue;
			}

			// Idempotent: skip a line already recorded. The `> 0` guard matters —
			// offline and seeded rows share order_item_id 0, so a line with no id
			// would match one of them and be silently dropped.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
			$exists = (int) $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE order_item_id = %d AND order_item_id > 0 LIMIT 1", $order_item_id ) );
			if ( $exists ) {
				continue;
			}

			$product_id  = (int) $item->get_product_id();
			$amount      = (float) ( $item->get_meta( '_donation_amount' ) ?: $item->get_total() );
			$campaign_id = Campaign::get_or_create_for_product( $product_id );
			$customer_id = (int) $order->get_customer_id();

			// Snapshot the campaign/product name onto the ledger row so the
			// donations list needs no per-row title lookup and stays accurate even
			// if the campaign is later renamed or deleted.
			$campaign_title = $campaign_id ? Campaign::get_title( $campaign_id ) : '';
			if ( '' === $campaign_title ) {
				$campaign_title = (string) get_the_title( $product_id );
			}

			$now = current_time( 'mysql', true );

			$row = [
				'uid'            => wp_generate_uuid4(),
				'campaign_id'    => $campaign_id ?: null,
				'campaign_title' => $campaign_title,
				'order_id'       => (int) $order->get_id(),
				'order_item_id'  => $order_item_id,
				'product_id'     => $product_id,
				'price_id'       => (int) $item->get_price_id(),
				'customer_id'    => $customer_id,
				'donor_name'     => trim( (string) $order->get_billing_first_name() . ' ' . (string) $order->get_billing_last_name() ),
				'donor_email'    => (string) $order->get_billing_email(),
				'amount'         => $amount,
				'currency'       => $order->get_currency(),
				'status'         => self::status_for_order( $order ),
				'date_created'   => $now,
				'date_updated'   => $now,
			];

			/**
			 * Enrich a ledger row before insert. The Pro Fundraising addon uses
			 * this to attach recurring/subscription, fund, tribute and company
			 * fields captured elsewhere in the request or on the order.
			 *
			 * @param array       $row   Column => value map for the donations table.
			 * @param OrderObject $order
			 * @param object      $item  OrderItemProduct
			 */
			$row = (array) apply_filters( 'storeengine/donation/ledger_row', $row, $order, $item );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->insert( $table, $row );
			$donation_id = (int) $wpdb->insert_id;

			// The row just inserted is excluded from the lookup — it carries the
			// same status we're testing for, so counting it made every donor
			// look like a repeat one and `contributor_count` never left zero.
			if ( $campaign_id && self::counts_toward_total( (string) $row['status'] ) ) {
				Campaign::add_contribution(
					$campaign_id,
					$amount,
					$this->is_new_contributor( $campaign_id, $customer_id, (string) $order->get_billing_email(), $donation_id )
				);
			}

			/**
			 * Fires after a donation ledger row is written and its campaign total
			 * bumped. The Pro Fundraising addon uses this to log activity, detect
			 * goal-reached, and send tribute/tax receipts.
			 *
			 * @param int         $donation_id
			 * @param int         $campaign_id
			 * @param OrderObject $order
			 * @param object      $item
			 */
			do_action( 'storeengine/donation/recorded', $donation_id, $campaign_id, $order, $item );
		}
	}

	/**
	 * Whether this donor has no other contribution counted toward the campaign.
	 *
	 * @param int    $campaign_id
	 * @param int    $customer_id
	 * @param string $email
	 * @param int    $ignore_id Ledger row to leave out of the count.
	 *
	 * @return bool
	 */
	protected function is_new_contributor( int $campaign_id, int $customer_id, string $email, int $ignore_id = 0 ): bool {
		return 0 === $this->counted_rows_for_donor( $campaign_id, $customer_id, $email, $ignore_id );
	}

	/**
	 * Whether the row being reversed was this donor's only counted contribution
	 * — i.e. the campaign's distinct-donor count should drop with it.
	 *
	 * @param int    $campaign_id
	 * @param int    $customer_id
	 * @param string $email
	 * @param int    $row_id The row being reversed (already at its new status).
	 *
	 * @return bool
	 */
	protected function was_last_contribution( int $campaign_id, int $customer_id, string $email, int $row_id ): bool {
		if ( $customer_id <= 0 && '' === $email ) {
			// An unidentifiable donor was never counted as distinct on the way
			// in, so there's nothing to take back off.
			return false;
		}

		return 0 === $this->counted_rows_for_donor( $campaign_id, $customer_id, $email, $row_id );
	}

	/**
	 * Count a donor's contributions to a campaign that currently count toward
	 * its total.
	 *
	 * @param int    $campaign_id
	 * @param int    $customer_id
	 * @param string $email
	 * @param int    $ignore_id Ledger row to exclude (0 for none).
	 *
	 * @return int
	 */
	protected function counted_rows_for_donor( int $campaign_id, int $customer_id, string $email, int $ignore_id = 0 ): int {
		global $wpdb;
		$table = Database::donations_table();

		$placeholders = implode( ',', array_fill( 0, count( Helper::COUNTED_STATUSES ), '%s' ) );

		if ( $customer_id > 0 ) {
			$sql    = "SELECT COUNT(*) FROM {$table} WHERE campaign_id = %d AND customer_id = %d AND id <> %d AND status IN ({$placeholders})";
			$params = array_merge( [ $campaign_id, $customer_id, $ignore_id ], Helper::COUNTED_STATUSES );
		} elseif ( $email ) {
			$sql    = "SELECT COUNT(*) FROM {$table} WHERE campaign_id = %d AND donor_email = %s AND id <> %d AND status IN ({$placeholders})";
			$params = array_merge( [ $campaign_id, $email, $ignore_id ], Helper::COUNTED_STATUSES );
		} else {
			// No customer id and no email — we can't dedupe this donor, so treat
			// them as already counted (better to under- than over-count).
			return 1;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL
		return (int) $wpdb->get_var( $wpdb->prepare( $sql, $params ) );
	}
}

// End of file order.php
