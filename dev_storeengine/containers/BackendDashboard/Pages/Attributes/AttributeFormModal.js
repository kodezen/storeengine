import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import Modal from '@Components/Modal';
import { Scope, Field, Input, Select, Switch, Button } from '@Components/ui';
import { generateSlug } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import {
	createNewAttribute,
	updateAttribute,
} from '@Redux/Slices/attributesSlice/attributesSlice';

export const ORDERBY_OPTIONS = [
	{ value: 'custom-ordering', label: __( 'Custom ordering', 'storeengine' ) },
	{ value: 'name', label: __( 'Name', 'storeengine' ) },
	{ value: 'numeric-name', label: __( 'Name (numeric)', 'storeengine' ) },
	{ value: 'term_id', label: __( 'Term ID', 'storeengine' ) },
];

export const TYPE_OPTIONS = [
	{ value: 'select', label: __( 'Select (dropdown)', 'storeengine' ) },
	{ value: 'color', label: __( 'Color', 'storeengine' ) },
	{ value: 'image', label: __( 'Image', 'storeengine' ) },
];

export const truthy = ( v ) =>
	v === true || v === 1 || v === '1' || v === 'yes' || v === 'on';

const BLANK = {
	attribute_label: '',
	attribute_name: '',
	attribute_type: 'select',
	attribute_orderby: 'custom-ordering',
	attribute_public: false,
};

/**
 * Create / edit an attribute. Terms are managed in the page's right pane,
 * so this only holds the attribute's own settings.
 *
 * @param {Object}      props
 * @param {boolean}     props.open    Whether the modal is open.
 * @param {Object|null} props.editing Attribute row to edit, or null to create.
 * @param {Function}    props.onClose Close without saving.
 * @param {Function}    props.onSaved Called with the saved attribute row.
 */
