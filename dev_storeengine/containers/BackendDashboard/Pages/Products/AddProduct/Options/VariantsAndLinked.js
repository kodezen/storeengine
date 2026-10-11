import React, { useState } from 'react';
import { useFormikContext } from 'formik';
import Variants from './Variants';
import VariantsViewToggle from './Variants/VariantsViewToggle';
import LinkedProducts from './LinkedProducts';
import { Scope, Heading, Button } from '@Components/ui';
import { __ } from '@wordpress/i18n';


const tabs = [
	{
		key: 'variants',
		label: __( 'Variants', 'storeengine' ),
		content: ( props ) => <Variants ID={ props.ID } />,
	},
	// {
	// 	key: 'linked-products',
	// 	label: __('Linked Products', 'storeengine'),
	// 	content: () => <LinkedProducts />,
	// },
];

const VariantsAndLinked = ( props ) => {
	const [ active, setActive ] = useState( 'variants' );
	const { values } = useFormikContext();
	const hasVariants =
		Array.isArray( values?.variants ) && values.variants.length > 0;

	return (
		<Scope as="div" className="storeengine-content-section">
			{ /* <div className="storeengine-variants-linked__items">
				{tabs.map((tab) => (
					<Button
						key={tab.key}
						label={tab.label}
						suffix={`variants-linked__${
							tab.key === active ? 'active' : 'inactive'
						}`}
						onClick={() => setActive(tab.key)}
						preset="transparent"
					/>
				))}
			</div> */ }
			<Heading
				as="div"
				className="flex flex-wrap items-center justify-between gap-3"
			>
				<span>{ __( 'Variants', 'storeengine' ) }</span>
				{ hasVariants && <VariantsViewToggle /> }
			</Heading>
			{ /* {tabs.find((tab) => tab.key === active)?.content(props)} */ }
			<Variants ID={ props.ID } />
		</Scope>
	);
};

export default VariantsAndLinked;
