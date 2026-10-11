import { createElement, useState } from '@wordpress/element';

/**
 * Return the contact identifier the OTP widget should verify.
 *
 * In the instant checkout, user_email is always the unified contact field
 * (ContactStep binds to it for all modes). billing_phone is the billing-
 * address phone (a separate BillingShipping field) and must NOT be used as
 * the contact identifier — it may hold a different number that was never
 * verified.
 */
export function resolveIdentifier( mode, fields ) {
	return ( fields.user_email || '' ).trim();
}

/**
 * OTP verification gate shown above the place-order button when the store
 * requires a verified contact. Calls the /otp/request + /otp/verify endpoints
 * and reports verification up via onVerified.
 */
export default function ContactVerification( {
	api,
	mode,
	fields,
	verified,
	onVerified,
} ) {
	const [ sending, setSending ] = useState( false );
	const [ checking, setChecking ] = useState( false );
	const [ codeSent, setCodeSent ] = useState( false );
	const [ code, setCode ] = useState( '' );
	const [ status, setStatus ] = useState( '' );

	const identifier = resolveIdentifier( mode, fields );

	const send = async () => {
		if ( ! identifier ) {
			setStatus( 'Enter your contact first.' );
			return;
		}
		setSending( true );
		setStatus( 'Sending…' );
		try {
			await api.requestOtp( identifier, 'checkout' );
			setCodeSent( true );
			setStatus( 'Code sent.' );
		} catch ( e ) {
			setStatus( e.message || 'Could not send the code.' );
		} finally {
			setSending( false );
		}
	};

	const check = async () => {
		if ( ! code.trim() ) {
			return;
		}
		setChecking( true );
		try {
			const res = await api.verifyOtp( identifier, code.trim(), 'checkout' );
			if ( res && res.verified ) {
				setStatus( '✓ Verified' );
				onVerified();
			} else {
				setStatus( 'Incorrect code.' );
			}
		} catch ( e ) {
			setStatus( e.message || 'Incorrect code.' );
		} finally {
			setChecking( false );
		}
	};

	if ( verified ) {
		return createElement(
			'div',
			{ className: 'rounded-md bg-green-50 text-green-700 text-sm px-3 py-2 mt-2' },
			'✓ Contact verified'
		);
	}

	return createElement(
		'div',
		{ className: 'rounded-md border border-solid border-gray-200 p-3 mt-2 flex flex-col gap-2' },
		createElement(
			'span',
			{ className: 'text-sm font-medium text-gray-700' },
			'Verify your contact to place the order'
		),
		createElement(
			'div',
			{ className: 'flex items-center gap-2' },
			createElement(
				'button',
				{
					type: 'button',
					className:
						'rounded bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-sm border-0 disabled:opacity-50',
					onClick: send,
					disabled: sending,
				},
				codeSent ? 'Resend code' : 'Send code'
			),
			status &&
				createElement(
					'span',
					{ className: 'text-xs text-gray-500' },
					status
				)
		),
		codeSent &&
			createElement(
				'div',
				{ className: 'flex items-center gap-2' },
				createElement( 'input', {
					type: 'text',
					inputMode: 'numeric',
					autoComplete: 'one-time-code',
					className: 'border border-solid border-gray-300 rounded px-2 py-1.5 text-sm',
					placeholder: 'Enter code',
					value: code,
					onChange: ( e ) => setCode( e.target.value ),
				} ),
				createElement(
					'button',
					{
						type: 'button',
						className:
							'rounded bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm border-0 disabled:opacity-50',
						onClick: check,
						disabled: checking,
					},
					'Verify'
				)
			)
	);
}
