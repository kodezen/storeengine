import React, { useEffect, useState } from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import Text from '@Components/Formik/Text';
import Label from '@Components/Formik/Label';
import Number from '@Components/Formik/Number';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import { currencies } from '@Utils/helper';
import countries from '@Utils/countries';
import states from '@Utils/states';
import LoginPages from './LoginPages';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import { Scope, Heading } from '@Components/ui';

import './styles.scss';

const General = () => {
	const { values, setFieldValue } = useFormikContext();
	const { store_country } = values;
	const [ statesData, setStatesData ] = useState( [] );

	useEffect( () => {
		setStatesData( states[ store_country ] || [] );
	}, [ store_country ] );

	const currencyArray = currencies.map( ( currency ) => ( {
		value: currency.code,
		label: decodeEntities(
			`${ currency.name } (${ currency.symbol }) — ${ currency.code }`
		),
	} ) );

	return (
		<Scope id="settingsGeneral" className="storeengine-tab-content--general">
			<div className="storeengine-content-section">
				<div className="storeengine-tab-content--section">
					<Heading>
						{ __( 'General', 'storeengine' ) }
					</Heading>

					<div className="storeengine-d-flex storeengine-flex-gap-16 storeengine-mb-6">
						<Text
							title={ __( 'Store Name', 'storeengine' ) }
							placeholder="T-shirt store"
							name="store_name"
							readOnly={ false }
							prefix="store-name"
						/>
						<Text
							title={ __( 'Store email', 'storeengine' ) }
							placeholder="john@gmail.com"
							name="store_email"
							readOnly={ false }
							prefix="store-email"
						/>
					</div>

					<LoginPages />
				</div>
			</div>

			{ /* <div className="storeengine-content-section storeengine-pb-0 storeengine-tab-content--currency-options">
				<h2 className="storeengine-heading">
					{ __( 'Currency Options', 'storeengine' ) }
				</h2>
				<div className="storeengine-currency">
					<div className="storeengine-column-items">
						<h2 className="storeengine-title">
							{ __( 'Currency', 'storeengine' ) }
						</h2>
						<Select
							id="store_currency"
							name={ 'store_currency' }
							className="storeengine-select storeengine-mb-6"
							classNamePrefix="storeengine-react-select"
							placeholder={ __(
								'Select currency',
								'storeengine'
							) }
							isSearchable={ true }
							value={
								values.store_currency
									? currencyArray?.find(
											( item ) =>
												item.value ===
												values.store_currency
									  )
									: null
							}
							options={ currencyArray }
							onChange={ ( option ) =>
								setFieldValue( 'store_currency', option?.value )
							}
							menuPlacement={ 'auto' }
						/>
					</div>
					<div className="storeengine-column-items">
						<h2 className="storeengine-title">
							{ __( 'Currency Position', 'storeengine' ) }
						</h2>
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
									option.value ===
									values.store_currency_position
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
				<div className="storeengine-currency-details">
					<Text
						title={ __( 'Thousand Separator', 'storeengine' ) }
						placeholder=","
						name="store_currency_thousand_separator"
						readOnly={ false }
					/>
					<Text
						title={ __( 'Decimal Separator', 'storeengine' ) }
						placeholder="."
						name="store_currency_decimal_separator"
						readOnly={ false }
					/>
					<Number
						title={ __( 'Number Of Decimal', 'storeengine' ) }
						placeholder="2"
						name="store_currency_decimal_limit"
						readOnly={ false }
					/>
				</div>
			</div> */ }

			<div className="storeengine-content-section storeengine-tab-content--store-address">
				<Heading>
					{ __( 'Store Address', 'storeengine' ) }
				</Heading>
				<div className="storeengine-tab-content--store-address-wrap">
					<div
						className={ `storeengine-form-group storeengine-mb-6` }
					>
						<Label
							title={ __( 'Country', 'storeengine' ) }
							isRequired={ true }
						/>
						<Select
							id="store_country"
							name="store_country"
							className="storeengine-select storeengine-mt-2"
							classNamePrefix="storeengine-react-select"
							placeholder={ __(
								'Select country',
								'storeengine'
							) }
							value={
								store_country
									? countries?.filter(
											( item ) =>
												item.value === store_country
									  )
									: null
							}
							options={ countries }
							onChange={ ( option ) =>
								setFieldValue( 'store_country', option.value )
							}
							menuPlacement={ 'auto' }
						/>
					</div>
					<div className="storeengine-d-flex storeengine-flex-gap-16">
						<Text
							title={ __( 'City', 'storeengine' ) }
							name={ 'store_city' }
							placeholder={ __( 'Enter City', 'storeengine' ) }
							isRequired={ true }
						/>
						{ ! statesData.length ? (
							<Text
								title={ __( 'State/Province', 'storeengine' ) }
								name="store_country.state"
								placeholder={ __(
									'Enter State/Province',
									'storeengine'
								) }
								isRequired={ true }
							/>
						) : (
							<div
								className={ `storeengine-width-full storeengine-mb-6` }
							>
								<Label
									title={ __(
										'State/Province',
										'storeengine'
									) }
									isRequired={ true }
								/>
								<Select
									id="store_state"
									name={ 'store_state' }
									className="storeengine-select"
									classNamePrefix="storeengine-react-select"
									placeholder={ __(
										'Select State',
										'storeengine'
									) }
									value={
										values.store_state
											? statesData.find(
													( item ) =>
														item.value ===
														values.store_state
											  )
											: null
									}
									options={ statesData }
									onChange={ ( option ) =>
										setFieldValue(
											'store_state',
											option.value
										)
									}
									menuPlacement={ 'auto' }
								/>
							</div>
						) }
					</div>
					<div className="storeengine-flex-column storeengine-flex-gap-16">
						<Text
							title={ __(
								'Address (Area and Street)',
								'storeengine'
							) }
							prefix="store-name"
							placeholder="8020 Sheridan Blvd"
							name="store_address_1"
							readOnly={ false }
						/>
						<Text
							title={ __( 'Address 2 (If any)', 'storeengine' ) }
							prefix="store-name"
							placeholder="8020 Sheridan Blvd"
							name="store_address_2"
							readOnly={ false }
						/>
						<Text
							title={ __( 'Postcode', 'storeengine' ) }
							name="store_postcode"
							placeholder="1234"
							suffix="shipping-address-zip"
						/>
					</div>
				</div>
			</div>

			<SellingLocations />
		</Scope>
	);
};

