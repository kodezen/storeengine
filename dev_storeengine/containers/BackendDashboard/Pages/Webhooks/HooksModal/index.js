import React from 'react';
import HooksFormInner from './HooksFromInner';
import { __ } from '@wordpress/i18n';
import Preloader from '@Components/Loader/Preloader';
import { Scope } from '@Components/ui';
import ReactModalFormik from '@Components/Modal/ReactModalFormik';
import { getWebhookInitialValues } from './helper';
import { useDispatch } from 'react-redux';
import {
	createNewHooks,
	updateHooks,
} from '@Redux/Slices/webHookSlice/webHookSlice';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { generate_password } from '@Utils/helper';

import './styles.scss';

const HooksModal = ( {
	isOpenModal,
	onRequestClose,
	formData,
	isModalLoading = false,
} ) => {
	const dispatch = useDispatch();
	const onSubmitHandler = ( values, actions ) => {
		actions.setSubmitting( true );
		if ( values?.title === '' ) {
			dispatch(
				showNotification( {
					message: __( 'Title Missing', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
		} else if ( values.meta._storeengine_webhook_events.length === 0 ) {
			dispatch(
				showNotification( {
					message: __( 'Event Not Selected', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
		} else if ( values.meta._storeengine_webhook_delivery_url === '' ) {
			dispatch(
				showNotification( {
					message: __( 'Delivery URL Missing', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
		} else if ( formData.id ) {
			if ( ! values.meta._storeengine_webhook_secret ) {
				values.meta._storeengine_webhook_secret = generate_password(
					50,
					true,
					true
				);
			}
			dispatch( updateHooks( { id: formData.id, formData: values } ) );
			setTimeout( onRequestClose, 200 );
			actions.setSubmitting( true );
		} else {
			if ( ! values.meta._storeengine_webhook_secret ) {
				values.meta._storeengine_webhook_secret = generate_password(
					50,
					true,
					true
				);
			}
			dispatch( createNewHooks( values ) );
			setTimeout( onRequestClose, 200 );
			actions.setSubmitting( true );
		}
	};
	return (
		<ReactModalFormik
			title={ __( 'Webhooks', 'storeengine' ) }
			isOpen={ isOpenModal }
			onRequestClose={ onRequestClose }
			submitButtonLabel={
				formData
					? __( 'Update Webhook', 'storeengine' )
					: __( 'Add Webhook', 'storeengine' )
			}
			suffix="hooks-form"
			size="small"
			formik={ {
				enableReinitialize: true,
				initialValues: getWebhookInitialValues( formData ),
				onSubmit: onSubmitHandler,
			} }
		>
			{ isModalLoading ? (
				<Scope className="flex justify-center">
					<Preloader />
				</Scope>
			) : (
				<HooksFormInner />
			) }
		</ReactModalFormik>
	);
};

export default HooksModal;
