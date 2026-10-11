/**
 * Reads the shortcode-block registry StoreEngine prints to the editor.
 * Single source of truth — the block never hard-codes any shortcode.
 */

export function getData() {
	const data = window.StoreEngineShortcodeBlock;
	return data && Array.isArray( data.shortcodes )
		? data
		: { shortcodes: [], types: [], schema_version: 1, ablocks: { active: false, install_url: '' } };
}

export function getShortcodes() {
	return getData().shortcodes;
}

export function getDescriptor( id ) {
	return getShortcodes().find( ( s ) => s.id === id ) || null;
}

export function aBlocksState() {
	return getData().ablocks || { active: false, install_url: '' };
}

/**
 * Flat options for ComboboxControl (canvas / iframe), category prefixed so the
 * grouping stays visible in the filterable list.
 */
export function getFlatOptions() {
	return getShortcodes()
		.slice()
		.sort( ( a, b ) => ( a.category + a.title ).localeCompare( b.category + b.title ) )
		.map( ( s ) => ( { label: `${ s.category } · ${ s.title }`, value: s.id } ) );
}

export function getGroupedOptions() {
	const groups = {};
	getShortcodes().forEach( ( s ) => {
		const cat = s.category || s.owner;
		( groups[ cat ] = groups[ cat ] || [] ).push( { label: s.title, value: s.id } );
	} );
	return Object.keys( groups )
		.sort()
		.map( ( cat ) => ( { label: cat, options: groups[ cat ] } ) );
}

export function attValue( attr, atts ) {
	return atts && Object.prototype.hasOwnProperty.call( atts, attr.name )
		? atts[ attr.name ]
		: attr.default;
}

export function isVisible( attr, descriptor, atts ) {
	if ( ! attr.depends_on || ! attr.depends_on.name ) {
		return true;
	}
	const dep = descriptor.attributes.find( ( a ) => a.name === attr.depends_on.name );
	if ( ! dep ) {
		return true;
	}
	return String( attValue( dep, atts ) ) === String( attr.depends_on.value );
}
