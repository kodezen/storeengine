<?php

use StoreEngine\Utils\Helper;

if ( ! defined('ABSPATH') ) {
	exit; // Exit if accessed directly
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
$per_page      = 10;
$downloads_url = storeengine_get_dashboard_endpoint_url( 'downloads' );

// The caller knows about every download source on the page (plain files *and*
// licensed builds); fall back to the file permissions alone only when it does
// not pass a count.
if ( isset( $total_pages ) && null !== $total_pages ) {
	$total_pages = (int) $total_pages;
} else {
	$total_pages = (int) ceil( (int) Helper::get_download_permissions_count_by_customer_id() / $per_page );
}

$current_page  = max( 1, get_query_var( 'paged' ) );
$previous_page = $current_page - 1;
?>
<div class="storeengine__order-pagination">
	<?php if ( $total_pages > 1 ) : ?>
		<ul class="pagination">
			<?php if ( $previous_page > 0 ) : ?>
				<li>
					<a href="<?php echo esc_attr(add_query_arg('paged', max(1, $current_page - 1), $downloads_url)); ?>" class="prev">
						<i class="storeengine-icon storeengine-icon--arrow-left"></i>
					</a>
				</li>
			<?php endif; ?>
			<?php for ( $i = 1; $i <= $total_pages; $i++ ) : ?>
				<li>
					<a href="<?php echo esc_attr(add_query_arg('paged', $i, $downloads_url)); ?>" class="<?php echo esc_attr($i === $current_page ? 'active' : ''); ?>">
						<?php echo esc_html($i); ?>
					</a>
				</li>
			<?php endfor; ?>
			<?php if ( $total_pages > $current_page ) : ?>
				<li>
					<a href="<?php echo esc_attr(add_query_arg('paged', min($total_pages, $current_page + 1), $downloads_url)); ?>" class="next">
						<i class="storeengine-icon storeengine-icon--arrow-right"></i>
					</a>
				</li>
			<?php endif; ?>
		</ul>
	<?php endif; ?>
</div>
