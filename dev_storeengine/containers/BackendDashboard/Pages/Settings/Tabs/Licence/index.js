import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { ContentSection } from '@Containers/BackendDashboard/Pages/Settings/Layouts';
import { get_assets_url } from '@Utils/helper';
import { Scope, Button, Switch } from '@Components/ui';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { createInterpolateElement } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import moment from 'moment/moment';
import { buildPurchaseUrl, getData, request, SeSdk } from './helper';
import HireUs from './HireUs';

import './styles.scss';

const LOGO_URL = get_assets_url( 'images/logo.svg' );

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function compareVersions( a, b ) {
	const pa = String( a )
		.split( '.' )
		.map( ( n ) => parseInt( n, 10 ) || 0 );
	const pb = String( b )
		.split( '.' )
		.map( ( n ) => parseInt( n, 10 ) || 0 );
	const len = Math.max( pa.length, pb.length );
	for ( let i = 0; i < len; i++ ) {
		const ai = pa[ i ] || 0;
		const bi = pb[ i ] || 0;
		if ( ai !== bi ) return ai < bi ? -1 : 1;
	}
	return 0;
}

function timeAgo( unix ) {
	if ( ! unix ) return __( 'never', 'storeengine' );
	const seconds = Math.max( 0, Math.floor( Date.now() / 1000 - unix ) );
	if ( seconds < 60 ) return __( 'just now', 'storeengine' );
	if ( seconds < 3600 )
		/* translators: %d: minutes */
		return sprintf(
			__( '%d min ago', 'storeengine' ),
			Math.floor( seconds / 60 )
		);
	if ( seconds < 86400 )
		/* translators: %d: hours */
		return sprintf(
			__( '%d hr ago', 'storeengine' ),
			Math.floor( seconds / 3600 )
		);
	/* translators: %d: days */
	return sprintf(
		__( '%d days ago', 'storeengine' ),
		Math.floor( seconds / 86400 )
	);
}

// ---------------------------------------------------------------------------
// Main License component
// ---------------------------------------------------------------------------

