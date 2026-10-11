import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Formik, Form, Field, useFormikContext } from 'formik';
import { makeRequest2, getAddonActiveStatus } from '@Utils/helper';
import { Button } from '@Components/ui';
import { initialValues } from './helper';
import { useDispatch, useSelector } from 'react-redux';
import PriceTypes from './components/PriceTypes';
import CommonFields from './components/CommonFields';
import OneTimeOptions from './components/price-options/OneTimeOptions';
import SubscriptionOptions from './components/price-options/SubscriptionOptions';
import InstallmentPlanOptions from './components/price-options/InstallmentPlanOptions';
import LicenseOptions from './components/price-options/LicenseOptions';
import PriceTypeOptions from './components/PriceTypeOptions';
import DonationOptions from './components/DonationOptions';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

import './styles.scss';

/**
 * Get Payment Types.
 *
 * @param {{[key:string]:boolean}} allAddons
 * @param {StoreEngineProduct}     productData
 * @return {{[key: string]: {label: string, isDisabled: boolean, component: function({priceProps: *}): *}}}
 */
const getPaymentTypes = ( allAddons, productData ) => ( {
	onetime: {
		label: __( 'One Time', 'storeengine' ),
		isDisabled: false,
		component: OneTimeOptions,
	},
	subscription: {
		label: __( 'Subscription', 'storeengine' ),
		isDisabled:
			! getAddonActiveStatus( allAddons, 'subscription' ) ||
			productData.product_type === 'bundled',
		tooltip: __( 'Subscription Addon is required.', 'storeengine' ),
		component: SubscriptionOptions,
	},
	'installment-plan': {
		label: __( 'Installment Plan', 'storeengine' ),
		isDisabled: ! getAddonActiveStatus( allAddons, 'installment-plan' ),
		tooltip: __(
			'Installment/subscription payment addon is required.',
			'storeengine'
		),
		component: InstallmentPlanOptions,
	},
} );

const EditPriceInner = ( {
	priceProps,
	productValues,
	paymentTypes,
	editingPrice,
	setEditingPrice,
	isLicenseAddonActive,
} ) => {
	return (
		<Form onSubmit={ priceProps.handleSubmit }>
			<div className="storeengine-mb-6">
				<label htmlFor="price_name" className="storeengine-title">
					{ __( 'Price Label', 'storeengine' ) }
				</label>

				<Field
					id="price_name"
					className="storeengine-input storeengine-mt-2"
					name="price_name"
					placeholder={ __(
						'Monthly, Lifetime, etc.',
						'storeengine'
					) }
				/>
			</div>

			{ ! editingPrice?.price_type && (
				<div className="storeengine-column-items storeengine-mt-6 storeengine-mb-6">
					<div className="storeengine-title storeengine-pointer">
						{ __( 'Price Type', 'storeengine' ) }
					</div>
					<div className="storeengine-product-editor-pricing__payment-type">
						{ Object.entries( paymentTypes ).map(
							( [ value, option ], index ) => (
								<PriceTypes
									key={ index }
									option={ {
										label: option.label,
										value,
										isDisabled: option.isDisabled,
										tooltip: option.tooltip,
									} }
									current={ priceProps.values.price_type }
									setFieldValue={ priceProps.setFieldValue }
								/>
							)
						) }
					</div>
				</div>
			) }

			<CommonFields />

			{ /* Pricing mode (price type) above the price fields. */ }
			<DonationOptions priceProps={ priceProps } section="mode" />

			<PriceTypeOptions
				priceProps={ priceProps }
				price_type={ priceProps.values.price_type }
				paymentTypes={ paymentTypes }
			/>

			<DonationOptions priceProps={ priceProps } section="details" />

			{ isLicenseAddonActive &&
				productValues?.meta
					?._storeengine_product_enable_license_creation && (
					<LicenseOptions priceProps={ priceProps } />
				) }

			<div className="storeengine-price-action">
				<Button
					preset="primary"
					onClick={ priceProps.submitForm }
					isLoading={ priceProps.isSubmitting }
					disabled={ ! priceProps.dirty }
					size="sm"
				>
					{ priceProps.values.id
						? __( 'Update Price', 'storeengine' )
						: __( 'Add Price', 'storeengine' ) }
				</Button>

				<Button
					onClick={ () => setEditingPrice( null ) }
					size="sm"
					preset="outline"
				>
					{ __( 'Cancel', 'storeengine' ) }
				</Button>
			</div>
		</Form>
	);
};

