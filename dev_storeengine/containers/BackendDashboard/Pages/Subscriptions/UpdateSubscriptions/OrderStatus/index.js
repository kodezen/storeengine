import React from 'react';
import { __ } from '@wordpress/i18n';
import Select from '@Components/Formik/Select';
import { Card, Heading } from '@Components/ui';

const orderStatus = [
	{
		label: __( 'Active', 'storeengine' ),
		value: 'active',
	},
	{
		label: __( 'Pending', 'storeengine' ),
		value: 'pending',
	},
	{
		label: __( 'Pending Cancellation', 'storeengine' ),
		value: 'pending_cancel',
	},
	{
		label: __( 'On-Hold', 'storeengine' ),
		value: 'on_hold',
	},
	{
		label: __( 'Cancelled', 'storeengine' ),
		value: 'cancelled',
	},
];

const OrderStatus = ( { ID } ) => {
	return (
		<Card className="mb-6">
			<Heading>{ __( 'Subscription Status', 'storeengine' ) }</Heading>
			<Select
				title={ __( 'Subscription Status', 'storeengine' ) }
				options={ orderStatus }
				name="status"
			/>
		</Card>
	);
};

export default OrderStatus;
