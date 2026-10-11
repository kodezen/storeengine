import React from 'react';
import { Select } from '@Components/ui/Select';
import { __, sprintf } from '@wordpress/i18n';
import Pagination from '@Components/Pagination';

const options = [
	{ value: '10', label: __( '10', 'storeengine' ) },
	{ value: '15', label: __( '15', 'storeengine' ) },
	{ value: '20', label: __( '20', 'storeengine' ) },
	{ value: '25', label: __( '25', 'storeengine' ) },
	{ value: '30', label: __( '30', 'storeengine' ) },
];

const TableFooter = ( {
	data,
	totalItems,
	paginationPerPageChange,
	rowsPerPage = 10,
	onChangePage,
	currentPageNumber,
} ) => {
	const isLastPage =
		currentPageNumber === Math.ceil( totalItems / rowsPerPage );
	const remainingItems = totalItems % rowsPerPage || rowsPerPage;

	return (
		<div className="kzui-table__footer">
			<span className="kzui-table__footer-left">
				{  }
				{ sprintf(
					// translators: %1$s. Number of item showing, %2$s. Total items found.
					__( 'Showing result %1$s out of %2$s', 'storeengine' ),
					data?.length,
					totalItems
				) }
			</span>
			<div className="kzui-table__footer-right">
				<div className="kzui-table__footer-pagination per__page">
					<p className='m-0'>{ __( 'Items per page', 'storeengine' ) }</p>
					<Select
						className="storeengine-select"
						classNamePrefix="storeengine-react-select"
						onChange={ ( perPage ) =>
							paginationPerPageChange(
								perPage.value,
								currentPageNumber
							)
						}
						value={
							rowsPerPage
								? options.find(
										( item ) =>
											parseInt( item.value ) ===
											parseInt( rowsPerPage )
								  )
								: options[ 0 ]
						}
						options={ options }
						menuPlacement="auto"
						isDisabled={ isLastPage && remainingItems < 10 }
						inputHeight="auto"
					/>
				</div>
				<div className="kzui-table__footer-pagination-pages icons">
					<Pagination
						totalItems={ totalItems }
						fetchHandler={ onChangePage }
						currentPageNumber={ currentPageNumber }
						rowsPerPage={ rowsPerPage }
					/>
				</div>
			</div>
		</div>
	);
};

export default TableFooter;
