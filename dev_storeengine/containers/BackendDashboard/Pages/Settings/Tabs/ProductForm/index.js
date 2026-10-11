import React from 'react';
import { TabContent } from '../../Layouts';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Switch, Input, Textarea, Checkbox } from '@Components/ui';
import './styles.scss';

/**
 * Product form settings tab.
 *
 * Renders entirely from `product_form_schema`, which the server sends with the
 * settings payload (StoreEngine\Utils\ProductFormFields::schema()), so there is
 * no second copy of the field list to drift out of sync. Every control writes
 * into values.product_form.fields[id].{hidden,required,default}; only overrides
 * are stored, and the server re-validates the whole thing on save.
 *
 * The config never applies to full administrators.
 */

const SELECT_CLASS =
	'h-10 px-3 rounded-se border border-solid border-se-border text-sm bg-white outline-none focus:border-se-primary w-full max-w-[260px]';

const useProductForm = () => {
	const { values, setFieldValue } = useFormikContext();
	const schema = values.product_form_schema || { fields: {}, sections: {} };
	const config = values.product_form || { fields: {} };

	const write = ( fields ) => setFieldValue( 'product_form', { fields } );

	return { schema, config, write };
};

const cleanRow = ( row ) => {
	const next = { ...row };
	Object.keys( next ).forEach( ( key ) => {
		if ( false === next[ key ] || null === next[ key ] || undefined === next[ key ] || '' === next[ key ] ) {
			delete next[ key ];
		}
	} );
	return next;
};

const HowItWorks = () => (
	<div className="storeengine-content-section storeengine-pf-intro">
		<h3 className="storeengine-heading">
			{ __( 'How this works', 'storeengine' ) }
		</h3>
		<p className="m-0 mt-2 text-[13px] text-se-subtitle">
			{ __(
				'This never changes what a store administrator sees — administrators always get the full product form. It only applies to everyone else: shop managers, staff and vendors.',
				'storeengine'
			) }
		</p>
		<ul className="storeengine-pf-intro__list">
			<li>
				<strong>{ __( 'Show', 'storeengine' ) }</strong>
				{ __( ' — turn a panel or field off and it disappears from the product editor for everyone this applies to.', 'storeengine' ) }
			</li>
			<li>
				<strong>{ __( 'Required', 'storeengine' ) }</strong>
				{ __( ' — the field must be filled in before a product can be published. Drafts can always be saved incomplete.', 'storeengine' ) }
			</li>
			<li>
				<strong>{ __( 'Default value', 'storeengine' ) }</strong>
				{ __( ' — a hidden field still needs a value, so it quietly gets this one on every new product instead of being left empty.', 'storeengine' ) }
			</li>
		</ul>
		<p className="m-0 mt-3 text-[13px] text-se-subtitle">
			{ __(
				'Start by switching off the panels your team does not need below (Variants, Inventory, Shipping…), then fine-tune individual fields in the tables underneath.',
				'storeengine'
			) }
		</p>
	</div>
);

const Th = ( { children, center } ) => (
	<th className={ `${ center ? 'text-center' : 'text-left' } text-[14px] font-medium leading-5 p-3 capitalize` }>
		{ children }
	</th>
);

