import React, { useState } from 'react';
import Button from '@Components/Button';
import PropTypes from 'prop-types';
import { Select } from '@Components/ui/Select';
import { __ } from '@wordpress/i18n';
import './styles.scss';

const propTypes = {
	data: PropTypes.any,
	applyActionHandler: PropTypes.func,
	confirmMessage: PropTypes.string,
	options: PropTypes.array,
};

export default function BulkAction( {
	data = [],
	applyActionHandler = () => {},
	confirmMessage = '',
	options = [ { value: 'delete', label: __( 'Delete', 'storeengine' ) } ],
} ) {
	const [ bulkAction, setBulkAction ] = useState( {} );
	return (
		<React.Fragment>
			<div className="storeengine-bulk-actions">
				<Select
					className="storeengine-select"
					classNamePrefix="storeengine-react-select"
					placeholder={ __( 'Bulk Actions', 'storeengine' ) }
					isClearable={ true }
					value={ options.find(
						( item ) => item.value === bulkAction?.value
					) ?? null }
					options={ options }
					onChange={ ( e ) => setBulkAction( e ) }
				/>
				<Button
					type="button"
					label={ __( 'Apply', 'storeengine' ) }
					preset="light-blue"
					onClick={ () => {
						{
						}
						if (
							data.selectedRows &&
							data.selectedRows.length > 0 &&
							bulkAction.value &&
							// eslint-disable-next-line
							confirm( confirmMessage )
						) {
							applyActionHandler( data.selectedRows, bulkAction );
							setBulkAction( '' );
						}
					} }
				/>
			</div>
		</React.Fragment>
	);
}

BulkAction.propTypes = propTypes;
