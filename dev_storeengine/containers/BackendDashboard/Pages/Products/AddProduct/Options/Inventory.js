import React, { useEffect } from 'react';
import { Field, useFormikContext } from 'formik';
import Checkbox from '@Components/Formik/Checkbox';
import { __, _n, sprintf } from '@wordpress/i18n';
import Counter from '@Components/Formik/Counter';
// Aliased: the default import would shadow the JS built-in Number() constructor.
// The useEffect below relies on the global Number(...) / Number.isFinite(...).
import NumberField from '@Components/Formik/Number';
import Select from '@Components/Formik/Select';
import StockAdjustment from './StockAdjustment';
import ReturnWindowField from './ReturnWindowField';
import ReorderField from './ReorderField';
import { isAddonActive } from '@Utils/helper';
import { Scope, Heading } from '@Components/ui';
import { FieldGate } from '../productFormConfig';

const stockStatusOptions = [
	{ label: __( 'In stock', 'storeengine' ), value: 'instock' },
	{ label: __( 'Out of stock', 'storeengine' ), value: 'outofstock' },
	{ label: __( 'On backorder', 'storeengine' ), value: 'onbackorder' },
];

const backorderOptions = [
	{ label: __( 'Do not allow', 'storeengine' ), value: 'no' },
	{ label: __( 'Allow, but notify customer', 'storeengine' ), value: 'notify' },
	{ label: __( 'Allow', 'storeengine' ), value: 'yes' },
];

// Unit-of-measure registry comes from PHP (Quantity::sell_by_modes()/units()),
// so a filter that adds a unit server-side shows up here without a JS change.
const quantityUnits = () => window?.StoreEngineGlobal?.quantity_units ?? {};

const sellByOptions = () =>
	Object.entries( quantityUnits().modes ?? { each: __( 'Each (whole units)', 'storeengine' ) } ).map(
		( [ value, label ] ) => ( { value, label } )
	);

const unitOptionsFor = ( mode ) =>
	Object.entries( quantityUnits().units?.[ mode ] ?? {} ).map( ( [ value, label ] ) => ( {
		value,
		label: `${ label } (${ value })`,
	} ) );

/**
 * How the product is measured at the till: counted, weighed, poured or cut.
 *
 * Everything defaults to `each`, which keeps the whole-number behaviour
 * products had before units existed — so this block is inert until a merchant
 * deliberately switches a product to a measured mode.
 */
const SoldBy = () => {
	const { values, setFieldValue } = useFormikContext();

	const mode = values?.meta?._storeengine_sell_by || 'each';
	const isMeasured = mode !== 'each';
	const unitOptions = unitOptionsFor( mode );
	const unit = values?.meta?._storeengine_unit || '';

	// Switching mode invalidates the previously picked unit (kg is not a valid
	// volume). Fall back to the first unit of the new mode.
	useEffect( () => {
		if ( ! isMeasured ) return;
		const valid = unitOptions.some( ( o ) => o.value === unit );
		if ( ! valid && unitOptions.length ) {
			setFieldValue( 'meta._storeengine_unit', unitOptions[ 0 ].value );
		}
	}, [ mode, unit, isMeasured, unitOptions, setFieldValue ] );

	return (
		<div className="border border-se-border rounded-se p-4">
			<Select
				title={ __( 'Sold by', 'storeengine' ) }
				subtitle={ __(
					'Whole units, or fractions for weighed or measured goods.',
					'storeengine'
				) }
				name="meta._storeengine_sell_by"
				options={ sellByOptions() }
				suffix="inventory-sell-by"
				marginBottom={ false }
			/>

			{ isMeasured && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
					<Select
						title={ __( 'Unit', 'storeengine' ) }
						name="meta._storeengine_unit"
						options={ unitOptions }
						suffix="inventory-unit"
						marginBottom={ false }
					/>
					<NumberField
						title={ __( 'Smallest increment', 'storeengine' ) }
						subtitle={ __(
							'Quantities snap to this. Leave empty for 0.001.',
							'storeengine'
						) }
						name="meta._storeengine_qty_step"
						placeholder="0.001"
						min={ 0 }
						step={ 0.001 }
						suffix="inventory-qty-step"
					/>
				</div>
			) }

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
				<label className="storeengine-input-box">
					<p className="storeengine-input-box__label">
						{ __( 'Purchase unit', 'storeengine' ) }
					</p>
					<Field
						name="meta._storeengine_purchase_unit"
						type="text"
						className="storeengine-input"
						placeholder={ __( 'e.g. carton, sack, case', 'storeengine' ) }
					/>
				</label>
				<NumberField
					title={ __( 'Stock units per purchase unit', 'storeengine' ) }
					desc={ __(
						'Stock added per purchase unit received (e.g. 1 carton = 200).',
						'storeengine'
					) }
					name="meta._storeengine_purchase_factor"
					placeholder="1"
					min={ 0 }
					step={ 0.001 }
					suffix="inventory-purchase-factor"
				/>
			</div>
		</div>
	);
};