const License = () => {
	const dispatch = useDispatch();
	const [ licenseKey, setLicenseKey ] = useState( '' );
	const [ licenseData, setLicenseData ] = useState( SeSdk.license );
	const [ optInData, setOptInData ] = useState( SeSdk.optin );
	const [ isActivating, setIsActivating ] = useState( false );
	const [ isDeactivating, setIsDeactivating ] = useState( false );
	const [ isOptinLoading, setIsOptinLoading ] = useState( false );
	const [ isCheckingStatus, setIsCheckingStatus ] = useState( false );

	// SDK 1.5+ update / version / settings state.
	const [ updateState, setUpdateState ] = useState( null );
	const [ versions, setVersions ] = useState( null );
	const [ versionsLoading, setVersionsLoading ] = useState( false );
	const [ versionsError, setVersionsError ] = useState( null );
	const [ isChecking, setIsChecking ] = useState( false );
	const [ isInstalling, setIsInstalling ] = useState( false );
	const [ installLog, setInstallLog ] = useState( [] );
	const [ manualFallback, setManualFallback ] = useState( null );
	const [ confirmingBreaking, setConfirmingBreaking ] = useState( null );
	const [ savingBeta, setSavingBeta ] = useState( false );

	const isActive = licenseData?.status === 'active';
	const supportsNewEndpoints = !! SeSdk?.rest_url;

	const fetchStatus = useCallback( async () => {
		setIsCheckingStatus( true );
		try {
			const { data } = await getData( 'license/status', { force: true } );
			setLicenseData( data );
		} catch ( error ) {
			const message =
				error?.response?.data?.message ||
				__( 'Failed to fetch license status.', 'storeengine' );
			dispatch(
				showNotification( { message, isShow: true, type: 'error' } )
			);
		} finally {
			setIsCheckingStatus( false );
		}
	}, [ dispatch ] );

	const refreshUpdateState = useCallback( async () => {
		if ( ! supportsNewEndpoints ) return;
		try {
			const { data } = await getData( 'updates/status' );
			setUpdateState( data );
		} catch ( error ) {
			// silent — older SDK or transient failure
		}
	}, [ supportsNewEndpoints ] );

	const refreshVersions = useCallback( async () => {
		if ( ! supportsNewEndpoints ) return;
		setVersionsLoading( true );
		setVersionsError( null );
		try {
			const { data } = await getData( 'updates/versions' );
			setVersions( data?.versions || [] );
		} catch ( error ) {
			setVersions( [] );
			setVersionsError( {
				code: error?.response?.data?.code,
				message:
					error?.response?.data?.message ||
					__( 'Failed to load version history.', 'storeengine' ),
			} );
		} finally {
			setVersionsLoading( false );
		}
	}, [ supportsNewEndpoints ] );

	const refreshUpdateData = useCallback( () => {
		refreshUpdateState();
		refreshVersions();
	}, [ refreshUpdateState, refreshVersions ] );

	useEffect( () => {
		if ( isActive && supportsNewEndpoints ) {
			refreshUpdateData();
		}
	}, [ isActive, supportsNewEndpoints, refreshUpdateData ] );

	const handleActivate = async () => {
		if ( ! licenseKey.trim() ) {
			dispatch(
				showNotification( {
					message: __( 'Please enter a license key.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			return;
		}
		setIsActivating( true );
		try {
			const {
				data: { license },
			} = await request( 'license/activate', {
				license: licenseKey.trim(),
			} );
			setLicenseData( license );
			setLicenseKey( '' );
			window.dispatchEvent(
				new CustomEvent( 'storeengine:license:changed', {
					detail: { status: 'active' },
				} )
			);
			dispatch(
				showNotification( {
					message: __(
						'License activated successfully.',
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
			refreshUpdateData();
		} catch ( error ) {
			const message =
				error?.response?.data?.message ||
				__( 'Failed to activate license.', 'storeengine' );
			dispatch(
				showNotification( { message, isShow: true, type: 'error' } )
			);
		} finally {
			setIsActivating( false );
		}
	};

	const handleDeactivate = async () => {
		setIsDeactivating( true );
		try {
			const {
				data: { license },
			} = await request( 'license/deactivate', {} );
			setLicenseData( license );
			window.dispatchEvent(
				new CustomEvent( 'storeengine:license:changed', {
					detail: { status: 'inactive' },
				} )
			);
			dispatch(
				showNotification( {
					message: __(
						'License deactivated successfully.',
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
		} catch ( error ) {
			const message =
				error?.response?.data?.message ||
				__( 'Failed to deactivate license.', 'storeengine' );
			dispatch(
				showNotification( { message, isShow: true, type: 'error' } )
			);
		} finally {
			setIsDeactivating( false );
		}
	};

	const handleOptin = async ( optin ) => {
		setIsOptinLoading( true );
		try {
			const { data } = await request( 'insights/optin', {
				opt_in: optin,
			} );
			setOptInData( data );
		} catch ( error ) {
			const message =
				error?.response?.data?.message ||
				__( 'Failed to update opt-in setting.', 'storeengine' );
			dispatch(
				showNotification( { message, isShow: true, type: 'error' } )
			);
		} finally {
			setIsOptinLoading( false );
		}
	};

	const handleCheckNow = async () => {
		setIsChecking( true );
		try {
			const { data } = await request( 'updates/check-now', {} );
			setUpdateState( data );
			dispatch(
				showNotification( {
					message: data?.update_available
						? sprintf(
								/* translators: %s: latest version number */
								__(
									'Update available: v%s',
									'storeengine'
								),
								data.latest_version
							)
						: __( "You're up to date.", 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
		} catch ( error ) {
			const message =
				error?.response?.data?.message ||
				__( 'Could not check for updates.', 'storeengine' );
			dispatch(
				showNotification( { message, isShow: true, type: 'error' } )
			);
		} finally {
			setIsChecking( false );
		}
	};

	const handleInstall = async ( version ) => {
		setIsInstalling( true );
		setManualFallback( null );
		setInstallLog( [
			{
				level: 'info',
				message: __( 'Starting…', 'storeengine' ),
				time: Date.now() / 1000,
			},
		] );
		try {
			const { data } = await request(
				'updates/install',
				version ? { version } : {}
			);
			setInstallLog( data?.log || [] );
			dispatch(
				showNotification( {
					message: data?.is_rollback
						? sprintf(
								/* translators: %s: target version number */
								__(
									'Rolled back to v%s',
									'storeengine'
								),
								data.target_version
							)
						: sprintf(
								/* translators: %s: target version number */
								__(
									'Installed v%s',
									'storeengine'
								),
								data.target_version
							),
					isShow: true,
					type: 'success',
				} )
			);
			setTimeout( () => window.location.reload(), 1500 );
		} catch ( error ) {
			const log = error?.response?.data?.data?.log;
			if ( log ) setInstallLog( log );
			const message =
				error?.response?.data?.message ||
				__( 'Install failed.', 'storeengine' );
			dispatch(
				showNotification( { message, isShow: true, type: 'error' } )
			);
			// Automatic install failed — surface step-by-step manual
			// download + upload instructions instead of a dead end.
			setManualFallback( { message } );
			refreshUpdateState();
		} finally {
			setIsInstalling( false );
		}
	};

	const handleBeta = async ( enabled ) => {
		setSavingBeta( true );
		try {
			await request( 'settings/beta-channel', { enabled } );
			setUpdateState( ( s ) => ( {
				...( s || {} ),
				beta_enabled: enabled,
			} ) );
			refreshUpdateState();
		} catch ( error ) {
			const message =
				error?.response?.data?.message ||
				__( 'Could not save beta setting.', 'storeengine' );
			dispatch(
				showNotification( { message, isShow: true, type: 'error' } )
			);
		} finally {
			setSavingBeta( false );
		}
	};

	const updateAvailable = !! updateState?.update_available;
	const previousVersion = updateState?.previous_version;
	const autoUpdateOn = !! updateState?.auto_update_enabled;

	return (
		<Scope>
			{ isActive && supportsNewEndpoints && (
				<ContentSection slug="license-updates">
					<div className="storeengine-license-hero">
						<div className="storeengine-license-hero__versions">
							<div className="storeengine-license-hero__block">
								<span className="storeengine-license-hero__label">
									{ __( 'Installed', 'storeengine' ) }
								</span>
								<span className="storeengine-license-hero__value">
									{ updateState?.current_version || '—' }
								</span>
							</div>
							{ updateAvailable && (
								<>
									<span
										className="storeengine-license-hero__arrow"
										aria-hidden="true"
									>
										→
									</span>
									<div className="storeengine-license-hero__block">
										<span className="storeengine-license-hero__label">
											{ __( 'Latest', 'storeengine' ) }
										</span>
										<span className="storeengine-license-hero__value storeengine-license-hero__value--latest">
											{ updateState?.latest_version ||
												'—' }
										</span>
									</div>
								</>
							) }
						</div>
						<div className="storeengine-license-hero__actions">
							<span className="storeengine-license-hero__checked">
								{ sprintf(
									/* translators: %s: human time diff (e.g. "5 min ago") */
									__( 'Checked %s', 'storeengine' ),
									timeAgo( updateState?.last_checked_at )
								) }
							</span>
							<Button
								preset="primary"
								onClick={ handleCheckNow }
								disabled={ isChecking }
							>
								{ isChecking
									? __( 'Checking…', 'storeengine' )
									: __(
											'Check for updates',
											'storeengine'
										) }
							</Button>
						</div>
					</div>

					{ updateAvailable && (
						<div className="storeengine-license-banner storeengine-license-banner--update">
							<div className="storeengine-license-banner__message">
								<div className="storeengine-license-banner__title">
									{ sprintf(
										/* translators: %s: latest version number */
										__(
											'Version %s is available',
											'storeengine'
										),
										updateState?.latest_version
									) }
								</div>
								<p className="storeengine-license-banner__sub">
									{ updateState?.changelog ||
										__(
											'Click update to install the latest release. Your settings and data stay intact.',
											'storeengine'
										) }
								</p>
							</div>
							<div className="storeengine-license-banner__actions">
								<Button
									preset="primary"
									onClick={ () => handleInstall( null ) }
									disabled={ isInstalling }
								>
									{ isInstalling
										? __( 'Installing…', 'storeengine' )
										: sprintf(
												/* translators: %s: target version number */
												__(
													'Update to %s',
													'storeengine'
												),
												updateState?.latest_version
											) }
								</Button>
							</div>
							{ isInstalling && installLog.length > 0 && (
								<div className="storeengine-license-progress">
									<div className="storeengine-license-progress__bar">
										<div className="storeengine-license-progress__fill" />
									</div>
									<InstallLog messages={ installLog } />
								</div>
							) }
							{ manualFallback && (
								<ManualUpdateNotice
									fallback={ manualFallback }
									onDismiss={ () =>
										setManualFallback( null )
									}
								/>
							) }
						</div>
					) }

					{ previousVersion && (
						<div className="storeengine-license-banner storeengine-license-banner--rollback">
							<div className="storeengine-license-banner__message">
								<div className="storeengine-license-banner__title">
									{ sprintf(
										/* translators: %s: previously installed version number */
										__(
											'Quick rollback to v%s',
											'storeengine'
										),
										previousVersion
									) }
								</div>
								<p className="storeengine-license-banner__sub">
									{ __(
										"If the latest update isn't working out, you can return to your previously installed version with one click.",
										'storeengine'
									) }
								</p>
							</div>
							<div className="storeengine-license-banner__actions">
								<Button
									preset="primary"
									onClick={ () =>
										handleInstall( previousVersion )
									}
									disabled={ isInstalling }
								>
									{ sprintf(
										/* translators: %s: previously installed version number */
										__(
											'Roll back to v%s',
											'storeengine'
										),
										previousVersion
									) }
								</Button>
							</div>
						</div>
					) }
				</ContentSection>
			) }

			<ContentSection slug="license">
				{ isActive ? (
					<>
						<h2 className="storeengine-content-section--license__heading">
							{ __(
								'StoreEngine Pro — License Active',
								'storeengine'
							) }
						</h2>
						<p className="storeengine-content-section--license__sub-title">
							{ __(
								'You have access to automatic updates, priority support, and all pro tools.',
								'storeengine'
							) }
						</p>

						<div className="storeengine-mid-section-logo storeengine-flex storeengine-flex-align-center storeengine-flex-gap-24">
							<img src={ LOGO_URL } alt="storeengine logo" />
							<span className="storeengine-icon storeengine-icon--link-bind" />
							<span className="storeengine-icon storeengine-icon--key-outlined" />
						</div>

						<div className="storeengine-license-field storeengine-flex storeengine-flex-align-center storeengine-flex-justify-center storeengine-flex-gap-16">
							<input
								type="text"
								className="storeengine-input"
								value={ licenseData?.license ?? '' }
								readOnly
							/>
							<Button
								preset="danger"
								onClick={ handleDeactivate }
								isLoading={ isDeactivating }
							>
								{ isDeactivating
									? __( 'Deactivating…', 'storeengine' )
									: __(
											'Deactivate License',
											'storeengine'
										) }
							</Button>
							<Button
								as="a"
								preset="primary"
								href={ buildPurchaseUrl(
									'https://store.kodezen.com/dashboard/license-keys/',
									SeSdk
								) }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __( 'Manage License', 'storeengine' ) }
							</Button>
						</div>

						<div className="storeengine-optin-group">
							{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
							<label className="storeengine-optin-checkbox storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8">
								<Switch
									checked={ optInData?.allowed ?? false }
									onChange={ ( next ) =>
										handleOptin( next )
									}
									disabled={ isOptinLoading }
								/>
								<span>
									{ __(
										'Allow usage tracking to help improve StoreEngine Pro.',
										'storeengine'
									) }
								</span>
							</label>

							{ supportsNewEndpoints && (
								/* eslint-disable-next-line jsx-a11y/label-has-associated-control */
								<label className="storeengine-optin-checkbox storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8">
									<Switch
										checked={ !! updateState?.beta_enabled }
										onChange={ ( next ) =>
											handleBeta( next )
										}
										disabled={ savingBeta }
									/>
									<span>
										{ __(
											'Receive beta updates (includes pre-release versions).',
											'storeengine'
										) }
									</span>
								</label>
							) }
						</div>

						<span className="storeengine-content-section--license__separator" />

						<div className="storeengine-license-meta storeengine-flex storeengine-flex-justify-center storeengine-flex-gap-24">
							<div className="storeengine-license-meta__item">
								<span className="storeengine-license-meta__label">
									{ __( 'Status:', 'storeengine' ) }
								</span>
								<span
									className={ `storeengine-license-meta__value storeengine-license-meta__value--${ licenseData?.status }` }
								>
									{ licenseData?.status === 'active'
										? __( 'Active', 'storeengine' )
										: licenseData?.status }
								</span>
							</div>
							<div className="storeengine-license-meta__item">
								<span className="storeengine-license-meta__label">
									{ __( 'Last Checked:', 'storeengine' ) }
								</span>
								<span className="storeengine-license-meta__value">
									{ licenseData?.updated_at
										? moment
												.utc( licenseData.updated_at )
												.local()
												.format(
													'YYYY-MM-DD  HH:mm:ss'
												)
										: __( 'Never', 'storeengine' ) }
									<button
										type="button"
										className="storeengine-license-refresh"
										onClick={ fetchStatus }
										aria-label={ __(
											'Refresh status',
											'storeengine'
										) }
									>
										{ isCheckingStatus ? (
											<Spinner style={ { margin: 0 } } />
										) : (
											<span
												className="storeengine-icon storeengine-icon--reload"
												aria-hidden={ true }
												style={ {
													height: '16px',
													width: '16px',
													display: 'flex',
													justifyContent: 'center',
													alignItems: 'center',
												} }
											/>
										) }
									</button>
								</span>
							</div>
							<div className="storeengine-license-meta__item">
								<span className="storeengine-license-meta__label">
									{ __( 'Expires:', 'storeengine' ) }
								</span>
								<span className="storeengine-license-meta__value">
									{ licenseData?.expires
										? moment
												.utc( licenseData?.expires )
												.local()
												.format( 'YYYY-MM-DD  HH:mm' )
										: __( 'N/A', 'storeengine' ) }
								</span>
							</div>
							<div className="storeengine-license-meta__item">
								<span className="storeengine-license-meta__label">
									{ __(
										'Activation Remaining:',
										'storeengine'
									) }
								</span>
								<span className="storeengine-license-meta__value">
									{ licenseData?.unlimited
										? __( 'Unlimited', 'storeengine' )
										: sprintf(
												/* translators: 1: remaining activation (limit), 2: total limit */
												__(
													'%1$d out of %2$s',
													'storeengine'
												),
												licenseData?.remaining,
												licenseData?.limit
											) }
								</span>
							</div>
							<div className="storeengine-license-meta__item">
								<span className="storeengine-license-meta__label">
									{ __( 'WP Auto-update:', 'storeengine' ) }
								</span>
								<span
									className={ `storeengine-license-meta__value storeengine-license-meta__value--${ autoUpdateOn ? 'active' : 'muted' }` }
									title={
										autoUpdateOn
											? __(
													'WordPress will auto-install updates for this plugin (toggled on the Plugins screen).',
													'storeengine'
												)
											: __(
													'Toggle auto-update from WordPress → Plugins.',
													'storeengine'
												)
									}
								>
									{ autoUpdateOn
										? __( 'Enabled', 'storeengine' )
										: __( 'Disabled', 'storeengine' ) }
								</span>
							</div>
						</div>
					</>
				) : (
					<>
						<h2 className="storeengine-content-section--license__heading">
							{ __(
								'Activate StoreEngine Pro for updates & support.',
								'storeengine'
							) }
						</h2>
						<h3 className="storeengine-content-section--license__sub-title">
							{ __(
								'Activate StoreEngine Pro to unlock automatic updates, priority support, and all tools to optimize your WordPress store.',
								'storeengine'
							) }
						</h3>
						<div className="storeengine-mid-section-logo storeengine-flex storeengine-flex-align-center storeengine-flex-gap-24">
							<img src={ LOGO_URL } alt="storeengine logo" />
							<span className="storeengine-icon storeengine-icon--link-bind" />
							<span className="storeengine-icon storeengine-icon--key-outlined" />
						</div>
						<div className="storeengine-license-field storeengine-flex storeengine-flex-align-center storeengine-flex-justify-center storeengine-flex-gap-16">
							<input
								type="text"
								className="storeengine-input"
								placeholder={ __(
									'Enter your license key',
									'storeengine'
								) }
								value={ licenseKey }
								onChange={ ( e ) =>
									setLicenseKey( e.target.value )
								}
							/>
							<Button
								preset="primary"
								onClick={ handleActivate }
								isLoading={ isActivating }
							>
								{ isActivating
									? __( 'Activating…', 'storeengine' )
									: __(
											'Activate License',
											'storeengine'
										) }
							</Button>
						</div>
						<p className="storeengine-content-section--license__purchase">
							{ createInterpolateElement(
								__(
									"Don't have license key? <PurchaseButton/>",
									'storeengine'
								),
								{
									PurchaseButton: (
										<a
											href={ buildPurchaseUrl(
												'https://storeengine.pro/pricing/',
												SeSdk
											) }
											target="_blank"
											rel="noopener noreferrer"
										>
											{ __(
												'Purchase one here',
												'storeengine'
											) }
										</a>
									),
								}
							) }
						</p>
					</>
				) }
			</ContentSection>

			{ isActive && supportsNewEndpoints && (
				<ContentSection slug="license-versions">
					<VersionsCard
						versions={ versions }
						loading={ versionsLoading }
						error={ versionsError }
						installing={ isInstalling }
						current={ updateState?.current_version }
						onRefresh={ refreshVersions }
						onInstall={ handleInstall }
						confirming={ confirmingBreaking }
						setConfirming={ setConfirmingBreaking }
					/>
				</ContentSection>
			) }

			<ContentSection slug="hire-us">
				<HireUs sdk={ SeSdk } />
			</ContentSection>
		</Scope>
	);
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Shown when an automatic install fails: step-by-step manual download +
// upload instructions (no direct link), using URLs from the SDK js params.
const ManualUpdateNotice = ( { fallback, onDismiss } ) => {
	if ( ! fallback ) return null;

	const isTheme = SeSdk?.package?.type === 'theme';
	const productName = SeSdk?.package?.name || __( 'the plugin', 'storeengine' );
	const uploadLabel = isTheme
		? __( 'Appearance → Themes → Add New → Upload Theme', 'storeengine' )
		: __( 'Plugins → Add New → Upload Plugin', 'storeengine' );

	const steps = [
		SeSdk?.store_dashboard_url
			? sprintf(
					/* translators: %s: product name */
					__(
						'Download the latest %s package (.zip) from your account dashboard.',
						'storeengine'
					),
					productName
				)
			: sprintf(
					/* translators: %s: product name */
					__(
						'Download the latest %s package (.zip) from where you purchased it.',
						'storeengine'
					),
					productName
				),
		sprintf(
			/* translators: %s: WordPress admin location */
			__( 'In another tab, go to %s.', 'storeengine' ),
			uploadLabel
		),
		__(
			'Upload the .zip you downloaded and choose “Replace current with uploaded” if asked.',
			'storeengine'
		),
		__(
			'Your settings and data are preserved — this only replaces the files.',
			'storeengine'
		),
	];

	return (
		<div className="storeengine-license-manual">
			<div className="storeengine-license-manual__head">
				<strong>
					{ __(
						'Automatic update didn’t complete — update manually',
						'storeengine'
					) }
				</strong>
				<button
					type="button"
					className="storeengine-license-manual__dismiss"
					aria-label={ __( 'Dismiss', 'storeengine' ) }
					onClick={ onDismiss }
				>
					×
				</button>
			</div>
			{ fallback.message && (
				<p className="storeengine-license-manual__reason">
					{ fallback.message }
				</p>
			) }
			<ol className="storeengine-license-manual__steps">
				{ steps.map( ( s, i ) => (
					<li key={ i }>{ s }</li>
				) ) }
			</ol>
			<div className="storeengine-license-manual__actions">
				{ SeSdk?.store_dashboard_url && (
					<a
						className="storeengine-btn storeengine-btn--primary"
						href={ SeSdk.store_dashboard_url }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Open account dashboard', 'storeengine' ) }
					</a>
				) }
				{ SeSdk?.upload_url && (
					<a
						className="storeengine-btn storeengine-btn--secondary"
						href={ SeSdk.upload_url }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ isTheme
							? __( 'Go to Upload Theme', 'storeengine' )
							: __( 'Go to Upload Plugin', 'storeengine' ) }
					</a>
				) }
			</div>
		</div>
	);
};

const InstallLog = ( { messages } ) => {
	if ( ! messages || messages.length === 0 ) return null;
	return (
		<details className="storeengine-license-log">
			<summary>
				{ sprintf(
					/* translators: %d: number of log entries */
					__( 'Install log (%d entries)', 'storeengine' ),
					messages.length
				) }
			</summary>
			<ul>
				{ messages.map( ( m, i ) => (
					<li
						key={ i }
						className={ `storeengine-license-log--${ m.level }` }
					>
						<span className="storeengine-license-log__level">
							{ m.level }
						</span>
						<span>{ m.message }</span>
					</li>
				) ) }
			</ul>
		</details>
	);
};

const VersionsCard = ( {
	versions,
	loading,
	error,
	installing,
	current,
	onRefresh,
	onInstall,
	confirming,
	setConfirming,
} ) => {
	const header = (
		<div className="storeengine-license-versions__header">
			<div>
				<h3 className="storeengine-license-versions__title">
					{ __( 'Version history', 'storeengine' ) }
				</h3>
				<p className="storeengine-license-versions__subtitle">
					{ __(
						'Install or roll back to any released version of this plugin.',
						'storeengine'
					) }
				</p>
			</div>
			<Button
				preset="primary"
				onClick={ onRefresh }
				disabled={ loading || installing }
			>
				{ loading
					? __( 'Refreshing…', 'storeengine' )
					: __( 'Refresh', 'storeengine' ) }
			</Button>
		</div>
	);

	const wrap = ( inner ) => (
		<div className="storeengine-license-versions">
			{ header }
			<div className="storeengine-license-versions__body">{ inner }</div>
		</div>
	);

	if ( loading && ( ! versions || versions.length === 0 ) ) {
		return wrap(
			<p className="storeengine-license-versions__empty">
				{ __( 'Loading version history…', 'storeengine' ) }
			</p>
		);
	}

	if ( ! versions || versions.length === 0 ) {
		if ( error?.code === 'sdk-server-version-list-unsupported' ) {
			return wrap(
				<div className="storeengine-license-versions__empty storeengine-license-versions__empty--soft">
					<p>
						<strong>
							{ __(
								"The license server doesn't support version history yet.",
								'storeengine'
							) }
						</strong>
					</p>
					<p>{ error.message }</p>
				</div>
			);
		}
		if ( error ) {
			return wrap(
				<div className="storeengine-license-versions__empty storeengine-license-versions__empty--soft">
					<p>
						<strong>
							{ __(
								'Could not load version history.',
								'storeengine'
							) }
						</strong>
					</p>
					<p>{ error.message }</p>
				</div>
			);
		}
		return wrap(
			<div className="storeengine-license-versions__empty">
				<p>
					<strong>
						{ __(
							'No versions are available to install or roll back to yet.',
							'storeengine'
						) }
					</strong>
				</p>
				<p>
					{ __(
						"Once the vendor publishes additional released versions, they'll appear here with Install and Roll back buttons.",
						'storeengine'
					) }
				</p>
			</div>
		);
	}

	const onlyCurrent = versions.length === 1 && versions[ 0 ].is_current;

	return (
		<div className="storeengine-license-versions">
			{ header }
			{ onlyCurrent && (
				<div className="storeengine-license-versions__body">
					<div className="storeengine-license-versions__empty storeengine-license-versions__empty--soft">
						<p>
							{ __(
								"You're on the only released version. Roll back will become available once an earlier release is published.",
								'storeengine'
							) }
						</p>
					</div>
				</div>
			) }
			<table className="storeengine-license-versions__table">
				<thead>
					<tr>
						<th>{ __( 'Version', 'storeengine' ) }</th>
						<th>{ __( 'Status', 'storeengine' ) }</th>
						<th>{ __( 'Released', 'storeengine' ) }</th>
						<th className="storeengine-license-versions__col-actions"></th>
					</tr>
				</thead>
				<tbody>
					{ versions.map( ( v ) => (
						<Fragment key={ v.id }>
							<tr>
								<td>
									<code>{ v.version }</code>
									{ v.is_current && (
										<span className="storeengine-license-pill storeengine-license-pill--current">
											{ __( 'current', 'storeengine' ) }
										</span>
									) }
								</td>
								<td>
									<span
										className={ `storeengine-license-pill storeengine-license-pill--${ v.status }` }
									>
										{ v.status }
									</span>
								</td>
								<td>{ v.deployed_at || '—' }</td>
								<td className="storeengine-license-versions__col-actions">
									<VersionAction
										version={ v }
										current={ current }
										installing={ installing }
										onInstall={ onInstall }
										setConfirming={ setConfirming }
									/>
								</td>
							</tr>
							{ confirming && confirming.id === v.id && (
								<tr className="storeengine-license-versions__confirm-row">
									<td colSpan={ 4 }>
										<div className="storeengine-license-versions__confirm">
											<strong>
												{ __(
													'⚠ Breaking changes',
													'storeengine'
												) }
											</strong>
											<p>
												{ confirming.breaking_changes }
											</p>
											<div className="storeengine-license-versions__confirm-actions">
												<Button
													preset="primary"
													onClick={ () => {
														const version =
															confirming.version;
														setConfirming( null );
														onInstall( version );
													} }
												>
													{ __(
														'I understand, continue',
														'storeengine'
													) }
												</Button>
												<Button
													preset="outline"
													onClick={ () =>
														setConfirming( null )
													}
												>
													{ __(
														'Cancel',
														'storeengine'
													) }
												</Button>
											</div>
										</div>
									</td>
								</tr>
							) }
						</Fragment>
					) ) }
				</tbody>
			</table>
		</div>
	);
};

const VersionAction = ( {
	version,
	current,
	installing,
	onInstall,
	setConfirming,
} ) => {
	if ( version.is_current ) {
		return (
			<span className="storeengine-license-versions__hint">
				{ __( 'Installed', 'storeengine' ) }
			</span>
		);
	}

	const isDowngrade =
		current && compareVersions( version.version, current ) < 0;

	if ( ! version.allow_rollback && isDowngrade ) {
		return (
			<span
				className="storeengine-license-versions__hint storeengine-license-versions__hint--warn"
				title={ __(
					'Vendor disabled rollback to this version.',
					'storeengine'
				) }
			>
				{ __( 'Rollback blocked', 'storeengine' ) }
			</span>
		);
	}

	return (
		<Button
			preset="primary"
			onClick={ () => {
				if ( version.breaking_changes ) {
					setConfirming( version );
				} else {
					onInstall( version.version );
				}
			} }
			disabled={ installing }
		>
			{ isDowngrade
				? __( 'Roll back', 'storeengine' )
				: __( 'Install', 'storeengine' ) }
		</Button>
	);
};

export default React.memo( License );
