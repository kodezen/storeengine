import React from 'react';
import Number from '@Components/Formik/Number';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import { Select as Select2 } from '@Components/ui/Select';

import { paymentDurations, trialDaysType } from '../../helper.js';
import { useFormikContext } from 'formik';

const SubscriptionOptions = ( { priceProps, isSingle = false } ) => {
	const { submitForm } = useFormikContext();
	return (
		<>
			<div className="storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center storeengine-repeated-type">
				<Number
					title={ __(
						'Set Repeated payment in every *',
						'storeengine'
					) }
					placeholder=""
					name="payment_duration"
					prefix="payment-duration"
					onBlur={ () => isSingle && submitForm() }
				/>
				<Select2
					placeholder={ __( 'Payment Duration Type', 'storeengine' ) }
					name="payment_duration_type"
					options={ paymentDurations }
					value={
						priceProps.values.payment_duration_type
							? paymentDurations.find(
									( o ) =>
										o.value ===
										priceProps.values.payment_duration_type
							  )
							: paymentDurations[ 2 ]
					}
					onChange={ ( o ) =>
						priceProps.setFieldValue(
							'payment_duration_type',
							o.value
						)
					}
					className="storeengine-select storeengine-select--integration-with"
					classNamePrefix="storeengine-react-select"
				/>
			</div>

			<Checkbox
				title={ __( 'Setup Fee', 'storeengine' ) }
				name="setup_fee"
				onBlur={ () => isSingle && submitForm() }
			/>

			{ priceProps.values.setup_fee && (
				<div className="storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center storeengine-setup-fee">
					<Text
						title={ __( 'Setup Fee Name', 'storeengine' ) }
						name="setup_fee_name"
						onBlur={ () => isSingle && submitForm() }
					/>
					<Number
						title={ __( 'Setup Fee', 'storeengine' ) }
						placeholder={ __( 'E.G. 10.99', 'storeengine' ) }
						name="setup_fee_price"
						prefix="setup-fee_price"
						currency
						onBlur={ () => isSingle && submitForm() }
					/>

					{ /*<Select2
                 placeholder="Setup Fee Type"
                 name="setup_fee_type"
                 options={setupFee}
                 value={priceProps.values.setup_fee_type ? setupFee.find( o => o.value === priceProps.values.setup_fee_type ) : setupFee[0]}
                 onChange={o => priceProps.setFieldValue( 'setup_fee_type', o )}
                 className="storeengine-select storeengine-select--integration-with"
                 classNamePrefix="storeengine-react-select"
               />*/ }
				</div>
			) }

			<Checkbox
				title={ __( 'Trial Days', 'storeengine' ) }
				name="trial"
				isPro={ true }
				onBlur={ () => isSingle && submitForm() }
			/>

			{ priceProps.values.trial && (
				<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8 storeengine-repeated-type storeengine-mb-6">
					<Number
						name="trial_days"
						prefix="trial-days"
						suffix="product-price"
						onBlur={ () => isSingle && submitForm() }
					/>
					<Select2
						placeholder="Trial Period Unit"
						name="trial_days_type"
						options={ trialDaysType }
						value={
							priceProps.values.trial_days_type
								? trialDaysType.find(
										( o ) =>
											o.value ===
											priceProps.values.trial_days_type
								  )
								: trialDaysType[ 0 ]
						}
						onChange={ ( o ) =>
							priceProps.setFieldValue( 'trial_days_type', o )
						}
						className="storeengine-select storeengine-select--integration-with"
						classNamePrefix="storeengine-react-select"
						onBlur={ () => isSingle && submitForm() }
					/>
				</div>
			) }

			{ /* <Checkbox title={ __( 'Upgradeable', 'storeengine' ) } subtitle={ __( 'Enable it if your product is upgradable.', 'storeengine' ) } name="upgradeable" direction={ true } /> */ }
		</>
	);
};

export default SubscriptionOptions;
