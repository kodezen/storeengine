import React, { useState, useEffect, useMemo, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Scope, Button, Heading } from '@Components/ui';
import Search from '@Components/Search';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllProducts } from '@Redux/Slices/productsSlice/productsSlice';
import Preloader from '@Components/Loader/Preloader';

import './styles.scss';

const CouponProductManager = () => {
	const { values, setFieldValue } = useFormikContext();
	const [ openList, setOpenList ] = useState( false );
	const [ productFetchingStatus, setProductFetchingStatus ] =
		useState( false );
	const [ searchText, setSearchText ] = useState( '' );
	const products = useSelector( ( state ) => state.products );
	const dispatch = useDispatch();
	const modalRef = useRef( null );

	useEffect( () => {
		if ( ! products.data ) {
			setProductFetchingStatus( true );
			// Published only: a coupon can't target a draft product, and this
			// keeps the request within a coupon-only staffer's permissions.
			dispatch( fetchAllProducts( { status: 'publish' } ) ).then( () => {
				setProductFetchingStatus( false );
			} );
		}
	}, [ dispatch, products.data ] );

	const renderProductList = useMemo( () => {
		return products?.data?.filter( ( item ) =>
			item?.title?.rendered
				?.toLowerCase()
				.includes( searchText.toLowerCase() )
		);
	}, [ products.data, searchText ] );

	const handleSelectProduct = ( productData ) => {
		const purchaseItems = Array.isArray( values.select_items )
			? values.select_items
			: [];

		const existingProduct = purchaseItems.find(
			( item ) =>
				parseInt( item.product_id ) === parseInt( productData.id )
		);

		const updatedPurchaseItems = purchaseItems.map( ( item ) =>
			parseInt( item.product_id ) === parseInt( productData.id )
				? { ...item, ...productData }
				: item
		);

		const newItems = existingProduct
			? updatedPurchaseItems
			: [
					...updatedPurchaseItems,
					{ ...productData, product_id: productData.id },
			  ];

		setFieldValue( 'select_items', newItems );
		setOpenList( false );
	};

	const handleClickOutside = ( e ) => {
		if ( modalRef.current && ! modalRef.current.contains( e.target ) ) {
			setOpenList( false );
		}
	};

	useEffect( () => {
		if ( openList ) {
			document.addEventListener( 'mousedown', handleClickOutside );
		} else {
			document.removeEventListener( 'mousedown', handleClickOutside );
		}

		return () => {
			document.removeEventListener( 'mousedown', handleClickOutside );
		};
	}, [ openList ] );

	const handleDelete = ( productId ) => {
		const updatedItems = values.select_items.filter(
			( item ) => item.product_id !== productId
		);
		setFieldValue( 'select_items', updatedItems );
	};

	const getPriceInfo = ( prices ) => {
		const pricesKeys = Object.keys( prices );

		if ( pricesKeys.length === 1 ) {
			const singlePrice = prices[ pricesKeys[ 0 ] ];
			return `${ singlePrice.price }`;
		}
		return `${ pricesKeys.length } prices`;
	};

	return (
		<Scope as="div" className="storeengine-content-section">
			<Heading>
				{ __( 'Product Restrictions', 'storeengine' ) }
			</Heading>

			<div
				className={ `${
					( values?.select_items &&
						values.select_items.length > 0 ) ||
					openList
						? 'storeengine-coupon-product-container'
						: ''
				}` }
			>
				{ Array.isArray( values?.select_items ) &&
					values.select_items.map( ( item, index ) => {
						const productName = item?.title?.rendered;
						const priceInfo = getPriceInfo( item.prices );

						return (
							<div
								key={ index }
								className="storeengine-flex storeengine-coupon-selected-product"
							>
								<p className="storeengine-title-subtitle">
									<span className="storeengine-title">
										{ productName }
									</span>
									<span className="storeengine-sub-title">
										{ priceInfo }
									</span>
								</p>

								<Button
									icon="storeengine-icon--trash"
									onClick={ () =>
										handleDelete( item.product_id )
									}
									preset="outline"
								>
									{ __( 'Remove', 'storeengine' ) }
								</Button>
							</div>
						);
					} ) }

				{ openList && (
					<div
						role="presentation"
						className="storeengine-coupon-product-modal"
						onClick={ handleClickOutside }
					>
						<div
							className="storeengine-coupon-product-modal__content"
							ref={ modalRef }
							onClick={ ( e ) => e.stopPropagation() }
							role="presentation"
						>
							<div className="storeengine-flex storeengine-coupon-product-select__header">
								<Search
									placeholder={ __(
										'Search product',
										'storeengine'
									) }
									onSearchHandler={ ( value ) =>
										setSearchText( value )
									}
									defaultValue={
										searchText ? searchText : ''
									}
								/>
								<Button
									preset="outline"
									onClick={ () => setOpenList( false ) }
								>
									{ __( 'Close', 'storeengine' ) }
								</Button>
							</div>

							{ productFetchingStatus ? (
								<Preloader />
							) : (
								<div className="storeengine-coupon-product-select">
									{ renderProductList.length ? (
										<>
											{ renderProductList.map(
												( item, index ) => (
													<div
														role="presentation"
														key={ index }
														className="storeengine-pointer storeengine-coupon-product-select__item"
														onClick={ () =>
															handleSelectProduct(
																item
															)
														}
													>
														<p className="storeengine-title">
															<span className="storeengine-index">
																{ index + 1 }.
															</span>
															{
																item?.title
																	.rendered
															}
														</p>
													</div>
												)
											) }
										</>
									) : (
										<span>
											{ __(
												'No items found',
												'storeengine'
											) }
										</span>
									) }
								</div>
							) }
						</div>
					</div>
				) }
			</div>

			<Button
				preset="primary"
				icon="storeengine-icon--add"
				onClick={ () => setOpenList( true ) }
			>
				{ __( 'Add Product Restrictions', 'storeengine' ) }
			</Button>
		</Scope>
	);
};

export default CouponProductManager;
