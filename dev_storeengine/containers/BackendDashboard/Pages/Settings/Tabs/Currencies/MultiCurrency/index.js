import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import { fetchMultiCurrencyRates } from '@Redux/Slices/settingsSlice/settingsSlice';
import { getAddonActiveStatus } from '@Utils/helper';
import { Scope, Stack } from '@Components/ui';
import CurrencyTable from './CurrencyTable';
import ExchangeRateSettings from './ExchangeRateSettings';
import FrontendSwitcher from './FrontendSwitcher';
import LocaleFormatting from './LocaleFormatting';
import GeoDetection from './GeoDetection';

const MultiCurrency = () => {
	const dispatch = useDispatch();
	const allAddons = useSelector( ( state ) => state.addons );
	const multiCurrencyRates = useSelector(
		( state ) => state.settings?.multiCurrencyRates ?? {}
	);
	const isMultiCurrencyActive = getAddonActiveStatus(
		allAddons,
		'multi-currency'
	);

	useEffect( () => {
		if ( ! multiCurrencyRates?.currency_rates && isMultiCurrencyActive ) {
			dispatch( fetchMultiCurrencyRates() );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Scope>
			<Stack gap={ 6 }>
				<CurrencyTable />
				<ExchangeRateSettings />
				<FrontendSwitcher />
				<LocaleFormatting />
				<GeoDetection />
			</Stack>
		</Scope>
	);
};

export default MultiCurrency;
