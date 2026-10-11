<?php
/**
 * Stripe adapter for "Change payment method" on a subscription.
 *
 * Renewals charge the `_stripe_customer_id` / `_stripe_source_id` meta, so switching a subscription to
 * another saved card must rewrite both — using the customer the card is attached to — and, for native
 * Stripe subscriptions, switch the default payment method in Stripe before anything is stored locally.
 * The Stripe API is replaced by a recording stub; no keys or network are involved.
 */

namespace StoreEngine\Tests\Unit\Stripe;

use PHPUnit\Framework\TestCase;
use StoreEngine\Addons\Stripe\SubscriptionPaymentMethod;

require_once __DIR__ . '/../../stubs/wp-error.php';

class SubscriptionPaymentMethodTest extends TestCase {

	public function test_build_meta(): void {
		$this->assertSame(
			[ '_stripe_customer_id' => 'cus_1', '_stripe_source_id' => 'pm_1' ],
			SubscriptionPaymentMethod::build_meta( 'pm_1', 'cus_1' )
		);
	}

	public function test_applies_card_and_its_customer_to_subscription(): void {
		$service      = new FakeStripeService( (object) [ 'id' => 'pm_new', 'customer' => 'cus_card' ] );
		$subscription = new FakeOrder( 10, [ '_stripe_customer_id' => 'cus_old', '_stripe_source_id' => 'pm_old' ] );

		$result = ( new SubscriptionPaymentMethod( $service ) )->apply( null, $subscription, new FakeToken( 'pm_new' ), $subscription );

		$this->assertTrue( $result );
		$this->assertSame( 'pm_new', $subscription->meta['_stripe_source_id'] );
		$this->assertSame( 'cus_card', $subscription->meta['_stripe_customer_id'], 'Charges must use the customer the card is attached to.' );
		$this->assertSame( [], $service->subscription_updates, 'Non-native subscriptions are not touched in Stripe.' );
	}

	public function test_applies_to_unpaid_renewal_order_without_touching_stripe_subscription(): void {
		$service      = new FakeStripeService( (object) [ 'id' => 'pm_new', 'customer' => 'cus_card' ] );
		$subscription = new FakeOrder( 10, [ '_stripe_subscription_id' => 'sub_123' ] );
		$renewal      = new FakeOrder( 20, [ '_stripe_source_id' => 'pm_old' ] );

		$result = ( new SubscriptionPaymentMethod( $service ) )->apply( true, $renewal, new FakeToken( 'pm_new' ), $subscription );

		$this->assertTrue( $result );
		$this->assertSame( 'pm_new', $renewal->meta['_stripe_source_id'], 'The retried renewal order must charge the new card.' );
		$this->assertSame( [], $service->subscription_updates );
	}

	public function test_native_subscription_updates_default_payment_method_in_stripe(): void {
		$service      = new FakeStripeService( (object) [ 'id' => 'pm_new', 'customer' => 'cus_card' ] );
		$subscription = new FakeOrder( 10, [ '_stripe_subscription_id' => 'sub_123' ] );

		$result = ( new SubscriptionPaymentMethod( $service ) )->apply( null, $subscription, new FakeToken( 'pm_new' ), $subscription );

		$this->assertTrue( $result );
		$this->assertSame( [ [ 'sub_123', [ 'default_payment_method' => 'pm_new' ] ] ], $service->subscription_updates );
		$this->assertSame( 'pm_new', $subscription->meta['_stripe_source_id'] );
	}

