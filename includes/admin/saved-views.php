<?php
/**
 * Per-user saved filter views for admin list screens.
 *
 * Stored in one user-meta blob, separate from Screen Options (whose save
 * replaces a screen's whole entry):
 *
 *   storeengine_saved_views => [ '<screenId>' => [ { id, name, filters }, … ] ]
 *
 * `filters` is the list screen's own JSON filter payload (for products, the
 * groups understood by API\ProductFilters). Seeded into
 * `StoreEngineGlobal.saved_views` at page load.
 *
 * @package StoreEngine\Admin
 */

namespace StoreEngine\Admin;

use StoreEngine\Classes\AbstractAjaxHandler;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SavedViews extends AbstractAjaxHandler {

	const META_KEY  = 'storeengine_saved_views';
	const MAX_VIEWS = 30;

	/**
	 * Largest accepted `filters` payload, in bytes. Real views are a few hundred.
	 */
	const MAX_FILTERS_BYTES = 8192;

	public function __construct() {
		// `read`: each user manages only their own views; the storeengine_nonce
		// (only on StoreEngine admin pages) gates the request.
		$this->actions = [
			'save_saved_view'   => [
				'capability' => 'read',
				'callback'   => [ $this, 'save' ],
				'fields'     => [
					'screen'  => 'string',
					'id'      => 'string',
					'name'    => 'string',
					'filters' => 'string', // JSON.
				],
			],
			'delete_saved_view' => [
				'capability' => 'read',
				'callback'   => [ $this, 'delete' ],
				'fields'     => [
					'screen' => 'string',
					'id'     => 'string',
				],
			],
		];
	}

	/**
	 * All of the current user's views, keyed by screen.
	 */
	public static function get_all( ?int $user_id = null ): array {
		$user_id = $user_id ?: get_current_user_id();
		$data    = $user_id ? get_user_meta( $user_id, self::META_KEY, true ) : [];

		return is_array( $data ) ? $data : [];
	}

	/**
	 * List screens that support saved views. Anything else is rejected so a
	 * request can't grow the meta blob with arbitrary keys.
	 */
	public static function screens(): array {
		return (array) apply_filters( 'storeengine/saved_views/screens', [ 'products', 'orders', 'customers', 'payments', 'coupons' ] );
	}

	public function save( array $payload ) {
		$screen  = sanitize_key( $payload['screen'] ?? '' );
		$name    = trim( sanitize_text_field( $payload['name'] ?? '' ) );
		$id      = substr( sanitize_key( $payload['id'] ?? '' ), 0, 32 );
		$raw     = wp_unslash( (string) ( $payload['filters'] ?? '' ) );
		$filters = strlen( $raw ) <= self::MAX_FILTERS_BYTES ? json_decode( $raw, true ) : null;

		if ( ! in_array( $screen, self::screens(), true ) || '' === $name || ! is_array( $filters ) ) {
			wp_send_json_error( [ 'message' => __( 'Give the view a name and at least one filter.', 'storeengine' ) ] );
		}

		$all   = self::get_all();
		$views = isset( $all[ $screen ] ) && is_array( $all[ $screen ] ) ? $all[ $screen ] : [];
		$view  = [
			'id'      => $id ? $id : 'v' . substr( md5( uniqid( '', true ) ), 0, 10 ),
			'name'    => mb_substr( $name, 0, 60 ),
			'filters' => wp_json_encode( $filters ),
		];

		$found = false;
		foreach ( $views as $i => $existing ) {
			if ( ( $existing['id'] ?? '' ) === $view['id'] ) {
				$views[ $i ] = $view;
				$found       = true;
				break;
			}
		}
		if ( ! $found ) {
			if ( count( $views ) >= self::MAX_VIEWS ) {
				wp_send_json_error( [ 'message' => __( 'You have reached the limit of saved views for this screen.', 'storeengine' ) ] );
			}
			$views[] = $view;
		}

		$all[ $screen ] = array_values( $views );
		update_user_meta( get_current_user_id(), self::META_KEY, $all );

		wp_send_json_success( [
			'view'  => $view,
			'views' => $all[ $screen ],
		] );
	}

	public function delete( array $payload ) {
		$screen = sanitize_key( $payload['screen'] ?? '' );
		$id     = sanitize_key( $payload['id'] ?? '' );
		$all    = self::get_all();

		if ( isset( $all[ $screen ] ) && is_array( $all[ $screen ] ) ) {
			$all[ $screen ] = array_values( array_filter( $all[ $screen ], fn( $v ) => ( $v['id'] ?? '' ) !== $id ) );
			update_user_meta( get_current_user_id(), self::META_KEY, $all );
		}

		wp_send_json_success( [ 'views' => $all[ $screen ] ?? [] ] );
	}
}
