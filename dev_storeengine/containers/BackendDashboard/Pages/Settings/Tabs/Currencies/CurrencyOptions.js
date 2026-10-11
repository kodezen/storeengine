import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { decodeEntities } from '@wordpress/html-entities';
import { Select } from '@Components/ui/Select';
import Text from '@Components/Formik/Text';
import Number from '@Components/Formik/Number';
import { Scope, Heading, Title } from '@Components/ui';
import { currencies } from '@Utils/helper';

const currencyPositions = [
	{ value: 'left', label: __( 'Left', 'storeengine' ) },
	{ value: 'right', label: __( 'Right', 'storeengine' ) },
	{ value: 'left_space', label: __( 'Left With Space', 'storeengine' ) },
	{ value: 'right_space', label: __( 'Right With Space', 'storeengine' ) },
];

const CurrencyOptions = () => {
	const { values, setFieldValue } = useFormikContext();
	const currencyArray = currencies.map( ( currency ) => ( {
		value: currency.code,
		label: decodeEntities(
			`${ currency.name } (${ currency.symbol }) — ${ currency.code }`
		),
	} ) );

	return (
		<Scope>
			<div className="storeengine-content-section">
				<Heading>{ __( 'Currency Options', 'storeengine' ) }</Heading>

				<div className="flex flex-col gap-4">
				<div className="flex flex-wrap gap-4">
					<div className="flex flex-col gap-2 flex-1">
						<Title>{ __( 'Currency', 'storeengine' ) }</Title>
						<Select
							id="store_currency"
							name={ 'store_currency' }
							className="storeengine-select storeengine-select--settings-currency-options"
							classNamePrefix="storeengine-react-select"
							placeholder={ __( 'Select currency', 'storeengine' ) }
							isSearchable={ true }
							value={
								values.store_currency
									? currencyArray?.find(
											( item ) =>
												item.value === values.store_currency
									)
									: {}
							}
							options={ currencyArray }
							onChange={ ( option ) =>
								setFieldValue( 'store_currency', option?.value )
							}
							menuPlacement={ 'auto' }
						/>
					</div>
					<div className="flex flex-col gap-2 flex-1">
						<Title>
							{ __( 'Currency Position', 'storeengine' ) }
						</Title>
						<Select
							title={ __( 'Currency Position', 'storeengine' ) }
							placeholder={ __(
								'Select currency position',
								'storeengine'
							) }
							name="store_currency_position"
							options={ currencyPositions }
							value={ currencyPositions.find(
								( option ) =>
									option.value === values.store_currency_position
							) }
							onChange={ ( option ) =>
								setFieldValue(
									'store_currency_position',
									option.value
								)
							}
							isSearchable={ false }
							className="storeengine-select storeengine-select--currency storeengine-mb-6"
							classNamePrefix="storeengine-react-select"
							menuPlacement={ 'auto' }
						/>
					</div>
				</div>
				
				<div className="flex flex-wrap gap-4">
					<div className="flex-1">
						<Text
							title={ __( 'Thousand Separator', 'storeengine' ) }
							placeholder=","
							name="store_currency_thousand_separator"
							readOnly={ false }
							prefix="plain"
						/>
					</div>
					<div className="flex-1">
						<Text
							title={ __( 'Decimal Separator', 'storeengine' ) }
							placeholder="."
							name="store_currency_decimal_separator"
							readOnly={ false }
							prefix="plain"
						/>
					</div>
					<div className="flex-1">
						<Number
							title={ __( 'Number Of Decimal', 'storeengine' ) }
							placeholder="2"
							name="store_currency_decimal_limit"
							readOnly={ false }
							suffix="plain"
						/>
					</div>
				</div>
				</div>
			</div>
		</Scope>
	);
};

export default CurrencyOptions;
