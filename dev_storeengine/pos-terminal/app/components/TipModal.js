import React, { useState, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import ReactModal from '@Components/Modal/ReactModal';

const fmt = ( n ) => Number( n || 0 ).toFixed( 2 );

/**
 * Tip selection modal. Terminal resolves percent → amount client-side and
 * sends just the final amount to the server (the server doesn't recompute,
 * it just adds the amount as a fee).
 *
 * Props:
 *   baseAmount  number — the bill total tips are calculated against
 *   current     { amount, reason? } | null
 *   onApply     ({ amount, reason? }) => void  // null clears
 *   onClose     () => void
 */
const TipModal = ( { baseAmount = 0, current = null, onApply, onClose } ) => {
	// Tips are meaningless on a $0 bill — every preset and the custom path
	// just resolves to "no tip". Gate the actionable controls so the cashier
	// doesn't tap a percent and silently get nothing, and signal why.
	const hasBill = Number( baseAmount ) > 0;
	const presetsPercent = useSelector(
		( s ) => s.pos.settings?.tip_presets_percent
	);
	const presetsAmount = useSelector(
		( s ) => s.pos.settings?.tip_presets_amount
	);
	const effectivePercents = useMemo(
		() => ( presetsPercent && presetsPercent.length ? presetsPercent : [ 10, 15, 20 ] ),
		[ presetsPercent ]
	);
	const effectiveAmounts = useMemo(
		() => presetsAmount || [],
		[ presetsAmount ]
	);

	const [ custom, setCustom ] = useState( current?.amount ? String( current.amount ) : '' );
	const [ reason, setReason ] = useState( current?.reason || '' );

	const applyAmount = ( amount ) => {
		if ( ! amount || amount <= 0 ) {
			onApply?.( null );
			onClose?.();
			return;
		}
		const payload = { amount: Number( amount.toFixed ? amount.toFixed( 2 ) : amount ) };
		if ( reason ) payload.reason = reason;
		onApply?.( payload );
		onClose?.();
	};

	return (
		<ReactModal
			title={ __( 'Add tip', 'storeengine' ) }
			isOpen={ true }
			isEnabledHeader={ true }
			isEnabledResizer={ false }
			size="small"
			onRequestClose={ onClose }
		>
			<div className="se-admin-tw">
				<p className="text-[16px] font-medium leading-[22.4px] mt-0 mb-6">
					{ __( 'Bill total', 'storeengine' ) }: { fmt( baseAmount ) }
				</p>

				<div className="text-[14px] font-medium leading-[19.4px] mb-2">
					{ __( 'Quick percent', 'storeengine' ) }
				</div>

				<div className="grid grid-cols-3 gap-2 mb-6">
					{ effectivePercents.map( ( p ) => {
						const computed = ( baseAmount * p ) / 100;
						return (
							<button
								key={ p }
								type="button"
								onClick={ () => applyAmount( computed ) }
								disabled={ ! hasBill }
								className="p-4 border border-solid border-se-border bg-white text-[#101828] text-[14px] font-normal rounded whitespace-nowrap cursor-pointer  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-se-border"
							>
								<div className="text-lg font-semibold se-text">{ p }%</div>
								<div className="text-xs se-subtitle">{ fmt( computed ) }</div>
							</button>
						);
					} ) }
				</div>
				{ ! hasBill ? (
					<p className="text-xs se-subtitle -mt-2 mb-3">
						{ __( 'Add items to the cart before adding a tip.', 'storeengine' ) }
					</p>
				) : null }

				{ effectiveAmounts.length ? (
					<>
						<div className="text-xs se-subtitle mb-1">
							{ __( 'Quick amount', 'storeengine' ) }
						</div>
						<div className="grid grid-cols-3 gap-2 mb-3">
							{ effectiveAmounts.map( ( a ) => (
								<button
									key={ a }
									type="button"
									onClick={ () => applyAmount( a ) }
									className="h-12 rounded border se-border hover:bg-blue-50"
								>
									{ fmt( a ) }
								</button>
							) ) }
						</div>
					</>
				) : null }

				<p className="text-[14px] font-medium leading-[19.4px] m-0 mb-2">
					{ __( 'Custom amount', 'storeengine' ) }
				</p>

				<input
					type="number"
					inputMode="decimal"
					min="0"
					step="0.01"
					value={ custom }
					onChange={ ( e ) => setCustom( e.target.value ) }
					className="storeengine-input box-border"
					placeholder="0.00"
				/>

				<p className="text-[14px] font-medium leading-[19.4px] mt-6 mb-2">
					{ __( 'Reason (optional)', 'storeengine' ) }
				</p>

				<input
					type="text"
					value={ reason }
					onChange={ ( e ) => setReason( e.target.value ) }
					className="storeengine-input box-border"
					placeholder={ __( 'e.g. server name', 'storeengine' ) }
				/>

				<div className="flex justify-end gap-4 border-0 border-t border-solid border-t-se-border py-5 mt-5">
					{ current ? (
						<button
							type="button"
							onClick={ () => {
								onApply?.( null );
								onClose?.();
							} }
							className="px-3 py-2 border border-solid border-red-600 bg-red-600 text-white text-[14px] font-normal rounded whitespace-nowrap cursor-pointer hover:bg-red-700 disabled:opacity-60"
						>
							{ __( 'No tip', 'storeengine' ) }
						</button>
					) : null }
					<button
						type="button"
						onClick={ onClose }
						className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[14px] font-normal rounded whitespace-nowrap cursor-pointer"
					>
						{ __( 'Cancel', 'storeengine' ) }
					</button>
					<button
						type="button"
						onClick={ () => applyAmount( Number( custom ) || 0 ) }
						className="px-3 py-2 border border-solid border-se-primary bg-se-primary text-white text-[14px] font-normal rounded whitespace-nowrap cursor-pointer"
					>
						{ __( 'Apply', 'storeengine' ) }
					</button>
				</div>
			</div>
		</ReactModal>
	);
};

export default TipModal;
