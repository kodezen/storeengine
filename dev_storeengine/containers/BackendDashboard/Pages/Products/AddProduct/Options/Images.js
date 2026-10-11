import { useFormikContext } from 'formik';
import React, { useState } from 'react';
import Gallery from '@Components/UploadImage/Gallery';
import GalleryVideoModal from '@Components/UploadImage/GalleryVideoModal';
import { __ } from '@wordpress/i18n';
import { Scope, Heading, Button } from '@Components/ui';
import { FieldGate } from '../productFormConfig';
import AiGenerateInline from './ai/AiGenerateInline';

/**
 * Build the unified, ordered gallery list from Formik. Prefers the unified
 * `_storeengine_product_gallery` meta; falls back to the legacy featured image +
 * gallery ids + gallery videos so existing products keep working until re-saved.
 */
const buildItems = ( values ) => {
	const unified = values?.meta?._storeengine_product_gallery;
	if ( Array.isArray( unified ) && unified.length ) {
		return unified;
	}
	const items = [];
	if ( values?.featured_media ) {
		items.push( { type: 'image', id: values.featured_media } );
	}
	( values?.meta?._storeengine_product_gallery_ids ?? [] ).forEach( ( id ) =>
		items.push( { type: 'image', id } )
	);
	( values?.meta?._storeengine_product_gallery_videos ?? [] ).forEach( ( v ) =>
		items.push( {
			type: 'video',
			url: v?.url || '',
			poster_id: v?.poster_id || 0,
		} )
	);
	return items;
};

const Images = () => {
	const { values, setFieldValue } = useFormikContext();
	// { open, index } — index is null for add, or the item index for edit.
	const [ videoModal, setVideoModal ] = useState( { open: false, index: null } );

	const items = buildItems( values );

	// Persist the unified list and keep the legacy fields (featured image,
	// gallery ids, gallery videos) in sync so the storefront + other consumers
	// keep working.
	const handleChange = ( next ) => {
		const imageIds = next
			.filter( ( i ) => i?.type === 'image' && i.id )
			.map( ( i ) => i.id );
		const videos = next
			.filter( ( i ) => i?.type === 'video' && i.url )
			.map( ( i ) => ( { url: i.url, poster_id: i.poster_id || 0 } ) );

		setFieldValue( 'meta._storeengine_product_gallery', next );
		setFieldValue( 'featured_media', imageIds[ 0 ] || 0 );
		setFieldValue(
			'meta._storeengine_product_gallery_ids',
			imageIds.slice( 1 )
		);
		setFieldValue( 'meta._storeengine_product_gallery_videos', videos );
	};

	const openAddVideo = () => setVideoModal( { open: true, index: null } );
	const openEditVideo = ( index ) =>
		setVideoModal( { open: true, index } );
	const closeVideoModal = () =>
		setVideoModal( { open: false, index: null } );

	const saveVideo = ( video ) => {
		const item = { type: 'video', ...video };
		if ( videoModal.index === null ) {
			handleChange( [ ...items, item ] );
		} else {
			handleChange(
				items.map( ( it, i ) =>
					i === videoModal.index ? item : it
				)
			);
		}
		closeVideoModal();
	};

	const editingInitial =
		videoModal.index !== null ? items[ videoModal.index ] || {} : {};

	return (
		<Scope
			as="div"
			id="media"
			className="storeengine-content-section"
		>
			<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-justify-between pb-4 mb-6 border-b border-se-border">
				<h3 className="m-0 text-lg font-medium text-se-text">{ __( 'Gallery', 'storeengine' ) }</h3>
				<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8">
					<Button
						type="button"
						preset="outline"
						size="sm"
						icon="storeengine-icon--add"
						onClick={ openAddVideo }
					>
						{ __( 'Add video', 'storeengine' ) }
					</Button>
					<AiGenerateInline field="image_alt" requireFeaturedImage />
				</div>
			</div>

			<FieldGate id="featured_image">
				<Gallery
					value={ items }
					onChange={ handleChange }
					onEditVideo={ openEditVideo }
					featureImage={ true }
				/>
			</FieldGate>

			<ul className="storeengine-gallery__hint">
				<li>
					<span className="storeengine-icon storeengine-icon--drag" aria-hidden="true" />
					{ __( 'Drag to reorder', 'storeengine' ) }
				</li>
				<li>
					<span className="storeengine-icon storeengine-icon--image" aria-hidden="true" />
					{ __( 'First image is the featured image', 'storeengine' ) }
				</li>
				<li>
					<span className="storeengine-icon storeengine-icon--play" aria-hidden="true" />
					{ __( 'Videos: YouTube, Vimeo, mp4, webm', 'storeengine' ) }
				</li>
			</ul>

			<GalleryVideoModal
				isOpen={ videoModal.open }
				initial={ editingInitial }
				onSave={ saveVideo }
				onClose={ closeVideoModal }
			/>
		</Scope>
	);
};

export default Images;
