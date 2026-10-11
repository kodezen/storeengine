import React from 'react';
import classnames from 'classnames';

const TableBody = ( {
	dataFetchingStatus,
	copyDataArr,
	visibleColumn,
	isCheckboxColumnVisible,
	selectRowChange,
	noDataText,
	loadingHeight,
	bodyRef,
} ) => {
	const isLoading = dataFetchingStatus || ! copyDataArr;

	return (
		<div
			className={ classnames( 'kzui-table__body', {
				'is-loading': isLoading,
			} ) }
			ref={ bodyRef }
			style={ {
				opacity: isLoading ? 0.3 : 1,
				transition: 'opacity 0.3s ease',
			} }
		>
			{ copyDataArr?.length > 0 && (
				<>
					{ copyDataArr?.map( ( row, index ) => (
						<div key={ index } className="kzui-table__body-row">
							{ isCheckboxColumnVisible && (
								<div className="kzui-table__row-cell kzui-table__row-cell-checkbox">
									<input
										type="checkbox"
										className='storeengine-input-check'
										checked={ row.select }
										onChange={ ( event ) =>
											selectRowChange( {
												row,
												select: event.target.checked,
											} )
										}
									/>
								</div>
							) }
							{ visibleColumn.length > 0 && (
								<>
									{ visibleColumn?.map(
										( copyColumn, copyColumnIndex ) => (
											<div
												className={ classnames(
													'kzui-table__row-cell',
													copyColumn?.className,
													{
														[ 'kzui-table__row-cell--' +
														copyColumn.suffix ]:
															copyColumn?.suffix,
													}
												) }
												key={ copyColumnIndex }
												style={ {
													width: copyColumn?.width,
												} }
											>
												{ copyColumn?.cell( row ) }
											</div>
										)
									) }
								</>
							) }
						</div>
					) ) }
				</>
			) }
		</div>
	);
};

export default TableBody;
