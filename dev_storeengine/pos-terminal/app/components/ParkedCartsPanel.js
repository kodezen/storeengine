import React, { useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import {
	listParkedCarts,
	recallParkedCart,
	discardParkedCart,
	parkCart,
} from '@Redux/Slices/posSlice/posSlice';

const fmtMoney = ( n ) => Number( n || 0 ).toFixed( 2 );

/**
 * Slide-over panel listing parked carts for the current register/session.
 * Recall pulls the cart back into terminal state. Discard removes the draft.
 *
 * If the cashier has an active cart and tries to recall, we ask them to
 * confirm so they can park-and-recall in one move (no lost work).
 */
const ParkedCartsPanel = ( { open, onClose } ) => {
	const dispatch = useDispatch();
	const cart = useSelector( ( s ) => s.pos.cart );
	const customer = useSelector( ( s ) => s.pos.customer );
	const walkin = useSelector( ( s ) => s.pos.walkin );
	const parkedCarts = useSelector( ( s ) => s.pos.parkedCarts );
	const session = useSelector( ( s ) => s.pos.activeSession );
	const register = useSelector( ( s ) => s.pos.activeRegister );

	useEffect( () => {
		if ( open && session && register ) {
			dispatch(
				listParkedCarts( {
					register_id: register.id,
					session_id: session.id,
				} )
			);
		}
	}, [ open, dispatch, session, register ] );

	const recall = async ( id ) => {
		if ( cart.length ) {
			const ok = window.confirm(
				__(
					'Park current cart first and recall this one?',
					'storeengine'
				)
			);
			if ( ! ok ) return;
			// Unwrap the park before recalling — without .unwrap() a failed
			// park silently resolves and we'd recall over the top of the
			// active cart, losing the cashier's in-progress work.
			try {
				await dispatch(
					parkCart( {
						register_id: register.id,
						session_id: session.id,
						customer_id: customer?.id || 0,
						walkin: walkin || {},
						items: cart.map( ( l ) => ( {
							product_id: l.product_id,
							variation_id: l.variation_id,
							qty: l.qty,
						} ) ),
					} )
				).unwrap();
			} catch ( err ) {
				window.alert(
					err?.response?.data?.message ||
						__(
							'Could not park current cart — recall cancelled to avoid losing work.',
							'storeengine'
						)
				);
				return;
			}
		}
		await dispatch( recallParkedCart( id ) );
		onClose();
	};

	const discard = ( id ) => {
		if ( ! window.confirm( __( 'Discard this parked cart?', 'storeengine' ) ) ) return;
		dispatch( discardParkedCart( id ) );
	};

	if ( ! open ) return null;

	return (
		<div className="se-admin-tw fixed inset-0 z-30 flex">
			<div
				className="flex-1 bg-black/30"
				onClick={ onClose }
				aria-hidden="true"
			/>
			<div className="w-full max-w-md bg-white shadow-2xl border-0 border-l border-solid border-se-border flex flex-col">
				<div className="p-4 border-0 border-b border-solid border-se-border flex items-center justify-between">
					<h3 className="m-0 text-[16px] font-medium leading-[22.4px]">
						{ __( 'Parked carts', 'storeengine' ) }
					</h3>

					<button
						type="button"
						onClick={ onClose }
						className="px-3 py-2 w-fit border border-solid border-se-border bg-white text-[#101828] rounded cursor-pointer"
						aria-label={ __( 'Close', 'storeengine' ) }
					>
						{ __( 'X', 'storeengine' ) }
					</button>
				</div>

				<div className="flex-1 overflow-y-auto">
					{ ! parkedCarts.length && (
						<div className="px-4 py-8 text-center text-sm text-se-subtitle">
							{ __( 'No parked carts.', 'storeengine' ) }
						</div>
					) }
					{ parkedCarts.map( ( p ) => (
						<div
							key={ p.id }
							className="px-4 py-3 border-b border-se-border hover:bg-se-bg"
						>
							<div className="flex items-center gap-2">
								<div className="flex-1 min-w-0">
									<div className="text-[14px] font-medium leading-[19.4px] truncate">
										{ p.label }
									</div>
									<div className="text-[14px] font-normal leading-[19.4px] text-se-subtitle">
										{ sprintf(
											// translators: %1$d items, %2$s total
											__(
												'%1$d items · %2$s',
												'storeengine'
											),
											p.item_count,
											fmtMoney( p.total )
										) }
									</div>
									{ p.parked_at && (
										<div className="text-[12px] font-normal leading-[16px] text-se-subtitle">
											{ p.parked_at }
										</div>
									) }
								</div>

								<div className="flex gap-2">
									<button
										type="button"
										onClick={ () => recall( p.id ) }
										className="px-3 py-2 border border-solid border-se-primary bg-se-primary text-white text-[14px] font-normal rounded whitespace-nowrap cursor-pointer"
									>
										{ __( 'Recall', 'storeengine' ) }
									</button>
									<button
										type="button"
										onClick={ () => discard( p.id ) }
										className="px-3 py-2 border border-solid border-red-600 bg-red-600 text-white text-[14px] font-normal rounded whitespace-nowrap cursor-pointer hover:bg-red-700"
									>
										{ __( 'Discard', 'storeengine' ) }
									</button>
								</div>
							</div>
						</div>
					) ) }
				</div>
			</div>
		</div>
	);
};

export default ParkedCartsPanel;
