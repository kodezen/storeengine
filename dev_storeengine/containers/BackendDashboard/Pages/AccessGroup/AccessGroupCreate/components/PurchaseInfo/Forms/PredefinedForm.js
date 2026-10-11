import React from 'react';
import { Select as Select2 } from '@Components/ui/Select';
import { __ } from '@wordpress/i18n';
import { Field, Formik, useFormikContext } from 'formik';

const PredefinedForm = ( { productsPrices, products } ) => {
	const { values, setFieldValue, setValues } = useFormikContext();

	return (
		<>
			<Select2
				className="storeengine-select storeengine-width-full storeengine-mt-4 storeengine-mb-4"
				classNamePrefix="storeengine-react-select"
				placeholder={ __( 'Price', 'storeengine' ) }
				value={
					values?.price_id
						? productsPrices.find(
								( item ) => values?.price_id === item.value
						  )
						: []
				}
				onChange={ ( option ) => {
					if ( option ) {
						const filteredPrice = products.find(
							( item ) =>
								parseInt( item.value ) ===
								parseInt( values?.product_id )
						)?.prices;
						if ( filteredPrice.length > 0 ) {
							const { id, ...restFilteredPrice } =
								filteredPrice.find(
									( item ) =>
										parseInt( item.id ) ===
										parseInt( option.value )
								);
							setValues( {
								...values,
								price_id: id,
								...restFilteredPrice,
							} );
						}
					} else {
						setFieldValue( 'price_type', '' );
						setFieldValue( 'price_id', '' );
						setFieldValue( 'price_name', '' );
						setFieldValue( 'compare_price', '' );
					}
				} }
				options={ productsPrices }
				isClearable={ true }
				isMulti={ false }
			/>
		</>
	);
};

export default PredefinedForm;
