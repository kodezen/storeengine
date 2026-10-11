import React, { useMemo, useState } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { generateSlug, makeRequest2 } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { getAttributeTerm } from '@Redux/Slices/attributesSlice/term';
import { fetchAllAttributes } from '@Redux/Slices/attributesSlice/attributesSlice';
import { getTermPresets } from './termPresets';
import './QuickAddTerms.scss';

/**
 * "Quick add" panel at the top of the Create Term modal: pick a preset (colors,
 * clothing sizes, shoe sizes…), tick the terms you want and add them all at once.
 * Terms that already exist on the attribute are shown as added and skipped.
 */
const QuickAddTerms = ( { attributeId, attributeType, onDone, onAdded } ) => {
	const dispatch = useDispatch();
	const presets = useMemo( getTermPresets, [] );
	const existing = useSelector( ( state ) => state.attributes.terms?.[ attributeId ] );
	const [ presetId, setPresetId ] = useState(
		'color' === attributeType ? 'colors' : 'clothing-sizes'
	);
	const [ selected, setSelected ] = useState( [] );
	const [ busy, setBusy ] = useState( false );

	const preset = presets.find( ( p ) => p.id === presetId );
	const useSwatch = !! preset.swatch && 'color' === attributeType;

	const existingSlugs = useMemo(
		() => new Set( ( Array.isArray( existing ) ? existing : [] ).map( ( t ) => String( t.slug ).toLowerCase() ) ),
		[ existing ]
	);
	const isAdded = ( term ) => existingSlugs.has( generateSlug( term.name ).toLowerCase() );
	const available = preset.terms.filter( ( t ) => ! isAdded( t ) );

	const switchPreset = ( id ) => {
		setPresetId( id );
		setSelected( [] );
	};
	const toggle = ( name ) =>
		setSelected( ( cur ) => ( cur.includes( name ) ? cur.filter( ( n ) => n !== name ) : [ ...cur, name ] ) );

	const add = async () => {
		const list = preset.terms
			.filter( ( t ) => selected.includes( t.name ) )
			.map( ( t ) => ( {
				name: t.name,
				slug: generateSlug( t.name ),
				...( useSwatch && t.color ? { color: t.color } : {} ),
			} ) );
		if ( ! list.length || busy ) {
			return;
		}

		setBusy( true );
		try {
			const res = await makeRequest2( 'create_product_attribute_terms', {
				attribute_id: attributeId,
				terms: JSON.stringify( list ),
			} );
			const created = res?.created?.length || 0;
			await Promise.all( [
				dispatch( getAttributeTerm( attributeId ) ),
				dispatch( fetchAllAttributes( {} ) ),
			] );
			dispatch(
				showNotification( {
					message: sprintf(
						/* translators: %d: number of terms */
						_n( '%d term added', '%d terms added', created, 'storeengine' ),
						created
					),
					isShow: true,
					type: 'success',
				} )
			);
			onAdded?.( res?.created || [] );
			onDone?.();
		} catch ( e ) {
			dispatch(
				showNotification( {
					message: e?.response?.data?.message ?? e?.message,
					isShow: true,
					type: 'error',
				} )
			);
			setBusy( false );
		}
	};

	return (
		<div className="storeengine-quick-terms">
			<div className="storeengine-quick-terms__head">
				<strong>{ __( 'Quick add', 'storeengine' ) }</strong>
				<span>{ __( 'Pick a preset and add many terms at once.', 'storeengine' ) }</span>
			</div>

			<div className="storeengine-quick-terms__tabs" role="tablist">
				{ presets.map( ( p ) => (
					<button
						type="button"
						role="tab"
						key={ p.id }
						aria-selected={ p.id === presetId }
						className={ `storeengine-quick-terms__tab${ p.id === presetId ? ' is-active' : '' }` }
						onClick={ () => switchPreset( p.id ) }
					>
						{ p.label }
					</button>
				) ) }
			</div>

			<div className="storeengine-quick-terms__chips">
				{ preset.terms.map( ( term ) => {
					const added = isAdded( term );
					const on = selected.includes( term.name );
					return (
						<button
							type="button"
							key={ term.name }
							disabled={ added || busy }
							aria-pressed={ on }
							title={ added ? __( 'Already added', 'storeengine' ) : undefined }
							className={ `storeengine-quick-terms__chip${ on ? ' is-selected' : '' }${ added ? ' is-added' : '' }` }
							onClick={ () => toggle( term.name ) }
						>
							{ useSwatch && (
								<span className="storeengine-quick-terms__dot" style={ { background: term.color } } />
							) }
							{ term.name }
						</button>
					);
				} ) }
			</div>

			<div className="storeengine-quick-terms__actions">
				<button
					type="button"
					className="storeengine-quick-terms__link"
					disabled={ busy || ! available.length }
					onClick={ () => setSelected( available.map( ( t ) => t.name ) ) }
				>
					{ __( 'Select all', 'storeengine' ) }
				</button>
				<button
					type="button"
					className="storeengine-quick-terms__link"
					disabled={ busy || ! selected.length }
					onClick={ () => setSelected( [] ) }
				>
					{ __( 'Clear', 'storeengine' ) }
				</button>
				<button
					type="button"
					className="storeengine-quick-terms__add"
					disabled={ busy || ! selected.length }
					onClick={ add }
				>
					{ busy
						? __( 'Adding…', 'storeengine' )
						: sprintf(
								/* translators: %d: number of selected terms */
								_n( 'Add %d term', 'Add %d terms', selected.length, 'storeengine' ),
								selected.length
						  ) }
				</button>
			</div>
			{ 'color' !== attributeType && 'colors' === presetId && (
				<p className="storeengine-quick-terms__hint">
					{ __( 'This attribute is not a Color type, so the terms are added as names only (no swatch).', 'storeengine' ) }
				</p>
			) }
		</div>
	);
};

export default QuickAddTerms;
