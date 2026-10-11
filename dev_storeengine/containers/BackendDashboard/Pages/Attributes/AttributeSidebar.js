import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import {
	SortableContainer,
	SortableElement,
	SortableHandle,
} from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import { Button } from '@Components/ui';
import { makeRequest2 } from '@Utils/helper';
import { TypeGlyph } from './AttributeFormModal';

const PER_PAGE = 30;
const SEARCH_DELAY = 300;

const termCount = ( row, terms ) => {
	const loaded = terms?.[ row.attribute_id ];
	if ( Array.isArray( loaded ) ) {
		return loaded.length;
	}
	if ( undefined !== row?.attribute_term_count ) {
		return Number( row.attribute_term_count ) || 0;
	}
	return row?.attribute_terms ? row.attribute_terms.split( ', ' ).length : 0;
};

const DragHandle = SortableHandle( () => (
	<span
		className="storeengine-attr-manager__handle"
		title={ __( 'Drag to reorder', 'storeengine' ) }
		aria-hidden="true"
	>
		<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
			<circle cx="9" cy="6" r="1.7" />
			<circle cx="15" cy="6" r="1.7" />
			<circle cx="9" cy="12" r="1.7" />
			<circle cx="15" cy="12" r="1.7" />
			<circle cx="9" cy="18" r="1.7" />
			<circle cx="15" cy="18" r="1.7" />
		</svg>
	</span>
) );

const Row = ( { row, active, count, sortable, onSelect } ) => (
	<li className="storeengine-attr-manager__row">
		{ sortable && <DragHandle /> }
		<button
			type="button"
			role="option"
			aria-selected={ active }
			className={ classNames( 'storeengine-attr-manager__item', {
				'is-active': active,
			} ) }
			onClick={ () => onSelect( row ) }
		>
			<span
				className={ `storeengine-attr-manager__glyph is-${
					row.attribute_type || 'select'
				}` }
			>
				<TypeGlyph type={ row.attribute_type } />
			</span>
			<span className="storeengine-attr-manager__item-text">
				<span className="storeengine-attr-manager__item-label">
					{ row.attribute_label }
				</span>
				<span className="storeengine-attr-manager__item-slug">
					{ row.attribute_name }
				</span>
			</span>
			<span
				className={ classNames( 'storeengine-attr-manager__count', {
					'is-empty': ! count,
				} ) }
				title={ sprintf(
					/* translators: %d: number of terms */
					_n( '%d term', '%d terms', count, 'storeengine' ),
					count
				) }
			>
				{ count }
			</span>
		</button>
	</li>
);

const SortableRow = SortableElement( Row );

const SortableList = SortableContainer( ( { listRef, loading, children } ) => (
	<ul
		ref={ listRef }
		className="storeengine-attr-manager__list"
		role="listbox"
		aria-label={ __( 'Attributes', 'storeengine' ) }
		aria-busy={ loading }
	>
		{ children }
	</ul>
) );

/**
 * Left pane: searchable, paginated attribute list. Fetches its own pages
 * (server-side search, infinite scroll) so stores with many attributes
 * never load them all at once. Rows can be dragged to set the order the
 * attributes appear in everywhere (editor, storefront).
 *
 * @param {Object}   props
 * @param {number}   props.selectedId Selected attribute id.
 * @param {Function} props.onSelect   Called with an attribute row.
 * @param {Function} props.onLoaded   Called with the first page (auto-select).
 * @param {Function} props.onCreate   Opens the create modal.
 * @param {number}   props.reloadKey  Bump to reload from page 1.
 */
