import React, { useEffect, useRef, useState } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Select } from '@Components/ui/Select';
import { useFormikContext } from 'formik';
import {
	copyToClipboard,
	isAddonActive,
} from '@Utils/helper';
import { useDispatch } from 'react-redux';
import { createPortal } from 'react-dom';
import { Select as KitSelect, Scope, Switch } from '@Components/ui';
import Modal from '@Components/Modal';
import Button from '@Components/Button';
import useVariantsView, {
	setAttributesEditorOpen,
	useAttributesEditor,
} from './useVariantsView';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import Currency from '@Components/Currency';
import { StockAdjustmentMenu } from '../StockAdjustment';
import VariantThumb from './VariantThumb';

// A focused <input type="number"> changes value when the page is scrolled over
// it; drop focus on wheel so scrolling the editor never edits a quantity.
const blurOnWheel = ( e ) => e.currentTarget.blur();

const DynamicVariant = ( { generatedVariants, setGeneratedVariants } ) => {
	const { values, setFieldValue, submitForm, isSubmitting, dirty } =
		useFormikContext();
	const dispatch = useDispatch();
	const showCost = isAddonActive( 'cost-profit' );

	useEffect( () => {
		const updatedValue =
			generatedVariants?.length > 0
				? generatedVariants.map( ( item ) => ( {
						// Display-only (e.g. the stock adjustment dialog); the server ignores it.
						name: item?.name,
						taxonomies: item?.taxonomies,
						pricing_id: item?.pricing_id
							? parseInt( item.pricing_id )
							: 0,
						price:
							item?.price !== '' ? parseFloat( item?.price ) : '',
						sku: item?.sku || '',
						barcode: item?.barcode || '',
						cost_price:
							item?.cost_price === '' ||
							item?.cost_price === null ||
							item?.cost_price === undefined
								? null
								: parseFloat( item.cost_price ),
						featured_image_id: item?.featured_image_id
							? parseInt( item?.featured_image_id )
							: 0,
						stock: {
							manages_stock: !! item?.stock?.manages_stock,
							stock_quantity:
								item?.stock?.stock_quantity === '' ||
								item?.stock?.stock_quantity === null ||
								item?.stock?.stock_quantity === undefined
									? null
									: parseInt(
											item.stock.stock_quantity,
											10
									  ),
							backorders: item?.stock?.backorders ?? 'no',
							low_stock_threshold:
								item?.stock?.low_stock_threshold === '' ||
								item?.stock?.low_stock_threshold === null ||
								item?.stock?.low_stock_threshold === undefined
									? null
									: parseInt(
											item.stock.low_stock_threshold,
											10
									  ),
							stock_status:
								item?.stock?.stock_status ?? 'instock',
						},
						...( item?.id && { id: item?.id } ),
				  } ) )
				: [];
		setFieldValue( 'variants', updatedValue );
	}, [ generatedVariants ] );

	const handleInputChange = ( index, field, value ) => {
		const updatedVariants = [ ...generatedVariants ];
		updatedVariants[ index ][ field ] = value;
		setGeneratedVariants( updatedVariants );
	};

	const handleStockChange = ( index, field, value ) => {
		const updatedVariants = [ ...generatedVariants ];
		updatedVariants[ index ] = {
			...updatedVariants[ index ],
			stock: {
				...( updatedVariants[ index ]?.stock || {} ),
				[ field ]: value,
			},
		};
		setGeneratedVariants( updatedVariants );
	};

	// The product-level "Stock quantity" (Inventory tab) is the overall stock
	// when "Manage stock at the product level" is on. Variant quantities split
	// that pool, so an edit may not push the tracked variants past it. A quantity
	// of 0 is ignored: the parent flag is derived as "on" whenever a variant
	// tracks stock, so 0 usually means "never set", not "nothing available".
	const [ stockNotice, setStockNotice ] = useState( '' );
	// Product-wide cost: empty variant Cost inputs fall back to it at sale time.
	const parentCost = Number( values?.meta?._storeengine_cost_price ) || 0;
	const parentQty = parseInt( values?.stock?.stock_quantity, 10 );
	const overallStock =
		values?.stock?.manages_stock && Number.isFinite( parentQty ) && parentQty > 0
			? parentQty
			: null;

	const handleQuantityChange = ( index, raw ) => {
		if ( overallStock === null || raw === '' ) {
			setStockNotice( '' );
			handleStockChange( index, 'stock_quantity', raw );
			return;
		}
		const requested = Math.max( 0, parseInt( raw, 10 ) || 0 );
		const others = ( generatedVariants || [] ).reduce(
			( sum, variant, variantIndex ) =>
				variantIndex !== index && variant?.stock?.manages_stock
					? sum + ( parseInt( variant.stock.stock_quantity, 10 ) || 0 )
					: sum,
			0
		);
		const allowed = Math.max( 0, overallStock - others );
		const current =
			parseInt( generatedVariants[ index ]?.stock?.stock_quantity, 10 ) ||
			0;
		// Already over the overall stock (legacy data)? Refuse increases but
		// never push the value below where it already is.
		const limit = Math.max( allowed, Math.min( current, requested ) );
		if ( requested > limit ) {
			setStockNotice(
				sprintf(
					/* translators: 1: overall stock quantity, 2: units still available to allocate */
					__(
						'Overall stock is %1$d — only %2$d left to allocate. Raise the product Stock quantity (Inventory tab) or reduce another variant.',
						'storeengine'
					),
					overallStock,
					allowed
				)
			);
			handleStockChange( index, 'stock_quantity', limit );
			return;
		}
		setStockNotice( '' );
		handleStockChange( index, 'stock_quantity', raw );
	};

	// eslint-disable-next-line no-unused-vars
	const handleCopy = ( id ) => {
		copyToClipboard( id );
		dispatch(
			showNotification( {
				message: sprintf(
					// translators: %s: Variant ID
					__( 'Variant ID "%s" copied to clipboard', 'storeengine' ),
					id
				),
				isShow: true,
				type: 'success',
			} )
		);
	};

	// New variants start with no price selected. Pick the first (default) price
	// automatically; saved variants and any price the user chose are left alone.
	const defaultPriceId = values?.prices?.[ 0 ]?.id;
	useEffect( () => {
		if ( ! defaultPriceId || ! generatedVariants?.length ) {
			return;
		}
		const priceIds = new Set( ( values?.prices || [] ).map( ( p ) => p.id ) );
		const needsDefault = ( variant ) =>
			! variant?.id && ! priceIds.has( variant?.pricing_id );
		if ( ! generatedVariants.some( needsDefault ) ) {
			return;
		}
		setGeneratedVariants(
			generatedVariants.map( ( variant ) =>
				needsDefault( variant )
					? { ...variant, pricing_id: defaultPriceId }
					: variant
			)
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ generatedVariants, defaultPriceId ] );

	const priceOptions =
		values?.prices?.length > 0
			? values.prices.map( ( item ) => ( {
					label: (
						<>
							{ item.price_name } ●{ ' ' }
							<Currency value={ item.price } />
						</>
					),
					value: item.id,
					id: item.id,
			  } ) )
			: [];


	// Which variant the side panel is editing. Tracked by id (or, for a variant
	// that isn't saved yet, its term ids) — never by array index, because
	// changing attributes can reorder or rebuild the list while the panel is open.
	const variantKey = ( variant ) =>
		variant?.id
			? `id-${ variant.id }`
			: `new-${ JSON.stringify( variant?.taxonomies || {} ) }`;
	const { mode: viewMode } = useVariantsView();
	const { open: attributeEditorOpen } = useAttributesEditor();
	const [ panelKey, setPanelKey ] = useState( null );
	const panelIndex = panelKey
		? ( generatedVariants || [] ).findIndex(
				( variant ) => variantKey( variant ) === panelKey
		  )
		: -1;
	const isPanelOpen = 'panel' === viewMode && panelIndex > -1;

	useEffect( () => {
		if ( 'panel' !== viewMode ) {
			setPanelKey( null );
		}
	}, [ viewMode ] );

	// Cancel discards what was changed in the drawer: the variants are
	// snapshotted when it opens (deep copy — handleInputChange mutates the
	// variant objects in place) and again after each successful save, and
	// Cancel restores that snapshot before closing.
	const panelSnapshot = useRef( null );
	const wasOpen = useRef( false );
	useEffect( () => {
		if ( isPanelOpen && ! wasOpen.current ) {
			panelSnapshot.current = JSON.parse(
				JSON.stringify( generatedVariants || [] )
			);
		}
		wasOpen.current = isPanelOpen;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isPanelOpen ] );
	const wasSubmitting = useRef( false );
	useEffect( () => {
		if ( wasSubmitting.current && ! isSubmitting && isPanelOpen ) {
			panelSnapshot.current = JSON.parse(
				JSON.stringify( generatedVariants || [] )
			);
		}
		wasSubmitting.current = isSubmitting;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isSubmitting ] );
	// Variants come from attribute values, so adding or changing them happens
	// in the attribute modal. It opens on top of the drawer, which stays open
	// (and keeps its edits) underneath.
	const openAttributeEditor = () => setAttributesEditorOpen( true );

	const cancelPanel = () => {
		if ( panelSnapshot.current ) {
			setGeneratedVariants( panelSnapshot.current );
		}
		panelSnapshot.current = null;
		setPanelKey( null );
	};

	const variantTotal = ( variant ) => {
		const selectedPrice = parseFloat(
			values?.prices?.find( ( price ) => price.id === variant?.pricing_id )
				?.price
		);
		const extra = parseFloat( variant?.price );
		return (
			( Number.isNaN( selectedPrice ) ? 0 : selectedPrice ) +
			( Number.isNaN( extra ) ? 0 : extra )
		);
	};

	const stockSummary = ( variant ) => {
		if ( variant?.stock?.manages_stock ) {
			return sprintf(
				/* translators: %s: units in stock */
				__( '%s in stock', 'storeengine' ),
				parseInt( variant.stock.stock_quantity, 10 ) || 0
			);
		}
		const labels = {
			instock: __( 'In stock', 'storeengine' ),
			outofstock: __( 'Out of stock', 'storeengine' ),
			onbackorder: __( 'On backorder', 'storeengine' ),
		};
		return labels[ variant?.stock?.stock_status ] || labels.instock;
	};

	const stockStatusOptions = [
		{ value: 'instock', label: __( 'In stock', 'storeengine' ) },
		{ value: 'outofstock', label: __( 'Out of stock', 'storeengine' ) },
		{ value: 'onbackorder', label: __( 'On backorder', 'storeengine' ) },
	];
	const backorderOptions = [
		{ value: 'no', label: __( 'No backorder', 'storeengine' ) },
		{ value: 'notify', label: __( 'Backorder + notify', 'storeengine' ) },
		{ value: 'yes', label: __( 'Allow backorder', 'storeengine' ) },
	];

	// Key facts for a Side panel summary row: total price, stock, and the
	// identifiers / cost when set, so most checks don't need the drawer.
	const summaryFacts = ( variant ) => {
		const facts = [
			{
				key: 'price',
				value: <Currency value={ variantTotal( variant ) } />,
			},
			{
				key: 'stock',
				value: stockSummary( variant ),
				tone:
					'outofstock' === variant?.stock?.stock_status ||
					( variant?.stock?.manages_stock &&
						! ( parseInt( variant?.stock?.stock_quantity, 10 ) > 0 ) )
						? 'warn'
						: '',
			},
		];
		if ( variant?.sku ) {
			facts.push( {
				key: 'sku',
				label: __( 'SKU', 'storeengine' ),
				value: variant.sku,
			} );
		}
		if ( variant?.barcode ) {
			facts.push( {
				key: 'barcode',
				label: __( 'Barcode', 'storeengine' ),
				value: variant.barcode,
			} );
		}
		const cost =
			variant?.cost_price === '' ||
			variant?.cost_price === null ||
			variant?.cost_price === undefined
				? parentCost
				: parseFloat( variant.cost_price );
		if ( showCost && cost > 0 ) {
			facts.push( {
				key: 'cost',
				label: __( 'Cost', 'storeengine' ),
				value: <Currency value={ cost } />,
			} );
		}
		return facts;
	};

	// One variant's fields. Shared by the inline table row and the side panel so
	// both edit exactly the same data through the same handlers. The inline row
	// is a CSS grid whose columns match the header (see `--se-variant-cols` in
	// styles.scss); the inventory strip underneath lines up with the Price column.
	const renderVariant = ( variant, index, variantsArr, inPanel = false ) => {
		const featuredImageId = variant?.featured_image_id ?? 0;
		const menuPlacement = inPanel
			? 'auto'
			: variantsArr.length < 3
			? index === variantsArr.length - 1
				? 'top'
				: 'bottom'
			: index === variantsArr.length - 1 ||
			  index === variantsArr.length - 2
			? 'top'
			: 'bottom';

		return (
			<div
				key={ variantKey( variant ) }
				className={ `storeengine-variants__variant${
					inPanel ? ' storeengine-variants__variant--panel' : ''
				}` }
			>
				<div className="storeengine-variants__variant-main">
					<div className="storeengine-variants__name storeengine-variants__col--variant">
						<span className="storeengine-variants__variant__name-text">
							{ variant?.name }
						</span>
						<VariantThumb imageId={ featuredImageId } />
					</div>

					<div className="storeengine-variants__cell storeengine-variants__col--base-price">
						<span className="storeengine-variants__field-label">
								{ __( 'Base price', 'storeengine' ) }
							</span>
						<Select
							className={ `storeengine-select variant-select ${
								index === variantsArr.length - 1 ||
								index === variantsArr.length - 2
									? 'menu-top'
									: ''
							}` }
							classNamePrefix="storeengine-react-select"
							options={ priceOptions }
							value={ priceOptions.find(
								( option ) => option.id === variant.pricing_id
							) }
							placeholder={ __( 'Select price', 'storeengine' ) }
							onChange={ ( option ) =>
								handleInputChange( index, 'pricing_id', option?.id )
							}
							menuPlacement={ menuPlacement }
						/>
						<span className="storeengine-variants__field-label">
								{ __( 'Extended price', 'storeengine' ) }
							</span>
						<input
							type="text"
							className="storeengine-input storeengine-variants__variant__input storeengine-variants__variant__input--extended"
							placeholder={ __( 'Extended price', 'storeengine' ) }
							aria-label={ __( 'Extended price', 'storeengine' ) }
							value={ variant?.price ?? '' }
							onChange={ ( e ) =>
								handleInputChange( index, 'price', e.target.value )
							}
						/>
					</div>

					<div className="storeengine-variants__cell storeengine-variants__variant__total storeengine-variants__col--total">
						<span className="storeengine-variants__field-label">
								{ __( 'Total', 'storeengine' ) }
							</span>
						<Currency value={ variantTotal( variant ) } />
					</div>

					<div className="storeengine-variants__cell storeengine-variants__col--sku">
						<span className="storeengine-variants__field-label">
								{ __( 'SKU', 'storeengine' ) }
							</span>
						<input
							type="text"
							className="storeengine-input"
							placeholder={ __( 'SKU', 'storeengine' ) }
							aria-label={ __( 'SKU', 'storeengine' ) }
							value={ variant?.sku || '' }
							onChange={ ( e ) =>
								handleInputChange( index, 'sku', e.target.value )
							}
						/>
					</div>

					<div className="storeengine-variants__cell storeengine-variants__col--barcode">
							<span className="storeengine-variants__field-label">
									{ __( 'Barcode', 'storeengine' ) }
								</span>
							<input
								type="text"
								className="storeengine-input"
								placeholder={ __( 'Barcode', 'storeengine' ) }
								aria-label={ __( 'Barcode', 'storeengine' ) }
								value={ variant?.barcode || '' }
								onChange={ ( e ) =>
									handleInputChange(
										index,
										'barcode',
										e.target.value
									)
								}
							/>
						</div>
				</div>

				<div className="storeengine-variants__variant-meta">
					<div className="storeengine-variants__inventory">
						{ showCost && (
							<label className="storeengine-variants__inv-field storeengine-variants__inv-field--cost">
								<span className="storeengine-variants__inv-label">
									{ __( 'Cost', 'storeengine' ) }
								</span>
								<input
									type="number"
									onWheel={ blurOnWheel }
									step="0.01"
									min="0"
									className="storeengine-input"
									placeholder={
										parentCost > 0
											? String( parentCost )
											: '0.00'
									}
									title={ __(
										'Leave empty to use the product’s Cost per unit.',
										'storeengine'
									) }
									value={
										variant?.cost_price === null ||
										variant?.cost_price === undefined
											? ''
											: variant.cost_price
									}
									onChange={ ( e ) =>
										handleInputChange(
											index,
											'cost_price',
											e.target.value
										)
									}
								/>
							</label>
						) }

						<div className="storeengine-variants__inv-field storeengine-variants__inv-field--track">
							<span className="storeengine-variants__inv-label">
								{ __( 'Track stock', 'storeengine' ) }
							</span>
							<span className="storeengine-variants__inv-switch">
								<Switch
									checked={ !! variant?.stock?.manages_stock }
									onChange={ ( next ) =>
										handleStockChange(
											index,
											'manages_stock',
											next
										)
									}
									aria-label={ __(
										'Track stock',
										'storeengine'
									) }
								/>
							</span>
						</div>

						{ variant?.stock?.manages_stock ? (
							<>
								<label className="storeengine-variants__inv-field storeengine-variants__inv-field--qty">
									<span className="storeengine-variants__inv-label">
										{ __( 'Quantity', 'storeengine' ) }
									</span>
									<input
										type="number"
										onWheel={ blurOnWheel }
										min="0"
										step="1"
										placeholder="0"
										className="storeengine-input"
										value={
											variant?.stock?.stock_quantity ?? ''
										}
										onChange={ ( e ) =>
											handleQuantityChange(
												index,
												e.target.value
											)
										}
									/>
								</label>
								<label className="storeengine-variants__inv-field storeengine-variants__inv-field--qty">
									<span className="storeengine-variants__inv-label">
										{ __( 'Low stock at', 'storeengine' ) }
									</span>
									<input
										type="number"
										onWheel={ blurOnWheel }
										min="0"
										step="1"
										placeholder="—"
										title={ __(
											'Low stock threshold',
											'storeengine'
										) }
										className="storeengine-input"
										value={
											variant?.stock
												?.low_stock_threshold ?? ''
										}
										onChange={ ( e ) =>
											handleStockChange(
												index,
												'low_stock_threshold',
												e.target.value
											)
										}
									/>
								</label>
								<div className="storeengine-variants__inv-field storeengine-variants__inv-field--select">
									<span className="storeengine-variants__inv-label">
										{ __( 'Backorders', 'storeengine' ) }
									</span>
									<KitSelect
										value={
											variant?.stock?.backorders ?? 'no'
										}
										onChange={ ( val ) =>
											handleStockChange(
												index,
												'backorders',
												val
											)
										}
										options={ backorderOptions }
									/>
								</div>
							</>
						) : (
							<div className="storeengine-variants__inv-field storeengine-variants__inv-field--select">
								<span className="storeengine-variants__inv-label">
									{ __( 'Stock status', 'storeengine' ) }
								</span>
								<KitSelect
									value={
										variant?.stock?.stock_status ?? 'instock'
									}
									onChange={ ( val ) =>
										handleStockChange(
											index,
											'stock_status',
											val
										)
									}
									options={ stockStatusOptions }
								/>
							</div>
						) }

						{ variant?.id ? (
							<div className="storeengine-variants__inv-menu">
								<StockAdjustmentMenu
									productId={ values?.id }
									variationId={ variant.id }
									onAdjusted={ ( result ) => {
										if ( ! result || ! result.ok ) {
											return;
										}
										handleStockChange(
											index,
											'manages_stock',
											true
										);
										handleStockChange(
											index,
											'stock_quantity',
											result.qty_after
										);
										setFieldValue(
											`variants.${ index }.stock.manages_stock`,
											true
										);
										setFieldValue(
											`variants.${ index }.stock.stock_quantity`,
											result.qty_after
										);
									} }
								/>
							</div>
						) : null }
					</div>
				</div>
			</div>
		);
	};

	return (
		<>
			{ stockNotice && (
				<p className="m-0 pb-4 text-red-600" role="alert">
					{ stockNotice }
				</p>
			) }
			{ 'inline' === viewMode &&
				generatedVariants?.length > 0 &&
				generatedVariants.map( ( variant, index, variantsArr ) =>
					renderVariant( variant, index, variantsArr )
				) }
			{ 'panel' === viewMode && generatedVariants?.length > 0 && (
				<div className="storeengine-variants__summary-list">
					{ generatedVariants.map( ( variant ) => (
						<div
							key={ variantKey( variant ) }
							className="storeengine-variants__summary"
						>
							<VariantThumb imageId={ variant?.featured_image_id } />
							<div className="storeengine-variants__summary-main">
								<span className="storeengine-variants__summary-name">
									{ variant?.name }
									{ ! variant?.id && (
										<span className="storeengine-variants__badge">
											{ __( 'New', 'storeengine' ) }
										</span>
									) }
								</span>
								<span className="storeengine-variants__summary-meta">
									{ summaryFacts( variant ).map( ( fact ) => (
										<span
											key={ fact.key }
											className={ `storeengine-variants__fact${
												fact.tone
													? ` storeengine-variants__fact--${ fact.tone }`
													: ''
											}` }
										>
											{ fact.label && (
												<span className="storeengine-variants__fact-label">
													{ fact.label }
												</span>
											) }
											{ fact.value }
										</span>
									) ) }
								</span>
							</div>
							<Button
								type="button"
								preset="white"
								border="gray"
								label={ __( 'Edit', 'storeengine' ) }
								onClick={ () => setPanelKey( variantKey( variant ) ) }
								suffix="edit-variant"
							/>
						</div>
					) ) }
				</div>
			) }
			{ /* Portaled to <body> so no scrolling/stacking ancestor of the variants
			     list can clip or cover the drawer; <Scope> re-enables the admin
			     Tailwind utilities the fields rely on. The drawer is two panes: a
			     variant list to jump between variants, and the edit form. */ }
			{ isPanelOpen &&
				createPortal(
				<Scope>
					<Modal
						open={ isPanelOpen }
						placement="right"
						trapFocus
						size="lg"
						className="storeengine-variants-drawer"
						// While the attribute modal is stacked on top, Esc
						// belongs to it; don't close the drawer underneath.
						dismissOnEscape={ ! attributeEditorOpen }
						title={ __( 'Edit variants', 'storeengine' ) }
						onClose={ cancelPanel }
						bodyClassName="storeengine-variants__panel-body"
						closeAriaLabel={ __( 'Close', 'storeengine' ) }
					>
						{ isPanelOpen && (
							<div className="storeengine-variants__drawer">
								<aside className="storeengine-variants__drawer-list">
									<div className="storeengine-variants__drawer-list-head">
										<span className="storeengine-variants__drawer-product">
											{ ( 'string' === typeof values?.title
												? values.title
												: values?.title?.raw ) ||
												__( 'Product', 'storeengine' ) }
										</span>
										<span className="storeengine-variants__drawer-count">
											{ sprintf(
												/* translators: %d: number of variants */
												_n(
													'%d variant',
													'%d variants',
													generatedVariants.length,
													'storeengine'
												),
												generatedVariants.length
											) }
										</span>
									</div>
									<nav
										className="storeengine-variants__drawer-items"
										aria-label={ __( 'Variants', 'storeengine' ) }
									>
										{ generatedVariants.map( ( variant, i ) => (
											<button
												key={ variantKey( variant ) }
												type="button"
												className={ `storeengine-variants__drawer-item${
													i === panelIndex ? ' is-active' : ''
												}` }
												aria-current={
													i === panelIndex ? 'true' : undefined
												}
												onClick={ () =>
													setPanelKey( variantKey( variant ) )
												}
											>
												<VariantThumb
													imageId={ variant?.featured_image_id }
												/>
												<span className="storeengine-variants__drawer-item-text">
													<span className="storeengine-variants__drawer-item-name">
														{ variant?.name }
													</span>
													<span className="storeengine-variants__drawer-item-meta">
														<Currency value={ variantTotal( variant ) } />
														{ ' · ' }
														{ stockSummary( variant ) }
													</span>
												</span>
											</button>
										) ) }
									</nav>
									<button
										type="button"
										className="storeengine-variants__drawer-add"
										onClick={ openAttributeEditor }
									>
										<span
											className="storeengine-icon storeengine-icon--add"
											aria-hidden={ true }
										/>
										{ __( 'Add / edit variants', 'storeengine' ) }
									</button>
								</aside>
								<section className="storeengine-variants__drawer-form">
									<h3 className="storeengine-variants__drawer-title">
										{ generatedVariants?.[ panelIndex ]?.name }
									</h3>
									{ renderVariant(
										generatedVariants[ panelIndex ],
										panelIndex,
										generatedVariants,
										true
									) }
									{ /* Saves the whole product (same as the page's
									     Update button) without leaving the drawer. */ }
									<div className="storeengine-variants__panel-footer">
										<Button
											type="button"
											preset="blue"
											label={
												values?.id
													? __( 'Update product', 'storeengine' )
													: __( 'Create product', 'storeengine' )
											}
											onClick={ () => submitForm() }
											isLoading={ isSubmitting }
											isDisabled={ ! dirty }
											suffix="variant-panel-update"
										/>
										<Button
											type="button"
											preset="white"
											border="gray"
											label={ __( 'Cancel', 'storeengine' ) }
											onClick={ cancelPanel }
											suffix="variant-panel-cancel"
										/>
									</div>
								</section>
							</div>
						) }
					</Modal>
				</Scope>,
				document.body
			) }
		</>
	);
};

export default DynamicVariant;
