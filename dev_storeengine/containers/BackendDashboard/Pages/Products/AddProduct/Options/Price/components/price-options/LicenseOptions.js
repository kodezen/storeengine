import React from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import Number from '@Components/Formik/Number';
import { useFormikContext } from 'formik';

const LicenseOptions = ( { priceProps, isSingle = false } ) => {
	const { submitForm } = useFormikContext();
	return (
		<div className="storeengine-flex storeengine-flex-gap-8 storeengine-product-license-activation-limit">
			<Checkbox
				title={ __( 'Custom license activation limit', 'storeengine' ) }
				subtitle={ __(
					'The maximum number of unique activations allowed per license key for this price. Use 0 (zero) for unlimited activation.',
					'storeengine'
				) }
				name="enable_license_activation_limit"
				direction={ true }
				onBlur={ () => isSingle && submitForm() }
				suffix={ isSingle ? ' storeengine-mb-0' : '' }
			/>

			{ priceProps.values?.enable_license_activation_limit && (
				<Number
					name="license_activation_limit"
					prefix="license-activation-limit"
					min={ 0 }
					step={ 1 }
					onBlur={ () => isSingle && submitForm() }
				/>
			) }
		</div>
	);
};

export default LicenseOptions;
