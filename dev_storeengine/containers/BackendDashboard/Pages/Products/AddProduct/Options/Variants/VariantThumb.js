import React, { useEffect, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

// attachment id → Promise<url>. Shared so a colour image used by ten variants
// is fetched once.
const urlCache = new Map();

const fetchThumbUrl = ( id ) => {
	if ( ! urlCache.has( id ) ) {
		urlCache.set(
			id,
			apiFetch( {
				path: `/wp/v2/media/${ id }?_fields=source_url,media_details`,
			} )
				.then(
					( media ) =>
						media?.media_details?.sizes?.thumbnail?.source_url ||
						media?.source_url ||
						''
				)
				.catch( () => '' )
		);
	}
	return urlCache.get( id );
};

/**
 * Read-only variant image preview for the variants table. Images are set in
 * the "Variant images" box above the table, so the row only shows the result.
 *
 * @param {Object} props
 * @param {number} props.imageId Attachment id (0 = none).
 */
const VariantThumb = ( { imageId } ) => {
	const id = parseInt( imageId, 10 ) || 0;
	const [ url, setUrl ] = useState( '' );

	useEffect( () => {
		let active = true;
		setUrl( '' );
		if ( id > 0 ) {
			fetchThumbUrl( id ).then( ( next ) => active && setUrl( next ) );
		}
		return () => {
			active = false;
		};
	}, [ id ] );

	return (
		<span
			className={ `storeengine-variants__thumb${
				url ? '' : ' storeengine-variants__thumb--empty'
			}` }
			title={
				url
					? undefined
					: __( 'Set images in “Variant images” above', 'storeengine' )
			}
		>
			{ url ? (
				<img src={ url } alt="" />
			) : (
				<span
					className="storeengine-icon storeengine-icon--image"
					aria-hidden={ true }
				/>
			) }
		</span>
	);
};

export default VariantThumb;
