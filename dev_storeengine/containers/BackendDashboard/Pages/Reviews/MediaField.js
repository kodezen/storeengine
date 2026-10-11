import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@Components/ui';
import CloseIcon from '@Components/Icons/CloseIcon';

/**
 * Review media picker backed by the WordPress media library (wp.media).
 *
 * `value` is an array of { id, url, thumb, type }. `onChange` receives the next
 * array. Accepts images and videos.
 */
const MediaField = ( { value = [], onChange } ) => {
	const openLibrary = () => {
		const wpMedia = window.wp && window.wp.media;
		if ( ! wpMedia ) {
			return;
		}

		const frame = wpMedia( {
			title: __( 'Select review media', 'storeengine' ),
			multiple: 'add',
			library: { type: [ 'image', 'video' ] },
			button: { text: __( 'Add to review', 'storeengine' ) },
		} );

		frame.on( 'select', () => {
			const selection = frame.state().get( 'selection' ).toJSON();
			const mapped = selection.map( ( item ) => ( {
				id: item.id,
				url: item.url,
				thumb:
					item.sizes && item.sizes.thumbnail
						? item.sizes.thumbnail.url
						: item.icon || item.url,
				type: item.type === 'video' ? 'video' : 'image',
			} ) );

			// Merge, de-duplicating by id.
			const byId = {};
			[ ...value, ...mapped ].forEach( ( m ) => {
				byId[ m.id ] = m;
			} );
			onChange( Object.values( byId ) );
		} );

		frame.open();
	};

	const removeItem = ( id ) => {
		onChange( value.filter( ( m ) => m.id !== id ) );
	};

	return (
		<div className="storeengine-review-media-field">
			<div className="storeengine-review-media-field__grid">
				{ value.map( ( item ) => (
					<div
						key={ item.id }
						className="storeengine-review-media-field__item"
					>
						{ item.type === 'video' ? (
							<video src={ item.url } muted playsInline />
						) : (
							<img src={ item.thumb || item.url } alt="" />
						) }
						<button
							type="button"
							className="storeengine-review-media-field__remove"
							onClick={ () => removeItem( item.id ) }
							aria-label={ __( 'Remove', 'storeengine' ) }
						>
							<CloseIcon />
						</button>
					</div>
				) ) }
			</div>
			<Button preset="outline" size="sm" onClick={ openLibrary }>
				{ __( 'Add photos or videos', 'storeengine' ) }
			</Button>
		</div>
	);
};

export default MediaField;
