import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import ReactModal from '@Components/Modal/ReactModal';
import Text from '@Components/Formik/Text';
import { Scope, Card, Heading, Button } from '@Components/ui';
import { Select } from '@Components/ui/Select';
import OptionMenu from '@Components/OptionMenu';
import { useFormikContext } from 'formik';
import {
	countryData,
	makeRequest,
	objectToArraySelectData,
} from '@Utils/helper';

import './styles.scss';

const Billing = () => {
	const { values, setFieldValue } = useFormikContext();
	const { billing_address } = values;
	const [ openShippingDetails, setOpenShippingDetails ] = useState( false );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState( false );
	const [ statesData, setStatesData ] = useState( [] );

	const countryName =
		countryData.find( ( item ) => item.value === billing_address?.country )
			?.label || '';

	useEffect( () => {
		if ( billing_address?.country ) {
			setDataFetchingStatus( true );
			makeRequest( 'get_states', {
				cc: billing_address?.country,
			} ).then( ( res ) => {
				if ( res?.data?.success ) {
					const stateData = res.data.data.states
						? objectToArraySelectData( res.data.data.states )
						: res.data.data.states;
					setStatesData( stateData );
					setDataFetchingStatus( false );
				}
			} );
		}
	}, [ billing_address?.country ] );

	const handleShippingSubmit = () => {
		setOpenShippingDetails( false );
	};

	const handleEditAction = () => {
		setOpenShippingDetails( true );
	};

	let currentState = '';
	if ( statesData && billing_address?.state ) {
		currentState = statesData?.find(
			( item ) => item.value === billing_address?.state
		);
		currentState = currentState
			? currentState.label
			: billing_address?.state;
	} else {
		currentState = billing_address?.state;
	}

	return (
		<Card className="mb-6">
			<Heading>{ __( 'Billing Address', 'storeengine' ) }</Heading>

			<div className="storeengine-content-section__shipping">
				{ billing_address?.email !== '' ? (
					<div>
						<h5>
							{ billing_address?.first_name }{ ' ' }
							{ billing_address?.last_name }
						</h5>
						<p>
							<a href={ `mailto:${ billing_address?.email }` }>
								{ billing_address?.email }
							</a>
						</p>
						<p>
							<a href={ `tel:${ billing_address?.phone }` }>
								{ billing_address?.phone }
							</a>
						</p>
						<p>{ billing_address?.address_1 }</p>
						<p>
							{ billing_address?.city }, { currentState }
						</p>
						<p>{ billing_address?.postcode }</p>
						<h5>{ countryName }</h5>
					</div>
				) : (
					<Button
						preset="ghost"
						icon="storeengine-icon--add"
						onClick={ () => setOpenShippingDetails( true ) }
					>
						{ __( 'Add Billing Address', 'storeengine' ) }
					</Button>
				) }

				<ReactModal
					title={ __( 'Edit Billing Address', 'storeengine' ) }
					isOpen={ openShippingDetails }
					isEnabledHeader={ true }
					onRequestClose={ () => setOpenShippingDetails( false ) }
					suffix="order-billing-address"
					size="small"
				>
					<Scope>
					<div className="storeengine-d-flex storeengine-flex-gap-16">
						<Text
							title={ __( 'First Name', 'storeengine' ) }
							name={ 'billing_address.first_name' }
							placeholder={ __( 'Zohn', 'storeengine' ) }
							isRequired={ true }
						/>
						<Text
							title={ __( 'Last Name', 'storeengine' ) }
							name={ 'billing_address.last_name' }
							placeholder={ __( 'Zohn', 'storeengine' ) }
							isRequired={ true }
						/>
					</div>
					<div
						className={ `storeengine-form-group storeengine-width-full storeengine-mb-6` }
					>
						<div className="storeengine-title-subtitle storeengine-mb-2">
							<label
								htmlFor={ 'billing_address.country' }
								className="storeengine-title"
							>
								{ __( 'Country', 'storeengine' ) }
							</label>
						</div>
						<div className="form-body">
							<Select
								id="billing_address.country"
								name={ 'billing_address.country' }
								className="storeengine-select"
								classNamePrefix="storeengine-react-select"
								placeholder={ __(
									'Select Country',
									'storeengine'
								) }
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
					<Text
						title={ __( 'Address', 'storeengine' ) }
						name={ 'billing_address.address_1' }
						placeholder={ __( 'Steve hunt road', 'storeengine' ) }
						isRequired={ true }
					/>
					<div className="storeengine-d-flex storeengine-flex-gap-16">
						<Text
							title={ __( 'Email Address', 'storeengine' ) }
							name={ 'billing_address.email' }
							placeholder={ __(
								'zohn@gmail.com',
								'storeengine'
							) }
							isRequired={ true }
						/>
						<Text
							title={ __( 'Phone', 'storeengine' ) }
							name={ 'billing_address.phone' }
							placeholder={ __( '+880', 'storeengine' ) }
						/>
					</div>

					<div className="storeengine-d-flex storeengine-flex-gap-16">
						<Text
							title={ __( 'City', 'storeengine' ) }
							name={ 'billing_address.city' }
							placeholder={ __( 'New York', 'storeengine' ) }
							isRequired={ true }
						/>
						{ ! statesData?.length ? (
							<Text
								title={ __( 'State/Province', 'storeengine' ) }
								name="billing_address.state"
								placeholder={ __(
									'Enter State/Province',
									'storeengine'
								) }
								isRequired={ true }
							/>
						) : (
							<div
								className={ `storeengine-form-group storeengine-width-full storeengine-mb-6` }
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
									</label>
								</div>
								<div className="form-body">
									<Select
										id="billing_address.state"
										name={ 'billing_address.state' }
										className="storeengine-select"
										classNamePrefix="storeengine-react-select"
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
										isLoading={ dataFetchingStatus }
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
						title={ __( 'Postcode/Zip', 'storeengine' ) }
						name={ 'billing_address.postcode' }
						placeholder={ __( '1234', 'storeengine' ) }
					/>
					<div className="storeengine-react-modal__footer">
						<Button
							type="button"
							onClick={ () => setOpenShippingDetails( false ) }
							preset="outline"
						>
							{ __( 'Cancel', 'storeengine' ) }
						</Button>
						<Button
							type="submit"
							preset="primary"
							onClick={ () => handleShippingSubmit() }
						>
							{ __( 'Submit', 'storeengine' ) }
						</Button>
					</div>
					</Scope>
				</ReactModal>
			</div>
		</Card>
	);
};

export default Billing;
