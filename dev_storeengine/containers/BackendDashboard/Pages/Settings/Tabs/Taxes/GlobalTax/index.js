import React from 'react';
import { __ } from '@wordpress/i18n';
import { Field, useFormikContext } from 'formik';
import Label from '@Components/Formik/Label';
import { Select } from '@Components/ui/Select';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import { Scope, Heading } from '@Components/ui';

import './styles.scss';

const tax_total_display_options = [
	{
		label: __( 'As a single total', 'storeengine' ),
		value: 'single',
	},
	{
		label: __( 'Itemized', 'storeengine' ),
		value: 'itemized',
	},
];
const tax_display_options = [
	{
		label: __( 'Including tax', 'storeengine' ),
		value: 'incl',
	},
	{
		label: __( 'Excluding tax', 'storeengine' ),
		value: 'excl',
	},
];
const tax_base_options = [
	{
		label: __( 'Customer shipping address', 'storeengine' ),
		value: 'shipping',
	},
	{
		label: __( 'Customer billing address', 'storeengine' ),
		value: 'billing',
	},
	{
		label: __( 'Shop base address', 'storeengine' ),
		value: 'base',
	},
];

const GlobalTax = () => {
	const { values, setFieldValue } = useFormikContext();
	const isTaxEnabled = !! values.enable_product_tax;
	const isStripeTaxEnabled = !! values.enable_stripe_tax;
	const isStripeGatewayEnabled = !! values?.payments?.stripe?.is_enabled;
	// `prices_include_tax` and the cart/total display options remain useful
	// under Stripe Auto Tax — the first is forwarded to Stripe as `tax_behavior`,
	// the others are pure storefront display. Only the rounding mode is owned
	// by Stripe (per-jurisdiction rules) and so gets disabled.
	const fieldsDisabled = ! isTaxEnabled;
	const roundingDisabled = ! isTaxEnabled || isStripeTaxEnabled;

	return (
		<Scope>
			<div
				id="settingsTaxes"
				className="storeengine-content-section--global-tax"
			>
				<Heading>
					{ __( 'Tax Settings', 'storeengine' ) }
				</Heading>
				<Checkbox
					title={ __( 'Enable tax calculations', 'storeengine' ) }
					name="enable_product_tax"
				/>

				{ isTaxEnabled && (
					<div className="storeengine-stripe-auto-tax">
						<Checkbox
							title={ __(
								'Enable Stripe Automatic Tax',
								'storeengine'
							) }
							name="enable_stripe_tax"
							tooltip={ __(
								'Delegate tax calculation, collection and reporting to Stripe Tax. Requires the Stripe payment method to be enabled and at least one tax registration in your Stripe Dashboard.',
								'storeengine'
							) }
						/>

						{ isStripeTaxEnabled ? (
							<>
								<Text
									title={ __(
										'Default product tax code',
										'storeengine'
									) }
									name="stripe_tax_default_code"
									placeholder="txcd_99999999"
									tooltip={ __(
										'Used when a product does not have its own Stripe tax code. See https://docs.stripe.com/tax/tax-codes for the full list.',
										'storeengine'
									) }
								/>
								<Text
									title={ __(
										'Shipping tax code',
										'storeengine'
									) }
									name="stripe_tax_shipping_code"
									placeholder="txcd_92010001"
								/>
								<Checkbox
									title={ __(
										'Fall back to local tax engine if Stripe is unreachable',
										'storeengine'
									) }
									name="stripe_tax_fallback_to_local"
									suffix="plain"
									tooltip={ __(
										'When off (recommended), checkout is blocked with an error if Stripe Tax cannot be reached. When on, the manually-configured rates below are used as a fallback.',
										'storeengine'
									) }
								/>
							</>
						) : (
							<div className="storeengine-stripe-auto-tax__notice storeengine-stripe-auto-tax__notice--warning">
								<span
									className="storeengine-icon storeengine-icon--warning"
									aria-hidden="true"
								/>
								<div>
									<strong>
										{ __(
											'Stripe payment method is not enabled.',
											'storeengine'
										) }
									</strong>
									<p>
										{ __(
											'Stripe Automatic Tax uses your Stripe API keys. Enable Stripe under Payment Methods before saving, otherwise calculations will fail at checkout.',
											'storeengine'
										) }
									</p>
								</div>
							</div>
						)}
					</div>
				) }

				<div
					className={ `storeengine-tax-fields${ fieldsDisabled ? ' storeengine-tax-fields--disabled' : '' }` }
				>
					<div
						className="storeengine-flex"
						style={ { marginBottom: '24px' } }
					>
						<Label
							title={ __(
								'Prices entered with tax',
								'storeengine'
							) }
							tooltip={ __(
								'This option is important as it will affect how you input prices. Changing it will not update existing products.',
								'storeengine'
							) }
							isRequired={ true }
						/>
						<div className="storeengine-global-tax-radio">
							<label>
								<Field
									type="radio"
									name="prices_include_tax"
									onChange={ () =>
										setFieldValue(
											'prices_include_tax',
											true
										)
									}
									value={ true }
									className="storeengine-radio"
								/>
								<span className="storeengine-title-light">
									{ __(
										'Yes, I will enter prices inclusive of tax',
										'storeengine'
									) }
								</span>
							</label>
							<label>
								<Field
									type="radio"
									name="prices_include_tax"
									onChange={ () =>
										setFieldValue(
											'prices_include_tax',
											false
										)
									}
									value={ false }
									className="storeengine-radio"
								/>
								<span className="storeengine-title-light">
									{ __(
										'No, I will enter prices exclusive of tax',
										'storeengine'
									) }
								</span>
							</label>
						</div>
					</div>
					<div
						className={ `storeengine-flex${ roundingDisabled ? ' storeengine-tax-fields--disabled' : '' }` }
						style={ { marginBottom: '24px' } }
					>
						<Label
							title={ __( 'Rounding', 'storeengine' ) }
							tooltip={
								isStripeTaxEnabled
									? __(
										'Stripe Automatic Tax applies its own jurisdictional rounding rules. This setting is ignored while Stripe Tax is enabled.',
										'storeengine'
									)
									: __(
										'This option will affect tax calculation in cart & checkout page.',
										'storeengine'
									)
							}
							isRequired={ true }
						/>
						<div className="storeengine-global-tax-radio">
							<label>
								<Field
									type="radio"
									name="tax_round_at_subtotal"
									onChange={ () =>
										setFieldValue(
											'tax_round_at_subtotal',
											false
										)
									}
									value={ false }
									className="storeengine-radio"
								/>
								<span className="storeengine-title-light">
									{ __(
										'Round tax individually (default)',
										'storeengine'
									) }
								</span>
							</label>
							<label>
								<Field
									type="radio"
									name="tax_round_at_subtotal"
									onChange={ () =>
										setFieldValue(
											'tax_round_at_subtotal',
											true
										)
									}
									value={ true }
									className="storeengine-radio"
								/>
								<span className="storeengine-title-light">
									{ __(
										'Round tax at total/subtotal level',
										'storeengine'
									) }
								</span>
							</label>
						</div>
					</div>
					<div className="storeengine-tax_display_cart storeengine-mb-4">
						<Label
							htmlFor="tax_display_cart"
							title={ __(
								'Display prices during cart and checkout',
								'storeengine'
							) }
							isRequired={ true }
						/>
						<Select
							id="tax_display_cart"
							name="tax_display_cart"
							className="storeengine-select"
							classNamePrefix="storeengine-react-select"
							placeholder={ __(
								'Display prices during cart and checkout',
								'storeengine'
							) }
							value={
								values.tax_display_cart
									? tax_display_options.find(
											( item ) =>
												item.value ===
												values.tax_display_cart
									  )
									: null
							}
							options={ tax_display_options }
							onChange={ ( option ) =>
								setFieldValue(
									'tax_display_cart',
									option.value
								)
							}
							isSearchable={ false }
						/>
					</div>
					{ /*<Text
				  title={__( 'Price display suffix', 'storeengine' )}
				  placeholder={__( 'N/A', 'storeengine' )}
				  name="price_display_suffix"
				  tooltip={__( 'Define text to show after your product prices. This could be, for example, "inc. Vat" to explain your pricing. You can also have prices substituted here using one of the following: {price_including_tax}, {price_excluding_tax}.', 'storeengine' )}
				/>*/ }
					<div className="storeengine-tax_total_display">
						<Label
							htmlFor="tax_total_display"
							title={ __( 'Display tax totals', 'storeengine' ) }
							isRequired={ true }
						/>
						<Select
							id="tax_total_display"
							name="tax_total_display"
							className="storeengine-select"
							classNamePrefix="storeengine-react-select"
							placeholder={ __(
								'Display tax totals',
								'storeengine'
							) }
							value={
								values.tax_total_display
									? tax_total_display_options.find(
											( item ) =>
												item.value ===
												values.tax_total_display
									  )
									: null
							}
							options={ tax_total_display_options }
							onChange={ ( option ) =>
								setFieldValue(
									'tax_total_display',
									option.value
								)
							}
							isSearchable={ false }
						/>
					</div>
				</div>
			</div>
		</Scope>
	);
};

export default GlobalTax;
