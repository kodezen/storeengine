import React, { useEffect, useState } from 'react';
import Notice from '@Components/Notice';
import { __ } from '@wordpress/i18n';
import { get_route_path, is_pro } from '@Utils/helper';
import { useLocationQuery } from '@Hooks';

const SeSdk = window.SE_SDK_STOREENGINE_PRO || {};

const LicenseNotice = () => {
	const [ licenseInactive, setLicenseInactive ] = useState(
		is_pro && SeSdk?.license?.status === 'inactive'
	);
	const location = useLocationQuery();
	const current_page = location.get( 'page' );
	const current_path = location.get( 'path' );

	const handleLicenseChange = ( e ) =>
		setLicenseInactive( is_pro && e.detail?.status === 'inactive' );

	useEffect( () => {
		window.addEventListener(
			'storeengine:license:changed',
			handleLicenseChange
		);
		return () =>
			window.removeEventListener(
				'storeengine:license:changed',
				handleLicenseChange
			);
	}, [] );

	if ( ! licenseInactive ) {
		return null;
	}

	const button_action = get_route_path( {
		page: 'storeengine-settings',
		path: 'license',
	} );
	const current_action = get_route_path( {
		page: current_page,
		path: current_path,
	} );

	if ( button_action === current_action ) {
		return null;
	}

	const notice = {
		key: 'license-inactive',
		type: 'warning',
		message: __(
			'Activate your license to unlock updates, new features, and full StoreEngine Pro access.',
			'storeengine'
		),
		has_buttons: true,
		button_text: __( 'Manage License', 'storeengine' ),
		button_action,
		dismissible: false,
	};

	return (
		<Notice
			notice={ notice }
			onDismiss={ () => setLicenseInactive( false ) }
		/>
	);
};

export default React.memo( LicenseNotice );
