import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	registerScreen,
	setScreenPerPage,
	setScreenColumns,
	persistScreen,
	resetScreenOptions,
	setActiveScreen,
	clearActiveScreen,
} from '@Redux/Slices/screenOptionsSlice/screenOptionsSlice';

/**
 * A list screen announces itself to the single global ScreenMeta (Screen
 * Options + Help). Called from ListTable whenever a `screenId` is set, and
 * cleared on unmount. A no-op when screenId is empty.
 *
 * @param {string} screenId
 */
export function useRegisterScreenMeta( screenId ) {
	const dispatch = useDispatch();
	useEffect( () => {
		if ( ! screenId ) {
			return undefined;
		}
		dispatch( setActiveScreen( { screenId } ) );
		return () => dispatch( clearActiveScreen( screenId ) );
	}, [ dispatch, screenId ] );
}

/**
 * Merge a table's saved column prefs (visibility + order) onto its CURRENT code
 * columns. Code columns are the source of truth (cell renderers, curation
 * flags); from saved prefs we only take `visible` + display order. Columns added
 * after the user saved are appended (honoring `defaultHidden`); locked columns
 * are always visible.
 *
 * @param {Array} codeColumns  [{ id, name?, locked?, defaultHidden?, ... }]
 * @param {Array|null} saved   [{ id, visible, order }]
 * @return {Array} merged columns with resolved `visible`, in saved order.
 */
export const mergeColumns = ( codeColumns = [], saved = null ) => {
	if ( ! Array.isArray( saved ) || ! saved.length ) {
		return codeColumns.map( ( c ) => ( {
			...c,
			visible: c.locked ? true : ! c.defaultHidden,
		} ) );
	}

	const byId = {};
	saved.forEach( ( item, index ) => {
		byId[ item.id ] = {
			visible: !! item.visible,
			order: Number.isFinite( item.order ) ? item.order : index,
		};
	} );

	return codeColumns
		.map( ( c ) => {
			const s = byId[ c.id ];
			return {
				...c,
				visible: c.locked ? true : s ? s.visible : ! c.defaultHidden,
				__order: s ? s.order : Number.MAX_SAFE_INTEGER,
			};
		} )
		.sort( ( a, b ) => a.__order - b.__order )
		.map( ( { __order, ...rest } ) => rest );
};

/** Shrink a full column list down to the persisted `{ id, visible, order }` shape. */
export const toSavedColumns = ( columns = [] ) =>
	columns.map( ( c, index ) => ( {
		id: c.id,
		visible: !! c.visible,
		order: index,
	} ) );

/**
 * Per-screen access to the user's Screen Options (server-backed, single meta).
 */
export default function useScreenOptions( screenId ) {
	const dispatch = useDispatch();
	const screen = useSelector( ( s ) =>
		screenId ? s.screenOptions.screens[ screenId ] : undefined
	);
	const registry = useSelector( ( s ) =>
		screenId ? s.screenOptions.registry[ screenId ] : undefined
	);

	const register = useCallback(
		( columns, perPageEnabled = true ) =>
			screenId &&
			dispatch(
				registerScreen( { screenId, columns, perPageEnabled } )
			),
		[ dispatch, screenId ]
	);

	const setPerPage = useCallback(
		( perPage ) => {
			dispatch( setScreenPerPage( { screenId, perPage } ) );
			dispatch( persistScreen( screenId ) );
		},
		[ dispatch, screenId ]
	);

	const setColumns = useCallback(
		( columns ) => {
			dispatch( setScreenColumns( { screenId, columns } ) );
			dispatch( persistScreen( screenId ) );
		},
		[ dispatch, screenId ]
	);

	const reset = useCallback(
		() => dispatch( resetScreenOptions( screenId ) ),
		[ dispatch, screenId ]
	);

	return {
		perPage: screen?.per_page,
		savedColumns: screen?.columns || null,
		columnDefs: registry?.columns || [],
		perPageEnabled: registry ? registry.perPageEnabled !== false : true,
		register,
		setPerPage,
		setColumns,
		reset,
	};
}
