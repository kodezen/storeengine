import React, { useCallback, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { useFormikContext } from 'formik';
import { namespace, API, get_api_route } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import debounce from 'just-debounce-it';
import PaymentSummary from '@Components/PaymentSummary';
import { getSubscriptionInitialValues } from '../helper';
import PurchaseTable from '@Components/PurchaseTable';
import { Card, Heading } from '@Components/ui';

const Product = () => {
	const { values, setValues } = useFormikContext();
	const dispatch = useDispatch();
	const [ addCoupon, setAddCoupon ] = useState( false );
	const [ isVerifying, setIsVerifying ] = useState( false );

	const removeOrderItem = ( payload ) =>
		API.post(
			get_api_route( `subscription/${ values.ID }/order_item`, {
				context: 'edit',
			} ),
			payload,
			{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
		);

	const addOrderItem = ( payload ) =>
		API.post(
			get_api_route( `subscription/${ values.ID }/order_item`, {
				context: 'edit',
			} ),
			payload
		);

	const updateOrderItem = async ( { id, quantity } ) => {
		try {
			const { data } = await API.post(
				get_api_route(
					`subscription/${ values.ID }/order_item/${ id }`,
					{
						context: 'edit',
					}
				),
				{ quantity }
			);
			setValues( getSubscriptionInitialValues( data.id, [ data ] ) );
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

	const addOrderItemProduct = async (
		price_id,
		variation = 0,
		quantity = 1
	) => {
		try {
			const { data } = await addOrderItem( {
				price_id,
				variation,
				quantity,
				type: 'product',
			} );
			setValues( getSubscriptionInitialValues( data.id, [ data ] ) );
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
	const addOrderItemCoupon = async ( code ) => {
		try {
			const { data } = await addOrderItem( { code, type: 'coupon' } );
			setValues( getSubscriptionInitialValues( data.id, [ data ] ) );
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

	const removeOrderItemProduct = async ( item_id ) => {
		try {
			const { data } = await removeOrderItem( { item_id, type: 'item' } );
			setValues( getSubscriptionInitialValues( data.id, [ data ] ) );
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

	const removeCoupon = async ( item_id ) => {
		try {
			const { data } = await removeOrderItem( {
				item_id,
				type: 'coupon',
			} );
			setValues( getSubscriptionInitialValues( data.id, [ data ] ) );
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

	const handleAddCoupon = useCallback(
		debounce( async ( event ) => {
			if ( event.target.value && event.target.value.length >= 3 ) {
				setIsVerifying( true );
				await addOrderItemCoupon( event.target.value );
				setIsVerifying( false );
			}
		}, 1000 ),
		[ addOrderItemCoupon ]
	);

	return (
		<>
			<Card className="mb-6">
				<Heading>{ __( 'Product', 'storeengine' ) }</Heading>
				<PurchaseTable
					removeOrderItemProduct={ removeOrderItemProduct }
					addOrderItemProduct={ addOrderItemProduct }
					updateOrderItem={ updateOrderItem }
					currency={ values.currency }
				/>
			</Card>
			<PaymentSummary
				removeCoupon={ removeCoupon }
				handleAddCoupon={ handleAddCoupon }
				isVerifying={ isVerifying }
				addCoupon={ addCoupon }
				setAddCoupon={ setAddCoupon }
				removeOrderItemProduct={ removeOrderItemProduct }
			/>
		</>
	);
};

export default Product;
