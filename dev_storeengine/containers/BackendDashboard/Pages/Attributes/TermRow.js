import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { SortableHandle } from 'react-sortable-hoc';
import { Button } from '@Components/ui';
import { generateSlug, runUploader } from '@Utils/helper';

export const DragHandle = SortableHandle( () => (
	<span
		className="storeengine-attr-term__handle"
		title={ __( 'Drag to reorder', 'storeengine' ) }
		aria-hidden="true"
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
			<circle cx="9" cy="6" r="1.6" />
			<circle cx="15" cy="6" r="1.6" />
			<circle cx="9" cy="12" r="1.6" />
			<circle cx="15" cy="12" r="1.6" />
			<circle cx="9" cy="18" r="1.6" />
			<circle cx="15" cy="18" r="1.6" />
		</svg>
	</span>
) );

/**
 * Colour dot / image thumb for a term (empty outline when not set yet).
 *
 * @param {Object} props
 * @param {string} props.type  Attribute type.
 * @param {Object} props.term  Term.
 * @param {string} props.color Override colour (while editing).
 * @param {string} props.image Override image (while editing).
 */
export const Swatch = ( { type, term, color, image } ) => {
	if ( 'image' === type ) {
		const src = image ?? term?.image;
		return src ? (
			<img
				src={ src }
				alt=""
				className="storeengine-attr-term__swatch is-image"
			/>
		) : (
			<span className="storeengine-attr-term__swatch is-empty" />
		);
	}
	const c = color ?? term?.color;
	return (
		<span
			className={ `storeengine-attr-term__swatch${
				c ? '' : ' is-empty'
			}` }
			style={ c ? { backgroundColor: c } : undefined }
		/>
	);
};

/**
 * One term: a compact row, or an inline editor when `editing`.
 *
 * @param {Object}   props
 * @param {Object}   props.term     Term.
 * @param {string}   props.type     Attribute type (select|color|image).
 * @param {boolean}  props.sortable Show the drag handle.
 * @param {boolean}  props.editing  Render the editor.
 * @param {Function} props.onEdit   Open the editor.
 * @param {Function} props.onCancel Close the editor.
 * @param {Function} props.onSave   Save ( values ) => Promise<boolean>.
 * @param {Function} props.onDelete Delete () => Promise.
 */
