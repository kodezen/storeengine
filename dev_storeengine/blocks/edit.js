/**
 * StoreEngine generic shortcode block — editor.
 *
 * Renders from the registry StoreEngine prints to the editor: a grouped picker,
 * one control per attribute descriptor, a live ServerSideRender preview, and a
 * Convert-to-aBlocks action (toolbar + a styled sidebar card) driven by the
 * descriptor's `ablocks_block` mapping — or an "Install aBlocks" promotion.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	Button,
	TextareaControl,
	ComboboxControl,
} from '@wordpress/components';
import { createBlock, getBlockType } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect, RawHTML } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	getShortcodes,
	getFlatOptions,
	getDescriptor,
	isVisible,
	aBlocksState,
} from './registry';
import AttributeControl from './AttributeControl';
import ShortcodePicker from './ShortcodePicker';

/**
 * Live server preview of the selected shortcode.
 *
 * We deliberately do NOT use <ServerSideRender>. That component runs the block's
 * attributes through `__experimentalSanitizeBlockAttributes`, which re-expands
 * them against the block's *full registered schema* — including attributes other
 * plugins inject into every block via `blocks.registerBlockType` (membership /
 * restriction fields, etc.) that aren't mirrored in the PHP block registration.
 * The core block-renderer endpoint validates with `additionalProperties:false`
 * and rejects those foreign keys with "Invalid parameter(s): attributes",
 * breaking the preview for every shortcode.
 *
 * Instead we call the same block-renderer endpoint directly, sending ONLY our
 * three real attributes ({ shortcode, atts, content }) — no sanitize step, no
 * foreign attributes, so validation always passes.
 */
function ShortcodePreview( { shortcode, atts, content } ) {
	const [ state, setState ] = useState( { loading: true, html: '', error: '' } );
	// The page being edited, so funnel shortcodes can resolve their step/funnel
	// context in the preview. Optional — absent in the site/widget editors.
	const postId = useSelect(
		( select ) => select( 'core/editor' )?.getCurrentPostId?.() ?? 0,
		[]
	);
	// Re-fetch whenever the meaningful inputs change.
	const key = JSON.stringify( { shortcode, atts, content, postId } );

	useEffect( () => {
		let cancelled = false;
		setState( ( prev ) => ( { ...prev, loading: true, error: '' } ) );

		apiFetch( {
			path: addQueryArgs( '/wp/v2/block-renderer/storeengine/shortcode', {
				context: 'edit',
			} ),
			method: 'POST',
			data: {
				attributes: { shortcode, atts, content },
				...( postId ? { post_id: postId } : {} ),
			},
		} )
			.then( ( res ) => {
				if ( ! cancelled ) {
					setState( { loading: false, html: res?.rendered ?? '', error: '' } );
				}
			} )
			.catch( ( err ) => {
				if ( ! cancelled ) {
					setState( {
						loading: false,
						html: '',
						error: err?.message || __( 'Could not load preview.', 'storeengine' ),
					} );
				}
			} );

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ key ] );

	if ( state.loading ) {
		return (
			<div className="storeengine-shortcode-preview is-loading">
				<Spinner />
			</div>
		);
	}
	if ( state.error ) {
		return <div className="storeengine-shortcode-preview is-error">{ state.error }</div>;
	}
	if ( ! state.html || '' === state.html.trim() ) {
		return (
			<div className="storeengine-shortcode-preview is-empty">
				{ __( 'This shortcode has nothing to preview here yet — it renders on the front end.', 'storeengine' ) }
			</div>
		);
	}
	return (
		<div
			className="storeengine-shortcode-preview__frame"
			onClickCapture={ swallowNavigation }
			onSubmitCapture={ swallowNavigation }
			onKeyDownCapture={ swallowKeyActivation }
		>
			<RawHTML className="storeengine-shortcode-preview">{ state.html }</RawHTML>
		</div>
	);
}

/**
 * A preview is server-rendered front-end markup, so its links, buttons and
 * forms are real. Inside the editor the canvas is an iframe, so following one
 * navigates THAT iframe to the front end — the block disappears, and every
 * subsequent core hook that reads the canvas window throws
 * "Blocked a frame with origin … from accessing a cross-origin frame".
 *
 * CSS neutralises pointer events (see editor.scss); these handlers are the
 * safety net for keyboard activation and for markup that re-enables pointer
 * events itself. `preventDefault` only — the event still bubbles so clicking
 * the preview selects the block, as it should.
 *
 * @param {Object} event React synthetic event.
 */
function swallowNavigation( event ) {
	const target = event.target?.closest?.( 'a[href], button, form, [role="link"]' );

	if ( target || 'submit' === event.type ) {
		event.preventDefault();
	}
}

/**
 * Enter/Space on a focused link inside the preview activates it just like a
 * click would.
 *
 * @param {Object} event React synthetic event.
 */
