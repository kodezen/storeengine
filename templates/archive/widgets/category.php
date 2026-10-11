<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

if ( count( $categories ) ) {
	$storeengine_category_widget_terms_count = count( $categories );
	foreach ( $categories as $storeengine_category_widget_parent ) {
		if ( ! empty( $storeengine_category_widget_parent->children ) ) {
			$storeengine_category_widget_terms_count += count( $storeengine_category_widget_parent->children );
		}
	}
?>
<h4 class="storeengine-archive-product-widget__title"><?php esc_html_e( 'Category', 'storeengine' ); ?></h4>
	<?php if ( $storeengine_category_widget_terms_count > 8 ) : ?>
<div class="storeengine-archive-widget-term-search">
	<input type="text" class="storeengine-archive-widget-term-search__input" placeholder="<?php esc_attr_e( 'Search categories…', 'storeengine' ); ?>" aria-label="<?php esc_attr_e( 'Search categories', 'storeengine' ); ?>"/>
	<span class="storeengine-archive-widget-term-search__empty"><?php esc_html_e( 'No categories found.', 'storeengine' ); ?></span>
</div>
	<?php endif; ?>
<div class="storeengine-archive-product-widget__body">
	<?php foreach ( $categories as $parent_category ) : ?>
		<label class="parent-term">
			<input class="storeengine-archive-product-filter" type="checkbox" name="category" value="<?php echo esc_attr( urldecode( $parent_category->slug ) ); ?>"/>
			<span class="checkmark"></span>
			<span><?php echo esc_html( $parent_category->name ); ?></span>
		</label>
		<?php if ( count( $parent_category->children ) ) : ?>
			<?php foreach ( $parent_category->children as $child_category ) : ?>
				<label class="child-term">
					<input class="storeengine-archive-product-filter" type="checkbox" name="category" value="<?php echo esc_attr( urldecode( $child_category->slug ) ); ?>"/>
					<span class="checkmark"></span>
					<span><?php echo esc_html( $child_category->name ); ?></span>
				</label>
			<?php endforeach; ?>
		<?php endif; ?>
	<?php endforeach; ?>
</div>
<?php
}
