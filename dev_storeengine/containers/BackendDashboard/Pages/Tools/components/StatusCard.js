import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@Components/Tooltip';

const propTypes = {
	title: PropTypes.string,
	value: PropTypes.string || PropTypes.bool,
	hint: PropTypes.string,
};

function StatusCard( { title, value, hint = null } ) {
	return (
		<div className="flex justify-between gap-3 px-3 py-3 bg-se-bg border border-se-border rounded-lg w-[calc(50%-38px)]">
			<div className="flex items-center gap-1 text-sm text-se-subtitle text-start min-w-[33.333%]">
				{ title }
				<span>:</span>
				{ hint && <Tooltip>{ hint }</Tooltip> }
			</div>
			<div className="text-15 font-medium text-se-text text-end break-keep">
				{ true === value ? (
					<span
						className="storeengine-icon storeengine-icon--custom-check"
						aria-hidden={ true }
					/>
				) : false === value ? (
					<span
						className="storeengine-icon storeengine-icon--close"
						aria-hidden={ true }
					/>
				) : (
					value
				) }
			</div>
		</div>
	);
}

StatusCard.propTypes = propTypes;

export default React.memo( StatusCard );
