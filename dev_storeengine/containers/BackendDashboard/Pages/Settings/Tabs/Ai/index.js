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

const TONE_OPTIONS = [
	{ value: 'professional', label: __( 'Professional', 'storeengine' ) },
	{ value: 'friendly',     label: __( 'Friendly',     'storeengine' ) },
	{ value: 'persuasive',   label: __( 'Persuasive',   'storeengine' ) },
	{ value: 'minimal',      label: __( 'Minimal',      'storeengine' ) },
];

const Ai = ( { onRegisterSave, onSavingChange, onDirtyChange } ) => {
	const dispatch = useDispatch();
	const [ form, setForm ] = useState( null );
	const [ status, setStatus ] = useState( null );
	const saveRef = useRef( null );

	useEffect( () => {
		API.get( `${ namespace }ai/settings` )
			.then( ( { data } ) => setForm( { ...data } ) )
			.catch( () => {} );
		API.get( `${ namespace }ai/status` )
			.then( ( { data } ) => setStatus( data ) )
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
			const { data } = await API.post( `${ namespace }ai/settings`, form );
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

	const toneValue =
		TONE_OPTIONS.find( ( o ) => o.value === ( form.default_tone || 'professional' ) ) || null;

	return (
		<div className="se-admin-tw flex flex-col gap-6">
			{ status && ! status.available && (
				<div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-se-text">
					{ ! status.supported
						? __(
								'AI generation needs WordPress 7.0 or newer (the built-in AI Client).',
								'storeengine'
						  )
						: __( 'No AI provider is connected yet. ', 'storeengine' ) }
					{ status.supported && status.connectors_url && (
						<a
							href={ status.connectors_url }
							className="text-se-primary"
						>
							{ __( 'Set up Connectors', 'storeengine' ) }
						</a>
					) }
				</div>
			) }

			{ /* Generation defaults */ }
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
				<h3 className="storeengine-heading">
					{ __( 'Generation defaults', 'storeengine' ) }
				</h3>
				<p className="mt-1 mb-4 text-xs text-se-subtitle">
					{ __(
						'Applied to every generation unless overridden in the editor.',
						'storeengine'
					) }
				</p>

				<div className='flex flex-col gap-6'>
					<InputBox label={ __( 'Tone', 'storeengine' ) }>
						<Select
							{ ...rsProps }
							options={ TONE_OPTIONS }
							value={ toneValue }
							onChange={ ( opt ) =>
								set( 'default_tone', opt?.value || 'professional' )
							}
						/>
					</InputBox>

					<InputBox
						label={ __(
							'Language (leave blank for site language)',
							'storeengine'
						) }
					>
						<input
							type="text"
							value={ form.default_language || '' }
							placeholder={ __( 'e.g. English, German', 'storeengine' ) }
							onChange={ ( e ) =>
								set( 'default_language', e.target.value )
							}
							className="storeengine-input"
						/>
					</InputBox>

					<InputBox
						label={ __(
							'Creativity (0 = precise, 1 = creative)',
							'storeengine'
						) }
					>
						<input
							type="number"
							min={ 0 }
							max={ 1 }
							step={ 0.1 }
							value={ form.temperature ?? 0.7 }
							onChange={ ( e ) =>
								set( 'temperature', Number( e.target.value ) )
							}
							className="storeengine-input"
						/>
					</InputBox>

					<InputBox
						label={ __(
							'Preferred model (optional — blank uses the connector default)',
							'storeengine'
						) }
					>
						<input
							type="text"
							value={ form.model_preference || '' }
							placeholder={ __( 'e.g. claude-opus, gpt-4', 'storeengine' ) }
							onChange={ ( e ) =>
								set( 'model_preference', e.target.value )
							}
							className="storeengine-input"
						/>
					</InputBox>
				</div>
			</div>

			{ /* Product content */ }
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
				<h3 className="storeengine-heading">
					{ __( 'Product content', 'storeengine' ) }
				</h3>
				<label className="flex items-center gap-2 mt-3 text-sm text-se-text">
					<Switch
						checked={ !! form.image_alt_enabled }
						onChange={ ( next ) =>
							set( 'image_alt_enabled', next )
						}
					/>
					{ __( 'Offer AI image alt-text generation', 'storeengine' ) }
				</label>
			</div>
		</div>
	);
};

export default Ai;
