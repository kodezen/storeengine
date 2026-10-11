import React, { useCallback, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import ListTable from '@Components/ListTable';
import ProductSelectModal from './ProductSelectModal';
import Button from '@Components/Button';
import debounce from 'just-debounce-it';
import Currency from '@Components/Currency';
import { decodeEntities } from '@wordpress/html-entities';

import './styles.scss';

const CalculateTotal = ( { row, currency } ) => {
	if ( 'taxable' === row.tax_status ) {
		return (
			<Currency
				value={
					parseFloat( row?.subtotal ) +
					parseFloat( row?.subtotal_tax )
				}
				args={ { currency } }
			/>
		);
	}

	return (
		<Currency value={ parseFloat( row?.subtotal ) } args={ { currency } } />
	);
};

const PurchaseTable = ( {
	removeOrderItemProduct,
	addOrderItemProduct,
	updateOrderItem,
	currency,
} ) => {
	const orderProductRef = useRef( null );
	const { values } = useFormikContext();

	const actionTab =
		! values?.id && values?.is_editable
			? [
					{
						name: __( 'Action', 'storeengine' ),
						suffix: 'actions',
						width: '8%',
						cell: ( row ) => (
							<Button
								ariaLabel={ __( 'Remove Item', 'storeengine' ) }
								icon={
									<span
										className="storeengine-icon storeengine-icon--trash"
										aria-hidden={ true }
									/>
								}
								onClick={ () =>
									removeOrderItemProduct( row.id )
								}
								preset="transparent"
								suffix="trash-product"
							/>
						),
					},
			  ]
			: [];

	const updateProductQuantity = async ( id, quantity ) => {
		await updateOrderItem( { id, quantity } );
	};

	const handleIncrementDecrement = async ( increment, { id, quantity } ) => {
		quantity = increment ? quantity + 1 : Math.max( 1, quantity - 1 );

		await updateProductQuantity( id, quantity );
	};

	const debouncedUpdateProductQuantity = useCallback(
		debounce( async ( id, quantity ) => {
			await updateProductQuantity( id, quantity );
		}, 500 ),
		[ updateProductQuantity ]
	);

	const columns = [
		{
			name: __( 'Product name', 'storeengine' ),
			suffix: 'title',
			cell: ( row ) => {
				const formattedMetaData = [
					...( row?.formatted_metadata || [] ),
				];
				if (
					! formattedMetaData.find( ( i ) => 'price-id' === i.key )
				) {
					formattedMetaData.unshift( {
						key: 'price-id',
						display_key: __( 'Price ID', 'storeengine' ),
						display_value: row.price_id,
					} );
					formattedMetaData.unshift( {
						key: 'product-id',
						display_key: __( 'Product ID', 'storeengine' ),
						display_value: row.product_id,
					} );
				}
				return (
					<div>
						<div>
							{ row?.edit_url ? (
								<a
									href={ row.edit_url }
									target="_blank"
									rel="noreferrer"
								>
									{ decodeEntities( row?.name ) }
								</a>
							) : (
								decodeEntities( row?.name )
							) }
							{ formattedMetaData.length > 0 && (
								<div>
									{ formattedMetaData.map(
										(
											{ key, display_key, display_value },
											idx
										) => {
											return (
												<span
													key={ idx }
													className={ `metadata meta-${ key } storeengine-flex storeengine-flex-gap-4` }
													style={ {
														whiteSpace: 'nowrap',
														width: '100%',
														overflow: 'hidden',
														textOverflow:
															'ellipsis',
													} }
												>
													<span
														className="meta-label nobr"
														style={ {
															fontWeight: 500,
														} }
													>
														{ display_key }:&nbsp;
													</span>
													<span
														className="meta-value nobr"
														style={ {
															fontWeight: 300,
														} }
														dangerouslySetInnerHTML={ {
															__html: display_value,
														} }
													/>
												</span>
											);
										}
									) }
								</div>
							) }
						</div>
					</div>
				);
			},
		},
		{
			name: __( 'Quantity', 'storeengine' ),
			width: '25%',
			cell: ( row ) => {
				if ( ! values.is_editable ) {
					return row.quantity;
				}

				const index = values.purchase_items.findIndex(
					( item ) => item?.id === row?.id
				);

				return (
					<div className="storeengine-orders-quantity">
						<Button
							ariaLabel={ __(
								'Decrease quantity by 1',
								'storeengine'
							) }
							icon={
								<span
									className="storeengine-icon storeengine-icon--minus"
									aria-hidden={ true }
								/>
							}
							onClick={ () =>
								handleIncrementDecrement( false, row )
							}
							preset="transparent"
							borderRadius="0"
						/>
						<input
							type="number"
							placeholder={ __( 'Quantity', 'storeengine' ) }
							min={ 1 }
							step={ 1 }
							name={ `purchase_items[${ index }].quantity` }
							value={ row.quantity }
							onChange={ ( event ) =>
								debouncedUpdateProductQuantity(
									row.id,
									parseInt( event.target.value, 10 )
								)
							}
						/>
						<Button
							ariaLabel={ __(
								'Increase quantity by 1',
								'storeengine'
							) }
							icon={
								<span
									className="storeengine-icon storeengine-icon--add"
									aria-hidden={ true }
								/>
							}
							onClick={ () =>
								handleIncrementDecrement( true, row )
							}
							preset="transparent"
							borderRadius="0"
						/>
					</div>
				);
			},
		},
		{
			name: __( 'Price', 'storeengine' ),
			cell: ( row ) => (
				<div className="price-cell">
					<Currency value={ row?.price } args={ { currency } } />
				</div>
			),
		},
		{
			name: __( 'Total', 'storeengine' ),
			cell: ( row ) => (
				<div className="total">
					<CalculateTotal row={ row } currency={ currency } />
				</div>
			),
		},

		// {
		// 	name: __( 'Shipping Status', 'storeengine' ),
		// 	cell: ( row ) => {
		// 		const shippingStatusHandler = ( itemStatus, item ) => {
		// 			dispatch(
		// 				updateOrderShippingStatus( {
		// 					shipping_status: itemStatus,
		// 					item,
		// 					order_id: row.order_id,
		// 				} )
		// 			);
		// 		};
		// 		const getFilteredShippingOptions = ( currentStatus ) => {
		// 			const shippingStatuses = [
		// 				{
		// 					label: __( 'Ready For Ship', 'storeengine' ),
		// 					value: 'ready_for_ship',
		// 				},
		// 				{
		// 					label: __( 'Awaiting Shipment', 'storeengine' ),
		// 					value: 'awaiting_shipment',
		// 				},
		// 				{
		// 					label: __( 'Shipped', 'storeengine' ),
		// 					value: 'shipped',
		// 				},
		// 				{
		// 					label: __( 'On The Way', 'storeengine' ),
		// 					value: 'on_the_way',
		// 				},
		// 				{
		// 					label: __( 'Out For Delivery', 'storeengine' ),
		// 					value: 'out_for_delivery',
		// 				},
		// 				{
		// 					label: __( 'Delivered', 'storeengine' ),
		// 					value: 'delivered',
		// 				},
		// 				{
		// 					label: __( 'Returned', 'storeengine' ),
		// 					value: 'returned',
		// 				},
		// 			];

		// 			const currentIndex = shippingStatuses.findIndex(
		// 				( item ) => item.value === currentStatus
		// 			);

		// 			return shippingStatuses.map( ( status, index ) => {
		// 				const isPrevious = index < currentIndex;
		// 				const isAfterNext = index > currentIndex + 1;

		// 				return {
		// 					...status,
		// 					isDisabled: isPrevious || isAfterNext,
		// 				};
		// 			} );
		// 		};

		// 		return (
		// 			<div className="status-shipping-cell">
		// 				<DropDownStatus
		// 					value={ row?.shipping_status }
		// 					options={ {
		// 						items: getFilteredShippingOptions(
		// 							row?.shipping_status
		// 						),
		// 					} }
		// 					onChangeHandler={ ( statusHandler ) =>
		// 						shippingStatusHandler( statusHandler, row )
		// 					}
		// 				/>
		// 			</div>
		// 		);
		// 	},
		// },
		...actionTab,
	];

	return (
		<div
			className={ `storeengine-product-table${
				values.purchase_items?.length ? '' : ' is-empty'
			}` }
			ref={ orderProductRef }
		>
			<ListTable
				title=""
				key={ `ordered-products-` + values.purchase_items.length }
				columns={ columns }
				data={ values.purchase_items || [] }
				showColumnFilter={ false }
				showSubHeader={ false }
				isRowSelectable={ false }
				noDataText={ __(
					'Please, add product for current order.',
					'storeengine'
				) }
				suffix={ `purchase-product${
					values.is_editable ? ' order-is-editable' : ''
				}` }
			/>
			{ values.is_editable && (
				<ProductSelectModal
					isEmpty={ ! values.purchase_items?.length }
					addOrderItemProduct={ addOrderItemProduct }
				/>
			) }
		</div>
	);
};

export default PurchaseTable;
