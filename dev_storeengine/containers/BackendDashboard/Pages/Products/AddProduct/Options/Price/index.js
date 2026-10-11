import React, { useEffect, useMemo, useState } from 'react';
import Preloader from '@Components/Loader/Preloader';
import { Field, useFormikContext } from 'formik';
import {
	copyToClipboard,
	getAddonActiveStatus,
	makeRequest2,
	ucwords,
	wait,
} from '@Utils/helper';
import {
	sortableContainer,
	sortableElement,
	sortableHandle,
} from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import OptionMenu from '@Components/OptionMenu';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Scope, Heading, Button } from '@Components/ui';
import { useDispatch, useSelector } from 'react-redux';
import EditPrice from './EditPrice';
import SimplePrice from './components/SimplePrice';
import PricingSidePanel, { PricingViewToggle } from './PricingSidePanel';
import usePricingView from './usePricingView';
import { getInitialPricingMode } from './helper';
import Currency from '@Components/Currency';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import {
	fetchAllPrices,
	deletePrice,
} from '@Redux/Slices/pricesSlice/pricesSlice';
import classNames from 'classnames';
import { Select } from '@Components/ui/Select';
import { shouldCancelStart } from '@Utils/sortable';

const durationTranslations = {
	day: [ __( 'day', 'storeengine' ), __( 'days', 'storeengine' ) ],
	week: [ __( 'week', 'storeengine' ), __( 'weeks', 'storeengine' ) ],
	month: [ __( 'month', 'storeengine' ), __( 'months', 'storeengine' ) ],
	year: [ __( 'year', 'storeengine' ), __( 'years', 'storeengine' ) ],
};

const DragHandle = sortableHandle( () => (
	<a className="drag-handler" href="#" onClick={ ( e ) => e.preventDefault() }>
		<span
			className="storeengine-icon storeengine-icon--drag storeengine-flex"
			aria-hidden={ true }
		/>
		<span className="screen-reader-text">
			{ __( 'Click here to change sorting order.', 'storeengine' ) }
		</span>
	</a>
) );

