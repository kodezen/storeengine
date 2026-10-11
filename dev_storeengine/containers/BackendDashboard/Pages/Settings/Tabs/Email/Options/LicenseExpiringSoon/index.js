import React, { useState } from 'react';
import UserForm from '../../EmailForm/UserForm';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import ReactModal from '@Components/Modal/ReactModal';
import { Button } from '@Components/ui';
import Checkbox from '@Components/Formik/Checkbox';

const LicenseExpiringSoon = () => {
	const { values, setFieldValue } = useFormikContext();
	const { email } = values;
	const [ modalOpen, isModalOpen ] = useState( false );

	const onRequestClose = () => {
		isModalOpen( false );
	};

	return (
		<div className="storeengine-settings-email-template se-admin-tw">
			<div className="storeengine-title-subtitle">
				<span className="storeengine-title">
					{ __( 'To Customer', 'storeengine' ) }
				</span>
				<span className="storeengine-sub-title">
					{ __(
						'7-day reminder for licenses on manual-renew subscriptions. Auto-renew subscriptions stay silent — they\'re handled by the renewal-failed email.',
						'storeengine'
					) }
				</span>
			</div>
			<div className="storeengine-settings-email-template__body">
				<Button
					preset="outline"
					icon="storeengine-icon--edit-two"
					onClick={ () => isModalOpen( true ) }
				>
					{ __( 'Edit Template', 'storeengine' ) }
				</Button>
				<Checkbox
					name={ `email.license_expiring_soon.customer.is_enable` }
					value={
						email?.license_expiring_soon?.customer?.is_enable
					}
					setFieldValue={ setFieldValue }
					suffix="email-checkbox"
				/>
			</div>
			<ReactModal
				isOpen={ modalOpen }
				onRequestClose={ onRequestClose }
				title={ __( 'License Expiring Soon', 'storeengine' ) }
				suffix="email"
				size="large"
				isSmallAvailable={ false }
			>
				<UserForm
					index={ 'license_expiring_soon' }
					subIndex={ 'customer' }
					recipients={ false }
					description={ __(
						'Reminder sent before a manual-renew license expires.',
						'storeengine'
					) }
				/>
			</ReactModal>
		</div>
	);
};

export default LicenseExpiringSoon;
