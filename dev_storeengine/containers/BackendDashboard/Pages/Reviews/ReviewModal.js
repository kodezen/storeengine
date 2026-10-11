import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import Modal from '@Components/Modal';
import ProductPicker from '@Components/ProductPicker';
import { Button, Field, Select } from '@Components/ui';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import Stars from './Stars';
import MediaField from './MediaField';

const STATUS_OPTIONS = [
	{ value: 'approve', label: __( 'Approved', 'storeengine' ) },
	{ value: 'hold', label: __( 'Pending', 'storeengine' ) },
	{ value: 'spam', label: __( 'Spam', 'storeengine' ) },
];

/**
 * Create / edit a product review. `review` (optional) puts the modal in edit
 * mode. Calls `onSaved()` after a successful save.
 */
const ReviewModal = ( { open, review, onClose, onSaved } ) => {
	const dispatch = useDispatch();
	const isEdit = !! review;

	const [ productId, setProductId ] = useState( review?.product_id || 0 );
	const [ productLabel, setProductLabel ] = useState(
		review?.product_title || ''
	);
	const [ author, setAuthor ] = useState( review?.author || '' );
	const [ email, setEmail ] = useState( review?.email || '' );
	const [ rating, setRating ] = useState( review?.rating || 0 );
	const [ content, setContent ] = useState( review?.content || '' );
	const [ status, setStatus ] = useState( review?.status || 'approve' );
	const [ media, setMedia ] = useState( review?.media || [] );
	const [ saving, setSaving ] = useState( false );

	const notify = ( message, type = 'success' ) =>
		dispatch( showNotification( { message, isShow: true, type } ) );

	const submit = async () => {
		if ( ! isEdit && ! productId ) {
			notify( __( 'Please choose a product.', 'storeengine' ), 'error' );
			return;
		}
		if ( ! rating ) {
			notify( __( 'Please select a rating.', 'storeengine' ), 'error' );
			return;
		}

		const payload = {
			author,
			email,
			rating,
			content,
			status,
			media: media.map( ( m ) => m.id ),
		};

		if ( ! isEdit ) {
			payload.product_id = productId;
		}

		setSaving( true );
		try {
			const url = isEdit
				? `${ namespace }reviews/${ review.id }`
				: `${ namespace }reviews`;
			await API.post( url, payload );
			notify(
				isEdit
					? __( 'Review updated.', 'storeengine' )
					: __( 'Review added.', 'storeengine' )
			);
			onSaved();
		} catch ( e ) {
			notify(
				e?.response?.data?.message ||
					__( 'Could not save the review.', 'storeengine' ),
				'error'
			);
		} finally {
			setSaving( false );
		}
	};

	return (
		<Modal
			open={ open }
			onClose={ onClose }
			size="md"
			title={
				isEdit
					? __( 'Edit review', 'storeengine' )
					: __( 'Add review', 'storeengine' )
			}
		>
			<div className="storeengine-review-modal se-admin-tw">
				<div className="storeengine-flex storeengine-flex-column gap-6">
					{ ! isEdit && (
						<Field label={ __( 'Product', 'storeengine' ) } required>
							<ProductPicker
								value={ productId || null }
								valueLabel={ productLabel }
								onSelect={ ( id, option ) => {
									setProductId( id );
									setProductLabel( option?.label || '' );
								} }
							/>
						</Field>
					) }
					{ isEdit && (
						<Field label={ __( 'Product', 'storeengine' ) }>
							<input
								className="storeengine-input"
								value={ review.product_title }
								disabled
							/>
						</Field>
					) }

					<div className="storeengine-flex justify-between gap-4">
						<Field label={ __( 'Name', 'storeengine' ) } className="flex-1">
							<input
								className="storeengine-input"
								value={ author }
								onChange={ ( e ) => setAuthor( e.target.value ) }
								placeholder={ __( 'Reviewer name', 'storeengine' ) }
								autoComplete="off"
								data-1p-ignore="true"
								data-lpignore="true"
							/>
						</Field>
						<Field label={ __( 'Email', 'storeengine' ) } className="flex-1">
							<input
								className="storeengine-input"
								type="email"
								value={ email }
								onChange={ ( e ) => setEmail( e.target.value ) }
								placeholder={ __( 'reviewer@example.com', 'storeengine' ) }
								autoComplete="off"
								data-1p-ignore="true"
								data-lpignore="true"
							/>
						</Field>
					</div>

					<Field label={ __( 'Rating', 'storeengine' ) } required>
						<div className="storeengine-review-modal__rating">
							<Stars value={ rating } onChange={ setRating } size={ 26 } />
							{ rating > 0 && (
								<span className="storeengine-review-modal__rating-label">
									{ rating } / 5
								</span>
							) }
						</div>
					</Field>

					<Field label={ __( 'Review', 'storeengine' ) }>
						<textarea
							className="storeengine-textarea"
							rows={ 4 }
							value={ content }
							onChange={ ( e ) => setContent( e.target.value ) }
							placeholder={ __( 'Write the review…', 'storeengine' ) }
						/>
					</Field>

					<Field label={ __( 'Media', 'storeengine' ) }>
						<MediaField value={ media } onChange={ setMedia } />
					</Field>

					<Field label={ __( 'Status', 'storeengine' ) }>
						<Select
							options={ STATUS_OPTIONS }
							value={ status }
							onChange={ setStatus }
						/>
					</Field>

					<div className="storeengine-flex storeengine-flex-justify-end gap-2 pt-6 border-0 border-t border-se-border">
						<Button preset="outline" size="md" onClick={ onClose }>
							{ __( 'Cancel', 'storeengine' ) }
						</Button>
						<Button
								preset="primary"
								size="md"
								isLoading={ saving }
								onClick={ submit }
							>
							{ isEdit
								? __( 'Update review', 'storeengine' )
								: __( 'Add review', 'storeengine' ) }
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default ReviewModal;
