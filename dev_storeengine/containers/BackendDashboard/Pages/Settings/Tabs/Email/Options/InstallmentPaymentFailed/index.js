import React, { useState } from 'react';
import UserForm from '../../EmailForm/UserForm';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import ReactModal from '@Components/Modal/ReactModal';
import { Button } from '@Components/ui';
import Checkbox from '@Components/Formik/Checkbox';

const InstallmentPaymentFailed = () => {
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
						'Dunning notice when a scheduled installment charge fails. Fires before the automatic retry kicks in.',
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
					name={ `email.installment_payment_failed.customer.is_enable` }
					value={
						email?.installment_payment_failed?.customer?.is_enable
					}
					setFieldValue={ setFieldValue }
					suffix="email-checkbox"
				/>
			</div>
			<ReactModal
				isOpen={ modalOpen }
				onRequestClose={ onRequestClose }
				title={ __( 'Installment Payment Failed', 'storeengine' ) }
				suffix="email"
				size="large"
				isSmallAvailable={ false }
			>
				<UserForm
					index={ 'installment_payment_failed' }
					subIndex={ 'customer' }
					recipients={ false }
					description={ __(
						'Sent when a scheduled installment payment fails.',
						'storeengine'
					) }
				/>
			</ReactModal>
		</div>
	);
};

export default InstallmentPaymentFailed;
