import React from 'react';
import PropTypes from 'prop-types';
import { __, _n, sprintf } from '@wordpress/i18n';
import Modal from '@Components/Modal';
import { Scope, Button } from '@Components/ui';

/**
 * Confirms removing an attribute value that saved variants are built on.
 * Replaces the native window.confirm so the warning matches the rest of the
 * product editor. Shown only when `dropped > 0`; removing an unused value is
 * applied without a prompt.
 *
 * @param {Object}   props
 * @param {boolean}  props.open      Whether the modal is shown.
 * @param {string}   props.value     The value being removed, e.g. "Red".
 * @param {number}   props.dropped   Saved variants that will be deleted.
 * @param {Function} props.onConfirm Remove it.
 * @param {Function} props.onClose   Keep it.
 */
const RemoveValueModal = ( { open, value, dropped, onConfirm, onClose } ) => {
	return (
		<Modal
			open={ open }
			size="sm"
			title={ sprintf(
				/* translators: %s: attribute value name */
				__( 'Remove “%s”?', 'storeengine' ),
				value || ''
			) }
			onClose={ onClose }
			closeAriaLabel={ __( 'Close', 'storeengine' ) }
			className="storeengine-remove-value-modal"
		>
			<Scope>
				<div className="px-5 pt-4 pb-5">
					<p className="m-0 text-se-text text-[13px] leading-relaxed">
						{ sprintf(
							/* translators: %d: number of saved variants that will be deleted */
							_n(
								'This value is used by %d saved variant. Removing it deletes that variant, including its price, SKU and stock. This cannot be undone.',
								'This value is used by %d saved variants. Removing it deletes those variants, including their prices, SKUs and stock. This cannot be undone.',
								dropped,
								'storeengine'
							),
							dropped
						) }
					</p>
				</div>

				<div className="flex items-center justify-end gap-2 px-5 pb-5 pt-4 border-0 border-t border-solid border-se-border">
					<Button preset="outline" onClick={ onClose }>
						{ __( 'Keep it', 'storeengine' ) }
					</Button>
					<Button preset="danger" onClick={ onConfirm }>
						{ sprintf(
							/* translators: %d: number of variants */
							_n(
								'Remove and delete %d variant',
								'Remove and delete %d variants',
								dropped,
								'storeengine'
							),
							dropped
						) }
					</Button>
				</div>
			</Scope>
		</Modal>
	);
};

RemoveValueModal.propTypes = {
	open: PropTypes.bool.isRequired,
	value: PropTypes.string,
	dropped: PropTypes.number,
	onConfirm: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
};

export default RemoveValueModal;
