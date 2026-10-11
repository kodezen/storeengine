import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import Text from '@Components/Formik/Text';
import Number from '@Components/Formik/Number';
import { Select } from '@Components/ui/Select';
import { Card, Heading, Title, SubTitle } from '@Components/ui';

const RATE_SOURCE_OPTIONS = [
	{
		value: 'frankfurter',
		label: __( 'Frankfurter', 'storeengine' ),
		description: __(
			'Free, no API key required. Covers ~30 ECB currencies. Ideal for EUR-based stores.',
			'storeengine'
		),
		link: null,
	},
	{
		value: 'openexchangerates',
		label: __( 'Open Exchange Rates', 'storeengine' ),
		description: __(
			'Free plan supports 170+ currencies. Get your App ID at openexchangerates.org/signup/free',
			'storeengine'
		),
		link: 'https://openexchangerates.org/signup/free',
	},
	{
		value: 'exchangerate-api',
		label: __( 'ExchangeRate-API', 'storeengine' ),
		description: __(
			'Free plan supports 161 currencies, 1,500 requests/month. Get your key at app.exchangerate-api.com/sign-up',
			'storeengine'
		),
		link: 'https://app.exchangerate-api.com/sign-up',
	},
	{
		value: 'currencybeacon',
		label: __( 'CurrencyBeacon', 'storeengine' ),
		description: __(
			'Free plan supports 150+ currencies, 5,000 requests/month. Get your key at currencybeacon.com/signup',
			'storeengine'
		),
		link: 'https://currencybeacon.com/signup',
	},
];

const ExchangeRateSettings = () => {
	const { values, setFieldValue } = useFormikContext();
	const rateSource = values?.multi_currency?.rate_source ?? 'frankfurter';
	const rateSourceOption =
		RATE_SOURCE_OPTIONS.find( ( o ) => o.value === rateSource ) ??
		RATE_SOURCE_OPTIONS[ 0 ];

	return (
		<Card>
			<Heading>{ __( 'Exchange Rate Settings', 'storeengine' ) }</Heading>

			<div className='flex items-start justify-between gap-4 mb-4'>
				<div className='storeengine-title-subtitle'>
					<h3 className='storeengine-title'>
						{ __( 'Rate Source', 'storeengine' ) }
					</h3>
					<p className='storeengine-sub-title'>
						{ __(
						'Select a live exchange rate provider and set the auto-refresh interval.',
						'storeengine'
					) }
					</p>
				</div>

				<Select
					name="multi_currency.rate_source"
					options={ RATE_SOURCE_OPTIONS }
					value={ rateSourceOption }
					isSearchable={ false }
					onChange={ ( option ) =>
						setFieldValue( 'multi_currency.rate_source', option.value )
					}
					className='storeengine-select storeengine-select--multi-currency-rate-source'
					classNamePrefix="storeengine-react-select"
				/>
			</div>
			
			{ rateSourceOption?.description && (
				<SubTitle>
					{ rateSourceOption.description }{ ' ' }
					{ rateSourceOption.link && (
						<a
							href={ rateSourceOption.link }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'Get API key →', 'storeengine' ) }
						</a>
					) }
				</SubTitle>
			) }

			{ rateSource === 'openexchangerates' && (
				<Text
					title={ __( 'Open Exchange Rates App ID', 'storeengine' ) }
					placeholder={ __( 'Enter your App ID', 'storeengine' ) }
					name="multi_currency.openexchangerates_app_id"
					readOnly={ false }
					prefix="enter-your-app-id"
				/>
			) }

			{ rateSource === 'exchangerate-api' && (
				<Text
					title={ __( 'ExchangeRate-API Key', 'storeengine' ) }
					placeholder={ __( 'Enter your API key', 'storeengine' ) }
					name="multi_currency.exchangerate_api_key"
					readOnly={ false }
					prefix="exchange-rate-api-key"
				/>
			) }

			{ rateSource === 'currencybeacon' && (
				<Text
					title={ __( 'CurrencyBeacon API Key', 'storeengine' ) }
					placeholder={ __( 'Enter your API key', 'storeengine' ) }
					name="multi_currency.currencybeacon_api_key"
					readOnly={ false }
					prefix="currency-beacon-api-key"
				/>
			) }

			<Number
				title={ __( 'Rate Refresh Interval (hours)', 'storeengine' ) }
				placeholder="6"
				name="multi_currency.refresh_interval_hours"
				readOnly={ false }
				suffix="rate-refresh-interval"
				subtitle={ __(
					'How often rates are auto-refreshed. Minimum: 1 hour.',
					'storeengine'
				) }
				prefix="plain"
			/>
		</Card>
	);
};

export default ExchangeRateSettings;
