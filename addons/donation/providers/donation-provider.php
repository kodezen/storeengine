<?php
/**
 * Dummy-data seeder provider for donations.
 *
 * Creates a few donation products (each auto-mapped to a campaign) and a spread
 * of completed donations against them, so goals show real progress. Registered
 * with the seeder addon via `storeengine/seeder/providers`; cleanup rides
 * `storeengine/seeder/delete_object`.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation\Providers;

use StoreEngine\Addons\Donation\Classes\Campaign;
use StoreEngine\Addons\Donation\Database;
use StoreEngine\Addons\Donation\Helper;
use StoreEngine\Addons\Seeder\Classes\AbstractSeederProvider;
use StoreEngine\Addons\Seeder\Classes\SeederContext;
use StoreEngine\Addons\Seeder\Classes\SeederData;
use StoreEngine\Classes\Price;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DonationProvider extends AbstractSeederProvider {

	public function get_key(): string {
		return 'donation';
	}

	public function get_label(): string {
		return __( 'Donations', 'storeengine' );
	}

	public function get_default_count(): int {
		return 3;
	}

	/**
	 * @param SeederContext $context
	 * @param int           $count Number of donation products to create.
	 */
	public function seed( SeederContext $context, int $count ): void {
		$customer_ids = $context->ids( 'customers', 'customer' );

		for ( $i = 0; $i < $count; $i++ ) {
			$product_id = $this->create_donation_product( $context );
			if ( ! $product_id ) {
				continue;
			}

			$campaign_id    = Campaign::get_or_create_for_product( $product_id );
			$campaign_title = get_the_title( $product_id );

			// 5–20 donations per product.
			$donations = wp_rand( 5, 20 );
			for ( $d = 0; $d < $donations; $d++ ) {
				$this->create_donation( $context, $campaign_id, $campaign_title, $product_id, $customer_ids );
			}
		}
	}

	protected function create_donation_product( SeederContext $context ): int {
		$title = sprintf(
			/* translators: %s: seeded cause name. */
			__( 'Donation: %s', 'storeengine' ),
			SeederData::product_name()
		);

		$post_id = wp_insert_post( [
			'post_type'    => 'storeengine_product',
			'post_title'   => $title,
			'post_status'  => 'publish',
			'post_content' => __( 'Support this cause with a donation of any amount.', 'storeengine' ),
		] );

		if ( ! $post_id || is_wp_error( $post_id ) ) {
			return 0;
		}

		update_post_meta( $post_id, '_storeengine_product_type', 'simple' );

		$price = new Price();
		$price->set_props( [
			'price_name' => __( 'Donation', 'storeengine' ),
			'price_type' => 'onetime',
			'price'      => 25,
			'product_id' => $post_id,
			'order'      => 0,
		] );
		$price->save();
		$price_id = (int) $price->get_id();

		if ( $price_id ) {
			update_post_meta( $post_id, Helper::META_KEY, [
				$price_id => [
					'mode'         => 'donation',
					'min'          => 5,
					'max'          => null,
					'suggested'    => 25,
					'step'         => 5,
					'allow_custom' => true,
				],
			] );

			// Give the campaign a goal so the progress bar is meaningful.
			update_post_meta( $post_id, Campaign::GOAL_META, wp_rand( 10, 100 ) * 100 );
		}

		// Recorded as a product so the seeder cleans it up natively.
		$context->record( 'product', $post_id );

		return $post_id;
	}

	protected function create_donation( SeederContext $context, int $campaign_id, string $campaign_title, int $product_id, array $customer_ids ): void {
		global $wpdb;

		$customer_id = $customer_ids ? (int) SeederData::pick( $customer_ids ) : 0;
		$first       = SeederData::first_name();
		$last        = SeederData::last_name();
		$amount      = (float) wp_rand( 5, 250 );
		$created     = gmdate( 'Y-m-d H:i:s', SeederData::past_timestamp() );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->insert( Database::donations_table(), [
			'uid'            => wp_generate_uuid4(),
			'campaign_id'    => $campaign_id ?: null,
			'campaign_title' => $campaign_title,
			'order_id'       => 0,
			'order_item_id'  => 0,
			'product_id'     => $product_id,
			'price_id'       => 0,
			'customer_id'    => $customer_id,
			'donor_name'     => $first . ' ' . $last,
			'donor_email'    => SeederData::email( $first, $last ),
			'amount'         => $amount,
			'currency'       => 'USD',
			'is_recurring'   => wp_rand( 0, 4 ) === 0 ? 1 : 0,
			'is_anonymous'   => wp_rand( 0, 6 ) === 0 ? 1 : 0,
			'status'         => 'completed',
			'date_created'   => $created,
			'date_updated'   => $created,
		] );

		$id = (int) $wpdb->insert_id;
		if ( ! $id ) {
			return;
		}

		if ( $campaign_id ) {
			Campaign::add_contribution( $campaign_id, $amount, true );
		}

		$context->record( 'donation', $id );
	}
}

// End of file donation-provider.php
