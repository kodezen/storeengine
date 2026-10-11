import React, { useEffect, useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import {
	fetchProviders,
	fetchSettings,
	saveSettings,
} from '@Redux/Slices/couriersSlice/couriersSlice';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import SubTopBar from '@Components/SubTopBar';
import CourierAddonsForm from './CourierAddonsForm';
import ProviderCredentialCard from './ProviderCredentialCard';
import { getAddonActiveStatus } from '@Utils/helper';
// Self-contained switch (inline styles) — raw <input type="checkbox"> gets
// hijacked by the global admin "checkbox→switch" CSS and renders broken
// (blue track, thumb stuck left), so always use this in .se-admin-tw.
import { Switch } from '@Components/ui';

const inputCx =
	'px-2 py-1.5 border border-se-border rounded text-sm text-se-input bg-white focus:outline-none focus:ring-2 focus:ring-se-primary/30';
const labelCx = 'flex flex-col gap-1 text-xs text-se-subtitle';

const blankAutoPush = {
	enabled: false,
	provider: '',
	default_weight_kg: 0.5,
	use_cod_when: 'cod_payment_method',
	cod_methods: [ 'cod', 'cash-on-delivery' ],
};

const blankSync = {
	auto_complete_on_delivered: true,
	flip_on_return: false,
};

const CourierSettings = ( { onRegisterSave, onSavingChange, onDirtyChange } ) => {
	const dispatch = useDispatch();
	const { providers = [], settings = {} } = useSelector(
		( s ) => s.couriers
	);
	// Active-addon map (seeded from StoreEngineGlobal, kept fresh by the toggles
	// below). A courier's settings only appear once it is enabled in Courier
	// Add-ons — so "enable a courier" reveals exactly its credentials + OAuth.
	const addons = useSelector( ( s ) => s.addons );
	const enabledProviders = providers.filter( ( p ) =>
		getAddonActiveStatus( addons, p.id )
	);

	// setProviderForm/setAutoPush/setSync (every call site below already uses
	// these names) now also signal dirty to the parent so the top-bar Save
	// button enables. The settings-load effect below uses the *State setters
	// directly so populating the form from the server never marks it dirty —
	// same onRegisterSave/onDirtyChange contract every other settings tab
	// (Ai, Seo, MultiVendor, …) uses; this tab previously had its own always-
	// enabled inline Save button instead, which never reflected pending changes.
	const [ providerForm, setProviderFormState ] = useState( {} );
	const [ autoPush, setAutoPushState ] = useState( blankAutoPush );
	const [ sync, setSyncState ] = useState( blankSync );
	const setProviderForm = ( next ) => {
		setProviderFormState( next );
		onDirtyChange?.( true );
	};
	const setAutoPush = ( next ) => {
		setAutoPushState( next );
		onDirtyChange?.( true );
	};
	const setSync = ( next ) => {
		setSyncState( next );
		onDirtyChange?.( true );
	};

	useEffect( () => {
		if ( ! providers.length ) dispatch( fetchProviders() );
		dispatch( fetchSettings() );
	}, [ dispatch ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Consume the OAuth callback result (the connect flow bounces back here with
	// ?se_oauth=&oauth_status=). Notify, refresh provider connection state, then
	// strip the params so a reload doesn't re-notify.
	useEffect( () => {
		const params = new URLSearchParams( window.location.search );
		const provider = params.get( 'se_oauth' );
		const status = params.get( 'oauth_status' );
		if ( ! provider || ! status ) {
			return;
		}

		dispatch(
			showNotification( {
				message:
					status === 'success'
						? __( 'Courier connected.', 'storeengine' )
						: sprintf(
								// translators: %s: error code
								__(
									'Could not connect courier: %s',
									'storeengine'
								),
								params.get( 'oauth_error' ) ||
									__( 'unknown error', 'storeengine' )
						  ),
				isShow: true,
				type: status === 'success' ? 'success' : 'error',
			} )
		);
		dispatch( fetchProviders() );

		params.delete( 'se_oauth' );
		params.delete( 'oauth_status' );
		params.delete( 'oauth_error' );
		const qs = params.toString();
		window.history.replaceState(
			{},
			'',
			window.location.pathname + ( qs ? '?' + qs : '' )
		);
	}, [ dispatch ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		setProviderFormState( settings.providers || {} );
		setAutoPushState( {
			...blankAutoPush,
			...( settings.auto_push || {} ),
		} );
		setSyncState( {
			...blankSync,
			...( settings.sync || {} ),
		} );
	}, [ settings ] );

	const setProviderField = ( provider, key, value ) =>
		setProviderForm( {
			...providerForm,
			[ provider ]: {
				...( providerForm[ provider ] || {} ),
				[ key ]: value,
			},
		} );

	const submit = async () => {
		onSavingChange?.( true );
		try {
			await dispatch(
				saveSettings( {
					providers: providerForm,
					auto_push: {
						...autoPush,
						default_weight_kg: Number( autoPush.default_weight_kg ) || 0,
					},
					sync,
				} )
			);
			onDirtyChange?.( false );
			// Refresh provider OAuth state (configured/connected) after saving, so
			// the Connect OAuth button and status reflect newly-entered client
			// credentials.
			dispatch( fetchProviders() );
		} finally {
			onSavingChange?.( false );
		}
	};

	// Keep ref current so the stable wrapper registered below always calls the
	// latest submit (same pattern as MultiVendor/Suppliers/Returns).
	const submitRef = useRef( submit );
	submitRef.current = submit;

	useEffect( () => {
		onRegisterSave?.( () => submitRef.current?.() );
		return () => onRegisterSave?.( null );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="se-admin-tw font-se">
			<SubTopBar heading={__( 'Provider settings', 'storeengine' )} />

			{ /* Auto-push card */ }
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5 mb-4">
				<h3 className="m-0 mb-1 text-base font-semibold text-se-text">
					{ __( 'Auto-push paid orders', 'storeengine' ) }
				</h3>
				<p className="m-0 text-xs text-se-subtitle">
					{ __(
						'When an online order is paid, automatically create a shipment with the chosen courier. POS sales are skipped.',
						'storeengine'
					) }
				</p>

				<div className="flex items-center gap-2 text-sm text-se-text mt-4">
					<Switch
						checked={ !! autoPush.enabled }
						onChange={ ( val ) =>
							setAutoPush( {
								...autoPush,
								enabled: val,
							} )
						}
						aria-label={ __(
							'Enable auto-push on payment',
							'storeengine'
						) }
					/>
					{ __( 'Enable auto-push on payment', 'storeengine' ) }
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
					<label className={ labelCx }>
						{ __( 'Default provider', 'storeengine' ) }
						<select
							value={ autoPush.provider || '' }
							onChange={ ( e ) =>
								setAutoPush( {
									...autoPush,
									provider: e.target.value,
								} )
							}
							className={ inputCx }
							disabled={ ! autoPush.enabled }
						>
							<option value="">
								{ __( 'Select…', 'storeengine' ) }
							</option>
							{ providers.map( ( p ) => (
								<option key={ p.id } value={ p.id }>
									{ p.label }
								</option>
							) ) }
						</select>
					</label>
					<label className={ labelCx }>
						{ __( 'Default weight (kg)', 'storeengine' ) }
						<input
							type="number"
							step="0.1"
							min="0"
							value={ autoPush.default_weight_kg }
							onChange={ ( e ) =>
								setAutoPush( {
									...autoPush,
									default_weight_kg: e.target.value,
								} )
							}
							className={ inputCx }
							disabled={ ! autoPush.enabled }
						/>
					</label>
					<label className={ labelCx }>
						{ __(
							'COD payment method slugs',
							'storeengine'
						) }
						<input
							type="text"
							value={ ( autoPush.cod_methods || [] ).join( ',' ) }
							onChange={ ( e ) =>
								setAutoPush( {
									...autoPush,
									cod_methods: e.target.value
										.split( ',' )
										.map( ( s ) => s.trim() )
										.filter( Boolean ),
								} )
							}
							className={ inputCx }
							placeholder="cod, cash-on-delivery"
							disabled={ ! autoPush.enabled }
						/>
					</label>
				</div>
				<p className="text-xs text-se-subtitle mt-2">
					{ __(
						'When the order uses any payment-method slug above, the order total is sent as COD amount to the courier.',
						'storeengine'
					) }
				</p>
			</div>

			{ /* Status sync card */ }
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5 mb-4">
				<h3 className="m-0 mb-1 text-base font-semibold text-se-text">
					{ __( 'Order status sync', 'storeengine' ) }
				</h3>
				<p className="m-0 text-xs text-se-subtitle">
					{ __(
						'Bridge courier shipment status back to the parent order. Order notes are always added; the toggles below control automatic status transitions.',
						'storeengine'
					) }
				</p>

				<div className="flex items-center gap-2 text-sm text-se-text mt-4">
					<Switch
						checked={ !! sync.auto_complete_on_delivered }
						onChange={ ( val ) =>
							setSync( {
								...sync,
								auto_complete_on_delivered: val,
							} )
						}
						aria-label={ __(
							'Auto-complete order when all shipments are delivered',
							'storeengine'
						) }
					/>
					{ __(
						'Auto-complete order when all shipments are delivered',
						'storeengine'
					) }
				</div>

				<div className="flex items-center gap-2 text-sm text-se-text mt-2">
					<Switch
						checked={ !! sync.flip_on_return }
						onChange={ ( val ) =>
							setSync( {
								...sync,
								flip_on_return: val,
							} )
						}
						aria-label={ __(
							'Move order to On hold when courier marks shipment returned',
							'storeengine'
						) }
					/>
					{ __(
						'Move order to On hold when courier marks shipment returned',
						'storeengine'
					) }
				</div>
			</div>

			{ /* Provider credentials — one collapsible row per ENABLED courier.
			     Enabling a courier in Courier Add-ons below reveals its
			     credentials + OAuth connect here (and disabling hides them),
			     so the page only ever shows what the merchant is using. */ }
			{ providers.length > 0 && (
				<div className="mt-4">
					<h3 className="m-0 mb-2 text-base font-semibold text-se-text">
						{ __( 'Courier credentials', 'storeengine' ) }
					</h3>
					<p className="m-0 mb-3 text-xs text-se-subtitle">
						{ __(
							'Expand a courier, enter its API credentials (or connect via OAuth), then click Connect. Use your courier’s sandbox/test credentials while testing and production/live credentials to go live — each card links to where to find them.',
							'storeengine'
						) }
					</p>
					{ enabledProviders.length > 0 ? (
						<div className="flex flex-col gap-3">
							{ enabledProviders.map( ( p ) => (
								<ProviderCredentialCard
									key={ p.id }
									provider={ p }
									values={ providerForm[ p.id ] || {} }
									onField={ ( key, value ) =>
										setProviderField( p.id, key, value )
									}
									onSave={ submit }
								/>
							) ) }
						</div>
					) : (
						<p className="m-0 text-xs text-se-subtitle italic">
							{ __(
								'No couriers enabled yet — turn one on in Courier Add-ons below to configure it.',
								'storeengine'
							) }
						</p>
					) }
				</div>
			) }

			{ /* Courier Add-ons — per-provider enable toggles. Placed last to
			     mirror the Payment Methods tab, where the add-ons grid sits
			     below the configured providers. */ }
			<CourierAddonsForm />
		</div>
	);
};

export default CourierSettings;
