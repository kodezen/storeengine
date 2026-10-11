import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import {
	clearSupervisorPin,
	fetchPinStatus,
	setSupervisorPin,
} from '@Redux/Slices/posSlice/posSlice';
import ReactModal from '@Components/Modal/ReactModal';

/**
 * Profile modal for the currently-logged-in cashier. Shows their identity
 * and lets them set / change / clear their own PIN — same backend
 * (`/pos/supervisor/pin`) the admin Staff page uses, but scoped to
 * `get_current_user_id()` server-side.
 *
 * PIN rules (enforced server-side; we just mirror them client-side for
 * faster UX):
 *   - 4-12 digits, numeric only
 *   - Empty PIN = clear (use the explicit Clear button)
 *
 * Props:
 *   user      { id, display_name, email, role }
 *   onClose   () => void
 */
const PosProfileModal = ( { user, onClose } ) => {
	const dispatch = useDispatch();
	const [ hasPin, setHasPin ] = useState( null ); // null = loading
	const [ pin, setPin ] = useState( '' );
	const [ saving, setSaving ] = useState( false );
	const [ message, setMessage ] = useState( '' );
	const [ messageType, setMessageType ] = useState( 'success' );

	useEffect( () => {
		dispatch( fetchPinStatus() )
			.unwrap()
			.then( ( res ) => setHasPin( !! res?.has_pin ) )
			.catch( () => setHasPin( false ) );
	}, [ dispatch ] );

	const flash = ( msg, type = 'success' ) => {
		setMessage( msg );
		setMessageType( type );
	};

	const savePin = async () => {
		if ( ! /^\d{4,12}$/.test( pin ) ) {
			flash( __( 'PIN must be 4–12 digits.', 'storeengine' ), 'error' );
			return;
		}
		setSaving( true );
		try {
			await dispatch( setSupervisorPin( pin ) ).unwrap();
			setHasPin( true );
			setPin( '' );
			flash( __( 'PIN updated.', 'storeengine' ), 'success' );
		} catch ( err ) {
			// Try multiple shapes: axios direct, the SerializedError that
			// createAsyncThunk's unwrap() throws (preserved via the wrapped
			// Error in the thunk), or our final generic fallback.
			flash(
				err?.response?.data?.message ||
					err?.message ||
					__( 'Could not save PIN.', 'storeengine' ),
				'error'
			);
		} finally {
			setSaving( false );
		}
	};

	const clearPin = async () => {
		if ( ! window.confirm( __( 'Clear your PIN? You will no longer be able to switch identity at the terminal without re-logging in.', 'storeengine' ) ) ) {
			return;
		}
		setSaving( true );
		try {
			await dispatch( clearSupervisorPin() ).unwrap();
			setHasPin( false );
			flash( __( 'PIN cleared.', 'storeengine' ), 'success' );
		} catch ( err ) {
			flash(
				err?.response?.data?.message || __( 'Could not clear PIN.', 'storeengine' ),
				'error'
			);
		} finally {
			setSaving( false );
		}
	};

	return (
		<ReactModal
			title={ __( 'My profile', 'storeengine' ) }
			isOpen={ true }
			isEnabledHeader={ true }
			isEnabledResizer={ false }
			size="small"
			onRequestClose={ onClose }
		>
			<div className="se-admin-tw">
				{ user?.display_name && (
					<p className="text-xs se-subtitle mb-3">
						{ user.display_name }
						{ user?.role ? (
							<span className="ml-1">· { user.role.replace( 'storeengine_', '' ).replace( /_/g, ' ' ) }</span>
						) : null }
					</p>
				) }

				{ user?.email ? (
					<div className="text-[16px] font-medium text-[#2C3135] leading-[22.4px] mb-4">
						{ user.email }
					</div>
				) : null }

				<div className="text-[14px] font-medium text-[#2C3135] leading-[22.4px] mb-4">
					{ __( 'Sign-in PIN', 'storeengine' ) }
				</div>

				<p className="text-[12px] font-normal text-[#101828] leading-[22.4px] mb-4">
					{ hasPin === null
						? __( 'Loading…', 'storeengine' )
						: hasPin
						? __(
							"You have a PIN set. Coworkers can use it to take over this terminal without making you sign out. Set a new value below to rotate it, or clear it if you don't want PIN switching.",
							'storeengine'
						)
					: __(
							"You don't have a PIN yet. Setting one lets you take over a terminal from a coworker without going back to the sign-in screen.",
							'storeengine'
						) }
				</p>

				<div className="text-[14px] font-medium text-[#2C3135] leading-[22.4px] mb-2">
					{ hasPin ? __( 'New PIN', 'storeengine' ) : __( 'PIN', 'storeengine' ) }
				</div>

				<div className='flex flex-row gap-4'>
					<input
						type="password"
						inputMode="numeric"
						maxLength={ 12 }
						value={ pin }
						onChange={ ( e ) => {
							setPin( e.target.value.replace( /\D/g, '' ) );
							setMessage( '' );
						} }
						className="storeengine-input"
						placeholder="••••"
					/>

					{ hasPin ? (
						<button
							type="button"
							onClick={ clearPin }
							disabled={ saving }
							className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[12px] font-normal rounded whitespace-nowrap cursor-pointer"
						>
							{ __( 'Clear PIN', 'storeengine' ) }
						</button>
					) : null }
				</div>

				{ message ? (
					<div
						className={
							'text-sm mb-2 ' +
							( messageType === 'error' ? 'se-error' : 'text-green-700' )
						}
					>
						{ message }
					</div>
				) : null }

				<div className="flex justify-end gap-4 border-0 border-t border-solid border-t-se-border py-5 mt-5">
					<button
						type="button"
						onClick={ onClose }
						className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[14px] font-normal rounded whitespace-nowrap cursor-pointer"
					>
						{ __( 'Close', 'storeengine' ) }
					</button>
					<button
						type="button"
						onClick={ savePin }
						disabled={ saving || ! pin }
						className="px-3 py-2 border border-solid border-se-primary bg-se-primary text-white text-[14px] font-normal rounded whitespace-nowrap cursor-pointer"
					>
						{ saving
							? __( 'Saving…', 'storeengine' )
							: hasPin
							? __( 'Update PIN', 'storeengine' )
							: __( 'Set PIN', 'storeengine' ) }
					</button>
				</div>
			</div>
		</ReactModal>
	);
};

export default PosProfileModal;
