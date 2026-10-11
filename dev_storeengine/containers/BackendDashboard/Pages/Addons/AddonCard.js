import React from 'react';
import { Field } from 'formik';
import { useNavigate } from 'react-router-dom';
import { is_pro } from '@Utils/helper';
import SwitchControl from '@Components/Formik/Checkbox/SwitchControl';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { saveAddon } from '@Redux/Slices/addonSlice/addonSlice';
import { fetchAdminMenuItems } from '@Redux/Slices/menuSlice/menuSlice';
import { fetchSettings } from '@Redux/Slices/settingsSlice/settingsSlice';
import { getStoreEnginePages } from '@Redux/Slices/toolsSlice/toolsSlice';
import { addonList } from './utils';

const AddonCard = ( { item, index, value, setFieldValue, values } ) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const isShowProTag = ! is_pro && item.is_pro;

	// Show a settings shortcut only once the addon is active and it actually has
	// a settings/management screen to jump to (a few cards, e.g. Advanced
	// Coupons, ship no `url`). `item.url` is a full admin.php?page=… route, so
	// react-router navigates to the right screen client-side.
	const showSettings = !! value && !! item.url && ! isShowProTag;

	const openSettings = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		if ( item.url ) {
			navigate( item.url );
		}
	};

	// `requires_addon` may be a single slug (string) or several (array).
	const toArray = ( v ) => ( Array.isArray( v ) ? v : v ? [ v ] : [] );
	const labelForSlug = ( slug ) =>
		addonList.find( ( a ) => a.name === slug )?.label || slug;

	const requiredAddons = toArray( item.requires_addon );
	const missingRequired = requiredAddons.filter(
		( slug ) => ! values?.[ slug ]
	);
	const isRequiredAddonMissing = missingRequired.length > 0;

	const deactivateDependents = async ( addonName ) => {
		const dependents = addonList.filter(
			( a ) =>
				toArray( a.requires_addon ).includes( addonName ) &&
				values?.[ a.name ]
		);

		for ( const dependent of dependents ) {
			const payload = {
				addon_name: dependent.label,
				addon_slug: dependent.name,
				status: false,
				required_plugin: dependent.required_plugin,
			};
			const { payload: response } = await dispatch( saveAddon( payload ) );
			if ( response ) {
				setFieldValue( dependent.name, false );
				dispatch(
					showNotification( {
						message: sprintf(
							// translators: %1$s: AddonName, %2$s: AddonStatus
							__( '%1$s successfully %2$s', 'storeengine' ),
							dependent.label,
							__( 'Deactivated', 'storeengine' )
						),
						isShow: true,
						type: 'success',
					} )
				);
			}
		}
	};

	const onChangeHandler = async () => {
		if ( isShowProTag ) {
			return;
		}

		const status = ! value;
		try {
			const payload = {
				addon_name: item.label,
				addon_slug: item.name,
				status,
				required_plugin: item.required_plugin,
			};
			const { payload: response } = await dispatch( saveAddon( payload ) );
			if ( response ) {
				setFieldValue( item.name, status );
				const statusMessage = response[ item.name ]
					? __( 'Activated', 'storeengine' )
					: __( 'Deactivated', 'storeengine' );
				dispatch(
					showNotification( {
						message: sprintf(
							// translators: %1$s: AddonName, %2$s: AddonStatus
							__( '%1$s successfully %2$s', 'storeengine' ),
							item.label,
							statusMessage
						),
						isShow: true,
						type: 'success',
					} )
				);

				// If this addon was just deactivated, turn off any dependents.
				if ( ! status ) {
					await deactivateDependents( item.name );
				}

				await dispatch( fetchSettings() );
				await dispatch( fetchAdminMenuItems() );
				await dispatch( getStoreEnginePages() );
			}
		} catch ( e ) {
			setFieldValue( item.name, false );
			dispatch(
				showNotification( { message: e, isShow: true, type: 'error' } )
			);
		}
	};

	const hasRequiredPlugin =
		item.required_plugin && item.required_plugin.length;

	// Tooltip text shown when this card is disabled due to a missing required addon.
	const disabledTooltip = isRequiredAddonMissing
		? sprintf(
				// translators: %s: comma-separated required addon names
				__(
					'Activate these addons first: %s',
					'storeengine'
				),
				missingRequired.map( labelForSlug ).join( ', ' )
		  )
		: undefined;

	return (
		<div
			className={ `storeengine-addon-card ${
				isShowProTag ? 'storeengine-addon-card--locked' : ''
			} ${
				isRequiredAddonMissing ? 'storeengine-addon-card--disabled' : ''
			} ${ value ? 'storeengine-addon-card--active' : '' }` }
		>
			<div
				className="storeengine-addon-card__control"
				title={ disabledTooltip }
			>
				{ isShowProTag ? (
					<span className="storeengine-addon-card__lock">
						<span className="storeengine-icon storeengine-icon--lock"></span>
					</span>
				) : (
					<div className="storeengine-flex-row storeengine-flex-align-center storeengine-flex-gap-8">
						{ item?.beta === true && (
							<span className="storeengine-addon-card__beta">
								{ __( 'Beta', 'storeengine' ) }
							</span>
						) }
						{ showSettings && (
							<button
								type="button"
								className="storeengine-addon-card__settings"
								onClick={ openSettings }
								aria-label={ sprintf(
									// translators: %s: addon name
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
						<Field
							type="checkbox"
							name={ item.name }
							component={ SwitchControl }
							onChange={ onChangeHandler }
							disabled={ isRequiredAddonMissing && ! value }
						/>
					</div>
				) }
			</div>

			<div
				className="storeengine-addon-card__icon"
				style={ { color: item?.color } }
			>
				{ item.svgIcon ? (
					<img src={ item.svgIcon } alt={ item.label } />
				) : 'string' === typeof item.icon ? (
					<span
						className={ `storeengine-icon storeengine-icon--${ item.icon }` }
						aria-hidden={ true }
					/>
				) : (
					item.icon
				) }
			</div>

			<div className="storeengine-addon-card__title">
				{ item.label }
				{ item.docsUrl && (
					<a
						href={ item.docsUrl }
						target="_blank"
						rel="noopener noreferrer"
						className="storeengine-addon-card__ext-link"
						aria-label={ sprintf(
							// translators: %s: addon name
							__( '%s documentation', 'storeengine' ),
							item.label
						) }
					>
						<span className="storeengine-icon storeengine-icon--go-on"></span>
					</a>
				) }
				{ isShowProTag && (
					<span className="storeengine-addon-card__badge storeengine-addon-card__badge--pro">
						{ __( 'Pro', 'storeengine' ) }
					</span>
				) }
				{ item.is_recommended && (
					<span className="storeengine-addon-card__badge storeengine-addon-card__badge--recommended">
						{ __( 'Recommend', 'storeengine' ) }
					</span>
				) }
			</div>

			<p className="storeengine-addon-card__details">{ item.details }</p>

			{ ( hasRequiredPlugin || requiredAddons.length > 0 ) && (
				<div className="storeengine-addon-card__requirements">
					{ hasRequiredPlugin && (
						<div className="storeengine-addon-card__required-notice">
							<span className="storeengine-addon-card__required-label">
								<span
									className="storeengine-icon storeengine-icon--box storeengine-addon-card__required-icon"
									aria-hidden={ true }
								/>
								{ __( 'Required plugin', 'storeengine' ) }
							</span>
							<span className="storeengine-addon-card__required-list">
								{ item.required_plugin.map( ( p ) => (
									<span
										key={ p.plugin_name }
										className="storeengine-addon-card__req-pill"
									>
										{ p.plugin_name }
									</span>
								) ) }
							</span>
						</div>
					) }

					{ requiredAddons.length > 0 && (
						<div className="storeengine-addon-card__required-notice">
							<span className="storeengine-addon-card__required-label">
								<span
									className="storeengine-icon storeengine-icon--box storeengine-addon-card__required-icon"
									aria-hidden={ true }
								/>
								{ __( 'Requires add-ons', 'storeengine' ) }
							</span>
							<span className="storeengine-addon-card__required-list">
								{ requiredAddons.map( ( slug ) => {
									const ok = !! values?.[ slug ];
									return (
										<span
											key={ slug }
											className={ `storeengine-addon-card__req-pill ${
												ok ? 'is-ok' : 'is-missing'
											}` }
										>
											<span aria-hidden={ true }>
												{ ok ? '✓' : '!' }
											</span>
											{ labelForSlug( slug ) }
										</span>
									);
								} ) }
							</span>
						</div>
					) }
				</div>
			) }
		</div>
	);
};

export default AddonCard;
