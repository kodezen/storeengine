import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@Components/ui';
import AddPriceForm from './AddPriceForm';
import { Field, useFormikContext } from 'formik';
import Currency from '@Components/Currency';
import Text from '@Components/Formik/Text';
import SwitchControl from '@Components/Formik/SwitchControl';

const PurchaseInfo = ( { embedded = false } ) => {
	const { values, setFieldValue, submitForm } = useFormikContext();
	const [ selectedPrice, setSelectedPrice ] = useState( null );
	const [ showForm, setShowForm ] = useState( false );
	const [ newProduct, isNewProduct ] = useState( true );
	const handleRemovePrice = ( priceID ) => {
		const filteredPrices = values.prices.filter(
			( item ) => parseInt( item.id ) !== parseInt( priceID )
		);
		setFieldValue( 'prices', filteredPrices );
		setTimeout( () => {
			submitForm();
		}, 1000 );
	};

	// When embedded (inside PricingSection's "Advanced pricing" disclosure) we
	// drop the outer content-section + heading so it doesn't double the padding
	// or repeat a title the parent already provides.
	const Wrapper = embedded ? React.Fragment : 'div';
	const wrapperProps = embedded
		? {}
		: { className: 'storeengine-content-section' };

	return (
		<Wrapper { ...wrapperProps }>
			{ ! embedded && (
				<h2 className="storeengine-heading">
					{ __( 'Purchase Info', 'storeengine' ) }
				</h2>
			) }
			<div
				className={ `storeengine-membership-prices ${
					values?.prices?.length === 0 &&
					'storeengine-membership-prices--border-less'
				} storeengine-flex storeengine-flex-column` }
			>
				{ values?.prices?.length > 0 &&
					values?.prices.map( ( price, priceIndex ) => {
						return (
							<>
								{ showForm &&
								parseInt( price?.id ) ===
									parseInt( selectedPrice?.id ) ? (
									<AddPriceForm
										selectedPrice={ selectedPrice }
										setSelectedPrice={ setSelectedPrice }
										setShowForm={ setShowForm }
									/>
								) : (
									<div
										className="storeengine-membership-price storeengine-flex storeengine-flex-justify-between storeengine-flex-align-center"
										key={ priceIndex }
									>
										<div className="storeengine-membership-price__info">
											{ price?.price_type } -{ ' ' }
											<Currency value={ price?.price } />
										</div>
										<div className="storeengine-membership-price__actions storeengine-flex storeengine-flex-gap-4 storeengine-flex-align-center">
											<Button
												size="sm"
												icon="storeengine-icon--edit-pen"
												preset="ghost"
												onClick={ () => {
													if ( selectedPrice ) {
														setSelectedPrice(
															null
														);
													} else {
														setSelectedPrice(
															price
														);
													}
													setShowForm( ! showForm );
												} }
											/>
											<Button
												size="sm"
												icon="storeengine-icon--trash"
												preset="ghost"
												onClick={ () =>
													handleRemovePrice(
														price.id
													)
												}
											/>
										</div>
									</div>
								) }
							</>
						);
					} ) }
				{ ! showForm && (
					<Button
						size="sm"
						icon="storeengine-icon--add"
						preset="ghost"
						onClick={ () => setShowForm( true ) }
					>
						{ __( 'Add Price', 'storeengine' ) }
					</Button>
				) }
				{ showForm && ! selectedPrice && (
					<AddPriceForm
						selectedPrice={ selectedPrice }
						setSelectedPrice={ setSelectedPrice }
						setShowForm={ setShowForm }
						newProduct={ newProduct }
						isNewProduct={ isNewProduct }
						prices={ values?.prices }
					/>
				) }
			</div>
		</Wrapper>
	);
};

export default PurchaseInfo;