function swallowKeyActivation( event ) {
	if ( 'Enter' !== event.key && ' ' !== event.key ) {
		return;
	}

	if ( event.target?.closest?.( 'a[href], button, [role="link"]' ) ) {
		event.preventDefault();
	}
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const blockProps = useBlockProps();
	const { shortcode, atts = {}, content = '' } = attributes;
	const descriptor = getDescriptor( shortcode );
	const ablocks = aBlocksState();
	const { replaceBlocks } = useDispatch( 'core/block-editor' );

	const setAtt = ( name, value ) =>
		setAttributes( { atts: { ...atts, [ name ]: value } } );

	/* ---- Empty state: pick a shortcode ---- */
	if ( ! descriptor ) {
		const shortcodes = getShortcodes();
		const pick = ( v ) =>
			v && setAttributes( { shortcode: v, atts: {}, content: '' } );
		return (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Shortcode', 'storeengine' ) } initialOpen={ true }>
						<div className="storeengine-sc-field">
							<span className="storeengine-sc-field__label">
								{ __( 'Shortcode', 'storeengine' ) }
							</span>
							<ShortcodePicker value="" onChange={ pick } />
						</div>
					</PanelBody>
				</InspectorControls>
				<div { ...blockProps }>
					<Placeholder
						icon="shortcode"
						label={ __( 'StoreEngine Shortcode', 'storeengine' ) }
						instructions={
							shortcodes.length
								? __( 'Choose a shortcode to insert — or pick one from the Block settings sidebar.', 'storeengine' )
								: __( 'No shortcode blocks are registered yet.', 'storeengine' )
						}
						className="storeengine-shortcode-placeholder"
					>
						{ shortcodes.length > 0 && (
							<div className="storeengine-shortcode-picker-wrap">
								<ComboboxControl
									value={ null }
									options={ getFlatOptions() }
									onChange={ pick }
									placeholder={ __( 'Search shortcodes…', 'storeengine' ) }
									__next40pxDefaultSize
									__nextHasNoMarginBottom
								/>
							</div>
						) }
					</Placeholder>
				</div>
			</>
		);
	}

	/* ---- Convert wiring ---- */
	const targetBlock = descriptor.ablocks_block || '';
	const canConvert = ablocks.active && targetBlock && !! getBlockType( targetBlock );

	const convert = () => {
		if ( ! canConvert ) {
			return;
		}
		const map = descriptor.ablocks_map || {};
		const mapped = {};
		Object.keys( atts || {} ).forEach( ( k ) => {
			if ( map[ k ] ) {
				mapped[ map[ k ] ] = atts[ k ];
			}
		} );
		replaceBlocks( clientId, createBlock( targetBlock, mapped ) );
	};

	/* ---- Configured state ---- */
	const groups = {};
	descriptor.attributes.forEach( ( a ) => {
		( groups[ a.group ] = groups[ a.group ] || [] ).push( a );
	} );
	const groupNames = Object.keys( groups );
	const previewMode = descriptor.preview?.mode || 'server';

	return (
		<div { ...blockProps }>
			<InspectorControls>
				{ /* Styling / convert card — deliberately NOT a plain panel. */ }
				{ ( canConvert || ! ablocks.active ) && (
					<div className="storeengine-sc-promo">
						{ canConvert ? (
							<>
								<div className="storeengine-sc-promo__head">
									<span className="storeengine-sc-promo__badge">aBlocks</span>
									<strong>{ __( 'Style this block', 'storeengine' ) }</strong>
								</div>
								<p>{ __( 'Convert to the styled aBlocks block for drag-and-drop design — your settings carry over.', 'storeengine' ) }</p>
								<Button variant="primary" className="storeengine-sc-promo__btn" onClick={ convert }>
									{ __( 'Convert to styled block', 'storeengine' ) }
								</Button>
							</>
						) : (
							<>
								<div className="storeengine-sc-promo__head">
									<span className="storeengine-sc-promo__badge storeengine-sc-promo__badge--muted">aBlocks</span>
									<strong>{ __( 'Want visual styling?', 'storeengine' ) }</strong>
								</div>
								<p>{ __( 'This renders the shortcode unstyled. Install aBlocks for drag-and-drop styling and one-click convert.', 'storeengine' ) }</p>
								{ ablocks.install_url && (
									<Button variant="primary" className="storeengine-sc-promo__btn" href={ ablocks.install_url }>
										{ __( 'Install aBlocks', 'storeengine' ) }
									</Button>
								) }
							</>
						) }
					</div>
				) }

				<PanelBody title={ __( 'Shortcode', 'storeengine' ) } initialOpen={ true }>
					<div className="storeengine-sc-field">
						<span className="storeengine-sc-field__label">{ __( 'Shortcode', 'storeengine' ) }</span>
						<ShortcodePicker
							value={ shortcode }
							onChange={ ( v ) =>
								v && v !== shortcode &&
								setAttributes( { shortcode: v, atts: {}, content: '' } )
							}
						/>
					</div>
					{ descriptor.description && (
						<p className="storeengine-shortcode-desc">{ descriptor.description }</p>
					) }
				</PanelBody>

				{ groupNames.map( ( groupName, i ) => (
					<PanelBody key={ groupName } title={ groupName } initialOpen={ i === 0 }>
						{ groups[ groupName ]
							.filter( ( a ) => isVisible( a, descriptor, atts ) )
							.map( ( a ) => (
								<AttributeControl
									key={ a.name }
									attr={ a }
									atts={ atts }
									setAtt={ setAtt }
								/>
							) ) }
					</PanelBody>
				) ) }

				{ descriptor.content?.supported && descriptor.content.mode === 'plain' && (
					<PanelBody
						title={ descriptor.content.label || __( 'Content', 'storeengine' ) }
						initialOpen={ false }
					>
						<TextareaControl
							value={ content }
							onChange={ ( v ) => setAttributes( { content: v } ) }
						/>
					</PanelBody>
				) }
			</InspectorControls>

			{ previewMode === 'server' ? (
					<ShortcodePreview shortcode={ shortcode } atts={ atts } content={ content } />
				) : (
				<div className="storeengine-shortcode-card">
					<code className="storeengine-shortcode-card__tag">[{ descriptor.tag }]</code>
					<span className="storeengine-shortcode-card__note">
						{ descriptor.preview?.note ||
							__( 'This shortcode renders on the front end.', 'storeengine' ) }
					</span>
				</div>
			) }
		</div>
	);
}
