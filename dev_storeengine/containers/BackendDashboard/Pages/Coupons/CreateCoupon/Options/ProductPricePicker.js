import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { FieldArray, useFormikContext } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { Select } from '@Components/ui/Select';
import { Button } from '@Components/ui';
import { fetchAllProducts } from '@Redux/Slices/productsSlice/productsSlice';
import debounce from 'just-debounce-it';

/**
 * Reusable product + price repeater used by the coupon "Select Products"
 * restriction and by the Buy X Get Y reward ("get") product list.
 *
 * A row is `{ product_id, price_ids[] }`, optionally plus `quantity` when
 * `withQuantity` is set. An empty `price_ids` array means "every price of this
 * product" — the backend treats it that way in both places.
 *
 * NOTE: do not `import Number from '@Components/Formik/Number'` here. It shadows
 * the global `Number()` used below for id coercion and crashes the picker.
 *
 * @param {Object}   props
 * @param {string}   props.name         Formik field-array path, e.g. `meta._storeengine_coupon_valid_prices`.
 * @param {boolean}  [props.withQuantity] Render a per-row quantity field.
 * @param {string}   [props.emptyHint]  Message shown when there are no rows.
 * @param {string}   [props.addLabel]   Label for the add-row button.
 * @return {JSX.Element} The picker.
 */
