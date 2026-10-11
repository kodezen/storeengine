<?php

namespace StoreEngine\Ajax;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Exception;
use StoreEngine\Classes\AbstractAjaxHandler;
use StoreEngine\Classes\Attribute;
use StoreEngine\Utils\Helper;

class Attributes extends AbstractAjaxHandler {
	public function __construct() {
		$this->actions = array(
			'get_product_attributes'          => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'get_product_attributes' ],
				'fields'     => [
					'page'     => 'int',
					'per_page' => 'int',
					'status'   => 'string',
					'search'   => 'string',
				],
			],
			'create_product_attribute'        => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'create_product_attribute' ],
				'fields'     => [
					'attribute_name'    => 'string',
					'attribute_label'   => 'string',
					'attribute_type'    => 'string',
					'attribute_orderby' => 'string',
					'attribute_public'  => 'boolean',
				],
			],
			'update_product_attribute'        => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'update_product_attribute' ],
				'fields'     => [
					'attribute_id'      => 'int',
					'attribute_label'   => 'string',
					'attribute_name'    => 'string',
					'attribute_type'    => 'string',
					'attribute_orderby' => 'string',
					'attribute_public'  => 'int',
				],
			],
			'delete_product_attribute'        => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'delete_product_attribute' ],
				'fields'     => [
					'attribute_id' => 'int',
					'force'        => 'bool',
				],
			],
			'get_product_attribute_usage'     => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'get_product_attribute_usage' ],
				'fields'     => [
					'attribute_id' => 'int',
					'term_id'      => 'int',
				],
			],
			'delete_bulk_product_attributes'  => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'delete_bulk_product_attributes' ],
				'fields'     => [
					'attribute_ids' => 'string',
					'force'         => 'bool',
				],
			],
			// attribute term
			'get_product_attribute_terms'     => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'get_product_attribute_terms' ],
				'fields'     => [
					'attribute_id' => 'int',
					'search'       => '',
				],
			],
			'create_product_attribute_term'   => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'create_product_attribute_term' ],
				'fields'     => [
					'attribute_id' => 'int',
					'id'           => 'int',
					'name'         => 'string',
					'slug'         => 'string',
					'description'  => 'string',
					'color'        => 'string',
					'image_id'     => 'absint',
				],
			],
			'create_product_attribute_terms'  => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'create_product_attribute_terms' ],
				'fields'     => [
					'attribute_id' => 'int',
					// JSON list of { name, slug?, color? } (quick-add presets).
					'terms'        => 'string',
				],
			],
			'update_product_attribute_term'   => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'update_product_attribute_term' ],
				'fields'     => [
					'attribute_id' => 'int',
					'term_id'      => 'int',
					'name'         => 'string',
					'slug'         => 'string',
					'description'  => 'string',
					'color'        => 'string',
					'image_id'     => 'absint',
				],
			],
			'reorder_product_attributes'      => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'reorder_product_attributes' ],
				'fields'     => [
					// Comma-separated attribute IDs in their new order.
					'attribute_ids' => 'string',
					'force'         => 'bool',
				],
			],
			'reorder_product_attribute_terms' => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'reorder_product_attribute_terms' ],
				'fields'     => [
					'attribute_id' => 'int',
					// Comma-separated term IDs in their new order.
					'term_ids'     => 'string',
				],
			],
			'delete_product_attribute_term'   => [
				'capability' => 'manage_options',
				'callback'   => [ $this, 'delete_product_attribute_term' ],
				'fields'     => [
					'attribute_id' => 'int',
					'term_id'      => 'int',
					'force'        => 'bool',
				],
			],
		);
	}

	public function get_product_attributes( array $payload ) {
		$page     = $payload['page'] ?? 1;
		$per_page = $payload['per_page'] ?? 10;
		$search   = $payload['search'] ?? '';

		$attributes = Helper::get_product_attributes( [
			'per_page' => $per_page,
			'page'     => $page,
			'search'   => $search,
		] );

		wp_send_json_success( [
			'totalItems' => Helper::get_total_product_attributes_count( $search ),
			'attributes' => array_map( fn( $attribute ) => [
				'attribute_id'         => $attribute->get_id(),
				'attribute_name'       => $attribute->get_name(),
				'attribute_label'      => $attribute->get_label(),
				'attribute_orderby'    => $attribute->get_orderby(),
				'attribute_type'       => $attribute->get_type(),
				'attribute_public'     => $attribute->is_public(),
				'attribute_terms'      => implode( ', ', array_map( fn( $term ) => $term->name, $attribute->get_terms() ) ),
				'attribute_term_count' => (int) $attribute->get_count(),
			], $attributes ),
		] );
	}

	public function create_product_attribute( array $payload ) {
		if ( empty( $payload['attribute_label'] ) ) {
			wp_send_json_error( __( 'Please, provide an attribute name.', 'storeengine' ) );
		}

		// Set the attribute slug.
		if ( empty( $payload['attribute_name'] ) ) {
			$slug = Helper::sanitize_taxonomy_name( $payload['attribute_label'] );
		} else {
			$slug = Helper::strip_attribute_taxonomy_name( Helper::sanitize_taxonomy_name( $payload['attribute_name'] ) );
		}

		// Taxonomy max length is 32.
		// se_pa_ length 6 (remain 32-6-1 = 25)

		// Validate slug.
		if ( strlen( $slug ) > 25 ) {
			/* translators: %s: attribute slug */
			wp_send_json_error( sprintf( __( 'Slug "%s" is too long (25 characters max). Shorten it, please.', 'storeengine' ), $slug ), array( 'status' => 400 ) );
		} elseif ( Helper::check_if_attribute_name_is_reserved( $slug ) ) {
			/* translators: %s: attribute slug */
			wp_send_json_error( sprintf( __( 'Slug "%s" is not allowed because it is a reserved term. Change it, please.', 'storeengine' ), $slug ), array( 'status' => 400 ) );
		} elseif ( taxonomy_exists( Helper::get_attribute_taxonomy_name( $slug ) ) || Attribute::name_exists( $slug ) ) {
			/* translators: %s: attribute slug */
			wp_send_json_error( sprintf( __( 'Slug "%s" is already in use. Change it, please.', 'storeengine' ), $slug ) );
		}

		if ( empty( $payload['attribute_orderby'] ) || ! in_array( $payload['attribute_orderby'], [ 'name', 'custom-ordering', 'numeric-name', 'term_id' ], true ) ) {
			$payload['attribute_orderby'] = 'custom-ordering';
		}

		$attribute = new Attribute();
		$attribute->set_name( $slug );
		$attribute->set_label( $payload['attribute_label'] );
		$attribute->set_type( $this->sanitize_attribute_type( $payload['attribute_type'] ?? '' ) );
		$attribute->set_orderby( $payload['attribute_orderby'] );
		$attribute->set_public( $payload['attribute_public'] ?? false );

		try {
			$attribute->save();
		} catch ( Exception $e ) {
			wp_send_json_error( $e->getMessage() );
		}

		$attribute->get();

		wp_send_json_success( [
			'attribute_id'      => $attribute->get_id(),
			'attribute_name'    => $attribute->get_name(),
			'attribute_label'   => $attribute->get_label(),
			'attribute_orderby' => $attribute->get_orderby(),
			'attribute_type'    => $attribute->get_type(),
			'attribute_public'  => $attribute->is_public(),
		] );
	}

	public function update_product_attribute( array $payload ) {
		if ( empty( $payload['attribute_id'] ) ) {
			wp_send_json_error( __( 'Invalid request.', 'storeengine' ) );
		}

		$attribute = Helper::get_product_attribute( $payload['attribute_id'] );

		if ( ! $attribute ) {
			wp_send_json_error( __( 'Attribute not found', 'storeengine' ) );
		}

		if ( empty( $payload['attribute_label'] ) ) {
			wp_send_json_error( __( 'Please, provide an attribute name.', 'storeengine' ) );
		}

		// Set the attribute slug.
		if ( empty( $payload['attribute_name'] ) ) {
			$slug = Helper::sanitize_taxonomy_name( $payload['attribute_label'] );
		} else {
			$slug = Helper::strip_attribute_taxonomy_name( Helper::sanitize_taxonomy_name( $payload['attribute_name'] ) );
		}

		// Taxonomy max length is 32.
		// se_pa_ length 6 (remain 32-6-1 = 25)

		// Validate slug.
		if ( strlen( $slug ) > 25 ) {
			/* translators: %s: attribute slug */
			wp_send_json_error( sprintf( __( 'Slug "%s" is too long (25 characters max). Shorten it, please.', 'storeengine' ), $slug ), array( 'status' => 400 ) );
		} elseif ( Helper::check_if_attribute_name_is_reserved( $slug ) ) {
			/* translators: %s: attribute slug */
			wp_send_json_error( sprintf( __( 'Slug "%s" is not allowed because it is a reserved term. Change it, please.', 'storeengine' ), $slug ), array( 'status' => 400 ) );
		} elseif ( $slug !== $attribute->get_name() && ( taxonomy_exists( Helper::get_attribute_taxonomy_name( $slug ) ) || Attribute::name_exists( $slug, (int) $attribute->get_id() ) ) ) {
			/* translators: %s: attribute slug */
			wp_send_json_error( sprintf( __( 'Slug "%s" is already in use. Change it, please.', 'storeengine' ), $slug ) );
		}

		if ( empty( $payload['attribute_orderby'] ) || ! in_array( $payload['attribute_orderby'], [ 'name', 'custom-ordering', 'numeric-name', 'term_id' ], true ) ) {
			$payload['attribute_orderby'] = 'custom-ordering';
		}

		$old_slug = $attribute->get_name();
		$attribute->set_name( $slug );
		$attribute->set_label( $payload['attribute_label'] );
		$attribute->set_type( $this->sanitize_attribute_type( $payload['attribute_type'] ?? $attribute->get_type() ) );
		$attribute->set_orderby( $payload['attribute_orderby'] );
		$attribute->set_public( $payload['attribute_public'] );

		try {
			global $wpdb;

			// Save new data.
			$attribute->save();

			$new_taxonomy = Helper::get_attribute_taxonomy_name( $slug );
			$old_taxonomy = Helper::get_attribute_taxonomy_name( $old_slug );

			// Update taxonomies in the wp term taxonomy table.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$wpdb->update( $wpdb->term_taxonomy, [ 'taxonomy' => $new_taxonomy ], [ 'taxonomy' => $old_taxonomy ] );
			wp_cache_flush_group( $old_taxonomy . '_relationships' );
			wp_cache_set_terms_last_changed();

			// Update prefix in attribute order.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$results = $wpdb->get_results( $wpdb->prepare( "SELECT meta_id, meta_value FROM $wpdb->postmeta WHERE meta_key = '_storeengine_product_attributes_order' AND meta_value LIKE %s", '%' . $old_taxonomy . '%' ) );

			foreach ( $results as $meta ) {
				$meta_value = maybe_unserialize( $meta->meta_value );
				if ( ! is_array( $meta_value ) ) {
					$meta_value = json_decode( $meta->meta_value, true );
				}

				foreach ( $meta_value as $k => $v ) {
					if ( $old_taxonomy === $v ) {
						$meta_value[ $k ] = $new_taxonomy;
					}
				}

				$wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
					$wpdb->postmeta,
					[ 'meta_value' => maybe_serialize( $meta_value ) ], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
					[ 'meta_id' => $meta->meta_id ],
				);
			}

			wp_send_json_success( [
				'attribute_id'      => $attribute->get_id(),
				'attribute_name'    => $attribute->get_name(),
				'attribute_label'   => $attribute->get_label(),
				'attribute_orderby' => $attribute->get_orderby(),
				'attribute_type'    => $attribute->get_type(),
				'attribute_public'  => $attribute->is_public(),
			] );
		} catch ( Exception $e ) {
			wp_send_json_error( $e->getMessage() );
		}
	}

	public function delete_product_attribute( array $payload ) {
		if ( ! isset( $payload['attribute_id'] ) || $payload['attribute_id'] <= 0 ) {
			wp_send_json_error( __( 'Invalid attribute id', 'storeengine' ) );
		}

		$existing = Helper::get_product_attribute( $payload['attribute_id'] );
		if ( $existing && empty( $payload['force'] ) && $existing->get_usage( 0, 0 )['in_use'] ) {
			wp_send_json_error( __( 'This attribute is used by products. Review what will be removed, then confirm the delete.', 'storeengine' ) );
		}

		$attribute = Helper::delete_product_attribute( $payload['attribute_id'] );

		if ( ! $attribute ) {
			wp_send_json_error( __( 'Attribute could not deleted', 'storeengine' ) );
		}

		wp_send_json_success();
	}

	public function delete_bulk_product_attributes( array $payload ) {
		$attribute_ids = $payload['attribute_ids'] ?? '';
		$attribute_ids = explode( ',', $attribute_ids );

		if ( empty( $attribute_ids ) ) {
			wp_send_json_error( __( 'Attribute IDs not found', 'storeengine' ) );
		}

		$skipped = [];
		foreach ( $attribute_ids as $attribute_id ) {
			$attribute = Helper::get_product_attribute( $attribute_id );
			if ( ! $attribute ) {
				continue;
			}
			// In-use attributes take products' variations with them; only on explicit request.
			if ( empty( $payload['force'] ) && $attribute->get_usage( 0, 0 )['in_use'] ) {
				$skipped[] = $attribute->get_id();
				continue;
			}
			$attribute->delete();
		}

		wp_send_json_success( [ 'skipped' => $skipped ] );
	}

	/**
	 * What deleting an attribute (or one of its terms, with `term_id`) would remove.
	 */
	public function get_product_attribute_usage( array $payload ) {
		$attribute = Helper::get_product_attribute( $payload['attribute_id'] ?? 0 );

		if ( ! $attribute ) {
			wp_send_json_error( __( 'Invalid Attribute.', 'storeengine' ) );
		}

		wp_send_json_success( $attribute->get_usage( absint( $payload['term_id'] ?? 0 ) ) );
	}

	public function get_product_attribute_terms( array $payload ) {
		$attribute = Helper::get_product_attribute( $payload['attribute_id'] );

		if ( ! $attribute ) {
			wp_send_json_error( __( 'Invalid Attribute.', 'storeengine' ) );
		}

		$args = [];
		if ( isset( $payload['search'] ) ) {
			$args['search'] = $payload['search'];
		}
		$terms = $attribute->get_terms( $args );
		if ( is_wp_error( $terms ) ) {
			wp_send_json_error( $terms->get_error_message() );
		}

		wp_send_json_success( array_map( [ $this, 'format_attribute_term' ], $terms ) );
	}

	public function create_product_attribute_term( array $payload ) {
		$attribute = Helper::get_product_attribute( $payload['attribute_id'] );

		if ( ! $attribute ) {
			wp_send_json_error( __( 'Invalid Attribute.', 'storeengine' ) );
		}

		$term = $attribute->add_term( $payload['name'], [
			'slug'        => $payload['slug'] ?? '',
			'description' => $payload['description'] ?? '',
		] );

		if ( is_wp_error( $term ) ) {
			wp_send_json_error( $term->get_error_message() );
		}

		$this->save_term_swatch_meta( (int) $term['term_id'], $payload );

		wp_send_json_success( $this->format_attribute_term( get_term( (int) $term['term_id'] ) ) );
	}

	/**
	 * Create several terms at once (the "quick add" presets in the term modal).
	 * Terms that already exist are skipped rather than failing the whole batch.
	 *
	 * @param array $payload attribute_id + terms[ { name, slug?, color? } ].
	 */
	public function create_product_attribute_terms( array $payload ) {
		$attribute = Helper::get_product_attribute( $payload['attribute_id'] ?? 0 );

		if ( ! $attribute ) {
			wp_send_json_error( __( 'Invalid Attribute.', 'storeengine' ) );
		}

		$items = json_decode( (string) ( $payload['terms'] ?? '' ), true );
		$items = is_array( $items ) ? array_slice( $items, 0, 100 ) : [];
		if ( ! $items ) {
			wp_send_json_error( __( 'Nothing to add.', 'storeengine' ) );
		}

		$created = [];
		$skipped = [];

		foreach ( $items as $item ) {
			$name = is_array( $item ) ? sanitize_text_field( (string) ( $item['name'] ?? '' ) ) : '';
			if ( '' === $name ) {
				continue;
			}

			$term = $attribute->add_term( $name, [ 'slug' => sanitize_title( (string) ( $item['slug'] ?? '' ) ) ] );

			if ( is_wp_error( $term ) ) {
				$skipped[] = $name;
				continue;
			}

			if ( ! empty( $item['color'] ) ) {
				$this->save_term_swatch_meta( (int) $term['term_id'], [ 'color' => $item['color'] ] );
			}

			$created[] = $this->format_attribute_term( get_term( (int) $term['term_id'] ) );
		}

		wp_send_json_success( [
			'created' => $created,
			'skipped' => $skipped,
		] );
	}

	public function update_product_attribute_term( array $payload ) {
		$attribute = Helper::get_product_attribute( $payload['attribute_id'] );

		if ( ! $attribute ) {
			wp_send_json_error( __( 'Invalid Attribute.', 'storeengine' ) );
		}

		$term = $attribute->update_term( $payload['term_id'], $payload['name'], [
			'slug'        => $payload['slug'],
			'description' => $payload['description'],
		] );

		if ( is_wp_error( $term ) ) {
			wp_send_json_error( $term->get_error_message() );
		}

		$this->save_term_swatch_meta( (int) $payload['term_id'], $payload );

		wp_send_json_success( $this->format_attribute_term( get_term( (int) $payload['term_id'] ) ) );
	}

	public function reorder_product_attributes( array $payload ) {
		$ids = array_filter( array_map( 'absint', explode( ',', (string) ( $payload['attribute_ids'] ?? '' ) ) ) );
		if ( count( $ids ) < 2 ) {
			wp_send_json_error( __( 'Nothing to reorder.', 'storeengine' ) );
		}

		if ( ! ( new \StoreEngine\Classes\Attributes() )->reorder( $ids ) ) {
			wp_send_json_error( __( 'Attribute order is not available yet. Reload the page and try again.', 'storeengine' ) );
		}

		wp_send_json_success();
	}

	public function reorder_product_attribute_terms( array $payload ) {
		$attribute = Helper::get_product_attribute( $payload['attribute_id'] ?? 0 );

		if ( ! $attribute ) {
			wp_send_json_error( __( 'Invalid Attribute.', 'storeengine' ) );
		}

		$term_ids = array_filter( array_map( 'absint', explode( ',', (string) ( $payload['term_ids'] ?? '' ) ) ) );
		if ( ! $term_ids ) {
			wp_send_json_error( __( 'Nothing to reorder.', 'storeengine' ) );
		}

		$attribute->reorder_terms( $term_ids );

		wp_send_json_success( array_map( [ $this, 'format_attribute_term' ], $attribute->get_terms() ) );
	}

	public function delete_product_attribute_term( array $payload ) {
		$attribute = Helper::get_product_attribute( $payload['attribute_id'] );

		if ( ! $attribute ) {
			wp_send_json_error( __( 'Invalid Attribute.', 'storeengine' ) );
		}

		if ( empty( $payload['force'] ) && $attribute->get_usage( absint( $payload['term_id'] ?? 0 ), 0 )['in_use'] ) {
			wp_send_json_error( __( 'This term is used by products. Review what will be removed, then confirm the delete.', 'storeengine' ) );
		}

		$result = $attribute->delete_term( absint( $payload['term_id'] ?? 0 ) );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( $result->get_error_message() );
		}

		wp_send_json_success( __( 'Term deleted', 'storeengine' ) );
	}

	/**
	 * Meta key holding an attribute term's swatch color value.
	 */
	const TERM_COLOR_META = '_storeengine_swatch_color';

	/**
	 * Meta key holding an attribute term's swatch image attachment id.
	 */
	const TERM_IMAGE_META = '_storeengine_swatch_image';

	/**
	 * Restrict the attribute display type to the values the UI supports.
	 *
	 * @param string $type Raw type from the request.
	 *
	 * @return string One of select|color|image.
	 */
	private function sanitize_attribute_type( string $type ): string {
		$type = sanitize_key( $type );

		return in_array( $type, [ 'select', 'color', 'image' ], true ) ? $type : 'select';
	}

	/**
	 * Persist (or clear) the color / image swatch meta for a term.
	 *
	 * Only keys present in the payload are touched, so partial updates are safe.
	 *
	 * @param int   $term_id Term id.
	 * @param array $payload Request payload.
	 */
	private function save_term_swatch_meta( int $term_id, array $payload ): void {
		if ( ! $term_id ) {
			return;
		}

		if ( array_key_exists( 'color', $payload ) ) {
			$color = sanitize_text_field( $payload['color'] );
			if ( '' === $color ) {
				delete_term_meta( $term_id, self::TERM_COLOR_META );
			} else {
				update_term_meta( $term_id, self::TERM_COLOR_META, $color );
			}
		}

		if ( array_key_exists( 'image_id', $payload ) ) {
			$image_id = absint( $payload['image_id'] );
			if ( ! $image_id ) {
				delete_term_meta( $term_id, self::TERM_IMAGE_META );
			} else {
				update_term_meta( $term_id, self::TERM_IMAGE_META, $image_id );
			}
		}
	}

	/**
	 * Normalize a term into the array shape the admin app consumes, with the
	 * swatch color / image meta attached.
	 *
	 * @param \WP_Term|int $term Term object or id.
	 *
	 * @return array
	 */
	public function format_attribute_term( $term ): array {
		if ( is_numeric( $term ) ) {
			$term = get_term( (int) $term );
		}

		if ( ! $term || is_wp_error( $term ) ) {
			return [];
		}

		$data     = (array) $term;
		$image_id = (int) get_term_meta( $term->term_id, self::TERM_IMAGE_META, true );

		$data['color']    = (string) get_term_meta( $term->term_id, self::TERM_COLOR_META, true );
		$data['image_id'] = $image_id;
		$data['image']    = $image_id ? ( wp_get_attachment_image_url( $image_id, 'thumbnail' ) ?: '' ) : '';

		return $data;
	}
}
