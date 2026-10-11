import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Scope } from '@Components/ui';
import { makeRequest2 } from '@Utils/helper';
import ConditionRow from './ConditionRow';
import QuickFields, {
	hasQuickFields,
	isQuickCondition,
} from './QuickFields';
import {
	cleanGroups,
	countConditions,
	describe,
	describeChip,
	encodeGroups,
	newCondition,
	sameGroups,
} from './utils';
import './styles.scss';

export * from './utils';
export { default as useListFilters } from './useListFilters';

/**
 * Close on a click outside `refs` — but not inside a portaled Select menu,
 * which lives on <body> outside the panel.
 *
 * @param {boolean}  open    Whether the popover is open.
 * @param {Array}    refs    Refs counted as "inside".
 * @param {Function} onClose Called to close.
 */
const useOutsideClose = ( open, refs, onClose ) => {
	useEffect( () => {
		if ( ! open ) {
			return undefined;
		}
		const onDoc = ( e ) => {
			if ( e.target.closest?.( '[role="listbox"]' ) ) {
				return;
			}
			if ( ! refs.some( ( r ) => r.current?.contains( e.target ) ) ) {
				onClose();
			}
		};
		const onKey = ( e ) => 'Escape' === e.key && onClose();
		document.addEventListener( 'mousedown', onDoc );
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.removeEventListener( 'mousedown', onDoc );
			document.removeEventListener( 'keydown', onKey );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ open ] );
};

/**
 * 'left' when a popover anchored to the wrapper's right edge would run off the
 * left of the screen, so it opens from the left edge instead.
 *
 * @param {boolean} open  Whether the popover is open.
 * @param {Object}  ref   Wrapper ref.
 * @param {number}  width Popover width.
 */