const SortablePriceItem = sortableElement(
	( {
		ID,
		price,
		handleEdit,
		handleDelete,
		handleVisibilityToggle,
		editingPrice,
		setEditingPrice,
		setLoading,
		loading,
		togglingId,
		itemIndex,
	} ) => {
		const { values } = useFormikContext();
		const [ editTitle, setEditTitle ] = useState( false );
		const dispatch = useDispatch();
		const allAddons = useSelector( ( state ) => state.addons );
		const addons = React.useMemo(
			() => ( {
				subscription: getAddonActiveStatus( allAddons, 'subscription' ),
				installment: getAddonActiveStatus(
					allAddons,
					'installment-plan'
				),
				license: getAddonActiveStatus(
					allAddons,
					'license-management'
				),
			} ),
			[ allAddons ]
		);

		const handleCopy = async ( id ) => {
			await copyToClipboard( id );
			dispatch(
				showNotification( {
					message: sprintf(
						// translators: %s: Price ID
						__(
							'Price ID "%s" copied to clipboard',
							'storeengine'
						),
						id
					),
					isShow: true,
					type: 'success',
				} )
			);
		};

		return (
			<div
				className={ classNames( {
					'storeengine-single-product': true,
					'storeengine-mb-3': itemIndex !== values.prices.length - 1,
					'is-price-hidden': price.settings.is_hidden,
				} ) }
			>
				<div className={ classNames( { 'storeengine-d-flex': true } ) }>
					<div className="storeengine-product-editor-price-item">
						<div className="storeengine-product-editor-price-item__details">
							<div className="storeengine-product-price-title">
								<DragHandle />
								<div className="storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center storeengine-m-0">
									<div className="storeengine-highlight">
										<Button
											type="button"
											onClick={ () =>
												handleCopy(
													String( price?.id )
												)
											}
											preset="ghost"
											size="xs"
											className="!p-0 text-se-text leading-none"
										>
											{ `#${ price?.id }` }
										</Button>
										<span className="storeengine-highlight__tooltip">
											{ __(
												'Copy Price ID',
												'storeengine'
											) }
										</span>
									</div>
									{ editTitle ? (
										<Field
											name={ `prices[${ itemIndex }.price_name]` }
											className="storeengine-input storeengine-input__price-title"
										/>
									) : (
										<h3 className="storeengine-product-name">
											{ price?.price_name }
										</h3>
									) }
									{ ! editTitle ? (
										<Button
											preset="ghost"
											icon="storeengine-icon--edit"
											onClick={ () =>
												setEditTitle( true )
											}
											size="sm"
										/>
									) : (
										<Button
											preset="ghost"
											icon="storeengine-icon--check"
											onClick={ () =>
												setEditTitle( false )
											}
											size="sm"
										/>
									) }
								</div>
							</div>
							<div className="storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center">
								<h3
									className={
										'storeengine-label-highlight storeengine-m-0 storeengine-label-highlight__' +
										price?.price_type
									}
								>
									<span>
										{ ucwords(
											price?.price_type.replace(
												/[_-]+/g,
												' '
											)
										) }
									</span>
									{ 'subscription' === price?.price_type &&
										addons.subscription &&
										price?.settings?.payment_duration && (
											<span>
												{ price?.settings
													?.payment_duration > 1
													? sprintf(
															// translators: %1$s: subscription duration, %2$s: subscription duration type.
															__(
																'(Every %1$s %2$s)',
																'storeengine'
															),
															price?.settings
																?.payment_duration,
															durationTranslations[
																price?.settings
																	?.payment_duration_type
															][ 1 ]
													  )
													: sprintf(
															// translators: %1$s: subscription duration type.
															__(
																'(Every %1$s)',
																'storeengine'
															),
															durationTranslations[
																price?.settings
																	?.payment_duration_type
															][ 0 ]
													  ) }
											</span>
										) }
									{ 'installment-plan' ===
										price?.price_type &&
									addons.installment ? (
										<span>
											{ sprintf(
												// translators: %d: Number of installment in the price.
												_n(
													'(Deposit + %d installment)',
													'(Deposit + %d installments)',
													price?.settings
														?.installments
														?.length || 0,
													'storeengine'
												),
												price?.settings?.installments
													?.length || 0
											) }
										</span>
									) : null }
								</h3>
								<span className="storeengine-table-sub-title__item--separator">
									&#x25cf;
								</span>
								<p className="storeengine-product-price">
									<Currency value={ price?.price } />
								</p>
								{ parseFloat( price?.compare_price ) > 0 && (
									<p className="storeengine-product-regular-price">
										<Currency
											value={ price?.compare_price }
										/>
									</p>
								) }
								{ addons.license &&
									values?.meta
										?._storeengine_product_enable_license_creation && (
										<>
											<span className="storeengine-table-sub-title__item--separator">
												&#x25cf;
											</span>
											<span className="storeengine-product-price-license storeengine-flex storeengine-flex-gap-8 storeengine-flex-align-center">
												<span
													className="storeengine-icon storeengine-icon--key"
													aria-hidden={ true }
												/>
												{ price?.settings
													?.enable_license_activation_limit &&
												price?.settings
													?.license_activation_limit >
													0
													? sprintf(
															// translators: %d: Maximum number of license activations allowed.
															__(
																'License (max %d activation(s))',
																'storeengine'
															),
															price?.settings
																?.license_activation_limit
													  )
													: __(
															'License (unlimited activations)',
															'storeengine'
													  ) }
											</span>
										</>
									) }
							</div>
						</div>
					</div>
					<OptionMenu
						suffix="product-price-menu"
						isLoading={ togglingId === price.id }
						options={ [
							{
								type: 'button',
								label: __( 'Edit', 'storeengine' ),
								onClick: () => {
									setEditTitle( false );
									handleEdit( price );
								},
								icon: (
									<span className="storeengine-icon storeengine-icon--edit" />
								),
							},
							{
								type: 'button',
								label: price?.settings.is_hidden
									? __( 'Show In Frontend', 'storeengine' )
									: __( 'Hide In Frontend', 'storeengine' ),
								onClick: () => handleVisibilityToggle( price ),
								icon: (
									<span
										className={ classNames( {
											'storeengine-icon': true,
											'storeengine-icon--eye':
												price?.settings.is_hidden,
											'storeengine-icon--eye-alt':
												! price?.settings.is_hidden,
										} ) }
										aria-hidden={ true }
									/>
								),
							},
							{
								type: 'button',
								label: __( 'Copy Link', 'storeengine' ),
								hasBorder: true,
								onClick: async () => {
									if ( ! price?.checkout_link ) {
										dispatch(
											showNotification( {
												message: __(
													'Save the product first to get a checkout link.',
													'storeengine'
												),
												isShow: true,
												type: 'error',
											} )
										);
										return;
									}
									await copyToClipboard(
										price.checkout_link
									);
									dispatch(
										showNotification( {
											message: __(
												'Checkout link copied to clipboard',
												'storeengine'
											),
											isShow: true,
											type: 'success',
										} )
									);
								},
								icon: (
									<span
										className="storeengine-icon storeengine-icon--copy"
										aria-hidden={ true }
									/>
								),
							},
							{
								type: 'button',
								label: __( 'Delete', 'storeengine' ),
								suffix: 'trash',
								onClick: () => handleDelete( price ),
								icon: (
									<span
										className="storeengine-icon storeengine-icon--trash"
										aria-hidden={ true }
									/>
								),
							},
						] }
					/>
				</div>

				{ editingPrice && editingPrice.id === price.id && (
					<div className="storeengine-product-editor-pricing__form storeengine-mt-6 storeengine-mb-6">
						{ loading ? (
							<Preloader />
						) : (
							<EditPrice
								editingPrice={ editingPrice }
								setLoading={ setLoading }
								setEditingPrice={ setEditingPrice }
								ID={ ID }
							/>
						) }
					</div>
				) }
			</div>
		);
	}
);

