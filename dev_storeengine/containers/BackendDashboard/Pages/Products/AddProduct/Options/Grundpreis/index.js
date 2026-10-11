import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import Label from '@Components/Formik/Label';
import { Scope, Heading } from '@Components/ui';

// Grundpreis (PAngV base price per unit). Gated on the eu-compliance addon by
// the parent. Unit slugs/families MUST stay in sync with the PHP unit map in
// addons/eu-compliance/eu-compliance.php (grundpreis_units()).
const unitGroups = [
	{
		label: __( 'Weight', 'storeengine' ),
		options: [
			{ value: 'mg', label: __( 'mg', 'storeengine' ) },
			{ value: 'g', label: __( 'g', 'storeengine' ) },
			{ value: 'kg', label: __( 'kg', 'storeengine' ) },
		],
	},
	{
		label: __( 'Volume', 'storeengine' ),
		options: [
			{ value: 'ml', label: __( 'ml', 'storeengine' ) },
			{ value: 'cl', label: __( 'cl', 'storeengine' ) },
			{ value: 'l', label: __( 'l', 'storeengine' ) },
		],
	},
	{
		label: __( 'Length', 'storeengine' ),
		options: [
			{ value: 'mm', label: __( 'mm', 'storeengine' ) },
			{ value: 'cm', label: __( 'cm', 'storeengine' ) },
			{ value: 'm', label: __( 'm', 'storeengine' ) },
		],
	},
	{
		label: __( 'Area', 'storeengine' ),
		options: [
			{ value: 'cm2', label: __( 'cm²', 'storeengine' ) },
			{ value: 'm2', label: __( 'm²', 'storeengine' ) },
		],
	},
	{
		label: __( 'Count', 'storeengine' ),
		options: [ { value: 'piece', label: __( 'piece', 'storeengine' ) } ],
	},
];

const flatUnits = unitGroups.flatMap( ( g ) => g.options );

const Grundpreis = () => {
	const { values, setFieldValue } = useFormikContext();
	const enabled =
		!! values?.meta?._storeengine_product_grundpreis_enabled;

	const findUnit = ( key ) =>
		flatUnits.find( ( u ) => u.value === values?.meta?.[ key ] ) || null;

	return (
		<Scope
			as="div"
			className="storeengine-content-section storeengine-content-section__grundpreis"
		>
			<Heading as="p">
				{ __( 'Base price (Grundpreis)', 'storeengine' ) }
			</Heading>
			<p className="storeengine-checkbox--desc mb-6">
				{ __(
					'Show a unit price next to the selling price (PAngV), e.g. “6,00 € / 1 kg”. Required in Germany for goods sold by weight, volume, length or area.',
					'storeengine'
				) }
			</p>

			<Checkbox
				title={ __( 'Enable base price', 'storeengine' ) }
				suffix="plain"
				name="meta._storeengine_product_grundpreis_enabled"
			/>

			{ enabled ? (
				<div className="storeengine-grundpreis-fields mt-6">
					<div className="storeengine-grundpreis-row">
						<Text
							title={ __( 'Package content', 'storeengine' ) }
							placeholder="500"
							name="meta._storeengine_product_grundpreis_content"
						/>
						<div>
							<Label
								htmlFor="grundpreis_content_unit"
								title={ __( 'Content unit', 'storeengine' ) }
							/>
							<Select
								inputId="grundpreis_content_unit"
								options={ unitGroups }
								className="storeengine-select"
								classNamePrefix="storeengine-react-select"
								placeholder={ __( 'Unit', 'storeengine' ) }
								value={ findUnit(
									'_storeengine_product_grundpreis_content_unit'
								) }
								onChange={ ( option ) =>
									setFieldValue(
										'meta._storeengine_product_grundpreis_content_unit',
										option ? option.value : ''
									)
								}
							/>
						</div>
					</div>

					<div className="storeengine-grundpreis-row mt-6">
						<Text
							title={ __( 'Reference amount', 'storeengine' ) }
							placeholder="1"
							name="meta._storeengine_product_grundpreis_base"
						/>
						<div>
							<Label
								htmlFor="grundpreis_base_unit"
								title={ __( 'Reference unit', 'storeengine' ) }
							/>
							<Select
								inputId="grundpreis_base_unit"
								options={ unitGroups }
								className="storeengine-select"
								classNamePrefix="storeengine-react-select"
								placeholder={ __( 'Unit', 'storeengine' ) }
								value={ findUnit(
									'_storeengine_product_grundpreis_base_unit'
								) }
								onChange={ ( option ) =>
									setFieldValue(
										'meta._storeengine_product_grundpreis_base_unit',
										option ? option.value : ''
									)
								}
							/>
						</div>
					</div>

					<p className="storeengine-checkbox--desc">
						{ __(
							'Content and reference unit must be the same measurement type (e.g. both weight). Example: content 500 g, reference 1 kg.',
							'storeengine'
						) }
					</p>
				</div>
			) : null}
		</Scope>
	);
};

export default Grundpreis;
