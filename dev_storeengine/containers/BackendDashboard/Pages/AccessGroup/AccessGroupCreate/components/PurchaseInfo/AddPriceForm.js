import { __ } from '@wordpress/i18n';
import { Formik, useFormikContext } from 'formik';
import { Select as Select2 } from '@Components/ui/Select';
import { Button } from '@Components/ui';
import { getAddonActiveStatus, makeRequest2 } from '@Utils/helper';
import { useDispatch, useSelector } from 'react-redux';
import Tooltip from '@Components/Tooltip';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { useCallback, useEffect, useState } from 'react';
import debounce from 'just-debounce-it';
import PredefinedForm from './Forms/PredefinedForm';
import CustomForm from './Forms/CustomForm';

import '../../../styles.scss';
export const prefferedProductTypes = [
	{
		label: __( 'Predefined', 'storeengine' ),
		value: 'predefined',
	},
	{
		label: __( 'Custom', 'storeengine' ),
		value: 'custom',
	},
];
const AddPriceForm = ( {
	selectedPrice,
	setSelectedPrice,
	setShowForm,
	isNewProduct,
	newProduct,
	prices,
} ) => {
	const {
		values: membershipValues,
		setFieldValue,
		submitForm,
	} = useFormikContext();
	const dispatch = useDispatch();
	const allAddons = useSelector( ( state ) => state.addons );

	const [ products, setProducts ] = useState( [] );
	const [ productsPrices, setProductsPrices ] = useState( [] );
	const [ fetcingData, setFetcingData ] = useState( false );
	const isProductSelected = selectedPrice && selectedPrice?.product_id;

	const onSearchHandler = async ( search = '' ) => {
		try {
			setFetcingData( true );
			await makeRequest2( 'get_product_list', {
				integration_id: membershipValues?.id,
				search,
			} ).then( ( res ) => {
				setProducts( res );
				setFetcingData( false );
			} );
		} catch ( error ) {
			dispatch(
				showNotification( {
					message: error,
					isShow: true,
					type: 'error',
				} )
			);
		}
	};

	const debouncedAPICall = useCallback(
		debounce( ( keyword ) => {
			onSearchHandler( keyword );
		}, 1000 ),
		[ onSearchHandler ]
	);

	useEffect( () => {
		if ( prices?.length > 0 ) {
			const list = prices.map( ( p ) => ( {
				value: p.product_id,
				label: p.product_name,
			} ) );
			setProducts( list );
		}
	}, [ prices ] );

	const onSubmitHandler = ( values, actions ) => {
		actions.setSubmitting( true );

		if ( ! membershipValues.title || ! membershipValues.id ) {
			dispatch(
				showNotification( {
					message: __(
						'Please create membership to add price',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
		} else {
			const newPrice = { ...values };
			let currentPrices = membershipValues?.prices || [];

			if ( ! values.price ) {
				dispatch(
					showNotification( {
						message: __( 'Price. is Missing', 'storeengine' ),
						isShow: true,
						type: 'error',
					} )
				);
				actions.setSubmitting( false );
			} else if (
				parseInt( values.compare_price ) < parseInt( values.price )
			) {
				dispatch(
					showNotification( {
						message: __(
							'Compare price has to be grater then price.',
							'storeengine'
						),
						isShow: true,
						type: 'error',
					} )
				);
				actions.setSubmitting( false );
			} else {
				if ( ! newPrice.id ) {
					currentPrices = [ ...currentPrices, newPrice ];
				} else {
					currentPrices = currentPrices.map( ( item ) =>
						parseInt( item.id ) === parseInt( newPrice.id )
							? { ...item, ...newPrice }
							: item
					);
				}
				setFieldValue( 'prices', currentPrices );
				setTimeout( () => {
					submitForm();
				}, 1000 );
				actions.setSubmitting( false );
				setShowForm( false );
				setSelectedPrice( null );
			}
		}
	};

	const priceTypes = [
		{
			label: __( 'One Time', 'storeengine' ),
			value: 'onetime',
		},
		{
			label: (
				<span className="storeengine-pointer-none">
					{ __( 'Subscription', 'storeengine' ) }
					{ ! getAddonActiveStatus( allAddons, 'subscription' ) && (
						<Tooltip>
							{ __(
								'Subscription Addon is required.',
								'storeengine'
							) }
						</Tooltip>
					) }
				</span>
			),
			value: 'subscription',
			isDisabled: ! getAddonActiveStatus( allAddons, 'subscription' ),
		},
	];
	return (
		<Formik
			enableReinitialize={ true }
			initialValues={ {
				price_type: 'onetime',
				order: 0,
				...( newProduct ? { type: 'custom' } : {} ),
				...selectedPrice,
			} }
			onSubmit={ onSubmitHandler }
		>
			{ ( {
				values: purchaseInfoValues,
				submitForm: purchaseInfoSubmitter,
				setFieldValue: purchaseInfoFieldHandler,
				isSubmitting,
				resetForm,
				setValues,
			} ) => {
				return (
					<div className="storeengine-add-price-form">
						<div className="storeengine-page-content__price-type">
							<label className="storeengine-add-store-product__label">
								{ __( 'Product', 'storeengine' ) }
							</label>
							<Select2
								className="storeengine-select storeengine-width-full storeengine-mt-4"
								classNamePrefix="storeengine-react-select"
								placeholder={ __(
									'Create or Select Product',
									'storeengine'
								) }
								isDisabled={ isProductSelected }
								value={
									isProductSelected
										? {
												value: selectedPrice?.product_id,
												label: selectedPrice?.product_name,
										  }
										: purchaseInfoValues?.product_id
										? products.find(
												( item ) =>
													purchaseInfoValues?.product_id ===
													item.value
										  )
										: null
								}
								onChange={ ( option ) => {
									if ( option ) {
										purchaseInfoFieldHandler(
											'product_id',
											option?.value
										);
										purchaseInfoFieldHandler(
											'type',
											'predefined'
										);
										setProductsPrices(
											option?.prices.map( ( item ) => ( {
												label: item.price,
												value: item.id,
											} ) )
										);
									} else {
										isNewProduct( true );
										purchaseInfoFieldHandler(
											'type',
											'custom'
										);
										purchaseInfoFieldHandler(
											'product_id',
											0
										);
										resetForm();
									}
								} }
								onInputChange={ debouncedAPICall }
								onMenuOpen={ debouncedAPICall }
								isLoading={ fetcingData }
								options={ products }
								isClearable={ true }
								isMulti={ false }
							/>
							<div className="storeengine-field-label storeengine-field-label__warning ">
								{ __(
									'Select a product or a new one will be created automatically.',
									'storeengine'
								) }
								<br />
							</div>
							{ ! selectedPrice &&
								newProduct &&
								purchaseInfoValues.product_id && (
									<div className="storeengine-preffered-store-product-types  storeengine-mt-4">
										{ prefferedProductTypes.map(
											( item, index ) => {
												return (
													<div
														onClick={ () => {
															setValues( {
																product_id:
																	purchaseInfoValues.product_id,
																price_type:
																	'onetime',
																order: 0,
																...( newProduct
																	? {
																			type: 'custom',
																	  }
																	: {} ),
																...selectedPrice,
															} );
															purchaseInfoFieldHandler(
																'type',
																item.value
															);
														} }
														className={ `storeengine-preffered-store-product-type ${
															purchaseInfoValues.type ===
																item.value &&
															'is-selected'
														} ${
															! purchaseInfoValues.product_id &&
															'is-disabled'
														}` }
														key={ index }
													>
														{ item.label }
													</div>
												);
											}
										) }
									</div>
								) }
							{ purchaseInfoValues.type === 'predefined' ? (
								<PredefinedForm
									productsPrices={ productsPrices }
									products={ products }
								/>
							) : (
								<CustomForm
									priceTypes={ priceTypes }
									selectedPrice={ selectedPrice }
								/>
							) }
							<div className="storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center">
								<Button
									preset="primary"
									size="sm"
									isLoading={ isSubmitting }
									onClick={ purchaseInfoSubmitter }
								>
									{ selectedPrice?.id
										? __( 'Update Price', 'storeengine' )
										: __( 'Add Price', 'storeengine' ) }
								</Button>
								<Button
									size="sm"
									preset="ghost"
									onClick={ () => {
										setSelectedPrice( null );
										setShowForm( false );
									} }
								>
									{ __( 'Cancel', 'storeengine' ) }
								</Button>
							</div>
						</div>
					</div>
				);
			} }
		</Formik>
	);
};

export default AddPriceForm;
