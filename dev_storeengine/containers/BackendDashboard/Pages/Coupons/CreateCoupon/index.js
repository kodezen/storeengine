import React, { useState, useEffect } from 'react';
import { Scope, Button, Switch } from '@Components/ui';
import { __ } from '@wordpress/i18n';
import TopBar from '@Components/TopBar';
import Preloader from '@Components/Loader/Preloader';
import { Formik } from 'formik';
import { getCouponInitialValues } from '../helper';
import {
	createNewCoupon,
	updateCoupon,
	getCoupon,
} from '@Redux/Slices/couponsSlice/couponsSlice';
import { useDispatch, useSelector } from 'react-redux';
import FormInner from './FormInner';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { useNavigate } from 'react-router-dom';
import { route_path, canWriteResource } from '@Utils/helper';
import ReadOnlyNotice from '@Components/ReadOnlyNotice';

const CreateCoupon = ( { id } ) => {
	const canEdit = canWriteResource( 'coupons', id ? 'update' : 'create' );
	const coupons = useSelector( ( state ) => state.coupons );
	const [ isLoading, setLoading ] = useState( false );
	const dispatch = useDispatch();
	const navigate = useNavigate();

	useEffect( () => {
		if ( ! coupons.data.length && id ) {
			setLoading( true );
			dispatch( getCoupon( id ) ).then( () => {
				setLoading( false );
			} );
		}
	}, [ id, coupons.data ] );

	useEffect( () => {
		if ( id ) {
			navigate(
				`${ route_path }admin.php?page=storeengine-coupons&id=${ id }&action=edit`
			);
		}
	}, [] );

	const onSubmitHandler = ( values, actions ) => {
		const formValues = {
			_storeengine_coupon_customer_usage_limit: 0,
			_storeengine_coupon_usage_limit: 0,
			...values,
		};

		actions.setSubmitting( true );

		if ( ! formValues?.meta?._storeengine_coupon_customer_usage_limit ) {
			// Set 0 if not set, keep consistency.
			formValues.meta._storeengine_coupon_customer_usage_limit = 0;
		}

		if ( ! formValues?.meta?._storeengine_coupon_usage_limit ) {
			// Zero is unlimited.
			formValues.meta._storeengine_coupon_usage_limit = 0;
		}

		if (
			formValues?.meta?._storeengine_coupon_time_type === 'set_time_limit'
		) {
			const startDate =
				formValues?.meta?._storeengine_coupon_start_date_time?.date;
			const startTime =
				formValues?.meta?._storeengine_coupon_start_date_time?.time;
			const endDate =
				formValues?.meta?._storeengine_coupon_end_date_time?.date;
			const endTime =
				formValues?.meta?._storeengine_coupon_end_date_time?.time;

			if ( ! startDate || ! startTime ) {
				dispatch(
					showNotification( {
						message: __(
							'Please add a start date and time.',
							'storeengine'
						),
						isShow: true,
						type: 'error',
					} )
				);
				actions.setSubmitting( false );
				return;
			}

			if ( endDate && startDate ) {
				const startDateTime = new Date(
					`${ startDate }T${ startTime }`
				);
				const endDateTimeValue = new Date(
					`${ endDate }T${ endTime }`
				);

				if ( endDateTimeValue <= startDateTime ) {
					dispatch(
						showNotification( {
							message: __(
								'End date must be in the future.',
								'storeengine'
							),
							isShow: true,
							type: 'error',
						} )
					);
					actions.setSubmitting( false );
					return;
				}
			}
		}

		if ( formValues.title === '' ) {
			dispatch(
				showNotification( {
					message: __( 'Title Missing', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);

			actions.setSubmitting( false );
			return;
		}

		if ( formValues.meta._storeengine_coupon_name === '' ) {
			dispatch(
				showNotification( {
					message: __( 'Coupon code missing', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);

			actions.setSubmitting( false );
			return;
		}

		if ( id ) {
			dispatch( updateCoupon( { id, formData: formValues } ) ).then(
				() => {
					actions.setSubmitting( false );
				}
			);

			return;
		}

		// `.unwrap()` rejects when the thunk was rejected (e.g. a 403 permission
		// denial), so the success notification + navigation only run on a real
		// create. The error notification is already dispatched inside the thunk.
		dispatch( createNewCoupon( formValues ) )
			.unwrap()
			.then( ( data ) => {
				dispatch(
					showNotification( {
						message: __(
							'Create Coupon Successfully',
							'storeengine'
						),
						isShow: true,
						type: 'success',
					} )
				);
				navigate(
					`${ route_path }admin.php?page=storeengine-coupons&id=${ data.id }&action=edit`
				);
				actions.resetForm();
			} )
			.catch( () => {
				actions.setSubmitting( false );
			} );
	};

	const submitLabel = id
		? __( 'Update Coupon', 'storeengine' )
		: __( 'Create Coupon', 'storeengine' );

	return (
		<Scope>
			{ isLoading ? (
				<Preloader />
			) : (
				<Formik
					enableReinitialize={ true }
					initialValues={ getCouponInitialValues( id, coupons.data ) }
					onSubmit={ onSubmitHandler }
				>
					{ ( props ) => {
						return (
							<>
								<TopBar
									title={ submitLabel }
									render={ () =>
										canEdit ? (
											<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-16">
												<label className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8 storeengine-pointer">
													<Switch
														checked={
															props.values
																.status ===
															'publish'
														}
														onChange={ ( checked ) =>
															props.setFieldValue(
																'status',
																checked
																	? 'publish'
																	: 'draft'
															)
														}
													/>
													<span
														className={ `storeengine-coupon-status-label storeengine-coupon-status-label--${
															props.values
																.status ===
															'publish'
																? 'active'
																: 'inactive'
														}` }
													>
														{ props.values
															.status ===
														'publish'
															? __(
																	'Active',
																	'storeengine'
															  )
															: __(
																	'Inactive',
																	'storeengine'
															  ) }
													</span>
												</label>
												<Button
													type="submit"
													preset="primary"
													onClick={ props.submitForm }
													disabled={ ! props.dirty }
													isLoading={ props.isSubmitting }
												>
													{ submitLabel }
												</Button>
											</div>
										) : null
									}
								/>
								{ ! canEdit && <ReadOnlyNotice /> }
								<FormInner ID={ id } />
							</>
						);
					} }
				</Formik>
			) }
		</Scope>
	);
};

export default CreateCoupon;
