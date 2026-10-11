import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import UserForm from '../../EmailForm/UserForm';
import ReactModal from '@Components/Modal/ReactModal';
import { Button } from '@Components/ui';
import Checkbox from '@Components/Formik/Checkbox';

/**
 * Generic row component for the affiliate notification emails. Same shape as
 * the Returns rows — only the settings key, modal title, short title, and
 * subtitle differ. Settings live under email.<name>.customer, matching the
 * backend classes in addons/email/affiliate/*.php.
 */
const AffiliateEmailRow = ( { name, title, subtitle, shortTitle } ) => {
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

export const AffiliateRegistered = () => (
	<AffiliateEmailRow
		name="affiliate_registered"
		shortTitle={ __( 'Registered', 'storeengine' ) }
		title={ __( 'Affiliate Registered', 'storeengine' ) }
		subtitle={ __(
			'Acknowledges a new affiliate application while it awaits review.',
			'storeengine'
		) }
	/>
);

export const AffiliateApproved = () => (
	<AffiliateEmailRow
		name="affiliate_approved"
		shortTitle={ __( 'Approved', 'storeengine' ) }
		title={ __( 'Affiliate Approved', 'storeengine' ) }
		subtitle={ __(
			'Welcomes the affiliate once their account is activated, with their referral code.',
			'storeengine'
		) }
	/>
);

export const AffiliateRejected = () => (
	<AffiliateEmailRow
		name="affiliate_rejected"
		shortTitle={ __( 'Rejected', 'storeengine' ) }
		title={ __( 'Affiliate Rejected', 'storeengine' ) }
		subtitle={ __(
			'Notifies the applicant that their affiliate application was not approved.',
			'storeengine'
		) }
	/>
);

export const AffiliateSuspended = () => (
	<AffiliateEmailRow
		name="affiliate_suspended"
		shortTitle={ __( 'Suspended', 'storeengine' ) }
		title={ __( 'Affiliate Suspended', 'storeengine' ) }
		subtitle={ __(
			'Notifies the affiliate that their account has been suspended and tracking is paused.',
			'storeengine'
		) }
	/>
);

export const AffiliateCommissionApproved = () => (
	<AffiliateEmailRow
		name="affiliate_commission_approved"
		shortTitle={ __( 'Commission Approved', 'storeengine' ) }
		title={ __( 'Affiliate Commission Approved', 'storeengine' ) }
		subtitle={ __(
			'Congratulates the affiliate when a commission is approved, to keep them promoting.',
			'storeengine'
		) }
	/>
);

export const AffiliatePayoutCompleted = () => (
	<AffiliateEmailRow
		name="affiliate_payout_completed"
		shortTitle={ __( 'Payout Sent', 'storeengine' ) }
		title={ __( 'Affiliate Payout Completed', 'storeengine' ) }
		subtitle={ __(
			'Confirms to the affiliate that their payout has been processed, with amount and reference.',
			'storeengine'
		) }
	/>
);