// Woo-parity sales restriction. Two paired dropdowns + conditional
// country multi-selects. The data model lives in five settings keys
// (allowed_countries, all_except_countries, specific_allowed_countries,
// ship_to_countries, specific_ship_to_countries) consumed by
// `Countries::get_allowed_countries()` and `get_shipping_countries()`
// which already drive the checkout dropdown filter + geolocation
// fallback. This UI just exposes the controls so admins don't have to
// edit the DB by hand.
const SELL_TO_OPTIONS = [
	{ value: 'all', label: __( 'Sell to all countries', 'storeengine' ) },
	{
		value: 'all_except',
		label: __( 'Sell to all countries, except for…', 'storeengine' ),
	},
	{
		value: 'specific',
		label: __( 'Sell to specific countries', 'storeengine' ),
	},
];

const SHIP_TO_OPTIONS = [
	{
		value: '',
		label: __( 'Ship to all countries you sell to', 'storeengine' ),
	},
	{ value: 'all', label: __( 'Ship to all countries', 'storeengine' ) },
	{
		value: 'specific',
		label: __( 'Ship to specific countries only', 'storeengine' ),
	},
	{
		value: 'disabled',
		label: __( 'Disable shipping & shipping calculations', 'storeengine' ),
	},
];

const SellingLocations = () => {
	const { values, setFieldValue } = useFormikContext();

	const sellMode = values?.allowed_countries || 'all';
	const shipMode = values?.ship_to_countries ?? '';

	const sellExcept = values?.all_except_countries || [];
	const sellSpecific = values?.specific_allowed_countries || [];
	const shipSpecific = values?.specific_ship_to_countries || [];

	const toOptions = ( codes ) =>
		( Array.isArray( codes ) ? codes : [] )
			.map( ( c ) => countries.find( ( o ) => o.value === c ) )
			.filter( Boolean );

	const fromOptions = ( opts ) =>
		( Array.isArray( opts ) ? opts : [] ).map( ( o ) => o.value );

	return (
		<Scope className="storeengine-content-section storeengine-tab-content--selling-locations">
			<Heading>
				{ __( 'Selling Locations', 'storeengine' ) }
			</Heading>

			<div className="storeengine-form-group storeengine-mb-6">
				<Label
					title={ __( 'Selling location(s)', 'storeengine' ) }
					htmlFor="allowed_countries"
				/>
				<Select
					inputId="allowed_countries"
					className="storeengine-select storeengine-mt-2"
					classNamePrefix="storeengine-react-select"
					options={ SELL_TO_OPTIONS }
					value={ SELL_TO_OPTIONS.find( ( o ) => o.value === sellMode ) }
					onChange={ ( option ) =>
						setFieldValue( 'allowed_countries', option?.value || 'all' )
					}
					isSearchable={ false }
					menuPlacement="auto"
				/>
			</div>

			{ 'all_except' === sellMode && (
				<div className="storeengine-form-group storeengine-mb-6">
					<Label
						title={ __( 'Countries to exclude', 'storeengine' ) }
					/>
					<Select
						isMulti
						className="storeengine-select storeengine-mt-2"
						classNamePrefix="storeengine-react-select"
						options={ countries }
						value={ toOptions( sellExcept ) }
						onChange={ ( picks ) =>
							setFieldValue(
								'all_except_countries',
								fromOptions( picks )
							)
						}
						placeholder={ __( 'Choose countries…', 'storeengine' ) }
						menuPlacement="auto"
					/>
				</div>
			) }

			{ 'specific' === sellMode && (
				<div className="storeengine-form-group storeengine-mb-6">
					<Label
						title={ __( 'Countries to sell to', 'storeengine' ) }
					/>
					<Select
						isMulti
						className="storeengine-select storeengine-mt-2"
						classNamePrefix="storeengine-react-select"
						options={ countries }
						value={ toOptions( sellSpecific ) }
						onChange={ ( picks ) =>
							setFieldValue(
								'specific_allowed_countries',
								fromOptions( picks )
							)
						}
						placeholder={ __( 'Choose countries…', 'storeengine' ) }
						menuPlacement="auto"
					/>
				</div>
			) }

			<div className="storeengine-form-group">
				<Label
					title={ __( 'Shipping location(s)', 'storeengine' ) }
					htmlFor="ship_to_countries"
				/>
				<Select
					inputId="ship_to_countries"
					className="storeengine-select storeengine-mt-2"
					classNamePrefix="storeengine-react-select"
					options={ SHIP_TO_OPTIONS }
					value={ SHIP_TO_OPTIONS.find( ( o ) => o.value === shipMode ) }
					onChange={ ( option ) =>
						setFieldValue( 'ship_to_countries', option?.value ?? '' )
					}
					isSearchable={ false }
					menuPlacement="auto"
				/>
			</div>

			{ 'specific' === shipMode && (
				<div className="storeengine-form-group storeengine-mt-6">
					<Label
						title={ __( 'Countries to ship to', 'storeengine' ) }
					/>
					<Select
						isMulti
						className="storeengine-select storeengine-mt-2"
						classNamePrefix="storeengine-react-select"
						options={ countries }
						value={ toOptions( shipSpecific ) }
						onChange={ ( picks ) =>
							setFieldValue(
								'specific_ship_to_countries',
								fromOptions( picks )
							)
						}
						placeholder={ __( 'Choose countries…', 'storeengine' ) }
						menuPlacement="auto"
					/>
				</div>
			) }
		</Scope>
	);
};

export default General;
