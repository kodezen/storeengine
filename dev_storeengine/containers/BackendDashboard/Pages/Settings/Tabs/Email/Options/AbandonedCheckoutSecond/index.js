import React, { useState } from 'react';
import UserForm from '../../EmailForm/UserForm';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import ReactModal from '@Components/Modal/ReactModal';
import { Button } from '@Components/ui';
import Checkbox from '@Components/Formik/Checkbox';

const AbandonedCheckoutSecond = () => {
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
					{ __( 'Reminder #2', 'storeengine' ) }
				</span>
				<span className="storeengine-sub-title">
					{ __(
						'Second email sent when a checkout is abandoned.',
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
					name={ `email.abandoned_cart_second.customer.is_enable` }
					value={ email?.abandoned_cart_second?.customer?.is_enable }
					setFieldValue={ setFieldValue }
					suffix="email-checkbox"
				/>
			</div>
			<ReactModal
				isOpen={ modalOpen }
				onRequestClose={ onRequestClose }
				title={ __( 'Abandoned Cart Recovery #2', 'storeengine' ) }
				suffix="email"
				size="large"
				isSmallAvailable={ false }
			>
				<UserForm
					index={ 'abandoned_cart_second' }
					subIndex={ 'customer' }
					recipients={ false }
					description={ __(
						'Second email sent when a checkout is abandoned.',
						'storeengine'
					) }
				/>
			</ReactModal>
		</div>
	);
};

export default AbandonedCheckoutSecond;