const AttributeFormModal = ( { open, editing, onClose, onSaved } ) => {
	const dispatch = useDispatch();
	const [ form, setForm ] = useState( BLANK );
	const [ slugEdited, setSlugEdited ] = useState( false );
	const [ saving, setSaving ] = useState( false );
	const isEdit = !! editing?.attribute_id;

	useEffect( () => {
		if ( ! open ) {
			return;
		}
		if ( isEdit ) {
			setForm( {
				attribute_label: editing.attribute_label || '',
				attribute_name: editing.attribute_name || '',
				attribute_type: editing.attribute_type || 'select',
				attribute_orderby:
					editing.attribute_orderby || 'custom-ordering',
				attribute_public: truthy( editing.attribute_public ),
			} );
			setSlugEdited( true );
		} else {
			setForm( BLANK );
			setSlugEdited( false );
		}
	}, [ open, editing ] );

	const set = ( key, value ) =>
		setForm( ( prev ) => ( { ...prev, [ key ]: value } ) );

	const onNameChange = ( value ) =>
		setForm( ( prev ) => ( {
			...prev,
			attribute_label: value,
			attribute_name: slugEdited
				? prev.attribute_name
				: generateSlug( value ),
		} ) );

	const submit = async ( e ) => {
		e?.preventDefault();
		if ( ! form.attribute_label.trim() ) {
			dispatch(
				showNotification( {
					message: __( 'Name is required.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			return;
		}

		const values = {
			...form,
			attribute_label: form.attribute_label.trim(),
			attribute_name: (
				form.attribute_name || generateSlug( form.attribute_label )
			).trim(),
		};

		setSaving( true );
		const res = await dispatch(
			isEdit
				? updateAttribute( {
						...values,
						attribute_id: editing.attribute_id,
				  } )
				: createNewAttribute( values )
		);
		setSaving( false );

		// The thunks report their own errors and resolve with no payload.
		if ( ! res?.payload ) {
			return;
		}
		if ( ! isEdit ) {
			dispatch(
				showNotification( {
					message: __( 'Attribute created.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
		}
		onSaved( res.payload );
	};

	return (
		<Modal
			open={ open }
			size="sm"
			title={
				isEdit
					? __( 'Edit attribute', 'storeengine' )
					: __( 'New attribute', 'storeengine' )
			}
			onClose={ onClose }
			closeAriaLabel={ __( 'Close', 'storeengine' ) }
			className="storeengine-attr-form-modal"
		>
			<Scope>
				<form
					onSubmit={ submit }
					className="flex flex-col gap-4 px-5 pt-4 pb-5"
				>
					<div className="grid grid-cols-2 gap-3">
						<Field
							label={ __( 'Name', 'storeengine' ) }
							htmlFor="se-attr-name"
						>
							<Input
								id="se-attr-name"
								type="text"
								autoComplete="off"
								data-1p-ignore="true"
								data-lpignore="true"
								autoFocus
								value={ form.attribute_label }
								onChange={ ( e ) =>
									onNameChange( e.target.value )
								}
								placeholder={ __( 'e.g. Size', 'storeengine' ) }
							/>
						</Field>
						<Field
							label={ __( 'Slug', 'storeengine' ) }
							htmlFor="se-attr-slug"
						>
							<Input
								id="se-attr-slug"
								type="text"
								autoComplete="off"
								data-1p-ignore="true"
								data-lpignore="true"
								value={ form.attribute_name }
								onChange={ ( e ) => {
									setSlugEdited( true );
									set( 'attribute_name', e.target.value );
								} }
								placeholder={ __( 'e.g. size', 'storeengine' ) }
							/>
						</Field>
					</div>

					<Field
						label={ __( 'Type', 'storeengine' ) }
						htmlFor="se-attr-type"
					>
						<div
							className="grid grid-cols-3 gap-2"
							role="radiogroup"
							id="se-attr-type"
						>
							{ TYPE_OPTIONS.map( ( o ) => {
								const on = form.attribute_type === o.value;
								return (
									<button
										key={ o.value }
										type="button"
										role="radio"
										aria-checked={ on }
										onClick={ () =>
											set( 'attribute_type', o.value )
										}
										className={ `storeengine-attr-type-option${
											on ? ' is-active' : ''
										}` }
									>
										<TypeGlyph type={ o.value } />
										<span>
											{ 'select' === o.value
												? __( 'Label', 'storeengine' )
												: o.label }
										</span>
									</button>
								);
							} ) }
						</div>
						<span className="block text-xs text-se-subtitle leading-snug mt-1.5">
							{ __(
								'Color and Image let each term carry a swatch shown on the product page.',
								'storeengine'
							) }
						</span>
					</Field>

					<Field
						label={ __( 'Default sort order', 'storeengine' ) }
						htmlFor="se-attr-orderby"
					>
						<Select
							id="se-attr-orderby"
							value={ form.attribute_orderby }
							onChange={ ( val ) =>
								set( 'attribute_orderby', val )
							}
						>
							{ ORDERBY_OPTIONS.map( ( o ) => (
								<option key={ o.value } value={ o.value }>
									{ o.label }
								</option>
							) ) }
						</Select>
					</Field>

					<div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-se border border-solid border-se-border">
						<span>
							<span className="block text-sm font-medium text-se-text">
								{ __( 'Enable archives', 'storeengine' ) }
							</span>
							<span className="block text-xs text-se-subtitle leading-snug">
								{ __(
									'Give this attribute its own product archive pages.',
									'storeengine'
								) }
							</span>
						</span>
						<Switch
							checked={ form.attribute_public }
							onChange={ ( v ) => set( 'attribute_public', v ) }
							aria-label={ __(
								'Enable archives',
								'storeengine'
							) }
						/>
					</div>

					<div className="flex items-center justify-end gap-2 pt-4 border-0 border-t border-solid border-se-border">
						<Button preset="outline" onClick={ onClose }>
							{ __( 'Cancel', 'storeengine' ) }
						</Button>
						<Button
							type="submit"
							preset="primary"
							isLoading={ saving }
						>
							{ isEdit
								? __( 'Save changes', 'storeengine' )
								: __( 'Create attribute', 'storeengine' ) }
						</Button>
					</div>
				</form>
			</Scope>
		</Modal>
	);
};

/**
 * Small glyph per attribute type (sidebar rows + type picker).
 *
 * @param {Object} props
 * @param {string} props.type 'select' | 'color' | 'image'.
 */
export const TypeGlyph = ( { type } ) => {
	const common = {
		width: 16,
		height: 16,
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 2,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		'aria-hidden': true,
		focusable: false,
	};
	if ( 'color' === type ) {
		return (
			<svg { ...common }>
				<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 22Z" />
				<circle cx="7.5" cy="11" r="1" />
				<circle cx="10.5" cy="7" r="1" />
				<circle cx="15.5" cy="7.5" r="1" />
			</svg>
		);
	}
	if ( 'image' === type ) {
		return (
			<svg { ...common }>
				<rect x="3" y="3" width="18" height="18" rx="2.5" />
				<circle cx="9" cy="9" r="1.8" />
				<path d="m21 15-4.5-4.5L6 21" />
			</svg>
		);
	}
	return (
		<svg { ...common }>
			<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z" />
			<circle cx="7" cy="7" r="1.5" />
		</svg>
	);
};

AttributeFormModal.propTypes = {
	open: PropTypes.bool.isRequired,
	editing: PropTypes.object,
	onClose: PropTypes.func.isRequired,
	onSaved: PropTypes.func.isRequired,
};

export default AttributeFormModal;
