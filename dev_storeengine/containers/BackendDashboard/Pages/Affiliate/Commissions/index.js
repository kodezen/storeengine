import React, { useState } from 'react';
import { Scope, Button } from '@Components/ui';
import TopBar from '@Components/TopBar';
import { __ } from '@wordpress/i18n';
import SubTopBar from '@Components/SubTopBar';
import GetHelp from '@Components/GetHelp';
import CommissionsTable from './CommissionsTable';
import ReactModalFormik from '@Components/Modal/ReactModalFormik';
import ModalFormInner from './ModalFormInner';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { createNewCommission } from '@Redux/Slices/commissionsSlice/commissionsSlice';

const Commissions = () => {
	const [ openAddCommissionModal, setOpenAddCommissionModal ] =
		useState( false );
	const dispatch = useDispatch();

	const onSubmitHandler = ( values, actions ) => {
		actions.setSubmitting( true );
		if ( values.affiliate_id === '' || values.order_id === '' ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __( 'ID Missing', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		} else if ( values.commission_amount === '' ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __( 'Commission Missing', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		} else {
			dispatch( createNewCommission( values ) ).then( () => {
				onRequestClose();
				actions.setSubmitting( false );
			} );
		}
	};

	const onRequestClose = () => {
		setOpenAddCommissionModal( false );
	};

	return (
		<Scope>
			<TopBar
				title={ __( 'Commission', 'storeengine' ) }
				render={ () => (
					<>
						<GetHelp filterText={ [ 'commission' ] } />
					</>
				) }
			/>

			<SubTopBar heading={ __( 'Commission', 'storeengine' ) }>
				<Button
					onClick={ () => setOpenAddCommissionModal( true ) }
					type="button"
					preset="primary"
				>
					{ __( 'Add Commission', 'storeengine' ) }
				</Button>

				<ReactModalFormik
					title={ __( 'Add Commission', 'storeengine' ) }
					isOpen={ openAddCommissionModal }
					onRequestClose={ onRequestClose }
					submitButtonLabel={ __( 'Save', 'storeengine' ) }
					size="small"
					suffix="commission"
					formik={ {
						enableReinitialize: true,
						initialValues: {
							affiliate_id: '',
							order_id: '',
						},
						onSubmit: onSubmitHandler,
					} }
				>
					<ModalFormInner />
				</ReactModalFormik>
			</SubTopBar>

			<div className="storeengine-page-content storeengine-page-content--affiliate-page">
				<CommissionsTable />
			</div>
		</Scope>
	);
};

export default Commissions;
