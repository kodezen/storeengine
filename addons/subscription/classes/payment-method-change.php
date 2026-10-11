<?php
/**
 * Lets a customer change the saved payment method a subscription renews with.
 *
 * The customer picks one of their saved payment methods (tokens) for the gateway the
 * subscription is billed through. The gateway applies the change through the
 * `storeengine/subscription/apply_payment_method/{gateway_id}` filter, e.g. by updating the
 * gateway meta its renewal charge reads. The action is only offered for gateways that
 * support `subscription_payment_method_change_customer` and `tokenization`, and that have
 * registered a handler for that filter.
 *
 * @package StoreEngine\Addons\Subscription
 */

namespace StoreEngine\Addons\Subscription\Classes;

use StoreEngine\Classes\AbstractOrder;
use StoreEngine\Classes\Order;
use StoreEngine\Classes\PaymentTokens\PaymentToken;
use StoreEngine\Classes\PaymentTokens\PaymentTokens;
use StoreEngine\Payment\Gateways\PaymentGateway;
use StoreEngine\Utils\Caching;
use StoreEngine\Utils\Helper;
use Throwable;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PaymentMethodChange {

	/**
	 * Query arg that shows the change form on the dashboard plan page.
	 */
	const QUERY_ARG = 'change-payment-method';

	/**
	 * Form action name (POST).
	 */
	const FORM_ACTION = 'storeengine_change_subscription_payment_method';

	/**
	 * POST field carrying FORM_ACTION.
	 */
	const FORM_FIELD = 'storeengine_subscription_action';

	/**
	 * Subscription meta set when auto-renewal was switched off because the saved payment method was removed.
	 */
	const META_AUTO_RENEWAL_DISABLED = '_auto_renewal_disabled_token_removed';

	/**
	 * Statuses in which the customer may change the payment method.
	 */
	const ALLOWED_STATUSES = [ 'active', 'on_hold', 'pending_cancel' ];

	public static function init(): void {
		add_action( 'wp_loaded', [ __CLASS__, 'handle_form_request' ], 100 );
	}

	/**
	 * Nonce action for a subscription.
	 *
	 * @param int $subscription_id Subscription id.
	 *
	 * @return string
	 */
	public static function nonce_action( int $subscription_id ): string {
		return 'storeengine-change-payment-method-' . $subscription_id;
	}

	/**
	 * Whether a gateway lets customers switch a subscription to another saved payment method.
	 *
	 * @param PaymentGateway|null $gateway Gateway.
	 *
	 * @return bool
	 */
	public static function gateway_supports_change( ?PaymentGateway $gateway ): bool {
		if ( ! $gateway || ! $gateway->id ) {
			return false;
		}

		$supported = self::is_supported(
			$gateway->supports( 'subscription_payment_method_change_customer' ),
			$gateway->supports( 'tokenization' ),
			(bool) has_filter( 'storeengine/subscription/apply_payment_method/' . $gateway->id )
		);

		/**
		 * Filters whether customers can change a subscription's payment method for a gateway.
		 *
		 * @param bool           $supported Whether the gateway supports it.
		 * @param PaymentGateway $gateway   The gateway.
		 */
		return (bool) apply_filters( 'storeengine/subscription/gateway_supports_payment_method_change', $supported, $gateway );
	}

	/**
	 * The support rule, kept free of WordPress calls so it can be unit tested.
	 *
	 * @param bool $supports_customer_change Gateway supports `subscription_payment_method_change_customer`.
	 * @param bool $supports_tokenization    Gateway supports `tokenization` (saved payment methods).
	 * @param bool $has_handler              A handler is registered for the gateway's apply filter.
	 *
	 * @return bool
	 */
	public static function is_supported( bool $supports_customer_change, bool $supports_tokenization, bool $has_handler ): bool {
		return $supports_customer_change && $supports_tokenization && $has_handler;
	}

	/**
	 * Whether the status allows changing the payment method.
	 *
	 * @param string $status Subscription status.
	 *
	 * @return bool
	 */
	public static function is_allowed_status( string $status ): bool {
		return in_array( $status, self::ALLOWED_STATUSES, true );
	}

	/**
	 * Whether a user can change the payment method of a subscription.
	 *
	 * @param Subscription $subscription Subscription.
	 * @param int          $user_id      User id, defaults to the current user.
	 *
	 * @return bool
	 */
	public static function can_change( Subscription $subscription, int $user_id = 0 ): bool {
		$user_id = $user_id ? $user_id : get_current_user_id();

		$can_change = $user_id > 0 &&
			(int) $subscription->get_customer_id() === $user_id &&
			self::is_allowed_status( $subscription->get_status() ) &&
			$subscription->get_payment_method() &&
			self::gateway_supports_change( Helper::get_payment_gateway( $subscription->get_payment_method() ) );

		/**
		 * Filters whether a user can change the payment method of a subscription.
		 *
		 * @param bool         $can_change   Whether the change is allowed.
		 * @param Subscription $subscription The subscription.
		 * @param int          $user_id      The user id.
		 */
		return (bool) apply_filters( 'storeengine/subscription/can_change_payment_method', $can_change, $subscription, $user_id );
	}

	/**
	 * Saved payment methods the subscription can switch to.
	 *
	 * @param Subscription $subscription Subscription.
	 *
	 * @return PaymentToken[]
	 */
	public static function get_available_tokens( Subscription $subscription ): array {
		$customer_id = (int) $subscription->get_customer_id();
		$gateway_id  = (string) $subscription->get_payment_method();

		if ( ! $customer_id || ! $gateway_id ) {
			return [];
		}

		return array_values( array_filter(
			PaymentTokens::get_customer_tokens( $customer_id, $gateway_id, -1 ),
			static fn( $token ) => $token instanceof PaymentToken && $token->get_gateway_id() === $gateway_id
		) );
	}

	/**
	 * The saved payment method the subscription renews with, if it's known.
	 *
	 * @param Subscription $subscription Subscription.
	 *
	 * @return int Token id, 0 when unknown.
	 */
	public static function get_current_token_id( Subscription $subscription ): int {
		$token_ids = array_map( 'absint', $subscription->get_payment_tokens( 'edit' ) );
		$tokens    = self::get_available_tokens( $subscription );

		// Gateways keep the token string in `_{gateway}_source_id` (e.g. the card renewal charges use).
		$source_id = (string) $subscription->get_meta( '_' . $subscription->get_payment_method() . '_source_id', true, 'edit' );

		return self::resolve_current_token_id(
			$token_ids,
			array_map(
				static fn( PaymentToken $token ) => [
					'id'    => $token->get_id(),
					'token' => (string) $token->get_token( 'edit' ),
				],
				$tokens
			),
			$source_id
		);
	}

	/**
	 * Match the subscription's current payment method against the saved tokens.
	 *
	 * The gateway source id wins because it's what renewals charge; the stored token id list is the fallback.
	 *
	 * @param int[]                              $subscription_token_ids Token ids stored on the subscription.
	 * @param array<array{id:int,token:string}> $tokens                 Saved tokens for the gateway.
	 * @param string                             $source_id              Gateway source id on the subscription.
	 *
	 * @return int
	 */
	public static function resolve_current_token_id( array $subscription_token_ids, array $tokens, string $source_id ): int {
		if ( '' !== $source_id ) {
			foreach ( $tokens as $token ) {
				if ( (string) $token['token'] === $source_id ) {
					return (int) $token['id'];
				}
			}
		}

		$available = array_map( static fn( $token ) => (int) $token['id'], $tokens );

		foreach ( array_reverse( $subscription_token_ids ) as $token_id ) {
			if ( in_array( (int) $token_id, $available, true ) ) {
				return (int) $token_id;
			}
		}

		return 0;
	}

	/**
	 * URL of the change form on the dashboard plan page.
	 *
	 * @param Subscription $subscription Subscription.
	 *
	 * @return string
	 */
	public static function get_change_url( Subscription $subscription ): string {
		return add_query_arg( self::QUERY_ARG, '1', $subscription->get_view_order_url() );
	}

	/**
	 * "Add payment method" URL that brings the customer back to the change form.
	 *
	 * @param Subscription $subscription Subscription.
	 *
	 * @return string
	 */
	public static function get_add_payment_method_url( Subscription $subscription ): string {
		return add_query_arg(
			'return_to',
			rawurlencode( self::get_change_url( $subscription ) ),
			Helper::get_account_endpoint_url( 'add-payment-method' )
		);
	}

	/**
	 * The unpaid renewal order a failed automatic renewal left behind, if the subscription is on hold because of it.
	 *
	 * @param Subscription $subscription Subscription.
	 *
	 * @return Order|null
	 */
	public static function get_retryable_order( Subscription $subscription ): ?Order {
		// Manual renewals are paid by the customer on the order-pay page, and billing managed by the
		// gateway itself retries on the gateway's side, so only automatic renewals are retried here.
		if ( ! $subscription->has_status( 'on_hold' ) || $subscription->is_manual() ) {
			return null;
		}

		$order = $subscription->get_last_order( 'all', 'renewal' );

		if ( ! $order instanceof Order || ! $order->needs_payment() ) {
			return null;
		}

		return $order;
	}

	/**
	 * Load a saved payment method the user may use for the subscription.
	 *
	 * @param Subscription $subscription Subscription.
	 * @param int          $token_id     Token id.
	 * @param int          $user_id      User id.
	 *
	 * @return PaymentToken|WP_Error
	 */
	public static function get_valid_token( Subscription $subscription, int $token_id, int $user_id ) {
		try {
			$token = $token_id > 0 ? PaymentTokens::get_token( $token_id ) : null;
		} catch ( Throwable $e ) {
			$token = null;
		}

		if (
			! $token ||
			! $token->get_id() ||
			(int) $token->get_user_id() !== $user_id ||
			(int) $subscription->get_customer_id() !== $user_id ||
			$token->get_gateway_id() !== $subscription->get_payment_method()
		) {
			return new WP_Error(
				'storeengine_subscription_invalid_payment_method',
				__( 'Please choose one of your saved payment methods for this subscription.', 'storeengine' ),
				[ 'status' => 422 ]
			);
		}

		return $token;
	}

	/**
	 * Switch the subscription (and any unpaid renewal order) to a saved payment method.
	 *
	 * @param Subscription $subscription Subscription.
	 * @param int          $token_id     Saved payment method (token) id.
	 * @param int          $user_id      The user making the change; must own the subscription and the token.
	 *
	 * @return PaymentToken|WP_Error The token now in use.
	 */
	public static function change( Subscription $subscription, int $token_id, int $user_id ) {
		if ( ! self::can_change( $subscription, $user_id ) ) {
			return new WP_Error(
				'storeengine_subscription_payment_method_change_unavailable',
				__( 'The payment method of this subscription can not be changed.', 'storeengine' ),
				[ 'status' => 403 ]
			);
		}

		$token = self::get_valid_token( $subscription, $token_id, $user_id );
		if ( is_wp_error( $token ) ) {
			return $token;
		}

		$gateway_id   = (string) $subscription->get_payment_method();
		$old_token_id = self::get_current_token_id( $subscription );
		$old_token    = null;
		if ( $old_token_id ) {
			try {
				$old_token = PaymentTokens::get_token( $old_token_id );
			} catch ( Throwable $e ) {
				$old_token = null;
			}
		}

		$result = self::apply_to_order( $subscription, $subscription, $token );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		self::set_order_token( $subscription, $token );

		if ( $subscription->get_meta( self::META_AUTO_RENEWAL_DISABLED, true, 'edit' ) ) {
			// Auto-renewal was only switched off because the previous card was removed.
			$gateway = Helper::get_payment_gateway( $gateway_id );
			if ( $gateway && $gateway->supports( 'subscriptions_automatic_payments' ) && ! Helper::get_settings( 'turn_off_automatic_payments', false ) ) {
				$subscription->set_requires_manual_renewal( false );
			}
			$subscription->delete_meta_data( self::META_AUTO_RENEWAL_DISABLED );
		}

		$subscription->add_order_note(
			$old_token && $old_token->get_id() !== $token->get_id()
				? sprintf(
				/* translators: 1: previous payment method, 2: new payment method. */
					__( 'Payment method changed from %1$s to %2$s by the subscriber.', 'storeengine' ),
					$old_token->get_display_name(),
					$token->get_display_name()
				)
				: sprintf(
				/* translators: %s: new payment method. */
					__( 'Payment method changed to %s by the subscriber.', 'storeengine' ),
					$token->get_display_name()
				)
		);
		$subscription->save();

		// Renewal orders copy the subscription's payment meta when they're created, so an order
		// that is already waiting for payment needs the new method too.
		foreach ( self::get_unpaid_renewal_orders( $subscription ) as $order ) {
			$order_result = self::apply_to_order( $order, $subscription, $token );

			if ( is_wp_error( $order_result ) ) {
				Helper::log_error( $order_result );
				continue;
			}

			self::set_order_token( $order, $token );
			$order->save();
		}

		/**
		 * Fires after a subscription's payment method was changed.
		 *
		 * @param Subscription      $subscription The subscription.
		 * @param PaymentToken      $token        The saved payment method now in use.
		 * @param PaymentToken|null $old_token    The previous saved payment method, if known.
		 * @param int               $user_id      The user who made the change.
		 */
		do_action( 'storeengine/subscription/payment_method_updated', $subscription, $token, $old_token, $user_id );

		return $token;
	}

	/**
	 * Charge the failed renewal order again, with the subscription's current payment method.
	 *
	 * @param Subscription $subscription Subscription.
	 *
	 * @return true|WP_Error
	 */
	public static function retry_payment( Subscription $subscription ) {
		$order = self::get_retryable_order( $subscription );

		if ( ! $order ) {
			return new WP_Error(
				'storeengine_subscription_nothing_to_retry',
				__( 'There is no failed payment to retry for this subscription.', 'storeengine' ),
				[ 'status' => 422 ]
			);
		}

		// The payment method was usually just changed on another copy of this order; charge the stored one.
		wp_cache_delete( 'orders_' . $order->get_id(), 'storeengine_orders' );
		$order = Helper::get_order( $order->get_id() );
		if ( ! $order instanceof Order ) {
			return new WP_Error( 'storeengine_subscription_nothing_to_retry', __( 'There is no failed payment to retry for this subscription.', 'storeengine' ), [ 'status' => 422 ] );
		}

		$gateway_id = (string) $subscription->get_payment_method();

		Helper::get_payment_gateways()->load_gateways();
		$gateway    = $gateway_id ? Helper::get_payment_gateway( $gateway_id ) : null;
		$hook       = 'storeengine/subscription/scheduled_payment_' . $gateway_id;
		$has_action = $gateway_id && has_action( $hook );
		// Gateways that don't call the parent constructor never register the scheduled-payment hook,
		// but still implement the charge.
		$can_charge_directly = ! $has_action && $gateway && $gateway->supports( 'gateway_scheduled_payments' ) && method_exists( $gateway, 'process_scheduled_payment' );

		if ( ! $has_action && ! $can_charge_directly ) {
			return new WP_Error(
				'storeengine_subscription_retry_unsupported',
				__( 'This payment method can not retry the payment automatically. Please use "Retry payment" to pay the renewal order.', 'storeengine' ),
				[ 'status' => 422 ]
			);
		}

		if ( $order->get_payment_method() !== $gateway_id ) {
			$order->set_payment_method( $gateway_id );
		}

		$order->set_status( 'pending_payment' );
		$order->add_order_note( __( 'Subscriber retried the renewal payment after changing the payment method.', 'storeengine' ) );
		$order->save();

		try {
			if ( $has_action ) {
				do_action( $hook, $order );
			} else {
				$gateway->process_scheduled_payment( $order );
			}
		} catch ( Throwable $e ) {
			Helper::log_error( $e );
		}

		// The gateway saved its own copy; read the stored order, not the cached one.
		wp_cache_delete( 'orders_' . $order->get_id(), 'storeengine_orders' );
		$order = Helper::get_order( $order->get_id() );

		if ( ! $order instanceof Order || ! $order->is_paid() ) {
			return new WP_Error(
				'storeengine_subscription_retry_failed',
				__( 'Your payment method was updated, but the payment did not go through. Please check the payment method or try again later.', 'storeengine' ),
				[ 'status' => 402 ]
			);
		}

		return true;
	}

	/**
	 * Handle the dashboard change form.
	 */
	public static function handle_form_request(): void {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- nonce verified below.
		if ( empty( $_POST[ self::FORM_FIELD ] ) || self::FORM_ACTION !== $_POST[ self::FORM_FIELD ] || empty( $_POST['subscription_id'] ) ) {
			return;
		}

		Caching::nocache_headers();

		$subscription_id = absint( $_POST['subscription_id'] );
		$token_id        = absint( $_POST['payment_token'] ?? 0 );
		$retry           = ! empty( $_POST['retry_payment'] );
		$nonce           = sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ?? '' ) );
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		$die = static function ( string $message, int $code = 403 ) {
			wp_die(
				esc_html( $message ),
				esc_html__( 'Error: Can not change the payment method', 'storeengine' ),
				[
					'response'  => $code, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTTP status code.
					'back_link' => true,
				]
			);
		};

		if ( ! is_user_logged_in() || ! wp_verify_nonce( $nonce, self::nonce_action( $subscription_id ) ) ) {
			$die( __( 'Security error. Please contact us if needed.', 'storeengine' ) );
		}

		try {
			$subscription = Subscription::get_subscription( $subscription_id );
		} catch ( Throwable $e ) {
			$subscription = null;
		}

		if ( ! $subscription || ! $subscription->get_id() || get_current_user_id() !== (int) $subscription->get_customer_id() ) {
			$die( __( "That doesn't appear to be one of your subscriptions.", 'storeengine' ), 404 );
		}

		$result = self::change( $subscription, $token_id, get_current_user_id() );
		if ( is_wp_error( $result ) ) {
			$die( $result->get_error_message(), 422 );
		}

		$args = [ 'payment-method-updated' => '1' ];

		if ( $retry && self::get_retryable_order( $subscription ) ) {
			$retried               = self::retry_payment( $subscription );
			$args['payment-retry'] = is_wp_error( $retried ) ? 'failed' : 'paid';
		}

		wp_safe_redirect( add_query_arg( $args, $subscription->get_view_order_url() ) );
		exit;
	}

	/**
	 * Let the gateway apply the token to an order or subscription.
	 *
	 * @param AbstractOrder $order        Subscription or renewal order to update.
	 * @param Subscription  $subscription The subscription being changed.
	 * @param PaymentToken  $token        The new payment method.
	 *
	 * @return true|WP_Error
	 */
	protected static function apply_to_order( AbstractOrder $order, Subscription $subscription, PaymentToken $token ) {
		$gateway_id = (string) $subscription->get_payment_method();

		try {
			/**
			 * Applies a saved payment method to a subscription, or to one of its unpaid renewal orders.
			 *
			 * Gateways hook this to store whatever their renewal charge reads (customer and payment
			 * method ids, and for billing managed by the gateway, the default payment method there).
			 * Update meta on `$order` only; the caller saves it. Return true on success or a WP_Error.
			 *
			 * @param true|WP_Error|null $result       Null when no gateway handled it.
			 * @param AbstractOrder      $order        The subscription or renewal order to update.
			 * @param PaymentToken       $token        The saved payment method.
			 * @param Subscription       $subscription The subscription.
			 */
			$result = apply_filters( 'storeengine/subscription/apply_payment_method/' . $gateway_id, null, $order, $token, $subscription );
		} catch ( Throwable $e ) {
			Helper::log_error( $e );
			$result = new WP_Error( 'storeengine_subscription_payment_method_change_failed', $e->getMessage(), [ 'status' => 500 ] );
		}

		if ( null === $result ) {
			return new WP_Error(
				'storeengine_subscription_payment_method_change_unsupported',
				__( 'This payment method can not be changed on a subscription.', 'storeengine' ),
				[ 'status' => 422 ]
			);
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Store the token id as the order's payment token.
	 *
	 * @param AbstractOrder $order Order or subscription.
	 * @param PaymentToken  $token Token.
	 */
	protected static function set_order_token( AbstractOrder $order, PaymentToken $token ): void {
		$order->update_meta_data( '_payment_tokens', [ $token->get_id() ] );
	}

	/**
	 * Renewal orders still waiting for payment.
	 *
	 * @param Subscription $subscription Subscription.
	 *
	 * @return Order[]
	 */
	protected static function get_unpaid_renewal_orders( Subscription $subscription ): array {
		$orders = [];

		foreach ( $subscription->get_related_order_ids( 'renewal' ) as $order_id ) {
			$order = Helper::get_order( absint( $order_id ) );

			if ( $order instanceof Order && $order->needs_payment() ) {
				$orders[] = $order;
			}
		}

		return $orders;
	}
}

// End of file payment-method-change.php.
