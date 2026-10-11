import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Field, useFormikContext } from 'formik';
import Text from '@Components/Formik/Text';

import './styles.scss';

const logInOptions = [
	{
		label: __( 'Default', 'storeengine' ),
		value: 'default',
	},
	{
		label: __( 'StoreEngine', 'storeengine' ),
		value: 'storeengine',
	},
	{
		label: __( 'Custom', 'storeengine' ),
		value: 'custom',
	},
];

const LoginPages = () => {
	const { values, setFieldValue } = useFormikContext();

	useEffect( () => {
		if ( ! values?.auth_redirect_type ) {
			setFieldValue( 'auth_redirect_type', 'storeengine_login' );
		}
	}, [ values?.auth_redirect_type, setFieldValue ] );

	return (
		<>
			<div className="storeengine-flex storeengine-flex-justify-between storeengine-auth-redirect">
				<p className="storeengine-title-subtitle">
					<span className="storeengine-title">
						{ __( 'Auth Redirect', 'storeengine' ) }
					</span>
					<span className="storeengine-sub-title">
						{ __( 'Select option you want to login.', 'storeengine' ) }
					</span>
				</p>

				<div className="storeengine-auth-redirect--items">
					{ logInOptions.map( ( item, index ) => (
						<label
							className="storeengine-content-section--pages--item"
							key={ index }
							htmlFor={ `auth_redirect_type-${ index }` }
						>
							<Field
								id={ `auth_redirect_type-${ index }` }
								name="auth_redirect_type"
								type="radio"
								value={ item.value }
								className="storeengine-radio"
							/>
							<span className="storeengine-radio-label">
								{ item.label }
							</span>
						</label>
					) ) }
				</div>
			</div>

			{ values.auth_redirect_type === 'custom' && (
				<div className='storeengine-flex storeengine-flex-justify-end'>
					<Text
						placeholder={ __( 'Custom Login URL', 'storeengine' ) }
						type="url"
						name="auth_redirect_url"
						prefix="custom-login"
					/>
				</div>
			) }
		</>
	);
};

export default LoginPages;
