import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { __, _n, sprintf } from '@wordpress/i18n';
import Modal from '@Components/Modal';
import { Scope, Button, Checkbox } from '@Components/ui';

/**
 * Confirms deleting an attribute or term that products use, listing what goes
 * with it (see Attribute::get_usage()). Unused ones never reach this modal:
 * they're deleted straight away.
 *
 * @param {Object}   props
 * @param {boolean}  props.open      Whether the modal is shown.
 * @param {string}   props.subject   What's being deleted, e.g. "Color" or "Red".
 * @param {boolean}  props.isTerm    A single term (vs. the whole attribute).
 * @param {Object}   props.usage     Usage from get_product_attribute_usage.
 * @param {boolean}  props.deleting  Delete request in flight.
 * @param {Function} props.onConfirm Delete anyway.
 * @param {Function} props.onClose   Keep it.
 */
const DeleteImpactModal = ( {
	open,
	subject,
	isTerm,
	usage,
	deleting,
	onConfirm,
	onClose,
} ) => {
	const [ understood, setUnderstood ] = useState( false );

	useEffect( () => {
		if ( open ) {
			setUnderstood( false );
		}
	}, [ open ] );

	if ( ! usage ) {
		return null;
	}

	const {
		products,
		variations,
		unsellable,
		orders,
		stock,
		terms,
		items = [],
	} = usage;

	const lines = [
		sprintf(
			/* translators: %d: number of products */
			_n(
				'%d product will lose this option.',
				'%d products will lose this option.',
				products,
				'storeengine'
			),
			products
		),
	];
	if ( variations ) {
		lines.push(
			sprintf(
				/* translators: %d: number of variations */
				_n(
					'%d variation will be permanently deleted, with its price, SKU and stock settings.',
					'%d variations will be permanently deleted, with their prices, SKUs and stock settings.',
					variations,
					'storeengine'
				),
				variations
			)
		);
	}
	if ( stock > 0 ) {
		lines.push(
			sprintf(
				/* translators: %s: stock quantity */
				__(
					'%s units of tracked stock will no longer be sellable.',
					'storeengine'
				),
				Number( stock ).toLocaleString()
			)
		);
	}
	if ( orders ) {
		lines.push(
			sprintf(
				/* translators: %d: number of orders */
				_n(
					'%d past order includes these variations. The order keeps its line items, but they will no longer link to a product variation.',
					'%d past orders include these variations. The orders keep their line items, but they will no longer link to a product variation.',
					orders,
					'storeengine'
				),
				orders
			)
		);
	}
	if ( ! isTerm && terms ) {
		lines.push(
			sprintf(
				/* translators: %d: number of terms */
				_n(
					'Its %d term will be deleted.',
					'All %d of its terms will be deleted.',
					terms,
					'storeengine'
				),
				terms
			)
		);
	}

	return (
		<Modal
			open={ open }
			size="md"
			title={ sprintf(
				/* translators: %s: attribute or term name */
				__( 'Delete “%s”?', 'storeengine' ),
				subject
			) }
			onClose={ deleting ? () => {} : onClose }
			closeAriaLabel={ __( 'Close', 'storeengine' ) }
			className="storeengine-attr-impact-modal"
		>
			<Scope>
				<div className="px-5 pt-4 pb-5">
					<div className="storeengine-attr-impact">
						<p className="storeengine-attr-impact__lead">
							{ isTerm
								? __(
										'This term is in use. Deleting it cannot be undone:',
										'storeengine'
								  )
								: __(
										'This attribute is in use. Deleting it cannot be undone:',
										'storeengine'
								  ) }
						</p>

						<ul className="storeengine-attr-impact__list">
							{ lines.map( ( line ) => (
								<li key={ line }>{ line }</li>
							) ) }
						</ul>

						{ unsellable > 0 && (
							<div
								className="storeengine-attr-impact__alert"
								role="alert"
							>
								{ sprintf(
									/* translators: %d: number of products */
									_n(
										'%d variable product will be left with no variations and can’t be purchased until you rebuild them.',
										'%d variable products will be left with no variations and can’t be purchased until you rebuild them.',
										unsellable,
										'storeengine'
									),
									unsellable
								) }
							</div>
						) }

						{ items.length > 0 && (
							<div className="storeengine-attr-impact__products">
								<div className="storeengine-attr-impact__products-head">
									{ __( 'Affected products', 'storeengine' ) }
									{ products > items.length && (
										<span>
											{ sprintf(
												/* translators: 1: shown count, 2: total count */
												__(
													'Showing %1$d of %2$d',
													'storeengine'
												),
												items.length,
												products
											) }
										</span>
									) }
								</div>
								<ul>
									{ items.map( ( item ) => {
										const all =
											item.variations_total > 0 &&
											item.variations_lost >=
												item.variations_total;
										return (
											<li key={ item.id }>
												<a
													href={ item.edit_url }
													target="_blank"
													rel="noreferrer"
												>
													{ item.title ||
														__(
															'(no title)',
															'storeengine'
														) }
												</a>
												{ 'publish' !== item.status && (
													<span className="storeengine-attr-impact__status">
														{ item.status }
													</span>
												) }
												<span
													className={ `storeengine-attr-impact__lost${
														all ? ' is-all' : ''
													}` }
												>
													{ item.variations_lost > 0
														? sprintf(
																/* translators: 1: variations lost, 2: total variations */
																__(
																	'%1$d of %2$d variations',
																	'storeengine'
																),
																item.variations_lost,
																item.variations_total
														  )
														: __(
																'Option only',
																'storeengine'
														  ) }
												</span>
											</li>
										);
									} ) }
								</ul>
							</div>
						) }

						<Checkbox
							checked={ understood }
							onChange={ ( checked ) =>
								setUnderstood( !! checked )
							}
							label={ __(
								'I understand this data will be permanently deleted.',
								'storeengine'
							) }
						/>
					</div>

					<div className="flex items-center justify-end gap-2 pt-4 mt-4 border-0 border-t border-solid border-se-border">
						<Button
							preset="outline"
							onClick={ onClose }
							disabled={ deleting }
						>
							{ __( 'Keep it', 'storeengine' ) }
						</Button>
						<Button
							preset="danger"
							onClick={ onConfirm }
							disabled={ ! understood }
							isLoading={ deleting }
						>
							{ isTerm
								? __( 'Delete term', 'storeengine' )
								: __( 'Delete attribute', 'storeengine' ) }
						</Button>
					</div>
				</div>
			</Scope>
		</Modal>
	);
};

DeleteImpactModal.propTypes = {
	open: PropTypes.bool.isRequired,
	subject: PropTypes.string,
	isTerm: PropTypes.bool,
	usage: PropTypes.object,
	deleting: PropTypes.bool,
	onConfirm: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
};

export default DeleteImpactModal;
