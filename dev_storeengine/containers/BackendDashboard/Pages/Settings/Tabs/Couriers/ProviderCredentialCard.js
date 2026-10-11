import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import Button from '@Components/Button';
// Self-contained switch — raw checkboxes get hijacked by the global admin
// "checkbox→switch" CSS and render broken; always use this in .se-admin-tw.
import { Switch } from '@Components/ui';
import {
	oauthConnect,
	oauthDisconnect,
	oauthTest,
} from '@Redux/Slices/couriersSlice/couriersSlice';

const inputCx =
	'px-2 py-1.5 border border-se-border rounded text-sm text-se-input bg-white focus:outline-none focus:ring-2 focus:ring-se-primary/30';
const labelCx = 'flex flex-col gap-1 text-xs text-se-subtitle';

/**
 * One courier's credential form with a single, uniform Connect / Disconnect
 * action — the same for every courier, whatever it uses under the hood:
 *
 *   - Connect saves the entered credentials, then for a courier that needs a
 *     login (3-legged OAuth, e.g. Sendcloud) sends the merchant to the courier's
 *     consent page; for the rest it just saves (and verifies where it can).
 *   - Disconnect clears the stored connection (OAuth tokens, or saved keys).
 *
 * The merchant never has to know which auth method a courier uses.
 */
