import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import StoreEngineSelect from '@Components/StoreEngineSelect';
import { Select } from '@Components/ui/Select';
import SpecificCustomers from './SpecificCustomers';
import { Scope, Heading } from '@Components/ui';

const users = [
	{
		label: __( 'All Customers', 'storeengine' ),
		value: 'allCustomer',
	},
	{
		label: __( 'New Customers Only', 'storeengine' ),
		value: 'newCustomer',
	},
	{
		label: __( 'Current Customers Only', 'storeengine' ),
		value: 'currentCustomer',
	},
	{
		label: __( 'Specific Customers Only', 'storeengine' ),
		value: 'specificCustomer',
	},
];

const WhoCanUse = () => {
	const { values, setFieldValue } = useFormikContext();

	return (
		<Scope
			as="div"
			id="whoCanUse"
			className="storeengine-content-section storeengine-content-section__who-can-use"
		>
			<Heading as="p">
				{ __( 'Who can use', 'storeengine' ) }
			</Heading>

			<div className="storeengine-tab-content___who-can-use--body">
				<Select
					id="meta._storeengine_coupon_who_can_use"
					name="meta._storeengine_coupon_who_can_use"
					className="storeengine-select storeengine-select__width-full storeengine-mt-4"
					classNamePrefix="storeengine-react-select"
					options={ users }
					value={
						values.meta._storeengine_coupon_who_can_use
							? users.find(
									( option ) =>
										option.value ===
										values.meta
											._storeengine_coupon_who_can_use
							  )
							: users[ 0 ]
					}
					onChange={ ( option ) => {
						setFieldValue(
							'meta._storeengine_coupon_who_can_use',
							option.value
						);
					} }
				/>
				{ values.meta._storeengine_coupon_who_can_use ===
					'specificCustomer' && <SpecificCustomers /> }
			</div>
		</Scope>
	);
};

export default WhoCanUse;
