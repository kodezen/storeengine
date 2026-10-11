<?php
/**
 * Current-user-scoped subscriptions endpoints for the headless customer dashboard.
 *
 * @package StoreEngine\API
 */

namespace StoreEngine\API;

use StoreEngine\Addons\Subscription\Classes\PaymentMethodChange;
use StoreEngine\Addons\Subscription\Classes\Subscription;
use StoreEngine\Addons\Subscription\Classes\SubscriptionCollection;
use StoreEngine\Classes\Exceptions\StoreEngineException;
use StoreEngine\Utils\Helper;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class MeSubscriptions extends AbstractRestApiController {

	protected $rest_base = 'me/subscriptions';

	public static function init() {
		if ( ! class_exists( SubscriptionCollection::class ) ) {
			return;
		}

		$self = new self();
		add_action( 'rest_api_init', [ $self, 'register_routes' ] );
		add_filter( 'storeengine/rest/me/menu_items', [ $self, 'add_menu_item' ] );
	}

	public function register_routes() {
		register_rest_route( $this->namespace, '/' . $this->rest_base, [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [ $this, 'list_subscriptions' ],
			'permission_callback' => [ $this, 'permission_check' ],
			'args'                => [
				'page'     => [ 'type' => 'integer', 'default' => 1 ],
				'per_page' => [ 'type' => 'integer', 'default' => 10 ],
				'status'   => [ 'type' => 'string' ],
			],
		] );

		register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
			'args'                => [ 'id' => [ 'type' => 'integer' ] ],
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [ $this, 'get_subscription' ],
			'permission_callback' => [ $this, 'permission_check' ],
		] );

		register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/payment-method', [
			[
				'args'                => [ 'id' => [ 'type' => 'integer' ] ],
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_payment_method_options' ],
				'permission_callback' => [ $this, 'permission_check' ],
			],
			[
				'args'                => [
					'id'               => [ 'type' => 'integer' ],
					'payment_token_id' => [
						'description' => __( 'Id of one of the customer\'s saved payment methods for the subscription\'s gateway.', 'storeengine' ),
						'type'        => 'integer',
						'required'    => true,
					],
					'retry_payment'    => [
						'description' => __( 'Retry a failed renewal payment right away with the new payment method.', 'storeengine' ),
						'type'        => 'boolean',
						'default'     => false,
					],
				],
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'update_payment_method' ],
				'permission_callback' => [ $this, 'permission_check' ],
			],
		] );

		foreach ( [ 'cancel', 'pause', 'resume' ] as $action ) {
			register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/' . $action, [
				'args'                => [ 'id' => [ 'type' => 'integer' ] ],
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, $action . '_subscription' ],
				'permission_callback' => [ $this, 'permission_check' ],
			] );
		}
	}

	public function permission_check() {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'storeengine_rest_not_logged_in', __( 'You must be logged in.', 'storeengine' ), [ 'status' => 401 ] );
		}

		return true;
	}

	public function add_menu_item( array $items ): array {
		$items[] = [
			'slug'  => 'subscriptions',
			'route' => 'subscriptions',
			'label' => __( 'Subscriptions', 'storeengine' ),
			'icon'  => 'refresh',
			'order' => 15,
		];

		return $items;
	}

	public function list_subscriptions( WP_REST_Request $request ) {
		$user_id  = get_current_user_id();
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = min( 100, max( 1, (int) $request->get_param( 'per_page' ) ) );
		$status   = $request->get_param( 'status' );

		$where = [
			'relation' => 'AND',
			[ 'key' => 'type', 'value' => 'subscription' ],
			[ 'key' => 'customer_id', 'value' => $user_id, 'type' => 'NUMERIC' ],
		];

		if ( $status ) {
			$where[] = [ 'key' => 'status', 'value' => $status ];
		} else {
			$where[] = [
				'key'     => 'status',
				'value'   => [ 'draft', 'auto-draft', 'trash' ],
				'compare' => 'NOT IN',
			];
		}

		$query = new SubscriptionCollection( [
			'per_page' => $per_page,
			'page'     => $page,
			'where'    => $where,
		] );

		$data = [];
		foreach ( $query->get_results() as $sub ) {
			$data[] = $this->format_subscription( $sub );
		}

		return $this->prepare_query_response( $data, $query, $request );
	}

	public function get_subscription( WP_REST_Request $request ) {
		$sub = $this->load_owned( (int) $request->get_param( 'id' ) );
		if ( is_wp_error( $sub ) ) {
			return $sub;
		}

		return rest_ensure_response( $this->format_subscription( $sub, true ) );
	}

	public function cancel_subscription( WP_REST_Request $request ) {
		return $this->change_status( $request, 'pending_cancel', __( 'Cancelled by customer.', 'storeengine' ) );
	}

	public function pause_subscription( WP_REST_Request $request ) {
		return $this->change_status( $request, 'on_hold', __( 'Paused by customer.', 'storeengine' ) );
	}

	public function resume_subscription( WP_REST_Request $request ) {
		return $this->change_status( $request, 'active', __( 'Resumed by customer.', 'storeengine' ) );
	}

	/**
	 * Saved payment methods the subscription can switch to.
	 */
	public function get_payment_method_options( WP_REST_Request $request ) {
		$sub = $this->load_owned( (int) $request->get_param( 'id' ) );
		if ( is_wp_error( $sub ) ) {
			return $sub;
		}

		return rest_ensure_response( $this->format_payment_method_options( $sub ) );
	}

	/**
	 * Switch the subscription to another saved payment method, optionally retrying a failed renewal.
	 */
	public function update_payment_method( WP_REST_Request $request ) {
		$sub = $this->load_owned( (int) $request->get_param( 'id' ) );
		if ( is_wp_error( $sub ) ) {
			return $sub;
		}

		$token = PaymentMethodChange::change( $sub, (int) $request->get_param( 'payment_token_id' ), get_current_user_id() );
		if ( is_wp_error( $token ) ) {
			return $token;
		}

		$retry = null;
		if ( rest_sanitize_boolean( $request->get_param( 'retry_payment' ) ) && PaymentMethodChange::get_retryable_order( $sub ) ) {
			$retried = PaymentMethodChange::retry_payment( $sub );
			$retry   = [
				'paid'    => ! is_wp_error( $retried ),
				'message' => is_wp_error( $retried ) ? $retried->get_error_message() : __( 'The payment went through.', 'storeengine' ),
			];
			$sub     = $this->load_owned( $sub->get_id() );
			if ( is_wp_error( $sub ) ) {
				return $sub;
			}
		}

		$data                  = $this->format_subscription( $sub, true );
		$data['payment_retry'] = $retry;

		return rest_ensure_response( $data );
	}

	protected function format_payment_method_options( Subscription $sub ): array {
		$can_change = PaymentMethodChange::can_change( $sub );
		$tokens     = $can_change ? PaymentMethodChange::get_available_tokens( $sub ) : [];
		$retryable  = $can_change ? PaymentMethodChange::get_retryable_order( $sub ) : null;

		return [
			'can_change'             => $can_change,
			'gateway'                => (string) $sub->get_payment_method(),
			'current_token_id'       => $can_change ? PaymentMethodChange::get_current_token_id( $sub ) : 0,
			'tokens'                 => array_map( static fn( $token ) => [
				'id'           => $token->get_id(),
				'display_name' => $token->get_display_name(),
				'is_default'   => $token->is_default(),
			], $tokens ),
			'add_payment_method_url' => $can_change ? PaymentMethodChange::get_add_payment_method_url( $sub ) : '',
			'retryable_order_id'     => $retryable ? $retryable->get_id() : 0,
		];
	}

	protected function change_status( WP_REST_Request $request, string $new_status, string $note ) {
		$sub = $this->load_owned( (int) $request->get_param( 'id' ) );
		if ( is_wp_error( $sub ) ) {
			return $sub;
		}

		if ( ! $sub->has_status( $new_status ) && ! $sub->can_be_updated_to( $new_status ) ) {
			return new WP_Error(
				'storeengine_rest_status_not_allowed',
				/* translators: %s: subscription status. */
				sprintf( __( 'This subscription can not be changed to "%s".', 'storeengine' ), SubscriptionCollection::get_subscription_status_name( $new_status ) ),
				[ 'status' => 422 ]
			);
		}

		try {
			$sub->update_status( $new_status, $note );
		} catch ( StoreEngineException $e ) {
			return new WP_Error( 'storeengine_rest_status_failed', $e->getMessage(), [ 'status' => 500 ] );
		}

		return rest_ensure_response( $this->format_subscription( $sub, true ) );
	}

	/**
	 * @return Subscription|WP_Error
	 */
	protected function load_owned( int $id ) {
		if ( $id <= 0 ) {
			return new WP_Error( 'storeengine_rest_invalid_id', __( 'Invalid subscription id.', 'storeengine' ), [ 'status' => 400 ] );
		}

		try {
			$sub = new Subscription( $id );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'storeengine_rest_subscription_not_found', __( 'Subscription not found.', 'storeengine' ), [ 'status' => 404 ] );
		}

		if ( ! $sub->get_id() || (int) $sub->get_customer_id() !== get_current_user_id() || $sub->has_status( [ 'draft', 'auto-draft', 'trash' ] ) ) {
			return new WP_Error( 'storeengine_rest_subscription_not_found', __( 'Subscription not found.', 'storeengine' ), [ 'status' => 404 ] );
		}

		return $sub;
	}

	protected function format_subscription( Subscription $sub, bool $detailed = false ): array {
		$data = [
			'id'                => $sub->get_id(),
			'status'            => $sub->get_status(),
			'total'             => (float) $sub->get_total_amount(),
			'currency'          => $sub->get_currency(),
			'billing_period'    => $sub->get_payment_duration_type(),
			'billing_interval'  => (int) $sub->get_payment_duration(),
			'start_date'        => $this->date_as_string( $sub->get_start_date() ),
			'next_payment_date' => $this->date_as_string( $sub->get_next_payment_date() ),
			'last_payment_date' => $this->date_as_string( $sub->get_last_payment_date() ),
			'end_date'          => $this->date_as_string( $sub->get_end_date() ),
			'trial'             => (bool) $sub->get_trial(),
			'trial_end_date'    => $this->date_as_string( $sub->get_trial_end_date() ),
			'payment_method'    => $sub->get_payment_method_to_display(),
			'parent_order_id'   => $sub->get_initial_order_id(),
			'can_resume'        => $sub->has_status( 'pending_cancel' ) && $sub->can_be_updated_to( 'active' ),
		];

		if ( $detailed ) {
			$data['related_order_ids'] = $sub->get_related_order_ids( 'any' );
			$data['suspension_count']  = (int) $sub->get_suspension_count();
			$billing                   = $sub->get_address( 'billing' );
			$shipping                  = $sub->get_address( 'shipping' );
			unset( $billing['address_type'], $shipping['address_type'] );
			$data['billing_address']       = $billing;
			$data['shipping_address']      = $shipping;
			$data['payment_method_change'] = $this->format_payment_method_options( $sub );
		}

		return $data;
	}
}
