import React from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import Number from '@Components/Formik/Number';
import { useFormikContext } from 'formik';

const OneTimeOptions = ( { priceProps, isSingle = false } ) => {
	const { submitForm } = useFormikContext();
	return (
		<div className="storeengine-flex storeengine-flex-gap-8  storeengine-product-expire">
			<Checkbox
				title={ __( 'Expire', 'storeengine' ) }
				subtitle={ __(
					'Set product access expiration date in days.',
					'storeengine'
				) }
				name="expire"
				direction={ true }
				onBlur={ () => isSingle && submitForm() }
			/>

			{ priceProps.values.expire && (
				<Number
					name="expire_days"
					prefix="expire-days"
					unit={ __( 'Days', 'storeengine' ) }
					onBlur={ () => isSingle && submitForm() }
				/>
			) }
		</div>
	);
};

export default OneTimeOptions;
