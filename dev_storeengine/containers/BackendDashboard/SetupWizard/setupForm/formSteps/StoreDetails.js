import React, { useEffect, useState } from 'react';
import FormHeading from '../Component/FormHeading';
import { sprintf, __, _x } from '@wordpress/i18n';
import Text from '@Components/Formik/Text';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import Color from '@Components/Formik/Color';
import Label from '@Components/Formik/Label';
import { decodeEntities } from '@wordpress/html-entities';
import { hasOwnProperty, currencies } from '@Utils/helper';
import countries from '@Utils/countries';
import states from '@Utils/states';
import localeInfo from '@Utils/locale-info';

import './styles.scss';

export default function StoreDetails() {
	const { values, setFieldValue } = useFormikContext();
	const [ storeCountry, setStoreCountry ] = useState(
		values.settings.store_country
	);

	useEffect( () => {
		const cc_info = localeInfo[ values.settings.store_country ] || {};
		setFieldValue(
			'settings.store_currency',
			cc_info.currency_code || 'USD'
		);
		setFieldValue(
			'settings.store_currency_position',
			cc_info.currency_pos || 'right'
		);
		setFieldValue(
			'settings.store_currency_thousand_separator',
			cc_info.thousand_sep || ','
		);
		setFieldValue(
			'settings.store_currency_decimal_separator',
			cc_info.decimal_sep || '.'
		);
		setFieldValue(
			'settings.store_currency_decimal_limit',
			cc_info.num_decimals || '2'
		);
	}, [ storeCountry ] );

	const currencyArray = currencies.map( ( currency ) => ( {
		value: currency.code,
		label: decodeEntities(
			`${ currency.name } (${ currency.symbol }) — ${ currency.code }`
		),
	} ) );
	const countryOptions = [];
	for ( const country of countries ) {
		const hasStates =
			hasOwnProperty.call( states, country.value ) &&
			states[ country.value ].length;
		if ( ! hasStates ) {
			countryOptions.push( country );
		} else {
			const _country = { ...country, options: [] };
			for ( const state of states[ country.value ] ) {
				_country.options.push( {
					label: sprintf(
						// translators: %1$s. Country Name, %2$s. State name.
						_x(
							'%1$s — %2$s',
							'Country name with state name',
							'storeengine'
						),
						country.label,
						state.label
					),
					value: country.value + '|' + state.value,
				} );
			}
			countryOptions.push( _country );
		}
	}

	document.getElementById(
		'storeengine-admin-style-inline-css'
	).innerText = `
		:root {
			--storeengine-primary-color: ${ values?.settings?.global_primary_color };
			--storeengine-secondary-color: ${ values?.settings?.global_secondary_color };
			--storeengine-text-color: ${ values?.settings?.global_text_color };
			--storeengine-placeholder-color: ${ values?.settings?.global_placeholder_color };
			--storeengine-border-color: ${ values?.settings?.global_border_color };
			--storeengine-background-color: ${ values?.settings?.global_background_color };
		}
	`;

	return (
		<div className="storeengine-setup-store-details">
			<FormHeading
				title={ __( 'Tell us about your store', 'storeengine' ) }
				subHeading={ __(
					"We'll pre-fill currency and formatting from your country — just confirm the basics.",
					'storeengine'
				) }
			/>
			<div className="storeengine-mt-6">
				<Text
					title={ __( 'Store Name', 'storeengine' ) }
					placeholder={ __( 'Your Store Brand', 'storeengine' ) }
					name="settings.store_name"
					prefix="setup"
					isRequired={ true }
				/>
			</div>
			<Color
				title={ __( 'Primary Color', 'storeengine' ) }
				name="settings.global_primary_color"
				resetValue="#008DFF"
				isRequired={ true }
			/>
			<div className="storeengine-mb-6 storeengine-mt-6">
				<label
					htmlFor={ 'store_country' }
					className="storeengine-title"
				>
					{ __( 'Country / State', 'storeengine' ) }
					<abbr
						className="storeengine-required"
						title={ __( 'Required', 'storeengine' ) }
					>
						*
					</abbr>
				</label>
				<Select
					id="store_country"
					name="settings.store_country"
					className="storeengine-select storeengine-mt-2"
					classNamePrefix="storeengine-react-select"
					placeholder={ __( 'Select country', 'storeengine' ) }
					value={ ( ( cc, sc ) => {
						if ( cc ) {
							const found = countryOptions.find(
								( c ) => cc === c.value
							);
							if (
								found &&
								hasOwnProperty.call( found, 'options' )
							) {
								if ( sc ) {
									const cs_val = cc + '|' + sc;
									return found.options.find( ( s ) => {
										return cs_val === s.value;
									} );
								}

								return found.options[ 0 ];
							}

							return found;
						}

						return null;
					} )(
						values?.settings?.store_country,
						values?.settings?.store_state
					) }
					options={ countryOptions }
					onChange={ ( o ) => {
						const [ cc = '', sc = '' ] = o.value.split( '|' );
						setFieldValue( 'settings.store_country', cc );
						setFieldValue( 'settings.store_state', sc );
						setStoreCountry( cc );
					} }
				/>
			</div>
			<Label
				htmlFor="store_currency"
				title={ __( 'Currency', 'storeengine' ) }
				isRequired={ true }
			/>
			<Select
				id="store_currency"
				name="settings.store_currency"
				className="storeengine-select storeengine-mb-6"
				classNamePrefix="storeengine-react-select"
				placeholder={ __( 'Select currency', 'storeengine' ) }
				isSearchable={ true }
				value={
					values?.settings?.store_currency
						? currencyArray?.find(
								( c ) =>
									c.value === values.settings.store_currency
						  )
						: {}
				}
				options={ currencyArray }
				onChange={ ( o ) =>
					setFieldValue( 'settings.store_currency', o.value )
				}
			/>
		</div>
	);
}
