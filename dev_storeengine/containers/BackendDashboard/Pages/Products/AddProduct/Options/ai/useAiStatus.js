import { useEffect, useState } from 'react';
import { API, namespace } from '@Utils/helper';

/**
 * Shared AI availability status for the product editor.
 *
 * Many inline "Generate" buttons live on one product screen; this memoizes a
 * single `/ai/status` request at module scope so they don't each hit the REST
 * API. Returns the status object (or a safe unavailable default until loaded).
 */
let statusPromise = null;

const fetchStatus = () => {
	if ( ! statusPromise ) {
		statusPromise = API.get( `${ namespace }ai/status` )
			.then( ( { data } ) => data )
			.catch( () => ( { available: false, supported: false } ) );
	}
	return statusPromise;
};

const useAiStatus = () => {
	const [ status, setStatus ] = useState( null );

	useEffect( () => {
		let active = true;
		fetchStatus().then( ( data ) => {
			if ( active ) {
				setStatus( data );
			}
		} );
		return () => {
			active = false;
		};
	}, [] );

	return status || { available: false, supported: false };
};

export default useAiStatus;
