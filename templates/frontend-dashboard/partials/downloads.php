<?php
/**
 * The Template for displaying the customer downloads list.
 *
 * Renders what the free plugin owns: the file downloads a customer earned through
 * `storeengine_downloadable_product_permissions`. Anything else a download can be
 * — a licensed build, a version history, a free counterpart — belongs to an addon,
 * and reaches this table through the hooks below. Nothing here may reference an
 * addon's classes or tables.
 *
 * Extension points:
 *   - `storeengine/dashboard/downloads/columns`        (filter) add/reorder columns.
 *   - `storeengine/dashboard/downloads/permission_cell` (action) render a cell an
 *     addon's own column needs on a file-download row.
 *   - `storeengine/dashboard/downloads/rows`           (action) append whole rows.
 *   - `storeengine/dashboard/downloads/total`          (filter) contribute to the
 *     pagination total, so addon rows are reachable past page one.
 *   - `storeengine/dashboard/downloads/page_row_count` (filter) how many rows the
 *     addon renders on *this* page, so the empty state stays honest.
 *
 * This template can be overridden by copying it to yourtheme/storeengine/frontend-dashboard/partials/downloads.php.
 *
 * the readme will list any important changes.
 *
 * @version     1.0.0
 */

use StoreEngine\Utils\Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound, WordPress.WP.GlobalVariablesOverride.Prohibited

$limit                    = 10;
$paged                    = max( 1, get_query_var( 'paged' ) );
$downloadable_permissions = Helper::get_download_permissions_by_customer_id( $paged );

/**
 * Rows an addon will append to this page. Asked for up front so the empty state
 * and the pagination can account for them before anything is rendered.
 *
 * @param int $count How many rows the addon renders on this page.
 * @param int $paged Current page.
 * @param int $limit Rows per page.
 */
$addon_row_count = (int) apply_filters( 'storeengine/dashboard/downloads/page_row_count', 0, $paged, $limit );

$hasAnyItems = [ ! empty( $downloadable_permissions ), $addon_row_count > 0 ];

/**
 * Columns for the downloads table.
 *
 * @param array $columns Column slug => label.
 */
$columns = apply_filters( 'storeengine/dashboard/downloads/columns', [
	'product' => __( 'Product', 'storeengine' ),
	'actions' => __( 'Download', 'storeengine' ),
] );

// Products already shown as a file download, so an addon can avoid listing the
// same product a second time.
$rendered_file_products = [];
?>
<div class="storeengine-dashboard__section-wrapper">
	<?php if ( ! empty( array_filter( $hasAnyItems ) ) ) { ?>
		<div class="storeengine-dashboard__section storeengine-dashboard__table-wrapper">
			<table class="storeengine-dashboard__table storeengine-dashboard__table--downloads">
				<thead>
				<tr>
					<?php foreach ( $columns as $column => $label ) { ?>
						<th scope="col" class="col-<?php echo esc_attr( $column ); ?> nobr">
							<?php echo esc_html( $label ); ?>
						</th>
					<?php } ?>
				</tr>
				</thead>
				<tbody>
				<?php
				foreach ( (array) $downloadable_permissions as $downloadable_permission ) {
					$file_product_id                            = (int) $downloadable_permission->get_product_id();
					$rendered_file_products[ $file_product_id ] = true;
					?>
					<tr>
						<?php
						foreach ( $columns as $column => $label ) {
							if ( 'product' === $column ) {
								?>
								<td class="col-product" data-label="<?php echo esc_attr( $label ); ?>">
									<a href="<?php echo esc_url( get_permalink( $file_product_id ) ); ?>"><?php echo esc_html( $downloadable_permission->get_product_title() ); ?></a>
								</td>
								<?php
								continue;
							}

							if ( 'actions' === $column ) {
								?>
								<td class="col-actions nobr" data-label="<?php echo esc_attr( $label ); ?>">
									<a class="storeengine-btn storeengine-btn--sm storeengine-btn--download storeengine-btn--preset-blue storeengine-inline-flex storeengine-flex-align-center storeengine-flex-gap-4" href="<?php echo esc_url( $downloadable_permission->get_download_url() ); ?>">
										<?php storeengine_render_icon( 'download' ); ?>
										<span><?php esc_html_e( 'Download', 'storeengine' ); ?></span>
									</a>
								</td>
								<?php
								continue;
							}

							/**
							 * Render a cell for an addon-owned column on a file-download row.
							 *
							 * The addon that added the column owns the `<td>`; skipping it
							 * would misalign the row, so every callback must output one.
							 *
							 * @param string $column     Column slug.
							 * @param string $label      Column label (for the responsive data-label).
							 * @param int    $product_id Product this row is for.
							 */
							do_action( 'storeengine/dashboard/downloads/permission_cell', $column, $label, $file_product_id );
						}
						?>
					</tr>
					<?php
				}

				/**
				 * Append addon-owned rows (licensed builds, and anything else that is
				 * a download but not a file permission).
				 *
				 * @param array $columns                Columns in render order.
				 * @param int   $paged                  Current page.
				 * @param int   $limit                  Rows per page.
				 * @param array $rendered_file_products Product IDs already rendered above, keyed by id.
				 */
				do_action( 'storeengine/dashboard/downloads/rows', $columns, $paged, $limit, $rendered_file_products );
				?>
				</tbody>
			</table>
		</div>
		<?php
		/**
		 * Total downloadable items across every source, so addon rows stay reachable
		 * past page one. Counting only the file permissions — as this used to — left
		 * every licensed download after the tenth unreachable.
		 *
		 * @param int $total Running total.
		 * @param int $paged Current page.
		 * @param int $limit Rows per page.
		 */
		$downloads_total = max(
			(int) Helper::get_download_permissions_count_by_customer_id(),
			(int) apply_filters( 'storeengine/dashboard/downloads/total', 0, $paged, $limit )
		);

		do_action( 'storeengine/templates/dashboard_downloads_pagination', $downloadable_permissions, (int) ceil( $downloads_total / $limit ) );
		?>
	<?php } else { ?>
		<?php
		storeengine_oops_message( [
			'classes' => 'storeengine-my-5',
			'title'   => __( 'No Downloads Found!', 'storeengine' ),
			'message' => __( 'No downloads available. You haven’t purchased any downloadable products yet.', 'storeengine' ),
		] );
		?>
	<?php } ?>
</div>
