import React, { useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { courierAddons } from '../../../Addons/utils';
import AddonCard from '../Payments/AddonCard';
import { fetchAddons } from '@Redux/Slices/addonSlice/addonSlice';
import { fetchProviders } from '@Redux/Slices/couriersSlice/couriersSlice';
import { getAddonActiveStatus } from '@Utils/helper';
import { Scope, Heading } from '@Components/ui';
import PluginTeaser from '../../components/PluginTeaser';

/**
 * "Courier Add-ons" — the per-provider enable toggles, mirroring the Payment
 * Gateway Add-ons panel on the Payment method tab. Provider cards come from the
 * storeengine-courier satellite (courierAddons). Credential fields for enabled
 * providers render below this, in the parent CourierSettings.
 */
const CourierAddonsForm = () => {
	const dispatch = useDispatch();
	const addonsSavedData = useSelector( ( state ) => state.addons );

	useEffect( () => {
		dispatch( fetchAddons() );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const addonStates = useMemo( () => {
		const data = { ...addonsSavedData };
		courierAddons.forEach( ( { name } ) => {
			if ( undefined === data[ name ] ) {
				data[ name ] = getAddonActiveStatus( addonsSavedData, name );
			}
		} );
		return data;
	}, [ addonsSavedData ] );

	// Courier (and dropship) providers ship in the free StoreEngine Connectors
	// companion plugin. When it isn't active, courierAddons is empty — show the
	// install-only teaser of what it unlocks instead of a bare grid.
	if ( ! courierAddons.length ) {
		const connectorsPlugin =
			window.StoreEngineGlobal?.satellite_plugins?.connectors;

		if ( connectorsPlugin && ! connectorsPlugin.active ) {
			return (
				<PluginTeaser
					plugin={ connectorsPlugin }
					pluginKey="connectors"
				/>
			);
		}

		return (
			<Scope className="storeengine-content-section storeengine-mt-4">
				<Heading>{ __( 'Courier Add-ons', 'storeengine' ) }</Heading>
				<p className="storeengine-mt-2">
					{ __(
						'No courier integrations are available yet. Configure a provider under Settings → Couriers once the StoreEngine Connectors plugin is active.',
						'storeengine'
					) }
				</p>
			</Scope>
		);
	}

	return (
		<Scope className="storeengine-content-section storeengine-content-section--payment-addons storeengine-mt-4">
			<Heading className="storeengine-flex storeengine-flex-justify-between">
				{ __( 'Courier Add-ons', 'storeengine' ) }
				<span className="storeengine-payment-addons__count">
					{ courierAddons.length } { __( 'items', 'storeengine' ) }
				</span>
			</Heading>
			<Formik enableReinitialize={ true } initialValues={ addonStates }>
				{ ( { setFieldValue, values } ) => (
					<form>
						<div className="storeengine-dashboard-addon-cards storeengine-dashboard-addon-cards--payment">
							{ courierAddons.map( ( item, index ) => (
								<AddonCard
									key={ item.name }
									item={ item }
									index={ index }
									value={ values[ item.name ] }
									setFieldValue={ ( name, status ) => {
										setFieldValue( name, status );
										// Refresh the provider list so credential
										// fields for a newly-enabled courier appear
										// (and disabled ones drop) without a reload.
										dispatch( fetchProviders() );
									} }
								/>
							) ) }
						</div>
					</form>
				) }
			</Formik>
		</Scope>
	);
};

export default CourierAddonsForm;
