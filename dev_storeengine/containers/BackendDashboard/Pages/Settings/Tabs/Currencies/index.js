import React from 'react';
import { useSelector } from 'react-redux';
import { getAddonActiveStatus } from '@Utils/helper';
import CurrencyOptions from './CurrencyOptions';
import MultiCurrency from './MultiCurrency';

import './styles.scss';

const Currencies = () => {
	const allAddons = useSelector( ( state ) => state.addons );
	const isMultiCurrencyActive = getAddonActiveStatus(
		allAddons,
		'multi-currency'
	);

	return (
		<>
			<CurrencyOptions />
			{ isMultiCurrencyActive && <MultiCurrency /> }
		</>
	);
};

export default Currencies;
