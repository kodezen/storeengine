import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import { Button } from '@Components/ui';
import { generateSlug, makeRequest2 } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { getAttributeTerm } from '@Redux/Slices/attributesSlice/term';
import QuickAddTerms from './AttributeTerms/AttributeTermModal/QuickAddTerms';
import OptionMenu from '@Components/OptionMenu';
import TermRow from './TermRow';
import DeleteImpactModal from './DeleteImpactModal';
import { ORDERBY_OPTIONS, TYPE_OPTIONS, TypeGlyph } from './AttributeFormModal';

const PLACEHOLDERS = {
	select: __( 'Add a term, e.g. S, M, L', 'storeengine' ),
	color: __( 'Add a color, e.g. Red, Navy', 'storeengine' ),
	image: __( 'Add a term, e.g. Cotton, Linen', 'storeengine' ),
};

const SortableTerm = SortableElement( ( props ) => <TermRow { ...props } /> );

const SortableTermList = SortableContainer( ( { children } ) => (
	<ul className="storeengine-attr-terms__list">{ children }</ul>
) );

/**
 * Right pane: the selected attribute's terms. Add (one or comma-separated
 * many), presets, inline edit, delete and drag-to-reorder — all in place.
 *
 * @param {Object}   props
 * @param {Object}   props.attribute Selected attribute row.
 * @param {Function} props.onEdit    Opens the attribute settings modal.
 * @param {Function} props.onDelete  Deletes the attribute.
 */
