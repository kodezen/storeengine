<?php
/**
 * Stripe Payment Addon.
 *
 * @version 1.5.0
 */

namespace StoreEngine\Addons\Stripe;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use StoreEngine\Addons\Stripe\PaymentTokens\StripePaymentTokens;
use StoreEngine\Addons\Stripe\Tax\StripeTaxBridge;
use StoreEngine\Addons\Stripe\Tax\StripeTaxRest;
use StoreEngine\Admin\Notices;
use StoreEngine\Classes\AbstractAddon;
use StoreEngine\Traits\Singleton;
use StoreEngine\Utils\Helper;

final class Stripe extends AbstractAddon {
	use Singleton;

	protected string $addon_name = 'stripe';

	public function define_constants() {
		define( 'STOREENGINE_STRIPE_VERSION', '1.0' );
		define( 'STOREENGINE_STRIPE_DIR_PATH', STOREENGINE_ADDONS_DIR_PATH . 'stripe/' );
	}

	public function init_addon() {
		// The Stripe REST SDK is a Strauss-prefixed dependency in
		// vendor/prefixed. If that tree is missing or stale (e.g. an
		// interrupted `composer install` that didn't run Strauss), the
		// StoreEngine\Stripe\* classes don't autoload and every Stripe
		// touchpoint — checkout, webhooks, subscription cron — fatals with
		// "Class StoreEngine\Stripe\Stripe not found", flooding the logs.
		// Fail safe: skip registering the gateway + its runtime, and surface a
		// single actionable admin notice instead.
		if ( ! self::sdk_available() ) {
			add_action( 'admin_notices', [ $this, 'render_missing_sdk_notice' ] );

			return;
		}

		add_filter( 'storeengine/payment_gateways', [ $this, 'add_gateway' ] );

		// Settings + meta registration must work even when the Stripe gateway
		// itself is disabled — otherwise tax settings can't be saved.
		StripeTaxBridge::bootstrap();

		add_action( 'storeengine/gateway/stripe/init', static function ( $gateway ) {
			Hooks::init( $gateway );
			StripePaymentTokens::get_instance();
			StripeService::init( $gateway );
			Api::init();
			Assets::init( $gateway );
			StripeTaxBridge::init();
			StripeTaxRest::init();

			// Native Stripe Billing (real Stripe subscriptions). The webhook
			// receiver + subscription sync are inert unless the gateway's
			// "Use native Stripe subscriptions" setting is enabled, except the
			// webhook endpoint which always listens (and no-ops for non-native).
			WebhookHandler::init( $gateway );
			SubscriptionSync::init( $gateway );

			// Lets customers switch a subscription to another saved card.
			SubscriptionPaymentMethod::init();
		} );
	}

	public function add_gateway( array $gateways ): array {
		$gateways[] = GatewayStripe::class;

		return $gateways;
	}

	/**
	 * Whether the bundled (Strauss-prefixed) Stripe SDK is autoloadable.
	 *
	 * class_exists() triggers the autoloader and returns false instead of
	 * fataling when the prefixed vendor tree is absent, so it's safe to probe.
	 */
	public static function sdk_available(): bool {
		return class_exists( \StoreEngine\Stripe\Stripe::class );
	}

	/**
	 * Admin notice shown when the Stripe SDK failed to load.
	 */
	public function render_missing_sdk_notice() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		echo '<div class="notice notice-error"><p><strong>StoreEngine Stripe:</strong> ';
		echo esc_html__( 'The bundled Stripe library could not be loaded, so Stripe payments are disabled. This usually means the plugin\'s prefixed dependencies (vendor/prefixed) are missing or incomplete — reinstall StoreEngine, or run "composer install" in the plugin directory to regenerate them.', 'storeengine' );
		echo '</p></div>';
	}
}
