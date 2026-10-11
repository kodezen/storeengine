import React, { useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { paymentAddons } from '../../../Addons/utils';
import AddonCard from './AddonCard';
import { fetchAddons } from '@Redux/Slices/addonSlice/addonSlice';
import { getAddonActiveStatus } from '@Utils/helper';
import { Scope, Heading } from '@Components/ui';
import PluginTeaser from '../../components/PluginTeaser';

const AddonsForm = () => {
	const dispatch = useDispatch();
	const addonsSavedData = useSelector( ( state ) => state.addons );

	// Extra gateways (Paystack, Square, …) ship in the free StoreEngine Payments
	// companion plugin. When it isn't active, show an install-only teaser of what
	// it unlocks; PluginTeaser renders nothing once the plugin is active.
	const paymentsPlugin = window.StoreEngineGlobal?.satellite_plugins?.payments;

	useEffect( () => {
		dispatch( fetchAddons() );
	}, [] );

	const addonStates = useMemo( () => {
		const data = { ...addonsSavedData };
		paymentAddons.forEach( ( { name } ) => {
			if ( undefined === data[ name ] ) {
				data[ name ] = getAddonActiveStatus( addonsSavedData, name );
			}
		} );
		return data;
	}, [ addonsSavedData ] );

	return (
		<>
			<Scope className="storeengine-content-section storeengine-content-section--payment-addons storeengine-mt-4">
				<Heading className="storeengine-flex storeengine-flex-justify-between">
					{ __( 'Payment Gateway Add-ons', 'storeengine' ) }
					<span className="storeengine-payment-addons__count">
						{ paymentAddons.length } { __( 'items', 'storeengine' ) }
					</span>
				</Heading>
				{ /* <div className="storeengine-payment-addons__header">
				</div> */ }
				<Formik enableReinitialize={ true } initialValues={ addonStates }>
					{ ( { setFieldValue, values } ) => (
						<form>
							<div className="storeengine-dashboard-addon-cards storeengine-dashboard-addon-cards--payment">
								{ paymentAddons.map( ( item, index ) => (
									<AddonCard
										key={ item.name }
										item={ item }
										index={ index }
										value={ values[ item.name ] }
										setFieldValue={ setFieldValue }
									/>
								) ) }
							</div>
						</form>
					) }
				</Formik>
			</Scope>

			<PluginTeaser plugin={ paymentsPlugin } pluginKey="payments" />
		</>
	);
};

export default AddonsForm;
