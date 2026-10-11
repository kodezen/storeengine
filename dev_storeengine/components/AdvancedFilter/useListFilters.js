import React, { useMemo, useState } from 'react';
import {
	AdvancedFilter,
	FilterChips,
	SavedViewsMenu,
	useSavedViews,
} from './index';
import { cleanGroups, decodeGroups, encodeGroups } from './utils';
import { __ } from '@wordpress/i18n';

const ALL_LABELS = {
	orders: __( 'All orders', 'storeengine' ),
	payments: __( 'All payments', 'storeengine' ),
	customers: __( 'All customers', 'storeengine' ),
	products: __( 'All products', 'storeengine' ),
};

/**
 * Everything a list screen needs for advanced filters + saved views.
 *
 * Filters and the active view live in the URL (`filters`, `view`). The screen
 * owns navigation: `navigateWith( extra, { keepPage } )` must push a URL with
 * the screen's own params (status, per page, search…) plus `extra`
 * ({ filters, view }), resetting to page 1 unless keepPage is set. The
 * screen's own navigation should carry `filtersRaw` / `viewId` along.
 *
 * @param {Object}   args
 * @param {string}   args.screen       Screen id (saved views key).
 * @param {Array}    args.fields       Field configs.
 * @param {Object}   args.location     useLocationQuery() result.
 * @param {Function} args.navigateWith See above.
 * @return {Object} { filtersRaw, viewId, groups, toolbar, chips }.
 */
export default function useListFilters( {
	screen,
	fields,
	location,
	navigateWith,
} ) {
	const filtersRaw = location.getValue( 'filters', '' );
	const viewId = location.getValue( 'view', '' );
	// Incomplete conditions (e.g. a hand-edited URL) are dropped, as the server
	// does, so chips and counts match what is applied.
	const groups = useMemo(
		() => cleanGroups( fields, decodeGroups( filtersRaw ) ),
		[ fields, filtersRaw ]
	);
	const [ open, setOpen ] = useState( false );
	const { views, save, remove } = useSavedViews( screen );
	const activeView = views.find( ( v ) => v.id === viewId ) || null;

	const apply = ( next ) =>
		navigateWith( {
			filters: encodeGroups( next ),
			view: next.length ? viewId : '',
		} );

	const selectView = ( view ) =>
		navigateWith(
			view
				? { filters: view.filters, view: view.id }
				: { filters: '', view: '' }
		);

	const saveView = async ( { id, name } ) => {
		const view = await save( { id, name, groups } );
		if ( view ) {
			navigateWith(
				{ filters: view.filters, view: view.id },
				{ keepPage: true }
			);
		}
	};

	const deleteView = async ( id ) => {
		await remove( id );
		if ( id === viewId ) {
			navigateWith(
				{ filters: filtersRaw, view: '' },
				{ keepPage: true }
			);
		}
	};

	const toolbar = (
		<>
			<SavedViewsMenu
				views={ views }
				activeId={ viewId }
				onSelect={ selectView }
				onDelete={ deleteView }
				allLabel={ ALL_LABELS[ screen ] }
				onSave={ saveView }
				canSave={ groups.length > 0 }
			/>
			<AdvancedFilter
				fields={ fields }
				value={ groups }
				onApply={ apply }
				open={ open }
				onOpenChange={ setOpen }
			/>
		</>
	);

	const chips = (
		<FilterChips
			fields={ fields }
			groups={ groups }
			onChange={ apply }
			onEdit={ () => setOpen( true ) }
			activeView={ activeView }
			onSave={ saveView }
		/>
	);

	return { filtersRaw, viewId, groups, toolbar, chips };
}
