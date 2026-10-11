import React, { useEffect } from 'react';
import Text from '@Components/Formik/Text';
import { __ } from '@wordpress/i18n';
import RenderField from './RenderField';
import { useFormikContext } from 'formik';

import './styles.scss';

const freeShippingRequires = [
	{
		value: 'no_requirement',
		label: __( 'No Requirement', 'storeengine' ),
	},
	{
		value: 'shipping_coupon',
		label: __( 'A valid free shipping coupon', 'storeengine' ),
	},
	{
		value: 'minimum_order',
		label: __( 'A minimum order amount', 'storeengine' ),
	},
	{
		value: 'minimum_order_or_coupon',
		label: __( 'A minimum order amount or coupon', 'storeengine' ),
	},
	{
		value: 'minimum_order_and_coupon',
		label: __( 'A minimum order amount and coupon', 'storeengine' ),
	},
];

const MethodSetting = ( { methodsData } ) => {
	const { values, setFieldValue } = useFormikContext();
	const fields = methodsData.find(
		( methodItem ) => methodItem.method === values.method_id
	)?.fields;

	useEffect( () => {
		if ( fields ) {
			Object.entries( fields ).forEach( ( [ key, fieldData ] ) => {
				if ( values[ key ] === undefined ) {
					setFieldValue( key, fieldData.default );
				}
			} );
		}
	}, [ fields, values ] );

	return (
		<div className="shipping-zone--method-setting">
			<Text
				title={ __( 'Description', 'storeengine' ) }
				prefix="name"
				name="description"
				readOnly={ false }
				suffix="name"
				desc={ __(
					'Your customers will see the name of this shipping method during checkout.',
					'storeengine'
				) }
			/>
			{ fields &&
				Object.entries( fields ).map( ( [ key, fieldData ] ) => {
					return (
						<RenderField
							method={ values.method_id }
							name={ key }
							field={ fieldData }
							key={ key }
						/>
					);
				} ) }
		</div>
	);
};

export default MethodSetting;