const AttributeTermsPanel = ( { attribute, onEdit, onDelete } ) => {
	const dispatch = useDispatch();
	const attributeId = Number( attribute.attribute_id );
	const type = attribute.attribute_type || 'select';
	const orderby = attribute.attribute_orderby || 'custom-ordering';
	const sortable = 'custom-ordering' === orderby;

	const storeTerms = useSelector(
		( state ) => state.attributes.terms?.[ attributeId ]
	);
	const [ optimistic, setOptimistic ] = useState( null );
	const terms =
		optimistic || ( Array.isArray( storeTerms ) ? storeTerms : [] );
	const loaded = Array.isArray( storeTerms );

	const [ newName, setNewName ] = useState( '' );
	// Names the Add button will create, split on commas (shown as chips).
	const pending = newName
		.split( ',' )
		.map( ( n ) => n.trim() )
		.filter( Boolean );
	const [ newColor, setNewColor ] = useState( '' );
	const [ adding, setAdding ] = useState( false );
	const [ showPresets, setShowPresets ] = useState( false );
	const [ editingId, setEditingId ] = useState( null );
	// In-use term awaiting confirmation: { term, usage }.
	const [ impact, setImpact ] = useState( null );
	const [ impactDeleting, setImpactDeleting ] = useState( false );
	const [ savingOrder, setSavingOrder ] = useState( false );
	const listWrapRef = useRef( null );
	const addInputRef = useRef( null );

	const notify = ( message, kind = 'success' ) =>
		dispatch( showNotification( { message, isShow: true, type: kind } ) );
	const errorOf = ( e ) =>
		e?.response?.data?.message ||
		e?.message ||
		__( 'Something went wrong.', 'storeengine' );

	const refresh = () => dispatch( getAttributeTerm( attributeId ) );

	// Always re-read terms when switching attribute so counts/order are fresh.
	useEffect( () => {
		setOptimistic( null );
		setEditingId( null );
		setShowPresets( false );
		setNewName( '' );
		setNewColor( '' );
		refresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ attributeId ] );

	// Drop the optimistic order once the store has the canonical one.
	useEffect( () => setOptimistic( null ), [ storeTerms ] );

	const addTerms = async ( e ) => {
		e?.preventDefault();
		const names = newName
			.split( ',' )
			.map( ( n ) => n.trim() )
			.filter( Boolean );
		if ( ! names.length || adding ) {
			return;
		}

		setAdding( true );
		try {
			const res = await makeRequest2( 'create_product_attribute_terms', {
				attribute_id: attributeId,
				terms: JSON.stringify(
					names.map( ( name ) => ( {
						name,
						slug: generateSlug( name ),
						// One swatch colour applies when adding a single term.
						...( 'color' === type && newColor && 1 === names.length
							? { color: newColor }
							: {} ),
					} ) )
				),
			} );
			await refresh();
			const created = res?.created?.length || 0;
			const skipped = res?.skipped || [];
			if ( created ) {
				notify(
					sprintf(
						/* translators: %d: number of terms */
						_n(
							'%d term added',
							'%d terms added',
							created,
							'storeengine'
						),
						created
					)
				);
			}
			if ( skipped.length ) {
				notify(
					sprintf(
						/* translators: %s: comma-separated term names */
						__( 'Already exists: %s', 'storeengine' ),
						skipped.join( ', ' )
					),
					'error'
				);
			}
			setNewName( '' );
			setNewColor( '' );
			addInputRef.current?.focus();
		} catch ( err ) {
			notify( errorOf( err ), 'error' );
		} finally {
			setAdding( false );
		}
	};

	const saveTerm = async ( term, values ) => {
		try {
			await makeRequest2( 'update_product_attribute_term', {
				attribute_id: attributeId,
				term_id: term.term_id,
				name: values.name,
				slug: values.slug,
				description: values.description,
				color: values.color,
				image_id: values.image_id || 0,
			} );
			await refresh();
			setEditingId( null );
			notify( __( 'Term updated', 'storeengine' ) );
			return true;
		} catch ( err ) {
			notify( errorOf( err ), 'error' );
			return false;
		}
	};

	const removeTerm = async ( term, force ) => {
		await makeRequest2( 'delete_product_attribute_term', {
			attribute_id: attributeId,
			term_id: term.term_id,
			force: force ? 1 : 0,
		} );
		await refresh();
		notify( __( 'Term deleted', 'storeengine' ) );
	};

	// Unused terms are deleted right away; a term products use first shows
	// what deleting it removes (variations, stock, order links).
	const deleteTerm = async ( term ) => {
		try {
			const usage = await makeRequest2( 'get_product_attribute_usage', {
				attribute_id: attributeId,
				term_id: term.term_id,
			} );
			if ( usage?.in_use ) {
				setImpact( { term, usage } );
				return;
			}
			await removeTerm( term, false );
		} catch ( err ) {
			notify( errorOf( err ), 'error' );
		}
	};

	const confirmImpact = async () => {
		setImpactDeleting( true );
		try {
			await removeTerm( impact.term, true );
			setImpact( null );
		} catch ( err ) {
			notify( errorOf( err ), 'error' );
		} finally {
			setImpactDeleting( false );
		}
	};

	const onSortEnd = async ( { oldIndex, newIndex } ) => {
		if ( oldIndex === newIndex ) {
			return;
		}
		const next = arrayMoveImmutable( terms, oldIndex, newIndex );
		setOptimistic( next );
		setSavingOrder( true );
		try {
			await makeRequest2( 'reorder_product_attribute_terms', {
				attribute_id: attributeId,
				term_ids: next.map( ( t ) => t.term_id ).join( ',' ),
			} );
			await refresh();
		} catch ( err ) {
			setOptimistic( null );
			notify( errorOf( err ), 'error' );
		} finally {
			setSavingOrder( false );
		}
	};

	const typeLabel =
		TYPE_OPTIONS.find( ( o ) => o.value === type )?.label || type;

	const rowProps = ( term ) => ( {
		term,
		type,
		sortable: sortable && terms.length > 1 && ! editingId,
		editing: editingId === term.term_id,
		onEdit: () => setEditingId( term.term_id ),
		onCancel: () => setEditingId( null ),
		onSave: ( values ) => saveTerm( term, values ),
		onDelete: () => deleteTerm( term ),
	} );

	return (
		<section className="storeengine-attr-terms">
			<header className="storeengine-attr-terms__head">
				<div className="storeengine-attr-terms__heading">
					<span
						className={ `storeengine-attr-manager__glyph is-${ type } is-lg` }
					>
						<TypeGlyph type={ type } />
					</span>
					<div className="min-w-0">
						<h2 className="storeengine-attr-terms__title">
							{ attribute.attribute_label }
						</h2>
						<div className="storeengine-attr-terms__meta">
							<code>{ attribute.attribute_name }</code>
							<span>{ typeLabel }</span>
							<span>
								{ sprintf(
									/* translators: %d: number of terms */
									_n(
										'%d term',
										'%d terms',
										terms.length,
										'storeengine'
									),
									terms.length
								) }
							</span>
						</div>
					</div>
				</div>
				<div className="storeengine-attr-terms__head-actions">
					<OptionMenu
						suffix="attr-actions"
						options={ [
							{
								type: 'button',
								label: __( 'Settings', 'storeengine' ),
								onClick: onEdit,
								hasBorder: true,
								icon: (
									<span
										className="storeengine-icon storeengine-icon--edit"
										aria-hidden={ true }
									/>
								),
							},
							{
								type: 'button',
								label: __( 'Delete', 'storeengine' ),
								suffix: 'trash',
								onClick: onDelete,
								icon: (
									<span
										className="storeengine-icon storeengine-icon--trash"
										aria-hidden={ true }
									/>
								),
							},
						] }
					/>
				</div>
			</header>

			<form
				className="storeengine-attr-terms__composer"
				onSubmit={ addTerms }
			>
				<div
					className={ `storeengine-attr-terms__field${
						adding ? ' is-busy' : ''
					}` }
				>
					{ 'color' === type ? (
						<label
							className="storeengine-attr-terms__swatch-pick"
							title={ __( 'Swatch color', 'storeengine' ) }
							style={ { backgroundColor: newColor || '#ffffff' } }
						>
							<input
								type="color"
								value={ newColor || '#000000' }
								onChange={ ( e ) =>
									setNewColor( e.target.value )
								}
								aria-label={ __(
									'Swatch color',
									'storeengine'
								) }
							/>
						</label>
					) : null }
					<input
						ref={ addInputRef }
						type="text"
						value={ newName }
						onChange={ ( e ) => setNewName( e.target.value ) }
						onKeyDown={ ( e ) =>
							'Escape' === e.key && setNewName( '' )
						}
						placeholder={
							PLACEHOLDERS[ type ] || PLACEHOLDERS.select
						}
						aria-label={ __( 'New term name', 'storeengine' ) }
						autoComplete="off"
						data-1p-ignore="true"
						data-lpignore="true"
						disabled={ adding }
					/>
					<Button
						type="submit"
						preset="primary"
						size="sm"
						isLoading={ adding }
						disabled={ ! pending.length }
						className="storeengine-attr-terms__add-btn"
					>
						{ pending.length > 1
							? sprintf(
									/* translators: %d: number of terms */
									__( 'Add %d', 'storeengine' ),
									pending.length
							  )
							: __( 'Add', 'storeengine' ) }
					</Button>
				</div>

				<div className="storeengine-attr-terms__composer-foot">
					{ pending.length > 1 ? (
						<ul
							className="storeengine-attr-terms__pending"
							aria-label={ __( 'Terms to add', 'storeengine' ) }
						>
							{ pending.map( ( name, i ) => (
								<li key={ `${ name }-${ i }` }>{ name }</li>
							) ) }
						</ul>
					) : (
						<span className="storeengine-attr-terms__composer-hint">
							{ __(
								'Tip: separate with commas to add several at once.',
								'storeengine'
							) }
						</span>
					) }
					<button
						type="button"
						className={ `storeengine-attr-terms__presets-toggle${
							showPresets ? ' is-open' : ''
						}` }
						aria-expanded={ showPresets }
						onClick={ () => setShowPresets( ( v ) => ! v ) }
					>
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
							<rect x="3" y="3" width="7" height="7" rx="1.5" />
							<rect x="14" y="3" width="7" height="7" rx="1.5" />
							<rect x="3" y="14" width="7" height="7" rx="1.5" />
							<rect x="14" y="14" width="7" height="7" rx="1.5" />
						</svg>
						{ showPresets
							? __( 'Hide presets', 'storeengine' )
							: __( 'Add from presets', 'storeengine' ) }
					</button>
				</div>
			</form>

			{ showPresets && (
				<div className="storeengine-attr-terms__presets">
					<QuickAddTerms
						attributeId={ attributeId }
						attributeType={ type }
						onDone={ () => setShowPresets( false ) }
					/>
				</div>
			) }

			{ loaded && terms.length > 0 && (
				<div className="storeengine-attr-terms__list-head">
					<span className="storeengine-attr-terms__list-title">
						{ __( 'Terms', 'storeengine' ) }
						<span className="storeengine-attr-terms__list-count">
							{ terms.length }
						</span>
					</span>
					<span className="storeengine-attr-terms__list-note">
						{ savingOrder && __( 'Saving order…', 'storeengine' ) }
						{ ! savingOrder &&
							sortable &&
							terms.length > 1 &&
							__( 'Drag to reorder', 'storeengine' ) }
						{ ! savingOrder && ! sortable && (
							<>
								{ sprintf(
									/* translators: %s: sort order name, e.g. Name */
									__( 'Sorted by %s', 'storeengine' ),
									ORDERBY_OPTIONS.find(
										( o ) => o.value === orderby
									)?.label || orderby
								) }
								{ ' · ' }
								<button type="button" onClick={ onEdit }>
									{ __( 'Change', 'storeengine' ) }
								</button>
							</>
						) }
					</span>
				</div>
			) }

			<div
				ref={ listWrapRef }
				className="storeengine-attr-terms__list-wrap"
			>
				{ ! loaded && (
					<ul
						className="storeengine-attr-terms__list"
						aria-hidden="true"
					>
						{ [ 0, 1, 2 ].map( ( i ) => (
							<li
								key={ i }
								className="storeengine-attr-term is-skeleton"
							/>
						) ) }
					</ul>
				) }

				{ loaded && ! terms.length && (
					<div className="storeengine-attr-terms__empty">
						<strong>{ __( 'No terms yet', 'storeengine' ) }</strong>
						<span>
							{ __(
								'Type above to add your first term, or pick from Presets.',
								'storeengine'
							) }
						</span>
					</div>
				) }

				{ loaded && terms.length > 0 && (
					<SortableTermList
						onSortEnd={ onSortEnd }
						useDragHandle
						lockAxis="y"
						lockToContainerEdges
						helperClass="storeengine-attr-term--dragging"
						helperContainer={ () => listWrapRef.current }
					>
						{ terms.map( ( term, index ) => (
							<SortableTerm
								key={ term.term_id }
								index={ index }
								disabled={ ! sortable || !! editingId }
								{ ...rowProps( term ) }
							/>
						) ) }
					</SortableTermList>
				) }
			</div>

			<DeleteImpactModal
				open={ !! impact }
				isTerm
				subject={ impact?.term?.name || '' }
				usage={ impact?.usage }
				deleting={ impactDeleting }
				onConfirm={ confirmImpact }
				onClose={ () => setImpact( null ) }
			/>
		</section>
	);
};

AttributeTermsPanel.propTypes = {
	attribute: PropTypes.object.isRequired,
	onEdit: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

export default AttributeTermsPanel;
