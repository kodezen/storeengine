<?php

namespace StoreEngine\Classes;

use StoreEngine\Classes\Exceptions\StoreEngineException;
use StoreEngine\Database;
use StoreEngine\Utils\Formatting;
use StoreEngine\Utils\Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Attribute {

	protected int $id;
	protected string $table;

	protected array $data     = [
		'attribute_name'    => '',
		'attribute_label'   => '',
		'attribute_type'    => 'select',
		'attribute_orderby' => '',
		'attribute_public'  => 0,
	];
	protected array $new_data = [];

	public const CACHE_KEY   = 'storeengine_attribute_';
	public const CACHE_GROUP = 'storeengine_attributes';

	/**
	 * Term meta key holding a term's position for the 'custom-ordering' sort.
	 */
	public const TERM_ORDER_META = '_storeengine_term_order';

	/**
	 * Version token baked into list/name/count cache keys.
	 *
	 * Bumping it invalidates those entries on every cache backend. Relying only
	 * on wp_cache_flush_group() leaves them stale on persistent object caches
	 * that don't support group flushing, so new attributes never register their
	 * taxonomy and deleted ones linger in the list.
	 */
	public static function get_cache_version(): string {
		$version = wp_cache_get( 'last_changed', self::CACHE_GROUP );
		if ( ! $version ) {
			$version = (string) microtime( true );
			wp_cache_set( 'last_changed', $version, self::CACHE_GROUP );
		}

		return (string) $version;
	}

	/**
	 * Whether the attribute_order column exists (added by a migration).
	 */
	public static function has_order_column(): bool {
		return (bool) get_option( 'storeengine_attribute_order_column' );
	}

	/**
	 * ORDER BY for attribute lists: manual order first, then newest, which is
	 * the order the list had before it could be sorted.
	 */
	public static function order_by_sql(): string {
		return self::has_order_column() ? 'attribute_order ASC, attribute_id DESC' : 'attribute_id DESC';
	}

	public static function bump_cache_version(): void {
		wp_cache_set( 'last_changed', (string) microtime( true ), self::CACHE_GROUP );
	}

	/**
	 * Whether another attribute row already uses this slug. Reads the table
	 * directly (no cache) so a stale object cache can't let duplicates through.
	 */
	public static function name_exists( string $name, int $exclude_id = 0 ): bool {
		global $wpdb;
		$table = $wpdb->prefix . Helper::DB_PREFIX . 'attribute_taxonomies';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return (bool) $wpdb->get_var( $wpdb->prepare( "SELECT attribute_id FROM $table WHERE attribute_name = %s AND attribute_id != %d LIMIT 1", $name, $exclude_id ) );
	}

	public function __construct( int $id = 0 ) {
		global $wpdb;
		$this->id    = $id;
		$this->table = $wpdb->prefix . Helper::DB_PREFIX . 'attribute_taxonomies';
	}

	public function get() {
		global $wpdb;

		$has_cache = wp_cache_get( self::CACHE_KEY . $this->get_id(), self::CACHE_GROUP );
		if ( $has_cache ) {
			return $this->set_data( $has_cache );
		}

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->get_row( $wpdb->prepare(
			"SELECT * FROM $this->table WHERE attribute_id = %d", $this->get_id()
		) );
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery

		if ( ! $result ) {
			return false;
		}
		wp_cache_set( self::CACHE_KEY . $this->get_id(), $result, self::CACHE_GROUP );

		return $this->set_data( $result );
	}

	public function set_data( $data ): Attribute {
		$this->id                        = $data->attribute_id;
		$this->data['attribute_name']    = $data->attribute_name;
		$this->data['attribute_label']   = $data->attribute_label;
		$this->data['attribute_type']    = $data->attribute_type;
		$this->data['attribute_orderby'] = $data->attribute_orderby;
		$this->data['attribute_public']  = $data->attribute_public;

		return $this;
	}

	public function save() {
		global $wpdb;
		$data      = array_merge( $this->data, $this->new_data );
		$formatter = [ '%s', '%s', '%s', '%s', '%d' ];

		$taxonomy = Database::register_attribute_taxonomy( $this->get_name(), $this->get_label(), $this->is_public() );

		// Early bail if taxonomy can't be registered.
		if ( is_wp_error( $taxonomy ) ) {
			throw StoreEngineException::from_wp_error( $taxonomy ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery
		if ( 0 === $this->get_id() ) {
			$saved = $wpdb->insert( $this->table, $data, $formatter );
			if ( false === $saved || ! $wpdb->insert_id ) {
				throw new StoreEngineException( __( 'Could not save the attribute. Please check the database table structure.', 'storeengine' ), 'attribute-save-failed', $wpdb->last_error ? [ 'db_error' => $wpdb->last_error ] : [], 500 ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
			}
			$this->id = $wpdb->insert_id;

			// A new attribute goes to the top of the list, where it has always
			// appeared. Kept out of $data so saves never touch the order.
			if ( self::has_order_column() ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$min = (int) $wpdb->get_var( $wpdb->prepare( "SELECT MIN(attribute_order) FROM {$this->table} WHERE attribute_id != %d", $this->id ) );
				$wpdb->update( $this->table, [ 'attribute_order' => $min - 1 ], [ 'attribute_id' => $this->id ], [ '%d' ], [ '%d' ] );
			}
		} else {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching
			$saved = $wpdb->update( $this->table, $data, [ 'attribute_id' => $this->get_id() ], $formatter, [ '%d' ] );
			if ( false === $saved ) {
				throw new StoreEngineException( __( 'Could not update the attribute.', 'storeengine' ), 'attribute-update-failed', $wpdb->last_error ? [ 'db_error' => $wpdb->last_error ] : [], 500 ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
			}
			wp_cache_delete( self::CACHE_KEY . $this->id, self::CACHE_GROUP );
		}
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
		self::bump_cache_version();
		wp_cache_flush_group( self::CACHE_GROUP );
		\StoreEngine\Classes\AbstractProduct::flush_cache();
		wp_cache_flush_group( $taxonomy->name . '_relationships' );
		wp_cache_set_terms_last_changed();
	}

	public function delete(): bool {
		if ( 0 === $this->get_id() ) {
			return false;
		}

		$taxonomy = $this->get_taxonomy_name();
		// Duplicate rows can share one taxonomy; only wipe its terms when this is the last row using it.
		$terms         = self::name_exists( $this->get_name(), $this->get_id() ) ? [] : $this->get_terms();
		$deleted_terms = [];
		foreach ( $terms as $term ) {
			$result = wp_delete_term( $term->term_id, $taxonomy );
			if ( ! is_wp_error( $result ) ) {
				$deleted_terms[] = $term->term_id;
			}
		}

		global $wpdb;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
		if ( ! empty( $deleted_terms ) ) {
			$deleted_terms_placeholders = implode( ',', array_fill( 0, count( $deleted_terms ), '%d' ) );
			$variation_ids              = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT variation_id FROM {$wpdb->prefix}storeengine_variation_term_relations WHERE term_id in ($deleted_terms_placeholders)",
					...$deleted_terms
				)
			);

			$this->delete_variation( array_map( fn( $v ) => $v->variation_id, $variation_ids ) );

			$wpdb->query(
				$wpdb->prepare(
					"DELETE FROM {$wpdb->prefix}storeengine_variation_term_relations WHERE term_id in ($deleted_terms_placeholders)",
					...$deleted_terms,
				)
			);
		}


		if ( ! self::name_exists( $this->get_name(), $this->get_id() ) ) {
			$this->forget_in_products( $taxonomy );
		}

		$res = $wpdb->delete( $this->table, [ 'attribute_id' => $this->id ], [ '%d' ] );
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare

		if ( ! $res ) {
			return false;
		}

		wp_cache_delete( self::CACHE_KEY . $this->id, self::CACHE_GROUP );
		self::bump_cache_version();
		wp_cache_flush_group( self::CACHE_GROUP );
		\StoreEngine\Classes\AbstractProduct::flush_cache();

		return true;
	}

	public function get_id(): int {
		return $this->id;
	}

	public function get_name() {
		return $this->get_prop( 'attribute_name' );
	}

	public function get_taxonomy_name(): string {
		return Helper::get_attribute_taxonomy_name( $this->get_name() );
	}

	public function get_label() {
		return $this->get_prop( 'attribute_label' );
	}

	public function get_type() {
		return $this->get_prop( 'attribute_type' );
	}

	public function get_orderby() {
		return $this->get_prop( 'attribute_orderby' );
	}

	public function get_terms( $args = [] ) {
		// A caller-supplied orderby wins; otherwise apply the attribute's own
		// sort setting. 'custom-ordering' and 'numeric-name' aren't WP_Term_Query
		// orderby values, so fetch by name and sort the result here.
		$sort = isset( $args['orderby'] ) ? '' : (string) $this->get_orderby();
		$args = wp_parse_args( $args, [
			'taxonomy'   => $this->get_taxonomy_name(),
			'hide_empty' => false,
			'orderby'    => 'term_id' === $sort ? 'term_id' : 'name',
		] );

		$terms = get_terms( $args );

		if ( is_wp_error( $terms ) ) {
			return [];
		}

		if ( ! in_array( $sort, [ 'custom-ordering', 'numeric-name' ], true ) || ! $terms || ! ( reset( $terms ) instanceof \WP_Term ) ) {
			return $terms;
		}

		if ( 'numeric-name' === $sort ) {
			usort( $terms, fn( $a, $b ) => strnatcasecmp( $a->name, $b->name ) );

			return $terms;
		}

		// Custom ordering: terms carry a position in term meta; ones never
		// sorted yet keep their name order after the positioned ones.
		$position = [];
		foreach ( $terms as $index => $term ) {
			$order                      = get_term_meta( $term->term_id, self::TERM_ORDER_META, true );
			$position[ $term->term_id ] = [ '' === $order ? PHP_INT_MAX : (int) $order, $index ];
		}
		usort( $terms, fn( $a, $b ) => $position[ $a->term_id ] <=> $position[ $b->term_id ] );

		return $terms;
	}

	/**
	 * Persist a custom term order (drag-and-drop in the Attributes screen).
	 *
	 * @param int[] $term_ids Term IDs in their new order. IDs that don't
	 *                        belong to this attribute are ignored.
	 *
	 * @return int Number of terms positioned.
	 */
	public function reorder_terms( array $term_ids ): int {
		$taxonomy = $this->get_taxonomy_name();
		$position = 0;

		foreach ( array_unique( array_map( 'absint', $term_ids ) ) as $term_id ) {
			$term = get_term( $term_id, $taxonomy );
			if ( ! $term || is_wp_error( $term ) ) {
				continue;
			}
			update_term_meta( $term_id, self::TERM_ORDER_META, $position++ );
		}

		wp_cache_set_terms_last_changed();

		return $position;
	}

	public function get_count() {
		return wp_count_terms( $this->get_taxonomy_name() );
	}

	public function add_term( string $name, array $args = [] ) {
		$args = wp_parse_args( $args, [
			'slug'        => '',
			'description' => '',
			'parent'      => 0,
		] );

		$result = wp_insert_term( $name, $this->get_taxonomy_name(), $args );

		if ( ! is_wp_error( $result ) && 'custom-ordering' === $this->get_orderby() ) {
			$this->append_to_custom_order( (int) $result['term_id'] );
		}

		return $result;
	}

	/**
	 * Put a new term at the end of the custom order. When some existing terms
	 * were never positioned, position all of them first (once) so the new
	 * term doesn't jump ahead of them.
	 *
	 * @param int $term_id New term ID.
	 */
	protected function append_to_custom_order( int $term_id ): void {
		$terms = $this->get_terms( [ 'exclude' => [ $term_id ] ] );
		$max   = -1;

		foreach ( $terms as $term ) {
			$order = get_term_meta( $term->term_id, self::TERM_ORDER_META, true );
			if ( '' === $order ) {
				$this->reorder_terms( array_merge( wp_list_pluck( $terms, 'term_id' ), [ $term_id ] ) );

				return;
			}
			$max = max( $max, (int) $order );
		}

		update_term_meta( $term_id, self::TERM_ORDER_META, $max + 1 );
	}

	public function update_term( int $term_id, string $name, array $args = [] ) {
		$args = wp_parse_args( $args, [
			'slug'        => '',
			'description' => '',
			'parent'      => 0,
		] );

		return wp_update_term(
			$term_id,
			$this->get_taxonomy_name(),
			[
				'name'        => $name,
				'slug'        => $args['slug'],
				'description' => $args['description'],
				'parent'      => $args['parent'],
			]
		);
	}

	public function delete_term( int $term_id ) {
		global $wpdb;

		$result = wp_delete_term( $term_id, $this->get_taxonomy_name() );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$variation_ids = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT variation_id FROM {$wpdb->prefix}storeengine_variation_term_relations WHERE term_id = %d",
				$term_id
			)
		);

		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->prefix}storeengine_variation_term_relations WHERE term_id = %d",
				$term_id
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$this->delete_variation( array_map( fn( $v ) => $v->variation_id, $variation_ids ) );

		// Cached products still list the deleted variations; the storefront would
		// offer combinations that no longer exist.
		\StoreEngine\Classes\AbstractProduct::flush_cache();

		return true;
	}

	/**
	 * What deleting this attribute, or one of its terms, takes with it.
	 *
	 * Products lose the attribute/term, and every variation built on it is
	 * deleted along with its price, SKU and stock. Past orders keep their line
	 * items but no longer point at a live variation.
	 *
	 * @param int $term_id Term to check; 0 checks the whole attribute.
	 * @param int $limit   How many affected products to list.
	 *
	 * @return array{in_use:bool,terms:int,products:int,variations:int,unsellable:int,orders:int,stock:float,items:array}
	 */
	public function get_usage( int $term_id = 0, int $limit = 8 ): array {
		global $wpdb;

		$usage = [
			'in_use'     => false,
			'terms'      => 0,
			'products'   => 0,
			'variations' => 0,
			'unsellable' => 0,
			'orders'     => 0,
			'stock'      => 0.0,
			'items'      => [],
		];

		$taxonomy = $this->get_taxonomy_name();

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- $in/$vin/$pin are runs of %d, filled by spread arguments.
		if ( $term_id ) {
			$term_ids = term_exists( $term_id, $taxonomy ) ? [ $term_id ] : [];
		} elseif ( self::name_exists( $this->get_name(), $this->get_id() ) ) {
			// Another row shares the taxonomy, so deleting this one removes no terms.
			$term_ids = [];
		} else {
			$term_ids = array_map( 'intval', $wpdb->get_col( $wpdb->prepare( "SELECT term_id FROM {$wpdb->term_taxonomy} WHERE taxonomy = %s", $taxonomy ) ) );
		}

		$usage['terms'] = count( $term_ids );
		if ( ! $term_ids ) {
			return $usage;
		}

		$in = implode( ',', array_fill( 0, count( $term_ids ), '%d' ) );

		$product_ids = array_map( 'intval', $wpdb->get_col( $wpdb->prepare(
			"SELECT DISTINCT tr.object_id FROM {$wpdb->term_relationships} tr
			JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
			JOIN {$wpdb->posts} p ON p.ID = tr.object_id AND p.post_type = 'storeengine_product' AND p.post_status <> 'auto-draft'
			WHERE tt.taxonomy = %s AND tt.term_id IN ($in)",
			$taxonomy,
			...$term_ids
		) ) );

		$variations = $wpdb->get_results( $wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}storeengine_product_variations
			WHERE id IN ( SELECT variation_id FROM {$wpdb->prefix}storeengine_variation_term_relations WHERE term_id IN ($in) )",
			...$term_ids
		) );

		$lost = [];
		foreach ( $variations as $variation ) {
			$lost[ (int) $variation->product_id ] = ( $lost[ (int) $variation->product_id ] ?? 0 ) + 1;
			if ( ! empty( $variation->manage_stock ) && (float) ( $variation->stock_quantity ?? 0 ) > 0 ) {
				$usage['stock'] += (float) $variation->stock_quantity;
			}
		}

		$product_ids = array_values( array_unique( array_merge( $product_ids, array_keys( $lost ) ) ) );

		$usage['products']   = count( $product_ids );
		$usage['variations'] = count( $variations );
		$usage['in_use']     = $usage['products'] > 0;

		if ( ! $product_ids ) {
			return $usage;
		}

		$totals = [];
		if ( $lost ) {
			$vin             = implode( ',', array_fill( 0, count( $variations ), '%d' ) );
			$usage['orders'] = (int) $wpdb->get_var( $wpdb->prepare(
				"SELECT COUNT(DISTINCT order_id) FROM {$wpdb->prefix}storeengine_order_product_lookup WHERE variation_id IN ($vin)",
				...array_map( fn( $v ) => (int) $v->id, $variations )
			) );

			$pin = implode( ',', array_fill( 0, count( $lost ), '%d' ) );
			foreach ( $wpdb->get_results( $wpdb->prepare(
				"SELECT product_id, COUNT(*) AS n FROM {$wpdb->prefix}storeengine_product_variations WHERE product_id IN ($pin) GROUP BY product_id",
				...array_keys( $lost )
			) ) as $row ) {
				$totals[ (int) $row->product_id ] = (int) $row->n;
			}
		}
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber

		foreach ( $lost as $product_id => $n ) {
			if ( $n >= ( $totals[ $product_id ] ?? 0 ) ) {
				++$usage['unsellable'];
			}
		}

		// Worst hit first: products losing every variation, then most variations lost.
		usort( $product_ids, function ( $a, $b ) use ( $lost, $totals ) {
			$a_all = isset( $lost[ $a ] ) && $lost[ $a ] >= ( $totals[ $a ] ?? 0 );
			$b_all = isset( $lost[ $b ] ) && $lost[ $b ] >= ( $totals[ $b ] ?? 0 );

			return [ $b_all, $lost[ $b ] ?? 0 ] <=> [ $a_all, $lost[ $a ] ?? 0 ];
		} );

		foreach ( array_slice( $product_ids, 0, $limit ) as $product_id ) {
			$usage['items'][] = [
				'id'               => $product_id,
				'title'            => html_entity_decode( wp_strip_all_tags( get_the_title( $product_id ) ), ENT_QUOTES, 'UTF-8' ),
				'status'           => get_post_status( $product_id ),
				'edit_url'         => admin_url( 'admin.php?page=storeengine-products&id=' . $product_id . '&action=edit' ),
				'variations_lost'  => $lost[ $product_id ] ?? 0,
				'variations_total' => $totals[ $product_id ] ?? 0,
			];
		}

		return $usage;
	}

	/**
	 * Drop a deleted attribute taxonomy from every product's saved attribute
	 * order, so products don't keep referencing a taxonomy that's gone.
	 */
	protected function forget_in_products( string $taxonomy ): void {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results( $wpdb->prepare(
			"SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_storeengine_product_attributes_order' AND meta_value LIKE %s",
			'%' . $wpdb->esc_like( '"' . $taxonomy . '"' ) . '%'
		) );

		foreach ( $rows as $row ) {
			$order = maybe_unserialize( $row->meta_value );
			if ( is_string( $order ) ) {
				$order = json_decode( $order, true );
			}
			if ( is_array( $order ) ) {
				update_post_meta( (int) $row->post_id, '_storeengine_product_attributes_order', array_values( array_diff( $order, [ $taxonomy ] ) ) );
			}
		}
	}

	public function is_public(): bool {
		return Formatting::string_to_bool( $this->get_prop( 'attribute_public', false ) );
	}

	public function set_name( string $value ) {
		$this->new_data['attribute_name'] = $value;
	}

	public function set_label( string $value ) {
		$this->new_data['attribute_label'] = $value;
	}

	public function set_type( string $value ) {
		$this->new_data['attribute_type'] = $value;
	}

	public function set_orderby( string $value ) {
		$this->new_data['attribute_orderby'] = $value;
	}

	public function set_public( bool $value ) {
		$this->new_data['attribute_public'] = $value;
	}

	protected function get_prop( string $name, $default = '' ) {
		if ( array_key_exists( $name, $this->new_data ) ) {
			return $this->new_data[ $name ];
		}

		return $this->data[ $name ] ?? $default;
	}

	/**
	 * @param array $variation_ids
	 *
	 * @return void
	 */
	private function delete_variation( array $variation_ids ): void {
		global $wpdb;

		if ( empty( $variation_ids ) ) {
			return;
		}

		$variation_ids_placeholders = implode( ',', array_fill( 0, count( $variation_ids ), '%d' ) );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- Query prepared.
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->prefix}storeengine_product_variations WHERE id in ($variation_ids_placeholders)",
				...$variation_ids,
			)
		);
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->prefix}storeengine_product_variation_meta WHERE variation_id in ($variation_ids_placeholders)",
				...$variation_ids,
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- Query prepared.
	}
}