const ProductPricePicker = ( {
	name,
	withQuantity = false,
	emptyHint = '',
	addLabel = __( 'Add Option', 'storeengine' ),
} ) => {
	const { values, setFieldValue, getFieldMeta } = useFormikContext();
	const dispatch = useDispatch();
	const storeProducts = useSelector( ( state ) => state.products.data );
	const [ products, setProducts ] = useState(
		storeProducts.map( ( item ) => ( {
			label: item?.title?.raw ?? item?.title?.rendered,
			value: item.id,
			prices: item.prices,
		} ) )
	);
	const [ searching, setSearching ] = useState( false );

	const rows = getFieldMeta( name )?.value ?? [];

	const mergeProducts = useCallback( ( data = [] ) => {
		const newData = data.map( ( item ) => ( {
			label: item?.title?.raw ?? item?.title?.rendered,
			value: item.id,
			prices: item.prices,
		} ) );

		setProducts( ( prev ) => {
			const map = new Map( prev.map( ( item ) => [ item.value, item ] ) );
			newData.forEach( ( item ) => map.set( item.value, item ) );
			return Array.from( map.values() );
		} );
	}, [] );

	// Search products by keyword (single request). Restricted to published
	// products — only those can be picked for a coupon anyway, and it avoids
	// requiring the `edit_storeengine_products` capability that `status=any`
	// would otherwise gate this behind for a coupon-only staffer.
	const fetchProducts = useCallback(
		async ( search = '' ) => {
			setSearching( true );
			try {
				const { payload } = await dispatch(
					fetchAllProducts( { search, status: 'publish' } )
				);
				mergeProducts( payload?.data ?? [] );
			} catch ( error ) {
				//
			} finally {
				setSearching( false );
			}
		},
		[ dispatch, mergeProducts ]
	);

	// Hydrate every product already referenced in ONE request (?include=id1,id2)
	// instead of one API call per selected row.
	const hydrateSelectedProducts = useCallback(
		async ( ids = [] ) => {
			if ( ! ids.length ) {
				return;
			}
			try {
				const { payload } = await dispatch(
					fetchAllProducts( { include: ids, status: 'publish' } )
				);
				mergeProducts( payload?.data ?? [] );
			} catch ( error ) {
				//
			}
		},
		[ dispatch, mergeProducts ]
	);

	// Stable debounce — rebuilding it each render fires an API call per keystroke.
	const debouncedAPICall = useMemo(
		() => debounce( ( keyword ) => fetchProducts( keyword ), 500 ),
		[ fetchProducts ]
	);

	// ui/Select's `onInputChange` calls back with just the typed string (no
	// react-select-style `actionMeta` second argument) — it only fires for
	// genuine keystrokes, so no action-type check is needed here.
	const handleInputChange = ( inputValue ) => {
		if ( inputValue ) {
			debouncedAPICall( inputValue );
		}
	};

	useEffect( () => {
		if ( storeProducts.length === 0 ) {
			fetchProducts();
		}

		const selectedIds = rows
			.map( ( item ) => item?.product_id )
			.filter( Boolean );
		const missingIds = selectedIds.filter(
			( id ) =>
				! products.some( ( p ) => Number( p.value ) === Number( id ) )
		);
		hydrateSelectedProducts( [ ...new Set( missingIds ) ] );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const allPricesOption = {
		label: __( 'All prices', 'storeengine' ),
		value: '',
	};

	return (
		<FieldArray name={ name }>
			{ ( { remove } ) => (
				<div className="storeengine-specific-product-options">
					{ rows.length > 0 ? (
						rows.map( ( row, index ) => {
							const selectedProduct = products?.find(
								( product ) =>
									Number( product.value ) ===
									Number( row?.product_id )
							);
							// Hidden prices stay selectable so admins can target a
							// frontend-hidden price.
							const productPrices = selectedProduct
								? [
										allPricesOption,
										...( selectedProduct?.prices?.map(
											( price ) => ( {
												label: `${ price.price_name } - ${ price.price }`,
												value: price.id,
											} )
										) ?? [] ),
								  ]
								: [];
							const savedPriceIds = row?.price_ids ?? [];
							// Single price per row — empty price_ids === "All prices".
							const selectedPrice = savedPriceIds.length
								? productPrices.find( ( price ) =>
										savedPriceIds.includes( price.value )
								  ) ?? allPricesOption
								: allPricesOption;

							return (
								<div
									key={ index }
									className="storeengine-specific-product-options__item storeengine-flex storeengine-flex-align-end storeengine-flex-gap-16"
								>
									<div className="storeengine-flex storeengine-flex-column storeengine-flex-gap-8 storeengine-width-full">
										<span className="storeengine-title-subtitle">
											{ __( 'Product', 'storeengine' ) }
										</span>
										<Select
											key={ `${ index }-${
												row?.product_id || 'empty'
											}` }
											id={ `${ name }[${ index }].product_id` }
											name={ `${ name }[${ index }].product_id` }
											options={ products }
											className="storeengine-select storeengine-select__width-full"
											classNamePrefix="storeengine-react-select"
											placeholder={
												searching
													? __(
															'Searching…',
															'storeengine'
													  )
													: __(
															'Select Product',
															'storeengine'
													  )
											}
											isLoading={ searching }
											value={ selectedProduct }
											onInputChange={ handleInputChange }
											onChange={ ( option ) => {
												setFieldValue(
													`${ name }[${ index }].product_id`,
													option?.value ?? ''
												);
												// The previously chosen price belongs to the
												// old product — reset to "All prices".
												setFieldValue(
													`${ name }[${ index }].price_ids`,
													[]
												);
											} }
											menuPosition="fixed"
											menuPlacement="auto"
										/>
									</div>

									<div className="storeengine-flex storeengine-flex-column storeengine-flex-gap-8 storeengine-width-full">
										<span className="storeengine-title-subtitle">
											{ __( 'Prices', 'storeengine' ) }
										</span>
										<Select
											key={ productPrices?.length }
											id={ `${ name }[${ index }].price_ids` }
											name={ `${ name }[${ index }].price_ids` }
											options={ productPrices }
											className="storeengine-select storeengine-select__width-full"
											classNamePrefix="storeengine-react-select"
											placeholder={ __(
												'Select price',
												'storeengine'
											) }
											value={ selectedPrice }
											isDisabled={
												productPrices?.length === 0
											}
											menuPosition="fixed"
											menuPlacement="auto"
											onChange={ ( option ) => {
												// Single-select: one price per row.
												// "All prices" (empty value) or clearing
												// means every price applies.
												const priceIds =
													option && option.value !== ''
														? [ option.value ]
														: [];
												setFieldValue(
													`${ name }[${ index }].price_ids`,
													priceIds
												);
											} }
										/>
									</div>

									{ withQuantity && (
										<div className="storeengine-specific-product-options__qty storeengine-flex storeengine-flex-column storeengine-flex-gap-8">
											<span className="storeengine-title-subtitle">
												{ __( 'Qty', 'storeengine' ) }
											</span>
											<input
												type="number"
												min={ 1 }
												step={ 1 }
												className="storeengine-input"
												id={ `${ name }[${ index }].quantity` }
												name={ `${ name }[${ index }].quantity` }
												value={ row?.quantity ?? 1 }
												onChange={ ( event ) => {
													const qty = parseInt(
														event.target.value,
														10
													);
													setFieldValue(
														`${ name }[${ index }].quantity`,
														Number.isNaN( qty ) ||
															qty < 1
															? 1
															: qty
													);
												} }
											/>
										</div>
									) }

									<Button
										aria-label={ __(
											'Remove',
											'storeengine'
										) }
										onClick={ () => remove( index ) }
										icon="storeengine-icon--trash"
										preset="outline"
									/>
								</div>
							);
						} )
					) : (
						<div className="storeengine-warning storeengine-product-notice storeengine-specific-product-warning">
							<span
								className="storeengine-icon storeengine-icon--info-primary"
								aria-hidden={ true }
							/>
							<div className="storeengine-product-notice__body">
								<span className="storeengine-product-notice__title">
									{ __( 'No products selected', 'storeengine' ) }
								</span>
								<span className="storeengine-product-notice__text">
									{ emptyHint }
								</span>
							</div>
						</div>
					) }

					<Button
						preset="primary"
						onClick={ () => {
							const newRow = { product_id: '', price_ids: [] };
							if ( withQuantity ) {
								newRow.quantity = 1;
							}
							setFieldValue( name, [ ...rows, newRow ] );
						} }
					>
						{ addLabel }
					</Button>
				</div>
			) }
		</FieldArray>
	);
};

export default ProductPricePicker;
