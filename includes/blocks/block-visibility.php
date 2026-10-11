<?php
/**
 * "Restrict This Block" editor panel (StoreEngine core).
 *
 * Enqueues the block-visibility inspector control on EVERY block, always — even
 * when the Membership addon is inactive — so the panel can double as a
 * promotion: when Membership is off it shows an "activate" prompt instead of the
 * controls. When Membership is on, it exposes the real access-group picker and
 * the enforcement runs server-side (see
 * StoreEngine\Addons\Membership\BlockRestriction::maybe_restrict_block()).
 *
 * The editor script lives with the membership addon on disk (always present,
 * only booted when active), so core can reference it regardless of activation.
 *
 * @package StoreEngine\Blocks
 */

namespace StoreEngine\Blocks;

use StoreEngine\Utils\Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class BlockVisibility {

	const HANDLE = 'storeengine-membership-block-restriction';

	/**
	 * Attributes the editor script adds to every block type. Keep in step with
	 * the `blocks.registerBlockType` filter in block-restriction.js.
	 */
	const ATTRIBUTES = [
		'storeengineVisibility' => [
			'type'    => 'string',
			'default' => '',
		],
		'storeengineGroups'     => [
			'type'    => 'array',
			'default' => [],
		],
	];

	public static function init() {
		$self = new self();
		add_action( 'enqueue_block_editor_assets', [ $self, 'enqueue' ] );
		// Booted from `plugins_loaded`, so this is in place before any block type
		// (core's included) is registered on `init`.
		add_filter( 'register_block_type_args', [ $self, 'register_attributes' ] );
	}

	/**
	 * Declare the editor script's attributes on the server as well.
	 *
	 * Registered in JavaScript alone, the two block registries disagree about
	 * what a block's attributes are. A block previewed with ServerSideRender
	 * sends its full editor attribute set to the block-renderer REST endpoint,
	 * which validates it against the server-registered schema with
	 * `additionalProperties => false` — so the unknown keys failed every such
	 * preview with a 400 `rest_invalid_param`, shown in the editor as
	 * "Error loading block".
	 *
	 * @param array $args Block type registration arguments.
	 *
	 * @return array
	 */
	public function register_attributes( $args ) {
		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = [];
		}

		// A block that declares one of these itself keeps its own definition.
		$args['attributes'] += self::ATTRIBUTES;

		return $args;
	}

	public function enqueue() {
		$active = Helper::get_addon_active_status( 'membership' );

		wp_enqueue_script(
			self::HANDLE,
			STOREENGINE_PLUGIN_ROOT_URI . 'addons/membership/assets/js/block-restriction.js',
			[ 'wp-blocks', 'wp-hooks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-compose', 'wp-i18n', 'wp-data' ],
			STOREENGINE_VERSION,
			true
		);

		wp_set_script_translations( self::HANDLE, 'storeengine' );

		$groups = [];
		if ( $active && class_exists( '\StoreEngine\Addons\Membership\Access' ) ) {
			$groups = \StoreEngine\Addons\Membership\Access::get_group_options();
		}

		wp_add_inline_script(
			self::HANDLE,
			'window.StoreEngineMembershipBlocks = ' . wp_json_encode( [
				'membershipActive' => (bool) $active,
				'groups'           => $groups,
				'activateUrl'      => admin_url( 'admin.php?page=' . STOREENGINE_PLUGIN_SLUG . '-addons' ),
			] ) . ';',
			'before'
		);
	}
}
