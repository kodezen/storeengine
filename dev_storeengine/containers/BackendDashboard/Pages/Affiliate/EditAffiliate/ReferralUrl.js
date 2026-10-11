import React from 'react';
import { __ } from '@wordpress/i18n';

const ReferralUrl = () => {
	return (
		<div className="storeengine-content-section">
			<h3 className="storeengine-heading">
				{ __( 'Referral Url', 'storeengine' ) }
			</h3>
		</div>
	);
};

export default ReferralUrl;
