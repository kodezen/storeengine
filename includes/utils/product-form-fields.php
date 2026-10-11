<?php
/**
 * Product form fields helper.
 *
 * Single source of truth for the product editor's configurable fields. An admin
 * can, per field, hide it, make it required, or give it a default value so a
 * non-technical team only sees a very simple form. Modelled on CheckoutFields.
 *
 *   $fields = ProductFormFields::all();                 // every section/field, resolved
 *   $config = ProductFormFields::editor_config();       // what the React editor receives
 *   $result = ProductFormFields::sanitize( $input );    // validate config before saving
 *
 * Only *overrides* are stored (setting `product_form`), so an empty config means
 * every field is visible, optional and without a default: the editor behaves
 * exactly as before.
 */

namespace StoreEngine\Utils;

use WP_User;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ProductFormFields {

	const SETTING = 'product_form';

	/**
	 * Per-request cache of the resolved list. Flushed after a settings save.
	 *
	 * @var array|null
	 */
	protected static $resolved = null;

	/**
	 * Schema of every configurable section and field.
	 *
	 * Each entry:
	 *   - kind                         'section' | 'field'
	 *   - section                      (field) id of the section it belongs to
	 *   - label                        translated label
	 *   - path                         (field) Formik path in the editor / request path on the server
	 *   - type                         text | textarea | number | toggle | select | terms | media
	 *   - options                      (select) value => label
	 *   - supports                     which controls apply: hide, required, default
	 *   - system                       true = always visible and required (e.g. the title)
	 *   - requires_default_when_hidden other parts of the form depend on it, so hiding it needs a default
	 *   - server                       false = saved by a separate request, so it can only be enforced in the editor
	 *   - addon                        add-on slug that must be active for the field to exist
	 *
	 * @return array<string,array>
	 */
	public static function schema(): array {
		$schema = [
			// ---- Sections (hide only) ---------------------------------------
			'variants'          => [ 'kind' => 'section', 'label' => __( 'Variants', 'storeengine' ), 'supports' => [ 'hide' ] ],
			'inventory'         => [ 'kind' => 'section', 'label' => __( 'Inventory & stock', 'storeengine' ), 'supports' => [ 'hide' ] ],
			'shipping'          => [ 'kind' => 'section', 'label' => __( 'Shipping & delivery', 'storeengine' ), 'supports' => [ 'hide' ] ],
			'linked_products'   => [ 'kind' => 'section', 'label' => __( 'Linked products', 'storeengine' ), 'supports' => [ 'hide' ] ],
			'purchase_redirect' => [ 'kind' => 'section', 'label' => __( 'Purchase redirect', 'storeengine' ), 'supports' => [ 'hide' ] ],
			'faq'               => [ 'kind' => 'section', 'label' => __( 'FAQ', 'storeengine' ), 'supports' => [ 'hide' ] ],
			'integration'       => [ 'kind' => 'section', 'label' => __( 'Integrations', 'storeengine' ), 'supports' => [ 'hide' ] ],
			'seo'               => [ 'kind' => 'section', 'label' => __( 'SEO', 'storeengine' ), 'supports' => [ 'hide' ], 'addon' => 'seo' ],
			'grundpreis'        => [ 'kind' => 'section', 'label' => __( 'Unit price (Grundpreis)', 'storeengine' ), 'supports' => [ 'hide' ], 'addon' => 'eu-compliance' ],
			'addons'            => [ 'kind' => 'section', 'label' => __( 'Add-on panels', 'storeengine' ), 'supports' => [ 'hide' ] ],
			'media'             => [ 'kind' => 'section', 'label' => __( 'Images & gallery', 'storeengine' ), 'supports' => [ 'hide' ] ],

			// ---- Details ----------------------------------------------------
			'title'             => [ 'kind' => 'field', 'section' => 'details', 'label' => __( 'Product title', 'storeengine' ), 'path' => 'title', 'type' => 'text', 'supports' => [], 'system' => true ],
			'content'           => [ 'kind' => 'field', 'section' => 'details', 'label' => __( 'Description', 'storeengine' ), 'path' => 'content', 'type' => 'textarea', 'supports' => [ 'hide', 'required', 'default' ] ],
			'excerpt'           => [ 'kind' => 'field', 'section' => 'details', 'label' => __( 'Short description', 'storeengine' ), 'path' => 'excerpt', 'type' => 'textarea', 'supports' => [ 'hide', 'required', 'default' ] ],

			// ---- Pricing (saved by the price endpoint, so editor-only) -------
			'price'             => [ 'kind' => 'field', 'section' => 'pricing', 'label' => __( 'Price', 'storeengine' ), 'path' => '_simple_price', 'type' => 'number', 'supports' => [ 'hide', 'required', 'default' ], 'requires_default_when_hidden' => true, 'server' => false ],
			'compare_price'     => [ 'kind' => 'field', 'section' => 'pricing', 'label' => __( 'Compare-at price', 'storeengine' ), 'path' => '_simple_compare_price', 'type' => 'number', 'supports' => [ 'hide', 'required', 'default' ], 'server' => false ],

			// ---- Inventory --------------------------------------------------
			'sku'               => [ 'kind' => 'field', 'section' => 'inventory', 'label' => __( 'SKU', 'storeengine' ), 'path' => 'sku', 'type' => 'text', 'supports' => [ 'hide', 'required', 'default' ] ],
			'barcode'           => [ 'kind' => 'field', 'section' => 'inventory', 'label' => __( 'Barcode', 'storeengine' ), 'path' => 'barcode', 'type' => 'text', 'supports' => [ 'hide', 'required', 'default' ] ],
			'manage_stock'      => [ 'kind' => 'field', 'section' => 'inventory', 'label' => __( 'Track stock', 'storeengine' ), 'path' => 'stock.manages_stock', 'type' => 'toggle', 'supports' => [ 'hide', 'default' ] ],
			'stock_quantity'    => [ 'kind' => 'field', 'section' => 'inventory', 'label' => __( 'Stock quantity', 'storeengine' ), 'path' => 'stock.stock_quantity', 'type' => 'number', 'supports' => [ 'hide', 'required', 'default' ] ],
			'sold_individually' => [ 'kind' => 'field', 'section' => 'inventory', 'label' => __( 'Sold individually', 'storeengine' ), 'path' => 'stock.sold_individually', 'type' => 'toggle', 'supports' => [ 'hide', 'default' ] ],
			'cost_price'        => [ 'kind' => 'field', 'section' => 'inventory', 'label' => __( 'Cost per unit', 'storeengine' ), 'path' => 'meta._storeengine_cost_price', 'type' => 'number', 'supports' => [ 'hide', 'required', 'default' ], 'addon' => 'cost-profit' ],

			// ---- Shipping ---------------------------------------------------
			'shipping_type'     => [
				'kind'                         => 'field',
				'section'                      => 'shipping',
				'label'                        => __( 'Product type (physical / digital)', 'storeengine' ),
				'path'                         => 'meta._storeengine_product_shipping_type',
				'type'                         => 'select',
				'options'                      => [
					'physical' => __( 'Physical product', 'storeengine' ),
					'digital'  => __( 'Digital product', 'storeengine' ),
				],
				// Two big radio cards with their own sub-fields, so it can't be hidden on its
				// own: give it a default and hide the whole Shipping section instead.
				'supports'                     => [ 'default' ],
				'requires_default_when_hidden' => true,
			],
			'weight'            => [ 'kind' => 'field', 'section' => 'shipping', 'label' => __( 'Weight', 'storeengine' ), 'path' => 'meta._storeengine_product_physical_weight', 'type' => 'number', 'supports' => [ 'hide', 'required', 'default' ] ],

			// ---- Organize ---------------------------------------------------
			'categories'        => [ 'kind' => 'field', 'section' => 'organize', 'label' => __( 'Categories', 'storeengine' ), 'path' => 'storeengine_product_category', 'type' => 'terms', 'supports' => [ 'hide', 'required', 'default' ] ],
			'tags'              => [ 'kind' => 'field', 'section' => 'organize', 'label' => __( 'Tags', 'storeengine' ), 'path' => 'storeengine_product_tag', 'type' => 'terms', 'supports' => [ 'hide', 'required', 'default' ] ],
			'brands'            => [ 'kind' => 'field', 'section' => 'organize', 'label' => __( 'Brands', 'storeengine' ), 'path' => 'storeengine_product_brand', 'type' => 'terms', 'supports' => [ 'hide', 'required', 'default' ], 'addon' => 'brand' ],

			// ---- Publishing -------------------------------------------------
			'status'            => [
				'kind'     => 'field',
				'section'  => 'publishing',
				'label'    => __( 'Status', 'storeengine' ),
				'path'     => 'status',
				'type'     => 'select',
				'options'  => [
					'draft'   => __( 'Draft', 'storeengine' ),
					'publish' => __( 'Published', 'storeengine' ),
					'pending' => __( 'Pending review', 'storeengine' ),
				],
				'supports' => [ 'default' ],
			],
			'hide_from_shop'    => [ 'kind' => 'field', 'section' => 'publishing', 'label' => __( 'Hide from shop', 'storeengine' ), 'path' => 'meta._storeengine_product_hide', 'type' => 'toggle', 'supports' => [ 'hide', 'default' ] ],
			'slug'              => [ 'kind' => 'field', 'section' => 'publishing', 'label' => __( 'URL slug', 'storeengine' ), 'path' => 'slug', 'type' => 'text', 'supports' => [ 'hide' ] ],

			// ---- Images -----------------------------------------------------
			// The gallery is one unified block (the first image is the featured image), so
			// the whole Images section hides together; the featured image can only be required.
			'featured_image'    => [ 'kind' => 'field', 'section' => 'media', 'label' => __( 'Featured image', 'storeengine' ), 'path' => 'featured_media', 'type' => 'media', 'supports' => [ 'required' ] ],
		];

		/**
		 * Filter the configurable product form schema. Add-ons register their own
		 * fields here (same shape as above) so they show up in the settings screen.
		 *
		 * @param array $schema
		 */
		$schema = (array) apply_filters( 'storeengine/product_form/fields_schema', $schema );

		// Drop fields that belong to an add-on that isn't active.
		foreach ( $schema as $id => $entry ) {
			if ( ! empty( $entry['addon'] ) && ! Helper::get_addon_active_status( $entry['addon'], in_array( $entry['addon'], Helper::get_pro_exclusive_addons(), true ) ) ) {
				unset( $schema[ $id ] );
			}
		}

		return $schema;
	}

	/**
	 * Section labels used to group fields in the settings screen.
	 *
	 * @return array<string,string>
	 */
	public static function section_labels(): array {
		return [
			'details'    => __( 'Details', 'storeengine' ),
			'pricing'    => __( 'Pricing', 'storeengine' ),
			'inventory'  => __( 'Inventory & stock', 'storeengine' ),
			'shipping'   => __( 'Shipping & delivery', 'storeengine' ),
			'media'      => __( 'Images', 'storeengine' ),
			'organize'   => __( 'Organize', 'storeengine' ),
			'publishing' => __( 'Publishing', 'storeengine' ),
		];
	}

	/**
	 * Saved overrides, normalised to [ 'fields' => array ].
	 */
	public static function saved(): array {
		$saved = Helper::get_settings( self::SETTING, [] );
		// Settings can come back as objects when the blob is decoded without assoc.
		$saved = json_decode( wp_json_encode( $saved ), true );
		$saved = is_array( $saved ) ? $saved : [];

		return [
			'fields' => isset( $saved['fields'] ) && is_array( $saved['fields'] ) ? $saved['fields'] : [],
		];
	}

	/**
	 * Resolved list: schema entry + effective hidden / required / default.
	 *
	 * @return array<string,array>
	 */
	public static function all(): array {
		if ( null !== self::$resolved ) {
			return self::$resolved;
		}

		$schema = self::schema();
		$saved  = self::saved()['fields'];
		$rows   = [];

		foreach ( $schema as $id => $entry ) {
			$override = is_array( $saved[ $id ] ?? null ) ? $saved[ $id ] : [];
			$supports = (array) ( $entry['supports'] ?? [] );
			$system   = ! empty( $entry['system'] );

			$hidden   = ! $system && in_array( 'hide', $supports, true ) && self::to_bool( $override['hidden'] ?? false );
			$required = $system || ( in_array( 'required', $supports, true ) && self::to_bool( $override['required'] ?? false ) );
			$default  = null;
			if ( in_array( 'default', $supports, true ) && array_key_exists( 'default', $override ) ) {
				$default = self::clean_value( $override['default'], $entry );
			}

			$rows[ $id ] = $entry + [
				'id'                           => $id,
				'section'                      => $entry['section'] ?? $id,
				'supports'                     => $supports,
				'system'                       => $system,
				'requires_default_when_hidden' => ! empty( $entry['requires_default_when_hidden'] ),
				'server'                       => ! isset( $entry['server'] ) || (bool) $entry['server'],
			];
			$rows[ $id ]['hidden']   = $hidden;
			$rows[ $id ]['required'] = $required;
			$rows[ $id ]['default']  = $default;
		}

		// A field inside a hidden section is hidden too.
		foreach ( $rows as $id => $row ) {
			$section_hidden = 'field' === $row['kind']
				&& isset( $rows[ $row['section'] ] )
				&& 'section' === $rows[ $row['section'] ]['kind']
				&& $rows[ $row['section'] ]['hidden'];

			$rows[ $id ]['hidden_effective'] = $row['hidden'] || $section_hidden;
		}

		self::$resolved = $rows;

		return $rows;
	}

	/**
	 * Drop the per-request cache (after the setting changes, and in tests).
	 */
	public static function flush(): void {
		self::$resolved = null;
	}

	/**
	 * Whether any override is configured. Everything else short-circuits on this,
	 * so a store that never touches the feature pays nothing.
	 */
	public static function is_active(): bool {
		return ! empty( self::saved()['fields'] );
	}

	/**
	 * Full admins always see the whole form so nobody can lock themselves out.
	 * Shop managers, staff and vendors get the configured form.
	 */
	public static function is_subject_to_config( ?WP_User $user = null ): bool {
		$user = $user ?: wp_get_current_user();

		if ( ! $user || ! $user->ID ) {
			return false;
		}

		$subject = ! user_can( $user, 'manage_options' );

		/**
		 * Filter whether a user is restricted to the configured product form.
		 *
		 * @param bool    $subject
		 * @param WP_User $user
		 */
		return (bool) apply_filters( 'storeengine/product_form/is_subject', $subject, $user );
	}

	/**
	 * What the React product editor receives. Only entries that change behaviour
	 * are included (keeps the payload tiny). Null when the user isn't restricted.
	 *
	 * @return array|null
	 */
	public static function editor_config( ?WP_User $user = null ): ?array {
		if ( ! self::is_active() || ! self::is_subject_to_config( $user ) ) {
			return null;
		}

		$sections = [];
		$fields   = [];

		foreach ( self::all() as $id => $row ) {
			if ( 'section' === $row['kind'] ) {
				if ( $row['hidden'] ) {
					$sections[] = $id;
				}
				continue;
			}

			if ( ! $row['hidden_effective'] && ! $row['required'] && null === $row['default'] ) {
				continue;
			}

			$fields[ $id ] = [
				'path'     => $row['path'],
				'type'     => $row['type'],
				'label'    => $row['label'],
				'section'  => $row['section'],
				'hidden'   => $row['hidden_effective'],
				'required' => $row['required'],
				'default'  => $row['default'],
			];
		}

		return [
			'sections' => $sections,
			'fields'   => (object) $fields,
		];
	}

	/**
	 * Validate a config from the settings screen.
	 *
	 * @param mixed $input Raw `product_form` value.
	 * @return array{config:array,errors:string[]} Clean config plus human-readable problems.
	 */
	public static function sanitize( $input ): array {
		$schema = self::schema();
		$input  = json_decode( wp_json_encode( $input ), true );
		$input  = is_array( $input ) ? $input : [];
		$rows   = is_array( $input['fields'] ?? null ) ? $input['fields'] : [];
		$clean  = [];
		$errors = [];

		foreach ( $rows as $id => $row ) {
			$id = sanitize_key( (string) $id );
			if ( ! isset( $schema[ $id ] ) || ! is_array( $row ) || ! empty( $schema[ $id ]['system'] ) ) {
				continue;
			}

			$entry    = $schema[ $id ];
			$supports = (array) ( $entry['supports'] ?? [] );
			$item     = [];

			if ( in_array( 'hide', $supports, true ) && self::to_bool( $row['hidden'] ?? false ) ) {
				$item['hidden'] = true;
			}
			if ( in_array( 'required', $supports, true ) && self::to_bool( $row['required'] ?? false ) ) {
				$item['required'] = true;
			}
			if ( in_array( 'default', $supports, true ) && array_key_exists( 'default', $row ) ) {
				$default = self::clean_value( $row['default'], $entry );
				if ( null !== $default ) {
					$item['default'] = $default;
				}
			}

			if ( $item ) {
				$clean[ $id ] = $item;
			}
		}

		// Cross-checks on the cleaned config.
		$section_hidden = static function ( string $section ) use ( $clean, $schema ): bool {
			return isset( $schema[ $section ] ) && 'section' === ( $schema[ $section ]['kind'] ?? '' ) && ! empty( $clean[ $section ]['hidden'] );
		};

		// Walk every field (not only those with overrides): a required field can be
		// stranded by hiding its whole section even if the field itself is untouched.
		foreach ( $schema as $id => $entry ) {
			if ( 'field' !== ( $entry['kind'] ?? '' ) ) {
				continue;
			}

			$item        = $clean[ $id ] ?? [];
			$own_hidden  = ! empty( $item['hidden'] );
			$hidden      = $own_hidden || $section_hidden( (string) ( $entry['section'] ?? '' ) );
			$has_default = array_key_exists( 'default', $item );

			if ( ! $hidden || $has_default ) {
				continue;
			}

			if ( ! empty( $item['required'] ) ) {
				$errors[] = $own_hidden
					/* translators: %s: field label */
					? sprintf( __( '"%s" is hidden and required, so it needs a default value.', 'storeengine' ), $entry['label'] )
					/* translators: 1: field label, 2: section label */
					: sprintf(
						in_array( 'default', (array) ( $entry['supports'] ?? [] ), true )
							/* translators: 1: field label, 2: section label */
							? __( '"%1$s" is required but its section "%2$s" is hidden, so it needs a default value.', 'storeengine' )
							/* translators: 1: field label, 2: section label */
							: __( '"%1$s" is required but its section "%2$s" is hidden. Show the section or turn off Required.', 'storeengine' ),
						$entry['label'],
						$schema[ $entry['section'] ]['label']
					);
			} elseif ( ! empty( $entry['requires_default_when_hidden'] ) ) {
				/* translators: %s: field label */
				$errors[] = sprintf( __( '"%s" is needed by other parts of the form, so hiding it requires a default value.', 'storeengine' ), $entry['label'] );
			}
		}

		return [
			'config' => [
				'fields' => $clean,
			],
			'errors' => array_values( array_unique( $errors ) ),
		];
	}

	/**
	 * Read a dotted path (`meta.foo`, `stock.manages_stock`) from a request payload.
	 *
	 * @param array  $data Decoded request params.
	 * @param string $path Dotted path.
	 * @return mixed|null
	 */
	public static function get_path_value( array $data, string $path ) {
		$cursor = $data;
		foreach ( explode( '.', $path ) as $segment ) {
			if ( is_array( $cursor ) && array_key_exists( $segment, $cursor ) ) {
				$cursor = $cursor[ $segment ];
			} else {
				return null;
			}
		}

		// Core wraps some fields as { raw, rendered }.
		if ( is_array( $cursor ) && array_key_exists( 'raw', $cursor ) ) {
			return $cursor['raw'];
		}

		return $cursor;
	}

	/**
	 * Whether the path exists in the payload at all (distinguishes "not sent"
	 * from "sent empty").
	 */
	public static function has_path( array $data, string $path ): bool {
		$cursor = $data;
		foreach ( explode( '.', $path ) as $segment ) {
			if ( is_array( $cursor ) && array_key_exists( $segment, $cursor ) ) {
				$cursor = $cursor[ $segment ];
			} else {
				return false;
			}
		}

		return true;
	}

	/**
	 * Whether a submitted value counts as "empty" for its field type.
	 *
	 * @param mixed $value Submitted value.
	 * @param array $entry Schema entry.
	 */
	public static function is_empty_value( $value, array $entry ): bool {
		switch ( $entry['type'] ?? 'text' ) {
			case 'terms':
				return empty( array_filter( (array) $value ) );
			case 'media':
				return empty( $value ) || ( is_array( $value ) && empty( array_filter( $value ) ) );
			case 'number':
				return null === $value || '' === $value || ! is_numeric( $value );
			case 'toggle':
				return null === $value;
			default:
				return null === $value || '' === trim( (string) ( is_array( $value ) ? '' : $value ) );
		}
	}

	/**
	 * Sanitise a default value for its field type. Null = "no default".
	 *
	 * @param mixed $value Raw value.
	 * @param array $entry Schema entry.
	 * @return mixed|null
	 */
	public static function clean_value( $value, array $entry ) {
		switch ( $entry['type'] ?? 'text' ) {
			case 'terms':
				$ids = array_values( array_filter( array_map( 'absint', (array) $value ) ) );
				return $ids ?: null;
			case 'media':
				$id = is_array( $value ) ? 0 : absint( $value );
				return $id ?: null;
			case 'number':
				return ( '' === $value || null === $value || ! is_numeric( $value ) ) ? null : 0 + $value;
			case 'toggle':
				return null === $value || '' === $value ? null : self::to_bool( $value );
			case 'select':
				$value = is_scalar( $value ) ? (string) $value : '';
				return isset( $entry['options'][ $value ] ) ? $value : null;
			case 'textarea':
				$value = is_scalar( $value ) ? sanitize_textarea_field( (string) $value ) : '';
				return '' === $value ? null : $value;
			default:
				$value = is_scalar( $value ) ? sanitize_text_field( (string) $value ) : '';
				return '' === $value ? null : $value;
		}
	}

	/**
	 * Tolerant boolean coercer: form-encoded payloads send `false` as "false".
	 *
	 * @param mixed $value Raw value.
	 */
	public static function to_bool( $value ): bool {
		if ( is_string( $value ) ) {
			return ! in_array( strtolower( trim( $value ) ), [ '', '0', 'false', 'no', 'off' ], true );
		}

		return (bool) $value;
	}
}
