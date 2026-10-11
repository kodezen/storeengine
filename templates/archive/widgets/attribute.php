<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

if ( count( $terms ) ) {
?>
<h4 class="storeengine-archive-product-widget__title"><?php echo esc_html( $attribute_label ); ?></h4>
<div class="storeengine-archive-product-widget__body">
<?php foreach ( $terms as $term_item ) : ?>
	<label>
		<input class="storeengine-archive-product-filter" type="checkbox" name="<?php echo esc_attr( $field_name ); ?>" value="<?php echo esc_attr( urldecode( $term_item->slug ) ); ?>"/>
		<span class="checkmark"></span>
		<span><?php echo esc_html( $term_item->name ); ?></span>
	</label>
	<?php endforeach; ?>
</div>
<?php
}
