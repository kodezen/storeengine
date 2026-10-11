import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { useFormikContext } from 'formik';
import { API, namespace, isAddonActive } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import useAiStatus from './useAiStatus';

/**
 * Compact pill button that generates AI copy for a single product field.
 *
 * Renders nothing unless the `ai` addon is active, a provider is connected, and
 * the product has been saved (generation needs an id for context). Errors are
 * surfaced through the global notification rail so the button stays stateless
 * about error display.
 */
const AiGenerateInline = ( {
	field,
	targetName = '',
	onResult = null,
	requireFeaturedImage = false,
	className = '',
} ) => {
	const { values, setFieldValue } = useFormikContext();
	const dispatch = useDispatch();
	const status = useAiStatus();
	const [ busy, setBusy ] = useState( false );
	const [ done, setDone ] = useState( false );

	const id = Number( values?.id ) || 0;

	if ( ! isAddonActive( 'ai' ) || ! status.available || ! id ) {
		return null;
	}
	if ( requireFeaturedImage && ! values?.featured_media ) {
		return null;
	}

	const run = () => {
		setBusy( true );
		setDone( false );
		API.post( `${ namespace }ai/product/generate`, {
			product_id: id,
			field,
		} )
			.then( ( { data } ) => {
				if ( data && typeof data.text === 'string' ) {
					if ( onResult ) {
						onResult( data.text );
					} else if ( targetName ) {
						setFieldValue( targetName, data.text );
					}
					setDone( true );
				}
			} )
			.catch( ( err ) => {
				const message =
					err?.response?.data?.message ||
					err?.message ||
					__( 'Generation failed. Please try again.', 'storeengine' );
				dispatch(
					showNotification( {
						message,
						isShow: true,
						type: 'error',
					} )
				);
			} )
			.finally( () => setBusy( false ) );
	};

	return (
		<span className="inline-flex items-center gap-2">
			<button
				type="button"
				onClick={ run }
				disabled={ busy }
				className={ `inline-flex items-center gap-1 rounded-full border border-se-border px-2.5 py-1 text-xs text-se-primary bg-white hover:bg-se-bg disabled:opacity-40 transition-colors cursor-pointer ${ className }` }
			>
				<span aria-hidden="true">✨</span>
				{ busy
					? __( 'Generating…', 'storeengine' )
					: __( 'Generate with AI', 'storeengine' ) }
			</button>
			{ done && ! targetName && (
				<span className="text-xs text-green-600">
					{ __( 'Saved', 'storeengine' ) }
				</span>
			) }
		</span>
	);
};

export default AiGenerateInline;
