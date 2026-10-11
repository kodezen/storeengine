import React from 'react';
import { __ } from '@wordpress/i18n';
import Tooltip from '@Components/Tooltip';
import { Field, useFormikContext } from 'formik';
import SwitchControl from '@Components/Formik/Checkbox/SwitchControl';
import ProductSlugV2 from '@Components/PostTitle/ProductSlugV2';
import { Scope } from '@Components/ui';
import { FieldGate, getProductFormField } from '../productFormConfig';

const Publishing = ( { ID } ) => {
	const { values, setFieldValue } = useFormikContext();

	// Both settings hidden: don't leave an empty card behind.
	if (
		getProductFormField( 'hide_from_shop' )?.hidden &&
		getProductFormField( 'slug' )?.hidden
	) {
		return null;
	}

	return (
		<Scope as="div" className="storeengine-content-section storeengine-product-publishing">
			<FieldGate id="hide_from_shop">
			<div className="flex items-center justify-between">
				<p className="storeengine-sub-title-bold storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8">
					{ __( 'Hide This Product', 'storeengine' ) }
					<Tooltip>
						{ __(
							'Hide this product from public view for now.',
							'storeengine'
						) }
					</Tooltip>
				</p>
				<Field
					type="checkbox"
					name="meta._storeengine_product_hide"
					component={ SwitchControl }
				/>
			</div>
			</FieldGate>

			<FieldGate id="slug">
			<div className="inside">
				<ProductSlugV2
					ID={ ID }
					name="slug"
					label={ __( 'Slug', 'storeengine' ) }
					linkPreview={ false }
					postTitle={ values.title }
					defaultValue={ values.link }
					saveValueHandler={ setFieldValue }
				/>
			</div>
			</FieldGate>
		</Scope>
	);
};

export default Publishing;
