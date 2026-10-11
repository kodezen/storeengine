import React from 'react';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import useVariantsView, { useAttributesEditor } from './useVariantsView';
import ViewModeIcon from './ViewModeIcon';
import './styles.scss';

/**
 * Inline | Side panel switch shown next to the "Variants" heading, plus the
 * gear that opens the attribute editor (change sizes/colours, add variants).
 */
const VariantsViewToggle = () => {
	const { mode, setMode } = useVariantsView();
	const { open: editorOpen, setOpen: setEditorOpen } = useAttributesEditor();

	return (
		<div className="storeengine-variants__view-bar">
			<div
				className="storeengine-variants__view-toggle"
				role="group"
				aria-label={ __( 'Variants view', 'storeengine' ) }
			>
				<button
					type="button"
					aria-pressed={ 'inline' === mode }
					className={ classNames( 'storeengine-variants__view-btn', {
						'is-active': 'inline' === mode,
					} ) }
					onClick={ () => setMode( 'inline' ) }
				>
					<ViewModeIcon mode="inline" />
					{ __( 'Inline', 'storeengine' ) }
				</button>
				<button
					type="button"
					aria-pressed={ 'panel' === mode }
					className={ classNames( 'storeengine-variants__view-btn', {
						'is-active': 'panel' === mode,
					} ) }
					onClick={ () => setMode( 'panel' ) }
				>
					<ViewModeIcon mode="panel" />
					{ __( 'Side panel', 'storeengine' ) }
				</button>
			</div>
			<button
				type="button"
				className={ classNames( 'storeengine-variants__settings-btn', {
					'is-active': editorOpen,
				} ) }
				aria-pressed={ editorOpen }
				aria-label={ __( 'Manage attributes', 'storeengine' ) }
				title={ __( 'Manage attributes', 'storeengine' ) }
				onClick={ () => setEditorOpen( ! editorOpen ) }
			>
				<span
					className="storeengine-icon storeengine-icon--settings"
					aria-hidden={ true }
				/>
			</button>
		</div>
	);
};

export default VariantsViewToggle;
