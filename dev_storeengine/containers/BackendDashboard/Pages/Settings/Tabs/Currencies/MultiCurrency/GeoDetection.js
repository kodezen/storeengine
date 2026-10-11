import React from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import { Card, Heading, Title } from '@Components/ui';

const GeoDetection = () => {
	return (
		<Card>
			<Heading>{ __( 'Geo-Detection', 'storeengine' ) }</Heading>

			<Title as="p" className="mb-6">
				{ __(
					'Auto-detect visitor location via IP to display their local currency on first visit.',
					'storeengine'
				) }
			</Title>

			<Checkbox
				title={ __( 'Enable Geo-Currency Detection', 'storeengine' ) }
				subtitle={ __(
					'Sets the initial currency based on visitor IP. VPNs may affect accuracy. Visitors can always switch manually.',
					'storeengine'
				) }
				name="multi_currency.geolocation_enabled"
				suffix="plain"
			/>
		</Card>
	);
};

export default GeoDetection;
