<?php
/**
 * Product-editor integration for per-price donation / name-your-price config.
 *
 * The config is stored in the `_storeengine_donation_pricing` product-meta map
 * (see {@see \StoreEngine\Addons\Donation\Helper}), not on the Price entity, so
 * this bridges the React price editor to that map:
 *
 *   - save: carry the donation fields through `prepare_price_settings` so they
 *     reach the `set_price_props` action, stash them there (keyed by object id
 *     because a new price has no id yet), then persist to the meta map once the
 *     price is saved and its id exists (`price/after/object_save`).
 *   - load: inject the saved config into each price row via
 *     `storeengine/product/price_array_item` so the editor repopulates.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation\Hooks;

use StoreEngine\Addons\Donation\Helper;
use StoreEngine\Classes\Price;
use StoreEngine\Traits\Singleton;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PriceEditor {

	use Singleton;

	/**
	 * Config stashed between set_price_props and after/object_save, keyed by
	 * spl_object_id() of the Price being saved (covers the create case where no
	 * id exists yet).
	 *
	 * @var array<int, array>
	 */
	protected array $pending = [];

	public function __construct() {
		add_filter( 'storeengine/ajax/product/price_fields', [ $this, 'register_price_field' ] );
		add_filter( 'storeengine/ajax/product/prepare_price_settings', [ $this, 'carry_config' ], 10, 2 );
		add_action( 'storeengine/ajax/product/set_price_props', [ $this, 'stash_config' ], 10, 2 );
		add_action( 'storeengine/price/after/object_save', [ $this, 'persist_config' ], 10, 1 );
		add_filter( 'storeengine/product/price_array_item', [ $this, 'inject_config' ], 10, 2 );
	}

	/**
	 * Register the `donation` object on the price-save request whitelist so the
	 * nested config survives field filtering and reaches carry_config/stash_config.
	 * Without this the whole `donation` key is stripped from the payload and the
	 * pricing mode / amount settings silently never persist.
	 *
	 * The numeric sub-fields are declared as strings so an empty value stays ''
	 * (meaning "unset") for sanitize_config to turn into null, rather than being
	 * coerced to 0.
	 *
	 * @param array $fields
	 *
	 * @return array
	 */
	public function register_price_field( array $fields ): array {
		$fields['donation'] = [
			'mode'         => 'string',
			'min'          => 'string',
			'max'          => 'string',
			'suggested'    => 'string',
			'step'         => 'string',
			'allow_custom' => 'bool',
		];

		return $fields;
	}

	/**
	 * Carry the donation fields from the raw payload into the settings array so
	 * they survive validation and reach the set_price_props action.
	 *
	 * @param array $settings
	 * @param array $payload
	 *
	 * @return array
	 */
	public function carry_config( array $settings, array $payload ): array {
		if ( isset( $payload['donation'] ) && is_array( $payload['donation'] ) ) {
			$settings['donation'] = $this->sanitize_config( $payload['donation'] );
		}

		return $settings;
	}

	/**
	 * @param Price $price
	 * @param array $data
	 */
	public function stash_config( &$price, array $data ): void {
		if ( isset( $data['settings']['donation'] ) && is_array( $data['settings']['donation'] ) ) {
			$this->pending[ spl_object_id( $price ) ] = $this->sanitize_config( $data['settings']['donation'] );
		}
	}

	/**
	 * @param Price $price
	 */
	public function persist_config( $price ): void {
		$oid = spl_object_id( $price );
		if ( ! isset( $this->pending[ $oid ] ) ) {
			return;
		}

		$config     = $this->pending[ $oid ];
		$product_id = (int) $price->get_product_id();
		$price_id   = (int) $price->get_id();
		unset( $this->pending[ $oid ] );

		if ( ! $product_id || ! $price_id ) {
			return;
		}

		$map              = Helper::get_all_configs( $product_id );
		$map[ $price_id ] = $config;
		update_post_meta( $product_id, Helper::META_KEY, $map );
	}

	/**
	 * @param array $item
	 * @param Price $price
	 *
	 * @return array
	 */
	public function inject_config( array $item, $price ): array {
		$config = Helper::get_price_config( (int) $price->get_id(), (int) $price->get_product_id() );

		if ( ! is_array( $item['settings'] ) ) {
			$item['settings'] = [];
		}
		$item['settings']['donation'] = $config;

		return $item;
	}

	/**
	 * @param array $raw
	 *
	 * @return array
	 */
	protected function sanitize_config( array $raw ): array {
		$mode = in_array( $raw['mode'] ?? 'fixed', [ 'fixed', 'name_your_price', 'donation' ], true ) ? $raw['mode'] : 'fixed';

		// Normalize so contradictory values (min > max, step <= 0, an out-of-range
		// suggested amount) can never be stored and break the front-end input.
		return Helper::normalize_config( [
			'mode'         => $mode,
			'min'          => isset( $raw['min'] ) && '' !== $raw['min'] ? (float) $raw['min'] : null,
			'max'          => isset( $raw['max'] ) && '' !== $raw['max'] ? (float) $raw['max'] : null,
			'suggested'    => isset( $raw['suggested'] ) && '' !== $raw['suggested'] ? (float) $raw['suggested'] : null,
			'step'         => isset( $raw['step'] ) && (float) $raw['step'] > 0 ? (float) $raw['step'] : 1.0,
			// FILTER_VALIDATE_BOOLEAN so a stringified "false" (from form encoding)
			// is treated as false rather than a truthy non-empty string.
			'allow_custom' => ! isset( $raw['allow_custom'] ) || filter_var( $raw['allow_custom'], FILTER_VALIDATE_BOOLEAN ),
		] );
	}
}

// End of file price-editor.php
