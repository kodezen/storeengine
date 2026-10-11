import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import ReactModal from '@Components/Modal/ReactModal';
import { Button } from '@Components/ui';

/**
 * Onboarding step shown when a brand-new access group is created: capture the
 * name, then hand it back via onContinue so the parent can persist a draft
 * and the modal closes. Mirrors NewProductModal's flow for products.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen
 * @param {boolean}  props.isSaving   Draft is being created — keep modal open + spinner.
 * @param {Function} props.onClose    Dismiss without seeding.
 * @param {Function} props.onContinue Called with ( { title } ).
 */
const NewAccessGroupModal = ( { isOpen, isSaving, onClose, onContinue } ) => {
	const [ title, setTitle ] = useState( '' );

	const canContinue = '' !== title.trim();

	const handleContinue = () => {
		if ( ! canContinue || isSaving ) {
			return;
		}
		onContinue( { title: title.trim() } );
	};

	return (
		<ReactModal
			isOpen={ isOpen }
			onRequestClose={ onClose }
			title={ __( 'Create access group', 'storeengine' ) }
			isEnabledResizer={ false }
			size="small"
			suffix="new-access-group"
		>
			{ /* react-modal portals outside the .se-admin-tw Tailwind scope, so
			     wrap the content to re-enable the utility classes. */ }
			<div className="se-admin-tw">
				<div className="flex flex-col gap-6">
					<div>
						<label
							className="block text-sm font-semibold text-se-title mb-2"
							htmlFor="se-new-access-group-title"
						>
							{ __( 'Access group name', 'storeengine' ) }
						</label>
						<input
							id="se-new-access-group-title"
							type="text"
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
							value={ title }
							onChange={ ( e ) => setTitle( e.target.value ) }
							onKeyDown={ ( e ) => {
								if ( 'Enter' === e.key ) {
									e.preventDefault();
									handleContinue();
								}
							} }
							placeholder={ __(
								'e.g. Premium Members',
								'storeengine'
							) }
							className="w-full px-3 py-2.5 border border-solid border-se-border rounded-lg text-sm text-se-input bg-white transition-shadow focus:outline-none focus:border-se-primary focus:ring-2 focus:ring-se-primary"
						/>
					</div>

					<div className="flex justify-end pt-1">
						<Button
							type="button"
							preset="primary"
							disabled={ ! canContinue || isSaving }
							isLoading={ isSaving }
							onClick={ handleContinue }
						>
							{ __( 'Continue', 'storeengine' ) }
						</Button>
					</div>
				</div>
			</div>
		</ReactModal>
	);
};

NewAccessGroupModal.propTypes = {
	isOpen: PropTypes.bool,
	isSaving: PropTypes.bool,
	onClose: PropTypes.func,
	onContinue: PropTypes.func,
};

export default NewAccessGroupModal;