	public function test_stripe_refusal_stores_nothing(): void {
		$service                = new FakeStripeService( (object) [ 'id' => 'pm_new', 'customer' => 'cus_card' ] );
		$service->fail_update   = true;
		$subscription           = new FakeOrder( 10, [ '_stripe_subscription_id' => 'sub_123', '_stripe_source_id' => 'pm_old' ] );

		$result = ( new SubscriptionPaymentMethod( $service ) )->apply( null, $subscription, new FakeToken( 'pm_new' ), $subscription );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'pm_old', $subscription->meta['_stripe_source_id'] );
	}

	public function test_falls_back_to_stored_customer_when_card_has_none(): void {
		$service      = new FakeStripeService( (object) [ 'id' => 'pm_new', 'customer' => null ] );
		$subscription = new FakeOrder( 10, [ '_stripe_customer_id' => 'cus_stored' ] );

		$result = ( new SubscriptionPaymentMethod( $service ) )->apply( null, $subscription, new FakeToken( 'pm_new' ), $subscription );

		$this->assertTrue( $result );
		$this->assertSame( 'cus_stored', $subscription->meta['_stripe_customer_id'] );
	}

	public function test_error_when_no_customer_is_known(): void {
		$service      = new FakeStripeService( (object) [ 'id' => 'pm_new', 'customer' => '' ] );
		$subscription = new FakeOrder( 10, [] );

		$result = ( new SubscriptionPaymentMethod( $service ) )->apply( null, $subscription, new FakeToken( 'pm_new' ), $subscription );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertArrayNotHasKey( '_stripe_source_id', $subscription->meta );
	}

	public function test_lookup_failure_is_an_error(): void {
		$service              = new FakeStripeService( null );
		$service->fail_lookup = true;
		$subscription         = new FakeOrder( 10, [] );

		$result = ( new SubscriptionPaymentMethod( $service ) )->apply( null, $subscription, new FakeToken( 'pm_new' ), $subscription );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_empty_token_is_an_error(): void {
		$subscription = new FakeOrder( 10, [] );

		$result = ( new SubscriptionPaymentMethod( new FakeStripeService( null ) ) )->apply( null, $subscription, new FakeToken( '' ), $subscription );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_previous_error_is_passed_through(): void {
		$error        = new \WP_Error( 'earlier', 'Earlier handler failed' );
		$subscription = new FakeOrder( 10, [] );

		$this->assertSame( $error, ( new SubscriptionPaymentMethod( new FakeStripeService( null ) ) )->apply( $error, $subscription, new FakeToken( 'pm_new' ), $subscription ) );
	}

	public function test_card_lookup_is_cached_per_request(): void {
		$service      = new FakeStripeService( (object) [ 'id' => 'pm_new', 'customer' => 'cus_card' ] );
		$subscription = new FakeOrder( 10, [] );
		$renewal      = new FakeOrder( 20, [] );
		$adapter      = new SubscriptionPaymentMethod( $service );
		$token        = new FakeToken( 'pm_new' );

		$adapter->apply( null, $subscription, $token, $subscription );
		$adapter->apply( null, $renewal, $token, $subscription );

		$this->assertSame( 1, $service->lookups );
	}
}

class FakeStripeService {
	public $payment_method;
	public int $lookups              = 0;
	public bool $fail_lookup         = false;
	public bool $fail_update         = false;
	public array $subscription_updates = [];

	public function __construct( $payment_method ) {
		$this->payment_method = $payment_method;
	}

	public function get_payment_method( string $id, bool $wp_error = true ) {
		++$this->lookups;
		if ( $this->fail_lookup ) {
			throw new \RuntimeException( 'No such payment method' );
		}

		return $this->payment_method;
	}

	public function update_subscription( string $id, array $params ) {
		if ( $this->fail_update ) {
			throw new \RuntimeException( 'Card declined' );
		}
		$this->subscription_updates[] = [ $id, $params ];

		return (object) [ 'id' => $id ];
	}
}

class FakeOrder {
	public int $id;
	public array $meta;

	public function __construct( int $id, array $meta ) {
		$this->id   = $id;
		$this->meta = $meta;
	}

	public function get_id(): int {
		return $this->id;
	}

	public function get_meta( string $key, bool $single = true, string $context = 'view' ) {
		return $this->meta[ $key ] ?? '';
	}

	public function update_meta_data( string $key, $value ): void {
		$this->meta[ $key ] = $value;
	}
}

class FakeToken {
	private string $token;

	public function __construct( string $token ) {
		$this->token = $token;
	}

	public function get_token( string $context = 'view' ): string {
		return $this->token;
	}
}
