import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import { Scope, Button } from '@Components/ui';
import { Spinner } from '@wordpress/components';
import PaymentSettings from '../PaymentOption/PaymentSettings';
import { Field, Formik, useFormikContext } from 'formik';

export default function PaymentOption( props ) {
	const {
		id: method,
		index,
		label,
		description,
		icon,
		fields,
		settings,
		...options
	} = props;
	const {
		values: { payments },
		setFieldValue,
		submitForm,
		isSubmitting,
	} = useFormikContext();
	const [ isOpen, setOpen ] = useState( false );
	const [ submittingMethods, setSubmittingMethods ] = useState( {} );

	const onSubmitHandler = async ( values, actions ) => {
		setSubmittingMethods( ( prev ) => ( { ...prev, [ method ]: true } ) );
		const updatedGateway = {
			...payments,
			[ method ]: {
				...payments?.[ method ],
				...values,
				is_enabled: true,
			},
		};
		setFieldValue( 'payments', updatedGateway );
		await submitForm();
		actions.setSubmitting( false );
		setSubmittingMethods( ( prev ) => ( { ...prev, [ method ]: false } ) );
		setOpen( false );
	};
	//Track which method has changed and shows spinner
	const isChangedMethodStatus =
		payments?.[ method ]?.is_enabled !== settings?.is_enabled;
	const isMethodSubmitting =
		submittingMethods?.[ method ] ||
		( isSubmitting && isChangedMethodStatus );

	return (
		<Scope className="storeengine-payments--item">
			<div className="storeengine-payments--item__top">
				<div className="storeengine-payments--item__top__left-section">
					<span
						className="storeengine-icon storeengine-icon--drag storeengine-payments--item__drag-handle"
						aria-hidden={ true }
						title={ __( 'Drag to reorder', 'storeengine' ) }
					/>
					{ icon ? (
						<img src={ icon } alt={ label } />
					) : (
						<span
							className="storeengine-icon storeengine-icon--payment"
							style={ { fontSize: '35px', width: '40px' } }
							aria-hidden={ true }
						/>
					) }
					<div className="storeengine-payments--item__info">
						<span className="storeengine-payments--item__title">
							{ label }
						</span>
						<span className="storeengine-payments--item__desccription">
							{ description }
						</span>
					</div>
					<Field
						type="hidden"
						name={ `payments.${ method }.index` }
					/>
				</div>
				<div className="storeengine-payments--item__top__right-section">
					<div
						className={ `${
							! settings?.is_enabled &&
							'storeengine-checkbox-wrapper'
						}` }
						role="presentation"
						onClick={ () => {
							if ( ! settings?.is_enabled ) {
								setOpen( true );
							}
						} }
					>
						{ isMethodSubmitting ? (
							<Spinner />
						) : (
							<Checkbox
								name={ `payments.${ method }.is_enabled` }
								suffix="payment-section"
								isDisabled={ ! settings?.is_enabled }
							/>
						) }
					</div>
					<Button
						preset="ghost"
						onClick={ () => setOpen( ! isOpen ) }
						size="sm"
						icon={ `storeengine-icon--${
							isOpen ? 'arrow-down' : 'arrow-up'
						}` }
					/>
				</div>
			</div>
			{isOpen ? (
				<div
					className={ `storeengine-expandable-section ${
						isOpen ? 'storeengine-expandable-section--open' : ''
					}` }
				>
					<div className="storeengine-expandable-section-content">
						<Formik
							enableReinitialize={ true }
							initialValues={ settings ?? {} }
							onSubmit={ onSubmitHandler }
						>
							<PaymentSettings
								method={ method }
								label={ label }
								description={ description }
								fields={ fields }
								settings={ settings }
								options={ options }
								setOpen={ setOpen }
								fieldUpdateHandler={ setFieldValue }
								payments={ payments }
								parentFormSubmitter={ submitForm }
							/>
						</Formik>
					</div>
				</div>
			) : null}
		</Scope>
	);
}
