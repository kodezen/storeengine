import React, { useEffect, useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import Preloader from '@Components/Loader/Preloader';
import CustomTableMessage from '@Components/Oops/CustomTableMessage';
import OptionMenu from '@Components/OptionMenu';
import {
	Scope,
	Heading,
	Title,
	Button,
	Table,
	THead,
	TH,
	TR,
	TD,
} from '@Components/ui';

/**
 * CRUD UI for the Quick Checkout embed keys
 * (POST/GET/DELETE /wp-json/storeengine/v1/embed-keys).
 *
 *  - Lists every key with masked embed_key, allowed origins, status.
 *  - Inline form to create a new key (label + comma-separated origins).
 *  - On create the full pk_live_* key is shown ONCE so the admin can copy it.
 *  - Per-row actions via OptionMenu: Edit origins, Revoke, Delete.
 */

const restUrl = ( window.StoreEngineGlobal?.rest_url || '/wp-json/' ).replace(
	/\/+$/,
	'/'
);
const NONCE = window.StoreEngineGlobal?.nonce || '';
const BASE = `${ restUrl }storeengine/v1/embed-keys`;

async function api( method, path = '', body = null ) {
	const init = {
		method,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': NONCE,
		},
	};
	if ( body && method !== 'GET' ) {
		init.body = JSON.stringify( body );
	}
	const res = await fetch( BASE + path, init );
	const text = await res.text();
	let data = null;
	try {
		data = text ? JSON.parse( text ) : null;
	} catch ( e ) {
		/* fall through */
	}
	if ( ! res.ok ) {
		throw new Error(
			( data && ( data.message || data.code ) ) ||
				`Request failed (${ res.status })`
		);
	}
	return data;
}

