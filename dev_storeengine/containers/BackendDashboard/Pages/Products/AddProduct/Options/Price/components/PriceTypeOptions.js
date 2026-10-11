import React from 'react';
import { hasOwnProperty } from '@Utils/helper';

const PriceTypeOptions = React.memo(
	( { priceProps, price_type, paymentTypes, isSingle = false } ) => {
		if ( ! hasOwnProperty.call( paymentTypes, price_type ) ) {
			return null;
		}

		const Component = paymentTypes[ price_type ].component;

		return <Component priceProps={ priceProps } isSingle={ isSingle } />;
	}
);

export default PriceTypeOptions;
