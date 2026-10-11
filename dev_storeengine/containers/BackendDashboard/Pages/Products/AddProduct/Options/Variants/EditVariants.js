import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import Button from '@Components/Button';
import { Select } from '@Components/ui/Select';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import NewVariantTerm, { toTermOption } from './NewVariantTerm';
import RemoveValueModal from './RemoveValueModal';
import {
	countDroppedSavedVariants,
	generateCombinations,
	handleManageAttributes,
	syncOldCombinationsWithNew,
	updateCombinationNames,
} from './helper';
import './styles.scss';

// Round color / image chip for attribute terms that carry swatch meta.
const TermSwatch = ( { color, image } ) => {
	if ( ! color && ! image ) {
		return null;
	}

	return (
		<span
			className="storeengine-variants-edit__swatch"
			aria-hidden="true"
			style={ color && ! image ? { backgroundColor: color } : undefined }
		>
			{ image && <img src={ image } alt="" /> }
		</span>
	);
};

const SortableVariantItem = SortableElement(
	( { editingValue, itemIndex, handleDelete, swatch } ) => (
		<div
			key={ `variant-${ itemIndex }` }
			className="storeengine-variants-edit__value-list-item"
		>
			<span className="dragble-variant-options">
				<span className="storeengine-icon storeengine-icon--drag"></span>
			</span>
			<TermSwatch color={ swatch?.color } image={ swatch?.image } />
			<span className="storeengine-variants-edit__value-name">
				{ editingValue?.name }
			</span>
			<Button
				icon={
					<span className="storeengine-icon storeengine-icon--close"></span>
				}
				preset="transparent"
				suffix="value-list-item-btn"
				aria-label={ __( 'Remove value', 'storeengine' ) }
				onClick={ () => handleDelete( editingValue.id ) }
			/>
		</div>
	)
);

const SortableVariantList = SortableContainer( ( { children } ) => (
	<div className="storeengine-variants-edit__value-list-parrent">
		{ children }
	</div>
) );

