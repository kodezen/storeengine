import { Form, Formik } from 'formik';
import React from 'react';
import { Button, Row, Title, SubTitle } from '@Components/ui';
import { __ } from '@wordpress/i18n';
import Methods from '../Methods';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { useDispatch } from 'react-redux';
import SelectTree from '@Components/SelectTree';
import Text from '@Components/Formik/Text';
import {
	updateShippingZone,
	createNewShipping,
} from '@Redux/Slices/settingsSlice/ShippingActions';
import { getInitialShippingData } from '../helper';

const EditZone = ( { formData, setEditZone, zoneData } ) => {
	const dispatch = useDispatch();

	const onRequestClose = () => {
		setEditZone( {
			isEditing: false,
			formData: null,
		} );
	};

	const onSubmitHandler = ( values, actions ) => {
		let updatedValues = { ...values };
		if (
			values?.zone_locations.length > 0 &&
			typeof values?.zone_locations[ 0 ] === 'object'
		) {
			updatedValues = {
				...updatedValues,
				zone_locations: values.zone_locations.map(
					( location ) => `${ location.type }:${ location.code }`
				),
			};
		}

		if ( ! values.zone_name ) {
			dispatch(
				showNotification( {
					message: __( 'Zone name is required', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
		} else if ( formData?.zone_id ) {
			dispatch(
				updateShippingZone( {
					zoneId: formData.zone_id,
					formData: updatedValues,
				} )
			).then( () => {
				actions.resetForm();
				onRequestClose();
			} );
		} else {
			dispatch( createNewShipping( updatedValues ) ).then( () => {
				actions.resetForm();
				onRequestClose();
			} );
		}
	};

	return (
		<Formik
			enableReinitialize={ true }
			initialValues={ getInitialShippingData( formData ) }
			onSubmit={ onSubmitHandler }
		>
			{ ( { values, submitForm, setFieldValue } ) => {
				const zoneLoactionValues = values.zone_locations.map(
					( location ) => `${ location.type }:${ location.code }`
				);
				return (
					<div className="bg-se-white p-6 rounded-se shadow-se-card border border-se-border flex flex-col gap-4">
						<Text
							title={ __( 'Zone Name', 'storeengine' ) }
							prefix="zone_name"
							placeholder="Zone Name"
							name="zone_name"
							readOnly={ false }
						/>

						<div className="flex flex-col gap-2 mb-6">
							<Title as="h4">
								{ __( 'Select Region', 'storeengine' ) }
							</Title>
							<SubTitle>
								{ __(
									'Showing only countries you ship to. Add more under Settings → General → Selling Locations.',
									'storeengine'
								) }
							</SubTitle>
							<SelectTree
								data={ zoneData }
								onChange={ ( options ) =>
									setFieldValue( 'zone_locations', options )
								}
								value={ zoneLoactionValues }
								resetOnSelection={ false }
							/>
						</div>
						<Methods
							zone={ values }
							enableAddOption={ true }
							fieldHander={ setFieldValue }
						/>
						<Row justify="end" gap={ 3 } className="mt-6">
							<Button
								type="button"
								preset="outline"
								onClick={ onRequestClose }
							>
								{ __( 'Cancel', 'storeengine' ) }
							</Button>

							<Button preset="primary" onClick={ submitForm }>
								{ formData?.zone_id
									? __( 'Save', 'storeengine' )
									: __( 'Create', 'storeengine' ) }
							</Button>
						</Row>
					</div>
				);
			} }
		</Formik>
	);
};

export default EditZone;
