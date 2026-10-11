import React from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import { EmbBuilder, encodeTree, decodeTree } from '@Components/EmbEmailEditor';
import { useFormikContext } from 'formik';
import Preview from './../../Preview';
import TestMail from './../../TestMail';

const EmailForm = () => {
	const { values, setFieldValue } = useFormikContext();
	const { email } = values;
	const descriptionVariable = {
		email_verify_verification:
			'{verify_email_link} {user_display_name} {site_title} {site_url}',
	};

	return (
		<div className="storeengine-email-setting-wrap-common-wrapper">
			<div className="storeengine-email-setting-wrap">
				<div className="storeengine-email-settings-control">
					<div className="storeengine-email-settings-control__actions">
						<TestMail
							templateName={ 'email_verify' }
							templateSubName={ '' }
						/>
						<Preview
							templateName={ 'email_verify' }
							templateSubName={ '' }
						/>
					</div>
					<Checkbox
						name={ `email.email_verify.is_enable` }
						title={ __( 'Enable/Disable', 'storeengine' ) }
						description={ __(
							'Require new users to verify their email address to register.',
							'storeengine'
						) }
						value={ email?.email_verify?.is_enable }
						setFieldValue={ setFieldValue }
						suffix="email-checkbox"
					/>
					<div className="storeengine-email-settings-control__row">
						<Text
							name={ `email.email_verify.email_subject` }
							title={ __( 'Subject', 'storeengine' ) }
							subtitle={
								'Variables: {user_display_name} {site_title} {site_url}'
							}
							value={ email?.email_verify?.email_subject }
							setFieldValue={ setFieldValue }
							prefix="email-text-field"
						/>

						<Text
							name={ `email.email_verify.email_heading` }
							title={ __( 'Email Heading', 'storeengine' ) }
							subtitle={
								'Variables: {user_display_name} {site_title} {site_url}'
							}
							value={ email?.email_verify?.email_heading }
							setFieldValue={ setFieldValue }
							prefix="email-text-field"
						/>
					</div>
					<div className="form-group form-group--additional-content">
						<div className="form-info">
							<label htmlFor={ `email_verify.email_content` }>
								{ __( 'Additional Content', 'storeengine' ) }
							</label>
						</div>
						<div className="form-body">
							<EmbBuilder
								key="email_verify"
								header={ false }
								value={ email?.email_verify?.email_content }
								tree={ decodeTree(
									email?.email_verify?.email_content_tree
								) }
								tokens={ (
									descriptionVariable?.email_verify_verification ||
									''
								)
									.split( /\s+/ )
									.filter( Boolean ) }
								onChange={ ( { tree, html } ) => {
									setFieldValue(
										`email.email_verify.email_content`,
										html
									);
									setFieldValue(
										`email.email_verify.email_content_tree`,
										encodeTree( tree )
									);
								} }
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EmailForm;
