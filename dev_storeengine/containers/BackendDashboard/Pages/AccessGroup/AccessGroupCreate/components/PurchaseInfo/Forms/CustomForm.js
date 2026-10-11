import React from 'react';
import Number from '@Components/Formik/Number';
import { Select } from '@Components/ui/Select';
import { __ } from '@wordpress/i18n';
import { Field, useFormikContext } from 'formik';
import { subscriptionDateType } from '../../../options';

const CustomForm = ( { priceTypes, selectedPrice } ) => {
	const { values, setFieldValue } = useFormikContext();
	return (
		<>
			{ ! selectedPrice && (
				<>
					<span className="storeengine-title storeengine-mt-4">
						{ __( 'Price Type', 'storeengine' ) }
					</span>

					<div className="storeengine-page-content__price-type-tabs storeengine-mt-2">
						{ priceTypes.map( ( priceType, index ) => {
							return (
								<label
									key={ index }
									htmlFor={ priceType.value }
									className={ `storeengine-title storeengine-d-flex storeengine-flex-gap-8 storeengine-pointer${
										priceType.isDisabled
											? ' storeengine-label-disable'
											: ''
									}` }
								>
									<Field
										name="price_type"
										type="radio"
										className="storeengine-radio"
										value={ priceType.value }
										id={ priceType.value }
										disabled={ priceType.isDisabled }
									/>
									{ priceType.label }
								</label>
							);
						} ) }
					</div>
				</>
			) }

			{ values.price_type === 'subscription' && (
				<>
				<div className="storeengine-subscription-every storeengine-mt-4">
					<span className="storeengine-subscription-every__label">
						{ __(
							'Set Repeated Payment In Every *',
							'storeengine'
						) }
					</span>
					<div className="storeengine-subsciption-fields storeengine-subscription-every__row">
						<Number
							suffix="payment-durtion storeengine-width-full"
							name="payment_duration"
							placeholder={ __( '15', 'storeengine' ) }
						/>
						<Select
							className="storeengine-select storeengine-width-full"
							classNamePrefix="storeengine-react-select"
							placeholder={ __( 'Select Type', 'storeengine' ) }
							value={
								values?.payment_duration_type
									? subscriptionDateType.find(
											( data ) =>
												data.value ===
												values?.payment_duration_type
									  )
									: []
							}
							options={ subscriptionDateType }
							onChange={ ( option ) => {
								setFieldValue(
									'payment_duration_type',
									option.value
								);
							} }
							menuPlacement="top"
						/>
					</div>
				</div>
				</>
			) }
			<div className="storeengine-mt-4 storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center">
				<Number title={ __( 'Regular', 'storeengine' ) } name="price" />
				<Number
					title={ __( 'Compare at Price', 'storeengine' ) }
					name="compare_price"
				/>
			</div>
		</>
	);
};

export default CustomForm;
