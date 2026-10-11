import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { FieldArray, useFormikContext } from 'formik';
import Tooltip from '@Components/Tooltip';
import Number from '@Components/Formik/Number';
import { Button } from '@Components/ui';
import { Select as Select2 } from '@Components/ui/Select';
import { createInterpolateElement } from '@wordpress/element';
import { installmentPeriods } from '../../helper.js';

const periodToDays = ( delay, period ) => {
	if ( typeof delay !== 'number' ) {
		return 0;
	}

	switch ( period ) {
		case 'day':
			return delay;
		case 'week':
			return delay * 7;
		case 'month':
			return delay * 30;
		case 'year':
			return delay * 365;
		default:
			return 0;
	}
};

const InstallmentPlanOptions = ( { priceProps, isSingle = false } ) => {
	const installments = Array.isArray( priceProps?.values?.installments )
		? priceProps.values.installments
		: [];
	const totalDelayInDays = installments.reduce(
		( total, item ) => total + periodToDays( item.delay, item.period ),
		0
	);
	const downPayment = parseFloat( priceProps?.values?.down_payment || 0 );
	const totalAmount = ( installments || [] ).reduce(
		( total, { percentage } ) => total + parseFloat( percentage || 0 ),
		downPayment
	);
	// Deposit and installments are percentages of the price and must add up to
	// exactly 100% (the deposit field is a %, not a currency amount). Surface
	// that inline so an out-of-range total is caught before hitting Save.
	const roundedTotal = Math.round( totalAmount * 100 ) / 100;
	const isValidTotal = roundedTotal === 100;
	const depositError =
		downPayment > 100
			? __( 'Deposit cannot exceed 100%.', 'storeengine' )
			: '';
	const { submitForm } = useFormikContext();

	return (
		<div className="storeengine-flex-column storeengine-flex-gap-8 storeengine-installment-payments">
			<div className="storeengine-title storeengine-pointer">
				{ __( 'Installment Plan', 'storeengine' ) }
				<Tooltip>
					{ __(
						'Total payment amount should be equal to 100%',
						'storeengine'
					) }
				</Tooltip>
			</div>
			<Number
				title={ __( 'Deposit (Down Payment)', 'storeengine' ) }
				name="down_payment"
				unit="%"
				min={ 0 }
				max={ 100 }
				onBlur={ () => isSingle && submitForm() }
			/>
			{ depositError && (
				<label
					className="error storeengine-mt-min-4 storeengine-mb-6"
					style={ { color: 'var(--storeengine-error-color)' } }
				>
					{ depositError }
				</label>
			) }
			{ /* Once the deposit alone is at/over 100% there is no room left for
			     installments, so hide the rules until the deposit is valid. */ }
			{ ! depositError && (
			<div className="storeengine-flex-column storeengine-flex-gap-8">
				<div className="storeengine-title storeengine-pointer">
					{ __( 'Installment Payment Rules', 'storeengine' ) }
				</div>
				<div className="storeengine-flex-column storeengine-mb-6 storeengine-installment-payments__payment-rule">
					<div className="storeengine-installment-payments__payment-rule--heading">
						<p className="storeengine-title storeengine-m-0">
							{ __( 'Payment Amount', 'storeengine' ) }
						</p>
						<p className="storeengine-title storeengine-m-0">
							{ __( 'Interval', 'storeengine' ) }
						</p>
					</div>
					<FieldArray name="installments">
						{ ( { remove, push } ) => {
							const hasInstallments =
								Array.isArray(
									priceProps.values.installments
								) && priceProps.values.installments.length > 0;

							return (
								<>
									{ hasInstallments ? (
										priceProps.values.installments.map(
											( payment, index ) => {
												const isLastItem =
													index ===
													priceProps.values
														.installments.length -
														1;

												return (
													<div
														className="storeengine-installment-payments__payment-wrapper storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8 storeengine-mb-4"
														key={ index }
													>
														<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8">
															<Number
																name={ `installments.${ index }.percentage` }
																unit="%"
																min={ 0 }
																suffix="installments"
																onBlur={ () =>
																	isSingle &&
																	submitForm()
																}
															/>
															<Number
																name={ `installments.${ index }.delay` }
																min={ 0 }
																suffix="installments"
																onBlur={ () =>
																	isSingle &&
																	submitForm()
																}
															/>
														</div>

														<Select2
															placeholder={ __(
																'Period Type',
																'storeengine'
															) }
															onBlur={ () =>
																isSingle &&
																submitForm()
															}
															name={ `installments.${ index }.period` }
															options={
																installmentPeriods
															}
															className="storeengine-select storeengine-installment-payments-select"
															value={
																installmentPeriods.find(
																	( p ) =>
																		p.value ===
																		payment.period
																) ||
																installmentPeriods[ 2 ]
															}
															onChange={ ( o ) =>
																priceProps.setFieldValue(
																	`installments.${ index }.period`,
																	o.value
																)
															}
															classNamePrefix="storeengine-react-select"
														/>

														<div className="storeengine-installment-payments__actions">
															<Button
																aria-label={ __(
																	'Remove rule',
																	'storeengine'
																) }
																preset="outline"
																icon="storeengine-icon--trash"
																onClick={ () =>
																	remove(
																		index
																	)
																}
															/>
															<Button
																className={
																	! isLastItem
																		? 'is-hidden'
																		: ''
																}
																preset="outline"
																icon="storeengine-icon--add"
																onClick={ () =>
																	push( {
																		percentage: 0,
																		delay: 1,
																		period: 'week',
																	} )
																}
															/>
														</div>
													</div>
												);
											}
										)
									) : (
										<Button
											aria-label={ __(
												'Add Installment Rule',
												'storeengine'
											) }
											preset="outline"
											icon="storeengine-icon--add"
											onClick={ () =>
												push( {
													percentage: 0,
													delay: 1,
													period: 'week',
												} )
											}
										/>
									) }
								</>
							);
						} }
					</FieldArray>
					{ priceProps?.values?.installments?.length > 0 && (
						<div className="storeengine-installment-payments__payment-rule--summary storeengine-width-full">
							<p className="storeengine-title storeengine-m-0">
								{ createInterpolateElement(
									sprintf(
										// translators: %s. Total amount (percentage).
										__(
											'Total: <span>%s%%</span>',
											'storeengine'
										),
										roundedTotal
									),
									{
										span: (
											<span
												className="storeengine-title-light"
												style={
													! isValidTotal
														? {
																color: 'var(--storeengine-error-color)',
														  }
														: undefined
												}
											/>
										),
									}
								) }
							</p>
							<p className="storeengine-title storeengine-m-0">
								{ createInterpolateElement(
									sprintf(
										// translators: %s. Total duration for installment.
										__(
											'Total Duration: <span>%s Days</span>',
											'storeengine'
										),
										totalDelayInDays
									),
									{
										span: (
											<span className="storeengine-title-light" />
										),
									}
								) }
							</p>
						</div>
					) }
					{ priceProps?.values?.installments?.length > 0 &&
						! isValidTotal && (
							<label
								className="error"
								style={ {
									color: 'var(--storeengine-error-color)',
								} }
							>
								{ roundedTotal > 100
									? sprintf(
											// translators: %1$s: current total %, %2$s: amount over 100.
											__(
												'Deposit and installments total %1$s%% — %2$s%% over. They must add up to exactly 100%%.',
												'storeengine'
											),
											roundedTotal,
											Math.round(
												( roundedTotal - 100 ) * 100
											) / 100
									  )
									: sprintf(
											// translators: %1$s: current total %, %2$s: remaining % to reach 100.
											__(
												'Deposit and installments total %1$s%% — add %2$s%% more to reach 100%%.',
												'storeengine'
											),
											roundedTotal,
											Math.round(
												( 100 - roundedTotal ) * 100
											) / 100
									  ) }
							</label>
						) }
				</div>
			</div>
			) }
		</div>
	);
};

export default InstallmentPlanOptions;
