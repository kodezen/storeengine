import React from 'react';
import { __ } from '@wordpress/i18n';
import Number from '@Components/Formik/Number';
import { useFormikContext } from 'formik';
import { getPriceUnitCaption } from '../helper';

const CommonFields = ( { isSingle = false } ) => {
	const { values, submitForm } = useFormikContext();

	// Donation / name-your-price: the customer sets the amount, so a compare-at
	// "was" price is meaningless and Price is only the base/starting amount.
	const customerPriced = [ 'name_your_price', 'donation' ].includes(
		values?.donation?.mode
	);

	return (
		<div className="storeengine-flex storeengine-flex-gap-8">
			<Number
				title={
					customerPriced
						? __( 'Base price', 'storeengine' )
						: __( 'Price', 'storeengine' )
				}
				subtitle={ getPriceUnitCaption( values ) }
				name="price"
				prefix="price"
				currency
				onBlur={ () => isSingle && submitForm() }
			/>
			{ ! customerPriced && (
				<Number
					title={ __( 'Compare Price', 'storeengine' ) }
					name="compare_price"
					prefix="price-comparison"
					currency
					onBlur={ () => isSingle && submitForm() }
				/>
			) }
		</div>
	);
};

export default CommonFields;
