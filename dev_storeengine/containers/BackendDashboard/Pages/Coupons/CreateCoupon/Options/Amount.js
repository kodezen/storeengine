import React from 'react';
import { Field, useFormikContext } from 'formik';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import Number from '@Components/Formik/Number';
import { useSelector } from 'react-redux';
import { Scope, Heading } from '@Components/ui';
import { requiresHint } from './ProLock';

const coreCouponTypes = [
	{
		label: __( 'Free Shipping (Coming soon)', 'storeengine' ),
		value: 'freeShipping',
		disabled: true,
	},
	{
		label: __( 'Percentage', 'storeengine' ),
		value: 'percentage',
	},
	{
		label: __( 'Fixed Amount', 'storeengine' ),
		value: 'fixedAmount',
	},
];

const Amount = () => {
	const { values } = useFormikContext();
	const settings = useSelector( ( state ) => state.settings.data );
	const hint = requiresHint();

	/**
	 * Discount types offered in the coupon editor.
	 *
	 * Add-ons append their own types here. A type may set `locked: true` to
	 * render as an upgrade prompt instead of a selectable option.
	 */
	const couponTypes = applyFilters(
		'storeengine.coupon_editor.types',
		coreCouponTypes
	);

	const selectedType = values?.meta?._storeengine_coupon_type;

	return (
		<Scope
			as="div"
			id="amount"
			className="storeengine-content-section storeengine-content-section__amount"
		>
			<Heading as="p">
				{ __( 'To Use Coupon For', 'storeengine' ) }
			</Heading>

			<div className="storeengine-tab-content__amount--body">
				{ couponTypes.map( ( type, index ) => {
					const locked = !! type.locked;
					const typeHint = type.hint || hint;
					return (
						<div
							key={ type.value ?? index }
							className={ `storeengine-coupon-radio-buttons${
								locked
									? ' storeengine-coupon-radio-buttons--locked'
									: ''
							}` }
						>
							<label
								htmlFor={ `meta._storeengine_coupon_type-${ index }` }
								className="storeengine-pointer storeengine-flex  storeengine-flex-gap-8  storeengine-flex-align-center  storeengine-flex-justify-between"
							>
								<span className="storeengine-title">
									{ type.label }
								</span>

								<Field
									id={ `meta._storeengine_coupon_type-${ index }` }
									type="radio"
									name="meta._storeengine_coupon_type"
									value={ type.value }
									className="storeengine-coupon-create-radio-buttons--input storeengine-radio"
									disabled={ !! type.disabled || locked }
								/>
							</label>

							{ locked && (
								<a
									className="storeengine-pro-lock__hint"
									href={ typeHint.url }
									target={
										typeHint.external ? '_blank' : '_self'
									}
									rel="noreferrer"
								>
									<span
										className="storeengine-pro-lock__lockicon"
										aria-hidden="true"
									>
										🔒
									</span>
									{ typeHint.text }
								</a>
							) }

							{ ! locked && selectedType === type.value && (
								<div className="storeengine-coupon-amount-type storeengine-mt-4">
									{ type.value === 'percentage' && (
										<Number
											title={ __(
												'Discount Percentage',
												'storeengine'
											) }
											name="meta._storeengine_coupon_amount"
											readOnly={ false }
											percentage={ true }
										/>
									) }

									{ type.value === 'fixedAmount' && (
										<Number
											title={ __(
												'Discount Amount',
												'storeengine'
											) }
											name="meta._storeengine_coupon_amount"
											readOnly={ false }
											currency={
												settings.store_currency ||
												'USD'
											}
										/>
									) }

									{ /*
									 * Fields belonging to an add-on supplied
									 * discount type. Receives the selected type
									 * so each add-on renders only its own.
									 */ }
									{ applyFilters(
										'storeengine.coupon_editor.type_fields',
										null,
										{ type: type.value, values, settings }
									) }
								</div>
							) }
						</div>
					);
				} ) }
			</div>
		</Scope>
	);
};

export default Amount;
