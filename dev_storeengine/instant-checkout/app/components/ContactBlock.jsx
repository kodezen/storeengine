import { createElement, useEffect, useRef, useState } from '@wordpress/element';
import { DIAL_CODES, detectDialCode, combinePhone, extractDialCode, isPhoneE164 } from './dialCodes.js';

/**
 * Resolve the contact identifier for OTP purposes.
 * user_email is the unified contact field for all modes.
 */
export function resolveIdentifier( mode, fields ) {
	return ( fields.user_email || '' ).trim();
}

/**
 * Minimal but robust email check used for inline feedback. The server stays the
 * source of truth (create_customer / place_order re-validate); this only gates
 * the UI so the shopper gets an early hint instead of failing at Place Order.
 * @param value
 */
export function isValidEmail( value ) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( ( value || '' ).trim() );
}

function splitE164( e164, savedPhone, storeDialCode ) {
	const code  = extractDialCode( e164 ) || detectDialCode( savedPhone, storeDialCode );
	const local = e164.startsWith( code ) ? e164.slice( code.length ) : '';
	return { code, local };
}

/**
 * Unified contact + OTP verification block.
 *
 * Replaces the separate ContactStep + ContactVerification pair with a single
 * component that renders the contact input and the Send code button in one
 * flush row — matching the traditional checkout's se-contact-block layout.
 */