const DefaultInput = ( { entry, value, onChange, disabled } ) => {
	switch ( entry.type ) {
		case 'number':
			return (
				<Input
					type="number"
					min="0"
					step="any"
					value={ value ?? '' }
					disabled={ disabled }
					onChange={ ( e ) => onChange( e.target.value ) }
					className="max-w-[160px]"
				/>
			);
		case 'textarea':
			return (
				<Textarea
					rows={ 2 }
					value={ value ?? '' }
					disabled={ disabled }
					onChange={ ( e ) => onChange( e.target.value ) }
				/>
			);
		case 'toggle':
			return (
				<select
					className={ SELECT_CLASS }
					value={ null === value || undefined === value ? '' : String( value ) }
					disabled={ disabled }
					onChange={ ( e ) => onChange( '' === e.target.value ? null : 'true' === e.target.value ) }
				>
					<option value="">{ __( 'No default', 'storeengine' ) }</option>
					<option value="true">{ __( 'On', 'storeengine' ) }</option>
					<option value="false">{ __( 'Off', 'storeengine' ) }</option>
				</select>
			);
		case 'select':
			return (
				<select
					className={ SELECT_CLASS }
					value={ value ?? '' }
					disabled={ disabled }
					onChange={ ( e ) => onChange( e.target.value || null ) }
				>
					<option value="">{ __( 'Store default', 'storeengine' ) }</option>
					{ Object.entries( entry.options || {} ).map( ( [ val, label ] ) => (
						<option key={ val } value={ val }>{ label }</option>
					) ) }
				</select>
			);
		case 'terms': {
			const selected = Array.isArray( value ) ? value : [];
			const options = entry.term_options || [];
			if ( ! options.length ) {
				return <span className="text-[12px] text-se-subtitle">{ __( 'Nothing to pick yet.', 'storeengine' ) }</span>;
			}
			return (
				<div className="storeengine-pf-terms">
					{ options.map( ( term ) => (
						<Checkbox
							key={ term.id }
							checked={ selected.includes( term.id ) }
							disabled={ disabled }
							label={ term.name }
							onChange={ ( checked ) =>
								onChange(
									checked
										? [ ...selected, term.id ]
										: selected.filter( ( id ) => id !== term.id )
								)
							}
						/>
					) ) }
				</div>
			);
		}
		case 'media':
			return <span className="text-[12px] text-se-subtitle">--</span>;
		default:
			return (
				<Input
					type="text"
					value={ value ?? '' }
					disabled={ disabled }
					onChange={ ( e ) => onChange( e.target.value ) }
				/>
			);
	}
};

const FieldRow = ( { id, entry, sectionHidden } ) => {
	const { config, write } = useProductForm();
	const row = config.fields?.[ id ] || {};
	const supports = entry.supports || [];
	const can = ( what ) => supports.includes( what );

	const set = ( patch ) => {
		const fields = { ...( config.fields || {} ) };
		const next = cleanRow( { ...row, ...patch } );
		// Mirror the server rules: hiding a field that has no default can't stay required.
		if ( patch.hidden && next.required && ! can( 'default' ) ) {
			delete next.required;
		}
		if ( Object.keys( next ).length ) {
			fields[ id ] = next;
		} else {
			delete fields[ id ];
		}
		write( fields );
	};

	const hidden = !! row.hidden;
	const required = !! row.required;
	const showControl = can( 'hide' );
	const problem =
		( hidden || sectionHidden ) && required && null == row.default
			? __( 'Required but hidden: set a default value.', 'storeengine' )
			: '';

	return (
		<tr className={ hidden || sectionHidden ? 'storeengine-pf-row--hidden' : '' }>
			<td className="text-left text-[14px] font-medium leading-5 p-3">
				{ entry.label }
				{ entry.system && (
					<span className="storeengine-settings-tag ml-2">{ __( 'Always shown', 'storeengine' ) }</span>
				) }
				{ sectionHidden && (
					<span className="storeengine-settings-tag ml-2">{ __( 'Section hidden', 'storeengine' ) }</span>
				) }
				{ problem && <div className="storeengine-pf-problem">{ problem }</div> }
			</td>
			<td className="text-center p-3">
				{ showControl ? (
					<Switch
						checked={ ! hidden }
						onChange={ ( val ) => set( { hidden: ! val } ) }
						aria-label={ __( 'Show', 'storeengine' ) }
					/>
				) : (
					'--'
				) }
			</td>
			<td className="text-center p-3">
				{ can( 'required' ) ? (
					<Switch
						checked={ required }
						disabled={ hidden && ! can( 'default' ) }
						onChange={ ( val ) => set( { required: !! val } ) }
						aria-label={ __( 'Required', 'storeengine' ) }
					/>
				) : (
					'--'
				) }
			</td>
			<td className="text-left p-3">
				{ can( 'default' ) ? (
					<DefaultInput
						entry={ entry }
						value={ row.default }
						onChange={ ( val ) => set( { default: val } ) }
					/>
				) : (
					'--'
				) }
			</td>
		</tr>
	);
};

