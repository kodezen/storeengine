import React, { useEffect, useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import {
	sortableContainer,
	sortableElement,
	sortableHandle,
} from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import { Checkbox } from '@Components/ui';

// Only the grip starts a drag. Otherwise react-sortable-hoc swallows the mouse
// press on the label text and the checkbox never toggles.
// The icon font has `pointer-events: none`, so the grip must be a real element
// that receives the press (react-sortable-hoc looks for the handle by hit target).
const DragHandle = sortableHandle( () => (
	<span className="kzui-table__drag-handle" aria-hidden="true">
		<span className="storeengine-icon storeengine-icon--drag" />
	</span>
) );

const SortableColumnItem = sortableElement(
	( { copyColumn, itemIndex, checkedChange } ) => {
		return (
			<li
				className="kzui-table__filter-checked-item"
				key={ `column-${ itemIndex }` }
			>
				<DragHandle />
				<Checkbox
					className="kzui-table-filter-item-left"
					checked={ copyColumn.visible }
					disabled={ copyColumn.locked }
					title={
						copyColumn.locked
							? __( 'Always shown', 'storeengine' )
							: undefined
					}
					onChange={ ( visible ) =>
						checkedChange( { id: copyColumn.id, visible } )
					}
					label={
						<span className="kzui-table-filter-item-title">
							{ copyColumn.name }
						</span>
					}
				/>
				{ copyColumn.locked && (
					<span className="kzui-table-filter-item-note">
						{ __( 'Always on', 'storeengine' ) }
					</span>
				) }
			</li>
		);
	}
);

const SortableColumnItemContainer = sortableContainer( ( props ) => {
	return <ul className="kzui-table__filter-items">{ props.children }</ul>;
} );

const SortableColumns = ( {
	setTempCopyColumns,
	tempCopyColumns,
	showColumnFilter,
	checkedChange,
	setCopyColumns,
	copyColumns,
	suffix,
	persistColumns,
} ) => {
	const [ open, setOpen ] = useState( false );
	const wrapRef = useRef( null );
	const menuRef = useRef( null );
	const saveTimer = useRef( null );
	const pending = useRef( null );

	// Persist where the screen keeps its prefs: server-backed Screen Options when
	// available, else the legacy per-browser localStorage.
	const persist = ( cols ) => {
		if ( persistColumns ) {
			persistColumns( cols );
		} else {
			localStorage.setItem( suffix, JSON.stringify( cols ) );
		}
	};

	// Changes show in the table at once. Saving is debounced so a burst of
	// toggles or a drag is one request, and flushed if the menu unmounts first.
	const commit = ( next ) => {
		setTempCopyColumns( next );
		setCopyColumns( next );
		pending.current = next;
		clearTimeout( saveTimer.current );
		saveTimer.current = setTimeout( () => {
			persist( pending.current );
			pending.current = null;
		}, 500 );
	};

	useEffect(
		() => () => {
			clearTimeout( saveTimer.current );
			if ( pending.current ) {
				persist( pending.current );
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const close = () => setOpen( false );

	// Click outside / Escape closes the dropdown.
	useEffect( () => {
		if ( ! open ) {
			return undefined;
		}
		const onDown = ( event ) => {
			if (
				wrapRef.current &&
				! wrapRef.current.contains( event.target )
			) {
				close();
			}
		};
		const onKey = ( event ) => {
			if ( 'Escape' === event.key ) {
				close();
			}
		};
		document.addEventListener( 'mousedown', onDown );
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.removeEventListener( 'mousedown', onDown );
			document.removeEventListener( 'keydown', onKey );
		};
	}, [ open ] );

	const onToggle = ( { id, visible } ) =>
		commit(
			tempCopyColumns.map( ( column ) =>
				column.id === id && ! column.locked
					? { ...column, visible }
					: column
			)
		);

	const onSortEnd = ( { oldIndex, newIndex } ) =>
		commit( arrayMoveImmutable( tempCopyColumns, oldIndex, newIndex ) );

	// Reset restores the table's curated default: default visibility
	// (locked or not-`defaultHidden`) AND the original code column order
	// (the numeric suffix of the positional id `column-{index}`).
	const handleReset = () =>
		commit(
			[ ...tempCopyColumns ]
				.sort(
					( a, b ) =>
						parseInt( a.id.replace( 'column-', '' ), 10 ) -
						parseInt( b.id.replace( 'column-', '' ), 10 )
				)
				.map( ( column ) => ( {
					...column,
					visible: column.locked ? true : ! column.defaultHidden,
				} ) )
		);

	const shown = tempCopyColumns?.filter( ( column ) => column.visible ).length || 0;
	const total = tempCopyColumns?.length || 0;

	return (
		<div className="kzui-table__sub-header-filter-icon" ref={ wrapRef }>
			<button
				type="button"
				className={ `kzui-table__columns-trigger${
					open ? ' is-open' : ''
				}` }
				onClick={ () => ( open ? close() : setOpen( true ) ) }
				aria-label={ __( 'Columns', 'storeengine' ) }
				aria-haspopup="dialog"
				aria-expanded={ open }
				title={ __( 'Columns', 'storeengine' ) }
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					aria-hidden="true"
				>
					<path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
					<circle cx="16" cy="7" r="2" />
					<circle cx="8" cy="17" r="2" />
				</svg>
			</button>

			{ open && (
				<div
					ref={ menuRef }
					className="se-admin-tw kzui-table__columns-menu"
					role="dialog"
					aria-label={ __( 'Columns', 'storeengine' ) }
				>
					<div className="kzui-table__columns-menu__head">
						<span className="kzui-table__columns-menu__title">
							<strong>{ __( 'Columns', 'storeengine' ) }</strong>
							<span className="kzui-table__columns-menu__count">
								{ sprintf(
									// translators: %1$d: shown columns, %2$d: total columns.
									__( '%1$d of %2$d shown', 'storeengine' ),
									shown,
									total
								) }
							</span>
						</span>
						<button
							type="button"
							className="kzui-table__columns-menu__link"
							onClick={ handleReset }
						>
							{ __( 'Reset', 'storeengine' ) }
						</button>
					</div>

					{ showColumnFilter && (
						<SortableColumnItemContainer
							useDragHandle
							// Keep the dragged clone INSIDE the menu: it then keeps
							// the menu's scoped styles (and the Tailwind scope the
							// checkbox needs). In <body> it lost both, which threw
							// the checkbox and label to the far right.
							helperContainer={ () => menuRef.current }
							onSortEnd={ onSortEnd }
							// react-sortable-hoc clones the dragged row into
							// <body> with an inline `position: fixed` but no
							// z-index; this class lifts the clone above the page
							// chrome. See _list-table.scss.
							helperClass="kzui-table__filter-drag-helper"
						>
							{ tempCopyColumns?.map( ( item, index ) => (
								<SortableColumnItem
									key={ `column-${ index }` }
									index={ index }
									copyColumn={ item }
									itemIndex={ index }
									checkedChange={ onToggle }
								/>
							) ) }
						</SortableColumnItemContainer>
					) }

				</div>
			) }
		</div>
	);
};

export default SortableColumns;
