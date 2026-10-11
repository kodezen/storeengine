import { Formik } from 'formik';
import Checkbox from '@Components/Formik/Checkbox';
import { useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';
import {
	updateShippingMethod,
	updateShippingZone,
} from '@Redux/Slices/settingsSlice/ShippingActions';
import AutoSave from '@Components/Formik/AutoSave';

const ExternalSubmitter = ( { data, zone } ) => {
	const dispatch = useDispatch();
	const onSubmitHandler = async ( values ) => {
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

		const { payload } = await dispatch( updateShippingMethod( values ) );
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
	};
	return (
		<Formik
			enableReinitialize={ true }
			initialValues={ {
				...data,
			} }
			onSubmit={ onSubmitHandler }
		>
			<>
				<AutoSave />
				<Checkbox name="is_enabled" suffix="method-setting" />
			</>
		</Formik>
	);
};

export default ExternalSubmitter;
