import React, { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import { __, sprintf } from '@wordpress/i18n';
import { getSeGlobal } from '@Utils/helper';

/**
 * Product form control (Settings → Product form).
 *
 * The server sends `StoreEngineGlobal.product_form` only to users the config
 * applies to (never full admins) and only when it is configured, so for
 * everyone else this whole module is inert: every helper returns "no config"
 * and the gates render their children untouched.
 *
 *   { sections: ['variants', …], fields: { id: { path, type, label, hidden, required, default } } }
 */

const readConfig = () => getSeGlobal( 'product_form', null ) || null;

export const getProductFormConfig = readConfig;

export const isSectionHidden = ( id ) => {
	const config = readConfig();
	return !! config && ( config.sections || [] ).includes( id );
};

export const getProductFormField = ( id ) => {
	const config = readConfig();
	return config?.fields?.[ id ] || null;
};

/**
 * Whether a value counts as empty for its field type (mirrors the PHP side).
 *
 * @param {*}      value Field value.
 * @param {string} type  Field type (text, textarea, number, toggle, select, terms, media).
 * @return {boolean} True when empty.
 */
export const isEmptyValue = ( value, type ) => {
	switch ( type ) {
		case 'terms':
			return ! Array.isArray( value ) || value.filter( Boolean ).length === 0;
		case 'media':
			return ! value || ( Array.isArray( value ) && value.filter( Boolean ).length === 0 );
		case 'number':
			return value === null || value === undefined || value === '' || Number.isNaN( Number( value ) );
		case 'toggle':
			return value === null || value === undefined;
		default:
			return value === null || value === undefined || String( value ).trim() === '';
	}
};

/**
 * Pre-fill the configured defaults on a NEW product's initial values. Saved
 * products are never passed through here, so a default can't overwrite data.
 *
 * @param {Object} values Initial form values.
 * @return {Object} Values with defaults applied (a copy).
 */
export const applyProductFormDefaults = ( values ) => {
	const config = readConfig();
	if ( ! config?.fields ) {
		return values;
	}

	const next = cloneDeep( values );
	Object.values( config.fields ).forEach( ( field ) => {
		if ( field.default !== null && field.default !== undefined ) {
			set( next, field.path, field.default );
		}
	} );

	return next;
};

/**
 * Required fields (that are visible) which are still empty.
 *
 * Drafts stay lenient: required rules apply once the product leaves draft, the
 * same rule the server enforces. Fields saved by a separate request are still
 * checked here because the editor holds their values.
 *
 * @param {Object} values Form values.
 * @return {Object} Map of field path => error message (empty when all is well).
 */
export const getRequiredErrors = ( values ) => {
	const config = readConfig();
	const status = values?.status ?? 'draft';
	if ( ! config?.fields || [ 'draft', 'auto-draft', 'trash' ].includes( status ) ) {
		return {};
	}

	const errors = {};
	Object.values( config.fields ).forEach( ( field ) => {
		// A hidden field with a default is filled for the user; a hidden one
		// without a default can't be filled in, so the settings never allow it.
		if ( ! field.required || field.hidden ) {
			return;
		}
		if ( isEmptyValue( get( values, field.path ), field.type ) ) {
			errors[ field.path ] = sprintf(
				/* translators: %s: field label */
				__( '%s is required.', 'storeengine' ),
				field.label
			);
		}
	} );

	return errors;
};

/**
 * "The user tried to publish and something required was missing" flag.
 *
 * Kept outside Formik on purpose: Formik's own errors are wiped by any
 * validation run (blur, change, submit), so inline errors would flicker away.
 * With this flag the tags stay until the field is actually filled in, because
 * FieldGate recomputes "is it still empty?" from the live form values.
 */
let attempted = false;
const listeners = new Set();

export const setRequiredAttempted = ( next ) => {
	if ( attempted === next ) {
		return;
	}
	attempted = next;
	listeners.forEach( ( fn ) => fn( next ) );
};

const useRequiredAttempted = () => {
	const [ value, setValue ] = useState( attempted );
	useEffect( () => {
		listeners.add( setValue );
		setValue( attempted );
		return () => listeners.delete( setValue );
	}, [] );
	return value;
};

/**
 * Hides a whole section the admin switched off.
 *
 * @param {Object}   props
 * @param {string}   props.id       Section id from the product form schema.
 * @param {Node}     props.children Section content.
 */
export const SectionGate = ( { id, children } ) =>
	isSectionHidden( id ) ? null : <>{ children }</>;

/**
 * Wraps one field: renders nothing when hidden; when required, adds a small
 * "Required" tag and shows the field's inline error. Untouched (no wrapper, no
 * extra DOM) for any field the admin didn't configure.
 *
 * @param {Object} props
 * @param {string} props.id       Field id from the product form schema.
 * @param {Node}   props.children The field.
 */
export const FieldGate = ( { id, children } ) => {
	const { values } = useFormikContext();
	const showErrors = useRequiredAttempted();
	const field = getProductFormField( id );

	if ( ! field ) {
		return <>{ children }</>;
	}
	if ( field.hidden ) {
		return null;
	}
	if ( ! field.required ) {
		return <>{ children }</>;
	}

	const error =
		showErrors && isEmptyValue( get( values, field.path ), field.type )
			? sprintf(
					/* translators: %s: field label */
					__( '%s is required.', 'storeengine' ),
					field.label
			  )
			: '';

	return (
		<div
			className={ `storeengine-pf-field storeengine-pf-field--required${
				error ? ' has-error' : ''
			}` }
			data-pf-field={ id }
		>
			<span className="storeengine-pf-field__badge">
				{ __( 'Required', 'storeengine' ) }
			</span>
			{ children }
			{ error && typeof error === 'string' && (
				<p className="storeengine-pf-field__error" role="alert">
					{ error }
				</p>
			) }
		</div>
	);
};
