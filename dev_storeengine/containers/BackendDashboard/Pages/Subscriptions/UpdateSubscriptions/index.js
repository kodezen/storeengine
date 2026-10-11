import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import TopBar from '@Components/TopBar';
import {
	getSubscription,
	updateSubscriptionStatus,
	processRenewalNow,
	endTrialNow,
} from '@Redux/Slices/subscriptionSlice/subscriptionSlice';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import { getSubscriptionInitialValues } from './helper';
import { Scope, Button } from '@Components/ui';
import FormInner from './FormInner';
import { is_debug } from '@Utils/helper';

import './styles.scss';

const UpdateSubscriptions = ( { id } ) => {
	const subscriptions = useSelector( ( state ) => state.subscriptions );
	const dispatch = useDispatch();
	const [ debugBusy, setDebugBusy ] = useState( null );

	useEffect( () => {
		if ( ! subscriptions.data.length && id ) {
			dispatch( getSubscription( id ) );
		}
	}, [ id ] );

	const onSubmitHandler = async ( values, actions ) => {
		actions.setSubmitting( true );
		await dispatch(
			updateSubscriptionStatus( {
				id,
				formData: values,
			} )
		);
	};

	const runDebugAction = async ( action ) => {
		setDebugBusy( action );
		try {
			if ( 'renewal' === action ) {
				await dispatch( processRenewalNow( id ) );
			} else if ( 'trial' === action ) {
				await dispatch( endTrialNow( id ) );
			}
		} finally {
			setDebugBusy( null );
		}
	};

	return (
		<Formik
			enableReinitialize={ true }
			initialValues={ getSubscriptionInitialValues(
				id,
				subscriptions.data
			) }
			onSubmit={ onSubmitHandler }
		>
			{ ( { submitForm, isSubmitting, dirty } ) => {
				return (
					<Scope>
						<TopBar
							title={ __(
								'Subscriptions Details',
								'storeengine'
							) }
							render={ () => (
								<Scope className="flex items-center gap-3">
									{ is_debug && id ? (
										<>
											<Button
												type="button"
												preset="outline"
												onClick={ () =>
													runDebugAction( 'renewal' )
												}
												isLoading={
													'renewal' === debugBusy
												}
												disabled={ !! debugBusy }
											>
												{ __(
													'Process Renewal Now',
													'storeengine'
												) }
											</Button>
											<Button
												type="button"
												preset="outline"
												onClick={ () =>
													runDebugAction( 'trial' )
												}
												isLoading={
													'trial' === debugBusy
												}
												disabled={ !! debugBusy }
											>
												{ __(
													'End Trial Now',
													'storeengine'
												) }
											</Button>
										</>
									) : null }
									<Button
										type="submit"
										preset="primary"
										onClick={ submitForm }
										isLoading={ isSubmitting }
										disabled={ ! dirty }
									>
										{ __(
											'Update Subscription',
											'storeengine'
										) }
									</Button>
								</Scope>
							) }
						/>
						<FormInner
							heading={ __(
								'Subscriptions Details',
								'storeengine'
							) }
						/>
					</Scope>
				);
			} }
		</Formik>
	);
};

export default UpdateSubscriptions;