const EditVariants = ( {
	variant = { attributes: [] },
	index,
	setEditingVariant,
	variants,
	setVariants,
	attributesTerms,
	setGeneratedVariants,
	generatedVariants,
	onDeleteAttribute,
	onTermsCreated,
} ) => {
	const { setFieldValue } = useFormikContext();
	const attributeType = useSelector(
		( state ) =>
			state.attributes?.data?.find(
				( a ) => String( a?.attribute_id ) === String( variant?.attribute_id )
			)?.attribute_type || 'select'
	);
	const [ editedValues, setEditedValues ] = useState( [
		...variant?.attributes,
	] );
	const [ selectedValue, setSelectedValue ] = useState( '' );
	// Pending value removal awaiting confirmation when it would drop saved
	// variants: { value, dropped, newVariant, newVariants, syncNewGeneratedVariants }.
	const [ pendingRemoval, setPendingRemoval ] = useState( null );

	// Build the new state for removing a value, without applying it yet.
	const buildRemoval = ( id ) => {
		const newVariant = { ...variant };
		const removed = newVariant.attributes.find(
			( item ) => parseInt( item.id ) === parseInt( id )
		);
		newVariant.attributes = newVariant.attributes.filter(
			( item ) => parseInt( item.id ) !== parseInt( id )
		);
		const newVariants = variants.map( ( variantItem ) =>
			variantItem.name === newVariant.name ? newVariant : variantItem
		);
		const syncNewGeneratedVariants = syncOldCombinationsWithNew(
			generatedVariants,
			generateCombinations( newVariants )
		);

		return { removed, newVariant, newVariants, syncNewGeneratedVariants };
	};

	const applyRemoval = ( {
		newVariant,
		newVariants,
		syncNewGeneratedVariants,
	} ) => {
		setVariants( newVariants );
		setGeneratedVariants( syncNewGeneratedVariants );
		setEditedValues( newVariant.attributes );
		setFieldValue( 'attributes', handleManageAttributes( newVariants ) );
	};

	const handleDelete = ( id ) => {
		const result = buildRemoval( id );

		// The backend deletes every saved variation that isn't sent back, so
		// confirm the loss of saved variants (with their price/SKU/stock).
		const dropped = countDroppedSavedVariants(
			generatedVariants,
			result.syncNewGeneratedVariants
		);
		if ( dropped > 0 ) {
			setPendingRemoval( {
				...result,
				dropped,
				value: result.removed?.name || result.removed?.label || '',
			} );
			return;
		}

		applyRemoval( result );
	};

	const handleSaveChanges = ( newValue ) => {
		if ( ! newValue.name.trim() ) {
			return;
		}

		// Guard against adding the same term twice. Compare as strings because a
		// reloaded product can bring term ids back as strings while freshly
		// fetched terms are numbers — a `===` check would miss the duplicate and
		// let the same value be added multiple times.
		if (
			editedValues.some(
				( v ) => String( v.id ) === String( newValue.id )
			)
		) {
			return;
		}

		const updatedValues = [ ...editedValues ];

		if ( newValue ) {
			updatedValues.push( newValue );
		}

		const newVariants = [ ...variants ];
		newVariants[ index ] = {
			...newVariants[ index ],
			attributes: updatedValues,
		};

		setGeneratedVariants(
			generateCombinations( newVariants, generatedVariants )
		);
		const newAttribues = handleManageAttributes( newVariants );

		setVariants( newVariants );
		setEditedValues( updatedValues );
		setFieldValue( 'attributes', newAttribues );
		setSelectedValue( '' );
	};

	// String-normalise ids so already-added terms are reliably excluded even when
	// saved (reloaded) ids and freshly fetched term ids differ in type.
	const editedValueIds = new Set(
		editedValues.map( ( edited ) => String( edited.id ) )
	);
	const selectableVariantOptions = ( attributesTerms || [] )
		.filter( ( item ) => ! editedValueIds.has( String( item.id ) ) )
		.map( ( item ) => ( {
			label: item?.label,
			value: item?.id,
			color: item?.color,
			image: item?.image,
		} ) );

	const swatchFor = ( id ) =>
		( attributesTerms || [] ).find(
			( term ) => String( term.id ) === String( id )
		);

	const onSortEnd = ( { oldIndex, newIndex } ) => {
		const sortedValues = arrayMoveImmutable(
			editedValues,
			oldIndex,
			newIndex
		);
		const newVariant = { ...variant };
		newVariant.attributes = sortedValues;
		const newVariants = variants.map( ( variantItem ) => {
			if ( variantItem.name === newVariant.name ) {
				return newVariant;
			}
			return variantItem;
		} );
		const sortedAttributes = newVariants.map( ( item ) => ( {
			label: item.name,
			ids: item.attributes.map( ( attr ) => attr.id ),
		} ) );
		const generatedNewCombination = generateCombinations( newVariants );
		const syncedCombinations = syncOldCombinationsWithNew(
			generatedVariants,
			generatedNewCombination
		);
		setVariants( newVariants );
		setEditedValues( sortedValues );
		setGeneratedVariants( syncedCombinations );
		setFieldValue( `attributes`, sortedAttributes );
	};

	const handleDeleteAttribute = () => {
		onDeleteAttribute( variant?.name );
	};

	// A term was just created in this editor (single or from presets): make it
	// selectable everywhere and tick it for this product.
	const handleTermsCreated = ( created ) => {
		const options = ( created || [] ).map( toTermOption );
		if ( ! options.length ) {
			return;
		}
		onTermsCreated?.( variant?.attribute_id, options );

		const have = new Set( editedValues.map( ( v ) => String( v.id ) ) );
		const updatedValues = [
			...editedValues,
			...options
				.filter( ( o ) => ! have.has( String( o.id ) ) )
				.map( ( o ) => ( { name: o.label, id: o.id } ) ),
		];
		const newVariants = [ ...variants ];
		newVariants[ index ] = { ...newVariants[ index ], attributes: updatedValues };

		setGeneratedVariants( generateCombinations( newVariants, generatedVariants ) );
		setVariants( newVariants );
		setEditedValues( updatedValues );
		setFieldValue( 'attributes', handleManageAttributes( newVariants ) );
	};

	const handleAddAllVariants = () => {
		const updatedValues = [ ...editedValues ];

		const newValues = selectableVariantOptions.map( ( item ) => ( {
			name: item.label,
			id: item.value,
		} ) );
		updatedValues.push( ...newValues );

		const newVariants = [ ...variants ];
		newVariants[ index ] = {
			...newVariants[ index ],
			attributes: updatedValues,
		};

		setGeneratedVariants(
			generateCombinations( newVariants, generatedVariants )
		);
		const newAttribues = handleManageAttributes( newVariants );

		setVariants( newVariants );
		setEditedValues( updatedValues );
		setFieldValue( 'attributes', newAttribues );
	};

	return (
		<div className="storeengine-variants-edit storeengine-element-fade-in-transition">
			<div className="storeengine-variants-edit__header">
				<div className="storeengine-variants__drag-icon">
					<span className="storeengine-icon storeengine-icon--drag"></span>
					<span>{ variant.label }</span>
				</div>
			</div>

			<div className="storeengine-variants-edit__value-list">
				<div className="storeengine-variants-edit__value-list-label">
					<span className="storeengine-variants-edit__value-list-label-text">
						{ __( 'Option Value', 'storeengine' ) }
					</span>
					<Button
						type="button"
						preset="transparent"
						border="gray"
						suffix="value-list-label-btn"
						onClick={ handleAddAllVariants }
						label={ __( 'Add All Value', 'storeengine' ) }
					/>
				</div>
				{ editedValues.length > 0 && (
					<SortableVariantList
						onSortEnd={ onSortEnd }
						shouldCancelStart={ ( e ) =>
							! e.target.closest( '.dragble-variant-options' )
						}
						axis="xy"
					>
						{ editedValues.map( ( editingValue, editedIndex ) => (
							<SortableVariantItem
								key={ `variant-${ editedIndex }` }
								index={ editedIndex }
								itemIndex={ editedIndex }
								editingValue={ editingValue }
								swatch={ swatchFor( editingValue?.id ) }
								handleDelete={ handleDelete }
							/>
						) ) }
					</SortableVariantList>
				) }
				<Select
					key={ `variant-select-${ index }-${ selectedValue }` }
					className="storeengine-select varinats-select storeengine-width-full"
					classNamePrefix="storeengine-react-select"
					options={ selectableVariantOptions }
					formatOptionLabel={ ( option ) => (
						<span className="storeengine-variants-edit__option">
							<TermSwatch color={ option.color } image={ option.image } />
							{ option.label }
						</span>
					) }
					value={
						selectedValue
							? {
									label: selectedValue,
									value: selectedValue.toLowerCase(),
							  }
							: null
					}
					onChange={ ( option ) => {
						setSelectedValue( option.label );
						handleSaveChanges( {
							name: option.label,
							id: option.value,
						} );
					} }
					menuPlacement="top"
				/>
				<NewVariantTerm
					attributeId={ variant?.attribute_id }
					attributeType={ attributeType }
					onCreated={ handleTermsCreated }
				/>
			</div>

			<div className="storeengine-variants-edit__footer">
				{ /* <Button
					type="button"
					preset="transparent"
					border="gray"
					label={ __( 'Delete', 'storeengine' ) }
					onClick={ handleDeleteAttribute }
				/> */ }
				<Button
					type="button"
					preset="blue"
					isDisabled={ !! selectedValue }
					suffix="update-btn"
					label={ __( 'Update', 'storeengine' ) }
					onClick={ () => {
						setSelectedValue( '' );
						setEditingVariant( null );
					} }
				/>
			</div>

			<RemoveValueModal
				open={ !! pendingRemoval }
				value={ pendingRemoval?.value }
				dropped={ pendingRemoval?.dropped }
				onConfirm={ () => {
					applyRemoval( pendingRemoval );
					setPendingRemoval( null );
				} }
				onClose={ () => setPendingRemoval( null ) }
			/>
		</div>
	);
};

export default EditVariants;
