<?php
/**
 * Donation addon settings.
 *
 * Store-wide defaults. Per-product pricing configuration (mode, min, max,
 * suggested amount, step) lives on the product itself — see {@see Helper} —
 * not here.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation;

use StoreEngine\Classes\AbstractAddonSettings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Settings extends AbstractAddonSettings {

	protected ?string $settings_name = 'donation';

	public function get_default_settings(): array {
		return [
			'enabled'              => true,
			// Label shown above the amount input on the product page.
			'amount_field_label'   => __( 'Enter your amount', 'storeengine' ),
			// Text shown when a chosen amount is below the configured minimum.
			'below_min_message'    => __( 'Please enter an amount of at least {min}.', 'storeengine' ),
			// Text shown when a chosen amount is above the configured maximum.
			'above_max_message'    => __( 'Please enter an amount of at most {max}.', 'storeengine' ),
			// Let donors optionally cover the payment processing fee.
			'enable_fee_recovery'  => false,
			'fee_recovery_percent' => 0,
			'fee_recovery_label'   => __( 'I’d like to cover the processing fee', 'storeengine' ),
		];
	}

	public function get_settings_fields(): array {
		return [
			'enabled'              => 'boolean',
			'amount_field_label'   => 'string',
			'below_min_message'    => 'string',
			'above_max_message'    => 'string',
			'enable_fee_recovery'  => 'boolean',
			'fee_recovery_percent' => 'number',
			'fee_recovery_label'   => 'string',
		];
	}
}

// End of file settings.php
