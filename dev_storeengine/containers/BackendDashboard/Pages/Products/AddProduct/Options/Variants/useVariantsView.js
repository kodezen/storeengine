import { useEffect, useState } from 'react';

// WordPress admin's own "small screen" breakpoint.
const NARROW_QUERY = '(max-width: 782px)';

// The view is an editor preference, not product data: it is kept in this
// browser's localStorage so the choice carries over to every product, and is
// never saved to the server. Storage can be unavailable (private mode, blocked
// site data), so every access is guarded and falls back to the default.
const STORAGE_KEY = 'storeengine_variants_view';
const VIEW_MODES = [ 'inline', 'panel' ];

const readStoredMode = () => {
	try {
		const stored = window.localStorage.getItem( STORAGE_KEY );
		return VIEW_MODES.includes( stored ) ? stored : null;
	} catch ( e ) {
		return null;
	}
};

let chosenMode = readStoredMode();
const listeners = new Set();

export const setVariantsView = ( mode ) => {
	chosenMode = mode;
	try {
		window.localStorage.setItem( STORAGE_KEY, mode );
	} catch ( e ) {
		// Not persisted; still applies for this page.
	}
	listeners.forEach( ( listener ) => listener() );
};

const matchesNarrow = () =>
	typeof window !== 'undefined' &&
	typeof window.matchMedia === 'function' &&
	window.matchMedia( NARROW_QUERY ).matches;

/**
 * How the Variants list is shown: 'inline' (the table) or 'panel' (a compact
 * list that edits one variant in a right side panel).
 *
 * Until the user picks one, narrow screens get the panel and wide screens the
 * table.
 *
 * @return {{ mode: 'inline'|'panel', setMode: Function }} View state.
 */
const useVariantsView = () => {
	const [ , setTick ] = useState( 0 );
	const [ isNarrow, setIsNarrow ] = useState( matchesNarrow );

	useEffect( () => {
		const listener = () => setTick( ( tick ) => tick + 1 );
		listeners.add( listener );
		return () => listeners.delete( listener );
	}, [] );

	useEffect( () => {
		if (
			typeof window === 'undefined' ||
			typeof window.matchMedia !== 'function'
		) {
			return undefined;
		}
		const query = window.matchMedia( NARROW_QUERY );
		const onChange = ( event ) => setIsNarrow( event.matches );
		setIsNarrow( query.matches );
		query.addEventListener( 'change', onChange );
		return () => query.removeEventListener( 'change', onChange );
	}, [] );

	const mode = chosenMode || ( isNarrow ? 'panel' : 'inline' );

	return { mode, setMode: setVariantsView };
};

export default useVariantsView;

// Whether the attribute editor (attribute rows + "Add Attribute") is expanded.
// Same page-scoped store as the view mode, so the gear in the section heading
// and the Variants body stay in sync without prop drilling.
let attributesEditorOpen = false;
const editorListeners = new Set();

export const setAttributesEditorOpen = ( open ) => {
	attributesEditorOpen = !! open;
	editorListeners.forEach( ( listener ) => listener() );
};

/**
 * @return {{ open: boolean, setOpen: Function }} Attribute editor state.
 */
export const useAttributesEditor = () => {
	const [ , setTick ] = useState( 0 );

	useEffect( () => {
		const listener = () => setTick( ( tick ) => tick + 1 );
		editorListeners.add( listener );
		return () => editorListeners.delete( listener );
	}, [] );

	return { open: attributesEditorOpen, setOpen: setAttributesEditorOpen };
};
