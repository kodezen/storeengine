import React, { useEffect } from 'react';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import { Select } from '@Components/ui/Select';
import { __, sprintf } from '@wordpress/i18n';
import { Field, FieldArray, useFormikContext } from 'formik';
import UploadFile from './UploadFile';
import { Scope, Heading, Button } from '@Components/ui';
import { generateUUID } from './helper';
import { Link } from 'react-router-dom';
import { is_pro, prepare_admin_route_path } from '@Utils/helper';
import Label from '@Components/Formik/Label';
import { getAddonActiveStatus } from '@Utils/helper';
import { useSelector } from 'react-redux';
import { FieldGate } from '../../productFormConfig';
import Tooltip from '@Components/Tooltip';
import { createInterpolateElement } from '@wordpress/element';
import classnames from 'classnames';

import './styles.scss';

const weightOptions = [
	{
		label: __( 'kg', 'storeengine' ),
		value: 'kg',
	},
	{
		label: __( 'g', 'storeengine' ),
		value: 'g',
	},
];

const paddleTaxCategoryOptions = [
	{
		label: __( 'Digital Goods', 'storeengine' ),
		value: 'digital-goods',
	},
	{
		label: __( 'eBooks', 'storeengine' ),
		value: 'ebooks',
	},
	{
		label: __( 'Implementation Services', 'storeengine' ),
		value: 'implementation-services',
	},
	{
		label: __( 'Professional Services', 'storeengine' ),
		value: 'professional-services',
	},
	{
		label: __( 'SaaS', 'storeengine' ),
		value: 'saas',
	},
	{
		label: __( 'Software Programming Services', 'storeengine' ),
		value: 'software-programming-services',
	},
	{
		label: __( 'Standard', 'storeengine' ),
		value: 'standard',
	},
	{
		label: __( 'Training Services', 'storeengine' ),
		value: 'training-services',
	},
	{
		label: __( 'Website Hosting', 'storeengine' ),
		value: 'website-hosting',
	},
];

const PhysicalProductOptions = () => {
	const { values, setFieldValue } = useFormikContext();
	const isActive =
		'physical' === values.meta._storeengine_product_shipping_type;

	return (
		<div
			className={ `storeengine-content-radio${
				isActive ? ' storeengine-content-radio--active' : ''
			}` }
		>
			<label
				className={ `storeengine-content-radio__label ` }
				htmlFor={ 'physical' }
			>
				{ __( 'Physical Product', 'storeengine' ) }
				<Field
					id="physical"
					type="radio"
					value={ 'physical' }
					className="storeengine-radio"
					name="meta._storeengine_product_shipping_type"
				/>
			</label>
			{ isActive && (
				<FieldGate id="weight">
					<div className="storeengine-physical-product-weight-area">
						<Text
							title={ __( 'Weight', 'storeengine' ) }
							placeholder="0.0"
							name="meta._storeengine_product_physical_weight"
							readOnly={ false }
						/>
						<Select
							name="meta._storeengine_product_physical_weight_unit"
							options={ weightOptions }
							className="storeengine-select storeengine-select--weight-unit"
							classNamePrefix="storeengine-react-select"
							value={ weightOptions.find(
								( item ) =>
									item.value ===
									values.meta
										._storeengine_product_physical_weight_unit
							) }
							isSearchable={ false }
							placeholder="kg"
							onChange={ ( option ) =>
								setFieldValue(
									'meta._storeengine_product_physical_weight_unit',
									option.value
								)
							}
						/>
					</div>
				</FieldGate>
			) }
		</div>
	);
};

