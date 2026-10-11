/**
 * React Hooks.
 */
import { useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { copyToClipboard } from '@Utils/helper';
import StoreEngineURLSearchParams from '@Utils/StoreEngineURLSearchParams';

/**
 * Location Search Params hook.
 * @return {StoreEngineURLSearchParams}
 */
export function useLocationQuery() {
	const { search } = useLocation();

	return useMemo(
		() => new StoreEngineURLSearchParams( search ),
		[ search ]
	);
}

export const useClipboard = ( timeout = 1500 ) => {
	const [ isCopied, setIsCopied ] = useState( false );

	const copy = useCallback(
		async ( text ) => {
			const copied = await copyToClipboard( text );
			setIsCopied( copied );
			if ( copied ) {
				setTimeout( () => setIsCopied( false ), timeout );
			}

			return copied;
		},
		[ timeout ]
	);

	return { copy, isCopied };
};

// End of file index.js
