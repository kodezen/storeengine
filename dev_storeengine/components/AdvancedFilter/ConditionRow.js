import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Select } from '@Components/ui';
import { emptyValue, fieldById, opOf } from './utils';

const inputType = ( field ) =>
	[ 'number', 'date' ].includes( field.type ) ? field.type : 'text';

/**
 * The value editor for a condition, shaped by the field type and operator.
 *
 * @param {Object}   props
 * @param {Object}   props.field    Field config.
 * @param {Object}   props.op       Operator config.
 * @param {*}        props.value    Current value.
 * @param {Function} props.onChange Called with the new value.
 */
const ValueInput = ( { field, op, value, onChange } ) => {
	if ( 'none' === op.input ) {
		return null;
	}

	if ( 'days' === op.input ) {
		return (
			<span className="storeengine-adv-filter__value storeengine-adv-filter__value--days">
				<input
					type="number"
					min="1"
					value={ value }
					onChange={ ( e ) => onChange( e.target.value ) }
					aria-label={ __( 'Number of days', 'storeengine' ) }
				/>
				<span>{ __( 'days', 'storeengine' ) }</span>
			</span>
		);
	}

	if ( 'range' === op.input ) {
		const [ a = '', b = '' ] = Array.isArray( value ) ? value : [];
		return (
			<span className="storeengine-adv-filter__value storeengine-adv-filter__value--range">
				<input
					type={ inputType( field ) }
					value={ a }
					placeholder={ __( 'From', 'storeengine' ) }
					onChange={ ( e ) => onChange( [ e.target.value, b ] ) }
					aria-label={ __( 'From', 'storeengine' ) }
				/>
				<span>{ __( 'and', 'storeengine' ) }</span>
				<input
					type={ inputType( field ) }
					value={ b }
					placeholder={ __( 'To', 'storeengine' ) }
					onChange={ ( e ) => onChange( [ a, e.target.value ] ) }
					aria-label={ __( 'To', 'storeengine' ) }
				/>
			</span>
		);
	}

	if ( 'multiselect' === field.type || 'select' === field.type ) {
		const multi = 'multiselect' === field.type;
		return (
			<span className="storeengine-adv-filter__value storeengine-adv-filter__value--select">
				<Select
					isMulti={ multi }
					inputHeight="h-[1.625rem] px-1"
					isSearchable={ multi || ( field.options?.length ?? 0 ) > 8 }
					options={ field.options || [] }
					value={ multi && ! Array.isArray( value ) ? [] : value }
					onChange={ ( v ) => onChange( v ) }
					placeholder={
						multi ? __( 'Choose…', 'storeengine' ) : undefined
					}
				/>
			</span>
		);
	}

	return (
		<span className="storeengine-adv-filter__value">
			<input
				type={ inputType( field ) }
				value={ value }
				onChange={ ( e ) => onChange( e.target.value ) }
				placeholder={
					'number' === field.type ? '0' : __( 'Value', 'storeengine' )
				}
				aria-label={ __( 'Value', 'storeengine' ) }
			/>
		</span>
	);
};

/**
 * One condition: field · operator · value · remove.
 *
 * @param {Object}   props
 * @param {Array}    props.fields    Field configs.
 * @param {Object}   props.condition { field, operator, value }.
 * @param {Function} props.onChange  Called with the updated condition.
 * @param {Function} props.onRemove  Removes the condition.
 */
const ConditionRow = ( { fields, condition, onChange, onRemove } ) => {
	const field = fieldById( fields, condition.field );
	const op = opOf( field, condition.operator );

	const setField = ( id ) => {
		const next = fieldById( fields, id );
		const nextOp = next.operators[ 0 ];
		onChange( {
			field: next.id,
			operator: nextOp.value,
			value: emptyValue( next, nextOp ),
		} );
	};

	const setOp = ( value ) => {
		const nextOp = opOf( field, value );
		// Keep the value when the input shape stays the same (e.g. gt → lt).
		const keep = nextOp.input === op.input;
		onChange( {
			...condition,
			operator: nextOp.value,
			value: keep ? condition.value : emptyValue( field, nextOp ),
		} );
	};

	return (
		<div className="storeengine-adv-filter__row">
			<span className="storeengine-adv-filter__field">
				<Select
					inputHeight="h-[1.625rem] px-1"
					isSearchable={ fields.length > 8 }
					options={ fields.map( ( f ) => ( {
						value: f.id,
						label: f.label,
					} ) ) }
					value={ field.id }
					onChange={ setField }
				/>
			</span>
			<span className="storeengine-adv-filter__op">
				<Select
					inputHeight="h-[1.625rem] px-1"
					isSearchable={ false }
					options={ field.operators.map( ( o ) => ( {
						value: o.value,
						label: o.label,
					} ) ) }
					value={ op.value }
					onChange={ setOp }
				/>
			</span>
			<ValueInput
				field={ field }
				op={ op }
				value={ condition.value }
				onChange={ ( value ) => onChange( { ...condition, value } ) }
			/>
			<button
				type="button"
				className="storeengine-adv-filter__remove"
				onClick={ onRemove }
				aria-label={ __( 'Remove condition', 'storeengine' ) }
				title={ __( 'Remove', 'storeengine' ) }
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.2"
					strokeLinecap="round"
					aria-hidden="true"
				>
					<path d="M6 6l12 12M18 6 6 18" />
				</svg>
			</button>
		</div>
	);
};

ConditionRow.propTypes = {
	fields: PropTypes.array.isRequired,
	condition: PropTypes.object.isRequired,
	onChange: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired,
};

export default ConditionRow;