const ProviderCredentialCard = ( { provider, values, onField, onSave } ) => {
	const dispatch = useDispatch();
	const [ isOpen, setOpen ] = useState( false );
	const [ busy, setBusy ] = useState( false );

	const schema = provider.settings_schema || [];
	const connected = !! provider.connected;
	// Only 3-legged OAuth couriers need a redirect to the courier's login.
	const interactive = !! provider.oauth?.interactive;
	// Setup docs + where to get credentials (staging vs production).
	const docs = provider.docs || {};

	// Keep first-time setup short: show only credential fields until connected,
	// then reveal shipping config (ship-from address, parcel defaults).
	const shippingFields = schema.filter( ( f ) => f.group === 'shipping' );
	const credentialFields = schema.filter( ( f ) => f.group !== 'shipping' );

	const renderField = ( field ) => {
		const v = values[ field.key ] ?? '';
		if ( 'boolean' === field.type ) {
			return (
				<div
					key={ field.key }
					className="flex items-center gap-2 text-sm text-se-text"
				>
					<Switch
						checked={ !! v }
						onChange={ ( val ) => onField( field.key, val ) }
						aria-label={ field.label }
					/>
					{ field.label }
				</div>
			);
		}
		return (
			<label key={ field.key } className={ labelCx + ' sm:col-span-2' }>
				<span>
					{ field.label }
					{ field.required ? (
						<span className="text-se-error"> *</span>
					) : null }
				</span>
				<input
					type={ 'password' === field.type ? 'password' : 'text' }
					value={ v }
					onChange={ ( e ) => onField( field.key, e.target.value ) }
					className={ inputCx }
				/>
				{ field.help && (
					<small className="text-se-subtitle">{ field.help }</small>
				) }
			</label>
		);
	};

	const onConnect = async () => {
		setBusy( true );
		try {
			// Persist the entered credentials first (saves all courier settings).
			await onSave?.();
			if ( interactive ) {
				// Sends the browser to the courier's consent page; it returns to
				// our callback, which stores the tokens.
				dispatch( oauthConnect( provider.id ) );
			} else if ( provider.oauth?.supported ) {
				// 2-legged OAuth (e.g. FedEx/UPS) — verify the key/secret.
				dispatch( oauthTest( provider.id ) );
			}
		} finally {
			setBusy( false );
		}
	};

	const onDisconnect = async () => {
		setBusy( true );
		try {
			await dispatch( oauthDisconnect( provider.id ) );
			// For non-OAuth couriers, disconnect cleared the saved keys server-side
			// — mirror that in the open form so the fields empty out too.
			if ( ! interactive ) {
				schema.forEach( ( f ) => onField( f.key, '' ) );
			}
		} finally {
			setBusy( false );
		}
	};

	return (
		<div className="bg-white border border-se-border rounded-md shadow-se-card">
			{ /* Header — click to expand. The Connect action lives in the body,
			     next to the credential fields. */ }
			<button
				type="button"
				onClick={ () => setOpen( ! isOpen ) }
				className="w-full flex items-center gap-2 p-4 text-left bg-transparent border-0 cursor-pointer"
				aria-expanded={ isOpen }
			>
				<span className="text-base font-semibold text-se-text">
					{ provider.label }
				</span>
				<span
					className={ `text-xs px-2 py-0.5 rounded-full ${
						connected
							? 'bg-se-success/10 text-se-success'
							: 'bg-se-border/40 text-se-subtitle'
					}` }
				>
					{ connected
						? __( 'Connected', 'storeengine' )
						: __( 'Not connected', 'storeengine' ) }
				</span>
			</button>

			{ /* Body — credential fields. */ }
			{ isOpen && (
				<div className="storeengine-expandable-section storeengine-expandable-section--open border-t border-se-border">
					<div className="storeengine-expandable-section-content p-4">
						{ ( docs.note || docs.credentials || docs.docs ) && (
							<div className="mb-3 p-3 rounded bg-se-bg text-xs text-se-subtitle">
								{ docs.note && (
									<p className="m-0">{ docs.note }</p>
								) }
								<div className="mt-2 flex flex-wrap gap-4">
									{ docs.credentials && (
										<a
											href={ docs.credentials }
											target="_blank"
											rel="noopener noreferrer"
											className="text-se-primary font-medium no-underline hover:underline"
										>
											{ __(
												'Get API credentials',
												'storeengine'
											) }{ ' ' }
											↗
										</a>
									) }
									{ docs.docs && (
										<a
											href={ docs.docs }
											target="_blank"
											rel="noopener noreferrer"
											className="text-se-primary font-medium no-underline hover:underline"
										>
											{ __( 'API docs', 'storeengine' ) }{ ' ' }
											↗
										</a>
									) }
								</div>
							</div>
						) }

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{ credentialFields.map( renderField ) }
						</div>

						{ /* The Connect / Disconnect action, right below the
						     credentials you just entered. Test vs live is handled
						     automatically from the key you enter (or the sandbox
						     toggle above where the courier requires one). */ }
						<div className="mt-4 flex items-center gap-3">
							{ connected ? (
								<Button
									preset="gray"
									label={ __( 'Disconnect', 'storeengine' ) }
									isLoading={ busy }
									onClick={ onDisconnect }
								/>
							) : (
								<Button
									preset="blue"
									label={ __( 'Connect', 'storeengine' ) }
									isLoading={ busy }
									onClick={ onConnect }
								/>
							) }
						</div>

						{ /* Shipping details — deferred until connected so first-
						     time setup is just credentials + Connect. */ }
						{ shippingFields.length > 0 &&
							( connected ? (
								<div className="mt-4 pt-4 border-t border-l-0 border-r-0 border-b-0 border-solid border-se-border">
									<div className="text-sm font-medium text-se-text">
										{ __(
											'Shipping details',
											'storeengine'
										) }
									</div>
									<p className="mt-0.5 mb-3 text-xs text-se-subtitle">
										{ __(
											'Your ship-from address and parcel defaults. Click Save settings (top) when done.',
											'storeengine'
										) }
									</p>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{ shippingFields.map( renderField ) }
									</div>
								</div>
							) : (
								<p className="mt-3 mb-0 text-xs text-se-subtitle italic">
									{ __(
										'You’ll add your ship-from address and parcel defaults after connecting.',
										'storeengine'
									) }
								</p>
							) ) }

						{ interactive && (
							<p className="mt-3 mb-0 text-xs text-se-subtitle">
								{ connected
									? __(
											'Connected via OAuth — access renews automatically. Use Disconnect to revoke.',
											'storeengine'
									  )
									: __(
											'Enter the OAuth client ID and secret, then click Connect to authorize with this courier.',
											'storeengine'
									  ) }
							</p>
						) }
					</div>
				</div>
			) }
		</div>
	);
};

export default ProviderCredentialCard;
