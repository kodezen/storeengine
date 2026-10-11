import React from 'react';
import { __ } from '@wordpress/i18n';

const Payouts = () => {
	return (
		<div className="storeengine-content-section">
			<h3 className="storeengine-heading">
				{ __( 'Payouts', 'storeengine' ) }
			</h3>
		</div>
	);
};

export default Payouts;
