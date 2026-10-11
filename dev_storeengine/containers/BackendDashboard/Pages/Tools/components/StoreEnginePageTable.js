import ListTable from '@Components/ListTable';
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

const columns = [
	/*{
		name: __( '#', 'storeengine' ),
		sortable: true,
		cell: ( row ) => (
			<div className="storeengine-table-title-wrap">
				<div className="">{ row.index }</div>
			</div>
		),
	},*/
	{
		name: __( 'Page Name', 'storeengine' ),
		suffix: 'title',
		sortable: true,
		cell: ( row ) => (
			<div className="storeengine-table-title-wrap">
				<div
					className="storeengine-table-title"
					style={ {
						flexDirection: 'column',
						alignItems: 'flex-start',
					} }
				>
					{ row.post_title }
					{ row.ID && (
						<span
							className="storeengine-table-subtitle"
							style={ { fontSize: '.7em', color: '#9ca1a7' } }
						>
							{
								// translators: %d Page ID.
								sprintf( __( 'ID #%d', 'storeengine' ), row.ID )
							}
						</span>
					) }
				</div>
			</div>
		),
	},
	{
		name: __( 'Page Slug', 'storeengine' ),
		sortable: true,
		cell: ( row ) => (
			<div className="storeengine-table-title-wrap">
				<div className="storeengine-table-title">
					{ row.post_name
						? row.post_name
						: __( 'N/A', 'storeengine' ) }
				</div>
			</div>
		),
	},
	{
		name: __( 'Status', 'storeengine' ),
		sortable: true,
		cell: ( row ) => (
			<div className="se-admin-tw flex items-center justify-center gap-2">
				{ row?.ID ? (
					<span
						className={ `storeengine-icon storeengine-icon--${
							'publish' === row.post_status
								? 'filled-checkmark'
								: 'close'
						}` }
						aria-label={ sprintf(
							// translators: %s: Post status.
							__( 'Post status: %s', 'storeengine' ),
							row.post_status
						) }
					/>
				) : (
					<span
						className="storeengine-icon storeengine-icon--close"
						aria-label={ sprintf(
							// translators: %s: Post title.
							__( '"%s" page is unavailable', 'storeengine' ),
							row.post_title
						) }
					/>
				) }
				{ row.permalink && (
					<a
						href={ decodeURIComponent(
							row.permalink.replace( '&amp;', '&' )
						) }
						target="_blank"
						rel="noreferrer"
						aria-label={ sprintf(
							// translators: %s: Post title.
							__( 'View "%s" page', 'storeengine' ),
							row.post_title
						) }
					>
						<span
							className="storeengine-icon storeengine-icon--eye"
							aria-hidden={ true }
						/>
					</a>
				) }
				{ row?.ID && row.edit_link && (
					<a
						href={ decodeURIComponent(
							row.edit_link.replace( '&amp;', '&' )
						) }
						target="_blank"
						rel="noreferrer"
						aria-label={ sprintf(
							// translators: %s: Post title.
							__( 'Edit "%s" page', 'storeengine' ),
							row.post_title
						) }
					>
						<span
							className="storeengine-icon storeengine-icon--edit"
							aria-hidden={ true }
						/>
					</a>
				) }
			</div>
		),
	},
];

const StoreEnginePageTable = ( { data, isFetchPages } ) => {
	return (
		<ListTable
			className="storeengine-list-wrap"
			columns={ columns }
			data={ data }
			noDataText={ __(
				'No pages data was found to see the available list here.',
				'storeengine'
			) }
			progressPending={ isFetchPages }
			showColumnFilter={ false }
			isRowSelectable={ false }
			suffix="tools-pages"
			showSubHeader={ false }
		/>
	);
};

export default StoreEnginePageTable;