export default function ContactBlock( {
	api,
	fields,
	onChange,
	mode,
	savedPhone,
	storeDialCode,
	verificationRequired,
	verified,
	onVerified,
} ) {
	const isPhoneOnly = mode === 'phone_only';
	const isMixed     = mode === 'phone_or_email';
	const showPhone   = isPhoneOnly || isMixed;

	// ── Contact input state ──────────────────────────────────────────────────

	const prefill      = ( fields.user_email || '' ).trim();
	const prefillPhone = showPhone && isPhoneE164( prefill );
	const initSplit    = prefillPhone ? splitE164( prefill, savedPhone, storeDialCode ) : null;

	const [ dialCode, setDialCode ] = useState(
		() => initSplit ? initSplit.code : detectDialCode( savedPhone, storeDialCode )
	);
	const [ localNum, setLocalNum ] = useState( () => initSplit ? initSplit.local : '' );
	const [ tab, setTab ] = useState( () => {
		if ( isPhoneOnly ) return 'phone';
		if ( isMixed && prefillPhone ) return 'phone';
		return 'email';
	} );

	// Safety-net: if parent sets user_email to an E.164 after mount (async restore)
	const restoredRef = useRef( prefillPhone );
	useEffect( () => {
		if ( restoredRef.current ) return;
		const val = ( fields.user_email || '' ).trim();
		if ( ! ( showPhone && isPhoneE164( val ) ) ) return;
		restoredRef.current = true;
		const split = splitE164( val, savedPhone, storeDialCode );
		setDialCode( split.code );
		setLocalNum( split.local );
		if ( isMixed ) setTab( 'phone' );
	}, [ fields.user_email ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// ── OTP state ────────────────────────────────────────────────────────────

	const [ sending,    setSending    ] = useState( false );
	const [ checking,   setChecking   ] = useState( false );
	const [ codeSent,   setCodeSent   ] = useState( false );
	const [ codeErr,    setCodeErr    ] = useState( false );
	const [ code,       setCode       ] = useState( '' );
	const [ statusMsg,  setStatusMsg  ] = useState( '' );
	const [ statusType, setStatusType ] = useState( '' ); // 'info' | 'ok' | 'error'
	const [ resendSecs, setResendSecs ] = useState( 0 );
	const resendTimer = useRef( null );

	// ── Inline contact validation ────────────────────────────────────────────
	// emailError: format problem to show under the field.
	// accountLoginUrl: set when a pre-check finds the email already has an
	// account — we surface a "Log in to continue" link instead of letting the
	// shopper discover it only at Place Order.
	const [ emailError,      setEmailError      ] = useState( '' );
	const [ accountLoginUrl, setAccountLoginUrl ] = useState( '' );

	// Clear interval on unmount
	useEffect( () => () => clearInterval( resendTimer.current ), [] );

	// Reset OTP UI when the identifier changes (contact edited after verifying)
	const prevId = useRef( resolveIdentifier( mode, fields ) );
	useEffect( () => {
		const current = resolveIdentifier( mode, fields );
		if ( current === prevId.current ) return;
		prevId.current = current;
		setCodeSent( false );
		setCode( '' );
		setCodeErr( false );
		setStatusMsg( '' );
		setStatusType( '' );
		setResendSecs( 0 );
		clearInterval( resendTimer.current );
	}, [ fields.user_email ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Clear OTP UI when parent reports verified (e.g. page-load restore)
	useEffect( () => {
		if ( verified ) {
			setStatusMsg( '' );
			setCode( '' );
			clearInterval( resendTimer.current );
		}
	}, [ verified ] );

	function startResendTimer( secs ) {
		clearInterval( resendTimer.current );
		setResendSecs( secs );
		resendTimer.current = setInterval( () => {
			setResendSecs( ( prev ) => {
				if ( prev <= 1 ) {
					clearInterval( resendTimer.current );
					return 0;
				}
				return prev - 1;
			} );
		}, 1000 );
	}

	// ── Contact handlers ─────────────────────────────────────────────────────

	function handleDialChange( e ) {
		const dc       = e.target.value;
		const combined = combinePhone( dc, localNum );
		setDialCode( dc );
		onChange( { user_email: combined, billing_phone: combined } );
	}

	function handleLocalChange( e ) {
		const local    = e.target.value;
		const combined = combinePhone( dialCode, local );
		setLocalNum( local );
		onChange( { user_email: combined, billing_phone: combined } );
	}

	function handleEmailChange( e ) {
		const val = e.target.value;
		// Clear inline feedback while the shopper is still typing — it re-runs
		// on blur so we never nag mid-keystroke.
		if ( emailError ) setEmailError( '' );
		if ( accountLoginUrl ) setAccountLoginUrl( '' );
		onChange( { user_email: val, billing_email: val } );
	}

	// Validate the email on blur: format first, then an "already has an account?"
	// pre-check. Email-only / email-tab paths only — phone is validated via
	// isPhoneE164 in the parent's place-order gate.
	async function handleEmailBlur() {
		const val = ( fields.user_email || '' ).trim();
		setAccountLoginUrl( '' );
		if ( ! val ) {
			// Don't flag an empty field on blur; required-ness is enforced at
			// Place Order so we don't scold a shopper who just tabbed past.
			setEmailError( '' );
			return;
		}
		if ( ! isValidEmail( val ) ) {
			setEmailError( 'Enter a valid email address.' );
			return;
		}
		setEmailError( '' );
		try {
			const res = await api.checkContact( val );
			if ( res && res.exists ) {
				setAccountLoginUrl( res.login_url || '' );
			}
		} catch ( err ) {
			// Non-fatal: the server still guards this at Place Order.
		}
	}

	function handleTabSwitch( next ) {
		setTab( next );
		setEmailError( '' );
		setAccountLoginUrl( '' );
		if ( next === 'email' ) {
			setLocalNum( '' );
			onChange( { user_email: '', billing_phone: '' } );
		} else {
			const combined = combinePhone( dialCode, localNum );
			onChange( { user_email: combined, billing_phone: combined } );
		}
	}

	// ── OTP handlers ─────────────────────────────────────────────────────────

	const identifier = resolveIdentifier( mode, fields );

	async function send() {
		if ( ! identifier ) {
			setStatusMsg( 'Enter your contact first.' );
			setStatusType( 'error' );
			return;
		}
		setSending( true );
		setStatusMsg( 'Sending…' );
		setStatusType( 'info' );
		try {
			const res = await api.requestOtp( identifier, 'checkout' );
			setCodeSent( true );
			setCode( '' );
			setCodeErr( false );
			const isPhone  = identifier.startsWith( '+' );
			setStatusMsg( 'Code sent — check your ' + ( isPhone ? 'phone.' : 'inbox.' ) );
			setStatusType( 'info' );
			const cooldown = ( res && res.expires_in ) ? Math.min( res.expires_in, 120 ) : 60;
			startResendTimer( cooldown );
		} catch ( e ) {
			setStatusMsg( e.message || 'Could not send the code.' );
			setStatusType( 'error' );
		} finally {
			setSending( false );
		}
	}

	async function check() {
		if ( ! code.trim() ) return;
		setChecking( true );
		setCodeErr( false );
		try {
			const res = await api.verifyOtp( identifier, code.trim(), 'checkout' );
			if ( res && res.verified ) {
				setStatusMsg( '' );
				clearInterval( resendTimer.current );
				onVerified();
			} else {
				setCodeErr( true );
				setStatusMsg( 'Incorrect code.' );
				setStatusType( 'error' );
			}
		} catch ( e ) {
			setCodeErr( true );
			setStatusMsg( e.message || 'Incorrect code.' );
			setStatusType( 'error' );
		} finally {
			setChecking( false );
		}
	}

	// ── Sub-elements ─────────────────────────────────────────────────────────

	const spinner = createElement( 'span', { className: 'se-otp__spinner', 'aria-hidden': 'true' } );

	// Dial-code select
	const dialSelect = createElement(
		'select',
		{ className: 'se-dial-select', value: dialCode, onChange: handleDialChange },
		...DIAL_CODES.map( ( d ) =>
			createElement( 'option', { key: d.code, value: d.code }, `${ d.code } ${ d.name }` )
		)
	);

	// Phone row (shared between phone_only and phone tab of mixed mode)
	const phoneRow = createElement(
		'div',
		{ className: 'se-phone-row' },
		dialSelect,
		createElement( 'input', {
			type:         'tel',
			className:    'se-phone-local',
			placeholder:  'Phone number',
			value:        localNum,
			autoComplete: 'tel-national',
			onChange:     handleLocalChange,
		} )
	);

	// Contact area (left / flex-1 part of the input row)
	let contactArea;
	if ( isPhoneOnly ) {
		contactArea = phoneRow;
	} else if ( isMixed ) {
		contactArea = tab === 'phone'
			? phoneRow
			: createElement( 'input', {
				type:         'email',
				className:    'se-cb__input' + ( emailError ? ' is-error' : '' ),
				placeholder:  'you@example.com',
				autoComplete: 'email',
				required:     true,
				value:        fields.user_email || '',
				onChange:     handleEmailChange,
				onBlur:       handleEmailBlur,
			} );
	} else {
		// email-only
		contactArea = createElement( 'input', {
			type:         'email',
			className:    'se-cb__input' + ( emailError ? ' is-error' : '' ),
			placeholder:  'you@example.com',
			autoComplete: 'email',
			required:     true,
			value:        fields.user_email || '',
			onChange:     handleEmailChange,
			onBlur:       handleEmailBlur,
		} );
	}

	// Action slot: Send button | Verified pill
	const actionSlot = verificationRequired
		? createElement(
			'div',
			{ className: 'se-contact-block__action' },
			verified
				? createElement(
					'div',
					{ className: 'se-otp__verified-pill' },
					createElement(
						'svg',
						{ viewBox: '0 0 24 24', 'aria-hidden': 'true' },
						createElement( 'polyline', { points: '20 6 9 17 4 12' } )
					),
					'Verified'
				  )
				: createElement(
					'button',
					{
						type:      'button',
						className: 'se-otp__btn--send' + ( sending ? ' se-otp__btn--loading' : '' ),
						onClick:   send,
						disabled:  sending,
					},
					createElement( 'span', { className: 'se-otp__btn-label' },
						codeSent ? 'Resend' : 'Send code'
					),
					spinner
				  )
		  )
		: null;

	// Inline contact notice: a format error, or an "account already exists →
	// log in" hint from the blur pre-check. Distinct from the OTP status line.
	const contactNoticeEl = ( emailError || accountLoginUrl )
		? createElement(
			'div',
			{ className: 'se-cb__contact-notice se-otp__status se-otp__status--error', role: 'alert', 'aria-live': 'polite' },
			emailError
				? emailError
				: createElement(
					'span',
					null,
					'An account is already registered with this email. ',
					accountLoginUrl
						? createElement( 'a', {
							href:  accountLoginUrl,
							style: { fontWeight: 600, textDecoration: 'underline' },
						}, 'Log in to continue' )
						: null
				  )
		  )
		: null;

	// Status line (non-empty = visible)
	const statusEl = statusMsg
		? createElement( 'span', {
			className:   'se-otp__status se-otp__status--' + statusType,
			role:        'status',
			'aria-live': 'polite',
		  }, statusMsg )
		: null;

	// Code-entry section
	const confirmEl = ( codeSent && ! verified )
		? createElement(
			'div',
			{ className: 'se-otp__confirm' },
			createElement(
				'div',
				{ className: 'se-otp__code-row' },
				createElement( 'input', {
					type:          'text',
					inputMode:     'numeric',
					autoComplete:  'one-time-code',
					className:     'se-otp__code-input' + ( codeErr ? ' is-error' : '' ),
					placeholder:   '6-digit code',
					'aria-label':  'Verification code',
					maxLength:     8,
					value:         code,
					onChange:      ( e ) => setCode( e.target.value ),
					onKeyDown:     ( e ) => { if ( e.key === 'Enter' ) check(); },
				} ),
				createElement(
					'button',
					{
						type:      'button',
						className: 'se-otp__btn se-otp__btn--primary' + ( checking ? ' se-otp__btn--loading' : '' ),
						onClick:   check,
						disabled:  checking,
					},
					createElement( 'span', { className: 'se-otp__btn-label' }, 'Verify' ),
					spinner
				)
			),
			createElement(
				'div',
				{ className: 'se-otp__resend' },
				resendSecs > 0 && createElement( 'span', { className: 'se-otp__timer' },
					'Resend in ' + resendSecs + 's'
				),
				createElement(
					'button',
					{
						type:      'button',
						className: 'se-otp__resend-btn',
						onClick:   send,
						disabled:  sending || resendSecs > 0,
					},
					'Resend code'
				)
			)
		  )
		: null;

	// ── Render ───────────────────────────────────────────────────────────────

	return createElement(
		'div',
		{ className: 'se-embedded-app__section' },

		createElement( 'h3', { className: 'se-embedded-app__section-title' },
			'Contact',
			createElement( 'span', {
				className:   'se-required',
				'aria-hidden': 'true',
				style:       { color: '#dc2626', marginLeft: '4px' },
			}, '*' )
		),

		// Tabs above the block (phone_or_email only)
		isMixed && createElement(
			'div',
			{ className: 'se-contact-tabs' },
			createElement( 'button', {
				type:      'button',
				className: 'se-contact-tab' + ( tab === 'email' ? ' se-contact-tab--active' : '' ),
				onClick:   () => handleTabSwitch( 'email' ),
			}, 'Email' ),
			createElement( 'button', {
				type:      'button',
				className: 'se-contact-tab' + ( tab === 'phone' ? ' se-contact-tab--active' : '' ),
				onClick:   () => handleTabSwitch( 'phone' ),
			}, 'Phone' )
		),

		// Unified block
		createElement(
			'div',
			{ className: 'se-contact-block' + ( isMixed ? ' se-contact-block--tabs' : '' ) },

			// Input row: contact field(s) + action
			createElement(
				'div',
				{ className: 'se-contact-block__input-row' },
				contactArea,
				actionSlot
			),

			// Inline format / account-exists notice
			contactNoticeEl,

			// Status (collapsed when empty)
			statusEl,

			// Code-entry + resend (visible after Send is clicked)
			confirmEl
		)
	);
}