const DigitalProductOptions = () => {
	const { values, setFieldValue, dirty } = useFormikContext();

	const addons = useSelector( ( state ) => state.addons );
	const hasLicenseAddon = getAddonActiveStatus(
		addons,
		'license-management'
	);
	const isActive =
		'digital' === values.meta._storeengine_product_shipping_type;
	const versioned =
		'versioned' === values.meta._storeengine_product_download_type;
	const isBundled = 'bundled' === values.product_type;

	const downloadTypes = [
		{
			label: __( 'Instant', 'storeengine' ),
			value: 'instant',
		},
		{
			label: __( 'Versioned (Software)', 'storeengine' ),
			value: 'versioned',
			isDisabled: ! hasLicenseAddon || ! is_pro,
			tooltip: __( 'Required License Management Addon', 'storeengine' ),
		},
	];

	useEffect( () => {
		if ( ! hasLicenseAddon && versioned ) {
			setFieldValue(
				'meta._storeengine_product_download_type',
				'instant'
			);
		}
	}, [ versioned ] );

	return (
		<>
			<div
				className={ classnames( 'storeengine-content-radio', {
					'storeengine-content-radio--active': isActive,
				} ) }
			>
				<label
					className={ `storeengine-content-radio__label` }
					htmlFor={ 'digital' }
				>
					{ __( 'Digital Product & Service', 'storeengine' ) }
					<Field
						id="digital"
						type="radio"
						value="digital"
						className="storeengine-radio"
						name="meta._storeengine_product_shipping_type"
					/>
				</label>
				{ isActive && (
					<>
						<div className='px-4 pt-4'>
							<Checkbox
								title={ __( 'Auto Fulfill', 'storeengine' ) }
								desc={ __(
									'Turn this off if you do not wish to automatically complete this product when an order is placed.',
									'storeengine'
								) }
								suffix="product-checkbox-reverse-auto-fill"
								name="meta._storeengine_product_digital_auto_complete"
							/>
						</div>

						{ getAddonActiveStatus( addons, 'paddle' ) && (
							<div className='px-4 pb-4'>
								<Label
									htmlFor="product_paddle_tax_category"
									title={ __(
										'Paddle Tax Category',
										'storeengine'
									) }
								/>
								<Select
									inputId="product_paddle_tax_category"
									options={ paddleTaxCategoryOptions }
									placeholder={ __(
										'Select Paddle Tax Category',
										'storeengine'
									) }
									name="meta._storeengine_paddle_tax_category"
									value={ paddleTaxCategoryOptions.find(
										( item ) =>
											item.value ===
											values?.meta
												?._storeengine_paddle_tax_category
									) }
									onChange={ ( option ) =>
										setFieldValue(
											'meta._storeengine_paddle_tax_category',
											option ? option.value : ''
										)
									}
									isClearable
									className='storeengine-select'
									classNamePrefix='storeengine-react-select'
								/>
							</div>
						) }

						{ ! isBundled && (
							<div className="storeengine-digital-downloadable-product__download-type">
								<span className="storeengine-title">
									{ __( 'Download Type', 'storeengine' ) }
								</span>
								<div className="storeengine-digital-downloadable-product__download-type-radio  storeengine-mt-2 storeengine-mb-2">
									{ downloadTypes.map(
										( downloadType, index ) => (
											<label
												key={ index }
												htmlFor={ downloadType.value }
												className={ classnames( {
													'storeengine-field-disabled':
														downloadType?.isDisabled,
												} ) }
											>
												<Field
													name="meta._storeengine_product_download_type"
													type="radio"
													className="storeengine-radio"
													value={ downloadType.value }
													id={ downloadType.value }
												/>
												{ downloadType.label }
												{ downloadType?.tooltip &&
													downloadType?.isDisabled && (
														<Tooltip>
															{
																downloadType?.tooltip
															}
														</Tooltip>
													) }
											</label>
										)
									) }
								</div>
								<div className="storeengine-mb-4">
									{ hasLicenseAddon && versioned && (
										<>
											{ ! dirty && (
												<span className="storeengine-checkbox--desc">
													<em>
														{ createInterpolateElement(
															sprintf(
																// translators: %s. Deployment page link.
																__(
																	'Manage deployment form <Link>%s</Link>',
																	'storeengine'
																),
																__(
																	'here',
																	'storeengine'
																)
															),
															{
																Link: (
																	<Link
																		to={ prepare_admin_route_path(
																			'storeengine-deployments',
																			{
																				id: values?.id,
																			}
																		) }
																	/>
																),
															}
														) }
													</em>
												</span>
											) }
											<Checkbox
												title={ __(
													'Enable license creation',
													'storeengine'
												) }
												suffix="product-enable-license-creation"
												name="meta._storeengine_product_enable_license_creation"
											/>
										</>
									) }
								</div>
							</div>
						) }
					</>
				) }
			</div>
			{ isActive && ! versioned && ! isBundled && (
				<DigitalDownloadableProductOptions />
			) }
		</>
	);
};

const DigitalDownloadableProductOptions = () => {
	const { values, setFieldValue } = useFormikContext();

	return (
		<div className="storeengine-digital-downloadable-products">
			<div className="storeengine-digital-downloadable-products__title">
				{ __( 'Downloadable files', 'storeengine' ) }
			</div>
			<FieldArray name="meta._storeengine_product_downloadable_files">
				{ ( { push, remove } ) => {
					const files =
						values.meta._storeengine_product_downloadable_files ||
						[];
					return (
						<div className="storeengine-digital-downloadable-product-items">
							{ files.length > 0 &&
								files.map( ( fileItem, index ) => (
									<div
										className="storeengine-digital-downloadable-product-item"
										key={ fileItem.id }
									>
										<Field
											name={ `meta._storeengine_product_downloadable_files.${ index }.name` }
											placeholder={ __(
												'Name',
												'storeengine'
											) }
											className="storeengine-input"
										/>
										<UploadFile
											attachment_id={
												fileItem.attachment_id
											}
											name={ `meta._storeengine_product_downloadable_files[${ index }].file` }
											saveValueHandler={ (
												attachment
											) => {
												setFieldValue(
													`meta._storeengine_product_downloadable_files[${ index }].name`,
													attachment.filename
												);
												setFieldValue(
													`meta._storeengine_product_downloadable_files[${ index }].attachment_id`,
													attachment.id
												);
												setFieldValue(
													`meta._storeengine_product_downloadable_files[${ index }].file`,
													attachment.url
												);
											} }
											onRemove={ () => remove( index ) }
										/>
									</div>
								) ) }
							<Button
								onClick={ () =>
									push( {
										id: generateUUID(),
										attachment_id: 0,
										name: '',
										file: '',
										enabled: true,
									} )
								}
							>
								{ __( 'Add file', 'storeengine' ) }
							</Button>
						</div>
					);
				} }
			</FieldArray>
		</div>
	);
};

const Shipping = () => {
	return (
		<Scope as="div" className="storeengine-content-section storeengine-content-section__shipping">
			<Heading as="p">{ __( 'Shipping', 'storeengine' ) }</Heading>
			<div className="storeengine-content-section__shipping__actions-section">
				<PhysicalProductOptions />
				<DigitalProductOptions />
			</div>
		</Scope>
	);
};

export default Shipping;
