import React from 'react';
import { arrayMoveImmutable } from 'array-move';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import Preloader from '@Components/Loader/Preloader';
import { capitalizeFirstLetter } from '@Utils/helper';

import '@Components/Formik/SortableOptions/styles.scss';
import { useFormikContext } from 'formik';

const SortableItem = sortableElement( ( { item, itemIndex, onToggle } ) => (
	<li
		className={ `storeengine-sortable-list__item ${
			item.status ? 'visible' : 'invisible'
		}` }
		key={ `item-${ itemIndex }` }
	>
		<label
			htmlFor={ item.slug }
			className="storeengine-sortable-list__item-label"
		>
			{ capitalizeFirstLetter( item.label ) }
		</label>
		<button
			type="button"
			className="storeengine-sortable-list__item-control"
			onClick={ () => onToggle( item.slug ) }
		>
			{ item.status ? (
				<span
					className="storeengine-icon storeengine-icon--checked storeengine-checked-is-true"
					aria-hidden={ true }
				/>
			) : (
				<span
					className="storeengine-icon storeengine-icon--checked"
					aria-hidden={ true }
				/>
			) }
		</button>
	</li>
) );

const SortableList = sortableContainer( ( props ) => (
	<ul className="storeengine-sortable-list">{ props.children }</ul>
) );

export const SortableConfigOptions = ( {
	name,
	label,
	value,
	setProductFilterWidgets,
} ) => {
	const { setFieldValue } = useFormikContext();

	if ( ! Array.isArray( value ) ) {
		return <Preloader />;
	}

	const sortedArray = [ ...value ].sort( ( a, b ) => a.order - b.order );

	const onSortEnd = ( { oldIndex, newIndex } ) => {
		if ( oldIndex === newIndex ) {
			return;
		}

		const newSorted = arrayMoveImmutable(
			sortedArray,
			oldIndex,
			newIndex
		).map( ( item, idx ) => ( {
			...item,
			order: idx,
		} ) );

		const formattedFilters = newSorted.reduce( ( acc, item ) => {
			acc[ item.slug ] = {
				status: item.status,
				order: item.order,
			};

			return acc;
		}, {} );

		setFieldValue( name, formattedFilters );
		setProductFilterWidgets( newSorted );
	};

	const onToggleStatus = ( slug ) => {
		const updated = value.map( ( item ) =>
			item.slug === slug ? { ...item, status: ! item.status } : item
		);
		const formattedFilters = updated.reduce( ( acc, item ) => {
			acc[ item.slug ] = {
				status: item.status,
				order: item.order,
			};

			return acc;
		}, {} );
		setFieldValue( name, formattedFilters );
		setProductFilterWidgets( updated );
	};

	return (
		<div className="form-group">
			<div className="form-body">
				<div className="storeengine-control-field storeengine-control-field--sortable">
					<SortableList onSortEnd={ onSortEnd }>
						{ sortedArray.map( ( item, index ) => (
							<SortableItem
								key={ `item-${ index }` }
								index={ index }
								itemIndex={ index }
								item={ item }
								onToggle={ onToggleStatus }
							/>
						) ) }
					</SortableList>
				</div>
			</div>
		</div>
	);
};
