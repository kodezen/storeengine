import { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import SettingsSkeleton from '@Components/Loader/SettingsSkeleton';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllShippingZones } from '@Redux/Slices/settingsSlice/ShippingActions';
import { Scope, Heading } from '@Components/ui';
import Zones from './Zones';

import './styles.scss';

const Shipping = () => {
	const shippingZones = useSelector(
		( state ) => state?.settings?.shippingZones
	);
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState(
		! shippingZones?.length
	);
	const dispatch = useDispatch();

	useEffect( () => {
		( async () => {
			setDataFetchingStatus( true );
			await dispatch( fetchAllShippingZones() );
			setDataFetchingStatus( false );
		} )();
	}, [] );

	if ( dataFetchingStatus ) {
		return <SettingsSkeleton />;
	}

	return (
		<Scope id="settingsShipping">
			<div className="storeengine-content-section">
				<Heading>{ __( 'Shipping', 'storeengine' ) }</Heading>
				<Zones shippingZones={ shippingZones } />
			</div>
		</Scope>
	);
};

export default Shipping;