const TermRow = ( {
	term,
	type,
	sortable,
	editing,
	onEdit,
	onCancel,
	onSave,
	onDelete,
} ) => {
	const [ draft, setDraft ] = useState( null );
	const [ saving, setSaving ] = useState( false );
	const [ deleting, setDeleting ] = useState( false );
	const hasSwatch = 'color' === type || 'image' === type;

	const values = draft || {
		name: term.name || '',
		slug: term.slug || '',
		description: term.description || '',
		color: term.color || '',
		image_id: term.image_id || 0,
		image: term.image || '',
	};
	const set = ( patch ) => setDraft( { ...values, ...patch } );

	const close = () => {
		setDraft( null );
		onCancel();
	};

	const save = async ( e ) => {
		e?.preventDefault();
		if ( ! values.name.trim() ) {
			return;
		}
		setSaving( true );
		const ok = await onSave( {
			...values,
			name: values.name.trim(),
			slug: generateSlug( values.slug || values.name ),
		} );
		setSaving( false );
		if ( ok ) {
			setDraft( null );
		}
	};

	const pickImage = () =>
		runUploader().then( ( media ) =>
			set( {
				image_id: media?.id || 0,
				image: media?.sizes?.thumbnail?.url || media?.url || '',
			} )
		);

	if ( editing ) {
		return (
			<li className="storeengine-attr-term is-editing">
				<form
					className="storeengine-attr-term__editor"
					onSubmit={ save }
					onKeyDown={ ( e ) => 'Escape' === e.key && close() }
				>
					<div className="storeengine-attr-term__editor-grid">
						<label>
							<span>{ __( 'Name', 'storeengine' ) }</span>
							<input
								type="text"
								autoFocus
								value={ values.name }
								onChange={ ( e ) =>
									set( { name: e.target.value } )
								}
							/>
						</label>
						<label>
							<span>{ __( 'Slug', 'storeengine' ) }</span>
							<input
								type="text"
								value={ values.slug }
								onChange={ ( e ) =>
									set( { slug: e.target.value } )
								}
							/>
						</label>
						{ 'color' === type && (
							<label>
								<span>{ __( 'Color', 'storeengine' ) }</span>
								<span className="storeengine-attr-term__color">
									<input
										type="color"
										value={ values.color || '#000000' }
										onChange={ ( e ) =>
											set( { color: e.target.value } )
										}
										aria-label={ __(
											'Pick color',
											'storeengine'
										) }
									/>
									<input
										type="text"
										value={ values.color }
										placeholder="#RRGGBB"
										onChange={ ( e ) =>
											set( { color: e.target.value } )
										}
									/>
								</span>
							</label>
						) }
						{ 'image' === type && (
							<div className="storeengine-attr-term__image-field">
								<span>{ __( 'Image', 'storeengine' ) }</span>
								<span className="storeengine-attr-term__image-row">
									<Swatch
										type="image"
										term={ term }
										image={ values.image }
									/>
									<Button
										preset="outline"
										size="xs"
										onClick={ pickImage }
									>
										{ values.image
											? __( 'Change', 'storeengine' )
											: __( 'Upload', 'storeengine' ) }
									</Button>
									{ values.image && (
										<Button
											preset="link"
											size="xs"
											onClick={ () =>
												set( {
													image_id: 0,
													image: '',
												} )
											}
										>
											{ __( 'Remove', 'storeengine' ) }
										</Button>
									) }
								</span>
							</div>
						) }
						<label className="is-wide">
							<span>{ __( 'Description', 'storeengine' ) }</span>
							<textarea
								rows={ 2 }
								value={ values.description }
								onChange={ ( e ) =>
									set( { description: e.target.value } )
								}
							/>
						</label>
					</div>
					<div className="storeengine-attr-term__editor-actions">
						<Button preset="ghost" size="sm" onClick={ close }>
							{ __( 'Cancel', 'storeengine' ) }
						</Button>
						<Button
							type="submit"
							preset="primary"
							size="sm"
							isLoading={ saving }
						>
							{ __( 'Save', 'storeengine' ) }
						</Button>
					</div>
				</form>
			</li>
		);
	}

	return (
		<li className="storeengine-attr-term">
			{ sortable && <DragHandle /> }
			{ hasSwatch && <Swatch type={ type } term={ term } /> }
			<button
				type="button"
				className="storeengine-attr-term__main"
				onClick={ onEdit }
				title={ __( 'Edit term', 'storeengine' ) }
			>
				<span className="storeengine-attr-term__name">
					{ term.name }
				</span>
				<span className="storeengine-attr-term__slug">
					{ term.slug }
				</span>
				{ term.description && (
					<span className="storeengine-attr-term__desc">
						{ term.description }
					</span>
				) }
			</button>

			<span className="storeengine-attr-term__actions">
				<Button
					preset="ghost"
					size="xs"
					icon="storeengine-icon--edit"
					aria-label={ __( 'Edit term', 'storeengine' ) }
					title={ __( 'Edit', 'storeengine' ) }
					onClick={ onEdit }
				/>
				{ /* Unused terms go straight away; in-use ones open the impact modal. */ }
				<Button
					preset="ghost"
					size="xs"
					icon="storeengine-icon--trash"
					className="hover:text-se-error"
					aria-label={ __( 'Delete term', 'storeengine' ) }
					title={ __( 'Delete', 'storeengine' ) }
					isLoading={ deleting }
					disabled={ deleting }
					onClick={ async () => {
						setDeleting( true );
						try {
							await onDelete();
						} finally {
							setDeleting( false );
						}
					} }
				/>
			</span>
		</li>
	);
};

TermRow.propTypes = {
	term: PropTypes.object.isRequired,
	type: PropTypes.string,
	sortable: PropTypes.bool,
	editing: PropTypes.bool,
	onEdit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
	onSave: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

export default TermRow;
