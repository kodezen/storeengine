import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import ReactModal from '@Components/Modal/ReactModal';
import { Button } from '@Components/ui';
import Checkbox from '@Components/Formik/Checkbox';
import EmailForm from './EmailForm';

const EmailVerify = () => {
	const { values, setFieldValue } = useFormikContext();
	const { email } = values;
	const [ modalOpen, isModalOpen ] = useState( false );

	const onRequestClose = () => {
		isModalOpen( false );
	};

	return (
		<div className="storeengine-settings-option se-admin-tw">
			<div className="storeengine-settings-option__title">
				<h4>{ __( 'Email Verify', 'storeengine' ) }</h4>
				<span>
					{ __(
						'Require new users to verify their email address to register.',
						'storeengine'
					) }
				</span>
			</div>
			<div className="storeengine-settings-option__body">
				<Button
					preset="ghost"
					icon="storeengine-icon--edit-two"
					onClick={ () => isModalOpen( true ) }
				>
					{ __( 'Edit Template', 'storeengine' ) }
				</Button>
				<Checkbox
					name={ `email.email_verify.is_enable` }
					value={ email?.email_verify?.is_enable }
					setFieldValue={ setFieldValue }
					suffix="email-checkbox"
				/>
			</div>
			<ReactModal
				isOpen={ modalOpen }
				onRequestClose={ onRequestClose }
				title={ __( 'Email Verify', 'storeengine' ) }
				suffix="email"
				size="large"
				isSmallAvailable={ false }
			>
				<EmailForm />
			</ReactModal>
		</div>
	);
};

export default EmailVerify;
