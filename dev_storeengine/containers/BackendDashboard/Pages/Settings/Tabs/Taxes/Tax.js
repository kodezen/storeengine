import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Scope, Heading, Button, Switch } from '@Components/ui';
import ReactModal from '@Components/Modal/ReactModal';
import ProductTaxModal from '../components/ProductTaxModal';
import OptionMenu from '@Components/OptionMenu';
import StoreEngineSelect from '@Components/StoreEngineSelect';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import { useFormikContext } from 'formik';
import './styles.scss';

const Taxes = () => {
	const { values, setFieldValue } = useFormikContext();
	const [ enableTax, setEnableTax ] = useState( false );
	const [ openProductModal, setOpenProductModal ] = useState( false );
	const productTaxCollections = [];

	const listOptions = [
		{
			type: 'button',
			label: __( 'Edit', 'storeengine' ),
		},
		{
			type: 'button',
			label: __( 'Duplicate', 'storeengine' ),
		},
		{
			type: 'button',
			label: __( 'Delete', 'storeengine' ),
		},
	];

	const tax_based = [
		{
			value: 'customer_shipping_address',
			label: __( 'Customer Shipping Address', 'storeengine' ),
		},
		{
			value: 'customer_billing_address',
			label: __( 'Customer Billing Address', 'storeengine' ),
		},
		{
			value: 'shop_base_address',
			label: __( 'Shop Base Address', 'storeengine' ),
		},
	];

	const additional_tax = [
		{
			value: 'based_on_cart_items',
			label: __( 'Shipping tax class on cart items', 'storeengine' ),
		},
		{
			value: 'standard',
			label: __( 'Standard', 'storeengine' ),
		},
		{
			value: 'reduce_rate',
			label: __( 'Reduce Rate', 'storeengine' ),
		},
		{
			value: 'zero_rate',
			label: __( 'Zero Rate', 'storeengine' ),
		},
	];

	const display_price = [
		{
			value: 'excluding',
			label: __( 'Excluding tax', 'storeengine' ),
		},
		{
			value: 'including',
			label: __( 'Including tax', 'storeengine' ),
		},
	];

	const handleToggleTax = () => {
		setEnableTax( ( prevState ) => ! prevState );
	};

	const SingleTaxSection = ( { singleItem } ) => {
		return (
			<div className="storeengine-tax-single-item">
				<div className="item-content">
					<div className="left-content">
						<p className="left-content--title">
							{ singleItem.name }
						</p>
						<p className="left-content--type">
							{ singleItem.type }
						</p>
					</div>
					<div className="right-content">
						<OptionMenu options={ listOptions } />
						(expand)
					</div>
				</div>
			</div>
		);
	};

	return (
		<Scope
			id="settingsBrandAndStyle"
			className="storeengine-tab-content storeengine-tab-content-texes"
		>
			<Heading>
				{ __( 'Taxes', 'storeengine' ) }
			</Heading>

			<div
				role="presentation"
				className="storeengine-enable-tax-part"
				onClick={ handleToggleTax }
			>
				<span className="storeengine-title">
					{ __( 'Enable Tax', 'storeengine' ) }
				</span>
				<div className="storeengine-control-switch">
					<Switch
						checked={ enableTax }
						onChange={ ( next ) => setEnableTax( next ) }
					/>
				</div>
			</div>

			<div
				className={ `storeengine-expandable-section ${
					enableTax ? 'storeengine-expandable-section--open' : ''
				}` }
			>
				<div className="storeengine-expandable-section-content">
					<div className="storeengine-tab-content--section">
						<div className="section-header">
							<h2 className="section-title">
								{ __( 'Products Tax', 'storeengine' ) }
							</h2>
							{ productTaxCollections?.length > 0 && (
								<Button
									preset="primary"
									onClick={ () =>
										setOpenProductModal(
											! openProductModal
										)
									}
								>
									{ __( '+ Collect Tax', 'storeengine' ) }
								</Button>
							) }
						</div>
						{ productTaxCollections?.length > 0 ? (
							<div className="storeengine-tab-content-texes__tax-items">
								{ productTaxCollections?.map(
									( singleItem, index ) => (
										<SingleTaxSection
											key={ index }
											singleItem={ singleItem }
										/>
									)
								) }
							</div>
						) : (
							<div className="storeengine-tab-content-texes__tax-canvas">
								<Button
									preset="primary"
									onClick={ () =>
										setOpenProductModal(
											! openProductModal
										)
									}
								>
									{ __( '+ Collect Tax', 'storeengine' ) }
								</Button>
							</div>
						) }
					</div>
					{ openProductModal && (
						<ReactModal
							title={ __( 'Collect product tax', 'storeengine' ) }
							isOpen={ openProductModal }
							isEnabledHeader={ true }
							onRequestClose={ () =>
								setOpenProductModal( false )
							}
							suffix="product-tax-modal"
						>
							<ProductTaxModal
								setOpenModal={ setOpenProductModal }
							/>
						</ReactModal>
					) }
					{ /* shipping tax */ }
					<div className="storeengine-tab-content--section">
						<Heading>
							{ __( 'Shipping Tax', 'storeengine' ) }
						</Heading>
						<div className="storeengine-tab-content-texes__tax-canvas">
							<Button preset="primary">
								{ __( '+ Collect Tax', 'storeengine' ) }
							</Button>
						</div>
					</div>
					<div className="storeengine-tab-content--section">
						<div className="storeengine-tab-content--section">
							<Checkbox
								title={ __( 'Inclusive Tax', 'storeengine' ) }
								name="inclusive_tax"
								suffix="all-checkbox"
							/>
							<Text
								title={ __( 'Rounding', 'storeengine' ) }
								prefix="rounding"
								placeholder="standard"
								name="rounding"
								readOnly={ false }
							/>
							<div className="storeengine-column-items storeengine-mb-6">
								<h2 className="storeengine-title">
									{ __(
										'Calculated Tax Based On',
										'storeengine'
									) }
								</h2>
								<StoreEngineSelect
									title={ __(
										'Calculated Tax Based On',
										'storeengine'
									) }
									placeholder="Customer Shipping Address"
									name="tax_based_on"
									options={ tax_based }
									value={ tax_based.find(
										( option ) =>
											option.value === values.tax_based_on
									) }
									onChangeHandler={ ( option ) => {
										setFieldValue( 'tax_based_on', option );
									} }
									suffix="tax-based"
								/>
							</div>
							<div className="storeengine-column-items storeengine-mb-6">
								<h2 className="storeengine-title">
									{ __(
										'Shipping Tax Class',
										'storeengine'
									) }
								</h2>
								<StoreEngineSelect
									title={ __(
										'Shipping Tax Class',
										'storeengine'
									) }
									placeholder="Shipping tax class on cart items"
									name="additional_tax_classes"
									options={ additional_tax }
									value={ additional_tax.find(
										( option ) =>
											option.value ===
											values.additional_tax_classes
									) }
									onChangeHandler={ ( option ) => {
										setFieldValue(
											'additional_tax_classes',
											option
										);
									} }
									suffix="additional-tax"
								/>
							</div>
							<div className="storeengine-column-items storeengine-mb-6">
								<h2 className="storeengine-title">
									{ __(
										'Display prices in the shop',
										'storeengine'
									) }
								</h2>
								<StoreEngineSelect
									title={ __(
										'Display prices in the shop',
										'storeengine'
									) }
									placeholder="Excluding tax"
									name="display_prices_in_the_shop"
									options={ display_price }
									value={ display_price.find(
										( option ) =>
											option.value ===
											values.display_prices_in_the_shop
									) }
									onChangeHandler={ ( option ) => {
										setFieldValue(
											'display_prices_in_the_shop',
											option
										);
									} }
									suffix="display-price"
								/>
							</div>
							<div className="storeengine-column-items storeengine-mb-6">
								<h2 className="storeengine-title">
									{ __(
										'Display prices during checkout',
										'storeengine'
									) }
								</h2>
								<StoreEngineSelect
									title={ __(
										'Display prices during checkout',
										'storeengine'
									) }
									placeholder="Excluding tax"
									name="display_prices_during_checkout"
									options={ display_price }
									value={ display_price.find(
										( option ) =>
											option.value ===
											values.display_prices_during_checkout
									) }
									onChangeHandler={ ( option ) => {
										setFieldValue(
											'display_prices_during_checkout',
											option
										);
									} }
									suffix="display-price"
								/>
							</div>
							<Text
								title={ __(
									'Price Display Suffix',
									'storeengine'
								) }
								prefix="price_display_suffix"
								placeholder="N/A"
								name="price_display_suffix"
								readOnly={ false }
							/>
						</div>
					</div>
				</div>
			</div>
		</Scope>
	);
};

export default Taxes;
