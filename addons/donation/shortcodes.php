<?php
/**
 * Donation shortcodes.
 *
 *   [storeengine_donation_progress product_id="123"]
 *       Goal progress bar (raised / goal, %, contributor count) for a donation
 *       product's campaign. Reads the cached campaign running total.
 *
 * The donation form itself is the product's normal add-to-cart form (the
 * amount field is injected by {@see Hooks\Frontend}); a dedicated
 * [storeengine_donation_form] alias renders that product's add-to-cart block.
 *
 * @since 1.0.0
 */

namespace StoreEngine\Addons\Donation;

use StoreEngine\Addons\Donation\Classes\Campaign;
use StoreEngine\Traits\Singleton;
use StoreEngine\Utils\Formatting;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Shortcodes {

	use Singleton;

	public function __construct() {
		add_shortcode( 'storeengine_donation_progress', [ $this, 'render_progress' ] );
	}

	/**
	 * @param array $atts
	 *
	 * @return string
	 */
	public function render_progress( $atts ): string {
		$atts        = shortcode_atts( [
			'product_id'  => 0,
			'campaign_id' => 0,
		], $atts, 'storeengine_donation_progress' );
		$product_id  = (int) $atts['product_id'];
		$campaign_id = (int) $atts['campaign_id'];

		if ( ! $product_id && ! $campaign_id ) {
			$product_id = (int) get_the_ID();
		}

		// A campaign is normally reached through the product that takes the
		// money, but one can exist without a purchasable product (its product
		// was deleted, or it was created before the link existed). Addressing it
		// by campaign id keeps the raised total and donor count on screen
		// instead of rendering nothing at all.
		if ( $campaign_id ) {
			$progress = Campaign::exists( $campaign_id ) ? Campaign::get_progress( $campaign_id ) : null;
		} else {
			$progress = $product_id ? Campaign::get_progress_for_product( $product_id ) : null;
		}

		if ( ! $progress ) {
			return '';
		}

		$raised  = Formatting::price( $progress['raised'] );
		$percent = (float) $progress['percent'];

		ob_start();
		?>
		<div class="storeengine-donation-progress" data-percent="<?php echo esc_attr( (string) $percent ); ?>">
			<div class="storeengine-donation-progress__bar">
				<div class="storeengine-donation-progress__fill" style="width: <?php echo esc_attr( (string) $percent ); ?>%;"></div>
			</div>
			<div class="storeengine-donation-progress__meta">
				<span class="storeengine-donation-progress__raised">
					<?php
					if ( null !== $progress['goal'] ) {
						/* translators: 1: amount raised, 2: goal amount. */
						printf( wp_kses_post( __( '%1$s raised of %2$s goal', 'storeengine' ) ), wp_kses_post( $raised ), wp_kses_post( Formatting::price( $progress['goal'] ) ) );
					} else {
						/* translators: %s: amount raised. */
						printf( wp_kses_post( __( '%s raised', 'storeengine' ) ), wp_kses_post( $raised ) );
					}
					?>
				</span>
				<span class="storeengine-donation-progress__contributors">
					<?php
					/* translators: %s: number of contributors. */
					printf( esc_html( _n( '%s donor', '%s donors', $progress['contributors'], 'storeengine' ) ), esc_html( number_format_i18n( $progress['contributors'] ) ) );
					?>
				</span>
			</div>
		</div>
		<?php
		return (string) ob_get_clean();
	}
}

// End of file shortcodes.php
