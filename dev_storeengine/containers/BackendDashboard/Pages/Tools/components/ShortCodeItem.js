import React, { useRef } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { useDispatch } from 'react-redux';

const ShortCodeItem = ( { shortCodeItem } ) => {
	const { title, shortCode, description, url } = shortCodeItem;
	const shortCodeRef = useRef( null );
	const dispatch = useDispatch();
	const copyToClipboard = ( e ) => {
		shortCodeRef.current.select();
		document.execCommand( 'copy' );
		e.target.focus();
		dispatch(
			showNotification( {
				message: sprintf(
					// translators: %s. Shortcode.
					__( '"%s" Shortcode Copied', 'storeengine' ),
					title
				),
				isShow: true,
				type: 'success',
			} )
		);
	};

	return (
		<div className="flex items-center w-full pb-6">
			<div className="w-[200px]">
				<h3 className="text-sm font-medium text-se-text m-0">
					{ title }
				</h3>
			</div>

			<div className="w-[calc(100%-200px)]">
				<div className="flex items-center gap-5">
					<div className="relative w-[90%]">
						<input
							type="text"
							ref={ shortCodeRef }
							className="w-full bg-se-bg border border-se-border rounded-se text-base text-se-subtitle py-[11px] pl-3.5 pr-11"
							onClick={ ( e ) => e.target.select() }
							value={ shortCode }
							readOnly
						/>
						<button
							type="button"
							onClick={ copyToClipboard }
							aria-label={ __( 'Copy shortcode', 'storeengine' ) }
							className="absolute top-px right-px bottom-px flex items-center px-3 bg-transparent border-0 border-l border-solid border-se-border cursor-pointer text-se-primary"
						>
							<span
								className="storeengine-icon storeengine-icon--copy text-xl"
								aria-hidden={ true }
							/>
						</button>
					</div>
					{ url && (
						<a
							href={ url }
							target="_blank"
							rel="noreferrer"
							aria-label={ __( 'View documentation', 'storeengine' ) }
							className="flex items-center justify-center w-[34px] h-[34px] shrink-0 border border-solid border-se-border rounded-full text-se-text no-underline"
						>
							<span
								className="storeengine-icon storeengine-icon--question text-base"
								aria-hidden={ true }
							/>
						</a>
					) }
				</div>
				<div className="pt-1">
					<p className="text-xs italic leading-[22px] text-se-text m-0">
						<span className="text-se-subtitle font-medium">
							{ __( 'You can use:', 'storeengine' ) }
						</span>
						{ description }
					</p>
				</div>
			</div>
		</div>
	);
};

export default ShortCodeItem;
