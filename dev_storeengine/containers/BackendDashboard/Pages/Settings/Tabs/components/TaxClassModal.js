import React from 'react';
import ReactModal from '@Components/Modal/ReactModal';
import { __ } from '@wordpress/i18n';
import Text from '@Components/Formik/Text';
import Select from '@Components/Formik/Select';
import Number from '@Components/Formik/Number';

const TaxClassModal = ( { isOpen, setOpenModal } ) => {
	const countryOptions = [
		{ value: 'USA', label: __( 'United States', 'storeengine' ) },
		{ value: 'CAN', label: __( 'Canada', 'storeengine' ) },
		{ value: 'GBR', label: __( 'United Kingdom', 'storeengine' ) },
		{ value: 'AUS', label: __( 'Australia', 'storeengine' ) },
	];

	const stateOptions = [
		{ value: 'NY', label: __( 'New York', 'storeengine' ) },
		{ value: 'CA', label: __( 'California', 'storeengine' ) },
		{ value: 'TX', label: __( 'Texas', 'storeengine' ) },
		{ value: 'FL', label: __( 'Florida', 'storeengine' ) },
	];

	return (
		<ReactModal
			title={ __( 'Edit tax rates', 'storeengine' ) }
			isOpen={ isOpen }
			isEnabledHeader={ true }
			isEnabledFooter={ true }
			onRequestClose={ () => setOpenModal( false ) }
			suffix="class-modal"
			cancelButtonLabel={ __( 'Cancel', 'storeengine' ) }
			submitButtonLabel={ __( 'Save', 'storeengine' ) }
		>
			<Text
				title={ __( 'Class name', 'storeengine' ) }
				name={ 'additional_tax_class_name' }
			/>
			<div className="double-fields">
				<Select
					title={ __( 'Country', 'storeengine' ) }
					options={ countryOptions }
					name={ 'selectCountry' }
				/>
				<Select
					title={ __( 'State/Province', 'storeengine' ) }
					options={ stateOptions }
					name={ 'selectCountry' }
				/>
			</div>
			<div className="double-fields">
				<Text
					title={ __( 'City', 'storeengine' ) }
					name={ 'shipping_city' }
					placeholder={ 'New York' }
					prefix="tax_class_city"
				/>
				<Number
					title={ __( 'Postcode/Zip', 'storeengine' ) }
					name={ 'country_postcode' }
				/>
			</div>
			<Number
				title={ __( 'Rate', 'storeengine' ) }
				name={ 'country_postcode' }
				percentage={ true }
			/>
		</ReactModal>
	);
};

export default TaxClassModal;
