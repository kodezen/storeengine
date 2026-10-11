import React from 'react';
import { __ } from '@wordpress/i18n';

const PromotionCodes = () => {
	return (
		<div className="storeengine-content-section">
			<h3 className="storeengine-heading">
				{ __( 'Promotion Codes', 'storeengine' ) }
			</h3>
		</div>
	);
};

export default PromotionCodes;