const SortablePriceItemContainer = sortableContainer( ( props ) => (
	<div className="storeengine-price-container">{ props.children }</div>
) );

const Pricing = ( { ID } ) => {
	const dispatch = useDispatch();
	const [ editingPrice, setEditingPrice ] = useState( null );
	const [ loading, setLoading ] = useState( false );
	const [ togglingId, setTogglingId ] = useState( null );
	const [ listLoading, setListLoading ] = useState( false );
	const [ formLoading, setFormLoading ] = useState( false );
	const [ filterItem, setFilterItem ] = useState( 'all' );
	const { values, setFieldValue } = useFormikContext();

	const allAddons = useSelector( ( state ) => state.addons );
	const addons = React.useMemo(
		() => ( {
			subscription: getAddonActiveStatus( allAddons, 'subscription' ),
			installment: getAddonActiveStatus( allAddons, 'installment-plan' ),
		} ),
		[ allAddons ]
	);

	// `_pricing_mode` is seeded on the product form (getProductInitialValues);
	// fall back to deriving it so the panel still resolves for any value shape.
	const pricingMode = values._pricing_mode ?? getInitialPricingMode( values );
	// Inline | Side panel only applies to multi-price products; a single
	// price keeps the simple inline form.
	const { mode: pricingView } = usePricingView();
	const canUsePanel =
		'simple' !== pricingMode && !! ID && ( values?.prices?.length ?? 0 ) > 0;
	const usePanel = canUsePanel && 'panel' === pricingView;

	const subscriptionTab = addons.subscription
		? [
				{
					label: __( 'Subscription', 'storeengine' ),
					value: 'subscription',
				},
		  ]
		: [];
	const installmentTab = addons.installment
		? [
				{
					label: __( 'Installment', 'storeengine' ),
					value: 'installment-plan',
				},
		  ]
		: [];

	const handleEdit = async ( price ) => {
		setLoading( true );
		setEditingPrice( price );
		await wait( 400 );
		setLoading( false );
	};

	const handleVisibilityToggle = async ( item ) => {
		setTogglingId( item.id );

		try {
			await makeRequest2( 'toggle_price_visibility', { id: item?.id } );

			setFieldValue(
				'prices',
				values.prices.map( ( price ) =>
					parseInt( price?.id ) === parseInt( item.id )
						? {
								...price,
								...{
									settings: {
										...price.settings,
										...{
											is_hidden:
												! item.settings.is_hidden,
										},
									},
								},
						  }
						: price
				)
			);
		} catch ( error ) {
			dispatch(
				showNotification( {
					message: error,
					isShow: true,
					type: 'error',
				} )
			);
		}

		setTogglingId( null );
	};

	const handleDelete = async ( item ) => {
		const product_id = values?.id;
		setListLoading( true );

		const originalPrices = values.prices;
		const updatedPrices = originalPrices.filter(
			( price ) => parseInt( price?.id ) !== parseInt( item.id )
		);
		setFieldValue( 'prices', updatedPrices );

		try {
			await dispatch( deletePrice( { id: item.id } ) ).unwrap();
			dispatch( fetchAllPrices( product_id ) );
			setTimeout( () => {
				setListLoading( false );
			}, 1000 );
		} catch ( error ) {
			// Server-side delete failed — put the removed price back.
			setFieldValue( 'prices', originalPrices );
			setListLoading( false );
		}
	};

	const onSortEnd = ( { oldIndex, newIndex } ) => {
		let sortedPrices = [ ...values.prices ];
		sortedPrices = arrayMoveImmutable( sortedPrices, oldIndex, newIndex );
		setFieldValue( 'prices', sortedPrices );
	};

	const filterTabs = [
		{
			label: __( 'All', 'storeengine' ),
			value: 'all',
		},
		{
			label: __( 'One Time', 'storeengine' ),
			value: 'onetime',
		},
		...subscriptionTab,
		...installmentTab,
	];
	const exitingPriceTypes = useMemo( () => {
		return [ ...new Set( values.prices.map( ( p ) => p.price_type ) ) ];
	}, [ values.prices ] );

	const filteredTabs = filterTabs.filter(
		( item ) =>
			item.value === 'all' || exitingPriceTypes.includes( item.value )
	);

	return (
		<Scope
			as="div"
			id="pricing"
			className="storeengine-content-section storeengine-content-section__pricing"
		>
			<Heading as="div" className="storeengine-heading__price storeengine-flex storeengine-flex-justify-between storeengine-flex-align-center">
				<span>{ __( 'Pricing', 'storeengine' ) }</span>
				{ canUsePanel && <PricingViewToggle /> }
			</Heading>
			<div className="storeengine-product-editor-pricing">
				{ pricingMode === 'simple' ? (
					<SimplePrice />
				) : ! ID ? (
					<div className="storeengine-warning storeengine-product-notice">
						<span
							className="storeengine-icon storeengine-icon--info-primary"
							aria-hidden={ true }
						/>
						<div className="storeengine-product-notice__body">
							<span className="storeengine-product-notice__title">
								{ __( 'Save the product first', 'storeengine' ) }
							</span>
							<span className="storeengine-product-notice__text">
								{ __(
									'Prices can be added once the product has been created.',
									'storeengine'
								) }
							</span>
						</div>
					</div>
				) : usePanel ? (
					<PricingSidePanel
						ID={ ID }
						handleDelete={ handleDelete }
						handleVisibilityToggle={ handleVisibilityToggle }
					/>
				) : (
					<>
						{ values.prices.length >= 1 && (
							<div className="storeengine-product-editor-pricing__lists">
								{ listLoading ? (
									<Preloader />
								) : (
									<SortablePriceItemContainer
										shouldCancelStart={ shouldCancelStart }
										helperClass={ 'sorting-price' }
										onSortEnd={ onSortEnd }
										useDragHandle
									>
										{ ( () => {
											const filteredPrices = (
												values?.prices ?? []
											).filter( ( price ) => {
												if ( filterItem === 'all' ) {
													return price;
												}
												if (
													filterItem ===
													price.price_type
												) {
													return price;
												}
											} );
											return filteredPrices.map(
												( price, index ) => (
													<SortablePriceItem
														key={ `price-${ index }` }
														ID={ ID }
														price={ price }
														index={ index }
														itemIndex={ index }
														handleEdit={
															handleEdit
														}
														handleDelete={
															handleDelete
														}
														handleVisibilityToggle={
															handleVisibilityToggle
														}
														editingPrice={
															editingPrice
														}
														setEditingPrice={
															setEditingPrice
														}
														loading={ loading }
														setLoading={
															setLoading
														}
														togglingId={
															togglingId
														}
													/>
												)
											);
										} )() }
									</SortablePriceItemContainer>
								) }
							</div>
						) }

						{ editingPrice && ! editingPrice.id && (
							<div className="storeengine-product-editor-pricing__form">
								{ formLoading ? (
									<Preloader />
								) : (
									<EditPrice
										ID={ ID }
										editingPrice={ editingPrice }
										setLoading={ setFormLoading }
										setEditingPrice={ setEditingPrice }
									/>
								) }
							</div>
						) }

						{ ! ( editingPrice && ! editingPrice.id ) && (
							<div className="storeengine-product-editor-pricing__add-btn">
								<Button
									icon="storeengine-icon--add"
									type="button"
									preset="outline"
									onClick={ () => setEditingPrice( {} ) }
								>
									{ __( 'Add Price', 'storeengine' ) }
								</Button>
							</div>
						) }
					</>
				) }
			</div>
		</Scope>
	);
};

export default Pricing;
