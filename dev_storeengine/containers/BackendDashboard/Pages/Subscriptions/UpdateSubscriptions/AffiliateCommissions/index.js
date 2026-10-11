import React from 'react';
import { Select } from '@Components/ui/Select';
import { __ } from '@wordpress/i18n';
import { Scope, Card, Heading, SubTitle } from '@Components/ui';

const AffiliateCommissions = () => {
	return (
		<Scope>
			<Card className="mb-6">
				<Heading>{ __( 'Affiliate Commissions', 'storeengine' ) }</Heading>
				<Select
					className="storeengine-select storeengine-mt-2"
					classNamePrefix="storeengine-react-select"
					options={ [
						{
							label: 'Select',
							value: 'select',
						},
					] }
				/>
				<SubTitle className="mt-2">
					This will give the affiliate commissions for a specified
					period of time.
				</SubTitle>
			</Card>
		</Scope>
	);
};

export default AffiliateCommissions;
