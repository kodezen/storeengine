import React, { useState, useEffect, useMemo } from 'react';
import Button from '@Components/Button';
import ReactModal from '@Components/Modal/ReactModal';
import Search from '@Components/Search';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { getAddonActiveStatus, numberToRoman } from '@Utils/helper';
import { fetchAllProducts } from '@Redux/Slices/productsSlice/productsSlice';
import Preloader from '@Components/Loader/Preloader';
import Currency from '@Components/Currency';
import { transformData } from '../helper';
import { decodeHtmlEntities } from '@Utils/helper';

import './styles.scss';

const ProductSelectModal = ( { addOrderItemProduct, isEmpty = false } ) => {
	const [ openList, setOpenList ] = useState( false );
	const [ productFetchingStatus, setProductFetchingStatus ] =
		useState( false );
	const [ searchText, setSearchText ] = useState( '' );
	const [ list, setList ] = useState( [] );
	const [ activeTab, setActiveTab ] = useState( 'all' ); // Manage active tab
	const products = useSelector( ( state ) => state.products );
	const { values, setFieldValue, setValues } = useFormikContext();
	const dispatch = useDispatch();
	const allAddons = useSelector( ( state ) => state.addons );
	const addons = React.useMemo(
		() => ( {
			subscription: getAddonActiveStatus( allAddons, 'subscription' ),
			installment: getAddonActiveStatus( allAddons, 'installment-plan' ),
		} ),
		[ allAddons ]
	);

	const subscriptionTab = addons.subscription
		? [
				{
					label: __( 'Subscription', 'storeengine' ),
					value: 'subscription',
				},
		  ]
		: [];
	const installmentTab = addons.installment
		? [
				{
					label: __( 'Installment', 'storeengine' ),
					value: 'installment-plan',
				},
		  ]
		: [];

	const tabs = [
		{ label: __( 'All', 'storeengine' ), value: 'all' },
		{ label: __( 'One Time', 'storeengine' ), value: 'onetime' },
		...subscriptionTab,
		...installmentTab,
	];

	const fetchProductData = async (
		status = 'publish',
		page = 1,
		per_page = 10,
		search = ''
	) => {
		setProductFetchingStatus( true );
		await dispatch(
			fetchAllProducts( {
				status,
				page,
				per_page,
				search,
			} )
		);
		setProductFetchingStatus( false );
	};

	useEffect( () => {
		( async () => {
			if ( ! products.data.length ) {
				await fetchProductData();
			}
		} )();
	}, [] );

	useEffect( () => {
		if ( products.data ) {
			setList( transformData( products.data, values ) );
		}
	}, [ products.data, values.purchase_items ] );

	const renderProductList = useMemo( () => {
		return list.map( ( product ) => {
			let filteredOptions = product.options;

			if ( activeTab === 'onetime' ) {
				filteredOptions = product.options.filter(
					( option ) => option.price_type === 'onetime'
				);
			} else if ( activeTab === 'subscription' ) {
				filteredOptions = product.options.filter(
					( option ) => option.price_type === 'subscription'
				);
			}

			return { ...product, options: filteredOptions };
		} );
	}, [ list, activeTab ] );

	const handleSelectProduct = ( { id, variation_id }, event ) => {
		event.stopPropagation();
		addOrderItemProduct( id, variation_id, 1 );
	};

	return (
		<div
			className={ `storeengine-product-select${
				isEmpty ? ' is-empty' : ''
			}` }
		>
			<Button
				label={ __( 'Add Product', 'storeengine' ) }
				suffix="select-product"
				preset={ isEmpty ? 'blue' : 'gray' }
				icon={
					<span className="storeengine-icon storeengine-icon--add"></span>
				}
				onClick={ () => setOpenList( true ) }
			/>

			<ReactModal
				title={ __( 'Select product', 'storeengine' ) }
				isOpen={ openList }
				onRequestClose={ () => setOpenList( false ) }
				suffix="select-product"
				size="medium"
				isEnabledResizer={ false }
				overlayClose={ true }
			>
				<div className="storeengine-product-select-modal-root">
				<div className="storeengine-option-list">
				<div className="storeengine-product-select-modal">
					<div className="storeengine-select-product-toolbar">
						<div className="storeengine-select-product-tabs">
							{ tabs.map( ( tab ) => (
								<Button
									key={ tab.value }
									label={ tab.label }
									className={
										activeTab === tab.value
											? 'storeengine-select-product--active'
											: 'storeengine-select-product--inactive'
									}
									onClick={ () => setActiveTab( tab.value ) }
								/>
							) ) }
						</div>

						<Search
							placeholder={ __(
								'Search product',
								'storeengine'
							) }
							onSearchHandler={ async ( value ) => {
								await fetchProductData(
									'publish',
									1,
									10,
									value
								);
								setSearchText( value );
							} }
							defaultValue={ searchText ? searchText : '' }
						/>
					</div>

					{ productFetchingStatus ? (
						<Preloader />
					) : (
						<>
							{ renderProductList.length > 0 &&
							renderProductList.some(
								( product ) => product.options?.length > 0
							) ? (
								<div
									role="presentation"
									className="storeengine-option-list-products-wrap"
								>
									{ renderProductList
										.map( ( product ) => {
											if (
												! product.options?.length
											) {
												return null;
											}

											if ( activeTab === 'all' ) {
												return product;
											}

											const filteredOptions =
												product.options.filter(
													( option ) =>
														option.price_type ===
														activeTab
												);

											if (
												! filteredOptions.length
											) {
												return null;
											}

											return {
												...product,
												options: filteredOptions,
											};
										} )
										.filter( Boolean )
										.map( ( product, index ) => (
											<div
												className="storeengine-option-list-products storeengine-mt-2"
												key={ index }
											>
												<span className="storeengine-option-list-products__title">
													{ decodeHtmlEntities(
														product?.label
													) }
												</span>

												<div className="storeengine-flex storeengine-flex-column">
													{ product?.options?.map(
														(
															listItem,
															itemIndex
														) => (
															<div
																key={
																	itemIndex
																}
																role="presentation"
																className="storeengine-prices-details"
																onClick={ (
																	e
																) =>
																	handleSelectProduct(
																		listItem,
																		e
																	)
																}
															>
																<p className="storeengine-prices-details__name">
																	<span className="storeengine-index">
																		{ `#${ listItem?.id } -` }
																	</span>
																	{ decodeHtmlEntities(
																		listItem?.label ??
																			listItem?.price_name
																	) }
																</p>

																<div className="storeengine-flex storeengine-prices-details__price">
																	<Currency
																		value={
																			listItem?.price
																		}
																	/>

																	<p className="storeengine-option-list-prices-details__items">
																		{
																			listItem?.payment_type
																		}

																		{ listItem?.price_type ===
																			'subscription' && (
																			<>
																				(
																				{
																					listItem
																						?.settings
																						?.payment_duration
																				}
																				&nbsp;
																				{
																					listItem
																						?.settings
																						?.payment_duration_type
																				}

																				)
																			</>
																		) }
																	</p>
																</div>

																{ /* {listItem?.compare_price && (
																<p className="storeengine-option-list-prices-details__items">
																	&nbsp;{'- '}&nbsp;<del>{listItem?.compare_price}</del>
																</p>
																)} */ }

																{ /* <p className="storeengine-option-list-prices-details__items">
																<span className="storeengine-title">
																	{__('Setup fee price', 'storeengine')}:
																</span>
																&nbsp;
																<Currency value={listItem?.settings?.setup_fee_price} />
																</p> */ }
															</div>
														)
													) }
												</div>
											</div>
										) ) }
								</div>
							) : (
								<p className="storeengine-empty-list">
									{ __(
										'No product found or product is already selected',
										'storeengine'
									) }
								</p>
							) }
						</>
					) }
				</div>
				</div>
				</div>
			</ReactModal>
		</div>
	);
};

export default ProductSelectModal;
