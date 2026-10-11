import { createElement, useEffect, useRef, useState } from '@wordpress/element';
import { DIAL_CODES, detectDialCode, combinePhone, extractDialCode, isPhoneE164 } from './dialCodes.js';

/**
 * Compute initial dial code + local number from a pre-filled user_email value.
 * Used to initialise state when the parent has already restored a verified phone
 * (e.g. after a page refresh).
 */
function splitE164( e164, savedPhone, storeDialCode ) {
	const code  = extractDialCode( e164 ) || detectDialCode( savedPhone, storeDialCode );
	const local = e164.startsWith( code ) ? e164.slice( code.length ) : '';
	return { code, local };
}

export default function ContactStep( { fields, onChange, mode, savedPhone, storeDialCode } ) {
	const isPhoneOnly = mode === 'phone_only';
	const isMixed     = mode === 'phone_or_email';
	const showPhone   = isPhoneOnly || isMixed;

	// --- compute initial state from pre-filled fields (e.g. refresh-restore) ---
	const prefill      = ( fields.user_email || '' ).trim();
	const prefillPhone = showPhone && isPhoneE164( prefill );
	const initSplit    = prefillPhone ? splitE164( prefill, savedPhone, storeDialCode ) : null;

	const [ dialCode, setDialCode ] = useState(
		() => initSplit ? initSplit.code : detectDialCode( savedPhone, storeDialCode )
	);
	const [ localNum, setLocalNum ] = useState( () => initSplit ? initSplit.local : '' );
	const [ tab, setTab ]           = useState( () => {
		if ( isPhoneOnly ) return 'phone';
		if ( isMixed && prefillPhone ) return 'phone';
		return 'email';
	} );

	// Safety-net: if the parent updates user_email externally AFTER mount (e.g.
	// async restore finishing slightly after React 17 renders ContactStep without
	// batching), detect the E.164 and re-initialize once.
	const restoredRef = useRef( prefillPhone ); // already done if we had a prefill
	useEffect( () => {
		if ( restoredRef.current ) return;
		const val = ( fields.user_email || '' ).trim();
		if ( ! ( showPhone && isPhoneE164( val ) ) ) return;
		restoredRef.current = true;
		const split = splitE164( val, savedPhone, storeDialCode );
		setDialCode( split.code );
		setLocalNum( split.local );
		if ( isMixed ) setTab( 'phone' );
		// Do NOT call onChange here — the parent already has the correct value.
	}, [ fields.user_email ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// --- event handlers ---------------------------------------------------------

	function handleDialChange( e ) {
		const code     = e.target.value;
		const combined = combinePhone( code, localNum );
		setDialCode( code );
		onChange( { user_email: combined, billing_phone: combined } );
	}

	function handleLocalChange( e ) {
		const local    = e.target.value;
		const combined = combinePhone( dialCode, local );
		setLocalNum( local );
		onChange( { user_email: combined, billing_phone: combined } );
	}

	function handleEmailChange( e ) {
		const value = e.target.value;
		onChange( { user_email: value, billing_email: value } );
	}

	function handleTabSwitch( next ) {
		setTab( next );
		if ( next === 'email' ) {
			setLocalNum( '' );
			onChange( { user_email: '', billing_phone: '' } );
		} else {
			// Switching to phone — push whatever is already composed (or empty).
			const combined = combinePhone( dialCode, localNum );
			onChange( { user_email: combined, billing_phone: combined } );
		}
	}

	// --- sub-components ---------------------------------------------------------

	const dialSelect = createElement(
		'select',
		{
			className: 'se-dial-select',
			value:     dialCode,
			onChange:  handleDialChange,
		},
		...DIAL_CODES.map( ( d ) =>
			createElement( 'option', { key: d.code, value: d.code }, `${ d.code } ${ d.name }` )
		)
	);

	const localInput = createElement( 'input', {
		type:         'tel',
		className:    'se-embedded-app__input se-phone-local',
		placeholder:  'Phone number',
		value:        localNum,
		autoComplete: 'tel-national',
		onChange:     handleLocalChange,
	} );

	const phoneRow = createElement(
		'div',
		{ className: 'se-phone-row' },
		dialSelect,
		localInput
	);

	// --- render -----------------------------------------------------------------

	if ( isPhoneOnly ) {
		return createElement(
			'div',
			{ className: 'se-embedded-app__section' },
			createElement( 'h3', { className: 'se-embedded-app__section-title' }, 'Contact' ),
			createElement( 'label', { className: 'se-embedded-app__label' },
				createElement( 'span', null, 'Phone number' )
			),
			phoneRow
		);
	}

	if ( isMixed ) {
		return createElement(
			'div',
			{ className: 'se-embedded-app__section' },
			createElement( 'h3', { className: 'se-embedded-app__section-title' }, 'Contact' ),
			createElement(
				'div',
				{ className: 'se-contact-tabs' },
				createElement(
					'button',
					{
						type:      'button',
						className: 'se-contact-tab' + ( tab === 'email' ? ' se-contact-tab--active' : '' ),
						onClick:   () => handleTabSwitch( 'email' ),
					},
					'Email'
				),
				createElement(
					'button',
					{
						type:      'button',
						className: 'se-contact-tab' + ( tab === 'phone' ? ' se-contact-tab--active' : '' ),
						onClick:   () => handleTabSwitch( 'phone' ),
					},
					'Phone'
				)
			),
			tab === 'email'
				? createElement(
					'label',
					{ className: 'se-embedded-app__label' },
					createElement( 'input', {
						type:         'email',
						required:     true,
						value:        fields.user_email || '',
						onChange:     handleEmailChange,
						placeholder:  'you@example.com',
						autoComplete: 'email',
					} )
				)
				: phoneRow
		);
	}

	// email_only
	return createElement(
		'div',
		{ className: 'se-embedded-app__section' },
		createElement( 'h3', { className: 'se-embedded-app__section-title' }, 'Contact' ),
		createElement( 'label', { className: 'se-embedded-app__label' },
			createElement( 'span', null, 'Email' ),
			createElement( 'input', {
				type:         'email',
				required:     true,
				value:        fields.user_email || '',
				onChange:     handleEmailChange,
				placeholder:  'you@example.com',
				autoComplete: 'email',
			} )
		)
	);
}
