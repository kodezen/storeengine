import React, { useEffect, useState } from 'react';
import { Formik } from 'formik';
import { __ } from '@wordpress/i18n';
import { Button, Row, Title } from '@Components/ui';
import { Select } from '@Components/ui/Select';
import { useDispatch } from 'react-redux';
import {
	createNewShippingMethodForZone,
	updateShippingMethod,
	updateShippingZone,
} from '@Redux/Slices/settingsSlice/ShippingActions';
import { API, namespace } from '@Utils/helper';
import MethodSetting from './components/MethodSetting';

const EditMethod = ( { formData, setEditMethod, zone, fieldHander } ) => {
	const dispatch = useDispatch();
	const [ methodsData, setMethodsData ] = useState( [] );
	const [ methodTypes, setMethodTypes ] = useState( [] );

	useEffect( () => {
		( async () => {
			const { data } = await API.get( namespace + 'shipping/methods' );
			const selectData = data.map( ( item ) => ( {
				label: item.title,
				value: item.method,
			} ) );
			setMethodTypes( selectData );
			setMethodsData( data );
		} )();
	}, [] );

	const onRequestClose = () => {
		setEditMethod( {
			isEdition: false,
			formData: null,
		} );
	};

	const onSubmitHandler = async ( values, actions ) => {
		let zonesData = { ...zone };
		if (
			zonesData?.zone_locations.length > 0 &&
			typeof zonesData?.zone_locations[ 0 ] === 'object'
		) {
			zonesData = {
				...zonesData,
				zone_locations: zonesData.zone_locations.map(
					( location ) => `${ location.type }:${ location.code }`
				),
			};
		}
		if ( formData?.instance_id ) {
			const { payload } = await dispatch(
				updateShippingMethod( values )
			);
			zonesData.shipping_methods = zonesData?.shipping_methods?.map(
				( item ) => {
					if (
						parseInt( item.instance_id ) ===
						parseInt( payload.instance_id )
					) {
						return payload;
					}
					return item;
				}
			);
			await dispatch(
				updateShippingZone( {
					zoneId: zonesData.zone_id,
					formData: zonesData,
				} )
			);
			actions.setSubmitting( false );
			actions.resetForm();
			onRequestClose();
		} else {
			const { payload } = await dispatch(
				createNewShippingMethodForZone( {
					formData: values,
					zone_id: zone.zone_id,
				} )
			);
			zonesData.shipping_methods = [
				...zonesData.shipping_methods,
				payload,
			];
			if ( fieldHander ) {
				fieldHander( 'shipping_methods', zonesData.shipping_methods );
			} else {
				await dispatch(
					updateShippingZone( {
						zoneId: zonesData.zone_id,
						formData: zonesData,
					} )
				);
			}
			actions.setSubmitting( false );
			actions.resetForm();
			onRequestClose();
		}
	};

	return (
		<Formik
			enableReinitialize={ true }
			initialValues={ {
				description: formData?.method_description || '',
				method_order: formData?.method_order || 0,
				zone_id: formData?.zone_id || zone.zone_id,
				method_id: formData?.mathod_id || 0,
				is_enabled: true,
				...formData,
			} }
			onSubmit={ onSubmitHandler }
		>
			{ ( {
				values: methodValues,
				setFieldValue,
				submitForm,
				isSubmitting,
			} ) => {
				return (
					<div
						className={ `flex flex-col gap-3 ${
							! formData ? 'mt-6' : ''
						}` }
					>
						<Title as="h4">
							{ __( 'Select Shipping Type', 'storeengine' ) }
						</Title>
						<Select
							options={ methodTypes }
							isMulti={ false }
							value={ methodTypes.find(
								( item ) =>
									methodValues.method_id === item.value
							) }
							onChange={ ( selectOption ) => {
								setFieldValue(
									'method_id',
									selectOption.value
								);
							} }
							className="storeengine-select storeengine-mt-2"
							classNamePrefix="storeengine-react-select"
						/>
						{ methodValues.method_id !== '' && (
							<>
								<MethodSetting methodsData={ methodsData } />
							</>
						) }

						<Row justify="end" gap={ 3 }>
							<Button
								type="button"
								preset="outline"
								onClick={ onRequestClose }
							>
								{ __( 'Cancel', 'storeengine' ) }
							</Button>
							<Button
								preset="primary"
								disabled={ isSubmitting }
								isLoading={ isSubmitting }
								onClick={ submitForm }
							>
								{ methodValues.instance_id
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

export default EditMethod;
