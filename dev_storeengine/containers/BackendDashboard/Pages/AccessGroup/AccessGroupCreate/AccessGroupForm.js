import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import Text from '@Components/Formik/Text';
import Number from '@Components/Formik/Number';
import Textarea from '@Components/Formik/Textarea';
import { Select } from '@Components/ui/Select';
import Checkbox from '@Components/Formik/Checkbox';
import { Form, useFormikContext, Field } from 'formik';
import {
	enable_after_purchase_redirect,
	makeRequest,
	user_roles,
} from '@Utils/helper';
import Preloader from '@Components/Loader/Preloader';
import UploadImage from '@Components/UploadImage';
import { Button } from '@Components/ui';
import {
	SortableContainer,
	SortableElement,
	SortableHandle,
} from 'react-sortable-hoc';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import { contentType, featureIcons, expirationDateType } from './options';
import OptionMenu from '@Components/OptionMenu';
import { applyFilters } from '@wordpress/hooks';
import PricingSection from './components/PricingSection';

import '../styles.scss';
import SwitchControl from '@Components/Formik/SwitchControl';
import PurchaseRedirect from './PurchaseRedirect';

const DragHandle = SortableHandle( () => (
	<span
		className="storeengine-icon storeengine-icon--move storeengine-pointer"
		aria-hidden={ true }
	/>
) );

const SortableFeatureItem = SortableElement(
	( { feature, itemIndex, getIconClass, onRemove, onEdit } ) => {
		return (
			<div className="storeengine-d-flex storeengine-flex-gap-8 storeengine-content-section__feature-item">
				<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-16">
					<DragHandle />
					<span
						className={ `${ getIconClass(
							feature?.icon
						) } storeengine-feature-icon` }
					></span>
					<span className="storeengine-title">
						{ feature?.label }
					</span>
				</div>

				<OptionMenu
					options={ [
						{
							type: 'button',
							label: <span>{ __( 'Edit', 'storeengine' ) }</span>,
							icon: (
								<span
									className="storeengine-icon storeengine-icon--edit"
									aria-hidden={ true }
								/>
							),
							onClick: () => onEdit( feature, itemIndex ),
						},
						{
							type: 'button',
							label: (
								<span>{ __( 'Delete', 'storeengine' ) }</span>
							),
							suffix: 'trash',
							icon: (
								<span
									className="storeengine-icon storeengine-icon--trash"
									aria-hidden={ true }
								/>
							),
							onClick: () => onRemove( itemIndex ),
						},
					] }
				/>
			</div>
		);
	}
);

const SortableFeatureList = SortableContainer(
	( { features, getIconClass, onRemove, onEdit } ) => (
		<dic className="storeengine-content-section__feature-items">
			{ features.map( ( feature, index ) => (
				<SortableFeatureItem
					key={ `item-${ index }` }
					index={ index }
					itemIndex={ index }
					feature={ feature }
					getIconClass={ getIconClass }
					onRemove={ onRemove }
					onEdit={ onEdit }
				/>
			) ) }
		</dic>
	)
);

