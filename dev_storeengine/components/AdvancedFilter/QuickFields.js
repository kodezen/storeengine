import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Select } from '@Components/ui';
import { isComplete } from './utils';

/**
 * Quick filters: the few fields a list marks with `quick: true` get a direct
 * control instead of a condition row. They read and write the first group of
 * the same draft the condition builder uses, so applying, saved views, chips
 * and the URL all keep working off one model.
 *
 * Each quick field owns ONE condition in group 0: the field with its "canonical"
 * operator (below). Anything else (other operators, other fields, "or" groups)
 * stays in the condition builder under "Add condition".
 */

const opByValue = ( field, ...values ) =>
	values
		.map( ( v ) => field.operators.find( ( o ) => o.value === v ) )
		.find( Boolean ) || field.operators[ 0 ];

/**
 * The operator a quick control uses for a field.
 *
 * @param {Object} field Field config.
 * @return {Object} Operator config.
 */
export const quickOp = ( field ) => {
	switch ( field.type ) {
		case 'number':
			return opByValue( field, 'between' );
		case 'multiselect':
			return opByValue( field, 'in' );
		case 'select':
			return opByValue( field, 'is', 'equals' );
		default:
			return opByValue( field, 'contains', 'equals' );
	}
};

/**
 * Whether a condition is the one a quick control manages.
 *
 * @param {Array}  fields Field configs.
 * @param {Object} c      Condition.
 * @return {boolean} True when a quick control owns it.
 */
export const isQuickCondition = ( fields, c ) => {
	const field = fields.find( ( f ) => f.id === c.field );
	return !! field?.quick && c.operator === quickOp( field ).value;
};

export const hasQuickFields = ( fields ) => fields.some( ( f ) => f.quick );

const findIndex = ( group, field ) =>
	group.findIndex(
		( c ) => c.field === field.id && c.operator === quickOp( field ).value
	);

const QuickFields = ( { fields, draft, setDraft } ) => {
	const quick = fields.filter( ( f ) => f.quick );
	const group = draft[ 0 ] || [];

	const read = ( field ) => {
		const idx = findIndex( group, field );
		return idx > -1 ? group[ idx ].value : undefined;
	};

	const write = ( field, value ) => {
		const op = quickOp( field );
		const next = { field: field.id, operator: op.value, value };
		const empty = ! isComplete( fields, next );
		setDraft( ( d ) => {
			const g = d[ 0 ] ? [ ...d[ 0 ] ] : [];
			const rest = d.slice( 1 );
			const idx = findIndex( g, field );
			if ( empty ) {
				if ( idx > -1 ) {
					g.splice( idx, 1 );
				}
			} else if ( idx > -1 ) {
				g[ idx ] = next;
			} else {
				g.push( next );
			}
			if ( rest.length ) {
				return [ g, ...rest ];
			}
			return g.length ? [ g ] : [];
		} );
	};

	const control = ( field ) => {
		const value = read( field );

		if ( 'number' === field.type ) {
			const [ a = '', b = '' ] = Array.isArray( value ) ? value : [];
			return (
				<div className="storeengine-adv-quick__range">
					<input
						type="number"
						value={ a }
						placeholder={ __( 'Min', 'storeengine' ) }
						aria-label={ `${ field.label }: ${ __(
							'Min',
							'storeengine'
						) }` }
						onChange={ ( e ) =>
							write( field, [ e.target.value, b ] )
						}
					/>
					<input
						type="number"
						value={ b }
						placeholder={ __( 'Max', 'storeengine' ) }
						aria-label={ `${ field.label }: ${ __(
							'Max',
							'storeengine'
						) }` }
						onChange={ ( e ) =>
							write( field, [ a, e.target.value ] )
						}
					/>
				</div>
			);
		}

		if ( 'multiselect' === field.type ) {
			return (
				<Select
					isMulti
					isSearchable
					inputHeight="h-[1.625rem] px-1"
					options={ field.options || [] }
					value={ Array.isArray( value ) ? value : [] }
					onChange={ ( v ) => write( field, v ) }
					placeholder={ __( 'Choose…', 'storeengine' ) }
				/>
			);
		}

		if ( 'select' === field.type ) {
			return (
				<div
					className="storeengine-adv-quick__chips"
					role="group"
					aria-label={ field.label }
				>
					{ ( field.options || [] ).map( ( o ) => {
						const on = String( value ) === String( o.value );
						return (
							<button
								key={ o.value }
								type="button"
								className={ `storeengine-adv-quick__chip${
									on ? ' is-on' : ''
								}` }
								aria-pressed={ on }
								onClick={ () =>
									write( field, on ? '' : o.value )
								}
							>
								{ o.label }
							</button>
						);
					} ) }
				</div>
			);
		}

		return (
			<input
				type="text"
				className="storeengine-adv-quick__text"
				value={ undefined === value ? '' : value }
				placeholder={ __( 'Value', 'storeengine' ) }
				aria-label={ field.label }
				onChange={ ( e ) => write( field, e.target.value ) }
			/>
		);
	};

	// Two columns. Multiselects always take a full row; an unpaired field
	// stretches over the empty half so no side is left blank.
	const wide = {};
	let column = 0;
	let lastSingle = null;
	quick.forEach( ( field ) => {
		if ( 'multiselect' === field.type ) {
			wide[ field.id ] = true;
			column = 0;
			lastSingle = null;
			return;
		}
		column += 1;
		lastSingle = field.id;
		if ( 2 === column ) {
			column = 0;
			lastSingle = null;
		}
	} );
	if ( lastSingle ) {
		wide[ lastSingle ] = true;
	}

	return (
		<div className="storeengine-adv-quick">
			{ quick.map( ( field ) => (
				<div
					key={ field.id }
					className={ `storeengine-adv-quick__field${
						wide[ field.id ] ? ' is-wide' : ''
					}` }
				>
					<span className="storeengine-adv-quick__label">
						{ field.label }
					</span>
					{ control( field ) }
				</div>
			) ) }
		</div>
	);
};

QuickFields.propTypes = {
	fields: PropTypes.array.isRequired,
	draft: PropTypes.array.isRequired,
	setDraft: PropTypes.func.isRequired,
};

export default QuickFields;
