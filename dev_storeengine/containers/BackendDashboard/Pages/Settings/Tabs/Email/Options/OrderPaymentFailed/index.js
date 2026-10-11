import React, { useState } from 'react';
import UserForm from '../../EmailForm/UserForm';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import ReactModal from '@Components/Modal/ReactModal';
import { Button } from '@Components/ui';
import Checkbox from '@Components/Formik/Checkbox';

const OrderPaymentFailed = () => {
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
						'Notifies customer when an initial-purchase payment fails. Skips subscription/installment renewals — those have dedicated emails.',
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
					name={ `email.order_payment_failed.customer.is_enable` }
					value={ email?.order_payment_failed?.customer?.is_enable }
					setFieldValue={ setFieldValue }
					suffix="email-checkbox"
				/>
			</div>
			<ReactModal
				isOpen={ modalOpen }
				onRequestClose={ onRequestClose }
				title={ __( 'Order Payment Failed', 'storeengine' ) }
				suffix="email"
				size="large"
				isSmallAvailable={ false }
			>
				<UserForm
					index={ 'order_payment_failed' }
					subIndex={ 'customer' }
					recipients={ false }
					description={ __(
						'Notifies customer when an initial-purchase payment fails.',
						'storeengine'
					) }
				/>
			</ReactModal>
		</div>
	);
};

export default OrderPaymentFailed;
