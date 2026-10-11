<?php
/**
 * Server-side enforcement of the "Product form" settings.
 *
 * The React editor already hides fields, marks them required and pre-fills
 * defaults, but the browser is never the last line of defence: this hook applies
 * the same rules on the REST save so a hidden field still gets its default and a
 * required field can't be left empty by another client.
 *
 * Runs on `rest_pre_insert_storeengine_product`, i.e. before anything is written
 * and before SKU / stock / meta / terms are read from the request, so a rejected
 * save leaves nothing half-saved and defaults can be applied by editing the
 * request itself (no changes needed in the existing save code).
 *
 * Scope on purpose:
 *  - Only users the config applies to (never full admins) and only when the
 *    feature is configured at all; everything else returns immediately.
 *  - Defaults are applied to NEW products only, so saved values are never overwritten.
 *  - Required fields are enforced when the product leaves draft: on create only
 *    when it is being published, on update for the required fields present in
 *    the request. A vendor's placeholder (created as "pending") therefore isn't blocked.
 *  - Fields saved by a separate request (price) are enforced in the editor only.
 */

namespace StoreEngine\API;

use StoreEngine\Utils\Helper;
use StoreEngine\Utils\ProductFormFields;
use WP_Error;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ProductFormEnforcement {

	/**
	 * Request paths that map onto columns of the prepared post object.
	 */
	const POST_COLUMNS = [
		'title'   => 'post_title',
		'content' => 'post_content',
		'excerpt' => 'post_excerpt',
		'slug'    => 'post_name',
		'status'  => 'post_status',
	];

	public static function init() {
		$self = new self();

		// After the multi-vendor filter (priority 10), so we see the status it forces.
		add_filter( 'rest_pre_insert_' . Helper::PRODUCT_POST_TYPE, [ $self, 'enforce' ], 20, 2 );
	}

	/**
	 * @param object|WP_Error $prepared_post Post object about to be inserted.
	 * @param WP_REST_Request $request       Save request.
	 * @return object|WP_Error
	 */
	public function enforce( $prepared_post, $request ) {
		if ( is_wp_error( $prepared_post ) || ! ProductFormFields::is_active() || ! ProductFormFields::is_subject_to_config() ) {
			return $prepared_post;
		}

		/**
		 * Let integrations opt a request out (imports, syncs, migrations).
		 *
		 * @param bool            $skip
		 * @param WP_REST_Request $request
		 */
		if ( apply_filters( 'storeengine/product_form/skip_enforcement', false, $request ) ) {
			return $prepared_post;
		}

		$creating = empty( $request['id'] );
		$fields   = ProductFormFields::all();

		if ( $creating ) {
			$prepared_post = $this->apply_hidden_defaults( $prepared_post, $request, $fields );
		}

		// A partial update may not carry a status, so fall back to the product's current one.
		$current = $creating ? '' : (string) get_post_status( (int) $request['id'] );
		$status  = (string) ( $prepared_post->post_status ?? $request->get_param( 'status' ) ?? ( $current ?: 'draft' ) );
		if ( $creating ) {
			$enforce = 'publish' === $status;
		} else {
			$enforce = ! in_array( $status, [ 'draft', 'auto-draft', 'trash' ], true );
		}

		if ( ! $enforce ) {
			return $prepared_post;
		}

		// Leaving draft (or pending) for a live status is the moment everything must be complete.
		$publishing = ! $creating && in_array( $current, [ 'draft', 'auto-draft', 'pending', '' ], true ) && 'publish' === $status;

		$missing = $this->missing_required( $request, $fields, $creating, $publishing );
		if ( $missing ) {
			$labels = wp_list_pluck( $missing, 'label' );

			return new WP_Error(
				'storeengine_product_form_required',
				/* translators: %s: comma separated field labels */
				sprintf( __( 'Please fill in the required field(s): %s', 'storeengine' ), implode( ', ', $labels ) ),
				[
					'status' => 400,
					'fields' => array_keys( $missing ),
				]
			);
		}

		return $prepared_post;
	}

	/**
	 * Fill hidden fields that have a default and weren't (meaningfully) sent.
	 *
	 * @param object          $prepared_post Post being created.
	 * @param WP_REST_Request $request       Save request.
	 * @param array           $fields        Resolved fields.
	 * @return object
	 */
	protected function apply_hidden_defaults( $prepared_post, WP_REST_Request $request, array $fields ) {
		$data = $request->get_params();

		foreach ( $fields as $row ) {
			if ( 'field' !== $row['kind'] || ! $row['server'] || ! $row['hidden_effective'] || null === $row['default'] ) {
				continue;
			}

			if ( ProductFormFields::has_path( $data, $row['path'] ) && ! ProductFormFields::is_empty_value( ProductFormFields::get_path_value( $data, $row['path'] ), $row ) ) {
				continue;
			}

			$this->set_request_path( $request, $row['path'], $row['default'] );

			if ( isset( self::POST_COLUMNS[ $row['path'] ] ) ) {
				$prepared_post->{self::POST_COLUMNS[ $row['path'] ]} = $row['default'];
			}
		}

		return $prepared_post;
	}

	/**
	 * Required fields that are empty in this request.
	 *
	 * @param WP_REST_Request $request  Save request.
	 * @param array           $fields   Resolved fields.
	 * @param bool            $creating   Whether a new product is being created.
	 * @param bool            $publishing Whether an existing product is going live now, so fields
	 *                                    missing from a partial request are judged by their stored value.
	 * @return array<string,array> id => row.
	 */
	protected function missing_required( WP_REST_Request $request, array $fields, bool $creating, bool $publishing = false ): array {
		$data    = $request->get_params();
		$missing = [];

		foreach ( $fields as $id => $row ) {
			if ( 'field' !== $row['kind'] || ! $row['server'] || ! $row['required'] || ! empty( $row['system'] ) ) {
				continue;
			}

			// A required field that is hidden gets its default (applied above); if
			// there is no default the settings screen refuses to save that config.
			if ( $row['hidden_effective'] && null !== $row['default'] ) {
				continue;
			}

			$present = ProductFormFields::has_path( $data, $row['path'] );
			if ( ! $creating && ! $present ) {
				if ( ! $publishing ) {
					// Partial update: only judge what the client actually sent.
					continue;
				}

				$stored = $this->stored_value( (int) $request['id'], $row );
				if ( null !== $stored && ProductFormFields::is_empty_value( $stored, $row ) ) {
					$missing[ $id ] = $row;
				}
				continue;
			}

			if ( ProductFormFields::is_empty_value( ProductFormFields::get_path_value( $data, $row['path'] ), $row ) ) {
				$missing[ $id ] = $row;
			}
		}

		return $missing;
	}

	/**
	 * Current stored value of a field, for the kinds saved on the post itself
	 * (featured image, post meta, taxonomy terms). Null when it can't be read cheaply
	 * (custom-table data such as SKU or stock), in which case the field isn't judged.
	 *
	 * @param int   $post_id Product ID.
	 * @param array $row     Resolved field.
	 * @return mixed|null
	 */
	protected function stored_value( int $post_id, array $row ) {
		$path = (string) $row['path'];

		if ( 'featured_media' === $path ) {
			return (int) get_post_thumbnail_id( $post_id );
		}
		if ( 0 === strpos( $path, 'meta.' ) ) {
			return get_post_meta( $post_id, substr( $path, 5 ), true );
		}
		if ( 'terms' === ( $row['type'] ?? '' ) && taxonomy_exists( $path ) ) {
			$terms = wp_get_object_terms( $post_id, $path, [ 'fields' => 'ids' ] );
			return is_wp_error( $terms ) ? null : $terms;
		}

		return null;
	}

	/**
	 * Write a value at a dotted path into the request (meta.x, stock.x, or top level).
	 *
	 * @param WP_REST_Request $request Save request.
	 * @param string          $path    Dotted path.
	 * @param mixed           $value   Value.
	 */
	protected function set_request_path( WP_REST_Request $request, string $path, $value ): void {
		if ( false === strpos( $path, '.' ) ) {
			$request->set_param( $path, $value );
			return;
		}

		list( $root, $key ) = explode( '.', $path, 2 );
		$bucket             = $request->get_param( $root );
		$bucket             = is_array( $bucket ) ? $bucket : [];
		$bucket[ $key ]     = $value;
		$request->set_param( $root, $bucket );
	}
}
