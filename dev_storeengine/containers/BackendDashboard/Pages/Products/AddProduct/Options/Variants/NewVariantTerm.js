import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { generateSlug, makeRequest2 } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { getAttributeTerm } from '@Redux/Slices/attributesSlice/term';
import QuickAddTerms from '../../../../Attributes/AttributeTerms/AttributeTermModal/QuickAddTerms';

/**
 * Same shape the variants editor uses for fetched terms.
 *
 * @param {Object} term Term as returned by the attribute term endpoints.
 */
export const toTermOption = ( term ) => ( {
	slug: term?.slug,
	id: term?.term_id,
	label: term?.name,
	color: term?.color || '',
	image: term?.image || '',
} );

/**
 * "Create new value" inside the variants editor: add a term to the attribute
 * (single value, or several from the quick-add presets) without leaving the
 * product. New terms are handed back through `onCreated` so the caller can
 * list them and tick them for this product straight away.
 */
const NewVariantTerm = ( { attributeId, attributeType, onCreated } ) => {
	const dispatch = useDispatch();
	const [ open, setOpen ] = useState( false );
	const [ name, setName ] = useState( '' );
	const [ color, setColor ] = useState( '#000000' );
	const [ showPresets, setShowPresets ] = useState( false );
	const [ busy, setBusy ] = useState( false );

	const reset = () => {
		setName( '' );
		setShowPresets( false );
		setOpen( false );
	};

	const create = async () => {
		const label = name.trim();
		if ( ! label || busy ) {
			return;
		}
		setBusy( true );
		try {
			const term = await makeRequest2( 'create_product_attribute_term', {
				attribute_id: attributeId,
				name: label,
				slug: generateSlug( label ),
				...( 'color' === attributeType ? { color } : {} ),
			} );
			// Keep the store's term cache (Attributes page) in step.
			dispatch( getAttributeTerm( attributeId ) );
			onCreated( [ term ] );
			reset();
		} catch ( e ) {
			dispatch(
				showNotification( {
					message: e?.response?.data?.message ?? e?.message,
					isShow: true,
					type: 'error',
				} )
			);
		}
		setBusy( false );
	};

	if ( ! open ) {
		return (
			<button
				type="button"
				className="storeengine-variants-edit__new-term-link"
				onClick={ () => setOpen( true ) }
			>
				+ { __( 'Create new value', 'storeengine' ) }
			</button>
		);
	}

	return (
		<div className="storeengine-variants-edit__new-term">
			<div className="storeengine-variants-edit__new-term-row">
				<input
					type="text"
					className="storeengine-input"
					placeholder={ __( 'New value, e.g. Medium', 'storeengine' ) }
					value={ name }
					autoFocus
					onChange={ ( e ) => setName( e.target.value ) }
					onKeyDown={ ( e ) => {
						if ( 'Enter' === e.key ) {
							e.preventDefault();
							create();
						}
					} }
				/>
				{ 'color' === attributeType && (
					<input
						type="color"
						className="storeengine-variants-edit__new-term-color"
						value={ color }
						aria-label={ __( 'Color', 'storeengine' ) }
						onChange={ ( e ) => setColor( e.target.value ) }
					/>
				) }
				<button
					type="button"
					className="storeengine-variants-edit__new-term-btn is-primary"
					disabled={ busy || ! name.trim() }
					onClick={ create }
				>
					{ busy ? __( 'Adding…', 'storeengine' ) : __( 'Add', 'storeengine' ) }
				</button>
				<button type="button" className="storeengine-variants-edit__new-term-btn" onClick={ reset }>
					{ __( 'Cancel', 'storeengine' ) }
				</button>
			</div>

			<button
				type="button"
				className="storeengine-variants-edit__new-term-link"
				onClick={ () => setShowPresets( ( v ) => ! v ) }
			>
				{ showPresets
					? __( 'Hide presets', 'storeengine' )
					: __( 'Or add several from presets (colors, sizes…)', 'storeengine' ) }
			</button>

			{ showPresets && (
				<QuickAddTerms
					attributeId={ attributeId }
					attributeType={ attributeType }
					onAdded={ onCreated }
					onDone={ reset }
				/>
			) }
		</div>
	);
};

export default NewVariantTerm;
