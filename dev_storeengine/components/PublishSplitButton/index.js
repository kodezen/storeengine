import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { DateTimePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './styles.scss';

export const PUBLISH_STATUS_OPTIONS = [
	{
		label: __( 'Publish', 'storeengine' ),
		value: 'publish',
		description: __( 'Visible to everyone', 'storeengine' ),
		color: 'success',
	},
	{
		label: __( 'Draft', 'storeengine' ),
		value: 'draft',
		description: __( 'Not published yet', 'storeengine' ),
		color: 'warning',
	},
	{
		label: __( 'Scheduled', 'storeengine' ),
		value: 'future',
		description: __( 'Publish on a set date', 'storeengine' ),
		color: 'primary',
	},
];

/**
 * Primary label for the chosen status (mirrors Academy's getStatusActionLabel):
 * the button always says what clicking it will do.
 */
export const getStatusActionLabel = ( status, isEditingPublished = false ) => {
	switch ( status ) {
		case 'publish':
			return isEditingPublished
				? __( 'Update', 'storeengine' )
				: __( 'Publish', 'storeengine' );
		case 'future':
			return __( 'Schedule', 'storeengine' );
		case 'draft':
		default:
			return __( 'Save Draft', 'storeengine' );
	}
};

/**
 * Connected split-button: a solid primary action fused with a caret that opens
 * the status menu (Publish / Draft / Scheduled). Picking a status only
 * stages it (`onStatusChange`); the primary button is what saves it. Same
 * structure and behavior as the Academy course editor's StatusSelect.
 */
const PublishSplitButton = ( {
	label,
	value = 'draft',
	date,
	onStatusChange,
	onDateChange,
	onSave,
	isSaving = false,
	isMuted = false,
	statusOptions = PUBLISH_STATUS_OPTIONS,
	disabledOptionValues = [],
	disabledOptionReason,
} ) => {
	const containerRef = useRef( null );
	const toggleRef = useRef( null );
	const [ isOpen, setIsOpen ] = useState( false );
	// `top` OR `bottom` is set (never both) so the menu flips above the caret
	// when it sits near the bottom of the viewport.
	const [ pos, setPos ] = useState( { right: 0 } );

	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		const onDown = ( e ) => {
			// The WP DateTimePicker renders no portal, but guard anyway.
			if (
				containerRef.current &&
				! containerRef.current.contains( e.target ) &&
				! e.target.closest?.( '.storeengine-status-menu' )
			) {
				setIsOpen( false );
			}
		};
		document.addEventListener( 'mousedown', onDown );
		return () => document.removeEventListener( 'mousedown', onDown );
	}, [ isOpen ] );

	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		const update = () => {
			const rect = toggleRef.current?.getBoundingClientRect();
			if ( ! rect ) {
				return;
			}
			const right = document.documentElement.clientWidth - rect.right;
			if ( window.innerHeight - rect.bottom < 320 ) {
				setPos( { bottom: window.innerHeight - rect.top + 8, right } );
			} else {
				setPos( { top: rect.bottom + 8, right } );
			}
		};
		update();
		window.addEventListener( 'resize', update );
		window.addEventListener( 'scroll', update, true );
		return () => {
			window.removeEventListener( 'resize', update );
			window.removeEventListener( 'scroll', update, true );
		};
	}, [ isOpen ] );

	const select = ( optionValue ) => {
		if ( disabledOptionValues.includes( optionValue ) ) {
			return;
		}
		onStatusChange( optionValue );
		// Scheduling needs the panel to stay open for the date picker.
		if ( optionValue !== 'future' ) {
			setIsOpen( false );
		}
	};

	const selectedColor =
		statusOptions.find( ( o ) => o.value === value )?.color || 'gray';

	return (
		<div
			ref={ containerRef }
			className={ `storeengine-status-split${
				isMuted ? ' storeengine-status-split--muted' : ''
			}` }
		>
			<button
				type="button"
				className="storeengine-status-split__primary"
				disabled={ isSaving }
				onClick={ () => {
					setIsOpen( false );
					onSave();
				} }
			>
				{ isSaving ? __( 'Saving…', 'storeengine' ) : label }
			</button>
			<button
				type="button"
				ref={ toggleRef }
				className={ `storeengine-status-split__caret storeengine-status-split__caret--${ selectedColor }${
					isMuted ? ' storeengine-status-split__caret--muted' : ''
				}${ isOpen ? ' storeengine-status-split__caret--open' : '' }` }
				onClick={ () => setIsOpen( ( open ) => ! open ) }
				disabled={ isSaving }
				aria-haspopup="menu"
				aria-expanded={ isOpen }
				aria-label={ __( 'More save options', 'storeengine' ) }
			>
				<span
					className="storeengine-icon storeengine-icon--arrow-down"
					aria-hidden="true"
				/>
			</button>

			{ isOpen && (
				<div
					className="storeengine-status-menu"
					style={ {
						top: pos.top,
						bottom: pos.bottom,
						right: pos.right,
					} }
				>
					<div
						className="storeengine-status-menu__list"
						role="radiogroup"
						aria-label={ __( 'Status', 'storeengine' ) }
					>
						{ statusOptions.map(
							( {
								value: optionValue,
								label: optionLabel,
								description,
								color,
							} ) => {
								const disabled =
									disabledOptionValues.includes( optionValue );
								const selected = optionValue === value;
								return (
									<button
										key={ optionValue }
										type="button"
										role="radio"
										aria-checked={ selected }
										disabled={ disabled }
										title={
											disabled
												? disabledOptionReason
												: undefined
										}
										className={ `storeengine-status-menu__option storeengine-status-menu__option--${
											color || 'gray'
										}${ selected ? ' is-selected' : '' }` }
										onClick={ () => select( optionValue ) }
									>
										<span className="storeengine-status-menu__text">
											<span className="storeengine-status-menu__name">
												{ optionLabel }
											</span>
											{ description && (
												<span className="storeengine-status-menu__desc">
													{ description }
												</span>
											) }
										</span>
									</button>
								);
							}
						) }
					</div>

					{ value === 'future' && (
						<div className="storeengine-status-menu__section storeengine-status-menu__schedule">
							<span className="storeengine-status-menu__heading">
								{ __( 'Publish on', 'storeengine' ) }
							</span>
							<DateTimePicker
								currentDate={ date || undefined }
								onChange={ onDateChange }
								is12Hour={ true }
							/>
						</div>
					) }
				</div>
			) }
		</div>
	);
};

PublishSplitButton.propTypes = {
	label: PropTypes.string.isRequired,
	value: PropTypes.string,
	date: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ),
	onStatusChange: PropTypes.func.isRequired,
	onDateChange: PropTypes.func.isRequired,
	onSave: PropTypes.func.isRequired,
	isSaving: PropTypes.bool,
	isMuted: PropTypes.bool,
	statusOptions: PropTypes.array,
	disabledOptionValues: PropTypes.array,
	disabledOptionReason: PropTypes.string,
};

export default PublishSplitButton;
