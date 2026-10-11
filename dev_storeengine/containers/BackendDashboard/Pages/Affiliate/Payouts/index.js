import React, { useState } from 'react';
import { Scope, Button } from '@Components/ui';
import TopBar from '@Components/TopBar';
import { __ } from '@wordpress/i18n';
import SubTopBar from '@Components/SubTopBar';
import GetHelp from '@Components/GetHelp';
import PayoutsTable from './PayoutsTable';
import ReactModalFormik from '@Components/Modal/ReactModalFormik';
import ModalFormInner from './ModalFormInner';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { createNewPayout } from '@Redux/Slices/payoutsSlice/payoutsSlice';

const Payouts = () => {
	const [ openPayoutsModal, setOpenPayoutsModal ] = useState( false );
	const dispatch = useDispatch();

	const onRequestClose = () => {
		setOpenPayoutsModal( false );
	};

	const onSubmitHandler = ( values, actions ) => {
		actions.setSubmitting( true );
		if ( ! values.affiliate_id ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __(
						'Please select affiliate user.',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);

			return;
		}

		if ( values.payout_amount === '' ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __( 'Payout amount is required.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);

			return;
		}

		const amount = parseFloat( values.payout_amount );

		if ( ! isFinite( amount ) || amount <= 0 ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __(
						'Payout amount must be a valid a number greater than zero.',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);

			return;
		}

		const balance = parseFloat( values.affiliate_balance );
		if ( ! isFinite( balance ) || balance <= 0 ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __( 'Insufficient balance.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);

			return;
		}

		if ( amount > balance ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __(
						'Payout amount can not exceed current balance.',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);

			return;
		}

		if ( values.payment_method === '' ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __(
						'Please select payment method.',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);

			return;
		}

		if (
			values.payment_method &&
			! [
				'PayPal',
				'Bank Transfer',
				'Stripe',
				'Check Payment',
				'E-Check',
			].includes( values.payment_method )
		) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __( 'Invalid payment method.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);

			return;
		}
		dispatch( createNewPayout( values ) ).then( () => {
			onRequestClose();
			actions.setSubmitting( false );
		} );
	};

	return (
		<Scope>
			<TopBar
				title={ __( 'Payouts', 'storeengine' ) }
				render={ () => (
					<>
						<GetHelp filterText={ [ 'commission' ] } />
					</>
				) }
			/>

			<SubTopBar heading={ __( 'Payouts', 'storeengine' ) }>
				<Button
					onClick={ () => setOpenPayoutsModal( true ) }
					type="button"
					preset="primary"
				>
					{ __( 'Add Payout', 'storeengine' ) }
				</Button>
				<ReactModalFormik
					title={ __( 'Create New Payout', 'storeengine' ) }
					isOpen={ openPayoutsModal }
					onRequestClose={ onRequestClose }
					submitButtonLabel={ __( 'Create', 'storeengine' ) }
					size="small"
					suffix="payouts"
					formik={ {
						enableReinitialize: true,
						initialValues: {
							affiliate_id: '',
							payout_amount: '',
							payment_method: '',
							affiliate_balance: '',
						},
						onSubmit: onSubmitHandler,
					} }
				>
					<ModalFormInner />
				</ReactModalFormik>
			</SubTopBar>

			<div className="storeengine-page-content storeengine-page-content--affiliate-page">
				<PayoutsTable />
			</div>
		</Scope>
	);
};

export default Payouts;
