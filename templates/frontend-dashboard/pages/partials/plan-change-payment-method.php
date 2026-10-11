<?php
/**
 * Change the payment method of a subscription.
 *
 * @var Subscription $subscription
 */

use StoreEngine\Addons\Subscription\Classes\PaymentMethodChange;
use StoreEngine\Addons\Subscription\Classes\Subscription;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

$tokens           = PaymentMethodChange::get_available_tokens( $subscription );
$current_token_id = PaymentMethodChange::get_current_token_id( $subscription );
$retryable_order  = PaymentMethodChange::get_retryable_order( $subscription );
$add_method_url   = PaymentMethodChange::get_add_payment_method_url( $subscription );
?>
<div class="storeengine-dashboard__section-wrapper storeengine-mb-6" id="change-payment-method">
	<div class="storeengine-dashboard__section-title">
		<h4 class="storeengine-dashboard__section-title-heading"><?php esc_html_e( 'Change payment method', 'storeengine' ); ?></h4>
	</div>
	<div class="storeengine-dashboard__section storeengine-dashboard__section--change-payment-method storeengine-p-4">
		<?php if ( empty( $tokens ) ) { ?>
			<p class="storeengine-mt-0">
				<?php esc_html_e( 'You have no saved payment methods this plan can use yet. Add one, and you will come back here to choose it.', 'storeengine' ); ?>
			</p>
			<a class="storeengine-btn storeengine-btn--preset-blue" href="<?php echo esc_url( $add_method_url ); ?>"><?php esc_html_e( 'Add payment method', 'storeengine' ); ?></a>
		<?php } else { ?>
			<form method="post" action="<?php echo esc_url( $subscription->get_view_order_url() ); ?>" class="storeengine-change-payment-method-form">
				<fieldset class="storeengine-m-0 storeengine-p-0" style="border:0">
					<legend class="storeengine-mb-3"><?php esc_html_e( 'Choose the saved payment method this plan renews with.', 'storeengine' ); ?></legend>
					<ul class="storeengine-m-0 storeengine-p-0" style="list-style:none">
						<?php foreach ( $tokens as $index => $token ) { ?>
							<?php
							$input_id = 'storeengine-subscription-token-' . $token->get_id();
							$checked  = $current_token_id ? $current_token_id === $token->get_id() : 0 === $index;
							?>
							<li class="storeengine-mb-2">
								<input
									type="radio"
									class="storeengine-radio"
									id="<?php echo esc_attr( $input_id ); ?>"
									name="payment_token"
									value="<?php echo esc_attr( $token->get_id() ); ?>"
									<?php checked( $checked ); ?>
									required
								/>
								<label for="<?php echo esc_attr( $input_id ); ?>">
									<?php echo esc_html( $token->get_display_name() ); ?>
									<?php if ( $current_token_id === $token->get_id() ) { ?>
										<em>(<?php esc_html_e( 'current', 'storeengine' ); ?>)</em>
									<?php } ?>
								</label>
							</li>
						<?php } ?>
					</ul>
				</fieldset>

				<p>
					<a href="<?php echo esc_url( $add_method_url ); ?>"><?php esc_html_e( 'Add a new payment method', 'storeengine' ); ?></a>
				</p>

				<?php if ( $retryable_order ) { ?>
					<p>
						<input type="checkbox" class="storeengine-checkbox" id="storeengine-retry-payment" name="retry_payment" value="1" checked />
						<label for="storeengine-retry-payment">
							<?php
							printf(
								/* translators: %s: renewal order number. */
								esc_html__( 'Retry the failed payment for order #%s now with this payment method', 'storeengine' ),
								esc_html( $retryable_order->get_order_number() )
							);
							?>
						</label>
					</p>
				<?php } ?>

				<input type="hidden" name="<?php echo esc_attr( PaymentMethodChange::FORM_FIELD ); ?>" value="<?php echo esc_attr( PaymentMethodChange::FORM_ACTION ); ?>" />
				<input type="hidden" name="subscription_id" value="<?php echo esc_attr( $subscription->get_id() ); ?>" />
				<?php wp_nonce_field( PaymentMethodChange::nonce_action( $subscription->get_id() ) ); ?>

				<button type="submit" class="storeengine-btn storeengine-btn--preset-blue"><?php esc_html_e( 'Update payment method', 'storeengine' ); ?></button>
				<a class="storeengine-btn storeengine-btn--preset-gray" href="<?php echo esc_url( $subscription->get_view_order_url() ); ?>"><?php esc_html_e( 'Cancel', 'storeengine' ); ?></a>
			</form>
		<?php } ?>
	</div>
</div>
<?php
