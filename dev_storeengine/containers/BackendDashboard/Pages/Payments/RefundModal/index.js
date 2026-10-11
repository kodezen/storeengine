import React, { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { Button, Scope } from '@Components/ui';
import Text from '@Components/Formik/Text';
import ReactModal from '@Components/Modal/ReactModal';
import { Field, useFormikContext } from 'formik';
import { makeRequest2 } from '@Utils/helper';
import Number from '@Components/Formik/Number';
import Label from '@Components/Formik/Label';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import SwitchControl from '@Components/Formik/Checkbox/SwitchControl';
import Tooltip from '@Components/Tooltip';
import { applyRefund } from '@Redux/Slices/paymentsSlice/paymentsSlice';

import '../styles.scss';

const referralOptions = [
	{
		label: __( 'Full refund', 'storeengine' ),
		value: 'full',
	},
	{
		label: __( 'Partial refund', 'storeengine' ),
		value: 'partial',
	},
];

const RefundModal = ( { row, isOpen, setIsOpen, onSuccess } ) => {
	const [ selectedRefundType, setSelectedRefundType ] = useState( '' );
	const [ maxRefund, setMaxRefund ] = useState( 0 );
	const [ orderStatus, setOrderStatus ] = useState( '' );

	const { values, setFieldValue, setValues } = useFormikContext();
	const dispatch = useDispatch();

	// useEffect(() => {
	// 	if (row?.status) {
	// 		setOrderStatus(row.status);
	// 	}
	// }, [row]);

	const resetForm = () => {
		const possibleMaxRefund = row.total_amount - row.refunded_amount;
		setSelectedRefundType( '' );
		setFieldValue( 'refund_type', 'full' );
		//setRefundAmount( possibleMaxRefund );
		setMaxRefund( possibleMaxRefund );
		setFieldValue( 'refund_amount', possibleMaxRefund );
		// Default to gateway refund when supported, so the "manual refund" notice
		// only appears when the admin turns the gateway switch off.
		setFieldValue( 'api_refund', !! row.gateway_can_refund_order );
		setFieldValue( 'reason', '' );
	};

	const handleCloseModal = () => {
		resetForm();
		setIsOpen( false );
	};

	const handleApplyRefund = async () => {
		//logic & ajax call
		const payload = {
			order_id: row.id,
			refund_type: values?.refund_type,
			refund_amount: values?.refund_amount,
			refund_reason: values?.reason,
			api_refund: values?.api_refund,
			refunded_amount: row.refunded_amount,
			deactivate_licenses: values?.deactivate_licenses || false,
		};

		try {
			await makeRequest2( 'refund', payload ).then( ( response ) => {
				dispatch(
					showNotification( {
						message: __( 'Refund Successful.', 'storeengine' ),
						isShow: true,
						type: 'success',
					} )
				);
				handleCloseModal();
				// When embedded outside the Payments page (e.g. the order editor),
				// the caller refreshes its own data; otherwise update the payments table.
				if ( typeof onSuccess === 'function' ) {
					onSuccess( response );
				} else {
					dispatch( applyRefund( response ) );
				}
			} );
		} catch ( err ) {
			dispatch(
				showNotification( {
					message: err,
					isShow: true,
					type: 'error',
				} )
			);
		}
	};

	return (
		<>
			<ReactModal
				title={ __( 'Add Refund', 'storeengine' ) }
				isOpen={ isOpen }
				isEnabledHeader={ true }
				onRequestClose={ handleCloseModal }
				suffix="add-refund"
				size="small"
			>
				<Scope>
					<div className="storeengine-react-modal__content--details m-0 mb-6">
						{ row.gateway_can_refund_order && (
							<div className="flex items-center justify-between mb-6">
								<label
									htmlFor="api_refund"
									className="text-sm font-medium text-se-text"
								>
									{ sprintf(
										// translators: %s. Gateway name
										__(
											'Refund Via Payment Gateway: “%s”',
											'storeengine'
										),
										row.gateway_name
									) }
								</label>
								<div>
									<Field
										id="api_refund"
										type="checkbox"
										name="api_refund"
										component={ SwitchControl }
										value={ values.api_refund }
										onChange={ () =>
											setFieldValue(
												'api_refund',
												! values.api_refund
											)
										}
									/>
								</div>
							</div>
						) }
						<div className="refund-options flex flex-col gap-1.5 mb-6">
							{ referralOptions.map( ( item, index ) => (
								<label
									className="flex items-center cursor-pointer"
									htmlFor={ `refund_type-${ index }` }
									key={ index }
								>
									<Field
										id={ `refund_type-${ index }` }
										name="refund_type"
										type="radio"
										className="storeengine-radio"
										value={ item.value }
										onClick={ () => {
											setSelectedRefundType( item.value );
											if ( item.value === 'full' ) {
												setFieldValue(
													'refund_amount',
													maxRefund
												);
											}
										} }
									/>
									<span className="ml-2 text-sm font-medium text-se-text">
										{ item.label }
									</span>
								</label>
							) ) }
						</div>
						<Number
							title={ __( 'Refund amount', 'storeengine' ) }
							name="refund_amount"
							prefix="refund_amount"
							currency={ row.currency }
							min={ 0.1 }
							max={ maxRefund ? maxRefund : null }
							isDisabled={ selectedRefundType !== 'partial' }
							onChange={ ( value ) =>
								setFieldValue( 'refund_amount', value )
							}
						/>
						<Text
							title={ __( 'Refund Reason', 'storeengine' ) }
							name="reason"
							tooltip={ __(
								'Note: The refund reason will be visible to the customer.',
								'storeengine'
							) }
							autocomplete="none"
						/>

						{ applyFilters( 'storeengine.order_refund.options', null, {
							orderId: row.id,
							order: row,
							value: values.deactivate_licenses,
							onChange: ( v ) =>
								setFieldValue( 'deactivate_licenses', v ),
						} ) }

						{ ! row.gateway_can_refund_order || ! values.api_refund ? (
							<div
								className="flex flex-col gap-2 rounded-se border border-se-warning bg-se-warning-light p-3 mt-4"
								role="alert"
								aria-live="polite"
							>
								<h4 className="flex items-center gap-2 m-0 text-sm font-medium text-se-text">
									<span
										className="storeengine-icon storeengine-icon--info text-se-warning"
										aria-hidden={ true }
									/>
									{ __(
										'Manual Refund Required',
										'storeengine'
									) }
								</h4>
								<p className="m-0 text-sm text-se-text">
									{ __(
										'This action does not process the actual payment refund. You must manually issue the refund through your payment gateway afterwards.',
										'storeengine'
									) }
								</p>
							</div>
						) : null }
						{ row.gateway_can_refund_order && values.api_refund ? (
							<div
								className="flex flex-col gap-2 rounded-se border border-se-primary bg-se-primary-light p-3 mt-4"
								role="alert"
								aria-live="polite"
							>
								<h4 className="flex items-center gap-2 m-0 text-sm font-medium text-se-text">
									<span
										className="storeengine-icon storeengine-icon--info text-se-primary"
										aria-hidden={ true }
									/>
									{ __(
										'Refund Processing Time',
										'storeengine'
									) }
								</h4>
								<p className="m-0 text-sm text-se-text">
									{ sprintf(
										// translators: %s. Gateway name
										__(
											'Refunds may take several days to appear on a customer’s statement, depending on the gateway’s policy. Please refer to the %s documentation for details.',
											'storeengine'
										),
										row.gateway_name
									) }
								</p>
							</div>
						) : null }
					</div>
					<div className="storeengine-react-modal__footer flex items-center">
						<Button
							preset="outline"
							type="button"
							onClick={ handleCloseModal }
						>
							{ __( 'Cancel', 'storeengine' ) }
						</Button>
						<Button
							preset="primary"
							type="button"
							onClick={ handleApplyRefund }
						>
							{ row.gateway_can_refund_order && values.api_refund
								? sprintf(
										// translators: %s. Gateway name
										__( 'Refund via %s', 'storeengine' ),
										row.gateway_name
								  )
								: __( 'Refund manually', 'storeengine' ) }
						</Button>
					</div>
				</Scope>
			</ReactModal>
		</>
	);
};

export default RefundModal;
