import { __ } from '@wordpress/i18n';
import React, { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import { Scope, Button } from '@Components/ui';
import Text from '@Components/Formik/Text';
import Number from '@Components/Formik/Number';
import Preloader from '@Components/Loader/Preloader';
import Label from '@Components/Formik/Label';
import countries from '@Utils/countries';
import states from '@Utils/states';

import './styles.scss';

const taxableCountries = [
	{ label: __( 'Any Country', 'storeengine' ), value: '*' },
	...countries,
];

const CountryStateFormInner = ( { setOpenModal, loading } ) => {
	const { values, setFieldValue, handleSubmit } = useFormikContext();
	const [ statesData, setStatesData ] = useState( [] );

	useEffect( () => {
		setFieldValue( 'state', '*' );
		if ( values?.country ) {
			const foundStates = values.country
				? states[ values.country ] || []
				: [];
			setStatesData( [
				{
					label: __( 'Any State/Province', 'storeengine' ),
					value: '*',
				},
				...foundStates,
			] );
			if ( '*' === values?.country ) {
				setFieldValue( 'state', '*' );
			}
		} else {
			setStatesData( [] );
		}
	}, [ values?.country ] );

	return (
		<Scope>
			{ loading ? (
				<Preloader />
			) : (
				<div className="storeengine-taxes-region">
					<div className="storeengine-taxes-region__country">
						<Label
							htmlFor="country"
							title={ __( 'Country', 'storeengine' ) }
							isRequired={ true }
						/>

						<Select
							id="country"
							name="country"
							className="storeengine-select"
							classNamePrefix="storeengine-react-select"
							placeholder={ __(
								'Select country',
								'storeengine'
							) }
							value={
								values.country
									? taxableCountries.find(
											( item ) =>
												item.value === values.country
									  )
									: null
							}
							options={ taxableCountries }
							onChange={ ( option ) =>
								setFieldValue( 'country', option.value )
							}
						/>
					</div>

					<div className="storeengine-taxes-region__state">
						<Label
							htmlFor="state"
							title={ __( 'State/Province', 'storeengine' ) }
							isRequired={ true }
						/>

						{ ! statesData.length ? (
							<Text
								name="state"
								placeholder={ __(
									'Enter State/Province',
									'storeengine'
								) }
								suffix="tax-state"
								isRequired={ true }
							/>
						) : (
							<Select
								id="state"
								name="state"
								className="storeengine-select"
								classNamePrefix="storeengine-react-select"
								placeholder={ __(
									'Select State/Province',
									'storeengine'
								) }
								value={
									values.state
										? statesData?.find(
												( item ) =>
													item.value === values.state
										  )
										: null
								}
								options={ statesData }
								onChange={ ( option ) =>
									setFieldValue( 'state', option.value )
								}
								isDisabled={ ! values.country }
							/>
						) }
					</div>

					<Number
						title={ __( 'Tax Rate', 'storeengine' ) }
						tooltip={ __(
							'Enter rate in percentage',
							'storeengine'
						) }
						name="rate"
						placeholder={ __( 'Enter Tax Rate', 'storeengine' ) }
						suffix="tax-rate"
						isRequired={ true }
						percentage={ true }
						isDisabled={ ! values.country }
					/>

					<div className="storeengine-d-flex storeengine-flex-gap-16">
						<Text
							title={ __( 'Tax Name', 'storeengine' ) }
							tooltip={ __(
								'Enter a name for this tax rate',
								'storeengine'
							) }
							name="name"
							placeholder={ __( 'Tax or VAT', 'storeengine' ) }
							suffix="tax-name"
						/>

						<Number
							title={ __( 'Priority', 'storeengine' ) }
							tooltip={ __(
								'Choose a priority for this tax rate. Only 1 matching rate per priority will be used. To define multiple tax rates for a single area you need to specify a different priority per rate.',
								'storeengine'
							) }
							name="priority"
							suffix="tax-priority"
							defaultValue={ 1 }
						/>
					</div>

					<div className="storeengine-taxes-region__footer">
						<Button
							type="button"
							onClick={ () => setOpenModal( false ) }
							preset="outline"
						>
							{ __( 'Close', 'storeengine' ) }
						</Button>

						<Button
							type="button"
							onClick={ () => handleSubmit() }
							preset="primary"
						>
							{ __( 'Save', 'storeengine' ) }
						</Button>
					</div>
				</div>
			) }
		</Scope>
	);
};

export default CountryStateFormInner;
