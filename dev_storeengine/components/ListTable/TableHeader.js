import React from 'react';
import classnames from 'classnames';

const TableHeader = ( {
	visibleColumn,
	isCheckboxColumnVisible,
	copyDataArr,
	selectAllRow,
	data,
	headerRef,
} ) => {
	const isCheckboxChecked = data.length > 0 && copyDataArr;

	return (
		<div className="kzui-table__head" ref={ headerRef }>
			<div className="kzui-table__head-row">
				{ isCheckboxColumnVisible && (
					<div className="kzui-table__row-cell kzui-table__row-cell-checkbox">
						<input
							checked={
								isCheckboxChecked &&
								copyDataArr?.every( ( row ) => row.select )
							}
							type="checkbox"
							className='storeengine-input-check'
							onChange={ selectAllRow }
						/>
					</div>
				) }

				{ visibleColumn?.map( ( column, index ) => (
					<div
						className={ classnames(
							'kzui-table__row-cell kzui-table__header-row-cell',
							column?.className,
							{
								'kzui-table__row-cell--isLabelWidth':
									column?.isLabelWidth,
								[ 'kzui-table__header-row-cell--' +
								column?.suffix ]: column?.suffix,
							}
						) }
						key={ index }
						style={ { width: column.width } }
					>
						{ column.name }
					</div>
				) ) }
			</div>
		</div>
	);
};

export default TableHeader;
