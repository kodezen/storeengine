import React from 'react';
import StoreEngineSelect from '@Components/StoreEngineSelect';
import Text from '@Components/Formik/Text';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { EmbRichText } from '@Components/EmbEmailEditor';
import { useSelector } from 'react-redux';
import { getAddonActiveStatus } from '@Utils/helper';

import StoreEngineSeparator from '@Components/StoreEngineSeparator';
// options
import OrderConfirmationAdmin from './Options/OrderConfirmation/OrderConfirmationAdmin';
import OrderConfirmationCustomer from './Options/OrderConfirmation/OrderConfirmationCustomer';
import OrderInvoiceCustomer from './Options/OrderInvoice/OrderInvoiceCustomer';
import OrderNoteCustomer from './Options/OrderNote/OrderNoteCustomer';
import OrderShipped from './Options/OrderShipped';
import OrderDelivered from './Options/OrderDelivered';
import OrderCancelled from './Options/OrderCancelled';
import OrderRefundCustomer from './Options/OrderRefund/OrderRefundCustomer';
import OrderStatusCustomer from './Options/OrderStatus/OrderStatusCustomer';
import {
	ReturnApprovedCustomer,
	ReturnShippedCustomer,
	ReturnReceivedCustomer,
	ReturnRefundedCustomer,
} from './Options/Returns';
import {
	AffiliateRegistered,
	AffiliateApproved,
	AffiliateRejected,
	AffiliateSuspended,
	AffiliateCommissionApproved,
	AffiliatePayoutCompleted,
} from './Options/Affiliate';
import NewUserNotification from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/NewUserNotification/NewUserNotification';
import AbandonedCheckoutFirst from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/AbandonedCheckoutFirst';
import AbandonedCheckoutSecond from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/AbandonedCheckoutSecond';
import AbandonedCheckoutThird from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/AbandonedCheckoutThird';
import OrderPaymentFailed from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/OrderPaymentFailed';
import PasswordReset from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/PasswordReset';
import RegistrationWelcome from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/RegistrationWelcome';
import SubscriptionCancelled from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/SubscriptionCancelled';
import SubscriptionRenewed from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/SubscriptionRenewed';
import TrialEndingSoon from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/TrialEndingSoon';
import InstallmentPaymentFailed from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/InstallmentPaymentFailed';
import LicenseRenewalFailed from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/LicenseRenewalFailed';
import LicenseExpiringSoon from '@Containers/BackendDashboard/Pages/Settings/Tabs/Email/Options/LicenseExpiringSoon';

import './styles.scss';

// @TODO implement both (html with text alt body)
const contentTypeOptions = [
	{ value: 'plainText', label: 'Plain Text' },
	{ value: 'html', label: 'HTML' },
];

