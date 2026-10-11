<?php
/**
 * @var string $product_type
 * @var array $available_variants
 * @var AttributeData[] $variant_with_attributes
 *
 * @TODO should use Helper::get_variation_attributes()
 */

use StoreEngine\Classes\Data\AttributeData;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

if ( 'variable' !== $product_type ) {
	return;
}

// Swatch meta (set on the attribute term: Products > Attributes > Set terms).
$storeengine_swatch_for = static function ( int $term_id ): array {
	$color = trim( (string) get_term_meta( $term_id, '_storeengine_swatch_color', true ) );
	// Accept hex, rgb()/hsl() and plain color names only.
	if ( '' !== $color && ! preg_match( '/^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%\/]+\)|[a-z]+)$/i', $color ) ) {
		$color = '';
	}
	$image_id = (int) get_term_meta( $term_id, '_storeengine_swatch_image', true );

	return [
		'color' => $color,
		'image' => $image_id ? (string) wp_get_attachment_image_url( $image_id, 'thumbnail' ) : '',
	];
};

// Need to make it as function/method
$variation_attributes    = [];
$variant_with_attributes = array_merge( ...array_map( fn( $v ) => $v->get_attributes(), $available_variants ) );

foreach ( $variant_with_attributes as $variant_with_attribute ) {
	$attribute_taxonomy = get_taxonomy( $variant_with_attribute->taxonomy );
	if ( ! $attribute_taxonomy ) {
		continue;
	}

	if ( ! isset( $variation_attributes[ $variant_with_attribute->taxonomy ] ) ) {
		$variation_attributes[ $variant_with_attribute->taxonomy ] = [
			'name'     => $attribute_taxonomy->label,
			'taxonomy' => $variant_with_attribute->taxonomy,
			'options'  => [
				[
					'id'          => $variant_with_attribute->term_id,
					'name'        => $variant_with_attribute->name,
					'slug'        => $variant_with_attribute->slug,
					'description' => $variant_with_attribute->description,
				],
			],
		];
	} else {
		$variation_attributes[ $variant_with_attribute->taxonomy ]['options'][] = [
			'id'          => $variant_with_attribute->term_id,
			'name'        => $variant_with_attribute->name,
			'slug'        => $variant_with_attribute->slug,
			'description' => $variant_with_attribute->description,
		];
		$variation_attributes[ $variant_with_attribute->taxonomy ]['options']   = array_values( array_unique( $variation_attributes[ $variant_with_attribute->taxonomy ]['options'], SORT_REGULAR ) );
	}
}

$variation_attributes = array_values( $variation_attributes );

foreach ( $variation_attributes as $storeengine_va_index => $storeengine_va ) {
	foreach ( $storeengine_va['options'] as $storeengine_opt_index => $storeengine_opt ) {
		$variation_attributes[ $storeengine_va_index ]['options'][ $storeengine_opt_index ] = array_merge( $storeengine_opt, $storeengine_swatch_for( (int) $storeengine_opt['id'] ) );
	}
}

if ( ! count( $variation_attributes ) ) {
	return;
}

?>
<div class="storeengine-single-product-variations">
	<?php foreach ( $variation_attributes as $variation_attribute ) : ?>
		<div class="storeengine-single-product-variation">
			<h5 class="storeengine-single-product-variation__label"><?php echo esc_html( $variation_attribute['name'] ); ?></h5>
			<div class="storeengine-single-product-variation-items">
				<?php foreach ( $variation_attribute['options'] as $option ) : ?>
					<div id="<?php echo esc_attr( $variation_attribute['taxonomy'] . '_' . $option['slug'] ); ?>" class="storeengine-single-product-variation-item">
						<input type="radio" class="storeengine-single-product-variation-item__radio storeengine-radio" name="<?php echo esc_attr( $variation_attribute['taxonomy'] ); ?>" id="variation_<?php echo esc_attr( $variation_attribute['taxonomy'] . $option['id'] ); ?>" value="<?php echo esc_attr( $option['slug'] ); ?>">
						<label class="storeengine-single-product-variation-item__label<?php echo ( $option['color'] || $option['image'] ) ? ' has-swatch' : ''; ?>" for="variation_<?php echo esc_attr( $variation_attribute['taxonomy'] . $option['id'] ); ?>">
							<?php if ( $option['image'] ) : ?>
								<span class="storeengine-single-product-variation-item__swatch storeengine-single-product-variation-item__swatch--image" aria-hidden="true"><img src="<?php echo esc_url( $option['image'] ); ?>" alt=""></span>
							<?php elseif ( $option['color'] ) : ?>
								<span class="storeengine-single-product-variation-item__swatch" aria-hidden="true" style="background-color: <?php echo esc_attr( $option['color'] ); ?>"></span>
							<?php endif; ?>
							<?php echo esc_html( $option['name'] ); ?>
						</label>
					</div>
				<?php endforeach; ?>
			</div>
		</div>
	<?php endforeach; ?>
</div>

