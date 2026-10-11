/**
 * Grouped, searchable shortcode picker (react-select).
 *
 * Used in the sidebar (InspectorControls), which renders in the MAIN document —
 * not the block-canvas iframe — so react-select's styles apply and we get proper
 * option groups (by category) with search. (The in-canvas empty-state uses WP's
 * ComboboxControl instead, since react-select can't style itself inside the
 * editor iframe.)
 */
import Select from 'react-select';
import { __ } from '@wordpress/i18n';
import { getGroupedOptions } from './registry';

// Deliberately still react-select, not the Tailwind `ui/Select`: this renders in
// the block editor sidebar, whose CSS bundle (blocks.css / editor.scss) doesn't
// pull in the `.se-admin-tw`-scoped Tailwind output that `ui/Select` depends on
// (only the admin SPA's bundle does) — the Tailwind version would render fully
// unstyled here. editor.scss carries hand-written styles for react-select's
// `.storeengine-sc-select__*` BEM classes instead.
export default function ShortcodePicker( { value, onChange } ) {
	const groups = getGroupedOptions();
	const selected =
		groups.flatMap( ( g ) => g.options ).find( ( o ) => o.value === value ) || null;

	return (
		<Select
			className="storeengine-sc-select"
			classNamePrefix="storeengine-sc-select"
			options={ groups }
			value={ selected }
			onChange={ ( opt ) => onChange( opt ? opt.value : '' ) }
			placeholder={ __( 'Search shortcodes…', 'storeengine' ) }
			isSearchable
			menuPortalTarget={ typeof document !== 'undefined' ? document.body : null }
			menuPlacement="auto"
			maxMenuHeight={ 320 }
			styles={ { menuPortal: ( base ) => ( { ...base, zIndex: 999999 } ) } }
		/>
	);
}