const EditPrice = ( props ) => {
	const { editingPrice, setLoading, setEditingPrice } = props;
	const { values, setFieldValue } = useFormikContext();
	const allAddons = useSelector( ( state ) => state.addons );
	const dispatch = useDispatch();
	const paymentTypes = React.useMemo(
		() => getPaymentTypes( allAddons, values ),
		[ allAddons, values ]
	);
	const isLicenseAddonActive = React.useMemo(
		() => getAddonActiveStatus( allAddons, 'license-management' ),
		[ allAddons ]
	);

	const validatePrice = ( priceFormValues ) => {
		if ( ! values?.id ) {
			// Product not saved.
			throw new Error(
				__(
					'Please Save Your product first then you will be able to add price.',
					'storeengine'
				)
			);
		}

		if ( priceFormValues.price_name === '' ) {
			throw new Error( __( 'Price title missing.', 'storeengine' ) );
		}

		if ( priceFormValues.price === '' ) {
			throw new Error( __( 'Price Missing.', 'storeengine' ) );
		}

		// Compare-at price is optional: only enforce "must be higher than the
		// price" when a positive compare price is actually entered.
		if (
			parseFloat( priceFormValues.compare_price ) > 0 &&
			parseFloat( priceFormValues.compare_price ) <=
				parseFloat( priceFormValues.price )
		) {
			throw new Error(
				__(
					'Compare price cannot be equal or less than actual price.',
					'storeengine'
				)
			);
		}

		if ( 'installment-plan' === priceFormValues.price_type ) {
			if (
				'' === priceFormValues?.down_payment ||
				isNaN( priceFormValues?.down_payment ) ||
				parseFloat( priceFormValues?.down_payment ) <= 0
			) {
				throw new Error(
					__( 'Invalid deposit amount.', 'storeengine' )
				);
			}

			if ( ! priceFormValues?.installments?.length ) {
				throw new Error(
					__( 'Installment payment plan is required.', 'storeengine' )
				);
			}

			const iSum = priceFormValues?.installments.reduce(
				( total, { percentage } ) => total + parseFloat( percentage ),
				parseFloat( priceFormValues?.down_payment )
			);

			if ( 100 > iSum || iSum > 100 ) {
				throw new Error(
					sprintf(
						// translators: %s. Installment total amount calculated from installment rules.
						__(
							'Installment total amount needs to be 100%. %s%% calculated.',
							'storeengine'
						),
						iSum.toString()
					)
				);
			}
		}

		/*if ( priceFormValues.enable_license_activation_limit && !priceFormValues.license_activation_limit ) {
      throw new Error( __( 'Invalid license activation limit.', 'storeengine' ) )
    }*/
	};

	return (
		<Formik
			enableReinitialize={ true }
			initialValues={ initialValues( editingPrice ) }
			onSubmit={ async ( priceFormValues, actions ) => {
				setLoading( true );
				actions.setSubmitting( true );

				try {
					validatePrice( priceFormValues );
				} catch ( error ) {
					dispatch(
						showNotification( {
							message: error.message,
							isShow: true,
							type: 'error',
						} )
					);
					actions.setSubmitting( false );
					setLoading( false );
					return;
				}

				try {
					const commonValues = {
						price_name: priceFormValues.price_name,
						price: priceFormValues.price,
						// Optional: store null (not 0) when no compare price set.
						compare_price:
							parseFloat( priceFormValues.compare_price ) > 0
								? priceFormValues.compare_price
								: null,
						price_type: priceFormValues.price_type,
						upgradeable: priceFormValues.upgradeable,
						enable_license_activation_limit:
							priceFormValues.enable_license_activation_limit,
						license_activation_limit:
							priceFormValues.license_activation_limit,
						// Name-your-price / donation config (donation addon).
						donation: priceFormValues.donation,
					};

					if ( 'onetime' === priceFormValues.price_type ) {
						commonValues.expire = priceFormValues.expire;
						commonValues.expire_days = priceFormValues.expire_days;
					}

					if ( 'subscription' === priceFormValues.price_type ) {
						commonValues.payment_duration =
							priceFormValues.payment_duration;
						commonValues.payment_duration_type =
							priceFormValues.payment_duration_type;
						commonValues.setup_fee = priceFormValues.setup_fee;
						commonValues.setup_fee_name =
							priceFormValues.setup_fee_name;
						commonValues.setup_fee_price =
							priceFormValues.setup_fee_price;
						commonValues.setup_fee_type =
							priceFormValues.setup_fee_type;
						commonValues.trial = priceFormValues.trial;
						commonValues.trial_days = priceFormValues.trial_days;
					}

					if ( 'installment-plan' === priceFormValues.price_type ) {
						commonValues.down_payment =
							priceFormValues.down_payment;
						commonValues.installments =
							priceFormValues.installments;
					}

					if ( editingPrice?.id ) {
						const response = await makeRequest2(
							'update_product_price',
							{
								product_id: values.id,
								id: editingPrice?.id,
								...commonValues,
							}
						);

						setFieldValue(
							'prices',
							values.prices.map( ( price ) =>
								parseInt( price?.id ) ===
								parseInt( response.id )
									? { price, ...response }
									: price
							)
						);
					} else {
						const response = await makeRequest2(
							'create_product_price',
							{ product_id: values.id, ...commonValues }
						);

						setFieldValue( 'prices', [
							...values.prices,
							response,
						] );
					}

					// Reset only if succeeded.
					actions.resetForm();
					setEditingPrice( false );
				} catch ( error ) {
					dispatch(
						showNotification( {
							message: error,
							isShow: true,
							type: 'error',
						} )
					);
				} finally {
					actions.setSubmitting( false );
					setLoading( false );
				}
			} }
		>
			{ ( priceFormProps ) => {
				return (
					<EditPriceInner
						priceProps={ priceFormProps }
						productValues={ values }
						paymentTypes={ paymentTypes }
						editingPrice={ editingPrice }
						setEditingPrice={ setEditingPrice }
						isLicenseAddonActive={ isLicenseAddonActive }
					/>
				);
			} }
		</Formik>
	);
};

export default React.memo( EditPrice );
