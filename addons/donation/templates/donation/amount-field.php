<?php
/**
 * Donation / name-your-price amount field.
 *
 * Override in a theme at: yourtheme/storeengine/donation/amount-field.php
 *
 * When custom amounts are allowed the field reuses the storefront
 * .storeengine-quantity-input structure so the shipped stepper JS wires the
 * −/+ buttons to step by `step`. A fixed suggested amount renders read-only.
 *
 * @var int         $price_id
 * @var string      $label
 * @var string      $currency  Currency symbol (may contain HTML entities).
 * @var float       $min
 * @var float|null  $max
 * @var float       $step
 * @var float|string $value    Suggested amount, or '' for none.
 * @var bool        $allow     Whether custom amounts are allowed.
 * @var string      $name      Input name.
 * @var string      $below_min_message
 * @var string      $above_max_message
 *
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$field_classes    = 'storeengine-donation-amount-field' . ( $allow ? ' storeengine-quantity-input' : ' storeengine-donation-amount-field--fixed' );
$toggle_by_price  = ! empty( $toggle_by_price );
// Unique per price: a product with more than one customer-priced price
// renders one of these per price, and duplicate ids/label[for] would make
// every label activate only the first field's input.
$field_id = 'storeengine-donation-amount-' . (int) $price_id;
?>
<div
	class="storeengine-donation-amount-wrap"
	data-price-id="<?php echo esc_attr( (string) $price_id ); ?>"
	<?php if ( $toggle_by_price ) : ?>
	data-toggle-by-price="1"
	hidden
	<?php endif; ?>
	<?php if ( $allow && $min > 0 && ! empty( $below_min_message ) ) : ?>
	data-below-min-message="<?php echo esc_attr( $below_min_message ); ?>"
	<?php endif; ?>
	<?php if ( $allow && null !== $max && ! empty( $above_max_message ) ) : ?>
	data-above-max-message="<?php echo esc_attr( $above_max_message ); ?>"
	<?php endif; ?>
>
	<label class="storeengine-donation-amount-label" for="<?php echo esc_attr( $field_id ); ?>">
		<?php echo esc_html( $label ); ?>
	</label>
	<div class="<?php echo esc_attr( $field_classes ); ?>">
		<?php if ( $allow ) : ?>
			<button type="button" class="storeengine-quantity-input__btn decrement" aria-label="<?php esc_attr_e( 'Decrease amount', 'storeengine' ); ?>">
				<i class="storeengine-icon storeengine-icon--minus" aria-hidden="true"></i>
			</button>
		<?php endif; ?>
		<span class="storeengine-donation-amount-currency"><?php echo wp_kses_post( $currency ); ?></span>
		<input
			type="number"
			id="<?php echo esc_attr( $field_id ); ?>"
			class="storeengine-donation-amount-input<?php echo $allow ? ' storeengine-quantity-input__input' : ''; ?>"
			name="<?php echo esc_attr( $name ); ?>"
			min="<?php echo esc_attr( (string) $min ); ?>"
			<?php echo null !== $max ? 'max="' . esc_attr( (string) $max ) . '"' : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the value is escaped above. ?>
			step="<?php echo esc_attr( (string) $step ); ?>"
			value="<?php echo esc_attr( (string) $value ); ?>"
			inputmode="decimal"
			<?php echo $allow ? '' : 'readonly'; ?>
			<?php echo $toggle_by_price ? 'disabled' : ''; ?>
		/>
		<?php if ( $allow ) : ?>
			<button type="button" class="storeengine-quantity-input__btn increment" aria-label="<?php esc_attr_e( 'Increase amount', 'storeengine' ); ?>">
				<i class="storeengine-icon storeengine-icon--add" aria-hidden="true"></i>
			</button>
		<?php endif; ?>
	</div>
	<?php if ( $allow && ( ( $min > 0 && ! empty( $below_min_message ) ) || ( null !== $max && ! empty( $above_max_message ) ) ) ) : ?>
		<p class="storeengine-donation-amount-error" role="alert" hidden></p>
	<?php endif; ?>
	<?php if ( $min > 0 || null !== $max ) : ?>
		<small class="storeengine-donation-amount-hint">
			<?php
			if ( $min > 0 && null !== $max ) {
				/* translators: 1: formatted minimum amount, 2: formatted maximum amount. */
				printf( esc_html__( 'Between %1$s and %2$s', 'storeengine' ), wp_kses_post( \StoreEngine\Utils\Formatting::price( $min ) ), wp_kses_post( \StoreEngine\Utils\Formatting::price( $max ) ) );
			} elseif ( $min > 0 ) {
				/* translators: %s: formatted minimum amount. */
				printf( esc_html__( 'Minimum: %s', 'storeengine' ), wp_kses_post( \StoreEngine\Utils\Formatting::price( $min ) ) );
			} else {
				/* translators: %s: formatted maximum amount. */
				printf( esc_html__( 'Maximum: %s', 'storeengine' ), wp_kses_post( \StoreEngine\Utils\Formatting::price( $max ) ) );
			}
			?>
		</small>
	<?php endif; ?>
</div>
