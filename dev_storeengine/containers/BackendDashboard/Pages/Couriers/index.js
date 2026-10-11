import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import TopBar from '@Components/TopBar';
import { useLocationQuery } from '@Hooks';
import { isAddonActive } from '@Utils/helper';
import ShipmentsList from './ShipmentsList';
import ProUpsell from '@Containers/BackendDashboard/Pages/Inventory/ProUpsell';

import './styles.scss';

const Couriers = () => {
	const query = useLocationQuery();
	const path = query.getValue( 'path', '', null, 'string' );

	// Settings live in main Settings → Couriers tab now. Redirect old links.
	useEffect( () => {
		if ( path === 'settings' ) {
			const adminBase =
				window.STOREENGINE?.adminUrl || '/wp-admin/';
			window.location.replace(
				adminBase +
					'admin.php?page=storeengine-settings#/settings/couriers'
			);
		}
	}, [ path ] );

	if ( path === 'settings' ) {
		return null;
	}

	if ( ! isAddonActive( 'couriers' ) ) {
		return (
			<>
				<TopBar title={ __( 'Shipments', 'storeengine' ) } />
				<div className="se-admin-tw storeengine-page-content p-4 font-se">
					<ProUpsell
						heading={ __(
							'Enable Couriers to manage shipments',
							'storeengine'
						) }
						description={ __(
							'Turn on the Couriers addon to push orders to carriers in one click and auto-poll status until delivered. Install StoreEngine Courier to add Pathao, Steadfast, Shiprocket and more.',
							'storeengine'
						) }
					/>
				</div>
			</>
		);
	}

	return (
		<>
			<TopBar title={ __( 'Shipments', 'storeengine' ) } />
			
			<div className="se-admin-tw storeengine-page-content p-4 font-se">
				<ShipmentsList />
			</div>
		</>
	);
};

export default Couriers;
