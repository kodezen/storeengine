import React from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import ReactModal from '@Components/Modal/ReactModal';

const fmt = ( n ) => ( Math.round( Number( n || 0 ) * 100 ) / 100 ).toFixed( 2 );

/**
 * Pick one of the customer's open quotes to redeem into the cart.
 *
 * The list is already filtered server-side to quotes a cashier can act on —
 * a draft is still being written and a declined or converted one is spent —
 * and each carries its line items, so choosing one needs no further request.
 *
 * Props:
 *   quotes    array   [{ id, reference, status, total, valid_until, items }]
 *   onPick    (quote) => void
 *   onClose   () => void
 */
const QuotePickerModal = ( { quotes = [], onPick, onClose } ) => {
	const expiresLabel = ( quote ) => {
		if ( ! quote.valid_until ) {
			return __( 'No expiry', 'storeengine' );
		}

		const days = Math.ceil(
			( new Date( quote.valid_until ).getTime() - Date.now() ) / 86400000
		);

		if ( days < 0 ) {
			return __( 'Expired', 'storeengine' );
		}
		if ( days === 0 ) {
			return __( 'Expires today', 'storeengine' );
		}

		return sprintf(
			/* translators: %d: number of days until the quote expires */
			_n( 'Expires in %d day', 'Expires in %d days', days, 'storeengine' ),
			days
		);
	};

	return (
		<ReactModal
			title={ __( 'Redeem a quote', 'storeengine' ) }
			isOpen={ true }
			isEnabledHeader={ true }
			isEnabledResizer={ false }
			size="medium"
			onRequestClose={ onClose }
		>
			<div className="se-admin-tw">
				{ ! quotes.length ? (
					<p className="text-sm text-se-subtitle">
						{ __(
							'This customer has no quotes waiting to be redeemed.',
							'storeengine'
						) }
					</p>
				) : (
					<div className="flex flex-col gap-2">
						{ quotes.map( ( quote ) => {
							const expired =
								quote.valid_until &&
								new Date( quote.valid_until ).getTime() <
									Date.now();

							return (
								<button
									key={ quote.id }
									type="button"
									onClick={ () => ! expired && onPick( quote ) }
									disabled={ expired }
									className="flex items-center justify-between gap-4 text-left px-4 py-3 border border-solid border-se-border rounded bg-white hover:bg-se-bg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<div className="min-w-0">
										<div className="text-sm font-medium text-se-text">
											{ quote.reference }
										</div>
										<div className="text-xs text-se-subtitle">
											{ sprintf(
												/* translators: %d: number of line items on the quote */
												_n(
													'%d item',
													'%d items',
													( quote.items || [] ).length,
													'storeengine'
												),
												( quote.items || [] ).length
											) }
											{ ' · ' }
											{ expiresLabel( quote ) }
										</div>
									</div>
									<div className="text-sm font-semibold tabular-nums text-se-text whitespace-nowrap">
										{ fmt( quote.total ) }
									</div>
								</button>
							);
						} ) }
					</div>
				) }

				<div className="flex justify-end gap-4 border-0 border-t border-solid border-t-se-border py-5 mt-4">
					<button
						type="button"
						onClick={ onClose }
						className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[14px] font-normal rounded cursor-pointer"
					>
						{ __( 'Cancel', 'storeengine' ) }
					</button>
				</div>
			</div>
		</ReactModal>
	);
};

export default QuotePickerModal;
