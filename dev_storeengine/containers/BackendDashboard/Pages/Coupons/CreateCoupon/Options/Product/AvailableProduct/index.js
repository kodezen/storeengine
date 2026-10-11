import React, { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { fetchAllProducts } from '@Redux/Slices/productsSlice/productsSlice';
import CustomTableMessage from '@Components/Oops/CustomTableMessage';
import Preloader from '@Components/Loader/Preloader';
import { useDispatch, useSelector } from 'react-redux';
import { sliceString } from '@Utils/helper';
import { Scope, Checkbox } from '@Components/ui';

const headingsArray = [ 'Product', 'Available', 'Price' ];

const Products = ( {
	handleSelectedAllProduct,
	handleSelectProduct,
	selectedProduct,
	allSelected,
} ) => {
	const products = useSelector( ( state ) => state.products );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState( false );
	const dispatch = useDispatch();

	useEffect( () => {
		if (
			! products.data ||
			( products.data && products.data.length <= 1 )
		) {
			setDataFetchingStatus( true );
			// Published only: a coupon can't target a draft product, and this
			// keeps the request within a coupon-only staffer's permissions.
			dispatch( fetchAllProducts( { status: 'publish' } ) ).then( () => {
				setDataFetchingStatus( false );
			} );
		}
	}, [] );

	return (
		<Scope as="div" className="storeengine-product-list">
			<div className="storeengine-product-list__head">
				<Checkbox
					aria-label={ __( 'Select all products', 'storeengine' ) }
					onChange={ ( checked, e ) =>
						handleSelectedAllProduct( products, e )
					}
					checked={ allSelected }
				/>
				{ headingsArray.map( ( item, index ) => (
					<span
						key={ index }
						className="storeengine-product-list__head--item"
					>
						{ sprintf(
							// translators: %s: Product heading.
							__( 'Products %s', 'storeengine' ),
							item
						) }
					</span>
				) ) }
			</div>
			<div className="storeengine-product-list__body">
				{ dataFetchingStatus ? (
					<Preloader />
				) : (
					<>
						{ products?.data ? (
							<>
								{ products?.data.map( ( item ) => (
									<div
										className="storeengine-product-list__body--item"
										key={ item.id }
									>
										<div className="storeengine-product-item-data">
											<Checkbox
												aria-label={ __( 'Select product', 'storeengine' ) }
												onChange={ ( checked ) =>
													handleSelectProduct(
														item,
														checked
													)
												}
												checked={ selectedProduct.some(
													( selectedItem ) =>
														selectedItem.id ===
														item.id
												) }
											/>
										</div>
										<div className="storeengine-product-title storeengine-product-item-data">
											{ item?.imgUrl && (
												<img src="" alt="" />
											) }
											<span>
												{ sliceString(
													item.title.rendered
												) }
											</span>
										</div>
										<span className="storeengine-product-item-data">
											{ item.available }
										</span>
										<span className="storeengine-product-item-data">
											{
												item.meta
													._storeengine_product_sale_price
											}
										</span>
									</div>
								) ) }
							</>
						) : (
							<CustomTableMessage
								title={ __(
									'No data Available!!',
									'storeengine'
								) }
							/>
						) }
					</>
				) }
			</div>
		</Scope>
	);
};

export default Products;
