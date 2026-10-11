import { useEffect, useState } from 'react';

// Inline | Side panel for multi-price products. An editor preference, not
// product data: kept in this browser's localStorage so it carries across
// products; guarded because storage can be unavailable.
const STORAGE_KEY = 'storeengine_pricing_view';
const MODES = [ 'inline', 'panel' ];

const readStored = () => {
	try {
		const stored = window.localStorage.getItem( STORAGE_KEY );
		return MODES.includes( stored ) ? stored : 'inline';
	} catch ( e ) {
		return 'inline';
	}
};

let mode = readStored();
const listeners = new Set();

const setMode = ( next ) => {
	mode = next;
	try {
		window.localStorage.setItem( STORAGE_KEY, next );
	} catch ( e ) {
		// Not persisted; still applies for this page.
	}
	listeners.forEach( ( listener ) => listener() );
};

/**
 * @return {{ mode: 'inline'|'panel', setMode: Function }} Pricing view state.
 */
const usePricingView = () => {
	const [ , setTick ] = useState( 0 );

	useEffect( () => {
		const listener = () => setTick( ( tick ) => tick + 1 );
		listeners.add( listener );
		return () => listeners.delete( listener );
	}, [] );

	return { mode, setMode };
};

export default usePricingView;