const useAlign = ( open, ref, width ) => {
	const [ align, setAlign ] = useState( 'right' );
	useEffect( () => {
		if ( open && ref.current ) {
			const rect = ref.current.getBoundingClientRect();
			setAlign( rect.right - width < 16 ? 'left' : 'right' );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ open ] );
	return align;
};

const FunnelIcon = () => (
	<svg
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M3 5h18l-7 8.5V19l-4 2v-7.5L3 5Z" />
	</svg>
);

/**
 * "Filter" button + popover builder.
 *
 * Conditions in a group must all match; groups are alternatives (OR).
 * Edits happen on a draft and apply only on "Apply".
 *
 * @param {Object}   props
 * @param {Array}    props.fields       Field configs (see utils.js).
 * @param {Array}    props.value        Applied groups.
 * @param {Function} props.onApply      Called with the cleaned groups.
 * @param {boolean}  props.open         Controlled open state (optional).
 * @param {Function} props.onOpenChange Controlled open setter (optional).
 */
export const AdvancedFilter = ( {
	fields,
	value,
	onApply,
	open: openProp,
	onOpenChange,
} ) => {
	const [ openState, setOpenState ] = useState( false );
	const open = undefined === openProp ? openState : openProp;
	const setOpen = onOpenChange || setOpenState;
	const [ draft, setDraft ] = useState( [] );
	const wrapRef = useRef( null );
	const count = countConditions( value );

	// Seed the draft from the applied filters each time the panel opens.
	useEffect( () => {
		if ( open ) {
			if ( value?.length ) {
				setDraft( value );
			} else {
				// Quick filters need no starter row; the builder does.
				setDraft( hasQuickFields( fields ) ? [] : [ [ newCondition( fields ) ] ] );
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ open ] );

	useOutsideClose( open, [ wrapRef ], () => setOpen( false ) );
	const align = useAlign( open, wrapRef, 600 );

	const updateCondition = ( gi, ci, next ) =>
		setDraft( ( d ) =>
			d.map( ( g, i ) =>
				i === gi ? g.map( ( c, j ) => ( j === ci ? next : c ) ) : g
			)
		);
	const removeCondition = ( gi, ci ) =>
		setDraft( ( d ) =>
			d
				.map( ( g, i ) =>
					i === gi ? g.filter( ( _, j ) => j !== ci ) : g
				)
				.filter( ( g ) => g.length )
		);
	const addCondition = ( gi ) =>
		setDraft( ( d ) =>
			d.map( ( g, i ) =>
				i === gi ? [ ...g, newCondition( fields ) ] : g
			)
		);
	const addGroup = () =>
		setDraft( ( d ) => [ ...d, [ newCondition( fields ) ] ] );

	const apply = () => {
		onApply( cleanGroups( fields, draft ) );
		setOpen( false );
	};

	// Fields flagged `quick` get direct controls; the builder keeps the rest.
	const quickMode = hasQuickFields( fields );
	const draftCount = countConditions( cleanGroups( fields, draft ) );
	const advancedRows = draft.flatMap( ( g, gi ) =>
		g.filter(
			( c ) => ! quickMode || 0 !== gi || ! isQuickCondition( fields, c )
		)
	);
	const hasAdvanced = advancedRows.length > 0 || draft.length > 1;

	// A row keeps a quick field only if it already uses it (e.g. from a saved
	// view). New rows pick from the other fields, so a condition never jumps up
	// into the quick controls while it is being edited.
	const rowFields = ( c ) =>
		quickMode
			? fields.filter( ( f ) => ! f.quick || f.id === c.field )
			: fields;

	const addAdvanced = () => {
		const first = fields.find( ( f ) => ! f.quick ) || fields[ 0 ];
		setDraft( ( d ) => {
			const next = newCondition( fields, first.id );
			return d.length
				? [ [ ...d[ 0 ], next ], ...d.slice( 1 ) ]
				: [ [ next ] ];
		} );
	};

	return (
		<div
			className={ `storeengine-adv-filter${
				'left' === align ? ' is-align-left' : ''
			}` }
			ref={ wrapRef }
		>
			<button
				type="button"
				className={ `storeengine-adv-filter__trigger${
					count ? ' is-active' : ''
				}${ open ? ' is-open' : '' }` }
				aria-expanded={ open }
				onClick={ () => setOpen( ! open ) }
			>
				<FunnelIcon />
				{ __( 'Filter', 'storeengine' ) }
				{ count > 0 && (
					<span className="storeengine-adv-filter__badge">
						{ count }
					</span>
				) }
			</button>

			{ open && (
				<Scope
					className="storeengine-adv-filter__panel"
					role="dialog"
					aria-label={ __( 'Filters', 'storeengine' ) }
				>
					<div className="storeengine-adv-filter__head storeengine-adv-filter__head--row">
						<strong>{ __( 'Filters', 'storeengine' ) }</strong>
						<button
							type="button"
							className="storeengine-adv-filter__link is-muted"
							onClick={ () => setDraft( [] ) }
						>
							{ __( 'Reset all', 'storeengine' ) }
						</button>
					</div>

					<div
						className="storeengine-adv-filter__groups"
						onKeyDown={ ( e ) => {
							if (
								'Enter' === e.key &&
								'INPUT' === e.target.tagName
							) {
								e.preventDefault();
								apply();
							}
						} }
					>
						{ quickMode && (
							<QuickFields
								fields={ fields }
								draft={ draft }
								setDraft={ setDraft }
							/>
						) }

						{ draft.map( ( group, gi ) => {
							// Quick-managed conditions live in the controls above.
							const rows = group
								.map( ( c, ci ) => ( { c, ci } ) )
								.filter(
									( { c } ) =>
										! quickMode ||
										0 !== gi ||
										! isQuickCondition( fields, c )
								);
							if ( ! rows.length && 0 === gi && quickMode ) {
								return null;
							}
							return (
								<React.Fragment key={ gi }>
									{ gi > 0 && (
										<div className="storeengine-adv-filter__or">
											<span>{ __( 'or', 'storeengine' ) }</span>
										</div>
									) }
									<div className="storeengine-adv-filter__group">
										{ rows.map( ( { c, ci }, ri ) => (
											<React.Fragment key={ ci }>
												{ ri > 0 && (
													<div className="storeengine-adv-filter__and">
														{ __( 'and', 'storeengine' ) }
													</div>
												) }
												<ConditionRow
													fields={ rowFields( c ) }
													condition={ c }
													onChange={ ( next ) =>
														updateCondition( gi, ci, next )
													}
													onRemove={ () =>
														removeCondition( gi, ci )
													}
												/>
											</React.Fragment>
										) ) }
										<button
											type="button"
											className="storeengine-adv-filter__add"
											onClick={ () => addCondition( gi ) }
										>
											+{ ' ' }
											{ __( 'Add condition', 'storeengine' ) }
										</button>
									</div>
								</React.Fragment>
							);
						} ) }

						{ quickMode && ! hasAdvanced && (
							<div className="storeengine-adv-filter__adv">
								<span>
									{ __(
										'Need a different rule, like "starts with"?',
										'storeengine'
									) }
								</span>
								<button
									type="button"
									className="storeengine-adv-filter__link"
									onClick={ addAdvanced }
								>
									+ { __( 'Add condition', 'storeengine' ) }
								</button>
							</div>
						) }

						{ ! quickMode && ! draft.length && (
							<div className="storeengine-adv-filter__empty">
								<span>
									{ __(
										'No conditions. Add one to narrow the list.',
										'storeengine'
									) }
								</span>
								<button
									type="button"
									className="storeengine-adv-filter__add-group"
									onClick={ () =>
										setDraft( [ [ newCondition( fields ) ] ] )
									}
								>
									+ { __( 'Add condition', 'storeengine' ) }
								</button>
							</div>
						) }

						{ draft.length > 0 && ( ! quickMode || hasAdvanced ) && (
							<button
								type="button"
								className="storeengine-adv-filter__add-group"
								onClick={ addGroup }
							>
								+ { __( 'Add “or” group', 'storeengine' ) }
							</button>
						) }
					</div>

					<div className="storeengine-adv-filter__foot">
						<div className="storeengine-adv-filter__foot-left">
							<span className="storeengine-adv-filter__count">
								{ sprintf(
									// translators: %d: number of filters set.
									_n(
										'%d filter set',
										'%d filters set',
										draftCount,
										'storeengine'
									),
									draftCount
								) }
							</span>
						</div>
						<div className="storeengine-adv-filter__foot-right">
							<button
								type="button"
								className="storeengine-adv-filter__btn"
								onClick={ () => setOpen( false ) }
							>
								{ __( 'Cancel', 'storeengine' ) }
							</button>
							<button
								type="button"
								className="storeengine-adv-filter__btn is-primary"
								onClick={ apply }
							>
								{ __( 'Apply filters', 'storeengine' ) }
							</button>
						</div>
					</div>
				</Scope>
			) }
		</div>
	);
};

AdvancedFilter.propTypes = {
	fields: PropTypes.array.isRequired,
	value: PropTypes.array,
	onApply: PropTypes.func.isRequired,
	open: PropTypes.bool,
	onOpenChange: PropTypes.func,
};

/**
 * Saved views for one screen: read from the page seed, saved per user.
 *
 * @param {string} screen Screen id.
 */
export const useSavedViews = ( screen ) => {
	const [ views, setViews ] = useState( () => {
		const seeded = window.StoreEngineGlobal?.saved_views?.[ screen ];
		return Array.isArray( seeded ) ? seeded : [];
	} );

	const keepSeed = ( list ) => {
		// Keep the page seed in sync so a remount (route change) sees the edit.
		if ( window.StoreEngineGlobal ) {
			window.StoreEngineGlobal.saved_views = {
				...( window.StoreEngineGlobal.saved_views || {} ),
				[ screen ]: list,
			};
		}
		setViews( list );
	};

	const save = async ( { id = '', name, groups } ) => {
		const res = await makeRequest2( 'save_saved_view', {
			screen,
			id,
			name,
			filters: encodeGroups( groups ),
		} );
		keepSeed( res?.views || [] );
		return res?.view;
	};

	const remove = async ( id ) => {
		const res = await makeRequest2( 'delete_saved_view', { screen, id } );
		keepSeed( res?.views || [] );
	};

	return { views, save, remove };
};

/**
 * "Views" dropdown: apply or delete a saved view.
 *
 * @param {Object}   props
 * @param {Array}    props.views    Saved views.
 * @param {string}   props.activeId Active view id.
 * @param {Function} props.onSelect Called with a view (null = no view).
 * @param {Function} props.onDelete Called with a view id.
 */
export const SavedViewsMenu = ( {
	views,
	activeId,
	onSelect,
	onDelete,
	allLabel = __( 'All', 'storeengine' ),
	onSave,
	canSave = false,
} ) => {
	const [ open, setOpen ] = useState( false );
	const [ naming, setNaming ] = useState( false );
	const [ name, setName ] = useState( '' );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState( '' );
	const ref = useRef( null );
	const close = () => {
		setOpen( false );
		setNaming( false );
		setName( '' );
		setError( '' );
	};
	useOutsideClose( open, [ ref ], close );
	const align = useAlign( open, ref, 260 );
	const active = views.find( ( v ) => v.id === activeId );

	const save = async () => {
		if ( ! name.trim() || ! onSave ) {
			return;
		}
		setBusy( true );
		setError( '' );
		try {
			await onSave( { name: name.trim() } );
			close();
		} catch ( e ) {
			setError(
				e?.message || __( 'Could not save the view.', 'storeengine' )
			);
		} finally {
			setBusy( false );
		}
	};

	return (
		<div
			className={ `storeengine-adv-filter storeengine-saved-views${
				'left' === align ? ' is-align-left' : ''
			}` }
			ref={ ref }
		>
			<button
				type="button"
				className={ `storeengine-adv-filter__trigger${
					active ? ' is-active' : ' is-compact'
				}${ open ? ' is-open' : '' }` }
				aria-expanded={ open }
				aria-haspopup="menu"
				aria-label={
					active ? undefined : __( 'Saved views', 'storeengine' )
				}
				title={
					active ? active.name : __( 'Saved views', 'storeengine' )
				}
				onClick={ () => ( open ? close() : setOpen( true ) ) }
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
				</svg>
				<span className="storeengine-saved-views__label">
					{ active ? active.name : __( 'Views', 'storeengine' ) }
				</span>
			</button>

			{ open && (
				<div className="storeengine-saved-views__menu" role="menu">
					<div className="storeengine-saved-views__list">
						<div
							className={ `storeengine-saved-views__item${
								! activeId ? ' is-active' : ''
							}` }
						>
							<button
								type="button"
								role="menuitem"
								className="storeengine-saved-views__apply"
								onClick={ () => {
									onSelect( null );
									close();
								} }
							>
								<span>{ allLabel }</span>
							</button>
						</div>

						{ views.map( ( view ) => (
							<div
								key={ view.id }
								className={ `storeengine-saved-views__item${
									view.id === activeId ? ' is-active' : ''
								}` }
							>
								<button
									type="button"
									role="menuitem"
									className="storeengine-saved-views__apply"
									onClick={ () => {
										onSelect( view );
										close();
									} }
								>
									<span>{ view.name }</span>
								</button>
								<button
									type="button"
									className="storeengine-saved-views__delete"
									aria-label={ sprintf(
										/* translators: %s: view name */ __(
											'Delete view “%s”',
											'storeengine'
										),
										view.name
									) }
									title={ __( 'Delete view', 'storeengine' ) }
									onClick={ () => onDelete( view.id ) }
								>
									<svg
										width="13"
										height="13"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										aria-hidden="true"
									>
										<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
									</svg>
								</button>
							</div>
						) ) }
					</div>

					{ onSave && (
						<div className="storeengine-saved-views__foot">
							{ naming ? (
								<form
									className="storeengine-saved-views__name"
									onSubmit={ ( e ) => {
										e.preventDefault();
										save();
									} }
								>
									<input
										autoFocus
										type="text"
										value={ name }
										maxLength={ 60 }
										placeholder={ __(
											'Name this view…',
											'storeengine'
										) }
										aria-label={ __(
											'View name',
											'storeengine'
										) }
										onChange={ ( e ) =>
											setName( e.target.value )
										}
										onKeyDown={ ( e ) =>
											'Escape' === e.key &&
											setNaming( false )
										}
									/>
									<button
										type="submit"
										className="storeengine-adv-filter__btn is-primary"
										disabled={ busy || ! name.trim() }
									>
										{ busy
											? __( 'Saving…', 'storeengine' )
											: __( 'Save', 'storeengine' ) }
									</button>
									{ error && (
										<span className="storeengine-filter-chips__error">
											{ error }
										</span>
									) }
								</form>
							) : (
								<button
									type="button"
									className="storeengine-saved-views__save"
									disabled={ ! canSave }
									title={
										canSave
											? undefined
											: __(
													'Apply a filter first',
													'storeengine'
											  )
									}
									onClick={ () => setNaming( true ) }
								>
									{ __(
										'Save current filters as view',
										'storeengine'
									) }
								</button>
							) }
						</div>
					) }
				</div>
			) }
		</div>
	);
};

SavedViewsMenu.propTypes = {
	views: PropTypes.array.isRequired,
	activeId: PropTypes.string,
	onSelect: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

/**
 * Applied conditions as removable chips, with save/update-view actions.
 *
 * @param {Object}   props
 * @param {Array}    props.fields     Field configs.
 * @param {Array}    props.groups     Applied groups.
 * @param {Function} props.onChange   Called with the new groups.
 * @param {Function} props.onEdit     Opens the filter panel.
 * @param {Object}   props.activeView Active saved view, if any.
 * @param {Function} props.onSave     ( { id?, name } ) => Promise.
 */
export const FilterChips = ( {
	fields,
	groups,
	onChange,
	onEdit,
	activeView,
	onSave,
} ) => {
	const [ naming, setNaming ] = useState( false );
	const [ name, setName ] = useState( '' );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState( '' );

	if ( ! groups?.length ) {
		return null;
	}

	const remove = ( gi, ci ) =>
		onChange(
			groups
				.map( ( g, i ) =>
					i === gi ? g.filter( ( _, j ) => j !== ci ) : g
				)
				.filter( ( g ) => g.length )
		);

	const changed =
		activeView &&
		! sameGroups( groups, JSON.parse( activeView.filters || '[]' ) );

	const submit = async ( payload ) => {
		setBusy( true );
		setError( '' );
		try {
			await onSave( payload );
			setNaming( false );
			setName( '' );
		} catch ( e ) {
			setError(
				e?.message || __( 'Could not save the view.', 'storeengine' )
			);
		} finally {
			setBusy( false );
		}
	};

	return (
		<div className="storeengine-filter-chips">
			<div className="storeengine-filter-chips__list">
				{ groups.map( ( group, gi ) => (
					<React.Fragment key={ gi }>
						{ gi > 0 && (
							<span className="storeengine-filter-chips__or">
								{ __( 'or', 'storeengine' ) }
							</span>
						) }
						{ group.map( ( c, ci ) => (
							<span
								key={ ci }
								className="storeengine-filter-chips__chip"
							>
								<button
									type="button"
									className="storeengine-filter-chips__text"
									onClick={ onEdit }
								>
									{ ( () => {
										const chip = describeChip( fields, c );
										return chip ? (
											<>
												{ chip.label }:{ ' ' }
												<b>{ chip.text }</b>
											</>
										) : (
											describe( fields, c )
										);
									} )() }
								</button>
								<button
									type="button"
									className="storeengine-filter-chips__x"
									onClick={ () => remove( gi, ci ) }
									aria-label={ __(
										'Remove filter',
										'storeengine'
									) }
								>
									×
								</button>
							</span>
						) ) }
					</React.Fragment>
				) ) }
				<button
					type="button"
					className="storeengine-filter-chips__clear"
					onClick={ () => onChange( [] ) }
				>
					{ __( 'Clear all', 'storeengine' ) }
				</button>
			</div>

			<div className="storeengine-filter-chips__actions">
				{ naming ? (
					<form
						className="storeengine-filter-chips__save"
						onSubmit={ ( e ) => {
							e.preventDefault();
							if ( name.trim() ) {
								submit( { name: name.trim() } );
							}
						} }
					>
						<span className="storeengine-filter-chips__save-field">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
							</svg>
							<input
								autoFocus
								type="text"
								value={ name }
								maxLength={ 60 }
								placeholder={ __(
									'Name this view…',
									'storeengine'
								) }
								aria-label={ __( 'View name', 'storeengine' ) }
								onChange={ ( e ) => setName( e.target.value ) }
								onKeyDown={ ( e ) =>
									'Escape' === e.key && setNaming( false )
								}
							/>
							<button
								type="submit"
								className="storeengine-filter-chips__save-btn"
								disabled={ busy || ! name.trim() }
							>
								{ busy
									? __( 'Saving…', 'storeengine' )
									: __( 'Save', 'storeengine' ) }
							</button>
						</span>
						<button
							type="button"
							className="storeengine-filter-chips__save-cancel"
							onClick={ () => setNaming( false ) }
							aria-label={ __( 'Cancel', 'storeengine' ) }
							title={ __( 'Cancel', 'storeengine' ) }
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.2"
								strokeLinecap="round"
								aria-hidden="true"
							>
								<path d="M6 6l12 12M18 6 6 18" />
							</svg>
						</button>
					</form>
				) : (
					<>
						{ changed && (
							<button
								type="button"
								className="storeengine-adv-filter__link"
								disabled={ busy }
								onClick={ () =>
									submit( {
										id: activeView.id,
										name: activeView.name,
									} )
								}
							>
								{ sprintf(
									/* translators: %s: view name */ __(
										'Update “%s”',
										'storeengine'
									),
									activeView.name
								) }
							</button>
						) }
						{ ( ! activeView || changed ) && (
							<button
								type="button"
								className="storeengine-adv-filter__link"
								onClick={ () => setNaming( true ) }
							>
								{ __( 'Save as view', 'storeengine' ) }
							</button>
						) }
						<span className="storeengine-filter-chips__count">
							{ sprintf(
								/* translators: %d: number of conditions */
								_n(
									'%d condition',
									'%d conditions',
									countConditions( groups ),
									'storeengine'
								),
								countConditions( groups )
							) }
						</span>
					</>
				) }
				{ error && (
					<span className="storeengine-filter-chips__error">
						{ error }
					</span>
				) }
			</div>
		</div>
	);
};

FilterChips.propTypes = {
	fields: PropTypes.array.isRequired,
	groups: PropTypes.array,
	onChange: PropTypes.func.isRequired,
	onEdit: PropTypes.func.isRequired,
	activeView: PropTypes.object,
	onSave: PropTypes.func.isRequired,
};
