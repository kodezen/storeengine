import React from 'react';
import WebhookFormInner from './FormInner';
import { __ } from '@wordpress/i18n';
import ReactModalFormik from '@Components/Modal/ReactModalFormik';
import { getInitialValues } from './helper';
import { useDispatch } from 'react-redux';
import {
	createNewHooks,
	updateHooks,
} from '@Redux/Slices/webHookSlice/webHookSlice';
import {
	createIncomingHook,
	updateIncomingHook,
} from '@Redux/Slices/incomingWebhookSlice/incomingWebhookSlice';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { generate_password } from '@Utils/helper';

/**
 * Unified create/edit modal. The first field lets the user pick the webhook
 * type (Outgoing by default); the form body and the dispatched request switch
 * accordingly. When editing, the type is fixed to the existing webhook's type.
 */
const WebhookModal = ( { isOpenModal, onRequestClose, formData, type = 'outgoing' } ) => {
	const dispatch = useDispatch();
	const isEdit = !! formData?.id;
	// Editing keeps the original type; creating starts from the requested type.
	const initialType = isEdit ? type : type || 'outgoing';

	const notify = ( message ) =>
		dispatch(
			showNotification( { message, isShow: true, type: 'error' } )
		);

	const onSubmitHandler = ( values, actions ) => {
		actions.setSubmitting( true );

		if ( ! values?.title ) {
			notify( __( 'Name is required.', 'storeengine' ) );
			actions.setSubmitting( false );
			return;
		}

		const isIncoming = 'incoming' === values.__type;

		if ( isIncoming ) {
			if ( ! values.meta._storeengine_incoming_action ) {
				notify( __( 'Please choose an action.', 'storeengine' ) );
				actions.setSubmitting( false );
				return;
			}

			const body = {
				title: values.title,
				author: values.author,
				status: values.status,
				meta: {
					_storeengine_incoming_action:
						values.meta._storeengine_incoming_action,
					_storeengine_incoming_auth_type:
						values.meta._storeengine_incoming_auth_type,
					_storeengine_incoming_secret:
						values.meta._storeengine_incoming_secret,
				},
			};

			if ( isEdit ) {
				dispatch(
					updateIncomingHook( { id: formData.id, formData: body } )
				);
			} else {
				dispatch( createIncomingHook( body ) );
			}
			setTimeout( onRequestClose, 200 );
			return;
		}

		// Outgoing.
		if ( values.meta._storeengine_webhook_events.length === 0 ) {
			notify( __( 'Please select at least one event.', 'storeengine' ) );
			actions.setSubmitting( false );
			return;
		}
		if ( ! values.meta._storeengine_webhook_delivery_url ) {
			notify( __( 'Delivery URL is required.', 'storeengine' ) );
			actions.setSubmitting( false );
			return;
		}

		const body = {
			title: values.title,
			author: values.author,
			status: values.status,
			meta: {
				_storeengine_webhook_delivery_url:
					values.meta._storeengine_webhook_delivery_url,
				_storeengine_webhook_secret:
					values.meta._storeengine_webhook_secret ||
					generate_password( 50, true, true ),
				_storeengine_webhook_events:
					values.meta._storeengine_webhook_events,
			},
		};

		if ( isEdit ) {
			dispatch( updateHooks( { id: formData.id, formData: body } ) );
		} else {
			dispatch( createNewHooks( body ) );
		}
		setTimeout( onRequestClose, 200 );
	};

	return (
		<ReactModalFormik
			title={ __( 'Webhook', 'storeengine' ) }
			isOpen={ isOpenModal }
			onRequestClose={ onRequestClose }
			submitButtonLabel={
				isEdit
					? __( 'Update Webhook', 'storeengine' )
					: __( 'Add Webhook', 'storeengine' )
			}
			suffix="hooks-form"
			size="small"
			disableSubmitWhenPristine
			formik={ {
				enableReinitialize: true,
				initialValues: getInitialValues( initialType, formData ),
				onSubmit: onSubmitHandler,
			} }
		>
			<WebhookFormInner isEdit={ isEdit } />
		</ReactModalFormik>
	);
};

export default WebhookModal;
