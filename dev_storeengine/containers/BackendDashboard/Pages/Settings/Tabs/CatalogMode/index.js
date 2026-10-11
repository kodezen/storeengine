import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import Label from '@Components/Formik/Label';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import Textarea from '@Components/Formik/Textarea';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import { Select } from '@Components/ui/Select';
import { useFormikContext } from 'formik';

const hide_add_to_cart_in_options = [
	{
		label: __( 'All Pages', 'storeengine' ),
		value: 'all',
	},
	{
		label: __( 'Shop Page', 'storeengine' ),
		value: 'shop',
	},
	{
		label: __( 'Product Page', 'storeengine' ),
		value: 'product',
	},
];

const link_target_options = [
	{
		label: __( 'Same tab', 'storeengine' ),
		value: '_self',
	},
	{
		label: __( 'New Tab', 'storeengine' ),
		value: '_blank',
	},
];

const CatalogMode = () => {
	const {
		values: {
			catalog_mode = {
				enabled: false,
				disable_price: true,
				price_placeholder: '',
				hide_add_to_cart_in: '',
				disable_cart_checkout: true,
				customize_add_to_cart: true,
				add_to_cart_shop_page_text: __(
					'Request a Quote',
					'storeengine'
				),
				add_to_cart_product_page_text: __(
					'Request a Quote',
					'storeengine'
				),
				add_to_cart_link: '#',
				add_to_cart_link_target: '',
				add_to_cart_placeholder: '',
				exclude_role: [ 'administrator' ],
			},
		},
		setFieldValue,
	} = useFormikContext();

	useEffect( () => {
		if ( ! window.StoreEngineGlobal?.userRoles ) {
			window.location.reload();
		}
	}, [ window.StoreEngineGlobal?.userRoles ] );

	return (
		<div
			id="settingsCatalogMode"
			className="storeengine-tab-content--catalog-mode"
		>
			<div className="storeengine-content-section">
				<h2 className="storeengine-heading">
					{ __( 'Catalog Mode', 'storeengine' ) }
				</h2>
				<Checkbox
					title={ __( 'Enable Catalog Mode', 'storeengine' ) }
					name="catalog_mode.enabled"
				/>
				<div
					className="storeengine-flex"
					style={ { flexDirection: 'column' } }
				>
					<Checkbox
						title={ __( 'Hide Prices', 'storeengine' ) }
						name="catalog_mode.disable_price"
						isDisabled={ ! catalog_mode?.enabled }
					/>
					<div
						className={ `storeengine-expandable-section ${
							catalog_mode?.enabled && catalog_mode?.disable_price
								? 'storeengine-expandable-section--open'
								: ''
						}` }
					>
						<div className="storeengine-expandable-section-content">
							<Textarea
								title={ __(
									'Price Placeholder',
									'storeengine'
								) }
								tooltip={ __(
									"Enter the text you want to display when price is removed. Leave it empty if you don't want to show any placeholder text.",
									'storeengine'
								) }
								name="catalog_mode.price_placeholder"
								desc={
									<span>
										{ __( 'E.g.', 'storeengine' ) }{ ' ' }
										<code>
											{ __(
												'Please <a class="contact-cta" href="https://example.com/contact-us">contact</a> for details.',
												'storeengine'
											) }
										</code>
									</span>
								}
							/>
						</div>
					</div>
				</div>
				<div
					className="storeengine-flex"
					style={ { flexDirection: 'column' } }
				>
					<Label
						title={ __(
							'Hide “Add to Cart” Button in',
							'storeengine'
						) }
						isRequired={ true }
					/>
					<Select
						className="storeengine-select storeengine-mb-6"
						classNamePrefix="storeengine-react-select"
						name="catalog_mode.hide_add_to_cart_in"
						isDisabled={ ! catalog_mode?.enabled }
						required={ true }
						value={
							catalog_mode?.hide_add_to_cart_in
								? hide_add_to_cart_in_options.filter(
										( item ) =>
											item.value ===
											catalog_mode?.hide_add_to_cart_in
								  )
								: ''
						}
						options={ hide_add_to_cart_in_options }
						onChange={ ( option ) => {
							setFieldValue(
								'catalog_mode.hide_add_to_cart_in',
								option?.value || 'all'
							);
						} }
						menuPlacement={ 'auto' }
					/>
					<div
						className={ `storeengine-expandable-section ${
							catalog_mode?.enabled
								? 'storeengine-expandable-section--open'
								: ''
						}` }
					>
						<div className="storeengine-expandable-section-content">
							<Textarea
								title={ __(
									'“Add to Cart” Button Placeholder',
									'storeengine'
								) }
								tooltip={ __(
									"Enter a text or html content to display when Add to Cart button is removed. Leave it empty if you don't want to show any content.",
									'storeengine'
								) }
								name="catalog_mode.add_to_cart_placeholder"
								desc={
									<span>
										{ __( 'E.g.', 'storeengine' ) }{ ' ' }
										<code>
											{ __(
												'<a class="whatsapp-cta" href="https://api.whatsapp.com/send?phone=0123456789" target="_blank">WhatsApp</a> for details.',
												'storeengine'
											) }
										</code>
									</span>
								}
							/>
						</div>
					</div>
				</div>

				<Checkbox
					title={ __( 'Hide Cart & Checkout Page', 'storeengine' ) }
					tooltip={
						catalog_mode?.enabled
							? __(
									'If enabled, cart & checkout page will be redirect to Store Page and all add-to-cart ajax action will be removed.',
									'storeengine'
							  )
							: null
					}
					name="catalog_mode.disable_cart_checkout"
					isDisabled={ ! catalog_mode?.enabled }
				/>

				<div className="flex flex-col gap-2">
					<Label
						title={ __( 'Exclude Users by Role', 'storeengine' ) }
						tooltip={ __(
							'Users with selected role will be excluded from catalog-mode and able to purchase products.',
							'storeengine'
						) }
						isRequired={ true }
					/>
					<Select
						required={ true }
						id="catalog_mode_exclude_user_role"
						name={ 'catalog_mode.exclude_role' }
						className="storeengine-select"
						classNamePrefix="storeengine-react-select"
						placeholder={ __( 'Select User Roles', 'storeengine' ) }
						isSearchable={ true }
						isMulti={ true }
						isDisabled={ ! catalog_mode?.enabled }
						value={
							catalog_mode?.exclude_role &&
							Array.isArray( catalog_mode.exclude_role )
								? (
										window.StoreEngineGlobal?.userRoles ||
										[]
								  ).filter( ( item ) =>
										catalog_mode?.exclude_role.includes(
											item.value
										)
								  )
								: []
						}
						options={
							window.StoreEngineGlobal?.userRoles || [
								{
									label: __( 'No exclusion', 'storeengine' ),
									value: '',
								},
								{
									label: __( 'Administrator', 'storeengine' ),
									value: 'administrator',
								},
							]
						}
						onChange={ ( options ) => {
							options = options.filter( ( item ) => item.value );
							if ( options.length ) {
								setFieldValue(
									'catalog_mode.exclude_role',
									options.map( ( option ) => option.value )
								);
							} else {
								setFieldValue( 'catalog_mode.exclude_role', [
									'',
								] );
							}
						} }
						menuPlacement={ 'auto' }
					/>
				</div>
			</div>

			<div className="storeengine-content-section">
				<Checkbox
					title={ __(
						'Customize “Add to Cart” Button',
						'storeengine'
					) }
					name="catalog_mode.customize_add_to_cart"
					suffix={ 'customize_add_to_cart storeengine-mb-0' }
					isDisabled={
						! catalog_mode?.enabled ||
						catalog_mode?.disable_add_to_cart
					}
				/>
				<div
					className={ `storeengine-expandable-section ${
						catalog_mode?.enabled &&
						! catalog_mode?.disable_add_to_cart &&
						catalog_mode?.customize_add_to_cart
							? 'storeengine-expandable-section--open'
							: ''
					}` }
				>
					<div className="storeengine-expandable-section-content">
						<StoreEngineSeparator isBottom={ true } />
						<Text
							title={ __(
								'Button text (Shop Page)',
								'storeengine'
							) }
							name="catalog_mode.add_to_cart_shop_page_text"
							isRequired={ true }
							desc={ __( 'E.G. Request a Quote', 'storeengine' ) }
						/>
						<Text
							title={ __(
								'Button text (Product Page)',
								'storeengine'
							) }
							name="catalog_mode.add_to_cart_product_page_text"
							isRequired={ true }
							desc={ __( 'E.G. Request a Quote', 'storeengine' ) }
						/>
						<Text
							type="url"
							title={ __( 'Button URL', 'storeengine' ) }
							name="catalog_mode.add_to_cart_link"
							isRequired={ true }
							desc={ __(
								'E.G. https://example.com/contact-us',
								'storeengine'
							) }
						/>

						<div className='flex justify-between gap-4'>
							<Label
								title={ __(
									'Button Link Open in',
									'storeengine'
								) }
								isRequired={ true }
							/>
							<Select
								className="storeengine-select"
								classNamePrefix="storeengine-react-select"
								name="catalog_mode.add_to_cart_link_target"
								required={ true }
								value={
									catalog_mode?.add_to_cart_link_target
										? link_target_options.filter(
												( item ) =>
													item.value ===
													catalog_mode?.add_to_cart_link_target
										  )
										: ''
								}
								options={ link_target_options }
								onChange={ ( option ) =>
									setFieldValue(
										'catalog_mode.add_to_cart_link_target',
										option?.value || '_self'
									)
								}
								menuPlacement={ 'top' }
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CatalogMode;
