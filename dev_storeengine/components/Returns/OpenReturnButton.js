import React, { useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import Button from '@Components/Button';
import { Compose } from '../../customer-returns/app/App';

/**
 * Tiny REST helper bound to the admin nonce, mimicking the shape that
 * Compose expects from CustomerApi (get/post). Lives inline so the admin
 * bundle doesn't take a dependency on a class that's only used here.
 */
const buildApi = ( nonce ) => {
	const base =
		( window.STOREENGINE?.restUrl || '/wp-json/' ) + 'storeengine/v1/';
	const request = async ( path, opts = {} ) => {
		const res = await fetch(
			base + path.replace( /^\//, '' ),
			{
				method: opts.method || 'GET',
				credentials: 'same-origin',
				headers: {
					Accept: 'application/json',
					'X-WP-Nonce': nonce,
					...( opts.body ? { 'Content-Type': 'application/json' } : {} ),
				},
				body: opts.body ? JSON.stringify( opts.body ) : undefined,
			}
		);
		const text = await res.text();
		const body = text
			? ( () => {
					try {
						return JSON.parse( text );
					} catch ( e ) {
						return text;
					}
			  } )()
			: null;
		if ( ! res.ok ) {
			const err = new Error(
				( body && body.message ) || `HTTP ${ res.status }`
			);
			err.code = body && body.code;
			err.body = body;
			throw err;
		}
		return body;
	};
	return {
		get: ( p ) => request( p ),
		post: ( p, b ) => request( p, { method: 'POST', body: b } ),
	};
};

const OpenReturnButton = ( { orderId, customerId = 0, onCreated } ) => {
	const [ open, setOpen ] = useState( false );
	const nonce =
		window.STOREENGINE?.nonce || window.wpApiSettings?.nonce || '';
	const api = useMemo( () => buildApi( nonce ), [ nonce ] );

	if ( ! orderId ) return null;

	return (
		<>
			<Button
				type="button"
				label={ __( 'Open return', 'storeengine' ) }
				preset="gray"
				onClick={ () => setOpen( true ) }
			/>
			{ open && (
				<div
					className="se-admin-tw"
					style={ {
						position: 'fixed',
						inset: 0,
						background: 'rgba(0,0,0,0.4)',
						zIndex: 9999,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '16px',
					} }
				>
					<div
						style={ {
							width: '100%',
							maxWidth: 720,
							maxHeight: '90vh',
							overflow: 'auto',
							background: '#fff',
							borderRadius: 6,
							boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
						} }
					>
						<Compose
							api={ api }
							orderId={ orderId }
							customerId={ customerId }
							staffMode={ true }
							onDone={ () => {
								setOpen( false );
								if ( onCreated ) onCreated();
							} }
							onCancel={ () => setOpen( false ) }
						/>
					</div>
				</div>
			) }
		</>
	);
};

export default OpenReturnButton;