const AttributeSidebar = ( {
	selectedId,
	onSelect,
	onLoaded,
	onCreate,
	reloadKey,
} ) => {
	const terms = useSelector( ( state ) => state.attributes.terms );
	const [ items, setItems ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ page, setPage ] = useState( 1 );
	const [ query, setQuery ] = useState( '' );
	const [ search, setSearch ] = useState( '' );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( '' );
	const requestRef = useRef( 0 );
	const listRef = useRef( null );
	const sentinelRef = useRef( null );
	const onLoadedRef = useRef( onLoaded );
	onLoadedRef.current = onLoaded;

	const hasMore = items.length < total;
	const [ savingOrder, setSavingOrder ] = useState( false );

	// Drop: reorder locally, then save. The server places the loaded rows back
	// into the slots they hold in the full list, so a partly loaded or
	// filtered list can be sorted without disturbing the rest.
	const onSortEnd = async ( { oldIndex, newIndex } ) => {
		if ( oldIndex === newIndex ) {
			return;
		}
		const before = items;
		const next = arrayMoveImmutable( items, oldIndex, newIndex );
		setItems( next );
		setSavingOrder( true );
		setError( '' );
		try {
			await makeRequest2( 'reorder_product_attributes', {
				attribute_ids: next.map( ( r ) => r.attribute_id ).join( ',' ),
			} );
		} catch ( e ) {
			setItems( before );
			setError(
				e?.message || __( 'Could not save the order.', 'storeengine' )
			);
		} finally {
			setSavingOrder( false );
		}
	};

	const load = useCallback( async ( nextPage, term ) => {
		const id = ++requestRef.current;
		setLoading( true );
		setError( '' );
		try {
			const res = await makeRequest2( 'get_product_attributes', {
				page: nextPage,
				per_page: PER_PAGE,
				...( term ? { search: term } : {} ),
			} );
			// A newer search/reload started meanwhile: drop this response.
			if ( id !== requestRef.current ) {
				return;
			}
			const rows = ( res?.attributes || [] ).filter(
				( a ) => a?.attribute_id
			);
			setItems( ( prev ) =>
				1 === nextPage ? rows : [ ...prev, ...rows ]
			);
			setTotal( parseInt( res?.totalItems, 10 ) || 0 );
			setPage( nextPage );
			if ( 1 === nextPage && ! term ) {
				onLoadedRef.current?.( rows );
			}
		} catch ( e ) {
			if ( id === requestRef.current ) {
				setError(
					e?.message ||
						__( 'Could not load attributes.', 'storeengine' )
				);
			}
		} finally {
			if ( id === requestRef.current ) {
				setLoading( false );
			}
		}
	}, [] );

	// Debounce typing into a server search.
	useEffect( () => {
		const t = setTimeout( () => setSearch( query.trim() ), SEARCH_DELAY );
		return () => clearTimeout( t );
	}, [ query ] );

	useEffect( () => {
		listRef.current?.scrollTo?.( 0, 0 );
		load( 1, search );
	}, [ search, reloadKey, load ] );

	// Infinite scroll: fetch the next page when the sentinel scrolls into view.
	useEffect( () => {
		const node = sentinelRef.current;
		if (
			! node ||
			! hasMore ||
			loading ||
			'undefined' === typeof IntersectionObserver
		) {
			return;
		}
		const observer = new window.IntersectionObserver(
			( [ entry ] ) => entry.isIntersecting && load( page + 1, search ),
			{ root: listRef.current, rootMargin: '120px' }
		);
		observer.observe( node );
		return () => observer.disconnect();
	}, [ hasMore, loading, page, search, load ] );

	const firstLoad = loading && ! items.length;

	return (
		<aside className="storeengine-attr-manager__sidebar">
			<div className="storeengine-attr-manager__sidebar-head">
				<div>
					<h2 className="storeengine-attr-manager__title">
						{ __( 'Attributes', 'storeengine' ) }
					</h2>
					<span className="storeengine-attr-manager__subtitle">
						{ firstLoad && __( 'Loading…', 'storeengine' ) }
						{ ! firstLoad &&
							search &&
							sprintf(
								/* translators: %d: number of matching attributes */
								_n(
									'%d match',
									'%d matches',
									total,
									'storeengine'
								),
								total
							) }
						{ ! firstLoad &&
							! search &&
							sprintf(
								/* translators: %d: number of attributes */
								_n(
									'%d attribute',
									'%d attributes',
									total,
									'storeengine'
								),
								total
							) }
					</span>
				</div>
				<Button
					preset="primary"
					size="sm"
					className="h-8 w-8 !p-0"
					aria-label={ __( 'New attribute', 'storeengine' ) }
					title={ __( 'New attribute', 'storeengine' ) }
					onClick={ onCreate }
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<path d="M12 5v14M5 12h14" />
					</svg>
				</Button>
			</div>

			<div className="storeengine-attr-manager__search">
				<span
					className="storeengine-attr-manager__search-icon"
					aria-hidden="true"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
					>
						<circle cx="11" cy="11" r="7" />
						<path d="m20 20-3.5-3.5" />
					</svg>
				</span>
				<input
					type="search"
					value={ query }
					onChange={ ( e ) => setQuery( e.target.value ) }
					onKeyDown={ ( e ) => 'Escape' === e.key && setQuery( '' ) }
					placeholder={ __( 'Search attributes…', 'storeengine' ) }
					aria-label={ __( 'Search attributes', 'storeengine' ) }
				/>
				{ loading && items.length > 0 && (
					<span
						className="storeengine-attr-manager__search-spinner"
						aria-hidden="true"
					/>
				) }
			</div>

			<SortableList
				listRef={ listRef }
				loading={ loading }
				onSortEnd={ onSortEnd }
				useDragHandle
				lockAxis="y"
				lockToContainerEdges
				helperClass="storeengine-attr-manager__row--dragging"
				helperContainer={ () => listRef.current }
			>
				{ firstLoad &&
					[ 0, 1, 2, 3 ].map( ( i ) => (
						<li
							key={ i }
							className="storeengine-attr-manager__skeleton"
							aria-hidden="true"
						/>
					) ) }

				{ items.map( ( row, index ) => {
					const id = Number( row.attribute_id );
					return (
						<SortableRow
							key={ id }
							index={ index }
							disabled={ items.length < 2 || savingOrder }
							row={ row }
							active={ id === selectedId }
							count={ termCount( row, terms ) }
							sortable={ items.length > 1 }
							onSelect={ onSelect }
						/>
					);
				} ) }

				{ hasMore && (
					<li
						ref={ sentinelRef }
						className="storeengine-attr-manager__more"
					>
						<button
							type="button"
							disabled={ loading }
							onClick={ () => load( page + 1, search ) }
						>
							{ loading
								? __( 'Loading…', 'storeengine' )
								: __( 'Load more', 'storeengine' ) }
						</button>
					</li>
				) }

				{ ! loading && ! error && ! items.length && (
					<li className="storeengine-attr-manager__sidebar-empty">
						{ search ? (
							<>
								<p>{ __( 'No matches', 'storeengine' ) }</p>
								<span>
									{ sprintf(
										/* translators: %s: search text */
										__(
											'Nothing found for “%s”.',
											'storeengine'
										),
										search
									) }
								</span>
							</>
						) : (
							<>
								<p>
									{ __(
										'No attributes yet.',
										'storeengine'
									) }
								</p>
								<span>
									{ __(
										'Create Size, Color or Material to start building product variants.',
										'storeengine'
									) }
								</span>
							</>
						) }
					</li>
				) }

				{ error && (
					<li className="storeengine-attr-manager__sidebar-empty is-error">
						<p>{ error }</p>
						<button
							type="button"
							onClick={ () => load( 1, search ) }
						>
							{ __( 'Try again', 'storeengine' ) }
						</button>
					</li>
				) }
			</SortableList>
		</aside>
	);
};

AttributeSidebar.propTypes = {
	selectedId: PropTypes.number,
	onSelect: PropTypes.func.isRequired,
	onLoaded: PropTypes.func,
	onCreate: PropTypes.func.isRequired,
	reloadKey: PropTypes.number,
};

export default AttributeSidebar;