const EmbedKeys = () => {
	const [ keys, setKeys ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( '' );
	const [ creating, setCreating ] = useState( false );
	const [ revealedKey, setRevealedKey ] = useState( null );
	const [ copied, setCopied ] = useState( false );
	const [ form, setForm ] = useState( {
		label: '',
		allowed_origins: window.location.origin,
	} );

	const refresh = useCallback( async () => {
		setLoading( true );
		setError( '' );
		try {
			const list = await api( 'GET' );
			setKeys( Array.isArray( list ) ? list : [] );
		} catch ( e ) {
			setError( e.message );
		} finally {
			setLoading( false );
		}
	}, [] );

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	const onCreate = async ( e ) => {
		if ( e && typeof e.preventDefault === 'function' ) {
			e.preventDefault();
		}
		if ( ! form.label.trim() || ! form.allowed_origins.trim() ) {
			setError(
				__(
					'Label and at least one allowed origin are required.',
					'storeengine'
				)
			);
			return;
		}
		setCreating( true );
		setError( '' );
		try {
			const created = await api( 'POST', '', {
				label: form.label.trim(),
				allowed_origins: form.allowed_origins
					.split( /[\s,]+/ )
					.map( ( s ) => s.trim() )
					.filter( Boolean ),
				product_scope: 'all',
			} );
			setRevealedKey( created );
			setForm( { label: '', allowed_origins: window.location.origin } );
			await refresh();
		} catch ( e ) {
			setError( e.message );
		} finally {
			setCreating( false );
		}
	};

	const onRevoke = async ( id ) => {
		if (
			! window.confirm(
				__(
					'Revoke this key? Any site using it will stop working immediately.',
					'storeengine'
				)
			)
		) {
			return;
		}
		try {
			await api( 'POST', `/${ id }/revoke` );
			await refresh();
		} catch ( e ) {
			setError( e.message );
		}
	};

	const onDelete = async ( id ) => {
		if (
			! window.confirm(
				__(
					'Permanently delete this key? This cannot be undone.',
					'storeengine'
				)
			)
		) {
			return;
		}
		try {
			await api( 'DELETE', `/${ id }` );
			await refresh();
		} catch ( e ) {
			setError( e.message );
		}
	};

	const onEditOrigins = async ( key ) => {
		const current = Array.isArray( key.allowed_origins )
			? key.allowed_origins.join( ', ' )
			: '';
		const next = window.prompt(
			__(
				'Allowed origins for this key (comma-separated)',
				'storeengine'
			),
			current
		);
		if ( next === null ) {
			return;
		}
		const allowed_origins = next
			.split( /[\s,]+/ )
			.map( ( s ) => s.trim() )
			.filter( Boolean );
		try {
			await api( 'POST', `/${ key.id }`, { allowed_origins } );
			await refresh();
		} catch ( e ) {
			setError( e.message );
		}
	};

	const copyToClipboard = async ( text ) => {
		try {
			if ( navigator.clipboard && navigator.clipboard.writeText ) {
				await navigator.clipboard.writeText( text );
			} else {
				// Fallback for non-HTTPS / older browsers — execCommand path.
				const ta = document.createElement( 'textarea' );
				ta.value = text;
				ta.setAttribute( 'readonly', '' );
				ta.style.position = 'absolute';
				ta.style.left = '-9999px';
				document.body.appendChild( ta );
				ta.select();
				document.execCommand( 'copy' );
				document.body.removeChild( ta );
			}
			setCopied( true );
			setTimeout( () => setCopied( false ), 2000 );
		} catch ( e ) {
			setError(
				__(
					'Failed to copy. Select the key and copy manually.',
					'storeengine'
				)
			);
		}
	};

	const fmtDate = ( s ) =>
		s ? new Date( s.replace( ' ', 'T' ) + 'Z' ).toLocaleString() : '—';

	const buildMenuOptions = ( k ) => {
		const opts = [];

		if ( ! k.revoked_at ) {
			opts.push( {
				type: 'button',
				label: <span>{ __( 'Edit origins', 'storeengine' ) }</span>,
				icon: (
					<span
						className="storeengine-icon storeengine-icon--edit"
						aria-hidden="true"
					/>
				),
				onClick: () => onEditOrigins( k ),
			} );
		}

		if ( ! k.revoked_at && ! k.is_system ) {
			opts.push( {
				type: 'button',
				label: <span>{ __( 'Revoke', 'storeengine' ) }</span>,
				icon: (
					<span
						className="storeengine-icon storeengine-icon--revoke"
						aria-hidden="true"
					/>
				),
				onClick: () => onRevoke( k.id ),
				hasBorder: ! k.is_system,
			} );
		}

		if ( ! k.is_system ) {
			opts.push( {
				type: 'button',
				label: <span>{ __( 'Delete', 'storeengine' ) }</span>,
				suffix: 'trash',
				icon: (
					<span
						className="storeengine-icon storeengine-icon--trash"
						aria-hidden="true"
					/>
				),
				onClick: () => onDelete( k.id ),
			} );
		}

		return opts;
	};

	return (
		<Scope className="storeengine-content-section">
			<Heading as="h3">
				{ __( 'Embed keys', 'storeengine' ) }
			</Heading>

			<Title as="p">
				{ __(
					'Generate an embed key for each external site that should embed your checkout. Each key is locked to a list of allowed origins (browser-checked on every request).',
					'storeengine'
				) }
			</Title>

			{ error && (
				<div className="bg-se-error-light border border-se-error rounded-se px-3 py-2 text-sm text-se-error mb-4">
					{ error }
				</div>
			) }

			{ revealedKey && (
				<div className="bg-se-success-light border border-se-success rounded-se p-4 mt-3 mb-4">
					<p className="text-sm font-semibold text-se-success m-0 mb-2">
						{ __(
							'Key created — copy it now, this is the only time the full value is shown.',
							'storeengine'
						) }
					</p>
					<div className="flex flex-wrap items-center gap-2">
						<code className="inline-block px-2 py-1 bg-se-white border border-se-success rounded-se text-sm text-se-text">
							{ revealedKey.embed_key }
						</code>
						<button
							type="button"
							className={
								copied
									? 'px-3 py-1 text-xs rounded-se border border-solid border-se-success bg-se-success-light text-se-success cursor-pointer'
									: 'px-3 py-1 text-xs rounded-se border border-solid border-se-border bg-se-white text-se-text hover:bg-se-bg cursor-pointer'
							}
							onClick={ () => copyToClipboard( revealedKey.embed_key ) }
						>
							{ copied
								? __( 'Copied!', 'storeengine' )
								: __( 'Copy', 'storeengine' ) }
						</button>
						<button
							type="button"
							className="px-3 py-1 text-xs rounded-se border border-solid border-se-border bg-se-white text-se-text hover:bg-se-bg cursor-pointer"
							onClick={ () => setRevealedKey( null ) }
						>
							{ __( 'Dismiss', 'storeengine' ) }
						</button>
					</div>
				</div>
			) }

			{ /*
			   Wrapper is a <div> not a <form> on purpose: this component is
			   rendered inside the Settings tab's outer Formik <form>, and HTML
			   forbids nested forms. A nested <form>'s submit button bubbles up
			   and submits the OUTER form, causing a full-page reload to
			   admin.php?... Use type="button" + onClick instead.
			*/ }
			<div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end mt-4 mb-4 p-4 bg-se-bg rounded-se border border-se-border">
				<label className="flex flex-col gap-1 text-xs text-se-subtitle">
					<span>{ __( 'Label', 'storeengine' ) }</span>
					<input
						type="text"
						className="px-3 py-2 border border-se-border rounded-se text-sm text-se-text bg-se-white focus:outline-none focus:border-se-primary"
						placeholder={ __(
							'e.g. Partner blog embed',
							'storeengine'
						) }
						value={ form.label }
						onChange={ ( e ) =>
							setForm( ( f ) => ( {
								...f,
								label: e.target.value,
							} ) )
						}
						onKeyDown={ ( e ) => {
							if ( e.key === 'Enter' ) {
								e.preventDefault();
								onCreate( e );
							}
						} }
					/>
				</label>
				<label className="flex flex-col gap-1 text-xs text-se-subtitle">
					<span>
						{ __(
							'Allowed origins (comma-separated)',
							'storeengine'
						) }
					</span>
					<input
						type="text"
						className="px-3 py-2 border border-se-border rounded-se text-sm text-se-text bg-se-white focus:outline-none focus:border-se-primary"
						placeholder="https://landing.example.com, https://blog.example.com"
						value={ form.allowed_origins }
						onChange={ ( e ) =>
							setForm( ( f ) => ( {
								...f,
								allowed_origins: e.target.value,
							} ) )
						}
						onKeyDown={ ( e ) => {
							if ( e.key === 'Enter' ) {
								e.preventDefault();
								onCreate( e );
							}
						} }
					/>
				</label>

				<Button
					preset="primary"
					disabled={ creating }
					onClick={ onCreate }
				>
					{ creating
						? __( 'Creating…', 'storeengine' )
						: __( 'Generate key', 'storeengine' ) }
				</Button>
			</div>

			<Table className="m-0 mt-3">
				<THead>
					<TR>
						<TH className="whitespace-nowrap">
							{ __( 'Label', 'storeengine' ) }
						</TH>
						<TH className="text-center whitespace-nowrap">
							{ __( 'Key', 'storeengine' ) }
						</TH>
						<TH className="text-center whitespace-nowrap">
							{ __( 'Allowed origins', 'storeengine' ) }
						</TH>
						<TH className="text-center whitespace-nowrap">
							{ __( 'Created', 'storeengine' ) }
						</TH>
						<TH className="text-center whitespace-nowrap">
							{ __( 'Last used', 'storeengine' ) }
						</TH>
						<TH className="text-center whitespace-nowrap">
							{ __( 'Actions', 'storeengine' ) }
						</TH>
					</TR>
				</THead>
				<tbody>
					{ loading && (
						<TR>
							<TD colSpan="6" className="py-4 text-center">
								<Preloader />
							</TD>
						</TR>
					) }
					{ ! loading && keys.length === 0 && (
						<TR>
							<TD colSpan="6">
								<CustomTableMessage
									title={ __(
										'No keys yet. Use the form above to create one.',
										'storeengine'
									) }
								/>
							</TD>
						</TR>
					) }
					{ ! loading &&
						keys.map( ( k ) => (
							<TR
								key={ k.id }
								className={ k.revoked_at ? 'opacity-50' : '' }
							>
								<TD>
									{ <span className='storeengine-title'>
										{k.label}
									</span> || (
										<em className="text-se-subtitle">
											{ __(
												'(no label)',
												'storeengine'
											) }
										</em>
									) }{ ' ' }
									{ k.is_system && (
										<span className="inline-block px-2 py-0.5 text-2xs rounded-se bg-se-primary-light text-se-primary">
											{ __( 'System', 'storeengine' ) }
										</span>
									) }{ ' ' }
									{ k.revoked_at && (
										<span className="inline-block px-2 py-0.5 text-2xs rounded-se bg-se-error-light text-se-error">
											{ __( 'Revoked', 'storeengine' ) }
										</span>
									) }
								</TD>
								<TD>
									<code className="text-xs text-se-text">
										{ k.embed_key }
									</code>
								</TD>
								<TD className="text-xs text-se-subtitle max-w-[240px] break-all">
									{ Array.isArray( k.allowed_origins ) &&
									k.allowed_origins.length ? (
										k.allowed_origins.join( ', ' )
									) : (
										<em className="text-se-subtitle">
											{ __( '(none)', 'storeengine' ) }
										</em>
									) }
								</TD>
								<TD className="text-xs text-se-subtitle whitespace-nowrap">
									{ fmtDate( k.created_at ) }
								</TD>
								<TD className="text-xs text-se-subtitle whitespace-nowrap">
									{ fmtDate( k.last_used_at ) }
								</TD>
								<TD className="text-center">
									{ buildMenuOptions( k ).length > 0 && (
										<OptionMenu
											options={ buildMenuOptions( k ) }
											suffix="embed-key-row"
										/>
									) }
								</TD>
							</TR>
						) ) }
				</tbody>
			</Table>
		</Scope>
	);
};

export default EmbedKeys;
