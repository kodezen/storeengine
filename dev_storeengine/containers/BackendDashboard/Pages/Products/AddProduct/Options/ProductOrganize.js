import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import Categories from '@Components/Term/Categories';
import Brands from '@Components/Term/Brands';
import Tags from '@Components/Term/Tags';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import { Scope, Heading } from '@Components/ui';
import { isAddonActive } from '@Utils/helper';
import { FieldGate } from '../productFormConfig';

const ProductOrganize = ( { mode } ) => {
	const { values, setFieldValue } = useFormikContext();

	return (
		<Scope as="div" id="productTemplate" className="storeengine-content-section">
			<Heading>{ __( 'Product Organize', 'storeengine' ) }</Heading>
			<FieldGate id="categories">
				<Categories
					label={ __( 'Product Category', 'storeengine' ) }
					values={ values.storeengine_product_category }
					name={ 'storeengine_product_category' }
					autoInsert={ true }
					saveValueHandler={ setFieldValue }
					type="product"
					allowNewCategory={ mode !== 'vendor' }
				/>
			</FieldGate>
			<FieldGate id="tags">
				<StoreEngineSeparator isTop={ true } isBottom={ true } />
				<Tags
					label={ __( 'Product Tags', 'storeengine' ) }
					values={ values.storeengine_product_tag }
					saveValueHandler={ setFieldValue }
					type="product"
				/>
			</FieldGate>
			{ isAddonActive( 'brand' ) && (
				<FieldGate id="brands">
					<StoreEngineSeparator isTop={ true } isBottom={ true } />
					<Brands
						label={ __( 'Product Brands', 'storeengine' ) }
						values={ values.storeengine_product_brand }
						name="storeengine_product_brand"
						allowNewBrand={ mode !== 'vendor' }
						saveValueHandler={ setFieldValue }
						type="product"
					/>
				</FieldGate>
			) }
		</Scope>
	);
};

export default ProductOrganize;
