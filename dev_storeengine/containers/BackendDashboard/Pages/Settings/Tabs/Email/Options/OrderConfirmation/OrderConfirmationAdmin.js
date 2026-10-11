import React, { useState } from 'react';
import UserForm from '../../EmailForm/UserForm';
import { __ } from '@wordpress/i18n';
import { Button } from '@Components/ui';
import ReactModal from '@Components/Modal/ReactModal';
import { useFormikContext } from 'formik';
import Checkbox from '@Components/Formik/Checkbox';

const OrderConfirmationAdmin = () => {
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
					{ __( 'To Admin', 'storeengine' ) }
				</span>
				<span className="storeengine-sub-title">
					{ __(
						'Notifies admin upon order confirmation approval.',
						'storeengine'
					) }
				</span>
			</div>

			<div className="storeengine-settings-email-template__body">
				<Button
					preset="outline"
					icon="storeengine-icon--edit-two"
					onClick={ () => isModalOpen( ! modalOpen ) }
				>
					{ __( 'Edit Template', 'storeengine' ) }
				</Button>

				<Checkbox
					name={ `email.order_confirmation.admin.is_enable` }
					value={ email?.order_confirmation?.admin?.is_enable }
					setFieldValue={ setFieldValue }
					suffix="email-checkbox"
				/>
			</div>
			<ReactModal
				isOpen={ modalOpen }
				onRequestClose={ onRequestClose }
				title={ __( 'Order Confirmation Admin', 'storeengine' ) }
				suffix="email"
				size="large"
				isSmallAvailable={ false }
			>
				<UserForm
					index={ 'order_confirmation' }
					subIndex={ 'admin' }
					recipients={ false }
					description={ __(
						'Notifies admin upon order confirmation approval.',
						'storeengine'
					) }
				/>
			</ReactModal>
		</div>
	);
};

export default OrderConfirmationAdmin;
