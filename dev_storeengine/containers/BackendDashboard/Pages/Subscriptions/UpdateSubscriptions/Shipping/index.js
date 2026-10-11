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

const Shipping = () => {
	const { values, setFieldValue } = useFormikContext();
	const { shipping_address } = values;
	const [ openShippingDetails, setOpenShippingDetails ] = useState( false );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState( false );
	const [ statesData, setStatesData ] = useState( [] );

	const countryName =
		countryData.find( ( item ) => item.value === shipping_address?.country )
			?.label || '';

	useEffect( () => {
		if ( shipping_address?.country ) {
			setDataFetchingStatus( true );
			makeRequest( 'get_states', {
				cc: shipping_address?.country,
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
	}, [ shipping_address?.country ] );

	const handleShippingSubmit = () => {
		setOpenShippingDetails( false );
	};

	const handleEditAction = () => {
		setOpenShippingDetails( true );
	};

	let currentState = '';
	if ( statesData && shipping_address?.state ) {
		currentState = statesData?.find(
			( item ) => item.value === shipping_address?.state
		);
		currentState = currentState
			? currentState.label
			: shipping_address?.state;
	} else {
		currentState = shipping_address?.state;
	}

	return (
		<Card className="mb-6">
			{ values?.shipping_address?.email !== '' ? (
				<Heading>{ __( 'Shiping Address', 'storeengine' ) }</Heading>
			) : (
				<Heading>{ __( 'Billing Address', 'storeengine' ) }</Heading>
			) }

			<div className="storeengine-content-section__shipping">
				{ shipping_address?.email !== '' ? (
					<div>
						<h5>
							{ shipping_address?.first_name }{ ' ' }
							{ shipping_address?.last_name }
						</h5>
						<p>
							<a href={ `mailto:${ shipping_address?.email }` }>
								{ shipping_address?.email }
							</a>
						</p>
						<p>
							<a href={ `tel:${ shipping_address?.phone }` }>
								{ shipping_address?.phone }
							</a>
						</p>
						<p>{ shipping_address?.address_1 }</p>
						<p>
							{ shipping_address?.city }, { currentState }
						</p>
						<p>{ shipping_address?.postcode }</p>
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
							name={ 'shipping_address.first_name' }
							placeholder={ __( 'Zohn', 'storeengine' ) }
							isRequired={ true }
						/>
						<Text
							title={ __( 'Last Name', 'storeengine' ) }
							name={ 'shipping_address.last_name' }
							placeholder={ __( 'Zohn', 'storeengine' ) }
							isRequired={ true }
						/>
					</div>
					<div
						className={ `storeengine-form-group storeengine-width-full storeengine-mb-6` }
					>
						<div className="storeengine-title-subtitle storeengine-mb-2">
							<label
								htmlFor={ 'shipping_address.country' }
								className="storeengine-title"
							>
								{ __( 'Country', 'storeengine' ) }
							</label>
						</div>
						<div className="form-body">
							<Select
								id="shipping_address.country"
								name={ 'shipping_address.country' }
								className="storeengine-select"
								classNamePrefix="storeengine-react-select"
								placeholder={ __(
									'Select Country',
									'storeengine'
								) }
								value={
									shipping_address?.country
										? countryData?.find(
												( item ) =>
													item.value ===
													shipping_address?.country
										  )
										: null
								}
								options={ countryData }
								onChange={ ( option ) =>
									setFieldValue(
										'shipping_address.country',
										option.value
									)
								}
							/>
						</div>
					</div>
					<Text
						title={ __( 'Address', 'storeengine' ) }
						name={ 'shipping_address.address_1' }
						placeholder={ __( 'Steve hunt road', 'storeengine' ) }
						isRequired={ true }
					/>
					<div className="storeengine-d-flex storeengine-flex-gap-16">
						<Text
							title={ __( 'Email Address', 'storeengine' ) }
							name={ 'shipping_address.email' }
							placeholder={ __(
								'zohn@gmail.com',
								'storeengine'
							) }
							isRequired={ true }
						/>
						<Text
							title={ __( 'Phone', 'storeengine' ) }
							name={ 'shipping_address.phone' }
							placeholder={ __( '+880', 'storeengine' ) }
						/>
					</div>

					<div className="storeengine-d-flex storeengine-flex-gap-16">
						<Text
							title={ __( 'City', 'storeengine' ) }
							name={ 'shipping_address.city' }
							placeholder={ __( 'New York', 'storeengine' ) }
							isRequired={ true }
						/>
						{ ! statesData?.length ? (
							<Text
								title={ __( 'State/Province', 'storeengine' ) }
								name="shipping_address.state"
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
										htmlFor={ 'shipping_address.state' }
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
										id="shipping_address.state"
										name={ 'shipping_address.state' }
										className="storeengine-select"
										classNamePrefix="storeengine-react-select"
										placeholder={ __(
											'Select State',
											'storeengine'
										) }
										value={
											shipping_address?.state
												? statesData?.find(
														( item ) =>
															item.value ===
															shipping_address?.state
												  )
												: null
										}
										options={ statesData }
										isLoading={ dataFetchingStatus }
										onChange={ ( option ) =>
											setFieldValue(
												'shipping_address.state',
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
						name={ 'shipping_address.postcode' }
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

export default Shipping;
