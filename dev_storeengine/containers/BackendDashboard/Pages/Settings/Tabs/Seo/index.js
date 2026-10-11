import React, { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { Select } from '@Components/ui/Select';
import InputBox from '@Components/InputBox';
import { Switch } from '@Components/ui';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import SettingsSkeleton from '@Components/Loader/SettingsSkeleton';

const rsProps = {
	className: 'storeengine-select',
	classNamePrefix: 'storeengine-react-select',
};

const MODE_OPTIONS = [
	{
		value: 'auto',
		label: __( 'Auto (bridge if an SEO plugin is active)', 'storeengine' ),
	},
	{
		value: 'standalone',
		label: __( 'Standalone (StoreEngine owns SEO output)', 'storeengine' ),
	},
	{
		value: 'bridge',
		label: __( 'Bridge only (never output standalone)', 'storeengine' ),
	},
];

const TWITTER_CARD_OPTIONS = [
	{
		value: 'summary_large_image',
		label: __( 'Large image summary', 'storeengine' ),
	},
	{ value: 'summary', label: __( 'Summary', 'storeengine' ) },
];

const Seo = ( { onRegisterSave, onSavingChange, onDirtyChange } ) => {
	const dispatch = useDispatch();
	const [ form, setForm ] = useState( null );
	const saveRef = useRef( null );

	useEffect( () => {
		API.get( `${ namespace }seo/settings` )
			.then( ( { data } ) => setForm( { ...data } ) )
			.catch( () => {} );
	}, [] );

	const set = ( key, value ) => {
		setForm( ( f ) => ( { ...f, [ key ]: value } ) );
		onDirtyChange?.( true );
	};

	const onSave = async () => {
		if ( ! form ) return;
		onSavingChange?.( true );
		try {
			const { data } = await API.post( `${ namespace }seo/settings`, form );
			setForm( { ...data } );
			onDirtyChange?.( false );
			dispatch(
				showNotification( {
					message: __( 'Settings saved.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
		} catch ( e ) {
			dispatch(
				showNotification( {
					message: __( 'Save failed.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		} finally {
			onSavingChange?.( false );
		}
	};

	saveRef.current = onSave;

	useEffect( () => {
		onRegisterSave?.( () => saveRef.current?.() );
		return () => onRegisterSave?.( null );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	if ( ! form ) {
		return <SettingsSkeleton />;
	}

	const checkbox = ( key, label ) => (
		<label className="flex items-center gap-2 mt-3 text-sm text-se-text">
			<Switch
				checked={ !! form[ key ] }
				onChange={ ( next ) => set( key, next ) }
			/>
			{ label }
		</label>
	);

	const modeValue =
		MODE_OPTIONS.find( ( o ) => o.value === ( form.mode || 'auto' ) ) || null;

	const twitterCardValue =
		TWITTER_CARD_OPTIONS.find(
			( o ) =>
				o.value === ( form.twitter_card_type || 'summary_large_image' )
		) || null;

	return (
		<div className="se-admin-tw flex flex-col gap-6">
			{ /* Integration mode */ }
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
				<h3 className="storeengine-heading">
					{ __( 'Integration mode', 'storeengine' ) }
				</h3>
				<p className="mt-1 mb-4 text-xs text-se-subtitle">
					{ __(
						'How StoreEngine outputs SEO. "Auto" bridges into an active SEO plugin (Yoast, Rank Math, AIOSEO, SEOPress) and only takes over when none is present.',
						'storeengine'
					) }
				</p>
				<InputBox label={ __( 'Mode', 'storeengine' ) }>
					<Select
						{ ...rsProps }
						options={ MODE_OPTIONS }
						value={ modeValue }
						onChange={ ( opt ) =>
							set( 'mode', opt?.value || 'auto' )
						}
					/>
				</InputBox>
			</div>

			{ /* Structured data */ }
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
				<h3 className="storeengine-heading">
					{ __( 'Structured data (schema.org)', 'storeengine' ) }
				</h3>
				<p className="mt-1 text-xs text-se-subtitle">
					{ __(
						'Emits Product schema with price, availability and ratings, plus breadcrumbs — the data Google needs for rich results.',
						'storeengine'
					) }
				</p>
				{ checkbox(
					'schema_product_enabled',
					__( 'Output Product schema (offers, stock, rating)', 'storeengine' )
				) }
				{ checkbox(
					'schema_breadcrumb_enabled',
					__( 'Output BreadcrumbList schema', 'storeengine' )
				) }
			</div>

			{ /* Social sharing */ }
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
				<h3 className="storeengine-heading">
					{ __( 'Social sharing', 'storeengine' ) }
				</h3>
				{ checkbox(
					'og_enabled',
					__( 'Output Open Graph & Twitter card tags', 'storeengine' )
				) }
				<div className="mt-4 flex flex-col gap-6">
					<InputBox label={ __( 'Twitter card type', 'storeengine' ) }>
						<Select
							{ ...rsProps }
							options={ TWITTER_CARD_OPTIONS }
							value={ twitterCardValue }
							onChange={ ( opt ) =>
								set(
									'twitter_card_type',
									opt?.value || 'summary_large_image'
								)
							}
						/>
					</InputBox>
					<InputBox
						label={ __( 'Twitter site handle (@username)', 'storeengine' ) }
					>
						<input
							type="text"
							value={ form.twitter_site || '' }
							placeholder="@store"
							onChange={ ( e ) =>
								set( 'twitter_site', e.target.value )
							}
							className="storeengine-input"
						/>
					</InputBox>
				</div>
			</div>

			{ /* Organization */ }
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
				<h3 className="storeengine-heading">
					{ __( 'Organization', 'storeengine' ) }
				</h3>
				<p className="mt-1 mb-4 text-xs text-se-subtitle">
					{ __(
						'Used as the brand on Product schema and Organization markup.',
						'storeengine'
					) }
				</p>
				<InputBox label={ __( 'Brand / organization name', 'storeengine' ) }>
					<input
						type="text"
						value={ form.org_name || '' }
						onChange={ ( e ) => set( 'org_name', e.target.value ) }
						className="storeengine-input"
					/>
				</InputBox>
			</div>

			{ /* Search visibility */ }
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
				<h3 className="storeengine-heading">
					{ __( 'Search visibility', 'storeengine' ) }
				</h3>
				<p className="mt-1 text-xs text-se-subtitle">
					{ __(
						'Keep transactional pages out of search results. Recommended on for all four.',
						'storeengine'
					) }
				</p>
				{ checkbox( 'noindex_cart', __( 'noindex Cart', 'storeengine' ) ) }
				{ checkbox( 'noindex_checkout', __( 'noindex Checkout', 'storeengine' ) ) }
				{ checkbox( 'noindex_account', __( 'noindex Account / dashboard', 'storeengine' ) ) }
				{ checkbox( 'noindex_thankyou', __( 'noindex Order received', 'storeengine' ) ) }
			</div>
		</div>
	);
};

export default Seo;
