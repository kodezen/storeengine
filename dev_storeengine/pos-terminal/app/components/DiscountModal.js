import React, { useState, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import ReactModal from '@Components/Modal/ReactModal';

const fmt = ( n ) => Number( n || 0 ).toFixed( 2 );

/**
 * Discount entry modal. Same UX for both per-line and cart-level discounts —
 * the caller picks the binding by passing `scope`.
 *
 * Three discount shapes:
 *   - percent       (0-100)
 *   - amount        (absolute, in store currency)
 *   - price_override  line-scope only: set unit price directly. Always
 *                     requires storeengine_authorize_price_override regardless
 *                     of threshold (no upper bound).
 *
 * Props:
 *   scope       'line' | 'cart'
 *   baseAmount  number — original unit price (line) or cart subtotal (cart),
 *                       used to render preset preview text.
 *   current     existing discount object (for edit mode)
 *   presets     number[] — % presets from settings.discount_presets_percent
 *   onApply     (discount) => void — payload: { percent?, amount?, price_override?, reason }
 *   onClose     () => void
 *
 * No authorization check happens here — the server returns 403 with
 * required_cap when needed, and the calling component (Terminal.js) pops
 * SupervisorPinModal on that signal.
 */
const DiscountModal = ( {
	scope = 'line',
	baseAmount = 0,
	current = null,
	presets = [],
	onApply,
	onClose,
} ) => {
	const settingsPresets = useSelector(
		( s ) => s.pos.settings?.discount_presets_percent
	);
	const effectivePresets = useMemo(
		() => ( presets.length ? presets : settingsPresets ) || [ 5, 10, 15, 20 ],
		[ presets, settingsPresets ]
	);

	const initialKind = current?.price_override
		? 'override'
		: current?.percent
		? 'percent'
		: current?.amount
		? 'amount'
		: 'percent';

	const [ kind, setKind ] = useState( initialKind );
	const [ percent, setPercent ] = useState(
		current?.percent ? String( current.percent ) : ''
	);
	const [ amount, setAmount ] = useState(
		current?.amount ? String( current.amount ) : ''
	);
	const [ override, setOverride ] = useState(
		current?.price_override ? String( current.price_override ) : ''
	);
	const [ reason, setReason ] = useState( current?.reason || '' );

	const preview = useMemo( () => {
		const b = Number( baseAmount ) || 0;
		if ( kind === 'percent' ) {
			const p = Math.min( 100, Math.max( 0, Number( percent ) || 0 ) );
			const disc = b * ( p / 100 );
			return { discount: disc, final: Math.max( 0, b - disc ) };
		}
		if ( kind === 'amount' ) {
			const a = Math.max( 0, Number( amount ) || 0 );
			return { discount: Math.min( a, b ), final: Math.max( 0, b - a ) };
		}
		if ( kind === 'override' ) {
			const o = Math.max( 0, Number( override ) || 0 );
			return { discount: Math.max( 0, b - o ), final: o };
		}
		return { discount: 0, final: b };
	}, [ kind, percent, amount, override, baseAmount ] );

	// Build the would-be payload from the current inputs. Used by both the
	// Apply click handler and the disabled-state of the Apply button, so the
	// two stay in sync (the button is grayed out exactly when clicking it
	// would be a no-op or — worse — silently clear an existing discount).
	const buildPayload = () => {
		if ( kind === 'percent' && Number( percent ) > 0 ) {
			return { percent: Number( percent ) };
		}
		if ( kind === 'amount' && Number( amount ) > 0 ) {
			return { amount: Number( amount ) };
		}
		if ( kind === 'override' && override !== '' ) {
			return { price_override: Number( override ) };
		}
		return null;
	};

	const pendingPayload = buildPayload();
	const canApply = !! pendingPayload;

	const apply = () => {
		if ( ! pendingPayload ) return; // guarded by disabled state too
		const payload = { ...pendingPayload };
		if ( reason ) payload.reason = reason;
		onApply?.( payload );
		onClose?.();
	};

	const clear = () => {
		onApply?.( null );
		onClose?.();
	};

	return (
		<ReactModal
			title={ scope === 'cart' ? __( 'Cart discount', 'storeengine' ) : __( 'Line discount', 'storeengine' ) }
			isOpen={ true }
			isEnabledHeader={ true }
			isEnabledResizer={ false }
			size="small"
			onRequestClose={ onClose }
		>
			<div className="se-admin-tw">
				{ /* Kind toggle — same pill-button pattern as the percent presets
				below and RefundModal's tender-method buttons: bordered pills,
				active = light-blue fill + blue border (not a solid fill), so a
				disabled pill stays legible instead of nearly invisible. */ }
				<div className="flex gap-2 mb-3">
					<button
						type="button"
						onClick={ () => setKind( 'percent' ) }
						className={
							'flex-1 px-3 py-2 text-[12px] font-medium leading-[16.8px] border border-solid rounded text-xs transition-all ' +
							( kind === 'percent'
								? 'bg-blue-50 border-blue-500 se-text'
								: 'border-se-border bg-transparent se-subtitle hover:bg-se-primary hover:text-white' )
						}
					>
						{ __( 'Percent', 'storeengine' ) }
					</button>
					<button
						type="button"
						onClick={ () => setKind( 'amount' ) }
						className={
							'flex-1 px-3 py-2 text-[12px] font-medium leading-[16.8px] border border-solid rounded text-xs transition-all ' +
							( kind === 'amount'
								? 'bg-blue-50 border-blue-500 se-text'
								: 'border-se-border bg-transparent se-subtitle hover:bg-se-primary hover:text-white' )
						}
					>
						{ __( 'Amount', 'storeengine' ) }
					</button>
					<button
						type="button"
						onClick={ () => setKind( 'override' ) }
						disabled={ scope !== 'line' }
						className={
							'flex-1 px-3 py-2 text-[12px] font-medium leading-[16.8px] border border-solid rounded text-xs transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit ' +
							( kind === 'override'
								? 'bg-blue-50 border-blue-500 se-text'
								: 'border-se-border bg-transparent se-subtitle hover:bg-se-primary hover:text-white' )
						}
					>
						{ __( 'Override price', 'storeengine' ) }
					</button>
				</div>

				{ /* Field */ }
				{ kind === 'percent' ? (
					<>
						<div className="flex gap-2 mb-2">
							{ effectivePresets.map( ( p ) => (
								<button
									key={ p }
									type="button"
									onClick={ () => setPercent( String( p ) ) }
									className={
										'px-3 py-2 w-fit text-[12px] font-medium leading-[16.8px] border border-solid border-se-border rounded text-xs hover:bg-se-primary hover:text-white transition-all ' +
										( Number( percent ) === p ? 'bg-blue-50 border-blue-500' : ' bg-transparent' )
									}
								>
									{ p }%
								</button>
							) ) }
						</div>
						<input
							type="number"
							inputMode="decimal"
							min="0"
							max="100"
							value={ percent }
							onChange={ ( e ) => setPercent( e.target.value ) }
							className="storeengine-input box-border"
							placeholder="0"
						/>
					</>
				) : null }

				{ kind === 'amount' ? (
					<input
						type="number"
						inputMode="decimal"
						min="0"
						step="0.01"
						value={ amount }
						onChange={ ( e ) => setAmount( e.target.value ) }
						className="storeengine-input box-border"
						placeholder="0.00"
					/>
				) : null }

				{ kind === 'override' ? (
					<>
						<div className="text-[14px] font-normal leading-[19.4px] mb-2">
							{ __( 'New unit price', 'storeengine' ) }
						</div>
						<input
							type="number"
							inputMode="decimal"
							min="0"
							step="0.01"
							value={ override }
							onChange={ ( e ) => setOverride( e.target.value ) }
							className="storeengine-input--24"
							placeholder={ fmt( baseAmount ) }
						/>
						<p className="text-xs se-subtitle mb-3">
							{ __(
								'Price overrides always require supervisor approval.',
								'storeengine'
							) }
						</p>
					</>
				) : null }

				<div className="text-[14px] font-normal leading-[19.4px] my-2">
					{ __( 'Reason (optional)', 'storeengine' ) }
				</div>

				<input
					type="text"
					value={ reason }
					onChange={ ( e ) => setReason( e.target.value ) }
					className="storeengine-input box-border"
					placeholder={ __( 'e.g. loyalty, damaged box', 'storeengine' ) }
				/>

				{ /* Preview */ }
				<div className="bg-gray-50 rounded p-3 mt-6">
					<div className="flex justify-between mb-2">
						<span className="text-[14px] font-normal leading-[19.4px] se-subtitle">{ __( 'Original', 'storeengine' ) }</span>
						<span className="se-text">{ fmt( baseAmount ) }</span>
					</div>
					<div className="flex justify-between">
						<span className="text-[14px] font-normal leading-[19.4px] se-subtitle">{ __( 'Discount', 'storeengine' ) }</span>
						<span className="text-[14px] font-normal leading-[19.4px] se-error">−{ fmt( preview.discount ) }</span>
					</div>
					<div className="flex justify-between font-semibold mt-4 pt-4 border-0 border-t border-dashed border-se-border">
						<span className="text-[14px] font-medium leading-[19.4px]">{ __( 'After', 'storeengine' ) }</span>
						<span className="text-[14px] font-medium leading-[19.4px]">{ fmt( preview.final ) }</span>
					</div>
				</div>

				<div className="flex justify-end gap-4 border-0 border-t border-solid border-t-se-border py-5 mt-5">
					{ current ? (
						<button
							type="button"
							onClick={ clear }
							className="px-3 py-2 border border-solid border-red-600 bg-red-600 text-white text-[14px] font-normal rounded whitespace-nowrap cursor-pointer hover:bg-red-700 disabled:opacity-60"
						>
							{ __( 'Remove', 'storeengine' ) }
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
						onClick={ apply }
						disabled={ ! canApply }
						className="px-3 py-2 border border-solid border-se-primary bg-se-primary text-white text-[14px] font-normal rounded whitespace-nowrap cursor-pointer"
					>
						{ __( 'Apply', 'storeengine' ) }
					</button>
				</div>
			</div>
		</ReactModal>
	);
};

export default DiscountModal;
