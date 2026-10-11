import React from 'react';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { useFormikContext } from 'formik';
import { Scope, Heading } from '@Components/ui';
import ProductPricePicker from '../ProductPricePicker';

/**
 * The coupon's product restriction.
 *
 * Add-on discount types can relabel this section through
 * `storeengine.coupon_editor.product_section` — a "Buy X Get Y" coupon, for
 * example, presents the same list as the products that unlock the reward.
 *
 * @return {JSX.Element} The section.
 */
const SpecificProduct = () => {
	const { values } = useFormikContext();

	const labels = applyFilters(
		'storeengine.coupon_editor.product_section',
		{
			heading: __( 'Select Products', 'storeengine' ),
			hint: __(
				'Select specific items for this coupon, or leave blank to apply it to your entire store automatically.',
				'storeengine'
			),
		},
		{ type: values?.meta?._storeengine_coupon_type, values }
	);

	return (
		<Scope
			as="div"
			id="whoCanUse"
			className="storeengine-content-section storeengine-content-section__specific-product"
		>
			<Heading as="p">{ labels.heading }</Heading>

			<ProductPricePicker
				name="meta._storeengine_coupon_valid_prices"
				emptyHint={ labels.hint }
			/>
		</Scope>
	);
};

export default SpecificProduct;