const computeVariantSummary = ( variants = [] ) => {
	let trackedCount = 0;
	let total = 0;
	let inStock = 0;
	let outOfStock = 0;
	let onBackorder = 0;

	variants.forEach( ( v ) => {
		const stock = v?.stock || {};
		if ( stock.manages_stock ) {
			trackedCount += 1;
			const qty =
				stock.stock_quantity === '' ||
				stock.stock_quantity === null ||
				stock.stock_quantity === undefined
					? 0
					: parseFloat( stock.stock_quantity ) || 0;
			total += qty;
			if ( qty > 0 ) inStock += 1;
			else if (
				stock.backorders === 'yes' ||
				stock.backorders === 'notify'
			)
				onBackorder += 1;
			else outOfStock += 1;
		} else {
			const status = stock.stock_status || 'instock';
			if ( status === 'instock' ) inStock += 1;
			else if ( status === 'onbackorder' ) onBackorder += 1;
			else outOfStock += 1;
		}
	} );

	return {
		trackedCount,
		variantCount: variants.length,
		// Summing floats drifts; 3dp matches the DECIMAL(12,3) columns.
		total: Number( total.toFixed( 3 ) ),
		inStock,
		outOfStock,
		onBackorder,
	};
};

const VariableSummary = ( { values } ) => {
	const summary = computeVariantSummary( values?.variants || [] );
	const overallQty = parseFloat( values?.stock?.stock_quantity );
	const hasOverall =
		!! values?.stock?.manages_stock &&
		Number.isFinite( overallQty ) &&
		overallQty > 0;
	const difference = hasOverall ? overallQty - summary.total : 0;
	const isOver = difference < 0;
	const untracked = summary.variantCount - summary.trackedCount;
	const usedPercent = hasOverall
		? Math.min( 100, ( summary.total / overallQty ) * 100 )
		: 0;

	const statusChip = ( count, label, tone ) => (
		<span
			className={ `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
				count > 0 ? tone : 'bg-se-border text-se-subtitle opacity-60'
			}` }
		>
			{ sprintf( label, count ) }
		</span>
	);

	return (
		<div className="border border-se-border bg-se-bg rounded-se p-4 text-13">
			<p className="m-0 mb-3 text-se-text font-semibold">
				{ __( 'Variant stock summary', 'storeengine' ) }
			</p>

			<div className="grid grid-cols-2 gap-6">
				<div>
					<div className="mb-1 text-xs font-semibold uppercase tracking-wide text-se-subtitle">
						{ __( 'Units', 'storeengine' ) }
					</div>
					<div className="flex flex-wrap items-baseline gap-2">
						<span className="text-2xl font-semibold text-se-text">
							{ summary.total }
						</span>
						<span className="text-se-subtitle">
							{ hasOverall
								? sprintf(
										/* translators: %s: overall stock quantity */
										__(
											'of %s overall stock',
											'storeengine'
										),
										overallQty
								  )
								: __(
										'units tracked',
										'storeengine'
								  ) }
						</span>
					</div>
					{ hasOverall ? (
						<>
							<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-se-border">
								<div
									className={ `h-full ${
										isOver ? 'bg-se-error' : 'bg-se-success'
									}` }
									style={ { width: `${ usedPercent }%` } }
								/>
							</div>
							<p
								className={ `m-0 mt-2 text-xs ${
									isOver ? 'text-se-error' : 'text-se-subtitle'
								}` }
							>
								{ isOver
									? sprintf(
											/* translators: %s: number of units */
											_n(
												'%s unit over overall stock',
												'%s units over overall stock',
												Math.abs( difference ),
												'storeengine'
											),
											Math.abs( difference )
									  )
									: sprintf(
											/* translators: %s: number of units */
											_n(
												'%s unit unallocated',
												'%s units unallocated',
												difference,
												'storeengine'
											),
											difference
									  ) }
							</p>
						</>
					) : (
						<p className="m-0 mt-2 text-xs text-se-subtitle">
							{ __(
								'Enable overall stock below to share one total.',
								'storeengine'
							) }
						</p>
					) }
				</div>

				<div>
					<div className="mb-1 text-xs font-semibold uppercase tracking-wide text-se-subtitle">
						{ __( 'Variants', 'storeengine' ) }
					</div>
					<div className="flex flex-wrap items-baseline gap-2">
						<span className="text-2xl font-semibold text-se-text">
							{ summary.variantCount }
						</span>
						<span className="text-se-subtitle">
							{ _n(
								'variant',
								'variants',
								summary.variantCount,
								'storeengine'
							) }
						</span>
					</div>
					<div className="mt-2 flex flex-wrap gap-2">
						{ statusChip(
							summary.inStock,
							__( '%d in stock', 'storeengine' ),
							'bg-se-success-light text-se-success'
						) }
						{ statusChip(
							summary.onBackorder,
							__( '%d on backorder', 'storeengine' ),
							'bg-se-warning-light text-se-warning'
						) }
						{ statusChip(
							summary.outOfStock,
							__( '%d out of stock', 'storeengine' ),
							'bg-se-error-light text-se-error'
						) }
					</div>
					<p className="m-0 mt-2 text-xs text-se-subtitle">
						{ untracked > 0
							? sprintf(
									/* translators: 1: variants tracking their own quantity, 2: variants not tracking */
									__(
										'%1$d tracked · %2$d by status only',
										'storeengine'
									),
									summary.trackedCount,
									untracked
							  )
							: __(
									'All variants tracked.',
									'storeengine'
							  ) }
					</p>
				</div>
			</div>
		</div>
	);
};

