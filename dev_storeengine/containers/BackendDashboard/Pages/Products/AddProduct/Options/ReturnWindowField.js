import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { API, namespace, isAddonActive } from '@Utils/helper';
import InputBox from '@Components/InputBox';
import { Scope } from '@Components/ui';

/**
 * Per-product override for the global Returns eligibility window. Stored
 * as `_storeengine_returns_window_days` post-meta. 0 / blank = inherit.
 *
 * Saved via a side-channel REST endpoint instead of the main product save
 * pipeline so we don't need to extend the Formik shape across product /
 * variation save handlers.
 */
const ReturnWindowField = ( { productId } ) => {
	const [ value, setValue ] = useState( '' );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState( '' );
	const [ saved, setSaved ] = useState( false );

	useEffect( () => {
		if ( ! productId || ! isAddonActive( 'returns' ) ) return;
		API.get( `${ namespace }returns/products/${ productId }/window` )
			.then( ( res ) => {
				const days = res?.data?.days;
				setValue( days == null ? '' : String( days ) );
			} )
			.catch( () => {} );
	}, [ productId ] );

	if ( ! productId || ! isAddonActive( 'returns' ) ) return null;

	const persist = async ( raw ) => {
		setError( '' );
		setSaved( false );
		const days = Number( raw ) || 0;
		setSaving( true );
		try {
			await API.post(
				`${ namespace }returns/products/${ productId }/window`,
				{ days }
			);
			setSaved( true );
			setTimeout( () => setSaved( false ), 1500 );
		} catch ( e ) {
			setError( e?.response?.data?.message || e?.message || 'Save failed' );
		} finally {
			setSaving( false );
		}
	};

	return (
		<Scope as="div" className="storeengine-mt-6">
			<InputBox label={ __( 'Return window override (days)', 'storeengine' ) }>
				<div className='storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8'>
					<input
						type="number"
						min={ 0 }
						max={ 3650 }
						value={ value }
						placeholder={ __( 'inherit', 'storeengine' ) }
						onChange={ ( e ) => setValue( e.target.value ) }
						onBlur={ ( e ) => persist( e.target.value ) }
						className="storeengine-input w-1/2"
					/>
					<span className="text-xs text-se-subtitle">
						{ saving
							? __( 'Saving…', 'storeengine' )
							: saved
							? __( 'Saved', 'storeengine' )
							: __( '0 / blank = inherit global setting', 'storeengine' ) }
					</span>
				</div>
			</InputBox>
			{ error && (
				<div className="mt-[6px] text-xs text-se-error">
					{ error }
				</div>
			) }
		</Scope>
	);
};

export default ReturnWindowField;
