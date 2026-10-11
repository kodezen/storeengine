import React, { useState, useEffect } from 'react';
import Checkbox from '@Components/Formik/Checkbox';
import Preloader from '@Components/Loader/Preloader';
import Preview from './../Preview';
import TestMail from './../TestMail';
import Text from '@Components/Formik/Text';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import './styles.scss';
import AutoSave from '@Components/Formik/AutoSave';
import { EmbBuilder, encodeTree, decodeTree } from '@Components/EmbEmailEditor';
import { useSelector } from 'react-redux';

const UserForm = ( { index, subIndex, recipients, description } ) => {
	const { values, setFieldValue } = useFormikContext();
	const { email } = values;
	const addonsSavedData = useSelector( ( state ) => state.addons );
	const isActiveInvoiceAddon = addonsSavedData?.invoice;
	const invoice = isActiveInvoiceAddon ? '{invoice_button}' : '';
	const [ isContentLoading, setContentLoading ] = useState( true );
	// These hints must mirror what the corresponding email handler ACTUALLY
	// replaces. Keep this file in sync with:
	//   - addons/email/traits/email.php :: get_email_subject() / get_order_email_body()
	//   - addons/email/order/*.php (per-class str_replace additions like
	//     {order_old_status}, {order_new_status}, {order_note}, {order_refunds})
	//   - addons/email/order/abstract-abandoned-cart-mail.php (cart context)
	//   - addons/email/account/password-reset.php, order/new-user-notification.php
	//   - addons-pro/license-management/emails/* (license-specific tokens)
	// A token listed here but not provided in code will mislead admins into
	// using a placeholder that leaks raw; a token provided in code but missing
	// here means admins can't discover a working variable.
	const orderSubjectTokens =
		'{user_display_name} {order_billing_first_name} {order_billing_last_name} {order_id} {site_title} {site_url}';
	const orderBodyTokens = `{user_display_name} {user_email} {order_billing_first_name} {order_billing_last_name} {order_billing_email} {order_id} {order_created_date} {order_payment_method} {order_items} {order_totals} {site_title} {site_url} ${ invoice }`;
	// Shipment lifecycle tokens (Order Shipped / Order Delivered) — mirror the
	// tokens filled in addons/email/order/item-shipped.php and order/delivered.php.
	const shipmentTokens =
		'{shipped_item_name} {shipment_status} {shipment_courier} {shipment_tracking_number} {shipment_tracking_url} {shipment_tracking_link}';
	const abandonedCartSubjectTokens =
		'{user_display_name} {customer_first_name} {customer_last_name} {site_title} {site_url}';
	const abandonedCartBodyTokens =
		'{user_display_name} {user_email} {customer_first_name} {customer_last_name} {order_billing_first_name} {order_billing_last_name} {order_billing_email} {order_billing_phone} {abandoned_cart_button} {abandoned_cart_discount} {abandoned_cart_discount_amount} {abandoned_cart_discount_code} {abandoned_cart_discount_expired_in} {cart_items} {cart_totals} {site_title} {site_url}';
	// Affiliate emails — mirror the tokens filled in addons/email/affiliate/*.php.
	const affiliateSubjectTokens =
		'{affiliate_name} {affiliate_email} {site_title} {site_url} {store_name}';
	const affiliateBodyTokens =
		'{affiliate_name} {affiliate_email} {referral_code} {site_title} {site_url} {store_name}';
	const affiliatePayoutBodyTokens =
		'{affiliate_name} {affiliate_email} {payout_amount} {payout_method} {payout_transaction_id} {site_title} {site_url} {store_name}';

	const subjectVariable = {
		order_confirmation_admin: orderSubjectTokens,
		order_confirmation_customer: orderSubjectTokens,
		order_invoice_customer: orderSubjectTokens,
		order_note_customer: orderSubjectTokens,
		order_refund_customer: orderSubjectTokens,
		order_status_customer: orderSubjectTokens,
		order_cancelled_customer: orderSubjectTokens,
		order_item_shipped_customer: `${ orderSubjectTokens } ${ shipmentTokens }`,
		order_delivered_customer: `${ orderSubjectTokens } ${ shipmentTokens }`,
		affiliate_registered_customer: affiliateSubjectTokens,
		affiliate_approved_customer: affiliateSubjectTokens,
		affiliate_rejected_customer: affiliateSubjectTokens,
		affiliate_suspended_customer: affiliateSubjectTokens,
		affiliate_commission_approved_customer: affiliateSubjectTokens,
		affiliate_payout_completed_customer: affiliateSubjectTokens,
		new_user_notification_customer:
			'{user_display_name} {site_title} {site_url} {store_name}',
		abandoned_cart_first_customer: abandonedCartSubjectTokens,
		abandoned_cart_second_customer: abandonedCartSubjectTokens,
		abandoned_cart_third_customer: abandonedCartSubjectTokens,
		order_payment_failed_customer: orderSubjectTokens,
		order_payment_failed_admin: orderSubjectTokens,
		password_reset_customer:
			'{user_display_name} {site_title} {site_url} {store_name}',
		registration_welcome_customer:
			'{user_display_name} {user_login} {user_email} {site_title} {site_url} {store_name}',
		subscription_cancelled_customer: orderSubjectTokens,
		subscription_renewed_customer: orderSubjectTokens,
		trial_ending_soon_customer: orderSubjectTokens,
		installment_payment_failed_customer: orderSubjectTokens,
		license_renewal_failed_customer:
			'{user_display_name} {product_name} {license_key} {expires_at} {site_title} {site_url}',
		license_expiring_soon_customer:
			'{user_display_name} {product_name} {license_key} {expires_at} {days_left} {site_title} {site_url}',
	};
	const descriptionVariable = {
		order_confirmation_admin: orderBodyTokens,
		order_confirmation_customer: orderBodyTokens,
		order_invoice_customer: orderBodyTokens,
		// Note hook adds {order_note} on top of standard order tokens.
		order_note_customer: `{order_note} ${ orderBodyTokens }`,
		// Refund hook adds {order_refunds}.
		order_refund_customer: `{order_refunds} ${ orderBodyTokens }`,
		// Status hook adds {order_old_status} / {order_new_status}.
		order_status_customer: `{order_old_status} {order_new_status} ${ orderBodyTokens }`,
		order_cancelled_customer: orderBodyTokens,
		order_item_shipped_customer: `${ orderBodyTokens } ${ shipmentTokens }`,
		order_delivered_customer: `${ orderBodyTokens } ${ shipmentTokens }`,
		affiliate_registered_customer: affiliateBodyTokens,
		affiliate_approved_customer: affiliateBodyTokens,
		affiliate_rejected_customer: affiliateSubjectTokens,
		affiliate_suspended_customer: affiliateSubjectTokens,
		affiliate_commission_approved_customer: `{affiliate_name} {affiliate_email} {commission_amount} {order_id} {site_title} {site_url} {store_name}`,
		affiliate_payout_completed_customer: affiliatePayoutBodyTokens,
		new_user_notification_customer: `{user_display_name} {user_login} {user_email} {user_password} {set_password_link} {set_password_url} {user_first_name} {user_last_name} {store_name} {sign_in_url} {site_title} {site_url}`,
		abandoned_cart_first_customer: abandonedCartBodyTokens,
		abandoned_cart_second_customer: abandonedCartBodyTokens,
		abandoned_cart_third_customer: abandonedCartBodyTokens,
		order_payment_failed_customer: orderBodyTokens,
		order_payment_failed_admin: orderBodyTokens,
		password_reset_customer: `{user_display_name} {user_login} {user_email} {reset_url} {site_title} {site_url} {store_name}`,
		registration_welcome_customer: `{user_display_name} {user_login} {user_email} {login_url} {site_title} {site_url} {store_name}`,
		subscription_cancelled_customer: orderBodyTokens,
		subscription_renewed_customer: orderBodyTokens,
		trial_ending_soon_customer: orderBodyTokens,
		installment_payment_failed_customer: orderBodyTokens,
		license_renewal_failed_customer: `{user_display_name} {product_name} {license_key} {expires_at} {failed_order_url} {license_dashboard_url} {site_title} {site_url} {store_name}`,
		license_expiring_soon_customer: `{user_display_name} {product_name} {license_key} {expires_at} {days_left} {license_dashboard_url} {site_title} {site_url} {store_name}`,
	};

	const isEnabled = !! email[ index ][ subIndex ]?.is_enable;

	useEffect( () => {
		if ( index && subIndex ) {
			setContentLoading( true );
			setTimeout( () => {
				setContentLoading( false );
			}, 2000 );
		}
	}, [ index, subIndex ] );

	return (
		<div className="storeengine-email-setting-wrap">
			{ ! isContentLoading ? (
				<>
					<AutoSave />
					<div className="storeengine-email-settings-control">
						<div className="storeengine-email-settings-control__top-actions">
							<Checkbox
								name={ `email.${ index }.${ subIndex }.is_enable` }
								title={ __( 'Enable/Disable', 'storeengine' ) }
								subtitle={ description }
								value={ email[ index ][ subIndex ]?.is_enable }
								setFieldValue={ setFieldValue }
								suffix="settings-email-checkbox"
							/>
						
							<div className="storeengine-email-settings-control__actions">
								<TestMail
									templateName={ index }
									templateSubName={ subIndex }
									disabled={ ! isEnabled }
								/>
								<Preview
									templateName={ index }
									templateSubName={ subIndex }
								/>
							</div>
						</div>

						{ recipients === true && (
							<Text
								name={ `email.${ index }.${ subIndex }.email_recipient` }
								title={ __( 'Recipients(s)', 'storeengine' ) }
								value={
									email[ index ][ subIndex ]?.email_recipient
								}
								setFieldValue={ setFieldValue }
								prefix="email-text-field"
							/>
						) }

						<div className="storeengine-email-settings-control__row">
							<Text
								name={ `email.${ index }.${ subIndex }.email_subject` }
								title={ __( 'Subject', 'storeengine' ) }
								subtitle={ `Variables: ${
									subjectVariable[
										`${
											subIndex
												? index + '_' + subIndex
												: index
										}`
									]
								}` }
								value={
									email[ index ][ subIndex ]?.email_subject
								}
								setFieldValue={ setFieldValue }
								prefix="email-text-field"
							/>

							<Text
								name={ `email.${ index }.${ subIndex }.email_heading` }
								title={ __( 'Email Heading', 'storeengine' ) }
								value={
									email[ index ][ subIndex ]?.email_heading
								}
								setFieldValue={ setFieldValue }
								prefix="email-text-field"
							/>
						</div>
						<div className="form-group form-group--additional-content">
							<div className="form-info">
								<label
									htmlFor={ `${ index }.${ subIndex }.email_content` }
								>
									{ __(
										'Additional Content',
										'storeengine'
									) }
								</label>
							</div>
							<div className="form-body">
								<EmbBuilder
									key={ `${ index }.${ subIndex }` }
									header={ false }
									value={
										email[ index ][ subIndex ]
											?.email_content
									}
									tree={ decodeTree(
										email[ index ][ subIndex ]
											?.email_content_tree
									) }
									tokens={ (
										descriptionVariable[
											`${ index }_${ subIndex }`
										] || ''
									)
										.split( /\s+/ )
										.filter( Boolean ) }
									onChange={ ( { tree, html } ) => {
										setFieldValue(
											`email.${ index }.${ subIndex }.email_content`,
											html
										);
										setFieldValue(
											`email.${ index }.${ subIndex }.email_content_tree`,
											encodeTree( tree )
										);
									} }
								/>
							</div>
						</div>
					</div>
				</>
			) : (
				<Preloader />
			) }
		</div>
	);
};

export default UserForm;
