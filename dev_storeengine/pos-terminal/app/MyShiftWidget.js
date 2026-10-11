import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSessionSummary } from '@Redux/Slices/posSlice/posSlice';

const fmt = ( n ) => Number( n || 0 ).toFixed( 2 );

const MyShiftWidget = ( { onCloseShift } ) => {
	const dispatch = useDispatch();
	const activeSession = useSelector( ( s ) => s.pos.activeSession );
	const summary = useSelector( ( s ) => s.pos.sessionSummary );

	useEffect( () => {
		if ( ! activeSession?.id ) return undefined;
		const tick = () => dispatch( fetchSessionSummary( activeSession.id ) );
		tick();
		const handle = setInterval( tick, 20000 );
		return () => clearInterval( handle );
	}, [ dispatch, activeSession?.id ] );

	if ( ! activeSession ) return null;
	if ( ! summary ) {
		return (
			<div className="bg-white border border-se-border rounded-md p-3 mb-3 text-xs text-se-subtitle">
				{ __( 'Loading shift summary…', 'storeengine' ) }
			</div>
		);
	}

	return (
		<div className="bg-white border border-se-border rounded-md p-3 mb-3 text-sm">
			<div className="flex items-center justify-between border-0 border-b border-solid border-se-border pb-5 mb-5">
				<div className="font-medium text-se-text">
					{ __( 'My Shift', 'storeengine' ) }
				</div>
				<button
					type="button"
					onClick={ onCloseShift }
					className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[12px] font-normal rounded cursor-pointer"
				>
					{ __( 'Close shift…', 'storeengine' ) }
				</button>
			</div>
			<div className="grid grid-cols-4 gap-2 text-center">
				<Stat label={ __( 'Cash', 'storeengine' ) } value={ fmt( summary.cash_sales_net ) } />
				<Stat label={ __( 'Tips', 'storeengine' ) } value={ fmt( summary.tips_total ) } />
				<Stat label={ __( 'Refunds', 'storeengine' ) } value={ fmt( summary.refund_total ) } negative />
				<Stat
					label={ __( 'Expected', 'storeengine' ) }
					value={ fmt( summary.expected_cash ) }
					primary
				/>
			</div>
		</div>
	);
};

const Stat = ( { label, value, primary = false, negative = false } ) => (
	<div className="px-1 py-0.5">
		<div className="text-[14px] font-normal leading-[19.22px] uppercase tracking-wide text-se-subtitle mb-2">{ label }</div>
		<div
			className={
				'text-[16px] leading-[22.24px] font-medium ' +
				( primary ? 'text-blue-700' : negative ? 'text-red-600' : 'text-se-text' )
			}
		>
			{ value }
		</div>
	</div>
);

export default MyShiftWidget;
