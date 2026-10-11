import { __ } from '@wordpress/i18n';
import React, { useEffect, useState } from 'react';
import Checkbox from '@Components/Formik/Checkbox';
import { Scope, Heading } from '@Components/ui';
import Number from '@Components/Formik/Number';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import Text from '@Components/Formik/Text';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import {
	countryData,
	makeRequest,
	objectToArraySelectData,
} from '@Utils/helper';

import './styles.scss';

const Taxes = () => {
	const { values, setFieldValue } = useFormikContext();
	const { billing_address } = values;
	const [ statesData, setStatesData ] = useState( [] );

	useEffect( () => {
		makeRequest( 'get_states', {
			cc: billing_address?.country,
		} ).then( ( res ) => {
			if ( res?.data?.success ) {
				const stateData = res.data.data.states
					? objectToArraySelectData( res.data.data.states )
					: res.data.data.states;
				setStatesData( stateData );
			}
		} );
	}, [ billing_address?.country ] );

	return (
		<Scope>
			<div id="settingsTaxes" className="storeengine-content-section">
				<Heading>
					{ __( 'Store Tax', 'storeengine' ) }
				</Heading>

				<Checkbox
					title={ __( 'Tax Collection', 'storeengine' ) }
					subtitle={ __(
						'If enabled, you need to configure which tax regions you have tax nexus. If disabled, no tax will be collected.',
						'storeengine'
					) }
					name="tax_collection_enable"
					suffix="tax-collection"
				/>

				<Checkbox
					title={ __( 'Tax Include', 'storeengine' ) }
					subtitle={ __(
						'If enabled, you need to configure which tax regions you have tax nexus. If disabled, no tax will be collected.',
						'storeengine'
					) }
					name="tax_collection_enable"
					suffix="tax-include"
				/>

				<StoreEngineSeparator isBottom={ true } />

				<Checkbox
					title={ __( 'Fallback Tax Rate', 'storeengine' ) }
					subtitle={ __(
						'If enabled, you can enter a tax rate to apply when a specific tax region is not found.',
						'storeengine'
					) }
					name="tax_collection_enable"
					suffix="tax-fallback"
				/>

				<Text
					title={ __( 'Fallback Tax', 'storeengine' ) }
					name="meta._storeengine_coupon_discount_amount"
					placeholder={ __( 'Exa: T-shirt Tax', 'storeengine' ) }
				/>

				<div className="storeengine-content-section--tax-address">
					<span className="storeengine-title">
						{ __( 'Address', 'storeengine' ) }
					</span>
					<Text
						name="billing_address.address_1"
						placeholder={ 'Name or Company Name' }
					/>

					<div className="storeengine-city-info">
						<div
							className={ `storeengine-form-group storeengine-width-25 storeengine-mb-6` }
						>
							<div className="storeengine-title-subtitle storeengine-mb-2">
								<label
									htmlFor={ 'billing_address.country' }
									className="storeengine-title"
								>
									{ __( 'Country', 'storeengine' ) }
									<span className="storeengine-required">
										*
									</span>
								</label>
							</div>
							<div className="form-body">
								<Select
									id="billing_address.country"
									name={ 'billing_address.country' }
									className="storeengine-select"
									classNamePrefix="storeengine-react-select"
									placeholder={ __(
										'Select country',
										'storeengine'
									) }
									menuPlacement="top"
									value={
										billing_address?.country
											? countryData?.find(
													( item ) =>
														item.value ===
														billing_address?.country
											  )
											: null
									}
									options={ countryData }
									onChange={ ( option ) =>
										setFieldValue(
											'billing_address.country',
											option.value
										)
									}
								/>
							</div>
						</div>
					</div>

					<Text
						title={ __( 'Address', 'storeengine' ) }
						name="billing_address.address_1"
						placeholder={ 'Steve hunt road' }
						isRequired={ true }
					/>

					<div className="storeengine-flex">
						<Text
							title={ __( 'City', 'storeengine' ) }
							name={ 'billing_address.city' }
							placeholder={ 'New York' }
							isRequired={ true }
						/>
						{ ! statesData?.length ? (
							<Text
								title={ __( 'State/Province', 'storeengine' ) }
								name="billing_address.state"
								placeholder="Enter State"
								suffix="shipping-address-zip"
								isRequired={ true }
							/>
						) : (
							<div
								className={ `storeengine-form-group storeengine-width-25 storeengine-mb-6` }
							>
								<div className="storeengine-title-subtitle storeengine-mb-2">
									<label
										htmlFor={ 'billing_address.state' }
										className="storeengine-title"
									>
										{ __(
											'State/Province',
											'storeengine'
										) }
										<span className="storeengine-required">
											*
										</span>
									</label>
								</div>
								<div className="form-body">
									<Select
										id="billing_address.state"
										name={ 'billing_address.state' }
										className="storeengine-select"
										classNamePrefix="storeengine-react-select"
										menuPlacement="top"
										placeholder={ __(
											'Select State',
											'storeengine'
										) }
										value={
											billing_address?.state
												? statesData?.find(
														( item ) =>
															item.value ===
															billing_address?.state
												  )
												: null
										}
										options={ statesData }
										onChange={ ( option ) =>
											setFieldValue(
												'billing_address.state',
												option.value
											)
										}
									/>
								</div>
							</div>
						) }
					</div>
					<Text
						title={ __( 'Postcode', 'storeengine' ) }
						name="billing_address.postcode"
						placeholder="1234"
						suffix="shipping-address-zip"
					/>
				</div>
			</div>

			<div
				id="settingsTaxes"
				className="storeengine-content-section storeengine-pb-0"
			>
				<Heading>
					{ __( 'EU Vat', 'storeengine' ) }
				</Heading>

				<Checkbox
					title={ __( 'Require Vat Number', 'storeengine' ) }
					subtitle={ __(
						'If enabled, require all customers in the ELJ to enter a ELI VAT number when checking out.',
						'storeengine'
					) }
					name="tax_collection_enable"
					suffix="tax-collection"
				/>

				<Checkbox
					title={ __( 'Local Reverse Charge', 'storeengine' ) }
					subtitle={ __(
						'If enabled, apply reverse charge when applicable even when customers are in your home country.',
						'storeengine'
					) }
					name="tax_collection_enable"
					suffix="tax-include"
				/>

				<StoreEngineSeparator isBottom={ true } />

				<Text
					title={ __(
						'Vat Number Verification Failure',
						'storeengine'
					) }
					name="meta._storeengine_coupon_discount_amount"
					placeholder={ __(
						'Reject the order and show error',
						'storeengine'
					) }
				/>
			</div>

			<div
				id="settingsTaxes"
				className="storeengine-content-section storeengine-pb-0"
			>
				<Heading>
					{ __( 'Tax Region', 'storeengine' ) }
				</Heading>
			</div>
		</Scope>
	);
};

export default Taxes;