const Table = ( { children, head } ) => (
	<div className="mt-6 border border-solid border-[var(--storeengine-border-color)] rounded overflow-x-auto">
		<table className="w-full m-0 bg-white">
			<thead className="bg-[#F7F7F8] text-[var(--storeengine-text-color)] tracking-wide">
				<tr>{ head }</tr>
			</thead>
			<tbody>{ children }</tbody>
		</table>
	</div>
);

const SectionsTable = ( { entries } ) => {
	const { config, write } = useProductForm();

	const toggle = ( id, show ) => {
		const fields = { ...( config.fields || {} ) };
		if ( show ) {
			const row = cleanRow( { ...( fields[ id ] || {} ), hidden: false } );
			Object.keys( row ).length ? ( fields[ id ] = row ) : delete fields[ id ];
		} else {
			fields[ id ] = { ...( fields[ id ] || {} ), hidden: true };
		}
		write( fields );
	};

	return (
		<div className="storeengine-content-section">
			<h3 className="storeengine-heading">{ __( 'Panels', 'storeengine' ) }</h3>
			<p className="m-0 mt-2 text-[13px] text-se-subtitle">
				{ __( 'Switch off the whole panels your team does not need.', 'storeengine' ) }
			</p>
			<Table
				head={
					<>
						<Th>{ __( 'Panel', 'storeengine' ) }</Th>
						<Th center>{ __( 'Show', 'storeengine' ) }</Th>
					</>
				}
			>
				{ entries.map( ( [ id, entry ] ) => (
					<tr key={ id } className={ config.fields?.[ id ]?.hidden ? 'storeengine-pf-row--hidden' : '' }>
						<td className="text-left text-[14px] font-medium leading-5 p-3">{ entry.label }</td>
						<td className="text-center p-3">
							<Switch
								checked={ ! config.fields?.[ id ]?.hidden }
								onChange={ ( val ) => toggle( id, !! val ) }
								aria-label={ __( 'Show', 'storeengine' ) }
							/>
						</td>
					</tr>
				) ) }
			</Table>
		</div>
	);
};

const ProductForm = () => {
	const { schema, config } = useProductForm();
	const all = Object.entries( schema.fields || {} );
	const sections = all.filter( ( [ , e ] ) => 'section' === e.kind );
	const fields = all.filter( ( [ , e ] ) => 'field' === e.kind );

	const groups = {};
	fields.forEach( ( [ id, entry ] ) => {
		( groups[ entry.section ] = groups[ entry.section ] || [] ).push( [ id, entry ] );
	} );

	if ( ! all.length ) {
		return (
			<TabContent>
				<p>{ __( 'Loading…', 'storeengine' ) }</p>
			</TabContent>
		);
	}

	return (
		<TabContent>
			<HowItWorks />
			<SectionsTable entries={ sections } />
			{ Object.entries( schema.sections || {} ).map( ( [ key, label ] ) =>
				groups[ key ] ? (
					<div className="storeengine-content-section" key={ key }>
						<h3 className="storeengine-heading">{ label }</h3>
						<Table
							head={
								<>
									<Th>{ __( 'Field', 'storeengine' ) }</Th>
									<Th center>{ __( 'Show', 'storeengine' ) }</Th>
									<Th center>{ __( 'Required', 'storeengine' ) }</Th>
									<Th>{ __( 'Default value', 'storeengine' ) }</Th>
								</>
							}
						>
							{ groups[ key ].map( ( [ id, entry ] ) => (
								<FieldRow
									key={ id }
									id={ id }
									entry={ entry }
									sectionHidden={ !! config.fields?.[ key ]?.hidden && 'section' === schema.fields[ key ]?.kind }
								/>
							) ) }
						</Table>
					</div>
				) : null
			) }
			<p className="py-3 m-0 text-[12px] text-se-subtitle">
				{ __(
					'Hidden fields are not shown but still receive their default value, so nothing is left empty. Required fields are checked when a product is published; drafts can be saved incomplete.',
					'storeengine'
				) }
			</p>
		</TabContent>
	);
};

export default ProductForm;
