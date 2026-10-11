import React from 'react';
import Number from '@Components/Formik/Number';
import Text from '@Components/Formik/Text';
import Checkbox from '@Components/Formik/Checkbox';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import { Field, useFormikContext } from 'formik';
import { __ } from '@wordpress/i18n';
import { Scope } from '@Components/ui';

import '../../styles.scss';
import './styles.scss';

const referralOptions = [
	{
		label: __( 'First Referrer', 'storeengine' ),
		value: 'first',
	},
	{
		label: __( 'Last Referrer', 'storeengine' ),
		value: 'last',
	},
];
const referralLinkTargetOptions = [
	{
		label: __( 'Store Page', 'storeengine' ),
		value: 'shop',
	},
	{
		label: __( 'Full Website', 'storeengine' ),
		value: 'home',
	},
];
const commissionOptions = [
	{
		label: __( 'Percentage', 'storeengine' ),
		value: 'percentage',
	},
	{
		label: __( 'Flat', 'storeengine' ),
		value: 'flat',
	},
];
const Affiliate = () => {
	const { values } = useFormikContext();
	// Commission Rate reads as a percentage or a flat currency amount depending
	// on the selected Commission Type — show the matching indicator on the input.
	const commissionType = values?.affiliate?.commission_type;

	return (
		<Scope>
			<div className="storeengine-content-section storeengine-content-section--settings-affiliate">
				<h2 className="storeengine-heading">
					{ __( 'Referral Tracking', 'storeengine' ) }
				</h2>
				<Checkbox
					title={ __( 'Allow Referral Tracking', 'storeengine' ) }
					subtitle={ __(
						'Track affiliate referrals on this site. Want to add tracking to a different site?',
						'storeengine'
					) }
					name="affiliate.allow_referral_tracking"
				/>
				<div className="storeengine-settings-affiliate__referral-type mb-6">
					<p className="storeengine-title-subtitle storeengine-mb-2">
						<span className="storeengine-title">
							{ __( 'Referral Type', 'storeengine' ) }
						</span>
						<span className="storeengine-sub-title">
							{ __(
								'Should the first or last referrer be credited?',
								'storeengine'
							) }
						</span>
					</p>

					<div className="storeengine-settings-affiliate__referral-type-options">
						{ referralOptions.map( ( item, index ) => (
							<label
								className="storeengine-radio-option"
								key={ index }
								htmlFor={ `referral_type-${ index }` }
							>
								<Field
									id={ `referral_type-${ index }` }
									name="affiliate.referral_type"
									type="radio"
									value={ item.value }
									className="storeengine-radio"
								/>
								<span className="storeengine-sub-title-bold storeengine-mr-2">
									{ item.label }
								</span>
							</label>
						) ) }
					</div>
				</div>
				<Number
					title={ __( 'Referral Tracking Length', 'storeengine' ) }
					subtitle={ __(
						'How many days should the tracking code last for?',
						'storeengine'
					) }
					suffix="referral-tracking-length"
					name="affiliate.referral_tracking_length"
				/>
				<div className="flex items-start gap-4 justify-between mt-6">
					<p className="storeengine-title-subtitle">
						<span className="storeengine-title">
							{ __( 'Referral Link Target', 'storeengine' ) }
						</span>
						<span className="storeengine-sub-title">
							{ __(
								'Where should the generated referral link point — the store page or the full website?',
								'storeengine'
							) }
						</span>
					</p>

					{ referralLinkTargetOptions.map( ( item, index ) => (
						<label
							className="storeengine-radio-option"
							key={ index }
							htmlFor={ `referral_link_target-${ index }` }
						>
							<Field
								id={ `referral_link_target-${ index }` }
								name="affiliate.referral_link_target"
								type="radio"
								value={ item.value }
								className="storeengine-radio"
							/>
							<span className="storeengine-sub-title-bold whitespace-nowrap storeengine-mr-2">
								{ item.label }
							</span>
						</label>
					) ) }
				</div>
			</div>

			<div className="storeengine-content-section storeengine-content-section--settings-affiliate">
				<h2 className="storeengine-heading">
					{ __( 'Registration', 'storeengine' ) }
				</h2>
				<Text
					name="affiliate.terms_url"
					type="url"
					title={ __(
						'Terms & Conditions Page / Link',
						'storeengine'
					) }
					subtitle={ __(
						'Set your affiliate terms page or any URL. When set, the "I agree to the affiliate program terms & conditions" text on the registration form links to it.',
						'storeengine'
					) }
					placeholder="https://your-site.com/affiliate-terms"
					prefix="affiliate-terms-url"
				/>
			</div>

			<div className="storeengine-content-section storeengine-content-section--settings-affiliate">
				<h2 className="storeengine-heading">
					{ __( 'Commissions & Payouts', 'storeengine' ) }
				</h2>
				<div className="form-group form-group__radio storeengine-mb-6">
					<p className="storeengine-title-subtitle storeengine-mb-6">
						<span className="storeengine-title-bold">
							{ __( 'Commission', 'storeengine' ) }
						</span>
						<span className="storeengine-sub-title-bold">
							{ __(
								'How much an affiliate should receive in commission.',
								'storeengine'
							) }
						</span>
					</p>
					<div className="storeengine-mb-6 storeengine-settings-affiliate__commission-type">
						<p className="storeengine-title-subtitle storeengine-mb-2">
							<span className="storeengine-title">
								{ __( 'Commission Type', 'storeengine' ) }
							</span>
						</p>

						{ commissionOptions.map( ( item, index ) => (
							<label
								className="storeengine-radio-option storeengine-settings-affiliate__commission-type-options"
								key={ index }
								htmlFor={ `commission_type-${ index }` }
							>
								<Field
									id={ `commission_type-${ index }` }
									name="affiliate.commission_type"
									type="radio"
									value={ item.value }
									className="storeengine-radio"
								/>
								<span className="storeengine-sub-title-bold storeengine-mr-2">
									{ item.label }
								</span>
							</label>
						) ) }
					</div>
					<Number
						title={ __( 'Commission Rate', 'storeengine' ) }
						suffix="commission-rate"
						name="affiliate.commission_rate"
						percentage={ 'percentage' === commissionType }
						currency={ 'flat' === commissionType ? true : null }
					/>
					<Checkbox
						title={ __( 'Allow Auto Commission', 'storeengine' ) }
						subtitle={ __(
							'Do you want to award auto commissions on future purchases?',
							'storeengine'
						) }
						name="affiliate.allow_auto_commission"
					/>
					<Checkbox
						title={ __( 'Allow Self-Referral', 'storeengine' ) }
						subtitle={ __(
							'Let affiliates earn a commission on their own purchases. Off by default to prevent self-referral abuse.',
							'storeengine'
						) }
						name="affiliate.allow_self_referral"
					/>
				</div>
				<Checkbox
					title={ __( 'Allow Zero Commission', 'storeengine' ) }
					subtitle={ __(
						'Do you want to award commissions on future purchases?',
						'storeengine'
					) }
					name="affiliate.allow_zero_commission"
					suffix="allow-zero-commission"
				/>
			</div>

			<div className="storeengine-content-section storeengine-mb-0 storeengine-pb-0">
				<h3 className="storeengine-heading">
					{ __( 'Withdrawal', 'storeengine' ) }
				</h3>
				<Number
					name="affiliate.minimum_withdraw_amount"
					title={ __( 'Minimum Withdrawal Amount', 'storeengine' ) }
					subtitle={ __(
						'Instructors should earn equal or above this amount to make a withdraw request.',
						'storeengine'
					) }
					suffix="minimum-withdraw-amount"
				/>
				<Checkbox
					name="affiliate.is_enabled_paypal_withdraw"
					title={ __( 'Enable PayPal', 'storeengine' ) }
				/>
				<Checkbox
					name="affiliate.is_enabled_echeck_withdraw"
					title={ __( 'Enable E-Check', 'storeengine' ) }
				/>
				<Checkbox
					name="affiliate.is_enabled_bank_withdraw"
					title={ __( 'Enable Bank Transfer', 'storeengine' ) }
				/>
				{ /* {is_enabled_bank_withdraw && (
					<Textarea
						name="affiliate.withdraw_instruction"
						title={__('Instruction', 'storeengine')}
						desc={__( 'Write instruction for the instructor to fill bank information', 'storeengine' )}
					/>
				)} */ }
			</div>
		</Scope>
	);
};

export default Affiliate;
