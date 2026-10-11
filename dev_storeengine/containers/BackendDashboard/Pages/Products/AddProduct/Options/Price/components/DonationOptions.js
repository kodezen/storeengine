import React from 'react';
import { __ } from '@wordpress/i18n';
import { getIn, useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { getAddonActiveStatus } from '@Utils/helper';
import Select from '@Components/Formik/Select';
import Number from '@Components/Formik/Number';
import Checkbox from '@Components/Formik/Checkbox';

/**
 * Name-your-price / donation configuration for a price.
 *
 * Rendered by the donation addon's backend integration; the values live under
 * the `donation` key of the price form and are persisted to the
 * `_storeengine_donation_pricing` product-meta map server-side. Hidden
 * entirely when the `donation` addon is inactive, since the server-side
 * hooks that persist these fields never register in that case (see
 * AbstractAddon::run()) and the form would otherwise silently no-op on save.
 */
const MODE_OPTIONS = [
	{ value: 'fixed', label: __( 'Fixed price', 'storeengine' ) },
	{ value: 'name_your_price', label: __( 'Name your price', 'storeengine' ) },
	{ value: 'donation', label: __( 'Donation', 'storeengine' ) },
];

// Customer-set amounts make sense for a one-time charge or a recurring
// (subscription) charge — the customer's chosen amount just becomes the base
// price or the recurring price respectively. An installment plan splits a
// fixed total into fixed-percentage chunks, which a variable amount can't be
// divided into, so that price type is excluded.
const SUPPORTED_PRICE_TYPES = [ 'onetime', 'subscription' ];

// NOTE: `Number` is shadowed in this module by the imported Number field
// component, so use the global parseFloat/isNaN rather than Number.isFinite.
const num = ( v ) => {
	const n = parseFloat( v );
	return isNaN( n ) ? null : n;
};

/**
 * @param {Object}  props
 * @param {string}  [props.section] Which part to render: 'mode' (just the
 *   pricing-mode selector), 'details' (min/max/suggested/step/allow-custom), or
 *   'all' (default). Lets the simple view place the mode selector above the
 *   Price field and the detail fields below it.
 */
const DonationOptions = ( {
	priceProps,
	isSingle = false,
	simple = false,
	section = 'all',
} ) => {
	const { values, submitForm } = useFormikContext();
	const mode = getIn( values, 'donation.mode' ) ?? 'fixed';
	const allAddons = useSelector( ( state ) => state.addons );
	const isDonationAddonActive = getAddonActiveStatus( allAddons, 'donation' );

	if ( ! isDonationAddonActive ) {
		return null;
	}

	// Only one-time and subscription prices support customer-set amounts (see
	// SUPPORTED_PRICE_TYPES above). In the simplified pricing view there is no
	// price_type field (it is always a one-time price), so skip the gate there.
	if (
		! simple &&
		! SUPPORTED_PRICE_TYPES.includes( priceProps?.values?.price_type )
	) {
		return null;
	}

	const showMode = section === 'all' || section === 'mode';
	const showDetails = section === 'all' || section === 'details';

	// Nothing to render for the details section in fixed mode.
	if ( ! showMode && mode === 'fixed' ) {
		return null;
	}

	// Light client-side validation so misconfigurations are caught before save.
	// The server also normalizes (Helper::normalize_config), so a bad value can
	// never actually reach the storefront — this is just editor feedback.
	const dMin = num( getIn( values, 'donation.min' ) );
	const dMax = num( getIn( values, 'donation.max' ) );
	const dSuggested = num( getIn( values, 'donation.suggested' ) );
	const dStep = num( getIn( values, 'donation.step' ) );
	const warnings = [];
	if ( dMin !== null && dMin < 0 ) {
		warnings.push( __( 'Minimum amount cannot be negative.', 'storeengine' ) );
	}
	if ( dMin !== null && dMax !== null && dMax < dMin ) {
		warnings.push( __( 'Maximum amount must be greater than the minimum.', 'storeengine' ) );
	}
	if ( dStep !== null && dStep <= 0 ) {
		warnings.push( __( 'Step must be greater than zero.', 'storeengine' ) );
	}
	if ( dSuggested !== null && dMin !== null && dSuggested < dMin ) {
		warnings.push( __( 'Suggested amount is below the minimum.', 'storeengine' ) );
	}
	if ( dSuggested !== null && dMax !== null && dSuggested > dMax ) {
		warnings.push( __( 'Suggested amount is above the maximum.', 'storeengine' ) );
	}

	return (
		<div className="storeengine-donation-options storeengine-mt-6">
			{ showMode && (
				<Select
					title={ __( 'Pricing mode', 'storeengine' ) }
					subtitle={ __(
						'Let the customer set the amount (name your price) or turn this product into a donation.',
						'storeengine'
					) }
					name="donation.mode"
					options={ MODE_OPTIONS }
					suffix="pricing-mode"
				/>
			) }

			{ showDetails && mode !== 'fixed' && (
				<>
					<div className="storeengine-flex storeengine-flex-gap-8">
						<Number
							title={ __( 'Minimum amount', 'storeengine' ) }
							name="donation.min"
							prefix="donation-min"
							currency
							min={ 0 }
							onBlur={ () => isSingle && submitForm() }
						/>
						<Number
							title={ __( 'Maximum amount', 'storeengine' ) }
							name="donation.max"
							prefix="donation-max"
							currency
							min={ 0 }
							onBlur={ () => isSingle && submitForm() }
						/>
					</div>

					<div className="storeengine-flex storeengine-flex-gap-8">
						<Number
							title={ __( 'Suggested amount', 'storeengine' ) }
							name="donation.suggested"
							prefix="donation-suggested"
							currency
							min={ 0 }
							onBlur={ () => isSingle && submitForm() }
						/>
						<Number
							title={ __( 'Step', 'storeengine' ) }
							name="donation.step"
							prefix="donation-step"
							min={ 0.01 }
							step={ 0.01 }
							onBlur={ () => isSingle && submitForm() }
						/>
					</div>

					{ warnings.length > 0 && (
						<ul
							className="storeengine-donation-warnings"
							style={ {
								margin: '10px 0 0',
								padding: '10px 14px',
								listStyle: 'disc inside',
								background: '#fef3f2',
								border: '1px solid #fecdca',
								borderRadius: '8px',
								color: '#b42318',
								fontSize: '13px',
							} }
						>
							{ warnings.map( ( w, i ) => (
								<li key={ i }>{ w }</li>
							) ) }
						</ul>
					) }

					{ /* Name-your-price always lets the customer set the amount, so
					     the toggle only applies to donation mode (where a fixed
					     "Donate $X" button is a valid pattern). */ }
					{ mode === 'donation' && (
						<Checkbox
							title={ __( 'Allow custom amount', 'storeengine' ) }
							subtitle={ __(
								'When off, the customer can only pick the suggested amount.',
								'storeengine'
							) }
							name="donation.allow_custom"
							direction={ true }
						/>
					) }
				</>
			) }
		</div>
	);
};

export default DonationOptions;
