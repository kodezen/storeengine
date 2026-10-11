import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import InputBox from '@Components/InputBox';
import countries from '@Utils/countries';
import { Scope, Switch } from '@Components/ui';
import SettingsSkeleton from '@Components/Loader/SettingsSkeleton';

// Self-saving addon tab (mirrors Returns/Couriers). Initial values come from
// the main settings payload (`state.settings.data.eu_vat`), which the addon's
// PHP Settings class injects via the `storeengine/api/settings` filter — the
// same hook Multi-Currency uses. Saving goes through updateEuVatSettings
// dispatched by Settings/index.js onSubmitHandler (eu-vat path case).

const REQUIRED_OPTIONS = [
	{ value: 'optional', label: __( 'Optional', 'storeengine' ) },
	{ value: 'required', label: __( 'Required (always)', 'storeengine' ) },
	{
		value: 'required_if_company',
		label: __( 'Required only if company name is filled', 'storeengine' ),
	},
];

const MESSAGE_ROWS = [
	{ key: 'validating', label: __( 'While validating', 'storeengine' ) },
	{ key: 'valid', label: __( 'When valid', 'storeengine' ) },
	{ key: 'invalid', label: __( 'When invalid', 'storeengine' ) },
	{
		key: 'validation_failed',
		label: __( 'When validation failed', 'storeengine' ),
	},
];

const EuVat = () => {
	const { values, setFieldValue } = useFormikContext();
	const euVat = values?.eu_vat;

	if ( ! euVat ) {
		return <SettingsSkeleton />;
	}

	const selectedCountries = countries.filter( ( c ) =>
		( euVat.preserve_countries ?? [] ).includes( c.value )
	);

	return (
		<Scope as="div" className="flex flex-col gap-6">
			<div className="bg-white border border-se-border rounded max-w-3xl p-6">
				<h3 className="storeengine-heading">
					{ __( 'Field display', 'storeengine' ) }
				</h3>

				<p className="storeengine-title">
					{ __(
						'Control how the VAT number field appears on checkout.',
						'storeengine'
					) }
				</p>

				<div className='flex flex-col gap-6 mt-6'>
					<InputBox label={ __( 'Field label', 'storeengine' ) }>
						<input
							type="text"
							value={ euVat.field_label ?? '' }
							onChange={ ( e ) =>
								setFieldValue( 'eu_vat.field_label', e.target.value )
							}
							className="storeengine-input"
						/>
					</InputBox>

					<InputBox label={ __( 'Placeholder', 'storeengine' ) }>
						<input
							type="text"
							value={ euVat.field_placeholder ?? '' }
							onChange={ ( e ) =>
								setFieldValue(
									'eu_vat.field_placeholder',
									e.target.value
								)
							}
							className="storeengine-input"
						/>
					</InputBox>

					<InputBox label={ __( 'Description', 'storeengine' ) }>
						<textarea
							rows={ 2 }
							value={ euVat.field_description ?? '' }
							onChange={ ( e ) =>
								setFieldValue(
									'eu_vat.field_description',
									e.target.value
								)
							}
							placeholder={ __(
								'Shown below the VAT field on checkout. Basic HTML allowed.',
								'storeengine'
							) }
							className="storeengine-textarea"
						/>
					</InputBox>

					<InputBox label={ __( 'Field requirement', 'storeengine' ) }>
						<Select
							options={ REQUIRED_OPTIONS }
							value={
								REQUIRED_OPTIONS.find(
									( o ) => o.value === ( euVat.field_required ?? 'optional' )
								) ?? null
							}
							onChange={ ( opt ) =>
								setFieldValue(
									'eu_vat.field_required',
									opt?.value ?? 'optional'
								)
							}
							classNamePrefix="storeengine-react-select"
							className="storeengine-select"
						/>
					</InputBox>
				</div>
			</div>

			<div className="bg-white border border-se-border rounded max-w-3xl p-6">
				<h3 className="storeengine-heading">
					{ __( 'Exemption rules', 'storeengine' ) }
				</h3>
				<p className="storeengine-title">
					{ __(
						'Valid B2B numbers in cross-border sales are exempted from VAT automatically. Use the options below to keep charging VAT in specific places.',
						'storeengine'
					) }
				</p>

				<div className='flex flex-col gap-6 mt-6'>
					<label className="flex items-center gap-2 mt-3 text-sm text-se-text">
						<Switch
							checked={
								( euVat.preserve_in_base_country ?? 'yes' ) === 'yes'
							}
							onChange={ ( next ) =>
								setFieldValue(
									'eu_vat.preserve_in_base_country',
									next ? 'yes' : 'no'
								)
							}
						/>
						{ __(
							'Charge VAT for buyers in the same country as your store, even with a valid VAT number.',
							'storeengine'
						) }
					</label>

					<InputBox
						label={ __(
							'Always preserve VAT in these countries',
							'storeengine'
						) }
					>
						<Select
							isMulti
							options={ countries }
							value={ selectedCountries }
							onChange={ ( opts ) =>
								setFieldValue(
									'eu_vat.preserve_countries',
									( opts || [] ).map( ( o ) => o.value )
								)
							}
							placeholder={ __(
								'Select countries…',
								'storeengine'
							) }
							classNamePrefix="storeengine-react-select"
							className="storeengine-select"
						/>
						<p className="mt-1 text-xs text-se-subtitle">
							{ __(
								'VAT will still be charged for buyers in these countries even with a valid VAT number.',
								'storeengine'
							) }
						</p>
					</InputBox>
				</div>
			</div>

			<div className="bg-white border border-se-border rounded max-w-3xl p-6">
				<h3 className="storeengine-heading">
					{ __( 'Progress messages', 'storeengine' ) }
				</h3>
				<p className="storeengine-title">
					{ __(
						'Shown to the buyer while their VAT number is being checked.',
						'storeengine'
					) }
				</p>

					{ MESSAGE_ROWS.map( ( row ) => (
						<div className='flex flex-col gap-6 mt-6'>
							<InputBox key={ row.key } label={ row.label }>
								<input
									type="text"
									value={ euVat.messages?.[ row.key ] ?? '' }
									onChange={ ( e ) =>
										setFieldValue(
											`eu_vat.messages.${ row.key }`,
											e.target.value
										)
									}
									className="storeengine-input"
								/>
							</InputBox>
						</div>
					) ) }
			</div>

			<div className="bg-white border border-se-border rounded max-w-3xl p-6">
				<h3 className="storeengine-heading">
					{ __( 'Advanced', 'storeengine' ) }
				</h3>
				<label className="flex items-center gap-2 mt-3 text-sm text-se-text">
					<Switch
						checked={ ( euVat.debug_logging ?? 'no' ) === 'yes' }
						onChange={ ( next ) =>
							setFieldValue(
								'eu_vat.debug_logging',
								next ? 'yes' : 'no'
							)
						}
					/>
					{ __(
						'Log VIES failures to the PHP error log.',
						'storeengine'
					) }
				</label>
			</div>
		</Scope>
	);
};

export default EuVat;
