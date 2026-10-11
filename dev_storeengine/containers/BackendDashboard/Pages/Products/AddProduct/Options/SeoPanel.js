import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Scope, Heading, Button, Switch } from '@Components/ui';
import { API, namespace } from '@Utils/helper';

/**
 * Per-product SEO panel injected into the product editor sidebar via the
 * `storeengine.product.editor.sidebar` filter (registered in backend.js).
 *
 * Self-contained: reads/writes the `_storeengine_seo_*` postmeta through
 * `storeengine/v1/seo/products/{id}/meta` with its own Save button, independent
 * of the product form's Formik submit. The free SEO engine reads that postmeta,
 * so overrides flow into the head, the bridge graft, and the headless `seo`
 * REST object. AI buttons call `storeengine/v1/seo/generate`.
 */
const SeoPanel = ( { productId } ) => {
	const id = Number( productId ) || 0;

	const [ meta, setMeta ] = useState( { title: '', desc: '', robots: '' } );
	const [ aiAvailable, setAiAvailable ] = useState( false );
	const [ aiUrl, setAiUrl ] = useState( '' );
	const [ saving, setSaving ] = useState( false );
	const [ saved, setSaved ] = useState( false );
	const [ gen, setGen ] = useState( '' ); // which field is generating

	const applyMeta = ( data ) => {
		setMeta( {
			title: data.title || '',
			desc: data.desc || '',
			robots: data.robots || '',
		} );
		setAiAvailable( !! data.ai_available );
		setAiUrl( data.ai_settings_url || '' );
	};

	useEffect( () => {
		if ( ! id ) {
			return;
		}
		// The product-meta endpoint returns the saved meta plus AI availability.
		API.get( `${ namespace }seo/products/${ id }/meta` )
			.then( ( { data } ) => applyMeta( data ) )
			.catch( () => {} );
	}, [ id ] );

	if ( ! id ) {
		return (
			<Scope as="div" className="storeengine-content-section">
				<Heading>{ __( 'SEO', 'storeengine' ) }</Heading>
				<p className="text-sm text-se-subtitle">
					{ __(
						'Save the product first to add custom SEO.',
						'storeengine'
					) }
				</p>
			</Scope>
		);
	}

	const set = ( key, value ) => {
		setMeta( { ...meta, [ key ]: value } );
		setSaved( false );
	};

	const save = () => {
		setSaving( true );
		setSaved( false );
		API.post( `${ namespace }seo/products/${ id }/meta`, meta )
			.then( ( { data } ) => {
				applyMeta( data );
				setSaved( true );
			} )
			.finally( () => setSaving( false ) );
	};

	const generate = ( field ) => {
		const type = 'title' === field ? 'title' : 'description';
		setGen( field );
		API.post( `${ namespace }seo/generate`, { product_id: id, type } )
			.then( ( { data } ) => {
				if ( data && data.text ) {
					set( field, data.text );
				}
			} )
			.finally( () => setGen( '' ) );
	};

	const aiButton = ( field ) =>
		aiAvailable ? (
			<button
				type="button"
				onClick={ () => generate( field ) }
				disabled={ !! gen }
				className="text-xs text-se-primary disabled:opacity-50"
			>
				{ gen === field
					? __( 'Generating…', 'storeengine' )
					: __( '✨ Generate', 'storeengine' ) }
			</button>
		) : null;

	return (
		<Scope as="div" className="storeengine-content-section">
			<Heading>{ __( 'SEO', 'storeengine' ) }</Heading>

			<div className="mb-3">
				<div className="flex items-center justify-between mb-1">
					<label className="text-sm text-se-text">
						{ __( 'SEO title', 'storeengine' ) }
					</label>
					{ aiButton( 'title' ) }
				</div>
				<input
					type="text"
					maxLength={ 120 }
					value={ meta.title }
					placeholder={ __( 'Defaults to the product name', 'storeengine' ) }
					onChange={ ( e ) => set( 'title', e.target.value ) }
					className="storeengine-input w-full"
				/>
			</div>

			<div className="mb-3">
				<div className="flex items-center justify-between mb-1">
					<label className="text-sm text-se-text">
						{ __( 'Meta description', 'storeengine' ) }
					</label>
					{ aiButton( 'desc' ) }
				</div>
				<textarea
					rows={ 3 }
					maxLength={ 320 }
					value={ meta.desc }
					placeholder={ __( 'Defaults to the excerpt', 'storeengine' ) }
					onChange={ ( e ) => set( 'desc', e.target.value ) }
					className="storeengine-textarea w-full"
				/>
			</div>

			<label className="flex items-center gap-2 text-sm text-se-text mb-3">
				<Switch
					checked={ 'noindex' === meta.robots }
					onChange={ ( next ) =>
						set( 'robots', next ? 'noindex' : '' )
					}
				/>
				{ __( 'Hide from search engines (noindex)', 'storeengine' ) }
			</label>

			{ ! aiAvailable && (
				<p className="text-xs text-se-subtitle mb-2">
					{ __( 'Connect WordPress AI to auto-generate. ', 'storeengine' ) }
					{ aiUrl && (
						<a href={ aiUrl } className="text-se-primary">
							{ __( 'Set up', 'storeengine' ) }
						</a>
					) }
				</p>
			) }

			<div className="flex items-center gap-2">
				<Button
					preset="primary"
					size="sm"
					onClick={ save }
					isLoading={ saving }
				>
					{ __( 'Save SEO', 'storeengine' ) }
				</Button>
				{ saved && (
					<span className="text-xs text-se-success">
						{ __( 'Saved.', 'storeengine' ) }
					</span>
				) }
			</div>
		</Scope>
	);
};

export default SeoPanel;
