<?php
/**
 * Applies a customer's saved card (payment token) to a subscription billed through Stripe.
 *
 * Renewals are charged off-session with the `_stripe_customer_id` / `_stripe_source_id` meta
 * (GatewayStripe::process_subscription_payment() reads it from the renewal order, which copies it
 * from the subscription). With native Stripe subscriptions, the subscription's default payment
 * method in Stripe is updated too.
 *
 * Hooked to `storeengine/subscription/apply_payment_method/stripe` (see
 * StoreEngine\Addons\Subscription\Classes\PaymentMethodChange).
 *
 * @package StoreEngine\Addons\Stripe
 */

namespace StoreEngine\Addons\Stripe;

use Throwable;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SubscriptionPaymentMethod {

	/**
	 * Stripe API wrapper. Needs get_payment_method( string, bool ) and update_subscription( string, array ).
	 *
	 * @var StripeService|object|null
	 */
	protected $service;

	/**
	 * Customer id per payment method id, so the API is asked once per request.
	 *
	 * @var array<string,string>
	 */
	protected array $customer_ids = [];

	/**
	 * @param StripeService|object|null $service Stripe API wrapper; defaults to StripeService::init().
	 */
	public function __construct( $service = null ) {
		$this->service = $service;
	}

	public static function init(): void {
		add_filter( 'storeengine/subscription/apply_payment_method/stripe', [ new self(), 'apply' ], 10, 4 );
	}

	/**
	 * @return StripeService|object
	 */
	protected function service() {
		if ( null === $this->service ) {
			$this->service = StripeService::init();
		}

		return $this->service;
	}

	/**
	 * Meta the renewal charge reads.
	 *
	 * @param string $payment_method_id Stripe payment method id.
	 * @param string $customer_id       Stripe customer id.
	 *
	 * @return array<string,string>
	 */
	public static function build_meta( string $payment_method_id, string $customer_id ): array {
		return [
			'_stripe_customer_id' => $customer_id,
			'_stripe_source_id'   => $payment_method_id,
		];
	}

	/**
	 * Apply the token to the subscription, or to one of its unpaid renewal orders.
	 *
	 * @param true|WP_Error|null $result       Result so far.
	 * @param object             $order        Subscription or renewal order (AbstractOrder).
	 * @param object             $token        Saved payment method (PaymentToken).
	 * @param object             $subscription The subscription (Subscription).
	 *
	 * @return true|WP_Error
	 */
	public function apply( $result, $order, $token, $subscription ) {
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$payment_method_id = (string) $token->get_token( 'edit' );
		if ( '' === $payment_method_id ) {
			return new WP_Error( 'storeengine_stripe_invalid_payment_method', __( 'This saved payment method can not be used.', 'storeengine' ), [ 'status' => 422 ] );
		}

		$customer_id = $this->resolve_customer_id( $payment_method_id, $subscription );
		if ( is_wp_error( $customer_id ) ) {
			return $customer_id;
		}

		$is_subscription = (int) $order->get_id() === (int) $subscription->get_id();

		// Native Stripe subscriptions are billed by Stripe: switch the default payment method there first,
		// so nothing is stored locally if Stripe refuses it.
		$stripe_subscription_id = $is_subscription ? (string) $subscription->get_meta( '_stripe_subscription_id', true, 'edit' ) : '';
		if ( '' !== $stripe_subscription_id ) {
			try {
				$this->service()->update_subscription( $stripe_subscription_id, [ 'default_payment_method' => $payment_method_id ] );
			} catch ( Throwable $e ) {
				return new WP_Error( 'storeengine_stripe_subscription_update_failed', $e->getMessage(), [ 'status' => 502 ] );
			}
		}

		foreach ( self::build_meta( $payment_method_id, $customer_id ) as $key => $value ) {
			$order->update_meta_data( $key, $value );
		}

		return true;
	}

	/**
	 * The Stripe customer the payment method belongs to; charges must use that customer.
	 *
	 * @param string $payment_method_id Stripe payment method id.
	 * @param object $subscription      Subscription, for its stored customer id as a fallback.
	 *
	 * @return string|WP_Error
	 */
	protected function resolve_customer_id( string $payment_method_id, $subscription ) {
		if ( isset( $this->customer_ids[ $payment_method_id ] ) ) {
			return $this->customer_ids[ $payment_method_id ];
		}

		try {
			$payment_method = $this->service()->get_payment_method( $payment_method_id, false );
		} catch ( Throwable $e ) {
			return new WP_Error( 'storeengine_stripe_payment_method_lookup_failed', $e->getMessage(), [ 'status' => 502 ] );
		}

		if ( is_wp_error( $payment_method ) ) {
			return $payment_method;
		}

		$customer_id = is_object( $payment_method ) && ! empty( $payment_method->customer ) ? $payment_method->customer : '';
		if ( is_object( $customer_id ) ) {
			// Expanded customer object.
			$customer_id = $customer_id->id ?? '';
		}

		$customer_id = (string) ( $customer_id ? $customer_id : $subscription->get_meta( '_stripe_customer_id', true, 'edit' ) );

		if ( '' === $customer_id ) {
			return new WP_Error(
				'storeengine_stripe_payment_method_without_customer',
				__( 'This saved card is not linked to your customer account and can not be used for renewals. Please add it again.', 'storeengine' ),
				[ 'status' => 422 ]
			);
		}

		$this->customer_ids[ $payment_method_id ] = $customer_id;

		return $customer_id;
	}
}

// End of file subscription-payment-method.php.
