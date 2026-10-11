import React from 'react';
import { __ } from '@wordpress/i18n';
import { Field } from 'formik';
import { Scope } from '@Components/ui';

import './styles.scss';

const Advance = () => {
	const checkoutType = [
		{
			label: __( 'Customers checkout without an account', 'storeengine' ),
			value: 'customers-checkout-without-an-account',
		},
		{
			label: __( 'Customers login before checkout', 'storeengine' ),
			value: 'customers-login-before-checkout',
		},
	];

	const shippingAddressType = [
		{
			label: __( "Don't include", 'storeengine' ),
			value: 'dontInclude',
		},
		{
			label: __( 'Optional', 'storeengine' ),
			value: 'optional',
		},
		{
			label: __( 'Required', 'storeengine' ),
			value: 'required',
		},
	];

	return (
		<Scope
			as="div"
			id="advance"
			className="storeengine-tab-content storeengine-tab-content-advance"
		>
			<div className="storeengine-tab-content--section">
				<h2 className="section-title">
					{ __( 'Customer checkout method', 'storeengine' ) }
				</h2>

				<div className="storeengine-settings-radio-buttons">
					{ checkoutType.map( ( option, index ) => {
						return (
							<label
								className="flex items-center gap-2"
								htmlFor={ index }
								key={ index }
							>
								<Field
									id={ index }
									type="radio"
									className="storeengine-radio"
									name="checkoutType"
									value={ option.value }
								/>
								{ option.label }
							</label>
						);
					} ) }
				</div>
			</div>

			<div className="storeengine-tab-content--section">
				<h2 className="section-title">
					{ __( 'Shipping address required', 'storeengine' ) }
				</h2>

				<div className="storeengine-settings-radio-buttons">
					{ shippingAddressType.map( ( SingleOption, index ) => {
						return (
							<label
								className="flex items-center gap-2"
								htmlFor={ index }
								key={ index }
							>
								<Field
									id={ index }
									type="radio"
									className="storeengine-radio"
									name="shipping_address_ype"
									value={ SingleOption.value }
								/>
								{ SingleOption.label }
							</label>
						);
					} ) }
				</div>
			</div>
		</Scope>
	);
};

export default Advance;
