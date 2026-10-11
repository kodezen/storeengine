import React from 'react';
import { sprintf, __ } from '@wordpress/i18n';
import Text from '@Components/Formik/Text';
import Password from '@Components/Formik/Password';
import StoreEngineSelect from '@Components/StoreEngineSelect';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import Checkbox from '@Components/Formik/Checkbox';
import { useFormikContext } from 'formik';
import { Scope } from '@Components/ui';

import './styles.scss';

const customerLocations = [
	{ label: __( 'No location', 'storeengine' ), value: 'none' },
	{ label: __( 'Store country/region', 'storeengine' ), value: 'store-base' },
	{
		label: __( 'IP Address Based GeoLocation', 'storeengine' ),
		value: 'ip-geolocation',
	},
	// {label: __( 'Browser Based GeoLocation (coming soon)', 'storeengine' ), value: 'geolocation', disabled: true },
];

export default function Geolocation() {
	const {
		values: { default_customer_address: dca = '' },
		setFieldValue,
	} = useFormikContext();

	return (
		<Scope>
			<div className="storeengine-content-section storeengine-content-section--geolocation">
				<h2 className="storeengine-heading">
					{ __( 'Geolocation', 'storeengine' ) }
				</h2>

				<div className="flex flex-col items-start gap-4">
					<StoreEngineSelect
						label={ __(
							'Default customer location',
							'storeengine'
						) }
						placeholder={ __(
							'Default customer location',
							'storeengine'
						) }
						name="default_customer_address"
						options={ customerLocations }
						value={
							dca
								? customerLocations.find(
										( l ) => l.value === dca
								  )
								: customerLocations[ 0 ]
						}
						onChangeHandler={ ( option ) => {
							const value = 'none' === option ? '' : option;
							setFieldValue( 'default_customer_address', value );
							if (
								! [ 'ip-geolocation', 'geolocation' ].includes(
									value
								)
							) {
								setFieldValue(
									'enable_caching_support',
									false
								);
							}
						} }
						suffix={ 'customer-location' }
					/>

					<Checkbox
						title={ __( 'Enable Caching support', 'storeengine' ) }
						name="enable_caching_support"
						suffix={ 'customer-location' }
						isDisabled={
							! [ 'ip-geolocation', 'geolocation' ].includes(
								dca
							)
						}
					/>
				</div>

				<StoreEngineSeparator isBottom={ true } />

				<h2 className="storeengine-heading">
					{ __( 'MaxMind Geolocation integration', 'storeengine' ) }
					<br />
					<span
						className="storeengine-sub-title-light"
						dangerouslySetInnerHTML={ {
							__html: sprintf(
								// translators: %s: Link to GeoLite2 city page.
								__(
									'This API allows StoreEngine to download MaxMind %s database and use the database file to run geolocation look up for any IP address.',
									'storeengine'
								),
								`<a href="https://dev.maxmind.com/geoip/geolite2-free-geolocation-data/" target="_blank" rel="noopener noreferrer">${ __(
									'(GeoLite2 Country)',
									'storeengine'
								) }</a>`
							),
						} }
					/>
				</h2>

				<div className="storeengine-d-flex storeengine-flex-align-start storeengine-flex-gap-24">
					<Password
						title={ __( 'MaxMind License Key', 'storeengine' ) }
						name="maxmind_license"
						desc={
							<small
								dangerouslySetInnerHTML={ {
									__html: sprintf(
										// translators: %s: Link to documentation.
										__(
											'The key that will be used when dealing with MaxMind Geolocation services. You can read how to generate one in %s documentation.',
											'storeengine'
										),
										`<a href="https://storeengine.pro/docs/storeengine-geolocation-integration-via-maxmind/?utm_source=se-settings&utm_medium=field-desc&utm_campaign=docs#maxmind-geolocation-integration" target="_blank" rel="noopener">${ __(
											'MaxMind Geolocation Integration',
											'storeengine'
										) }</a>`
									),
								} }
							/>
						}
						prefix="plain"
					/>
					<Text
						title={ __( 'MaxMind Database Path', 'storeengine' ) }
						name="maxmind_db_path"
						desc={
							<small>
								{ __(
									'The MaxMind database will be automatically downloaded and stored here.',
									'storeengine'
								) }
							</small>
						}
						onFocus={ ( ev ) => ev.target.select() }
						onClick={ ( ev ) => ev.target.select() }
						readOnly
						prefix="plain"
					/>
				</div>
			</div>
		</Scope>
	);
}
