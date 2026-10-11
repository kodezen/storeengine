import React from 'react';
import SortableColumns from './SortableColumns';

const TableSubHeader = ( {
	subHeaderComponent,
	setTempCopyColumns,
	tempCopyColumns,
	showColumnFilter,
	checkedChange,
	setCopyColumns,
	copyColumns,
	suffix,
	persistColumns,
	extraActions,
} ) => {
	return (
		<div className="kzui-table__sub-header">
			<div className="kzui-table__sub-header-left">
				{ subHeaderComponent && subHeaderComponent }
			</div>
			{ ( showColumnFilter || extraActions ) && (
			<div
				className="kzui-table__sub-header-right"
				style={ {
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
				} }
			>
				{ showColumnFilter && (
					<SortableColumns
						setTempCopyColumns={ setTempCopyColumns }
						tempCopyColumns={ tempCopyColumns }
						showColumnFilter={ showColumnFilter }
						checkedChange={ checkedChange }
						setCopyColumns={ setCopyColumns }
						copyColumns={ copyColumns }
						suffix={ suffix }
						persistColumns={ persistColumns }
					/>
				) }
				{ /* Optional actions rendered AFTER the column-settings icon. */ }
				{ extraActions }
			</div>
			) }
		</div>
	);
};

export default TableSubHeader;
