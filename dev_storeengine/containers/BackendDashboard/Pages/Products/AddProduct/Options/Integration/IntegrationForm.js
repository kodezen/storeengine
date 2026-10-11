import React, { useEffect, useMemo, useState } from 'react';
import { Form, Formik, useFormikContext } from 'formik';
import { __ } from '@wordpress/i18n';
import { Select as Select2 } from '@Components/ui/Select';
import { makeRequest2, integrations } from '@Utils/helper';
import IntegrationItems from './integrationItems';
import { Button } from '@Components/ui';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

const noPriceOption = [
	{
		label: __( 'Please create prices first', 'storeengine' ),
		value: '',
	},
];

const IntegrationForm = ( { isOpenIntegrationForm } ) => {
	const { values, setFieldValue } = useFormikContext();
	const dispatch = useDispatch();
	const [ prices, setPrices ] = useState(
		values?.prices.reduce( ( acc, current ) => {
			acc.push( {
				label: current.price,
				value: current.id,
			} );
			return acc;
		}, [] )
	);

	return (
		<Formik
			initialValues={ {
				product_id: values?.id,
				provider: '',
				price_id: '',
				integration_id: '',
			} }
			onSubmit={ async ( priceFormValues, actions ) => {
				actions.setSubmitting( true );
				if (
					priceFormValues.provider !== 'storeengine/course-bundle' &&
					! priceFormValues.provider
				) {
					dispatch(
						showNotification( {
							message: __(
								'Please Select Provider First',
								'storeengine'
							),
							isShow: true,
							type: 'error',
						} )
					);
					actions.setSubmitting( false );
					return;
				}

				if (
					priceFormValues.integration_id &&
					! priceFormValues.price_id
				) {
					dispatch(
						showNotification( {
							message: __(
								'Please Select A Price First',
								'storeengine'
							),
							isShow: true,
							type: 'error',
						} )
					);
					actions.setSubmitting( false );
					return;
				}

				if (
					priceFormValues.provider !== 'storeengine/course-bundle' &&
					! priceFormValues.integration_id
				) {
					dispatch(
						showNotification( {
							message: __(
								'Please Select an Integration Item',
								'storeengine'
							),
							isShow: true,
							type: 'error',
						} )
					);
					actions.setSubmitting( false );
					return;
				}

				if ( ! values?.id ) {
					dispatch(
						showNotification( {
							message: __(
								'Please Save Your product first then you will be able to add integration',
								'storeengine'
							),
							isShow: true,
							type: 'error',
						} )
					);
					return;
				}

				try {
					const res = await makeRequest2(
						'create_product_integration',
						{ ...priceFormValues, product_id: values?.id }
					);
					setFieldValue( 'integrations', [
						...values.integrations,
						{ ...res, ...priceFormValues },
					] );
					actions.resetForm();
					isOpenIntegrationForm( false ); // Close the form after submission
				} catch ( e ) {
					dispatch(
						showNotification( {
							message: e,
							isShow: true,
							type: 'error',
						} )
					);
				}

				actions.setSubmitting( false );
			} }
		>
			{ ( integrationFormProps ) => {
				const menuOpenHandle = () => {
					setPrices(
						values?.prices.reduce( ( acc, current ) => {
							acc.push( {
								label: current.price,
								value: current.id,
							} );
							return acc;
						}, [] )
					);
				};

				const isTargetUsed = values.integrations.some(
					( item ) => item.provider === 'storeengine/course-bundle'
				);
				const filteredOptions = isTargetUsed
					? integrations.filter(
							( option ) =>
								option.value !== 'storeengine/course-bundle'
					  )
					: integrations;

				return (
					<Form className="se-admin-tw storeengine-pb-6">
						<React.Fragment>
							<label
								className="storeengine-title"
								htmlFor="integration-with"
							>
								{ __( 'Integration', 'storeengine' ) }
							</label>
							<Select2
								id="integration-with"
								placeholder={ __(
									'Make Integration With',
									'storeengine'
								) }
								name="provider"
								options={ filteredOptions }
								value={
									integrations
										? integrations?.find(
												( option ) =>
													option.value ===
													integrationFormProps.values
														?.provider
										  )
										: {}
								}
								onChange={ ( option ) => {
									integrationFormProps.setFieldValue(
										'provider',
										option.value
									);
								} }
								className="storeengine-select storeengine-select--integration-with"
								classNamePrefix="storeengine-react-select"
							/>
						</React.Fragment>
						{ integrationFormProps.values?.provider && (
							<IntegrationItems
								provider={
									integrationFormProps.values.provider
								}
								setFieldValue={
									integrationFormProps.setFieldValue
								}
							/>
						) }

						{ ( integrationFormProps?.values?.integration_id ||
							integrationFormProps.values.provider ===
								'storeengine/course-bundle' ) && (
							<div className="storeengine-pt-6">
								<label
									className="storeengine-title"
									htmlFor="integration-price-id"
								>
									{ __( 'Select A Price', 'storeengine' ) }
								</label>
								<Select2
									id="integration-price-id"
									placeholder={ __(
										'Select A Price',
										'storeengine'
									) }
									name="price_id"
									options={
										prices.length ? prices : noPriceOption
									}
									value={
										integrationFormProps.values?.price_id &&
										prices?.find(
											( option ) =>
												option.value ===
												integrationFormProps.values
													?.price_id
										)
									}
									onChange={ ( option ) => {
										integrationFormProps.setFieldValue(
											'price_id',
											option.value
										);
									} }
									className="storeengine-select storeengine-select--select-a-price"
									classNamePrefix="storeengine-react-select"
									onMenuOpen={ menuOpenHandle }
								/>
							</div>
						) }

						<div className="storeengine-content-section--form-actions">
							<Button
								type="button"
								preset="outline"
								onClick={ () => isOpenIntegrationForm( false ) }
							>
								{ __( 'Cancel', 'storeengine' ) }
							</Button>
							<Button
								type="button"
								onClick={ integrationFormProps.submitForm }
								disabled={ ! integrationFormProps.dirty }
							>
								{ __( 'Add Integration', 'storeengine' ) }
							</Button>
						</div>
					</Form>
				);
			} }
		</Formik>
	);
};

export default IntegrationForm;
