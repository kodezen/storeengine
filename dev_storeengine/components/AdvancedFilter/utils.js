import { __, sprintf } from '@wordpress/i18n';

/**
 * Filter model shared by the AdvancedFilter components.
 *
 * groups   = [ group, … ]            // OR between groups
 * group    = [ condition, … ]        // AND inside a group
 * condition = { field, operator, value }
 *
 * A field config:
 * { id, label, type: 'text'|'number'|'select'|'multiselect'|'date',
 *   operators: [ { value, label, input: 'single'|'range'|'days'|'none' } ],
 *   options?: [ { value, label } ] }
 */

export const OPS = {
	contains: {
		value: 'contains',
		label: __( 'contains', 'storeengine' ),
		input: 'single',
	},
	not_contains: {
		value: 'not_contains',
		label: __( 'doesn’t contain', 'storeengine' ),
		input: 'single',
	},
	equals: {
		value: 'equals',
		label: __( 'is', 'storeengine' ),
		input: 'single',
	},
	starts_with: {
		value: 'starts_with',
		label: __( 'starts with', 'storeengine' ),
		input: 'single',
	},
	empty: {
		value: 'empty',
		label: __( 'is empty', 'storeengine' ),
		input: 'none',
	},
	not_empty: {
		value: 'not_empty',
		label: __( 'is not empty', 'storeengine' ),
		input: 'none',
	},
	in: {
		value: 'in',
		label: __( 'is any of', 'storeengine' ),
		input: 'single',
	},
	not_in: {
		value: 'not_in',
		label: __( 'is none of', 'storeengine' ),
		input: 'single',
	},
	is: { value: 'is', label: __( 'is', 'storeengine' ), input: 'single' },
	is_not: {
		value: 'is_not',
		label: __( 'is not', 'storeengine' ),
		input: 'single',
	},
	gt: {
		value: 'gt',
		label: __( 'greater than', 'storeengine' ),
		input: 'single',
	},
	lt: {
		value: 'lt',
		label: __( 'less than', 'storeengine' ),
		input: 'single',
	},
	eq: { value: 'eq', label: __( 'equals', 'storeengine' ), input: 'single' },
	between: {
		value: 'between',
		label: __( 'between', 'storeengine' ),
		input: 'range',
	},
	after: {
		value: 'after',
		label: __( 'after', 'storeengine' ),
		input: 'single',
	},
	before: {
		value: 'before',
		label: __( 'before', 'storeengine' ),
		input: 'single',
	},
	last_days: {
		value: 'last_days',
		label: __( 'in the last', 'storeengine' ),
		input: 'days',
	},
};

export const fieldById = ( fields, id ) =>
	fields.find( ( f ) => f.id === id ) || fields[ 0 ];

export const opOf = ( field, value ) =>
	field.operators.find( ( o ) => o.value === value ) || field.operators[ 0 ];

export const emptyValue = ( field, op ) => {
	if ( 'range' === op.input ) {
		return [ '', '' ];
	}
	if ( 'multiselect' === field.type ) {
		return [];
	}
	if ( 'select' === field.type && field.options?.length ) {
		return field.options[ 0 ].value;
	}
	return '';
};

export const newCondition = ( fields, fieldId ) => {
	const field = fieldById( fields, fieldId || fields[ 0 ].id );
	const op = field.operators[ 0 ];
	return {
		field: field.id,
		operator: op.value,
		value: emptyValue( field, op ),
	};
};

export const isComplete = ( fields, c ) => {
	const field = fields.find( ( f ) => f.id === c.field );
	if ( ! field ) {
		return false;
	}
	const op = opOf( field, c.operator );
	if ( 'none' === op.input ) {
		return true;
	}
	if ( 'range' === op.input ) {
		return (
			Array.isArray( c.value ) &&
			c.value.some( ( v ) => '' !== v && null !== v )
		);
	}
	if ( Array.isArray( c.value ) ) {
		return c.value.length > 0;
	}
	return '' !== String( c.value ?? '' ).trim();
};

/**
 * Drop incomplete conditions and empty groups.
 *
 * @param {Array} fields Field configs.
 * @param {Array} groups Condition groups.
 * @return {Array} Complete groups only.
 */
export const cleanGroups = ( fields, groups ) =>
	( groups || [] )
		.map( ( g ) => g.filter( ( c ) => isComplete( fields, c ) ) )
		.filter( ( g ) => g.length );

export const countConditions = ( groups ) =>
	( groups || [] ).reduce( ( n, g ) => n + g.length, 0 );

export const encodeGroups = ( groups ) =>
	groups?.length ? JSON.stringify( groups ) : '';

export const decodeGroups = ( raw ) => {
	if ( ! raw ) {
		return [];
	}
	try {
		const parsed = JSON.parse( raw );
		return Array.isArray( parsed ) ? parsed.filter( Array.isArray ) : [];
	} catch {
		return [];
	}
};

export const sameGroups = ( a, b ) => encodeGroups( a ) === encodeGroups( b );

const optionLabel = ( field, v ) =>
	field.options?.find( ( o ) => String( o.value ) === String( v ) )?.label ??
	v;

/**
 * Human text for one condition, e.g. "Price between 10 and 50".
 *
 * @param {Array}  fields Field configs.
 * @param {Object} c      Condition { field, operator, value }.
 * @return {string} Description, or '' for an unknown field.
 */
export const describe = ( fields, c ) => {
	const parts = describeParts( fields, c );
	if ( ! parts ) {
		return '';
	}
	return `${ parts.label } ${ parts.op }${
		parts.value ? ' ' + parts.value : ''
	}`;
};

// Operators that read naturally without a word: "Status: Published".
const QUIET_OPS = [ 'in', 'is', 'equals', 'eq' ];

/**
 * Chip text split for display: { label, text } where text is the operator and
 * value ("greater than 10") or just the value for plain matches.
 *
 * @param {Array}  fields Field configs.
 * @param {Object} c      Condition.
 * @return {Object|null} { label, text }.
 */
export const describeChip = ( fields, c ) => {
	const parts = describeParts( fields, c );
	if ( ! parts ) {
		return null;
	}
	const quiet = QUIET_OPS.includes( parts.opValue ) && parts.value;
	return {
		label: parts.label,
		text: quiet ? parts.value : `${ parts.op }${ parts.value ? ' ' + parts.value : '' }`,
	};
};

const describeParts = ( fields, c ) => {
	const field = fields.find( ( f ) => f.id === c.field );
	if ( ! field ) {
		return null;
	}
	const op = opOf( field, c.operator );
	let value = '';
	if ( 'range' === op.input ) {
		const [ a, b ] = c.value || [];
		value =
			'' === ( b ?? '' )
				? sprintf(
						/* translators: %s: minimum */ __(
							'%s or more',
							'storeengine'
						),
						a
				  )
				: sprintf(
						/* translators: 1: min, 2: max */ __(
							'%1$s and %2$s',
							'storeengine'
						),
						a || 0,
						b
				  );
	} else if ( 'days' === op.input ) {
		value = sprintf(
			/* translators: %s: number of days */ __(
				'%s days',
				'storeengine'
			),
			c.value
		);
	} else if ( 'none' !== op.input ) {
		value = Array.isArray( c.value )
			? c.value.map( ( v ) => optionLabel( field, v ) ).join( ', ' )
			: optionLabel( field, c.value );
	}
	return { label: field.label, op: op.label, opValue: op.value, value };
};
