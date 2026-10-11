import React, { useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import Select from 'react-select';
import { Button } from '@Components/ui';
import { getAddonActiveStatus, route_path } from '@Utils/helper';
import { useSelector } from 'react-redux';
import Tooltip from '@Components/Tooltip';
import PurchaseInfo from './PurchaseInfo';
import { subscriptionDateType } from '../options';

/**
 * GemBooking-style simple pricing for an access group.
 *
 * One number decides everything: empty/0 → FREE (no product, access granted
 * manually or by role), a value → PAID (one price sold through StoreEngine).
 * A billing toggle upgrades the single price to a recurring subscription.
 * The full multi-tier builder stays available under "Advanced pricing".
 *
 * The simple field writes the SAME `values.prices` array the advanced panel
 * uses, so the existing save path (Api\Product::save_product →
 * IntegrationTrait::handle_integrations) creates/updates/removes the product,
 * price and integration row unchanged.
 */
const BILLING = {
	ONETIME: 'onetime',
	RECURRING: 'subscription',
};

const PricingSection = () => {
	const { values, setFieldValue } = useFormikContext();
	const allAddons = useSelector( ( state ) => state.addons );
	const hasSubscription = getAddonActiveStatus( allAddons, 'subscription' );

	const prices = values?.prices || [];

	// The advanced builder owns anything the simple field can't represent:
	// more than one price, or a price attached to a predefined product.
	const isComplex =
		prices.length > 1 ||
		prices.some( ( p ) => p?.type === 'predefined' );

	const [ advancedOpen, setAdvancedOpen ] = useState( isComplex );

	const single = prices.length === 1 && ! isComplex ? prices[ 0 ] : null;
	const priceValue = single?.price ?? '';
	const billing = single?.price_type === BILLING.RECURRING
		? BILLING.RECURRING
		: BILLING.ONETIME;
	const durationValue = single?.payment_duration ?? 1;
	const durationType = single?.payment_duration_type ?? 'month';

	const isPaid = parseFloat( priceValue ) > 0;
	const linkedProductId = single?.product_id ? parseInt( single.product_id, 10 ) : 0;
	const editProductUrl = linkedProductId
		? `${ route_path }admin.php?page=storeengine-products&id=${ linkedProductId }&action=edit`
		: '';

	const periodOption = useMemo(
		() =>
			subscriptionDateType.find( ( o ) => o.value === durationType ) ||
			subscriptionDateType[ 2 ],
		[ durationType ]
	);

	// Build the single price entry, preserving ids when editing so the backend
	// updates the existing price/integration instead of spawning a new one.
	const writeSinglePrice = ( patch ) => {
		const next = {
			id: single?.id,
			price_id: single?.price_id ?? 0,
			product_id: single?.product_id ?? 0,
			type: 'custom',
			price_name: single?.price_name || __( 'Membership', 'storeengine' ),
			price_type: billing,
			price: priceValue,
			compare_price: single?.compare_price ?? null,
			order: single?.order ?? 0,
			payment_duration: durationValue,
			payment_duration_type: durationType,
			...patch,
		};

		const amount = parseFloat( next.price );

		if ( ! amount || amount <= 0 ) {
			// Empty / zero → free membership: drop the price entirely so the
			// save path removes the integration.
			setFieldValue( 'prices', [] );
			return;
		}

		if ( next.price_type === BILLING.ONETIME ) {
			delete next.payment_duration;
			delete next.payment_duration_type;
		}

		setFieldValue( 'prices', [ next ] );
	};

	if ( isComplex ) {
		// Nothing the simple field can safely edit — show the advanced builder
		// and a short note instead of a lossy single-price control.
		return (
			<div className="storeengine-content-section">
				<h2 className="storeengine-heading">
					{ __( 'Pricing', 'storeengine' ) }
				</h2>
				<p className="storeengine-title-subtitle storeengine-mb-4">
					{ __(
						'This membership has multiple prices. Manage them below.',
						'storeengine'
					) }
				</p>
				<PurchaseInfo embedded />
			</div>
		);
	}

	return (
		<div className="storeengine-content-section">
			<div className="storeengine-pricing-head storeengine-flex storeengine-flex-justify-between storeengine-flex-align-center">
				<h2 className="storeengine-heading storeengine-mb-0">
					{ __( 'Pricing', 'storeengine' ) }
				</h2>
				<span
					className={ `storeengine-badge ${
						isPaid
							? 'storeengine-badge--success'
							: 'storeengine-badge--muted'
					}` }
					style={ {
						fontSize: '12px',
						padding: '2px 10px',
						borderRadius: '999px',
						background: isPaid ? '#e6f4ec' : '#eef0f3',
						color: isPaid ? '#1a7f4b' : '#6b7280',
					} }
				>
					{ isPaid
						? __( 'Paid', 'storeengine' )
						: __( 'Free', 'storeengine' ) }
				</span>
			</div>

			<div className="storeengine-mt-4">
				<label className="storeengine-title storeengine-d-block storeengine-mb-2">
					{ __( 'Price', 'storeengine' ) }
				</label>
				<input
					type="number"
					min="0"
					step="0.01"
					className="storeengine-input storeengine-width-full"
					placeholder="0.00"
					value={ priceValue }
					onChange={ ( e ) =>
						writeSinglePrice( { price: e.target.value } )
					}
				/>
				<p className="storeengine-title-subtitle storeengine-mt-2">
					{ __(
						'Leave empty to keep this membership free — access is then granted manually or by user role.',
						'storeengine'
					) }
				</p>
			</div>

			{ isPaid && (
				<div className="storeengine-mt-4">
					<label className="storeengine-title storeengine-d-block storeengine-mb-2">
						{ __( 'Billing', 'storeengine' ) }
					</label>
					<div className="storeengine-mt-4 storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center">
						<label className="storeengine-pointer storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center">
							<input
								type="radio"
								className="storeengine-radio"
								checked={ billing === BILLING.ONETIME }
								onChange={ () =>
									writeSinglePrice( {
										price_type: BILLING.ONETIME,
									} )
								}
							/>
							{ __( 'One-time', 'storeengine' ) }
						</label>
						<label
							className={ `storeengine-pointer storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center ${
								! hasSubscription
									? 'storeengine-label-disable'
									: ''
							}` }
						>
							<input
								type="radio"
								className="storeengine-radio"
								disabled={ ! hasSubscription }
								checked={ billing === BILLING.RECURRING }
								onChange={ () =>
									writeSinglePrice( {
										price_type: BILLING.RECURRING,
									} )
								}
							/>
							{ __( 'Recurring', 'storeengine' ) }
							{ ! hasSubscription && (
								<Tooltip>
									{ __(
										'Subscription addon is required.',
										'storeengine'
									) }
								</Tooltip>
							) }
						</label>
					</div>

					{ billing === BILLING.RECURRING && hasSubscription && (
						<div className="storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center storeengine-mt-4">
							<span className="storeengine-title">
								{ __( 'Every', 'storeengine' ) }
							</span>
							<input
								type="number"
								min="1"
								step="1"
								className="storeengine-input"
								style={ { width: '90px' } }
								value={ durationValue }
								onChange={ ( e ) =>
									writeSinglePrice( {
										payment_duration:
											parseInt( e.target.value, 10 ) || 1,
									} )
								}
							/>
							<Select
								className="storeengine-select"
								classNamePrefix="storeengine-react-select"
								value={ periodOption }
								options={ subscriptionDateType }
								onChange={ ( option ) =>
									writeSinglePrice( {
										payment_duration_type: option.value,
									} )
								}
								menuPlacement="auto"
							/>
						</div>
					) }
				</div>
			) }

			{ isPaid && editProductUrl && (
				<a
					href={ editProductUrl }
					target="_blank"
					rel="noopener noreferrer"
					className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-4 storeengine-mt-4"
					style={ {
						fontSize: '13px',
						color: 'var(--storeengine-primary-color, #006bff)',
						textDecoration: 'none',
					} }
				>
					<span
						className="storeengine-icon storeengine-icon--link"
						aria-hidden={ true }
					/>
					{ __( 'Edit linked product', 'storeengine' ) }
					<span aria-hidden={ true }>↗</span>
				</a>
			) }

			<div className="storeengine-mt-6">
				<Button
					type="button"
					preset="outline"
					size="sm"
					className="storeengine-pricing-advanced-toggle"
					aria-expanded={ advancedOpen }
					onClick={ () => setAdvancedOpen( ( v ) => ! v ) }
				>
					<span>{ __( 'Advanced pricing', 'storeengine' ) }</span>
					<span
						className="storeengine-pricing-advanced-toggle__chevron"
						aria-hidden={ true }
					>
						{ advancedOpen ? '▾' : '▸' }
					</span>
				</Button>

				{ advancedOpen && (
					<div className="storeengine-pricing-advanced storeengine-mt-4">
						<p className="storeengine-title-subtitle storeengine-mb-4">
							{ __(
								'Add multiple tiers or link an existing product. Changes here override the simple price above.',
								'storeengine'
							) }
						</p>
						<PurchaseInfo embedded />
					</div>
				) }
			</div>
		</div>
	);
};

export default PricingSection;
