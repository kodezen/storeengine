import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import UserForm from '../../EmailForm/UserForm';
import ReactModal from '@Components/Modal/ReactModal';
import { Button } from '@Components/ui';
import Checkbox from '@Components/Formik/Checkbox';

/**
 * Generic row component for the four return transactional emails. Shape
 * is identical to the existing OrderRefundCustomer.js — only the keys,
 * title, and subtitle differ between rows.
 */
const ReturnEmailRow = ( { name, title, subtitle, shortTitle } ) => {
	const { values, setFieldValue } = useFormikContext();
	const { email } = values || {};
	const [ open, setOpen ] = useState( false );

	return (
		<div className="storeengine-settings-email-template se-admin-tw">
			<div className="storeengine-title-subtitle">
				<span className="storeengine-title">{ shortTitle }</span>
				<span className="storeengine-sub-title">{ subtitle }</span>
			</div>
			<div className="storeengine-settings-email-template__body">
				<Button
					preset="outline"
					icon="storeengine-icon--edit-two"
					onClick={ () => setOpen( true ) }
				>
					{ __( 'Edit Template', 'storeengine' ) }
				</Button>
				<Checkbox
					name={ `email.${ name }.customer.is_enable` }
					value={ email?.[ name ]?.customer?.is_enable }
					setFieldValue={ setFieldValue }
					suffix="email-checkbox"
				/>
			</div>
			<ReactModal
				isOpen={ open }
				onRequestClose={ () => setOpen( false ) }
				title={ title }
				suffix="email"
				size="large"
				isSmallAvailable={ false }
			>
				<UserForm
					index={ name }
					subIndex="customer"
					recipients={ false }
					description={ subtitle }
				/>
			</ReactModal>
		</div>
	);
};

export const ReturnApprovedCustomer = () => (
	<ReturnEmailRow
		name="return_approved"
		shortTitle={ __( 'Approved', 'storeengine' ) }
		title={ __( 'Return Approved (Customer)', 'storeengine' ) }
		subtitle={ __(
			'Sent when staff approves a return request; gives the customer the return shipping address.',
			'storeengine'
		) }
	/>
);

export const ReturnShippedCustomer = () => (
	<ReturnEmailRow
		name="return_shipped"
		shortTitle={ __( 'Shipped', 'storeengine' ) }
		title={ __( 'Return Shipped (Customer)', 'storeengine' ) }
		subtitle={ __(
			'Confirms tracking + courier details the customer submitted after posting the package.',
			'storeengine'
		) }
	/>
);

export const ReturnReceivedCustomer = () => (
	<ReturnEmailRow
		name="return_received"
		shortTitle={ __( 'Received', 'storeengine' ) }
		title={ __( 'Return Received (Customer)', 'storeengine' ) }
		subtitle={ __(
			'Sent once the package arrives at the warehouse.',
			'storeengine'
		) }
	/>
);

export const ReturnRefundedCustomer = () => (
	<ReturnEmailRow
		name="return_refunded"
		shortTitle={ __( 'Refunded', 'storeengine' ) }
		title={ __( 'Return Refunded (Customer)', 'storeengine' ) }
		subtitle={ __(
			'Final receipt with the refund amount, sent when the refund is processed.',
			'storeengine'
		) }
	/>
);