const Inventory = () => {
	const { values, setFieldValue } = useFormikContext();
	// The server flips a product to "variable" only when it is saved, but the
	// editor already holds its variants. Treat a product with variants in the
	// form as variable right away so the variant stock summary (and the variant
	// stock controls) show before the first save too.
	const hasFormVariants =
		Array.isArray( values?.variants ) && values.variants.length > 0;
	const isVariable =
		values?.product_type === 'variable' ||
		( values?.product_type !== 'bundled' && hasFormVariants );

	const manages = !! values?.stock?.manages_stock;
	const showCost = isAddonActive( 'cost-profit' );
	// Quantity inputs step by the product's own increment, so a weighed good
	// nudges by 0.25 kg rather than jumping a whole kilo.
	const sellBy = values?.meta?._storeengine_sell_by || 'each';
	const configuredStep = Number( values?.meta?._storeengine_qty_step );
	const qtyStep =
		sellBy === 'each'
			? 1
			: Number.isFinite( configuredStep ) && configuredStep > 0
				? configuredStep
				: 0.001;
	const stockQty = Number( values?.stock?.stock_quantity );
	const stockThreshold = Number( values?.stock?.low_stock_threshold );
	const isSimpleLowStock =
		! isVariable &&
		manages &&
		Number.isFinite( stockQty ) &&
		stockQty > 0 &&
		Number.isFinite( stockThreshold ) &&
		stockThreshold > 0 &&
		stockQty <= stockThreshold;
	// Variable products keep this as the product-wide default: a variant with
	// no Cost of its own falls back to it when the sale is snapshotted.
	const costField = (
		<FieldGate id="cost_price">
			<NumberField
				title={ __( 'Cost per unit', 'storeengine' ) }
				subtitle={
					isVariable
						? __(
								"Default for all variants. A variant's own cost overrides it.",
								'storeengine'
						  )
						: __(
								'Used for profit reports.',
								'storeengine'
						  )
				}
				name="meta._storeengine_cost_price"
				placeholder="0.00"
				min={ 0 }
				step={ 0.01 }
				currency={ true }
				suffix="cost-price"
			/>
		</FieldGate>
	);

	// Digital products don't ship anything physical and don't carry stock
	// in the warehouse sense. Hide the whole inventory section entirely
	// to keep the editor focused (downloads / license logic lives in
	// the Shipping section already).
	const isDigital =
		values?.meta?._storeengine_product_shipping_type === 'digital';
	if ( isDigital ) {
		// Digital products have no warehouse stock, but they CAN have a cost
		// (licensing, third-party / API fees, payment costs) that must feed the
		// profit/margin reports — otherwise COGS is always 0 for digital sales.
		// So still surface the cost field even though the rest of inventory is hidden.
		if ( showCost ) {
			return (
				<Scope
					as="div"
					id="productInventory"
					className="storeengine-content-section"
				>
					<Heading as="p">{ __( 'Cost', 'storeengine' ) }</Heading>
					{ costField }
				</Scope>
			);
		}
		return null;
	}

	// Simple products: typing a positive qty auto-enables tracking so the
	// user doesn't have to tick the "Track stock" checkbox first.
	useEffect( () => {
		if ( isVariable || manages ) return;
		const qty = Number( values?.stock?.stock_quantity );
		if ( Number.isFinite( qty ) && qty > 0 ) {
			setFieldValue( 'stock.manages_stock', true );
		}
	}, [
		isVariable,
		manages,
		values?.stock?.stock_quantity,
		setFieldValue,
	] );

	// Batch/serial tracking only works because a sale fires the
	// stock-reduced hook Batches/Serials listen on — and that hook never
	// fires while `manages_stock` is off. Without this, a merchant can flip
	// "Track by serial number" on (which promises "a sale assigns specific
	// serials") while stock tracking stays off, and every sale silently
	// skips assigning a serial at all. Force stock tracking on with it.
	useEffect( () => {
		if ( isVariable || manages ) return;
		if (
			values?.meta?._storeengine_track_batches ||
			values?.meta?._storeengine_track_serials
		) {
			setFieldValue( 'stock.manages_stock', true );
		}
	}, [
		isVariable,
		manages,
		values?.meta?._storeengine_track_batches,
		values?.meta?._storeengine_track_serials,
		setFieldValue,
	] );

	// Options for the "Adjust variant stock" dialog: a readable name (Size /
	// Color), the current stock and the SKU — not the bare numeric id.
	const variantOptions = ( values?.variants ?? [] )
		.filter( ( v ) => !! v?.id )
		.map( ( v ) => ( {
			id: v.id,
			name:
				v?.data?.map?.( ( d ) => d.value ).join( ' / ' ) ||
				( v?.name ? String( v.name ).split( '/' ).join( ' / ' ) : '' ) ||
				sprintf(
					/* translators: %d: variant id */
					__( 'Variant #%d', 'storeengine' ),
					v.id
				),
			stock: v?.stock?.manages_stock
				? sprintf(
						/* translators: %s: units in stock */
						__( '%s in stock', 'storeengine' ),
						parseFloat( v.stock.stock_quantity ) || 0
				  )
				: '',
			sku: v?.sku || '',
		} ) );

	const handleAdjusted = ( result ) => {
		if ( ! result || ! result.ok ) return;

		if ( result.variation_id && Array.isArray( values?.variants ) ) {
			const idx = values.variants.findIndex(
				( v ) => Number( v?.id ) === Number( result.variation_id )
			);
			if ( idx >= 0 ) {
				setFieldValue( `variants.${ idx }.stock.manages_stock`, true );
				setFieldValue(
					`variants.${ idx }.stock.stock_quantity`,
					result.qty_after
				);
			}
		} else {
			setFieldValue( 'stock.manages_stock', true );
			setFieldValue( 'stock.stock_quantity', result.qty_after );
		}
	};

	return (
		<>
			<Scope
				as="div"
				id="productInventory"
				className="storeengine-content-section"
			>
				<Heading as="p">
					{ /* "Stock" (per-product) — distinct from the store-wide
					   "Inventory" addon/dashboard. */ }
					{ __( 'Stock', 'storeengine' ) }
				</Heading>

				{ /* One 24px rhythm between every block in the card. */ }
				<div className="flex flex-col gap-6">

				{ ! isVariable && (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<FieldGate id="sku">
<label className='storeengine-input-box'>
							<p className='storeengine-input-box__label'>{ __( 'SKU', 'storeengine' ) }</p>
							<Field
								name="sku"
								type="text"
								className="storeengine-input mt-1"
								placeholder={ __( 'e.g. SHIRT-RED-M', 'storeengine' ) }
							/>
						</label>
</FieldGate>
						<FieldGate id="barcode">
<label className='storeengine-input-box'>
							<p className='storeengine-input-box__label'>{ __( 'Barcode', 'storeengine' ) }</p>
							<Field
								name="barcode"
								type="text"
								className="storeengine-input mt-1"
								placeholder={ __( 'e.g. 0123456789012', 'storeengine' ) }
							/>
						</label>
</FieldGate>
					</div>
				) }

				<SoldBy />

				{ isVariable && <VariableSummary values={ values } /> }

				<div className="flex flex-col gap-6">
					<FieldGate id="manage_stock">
<Checkbox
						title={
							isVariable
								? __(
										'Manage overall stock (shared by variants)',
										'storeengine'
								)
								: __(
										'Track stock quantity',
										'storeengine'
								)
						}
						suffix="track-stock-quantity"
						name="stock.manages_stock"
					/>
</FieldGate>

					{ /* Simple products: qty + threshold always editable. Entering
						a qty auto-enables tracking via the effect above. */ }
					{ ! isVariable && (
						<div className="flex flex-col gap-6">
							<div className="flex flex-col gap-6">
								<div className="flex w-full gap-4">
									<FieldGate id="stock_quantity">
<Counter
										title={ __( 'Stock quantity', 'storeengine' ) }
										placeholder="0"
										name="stock.stock_quantity"
										step={ qtyStep }
										readOnly={ false }
										suffix="inventory w-full"
									/>
</FieldGate>
									<Counter
										title={ __( 'Low stock threshold', 'storeengine' ) }
										placeholder={ __( 'e.g. 2', 'storeengine' ) }
										name="stock.low_stock_threshold"
										step={ qtyStep }
										readOnly={ false }
										suffix="inventory w-full"
									/>
								</div>
								{ isSimpleLowStock && (
									<div className="flex items-center gap-2 px-3 py-2 rounded-se bg-se-warning-light border border-se-warning text-se-warning text-sm">
										<span className="storeengine-icon storeengine-icon--warning" aria-hidden="true" />
										{ __( 'Stock is running low.', 'storeengine' ) }
									</div>
								) }
								<div>
									{ manages ? (
										<Select
											title={ __( 'Allow backorders', 'storeengine' ) }
											name="stock.backorders"
											options={ backorderOptions }
											suffix="inventory-backorders"
											marginBottom={false}
											/>
										) : (
										<Select
											title={ __( 'Stock status', 'storeengine' ) }
											name="stock.stock_status"
											options={ stockStatusOptions }
											suffix="inventory-stock-status"
											marginBottom={false}
										/>
									) }
								</div>
							</div>
						</div>
					) }

					{ /* Variable products keep the parent-level fallback gate. */ }
					{ isVariable && manages && (
						<>
							<Counter
								title={ __( 'Overall stock quantity', 'storeengine' ) }
								placeholder="0"
								name="stock.stock_quantity"
								step={ qtyStep }
								readOnly={ false }
								suffix="inventory"
							/>
							<Counter
								title={ __( 'Low stock threshold', 'storeengine' ) }
								placeholder={ __( 'e.g. 2', 'storeengine' ) }
								name="stock.low_stock_threshold"
								step={ qtyStep }
								readOnly={ false }
								suffix="inventory"
							/>
							<Select
								title={ __( 'Allow backorders', 'storeengine' ) }
								name="stock.backorders"
								options={ backorderOptions }
								suffix="inventory-backorders"
								marginBottom={false}
							/>
						</>
					) }

					{ isVariable && ! manages && (
						<Select
							title={ __( 'Stock status', 'storeengine' ) }
							name="stock.stock_status"
							options={ stockStatusOptions }
							suffix="inventory-stock-status"
							marginBottom={false}
						/>
					) }

					{ showCost && costField }

					<FieldGate id="sold_individually">
<Checkbox
						title={ __(
							'Limit to one per cart',
							'storeengine'
						) }
						suffix="plain"
						name="stock.sold_individually"
					/>
</FieldGate>

					{ /* Batch tracking is opt-in per product: a super shop sells
					     dated medicine and undated buckets side by side, and
					     only the former should carry lots. */ }
					{ isAddonActive( 'inventory-pro' ) && (
						<>
							<Checkbox
								title={ __(
									'Track this product in batches (lot number + expiry date)',
									'storeengine'
								) }
								suffix="plain mt-2"
								name="meta._storeengine_track_batches"
							/>
							{ values?.meta?._storeengine_track_batches && (
								<p className="mt-1 mb-0 text-xs text-se-subtitle">
									{ __(
										'Stock is held as dated lots. Sales draw from the soonest-expiring lot first, and expired lots are never sold. Receive stock under Inventory → Batches.',
										'storeengine'
									) }
								</p>
							) }

							<Checkbox
								title={ __(
									'Track this product by serial number (one row per unit)',
									'storeengine'
								) }
								suffix="plain mt-2"
								name="meta._storeengine_track_serials"
							/>
							{ values?.meta?._storeengine_track_serials && (
								<>
									<p className="mt-1 mb-0 text-xs text-se-subtitle">
										{ __(
											'Stock is held as individually serialised units. A sale assigns specific serials, and each one carries its own warranty and RMA history. Receive stock under Inventory → Serials.',
											'storeengine'
										) }
									</p>
									<NumberField
										title={ __(
											'Warranty (months)',
											'storeengine'
										) }
										subtitle={ __(
											'Applied to a unit\'s warranty window from the day it sells. Leave empty for no warranty.',
											'storeengine'
										) }
										name="meta._storeengine_warranty_months"
										placeholder="0"
										min={ 0 }
										step={ 1 }
										suffix="warranty-months"
									/>
								</>
							) }
						</>
					) }
				</div>
				</div>
			</Scope>

			<Scope
				as="div"
				id="productInventory"
				className="storeengine-content-section"
			>
				{ values?.id ? (
					<div className="flex flex-col gap-6">
						<StockAdjustment
							productId={ values.id }
							variationId={ 0 }
							variants={ isVariable ? variantOptions : undefined }
							onAdjusted={ handleAdjusted }
						/>
						<ReturnWindowField productId={ values.id } />
						<ReorderField productId={ values.id } />
					</div>
				) : (
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
									'Stock adjustments and history are available once the product has been created.',
									'storeengine'
								) }
							</span>
						</div>
					</div>
				) }
			</Scope>
		</>
	);
};

export default Inventory;
