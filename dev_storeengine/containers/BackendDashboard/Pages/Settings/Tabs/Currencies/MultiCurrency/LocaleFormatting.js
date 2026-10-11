import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import { Card, Heading, Title, SubTitle } from '@Components/ui';
import { LOCALE_OPTIONS } from '../helper';

const LocaleFormatting = () => {
	const { values, setFieldValue } = useFormikContext();
	const localeOption =
		LOCALE_OPTIONS.find(
			( o ) =>
				o.value === ( values?.multi_currency?.formatting_locale ?? '' )
		) ?? LOCALE_OPTIONS[ 0 ];

	return (
		<Card>
			<Heading>{__('Currency Formatting', 'storeengine')}</Heading>

			<div className='flex items-start justify-between gap-4 mb-4'>
				<div className='flex flex-col gap-1 w-1/3'>
					<h3 className='storeengine-title'>
						{__('Display Locale', 'storeengine')}
					</h3>
					<p className='storeengine-sub-title'>
						{__(
							'Set the locale used to format currency symbols, decimals, and thousands separators.',
							'storeengine'
						)}
					</p>
				</div>

				<Select
					name="multi_currency.formatting_locale"
					options={LOCALE_OPTIONS}
					value={localeOption}
					isSearchable={true}
					onChange={(option) =>
						setFieldValue(
							'multi_currency.formatting_locale',
							option?.value ?? ''
						)
					}
					wrapperClass='w-[300px]'
				/>
			</div>

			<SubTitle>
				{__(
					'Controls number formatting only — not translation. E.g. select "English (US)" to format USD without the country prefix even on a non-English site.',
					'storeengine'
				)}
			</SubTitle>
		</Card>
	);
};

export default LocaleFormatting;
