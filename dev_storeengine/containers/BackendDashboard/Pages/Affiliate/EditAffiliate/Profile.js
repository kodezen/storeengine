import React from 'react';
import { __ } from '@wordpress/i18n';

const Profile = () => {
	return (
		<div className="storeengine-content-section">
			<h3 className="storeengine-heading">
				{ __( 'Profile', 'storeengine' ) }
			</h3>
		</div>
	);
};

export default Profile;
