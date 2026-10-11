import { __ } from '@wordpress/i18n';
import { Field, useFormikContext } from 'formik';
import Select from '@Components/Formik/Select';
import { Card, Heading } from '@Components/ui';
import './styles.scss';
import moment from 'moment';

const billingInterval = [
	{
		label: __( 'Every', 'storeengine' ),
		value: '1',
	},
	{
		label: __( 'Every 2nd', 'storeengine' ),
		value: '2',
	},
	{
		label: __( 'Every 3rd', 'storeengine' ),
		value: '3',
	},
	{
		label: __( 'Every 4th', 'storeengine' ),
		value: '4',
	},
	{
		label: __( 'Every 5th', 'storeengine' ),
		value: '5',
	},
	{
		label: __( 'Every 6th', 'storeengine' ),
		value: '6',
	},
];

const billingPeriods = [
	{
		label: __( 'Day', 'storeengine' ),
		value: 'day',
		isDisabled: true,
	},
	{
		label: __( 'Week', 'storeengine' ),
		value: 'week',
		isDisabled: true,
	},
	{
		label: __( 'Month', 'storeengine' ),
		value: 'month',
		isDisabled: true,
	},
	{
		label: __( 'Year', 'storeengine' ),
		value: 'year',
		isDisabled: true,
	},
];

const Schedule = () => {
	const { values } = useFormikContext();

	const dateChange = ( event ) => {
		setFieldValue( event.target.name, event.target.value );
	};

	return (
		<Card className="mb-6">
			<Heading>{ __( 'Schedule', 'storeengine' ) }</Heading>
			<div className="storeengine-order-schedule">
				<div className="storeengine-order-schedule__fields storeengine-flex-column storeengine-flex-align-start">
					<span>
						{ __( 'Payment', 'storeengine' ) }{ ' ' }
						<span>{ __( '(set in every *)', 'storeengine' ) }</span>
					</span>
					<div className="storeengine-flex storeengine-flex-justify-center storeengine-flex-gap-8 storeengine-payment-fields storeengine-width-full">
						<Field
							type="number"
							className="storeengine-input"
							name="payment_duration"
							disabled={ true }
						/>
						<Select
							options={ billingPeriods }
							name={ 'payment_duration_type' }
							isDisabled={ true }
						/>
					</div>
				</div>
				<div className="storeengine-order-schedule__fields">
					<span>{ __( 'Start Date', 'storeengine' ) }</span>
					{ ! values.start_date ? (
						<span>{ __( 'N/A', 'storeengine' ) }</span>
					) : (
						<input
							type="datetime-local"
							value={ moment
								.utc( values.start_date )
								.local()
								.format( 'YYYY-MM-DD HH:mm' ) }
							name="start_date"
							onChange={ dateChange }
							readOnly={ true }
						/>
					) }
				</div>
				<div className="storeengine-order-schedule__fields">
					<span>{ __( 'Trial End Date', 'storeengine' ) }</span>
					{ ! values.trial_end_date ? (
						<span>{ __( 'N/A', 'storeengine' ) }</span>
					) : (
						<input
							type="datetime-local"
							value={ moment
								.utc( values.trial_end_date )
								.local()
								.format( 'YYYY-MM-DD HH:mm' ) }
							name="trial_end_date"
							onChange={ dateChange }
							readOnly={ true }
							disabled={ true }
						/>
					) }
				</div>
				<div className="storeengine-order-schedule__fields">
					<span>{ __( 'Next Payment', 'storeengine' ) }</span>
					{ ! values.next_payment_date ? (
						<span>{ __( 'N/A', 'storeengine' ) }</span>
					) : (
						<input
							type="datetime-local"
							value={ moment
								.utc( values.next_payment_date )
								.local()
								.format( 'YYYY-MM-DD HH:mm' ) }
							name="next_payment_date"
							onChange={ dateChange }
							readOnly={ true }
						/>
					) }
				</div>
				{ /*<div className="storeengine-order-schedule__fields">*/ }
				{ /*	<span>{ __( 'End Date', 'storeengine' ) }</span>*/ }
				{ /*	{ ! values.end_date ? (*/ }
				{ /*    <span>{__( 'N/A', 'storeengine' )}</span>*/ }
				{ /*  ) : (*/ }
				{ /*    <input*/ }
				{ /*      type="datetime-local"*/ }
				{ /*			value={ moment.utc( values.end_date ).local().format( 'YYYY-MM-DD HH:mm' ) }*/ }
				{ /*			name="end_date"*/ }
				{ /*			onChange={ dateChange }*/ }
				{ /*      readOnly={ true }*/ }
				{ /*		/>*/ }
				{ /*	) }*/ }
				{ /*</div>*/ }
			</div>
		</Card>
	);
};

export default Schedule;
