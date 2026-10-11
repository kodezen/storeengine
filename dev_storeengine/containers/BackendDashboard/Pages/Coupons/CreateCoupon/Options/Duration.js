import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Field, useFormikContext } from 'formik';
import Text from '@Components/Formik/Text';
import SwitchControl from '@Components/Formik/Checkbox/SwitchControl';
import { Scope, Heading } from '@Components/ui';

const timeType = [
	{
		label: __( 'Forever', 'storeengine' ),
		value: 'forever_time',
	},
	{
		label: __( 'Set Time Limit', 'storeengine' ),
		value: 'set_time_limit',
	},
];

const pad = ( n ) => String( n ).padStart( 2, '0' );

// Local (site-relative) date string in the YYYY-MM-DD format the date input expects.
const getLocalDate = ( daysToAdd = 0 ) => {
	const d = new Date();
	d.setDate( d.getDate() + daysToAdd );
	return `${ d.getFullYear() }-${ pad( d.getMonth() + 1 ) }-${ pad(
		d.getDate()
	) }`;
};

const Duration = () => {
	const { values, setFieldValue } = useFormikContext();
	const [ endDateTime, setEndDateTime ] = useState(
		values?.meta?._storeengine_coupon_end_date_time.date
	);

	// When "Set Time Limit" is picked, default the start to today at 12:00 AM
	// unless a start date is already set (e.g. when editing an existing coupon).
	const handleTimeTypeChange = ( value ) => {
		if (
			value === 'set_time_limit' &&
			! values?.meta?._storeengine_coupon_start_date_time?.date
		) {
			setFieldValue(
				'meta._storeengine_coupon_start_date_time.date',
				getLocalDate( 0 )
			);
			setFieldValue(
				'meta._storeengine_coupon_start_date_time.time',
				'00:00'
			);
		}
	};

	const handleEndDateToggle = () => {
		if ( endDateTime ) {
			setFieldValue( 'meta._storeengine_coupon_end_date_time.date', '' );
			setFieldValue( 'meta._storeengine_coupon_end_date_time.time', '' );
		} else if ( ! values?.meta?._storeengine_coupon_end_date_time?.date ) {
			// Enabling the end date: default it to 3 days out at 12:00 AM.
			setFieldValue(
				'meta._storeengine_coupon_end_date_time.date',
				getLocalDate( 3 )
			);
			setFieldValue(
				'meta._storeengine_coupon_end_date_time.time',
				'00:00'
			);
		}
		setEndDateTime( ! endDateTime );
	};

	return (
		<Scope
			as="div"
			id="duration"
			className="storeengine-content-section storeengine-content-section__duration"
		>
			<Heading as="p">
				{ __( 'Time Duration', 'storeengine' ) }
			</Heading>

			<div className="storeengine-coupon-create-radio-buttons">
				{ timeType.map( ( type, index ) => {
					return (
						<label
							htmlFor={ `_storeengine_coupon_time_type-${ index }` }
							key={ index }
							className="storeengine-mr-2 storeengine-pointer storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center"
						>
							<Field
								id={ `_storeengine_coupon_time_type-${ index }` }
								type="radio"
								className="storeengine-radio"
								name="meta._storeengine_coupon_time_type"
								value={ type.value }
								onClick={ () =>
									handleTimeTypeChange( type.value )
								}
							/>
							<span className="storeengine-title">
								{ type.label }
							</span>
						</label>
					);
				} ) }
			</div>

			{ values?.meta._storeengine_coupon_time_type ===
				'set_time_limit' && (
				<>
					<div className="storeengine-d-flex storeengine-flex-gap-16 storeengine-mt-4">
						<Text
							title={ __( 'Start Date', 'storeengine' ) }
							name="meta._storeengine_coupon_start_date_time.date"
							type="date"
						/>
						<Text
							title={ __( 'Start Time', 'storeengine' ) }
							name="meta._storeengine_coupon_start_date_time.time"
							type="time"
						/>
					</div>

					<div
						className={ `storeengine-checkbox storeengine-checkbox--create-coupon-checkbox` }
					>
						<div className={ `storeengine-checkbox-wrap` }>
							<div className="storeengine-title-container">
								<label
									htmlFor={ 'set_end_date' }
									className="storeengine-title-subtitle"
								>
									<span className="storeengine-title">
										{ __( 'Set End Date', 'storeengine' ) }
									</span>
								</label>
							</div>
							<div className="storeengine-radio-container">
								<Field
									id={ 'set_end_date' }
									type="checkbox"
									component={ SwitchControl }
									value={ endDateTime }
									onChange={ handleEndDateToggle }
								/>
							</div>
						</div>
					</div>

					{ endDateTime && (
						<div className="storeengine-d-flex storeengine-flex-gap-16 storeengine-mt-4">
							<Text
								title={ __( 'End Date', 'storeengine' ) }
								name="meta._storeengine_coupon_end_date_time.date"
								type="date"
								prefix="time-duration"
							/>
							<Text
								title={ __( 'End Time', 'storeengine' ) }
								name="meta._storeengine_coupon_end_date_time.time"
								type="time"
								prefix="time-duration"
							/>
						</div>
					) }
					{ /*<div className="storeengine-coupon-expire-note"></div>*/ }
				</>
			) }
		</Scope>
	);
};

export default Duration;