const Email = () => {
	const { values, setFieldValue } = useFormikContext();
	const { email } = values;
	const addonsSavedData = useSelector( ( state ) => state.addons );
	const isActiveInvoice = addonsSavedData?.invoice;
	const isActiveSubscription = getAddonActiveStatus(
		addonsSavedData,
		'subscription'
	);
	const isActiveInstallment = getAddonActiveStatus(
		addonsSavedData,
		'installment-plan',
		true
	);
	const isActiveLicense = getAddonActiveStatus(
		addonsSavedData,
		'license-management',
		true
	);
	const isActiveReturns = getAddonActiveStatus(
		addonsSavedData,
		'returns',
		true
	);
	const isActiveAffiliate = getAddonActiveStatus(
		addonsSavedData,
		'affiliate'
	);

	return (
		<div className='flex flex-col se-admin-tw'>
			<div className="storeengine-content-section storeengine-content-section--email">
				<div className="storeengine-settings-tab-content__email">
					<h2 className="storeengine-heading">
						{ __( 'General', 'storeengine' ) }
					</h2>
					<h4 className="storeengine-title">
						{ __(
							'For all outgoing StoreEngine notification emails.',
							'storeengine'
						) }
					</h4>
					<Text
						name="email.form_name"
						title={ __( 'Name', 'storeengine' ) }
						subtitle={ __(
							'The common name for all the outgoing emails.',
							'storeengine'
						) }
						placeholder={ __( 'Sender Name', 'storeengine' ) }
						value={ email?.form_name }
						setFieldValue={ setFieldValue }
						prefix="email-name"
					/>
					<Text
						name="email.email_address"
						title={ __( 'E-Mail Address', 'storeengine' ) }
						subtitle={ __(
							'All emails will be send from this email address.',
							'storeengine'
						) }
						placeholder={ __( 'Sender E-Mail', 'storeengine' ) }
						value={ email?.email_address }
						setFieldValue={ setFieldValue }
						prefix="email-address"
					/>
				</div>
			</div>

			<div className='bg-white px-6 pt-6 rounded border border-solid border-[var(--storeengine-border-color)] mb-6'>
				<h4 className="storeengine-heading">
					{ __( 'Email Template', 'storeengine' ) }
				</h4>

				<div className="storeengine-flex storeengine-mb-6">
					<div className="storeengine-title-subtitle">
						<span className="storeengine-title">
							{ __( 'Content Type', 'storeengine' ) }
						</span>
						<span className="storeengine-sub-title">
							{ __( 'Select content type', 'storeengine' ) }
						</span>
					</div>
					<StoreEngineSelect
						name="email.email_content_type"
						className="storeengine-select storeengine-select--email "
						suffix="content-type"
						options={ contentTypeOptions }
						value={ contentTypeOptions.find(
							( item ) => item.value === email?.email_content_type
						) }
						onChangeHandler={ ( options ) =>
							setFieldValue( 'email.email_content_type', options )
						}
					/>
				</div>

				<div className="form-group form-group--footer-text mb-6">
					<div className="storeengine-title">
						{ __( 'Footer Text', 'storeengine' ) }
					</div>
					<div className="form-body">
						<EmbRichText
							value={ email?.footer_text }
							onChange={ ( html ) =>
								setFieldValue( 'email.footer_text', html )
							}
						/>
					</div>
				</div>

				<div className="storeengine-email-group">
					<h3 className='storeengine-heading'>
						{ __( 'New User Notification', 'storeengine' ) }
					</h3>
					<NewUserNotification />
				</div>

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Registration Welcome', 'storeengine' ) }
					</h3>
					<RegistrationWelcome />
				</div>

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Password Reset', 'storeengine' ) }
					</h3>
					<PasswordReset />
				</div>

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Order Confirmation', 'storeengine' ) }
					</h3>
					<OrderConfirmationCustomer />
					<OrderConfirmationAdmin />
				</div>

				{ isActiveInvoice && (
					<div className="storeengine-email-group mt-16">
						<h3 className='storeengine-heading'>
							{ __( 'Order Invoice', 'storeengine' ) }
						</h3>
						<OrderInvoiceCustomer />
					</div>
				) }

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Order Note', 'storeengine' ) }
					</h3>
					<OrderNoteCustomer />
				</div>

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Order Shipped', 'storeengine' ) }
					</h3>
					<OrderShipped />
				</div>

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Order Delivered', 'storeengine' ) }
					</h3>
					<OrderDelivered />
				</div>

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Order Refund', 'storeengine' ) }
					</h3>
					<OrderRefundCustomer />
				</div>

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Order Cancelled', 'storeengine' ) }
					</h3>
					<OrderCancelled />
				</div>

				{ isActiveReturns && (
					<div className="storeengine-email-group mt-16">
						<h3 className='storeengine-heading'>
							{ __( 'Returns', 'storeengine' ) }
						</h3>
						<ReturnApprovedCustomer />
						<ReturnShippedCustomer />
						<ReturnReceivedCustomer />
						<ReturnRefundedCustomer />
					</div>
				) }

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Order Status', 'storeengine' ) }
					</h3>
					<OrderStatusCustomer />
				</div>

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Order Payment Failed', 'storeengine' ) }
					</h3>
					<OrderPaymentFailed />
				</div>

				{ isActiveSubscription && (
					<div className="storeengine-email-group mt-16">
						<h3 className='storeengine-heading'>
							{ __( 'Subscription', 'storeengine' ) }
						</h3>
						<SubscriptionCancelled />
						<SubscriptionRenewed />
						<TrialEndingSoon />
					</div>
				) }

				{ isActiveInstallment && (
					<div className="storeengine-email-group mt-16">
						<h3 className='storeengine-heading'>
							{ __( 'Installment Plan', 'storeengine' ) }
						</h3>
						<InstallmentPaymentFailed />
					</div>
				) }

				{ isActiveLicense && (
					<div className="storeengine-email-group mt-16">
						<h3 className='storeengine-heading'>
							{ __( 'License Management', 'storeengine' ) }
						</h3>
						<LicenseRenewalFailed />
						<LicenseExpiringSoon />
					</div>
				) }

				{ isActiveAffiliate && (
					<div className="storeengine-email-group mt-16">
						<h3 className='storeengine-heading'>
							{ __( 'Affiliate', 'storeengine' ) }
						</h3>
						<AffiliateRegistered />
						<AffiliateApproved />
						<AffiliateRejected />
						<AffiliateSuspended />
						<AffiliateCommissionApproved />
						<AffiliatePayoutCompleted />
					</div>
				) }

				<div className="storeengine-email-group mt-16">
					<h3 className='storeengine-heading'>
						{ __( 'Abandoned Checkout', 'storeengine' ) }
					</h3>
					<AbandonedCheckoutFirst />
					<AbandonedCheckoutSecond />
					<AbandonedCheckoutThird />
				</div>
			</div>
		</div>
	);
};

export default Email;
