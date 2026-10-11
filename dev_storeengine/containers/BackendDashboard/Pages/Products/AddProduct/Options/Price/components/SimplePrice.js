import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import Number from '@Components/Formik/Number';
import { FieldGate } from '../../../productFormConfig';
import { Button } from '@Components/ui';
import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { getDefaultPriceName, getPriceUnitCaption, persistSimplePrice } from '../helper';
import DonationOptions from './DonationOptions';

/**
 * The simplified pricing view: a single price + optional compare-at price, the
 * 90% case. No price label, no price-type radios, no repeater. The values live
 * on the main product form (`_simple_price` / `_simple_compare_price`) and are
 * persisted by the product Save handler, so there is no separate "Save Price"
 * step and no "create the product first" wall.
 */
const SimplePrice = () => {
	const { values, setFieldValue } = useFormikContext();
	const dispatch = useDispatch();
	const [ isSwitching, setIsSwitching ] = useState( false );

	// Seed the donation/name-your-price config from the existing one-time price
	// (surfaced in its settings by the donation addon) so editing a configured
	// product shows its current mode. Runs once when a donation config is present
	// and the form field hasn't been populated yet.
	useEffect( () => {
		if ( values.donation ) {
			return;
		}
		const onetime = ( values.prices ?? [] ).find(
			( p ) => p?.price_type === 'onetime'
		);
		const cfg = onetime?.settings?.donation;
		setFieldValue(
			'donation',
			cfg && cfg.mode
				? cfg
				: {
						mode: 'fixed',
						min: '',
						max: '',
						suggested: '',
						step: 1,
						allow_custom: true,
				  }
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const switchToAdvanced = async () => {
		const productId = values?.id;
		const price = values?._simple_price;
		const comparePrice = values?._simple_compare_price;
		const hasOnetime = ( values?.prices ?? [] ).some(
			( p ) => p?.price_type === 'onetime'
		);

		// Carry an unsaved simple price over as the first price row so the
		// merchant doesn't lose what they just typed when expanding to the
		// full multi-price UI. Only safe once the product itself exists and
		// there is no existing one-time row to collide with.
		// Compare-at price is optional; only a positive value that isn't higher
		// than the price is invalid (0 / empty just means "no compare price").
		const compareIsInvalid =
			parseFloat( comparePrice ) > 0 &&
			parseFloat( comparePrice ) <= parseFloat( price );

		const canCarry =
			productId &&
			price !== '' &&
			price !== null &&
			price !== undefined &&
			! hasOnetime &&
			! compareIsInvalid;

		if ( canCarry ) {
			setIsSwitching( true );
			try {
				const created = await persistSimplePrice( {
					productId,
					priceName: getDefaultPriceName(),
					price,
					comparePrice,
					donation: values.donation,
				} );
				setFieldValue( 'prices', [
					...( values.prices ?? [] ),
					created,
				] );
			} catch ( error ) {
				dispatch(
					showNotification( {
						message:
							error?.message ||
							error ||
							__(
								'Could not carry the price over.',
								'storeengine'
							),
						isShow: true,
						type: 'error',
					} )
				);
			} finally {
				setIsSwitching( false );
			}
		}

		setFieldValue( '_pricing_mode', 'advanced' );
	};

	// In donation / name-your-price mode the customer sets the amount, so a
	// compare-at ("was") price is meaningless; the Price field is just the base
	// shown before the customer enters their amount.
	const customerPriced = [ 'name_your_price', 'donation' ].includes(
		values?.donation?.mode
	);

	return (
		<div className="storeengine-product-editor-pricing__simple">
			{ /* Price type (pricing mode) sits above the price fields. */ }
			<DonationOptions simple section="mode" />

			<div className="storeengine-flex gap-4">
				<FieldGate id="price">
					<Number
						title={
							customerPriced
								? __( 'Base price', 'storeengine' )
								: __( 'Price', 'storeengine' )
						}
						subtitle={ getPriceUnitCaption( values ) }
						name="_simple_price"
						prefix="price"
						currency
					/>
				</FieldGate>
				{ ! customerPriced && (
					<FieldGate id="compare_price">
						<Number
							title={ __( 'Compare-at price', 'storeengine' ) }
							name="_simple_compare_price"
							prefix="price-comparison"
							currency
						/>
					</FieldGate>
				) }
			</div>

			<DonationOptions simple section="details" />

			<div className="storeengine-product-editor-pricing__add-btn">
				<Button
					type="button"
					preset="outline"
					size="sm"
					onClick={ switchToAdvanced }
					icon="storeengine-icon--add"
					isLoading={ isSwitching }
					disabled={ isSwitching }
				>
					{ __( 'Add pricing options', 'storeengine' ) }
				</Button>
			</div>
		</div>
	);
};

export default SimplePrice;
