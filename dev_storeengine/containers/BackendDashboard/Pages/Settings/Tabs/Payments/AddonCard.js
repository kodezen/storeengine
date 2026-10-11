import React from 'react';
import { Field } from 'formik';
import { useNavigate } from 'react-router-dom';
import { is_pro } from '@Utils/helper';
import SwitchControl from '@Components/Formik/Checkbox/SwitchControl';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { saveAddon } from '@Redux/Slices/addonSlice/addonSlice';
import { fetchSettings } from '@Redux/Slices/settingsSlice/settingsSlice';

const LockIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
		<path d="M7 11V7a5 5 0 0 1 10 0v4" />
	</svg>
);

const ExternalLinkIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="12"
		height="12"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		<polyline points="15 3 21 3 21 9" />
		<line x1="10" y1="14" x2="21" y2="3" />
	</svg>
);

const AddonCard = ( { item, value, setFieldValue } ) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const isLocked = ! is_pro && item.is_pro;
	const isDisabled = item.required_plugin?.length;

	// Settings shortcut — only for an active, unlocked gateway that actually has
	// a settings screen to jump to. Revealed on card hover (see styles.scss).
	const showSettings = !! value && !! item.url && ! isLocked && ! isDisabled;

	const openSettings = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		if ( item.url ) {
			navigate( item.url );
		}
	};

	const onChangeHandler = async () => {
		if ( isLocked || isDisabled ) {
			return;
		}

		const status = ! value;

		await dispatch(
			saveAddon( {
				addon_name: item.label,
				addon_slug: item.name,
				status,
				required_plugin: item.required_plugin,
			} )
		);

		setFieldValue( item.name, status );
		await dispatch( fetchSettings() );
	};

	return (
		<div
			className={ `storeengine-settings-addon-card ${
				isLocked ? 'locked' : ''
			}` }
		>
			{ /* Absolute toggle / lock icon */ }
			<div className="storeengine-settings-addon-card__control">
				{ showSettings && (
					<button
						type="button"
						className="storeengine-settings-addon-card__settings"
						onClick={ openSettings }
						aria-label={ sprintf(
							// translators: %s: gateway name
							__( '%s settings', 'storeengine' ),
							item.label
						) }
						title={ __( 'Settings', 'storeengine' ) }
					>
						<span
							className="storeengine-icon storeengine-icon--settings"
							aria-hidden={ true }
						></span>
					</button>
				) }
				{ isLocked ? (
					<span className="storeengine-settings-addon-card__lock">
						<LockIcon />
					</span>
				) : ! isDisabled ? (
					<Field
						type="checkbox"
						name={ item.name }
						component={ SwitchControl }
						onChange={ onChangeHandler }
					/>
				) : null }
			</div>

			{ /* HEADER: icon + title stacked */ }
			<div className="storeengine-settings-addon-card__header">
				<div
					className="storeengine-settings-addon-card__icon"
					style={ { color: item?.color } }
				>
					{ item.svgIcon ? (
						<img src={ item.svgIcon } alt={ item.label } />
					) : (
						<span
							className={ `storeengine-icon storeengine-icon--${ item.icon }` }
						/>
					) }
				</div>

				<div className="storeengine-settings-addon-card__title">
					{ item.label }
					{ item.docsUrl && (
						<a
							href={ item.docsUrl }
							target="_blank"
							rel="noopener noreferrer"
							className="storeengine-settings-addon-card__docs-link"
							aria-label={ item.label }
						>
							<ExternalLinkIcon />
						</a>
					) }
				</div>
			</div>

			{ /* BODY */ }
			<div className="storeengine-settings-addon-card__body">
				<p>{ item.details }</p>
			</div>

			{ /* Required plugin notice */ }
			{ isDisabled && (
				<div className="storeengine-settings-addon-card__footer">
					<div className="storeengine-settings-addon-card__required">
						{ __( 'Required Plugin', 'storeengine' ) }
					</div>
				</div>
			) }
		</div>
	);
};

export default AddonCard;
