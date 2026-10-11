import React, { useState } from 'react';
import { Field, useFormikContext } from 'formik';
import { __ } from '@wordpress/i18n';
import Text from '@Components/Formik/Text';
import Select from '@Components/Formik/Select';
import { Scope, Button, Row, Title } from '@Components/ui';
import { arrayMoveImmutable } from 'array-move';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import OptionMenu from '@Components/OptionMenu';
import TaxClassModal from './TaxClassModal';

import './styles.scss';

const ProductTaxModal = ( { setOpenModal } ) => {
	const [ items, setItems ] = useState( [
		'Standard',
		'Zero rate',
		'Reduce rate',
	] );

	const [ openAdditionalClassModal, setOpenAdditionalClassModal ] =
		useState( false );

	const { values } = useFormikContext();

	const productTaxType = [
		{
			label: __( 'Automatic', 'storeengine' ),
			value: 'automatic',
		},
		{
			label: __( 'Manual', 'storeengine' ),
			value: 'manual',
		},
	];

	const countryOptions = [
		{ value: 'USA', label: __( 'United States', 'storeengine' ) },
		{ value: 'CAN', label: __( 'Canada', 'storeengine' ) },
		{ value: 'GBR', label: __( 'United Kingdom', 'storeengine' ) },
		{ value: 'AUS', label: __( 'Australia', 'storeengine' ) },
	];

	const StateOptions = [
		{ value: 'california', label: 'California' },
		{ value: 'new-york', label: 'New York' },
		{ value: 'texas', label: 'Texas' },
	];

	const listOptions = [
		{
			type: 'button',
			label: __( 'Edit', 'storeengine' ),
		},
		{
			type: 'button',
			label: __( 'Duplicate', 'storeengine' ),
		},
		{
			type: 'button',
			label: __( 'Delete', 'storeengine' ),
		},
	];

	const DraggableList = sortableContainer( ( { dragItems } ) => {
		return (
			<ul className="draggable-items">
				{ dragItems.map( ( value, index ) => (
					<DraggableItem
						key={ `item-${ index }` }
						index={ index }
						value={ value }
					/>
				) ) }
			</ul>
		);
	} );

	const DraggableItem = sortableElement( ( { value } ) => {
		return (
			<li className="draggable-item">
				<span className="storeengine-icon storeengine-icon--drag"></span>
				<div className="draggable-item--value">{ value }</div>
				<OptionMenu options={ listOptions } />
			</li>
		);
	} );

	const onSortEnd = ( { oldIndex, newIndex } ) => {
		setItems( arrayMoveImmutable( items, oldIndex, newIndex ) );
	};

	return (
		<Scope>
			<div className="tax-type flex gap-4">
				{ productTaxType.map( ( product, index ) => {
					return (
						<label
							className="flex items-center gap-2"
							key={ index }
							htmlFor={ index }
						>
							<Field
								id={ index }
								type="radio"
								className="storeengine-radio"
								name="storeengine_product_tax_type"
								value={ product.value }
							/>
							{ product.label }
						</label>
					);
				} ) }
			</div>

			<Text
				title={ __( 'Tax Name', 'storeengine' ) }
				name={ 'storeengine_product_tax_name' }
				placeholder={ 't-shirt' }
			/>

			{ values?.storeengine_product_tax_type === 'automatic' ? (
				<>
					<div className="double-fields grid grid-cols-2 gap-4">
						<Select
							title={ __( 'Country', 'storeengine' ) }
							name={ 'storeengine_product_tax_country' }
							options={ countryOptions }
						/>
						<Select
							title={ __( 'State/Province', 'storeengine' ) }
							name={ 'storeengine_product_tax_country_state' }
							options={ StateOptions }
						/>
					</div>
				</>
			) : (
				values?.storeengine_product_tax_type === 'manual' && (
					<>
						<div className="content-box">
							<Row justify="between" align="center" className="content-box__header">
								<Title as="h3">
									{ __(
										'Additional Tax Classes',
										'storeengine'
									) }
								</Title>
								<Button
									type="button"
									preset="link"
									onClick={ () =>
										setOpenAdditionalClassModal( true )
									}
								>
									{ __(
										'+ Add Additional Class',
										'storeengine'
									) }
								</Button>
							</Row>
							<DraggableList
								items={ items }
								onSortEnd={ onSortEnd }
								axis="y"
							/>
						</div>
					</>
				)
			) }

			<Row justify="end" gap={ 3 } className="storeengine-react-modal__footer mt-4">
				<Button
					type="button"
					onClick={ () => setOpenModal( false ) }
					preset="outline"
				>
					{ __( 'Cancel', 'storeengine' ) }
				</Button>
				<Button type="submit" preset="primary">
					{ __( 'Submit', 'storeengine' ) }
				</Button>
			</Row>

			{ openAdditionalClassModal && (
				<TaxClassModal
					setOpenModal={ setOpenAdditionalClassModal }
					isOpen={ openAdditionalClassModal }
				/>
			) }
		</Scope>
	);
};

export default ProductTaxModal;