const AccessGroupForm = () => {
	const { values, setFieldValue } = useFormikContext();
	const [ isFetch, setIsFetch ] = useState( false );
	const [ loading, setLoading ] = useState( false );
	const [ options, setOptions ] = useState( [] );
	const [ dropdownOpen, setDropdownOpen ] = useState( false );
	const [ selectedIcon, setSelectedIcon ] = useState( featureIcons[ 0 ] );
	const [ isEditMode, setIsEditMode ] = useState( false );
	const [ editIndex, setEditIndex ] = useState( null );

	const selectedType =
		values?.meta?._storeengine_membership_authorization?.type;

	const userRole = user_roles?.reduce( ( acc, current ) => {
		const currentUser = {
			label: current.role_name,
			value: current.role_id,
		};
		acc.push( currentUser );
		return acc;
	}, [] );

	useEffect( () => {
		if ( options.length === 0 ) {
			setLoading( true );
			fetchDataHandler();
		}
	}, [] );

	const fetchDataHandler = ( keyword = '' ) => {
		setIsFetch( true );
		makeRequest( 'get_excluded_items_list', {
			keyword,
			include:
				values.meta?._storeengine_membership_content_protect_types
					?.rules ?? [],
		} ).then( ( response ) => {
			setOptions( response.data.data );
			setIsFetch( false );
			setTimeout( () => {
				setLoading( false );
			}, 500 );
		} );
	};

	const isSpecificsSelected =
		values?.meta?._storeengine_membership_content_protect_types.rules?.find(
			( item ) => item === 'specifics'
		);

	const contentSelectedValue = contentType?.reduce( ( acc, current ) => {
		const content =
			values.meta?._storeengine_membership_content_protect_types?.rules?.find(
				( content ) => {
					if ( content === current.value ) {
						return current;
					}
				}
			);
		if ( content !== undefined ) {
			acc.push( current );
		}
		return acc;
	}, [] );

	const handleIconSelect = ( icon ) => {
		setSelectedIcon( icon );
		setDropdownOpen( false );
	};

	const handleAddFeature = () => {
		const featureName = values.feature_name;

		if ( ! featureName || ! featureName.trim() ) {
			return;
		}

		const newFeature = {
			icon: selectedIcon.value,
			label: featureName.trim(),
		};

		const updatedFeatures = [
			...( values.meta._storeengine_membership_features || [] ),
		];

		if ( isEditMode && editIndex !== null ) {
			updatedFeatures[ editIndex ] = newFeature;
			setIsEditMode( false );
			setEditIndex( null );
		} else {
			updatedFeatures.push( newFeature );
		}

		setFieldValue(
			'meta._storeengine_membership_features',
			updatedFeatures
		);
		setFieldValue( 'feature_name', '' );
		setSelectedIcon( featureIcons[ 0 ] );
	};

	const handleEditAction = ( feature, index ) => {
		setFieldValue( 'feature_name', feature.label );
		const iconItem = featureIcons.find(
			( icon ) => icon.value === feature.icon
		);
		setSelectedIcon( iconItem || featureIcons[ 0 ] );
		setIsEditMode( true );
		setEditIndex( index );
	};

	const handleRemoveFeature = ( index ) => {
		const updatedFeatures = [
			...values.meta._storeengine_membership_features,
		];
		updatedFeatures.splice( index, 1 );
		setFieldValue(
			'meta._storeengine_membership_features',
			updatedFeatures
		);
	};

	const getIconClass = ( iconValue ) => {
		const iconItem = featureIcons.find(
			( item ) => item.value === iconValue
		);
		return iconItem ? iconItem.label : featureIcons[ 0 ].label;
	};

	const onSortEnd = ( { oldIndex, newIndex } ) => {
		const features = values.meta._storeengine_membership_features || [];
		const updatedFeatures = arrayMove( features, oldIndex, newIndex );
		setFieldValue(
			'meta._storeengine_membership_features',
			updatedFeatures
		);
	};

	const formedExclude = options.map( ( option ) => ( {
		...option,
		label: `${ option.label.replace( /_/g, ' ' ) }`,
	} ) );

	return (
		<Form>
			{ loading ? (
				<Preloader />
			) : (
				<React.Fragment>
					<div className="storeengine-page-content storeengine-page-content--access-group">
						<div className="storeengine-page-content__left">
							{ /* Name */ }{ ' ' }
							<div className="storeengine-content-section storeengine-pb-0">
								<h2 className="storeengine-heading">
									{ __( 'Name', 'storeengine' ) }
								</h2>

								<Text
									name="title"
									title={ __(
										'Access Group Name',
										'storeengine'
									) }
									placeholder={ __(
										'Enter access group name',
										'storeengine'
									) }
								/>

								<Textarea
									name="meta._storeengine_membership_authorization.message"
									title={ __(
										'Unauthorized Access Message',
										'storeengine'
									) }
									placeholder={ __(
										'Enter Your Message',
										'storeengine'
									) }
								/>
								<div className="storeengine-mb-4">
									<p className="storeengine-title-subtitle">
										{ __(
											'Only unauthorized users access this restricted content.',
											'storeengine'
										) }
									</p>
								</div>
							</div>
							{ /* Protected Content */ }{ ' ' }
							<div className="storeengine-content-section">
								<h2 className="storeengine-heading">
									{ __( 'Protected Content', 'storeengine' ) }
								</h2>

								<Select
									className="storeengine-select"
									classNamePrefix="storeengine-react-select"
									placeholder={ __(
										'Protect Content Type',
										'storeengine'
									) }
									isClearable={ true }
									value={ contentSelectedValue }
									options={ contentType }
									isMulti
									onChange={ ( option ) => {
										const selectedOptions = option.reduce(
											( acc, current ) => {
												acc.push( current.value );
												return acc;
											},
											[]
										);
										setFieldValue(
											'meta._storeengine_membership_content_protect_types.rules',
											selectedOptions
										);
									} }
								/>

								{ isSpecificsSelected && (
									<Select
										className="storeengine-select storeengine-mt-2"
										classNamePrefix="storeengine-react-select"
										placeholder={ __(
											'Specific Items',
											'storeengine'
										) }
										isClearable={ true }
										value={
											values.meta
												?._storeengine_membership_content_protect_types
												?.specifics
										}
										onInputChange={ fetchDataHandler }
										isLoading={ isFetch }
										options={ options }
										isMulti
										onChange={ ( option ) => {
											setFieldValue(
												'meta._storeengine_membership_content_protect_types.specifics',
												option
											);
										} }
									/>
								) }

								{ values?.meta
									?._storeengine_membership_content_protect_types
									?.rules?.length > 0 && (
									<div className="storeengine-protect-content-type storeengine-mt-6">
										<h2 className="storeengine-title">
											{ __(
												'Excluded items',
												'storeengine'
											) }
										</h2>

										<Select
											className="storeengine-select storeengine-mt-2"
											classNamePrefix="storeengine-react-select"
											placeholder={ __(
												'Membership content protect excluded Items',
												'storeengine'
											) }
											isClearable={ true }
											onInputChange={ fetchDataHandler }
											isMulti
											options={ formedExclude }
											isLoading={ isFetch }
											value={
												values?.meta
													?._storeengine_membership_content_protect_excluded_items
											}
											noOptionsMessage={ () =>
												__(
													'Please type at least 1 character to search',
													'storeengine'
												)
											}
											onChange={ ( option ) => {
												setFieldValue(
													'meta._storeengine_membership_content_protect_excluded_items',
													option
												);
											} }
										/>
									</div>
								) }
							</div>
							{ applyFilters(
								'storeengine.access-group.drip-content',
								null,
								{
									data: values,
									options,
									handler: setFieldValue,
									fetchDataHandler,
								}
							) }
							<div className="storeengine-content-section storeengine-content-section__feature">
								<h2 className="storeengine-heading">
									{ __( 'Features', 'storeengine' ) }
								</h2>

								{ values?.meta
									?._storeengine_membership_features &&
									values?.meta
										?._storeengine_membership_features
										.length > 0 && (
										<SortableFeatureList
											features={
												values.meta
													._storeengine_membership_features
											}
											getIconClass={ getIconClass }
											onRemove={ handleRemoveFeature }
											onSortEnd={ onSortEnd }
											useDragHandle
											helperClass="storeengine-feature-item-dragging"
											lockAxis="y"
											onEdit={ handleEditAction }
										/>
									) }

								<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8">
									<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8">
										<Select
											className="storeengine-select storeengine-select--feature-icon storeengine-mb-6"
											placeholder={ __(
												'Select Icon',
												'storeengine'
											) }
											options={ featureIcons }
											value={ selectedIcon }
											onChange={ handleIconSelect }
											formatOptionLabel={ ( option ) => (
												<span className="storeengine-feature-icon-option">
													<span
														className={ `${ option.label } storeengine-feature-icon-option__icon` }
													/>
													<span className="storeengine-feature-icon-option__title">
														{ option.title }
													</span>
												</span>
											) }
										/>
									</div>

									<Field
										type="text"
										name="feature_name"
										placeholder={ __(
											'Add feature name here.',
											'storeengine'
										) }
										className="storeengine-input storeengine-mb-6"
									/>
								</div>

								<Button
									type="button"
									onClick={ handleAddFeature }
									preset="soft"
								>
									{ isEditMode
										? __( 'Update Feature', 'storeengine' )
										: values?.meta
												?._storeengine_membership_features
												.length > 0
										? __(
												'Add Another Feature',
												'storeengine'
										  )
										: __( 'Add Feature', 'storeengine' ) }
								</Button>
							</div>
							{ /* Add Download */ }{ ' ' }
							<div className="storeengine-content-section">
								<h2 className="storeengine-heading">
									{ __( 'Download', 'storeengine' ) }
								</h2>
								<UploadImage
									name="meta._storeengine_membership_attachments"
									value={
										values.meta
											._storeengine_membership_attachments
									}
									saveValueHandler={ setFieldValue }
									isMulti={ true }
								/>
							</div>
						</div>

						<div className="storeengine-page-content__right">
							{ /* Pricing (simple by default, advanced disclosure) */ }
							{ values.meta?._storeengine_membership_authorization
								?.type !== 'redirect' && <PricingSection /> }
							{ /* Expiration */ }{ ' ' }
							<div className="storeengine-content-section storeengine-pb-0">
								<h2 className="storeengine-heading">
									{ __( 'Redirection', 'storeengine' ) }
								</h2>

								<label className="storeengine-title storeengine-d-flex storeengine-mb-4">
									{ __(
										'Enable Redirect URL',
										'storeengine'
									) }
									<Field
										checked={
											values.meta
												?._storeengine_membership_authorization
												?.type === 'redirect'
										}
										type="checkbox"
										name="values.meta._storeengine_membership_authorization.type"
										component={ SwitchControl }
										onChange={ ( e ) => {
											const isChecked = e.target.checked;
											setFieldValue(
												'meta._storeengine_membership_authorization.type',
												isChecked
													? 'redirect'
													: 'message'
											);
										} }
									/>
								</label>
								{ values.meta
									?._storeengine_membership_authorization
									?.type === 'redirect' && (
									<div className="storeengine-mt-4">
										<Text
											placeholder={ __(
												'Enter redirect URL here',
												'storeengine'
											) }
											title={ __(
												'Redirect URL',
												'storeengine'
											) }
											name="meta._storeengine_membership_authorization.redirect_url"
											readOnly={ false }
										/>
									</div>
								) }
							</div>
							{ /* Purchase after redirect */ }
							{ enable_after_purchase_redirect && (
								<PurchaseRedirect />
							) }
							{ /* Expiration */ }{ ' ' }
							<div className="storeengine-content-section storeengine-pb-0">
								<h2 className="storeengine-heading">
									{ __( 'Expiration', 'storeengine' ) }
								</h2>

								<Checkbox
									title={ __(
										'Enable Access Group Expiration',
										'storeengine'
									) }
									suffix="create-customer-checkbox"
									name="meta._storeengine_membership_expiration.is_enable_expiration"
								/>

								{ values?.meta
									._storeengine_membership_expiration
									.is_enable_expiration && (
									<>
										{ expirationDateType.map(
											( expirationDate, index ) => {
												const isActive =
													values?.meta
														?._storeengine_membership_expiration
														?.date_type ===
													expirationDate.value;
												return (
													<div
														key={ index }
														className={ `storeengine-unauthorized-access ${
															isActive
																? 'storeengine-unauthorized-access--is-active'
																: 'storeengine-unauthorized-access--is-inactive'
														}` }
													>
														<label
															htmlFor={
																expirationDate.value
															}
															className="storeengine-title storeengine-d-flex storeengine-pointer storeengine-flex-gap-8"
														>
															<span className="storeengine-title">
																{ ' ' }
																{
																	expirationDate.label
																}
															</span>

															<Field
																name="meta._storeengine_membership_expiration.date_type"
																type="radio"
																className="storeengine-radio"
																value={
																	expirationDate.value
																}
																id={
																	expirationDate.value
																}
															/>
														</label>

														{ values?.meta
															?._storeengine_membership_expiration
															?.date_type ===
															expirationDate.value && (
															<div className="storeengine-coupon-amount-type storeengine-mt-4">
																{ expirationDate.value ===
																'relative_date' ? (
																	<div className="storeengine-mt-4">
																		<Number
																			title={ __(
																				'Duration',
																				'storeengine'
																			) }
																			name="meta._storeengine_membership_expiration.fixed_date_duration"
																			value=""
																			unit={ __(
																				'Days',
																				'storeengine'
																			) }
																		/>
																	</div>
																) : (
																	expirationDate.value ===
																		'specific_date' && (
																		<div className="storeengine-mt-4 storeengine-space-y-6">
																			<Field
																				type="date"
																				name="meta._storeengine_membership_expiration.specific_date"
																				placeholder={ __(
																					'Select a date',
																					'storeengine'
																				) }
																				className="storeengine-content-section__membership-expiration storeengine-mb-6 storeengine-input"
																			/>
																		</div>
																	)
																) }
															</div>
														) }
													</div>
												);
											}
										) }
									</>
								) }
							</div>
							{ /* Options */ }{ ' ' }
							<div className="storeengine-content-section storeengine-pb-0">
								<h2 className="storeengine-heading">
									{ __( 'Options', 'storeengine' ) }
								</h2>

								<h2 className="storeengine-title storeengine-mb-2">
									{ __( 'User Role Sync', 'storeengine' ) }
								</h2>

								<Select
									className="storeengine-select storeengine-mb-4"
									classNamePrefix="storeengine-react-select"
									placeholder={ __(
										'Membership User Roles',
										'storeengine'
									) }
									isClearable={ true }
									value={
										values?.meta
											?._storeengine_membership_user_roles
									}
									options={ userRole }
									isMulti
									onChange={ ( option ) => {
										setFieldValue(
											'meta._storeengine_membership_user_roles',
											option
										);
									} }
								/>
								<div className="storeengine-mb-4">
									<p className="storeengine-title-subtitle">
										{ __(
											'Users in this group will be assigned the selected user role automatically.',
											'storeengine'
										) }
									</p>
								</div>
								<Text
									placeholder={ __(
										'Enter access group name',
										'storeengine'
									) }
									title={ __( 'Priority', 'storeengine' ) }
									name="meta._storeengine_membership_priority"
									readOnly={ false }
								/>
							</div>
						</div>
					</div>
				</React.Fragment>
			) }
		</Form>
	);
};

export default AccessGroupForm;
