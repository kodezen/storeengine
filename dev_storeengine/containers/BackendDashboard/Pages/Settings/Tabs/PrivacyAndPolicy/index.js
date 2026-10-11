import React from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import PostSelect from '@Components/PostSelect';
import { Scope } from '@Components/ui';
import './styles.scss';

const PrivacyAndPolicy = () => {
	return (
		<Scope
			as="div"
			id="privacyAndPolicy"
			className="storeengine-tab-content storeengine-tab-content-privacyAndPolicy"
		>
			<div className="storeengine-tab-content--section">
				<h2 className="storeengine-heading">
					{ __( 'Privacy & Policy', 'storeengine' ) }
				</h2>
				<Checkbox
					title={ __( 'Enable privacy policy', 'storeengine' ) }
					name="enable_privacy_policy"
					suffix="privacyAndPolicy-checkbox"
				/>
			</div>
			<div className="storeengine-tab-content--section">
				<h2 className="section-title">
					{ __( 'Checkout privacy policy', 'storeengine' ) }
				</h2>
				<Checkbox
					title={ __(
						'Enable checkout privacy policy',
						'storeengine'
					) }
					name="enable-checkout-privacy-policy"
					suffix="privacyAndPolicy-checkbox"
				/>
			</div>
			<div className="storeengine-tab-content--section">
				<Checkbox
					title={ __( 'Enable Account Creation', 'storeengine' ) }
					name="enable_account_creation"
					suffix="privacyAndPolicy-checkbox"
				/>
				<PostSelect
					title={ __( 'Privacy Policy Page', 'storeengine' ) }
					name="privacy_policy_page"
					postType="page"
				/>
				<PostSelect
					title={ __( 'Terms & Conditions Page', 'storeengine' ) }
					name="terms_and_conditions_page"
					postType="page"
				/>
				<Checkbox
					title={ __( 'Enable Guest Checkout', 'storeengine' ) }
					name="enable_guest_checkout"
					suffix="privacyAndPolicy-checkbox"
				/>
			</div>
		</Scope>
	);
};

export default PrivacyAndPolicy;
