import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { Select } from '@Components/ui/Select';
import {
	adjustStock,
	fetchInventoryStock,
	lookupItem,
} from '@Redux/Slices/posSlice/posSlice';

/**
 * Minimal POS inventory page (page === 'inventory').
 *
 * Two jobs: surface low-stock items, and let a manager adjust stock for any
 * product (add / remove / set, with a reason). Reuses the inventory addon's
 * /inventory/stock + /inventory/adjust endpoints.
 */
const normalize = ( r ) => ( {
	product_id: r.product_id,
	variation_id: r.variation_id || 0,
	name: r.product_title || r.name || `#${ r.product_id }`,
	sku: r.sku || '',
	qty:
		r.stock && typeof r.stock === 'object'
			? r.stock.stock_quantity
			: r.stock_quantity,
	low_threshold: r.low_stock_threshold ?? null,
	isFractional: Boolean( r.is_fractional ),
	unit: r.unit || '',
	qtyStep: Number( r.qty_step ) || 1,
} );

const ACTION_OPTIONS = [
	{ value: 'add',    label: __( 'Add', 'storeengine' ) },
	{ value: 'remove', label: __( 'Remove', 'storeengine' ) },
	{ value: 'set',    label: __( 'Set', 'storeengine' ) },
];

const AdjustRow = ( { item, onAdjusted } ) => {
	const dispatch = useDispatch();
	const [ action, setAction ] = useState( ACTION_OPTIONS[ 0 ] );
	const [ qty, setQty ] = useState( '' );
	const [ reason, setReason ] = useState( '' );
	const [ busy, setBusy ] = useState( false );
	const [ done, setDone ] = useState( '' );

	const apply = async () => {
		if ( qty === '' || busy ) return;
		setBusy( true );
		setDone( '' );
		try {
			const res = await dispatch(
				adjustStock( {
					product_id: item.product_id,
					variation_id: item.variation_id,
					action: action.value,
					qty: Number( qty ) || 0,
					reason: reason.trim() || 'manual',
				} )
			).unwrap();
			setQty( '' );
			setReason( '' );
			setDone(
				__( 'Stock now ', 'storeengine' ) + ( res?.qty_after ?? '' )
			);
			onAdjusted( item, res?.qty_after );
		} catch {
			/* notifyError already toasted */
		} finally {
			setBusy( false );
		}
	};

	const low =
		item.low_threshold != null &&
		Number( item.qty ) > 0 &&
		Number( item.qty ) <= Number( item.low_threshold );

	const fieldCls =
		'rounded-md border border-solid border-se-border px-2 py-1.5 text-sm outline-none focus:border-se-primary';

	return (
		<div className="flex items-center gap-3 py-3 border-0 border-b border-solid border-se-border">
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-se-text m-0 truncate">
					{ item.name }
					{ item.sku ? (
						<span className="text-xs text-se-subtitle"> · { item.sku }</span>
					) : null }
				</p>
				<p className="text-xs m-0 mt-0.5">
					<span className={ low ? 'text-se-danger font-medium' : 'text-se-subtitle' }>
						{ __( 'In stock: ', 'storeengine' ) }
						{ item.qty ?? '—' }
						{ item.unit ? ` ${ item.unit }` : '' }
						{ low ? __( ' · low', 'storeengine' ) : '' }
					</span>
					{ done ? (
						<span className="text-se-success"> · { done }</span>
					) : null }
				</p>
			</div>
			<Select
				options={ ACTION_OPTIONS }
				value={ action }
				onChange={ setAction }
				isSearchable={ false }
				menuPosition="fixed"
				className="storeengine-select"
				classNamePrefix="storeengine-react-select"
			/>
			<input
				className={ `${ fieldCls } storeengine-input w-20` }
				value={ qty }
				onChange={ ( e ) => setQty( e.target.value ) }
				type="number"
				min="0"
				step={ item.isFractional ? item.qtyStep : 1 }
				placeholder={ item.isFractional ? __( 'qty', 'storeengine' ) + ( item.unit ? ` (${ item.unit })` : '' ) : __( 'qty', 'storeengine' ) }
			/>
			<input
				className={ `${ fieldCls } storeengine-input w-32` }
				value={ reason }
				onChange={ ( e ) => setReason( e.target.value ) }
				placeholder={ __( 'reason', 'storeengine' ) }
			/>
			<button
				type="button"
				onClick={ apply }
				disabled={ qty === '' || busy }
				className="px-4 py-2 rounded-md border border-solid border-se-primary bg-se-primary text-white text-[14px] font-medium cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50 transition-opacity whitespace-nowrap"
			>
				{ busy ? __( '…', 'storeengine' ) : __( 'Apply', 'storeengine' ) }
			</button>
		</div>
	);
};

const InventoryPage = () => {
	const dispatch = useDispatch();
	const [ lowStock, setLowStock ] = useState( [] );
	const [ loadingLow, setLoadingLow ] = useState( true );
	const [ search, setSearch ] = useState( '' );
	const [ results, setResults ] = useState( [] );
	const [ searching, setSearching ] = useState( false );

	const loadLow = () => {
		setLoadingLow( true );
		dispatch( fetchInventoryStock( { low_stock: true, per_page: 100 } ) )
			.unwrap()
			.then( ( rows ) => setLowStock( ( rows || [] ).map( normalize ) ) )
			.catch( () => setLowStock( [] ) )
			.finally( () => setLoadingLow( false ) );
	};

	useEffect( loadLow, [] );

	const runSearch = async ( e ) => {
		e.preventDefault();
		const q = search.trim();
		if ( ! q ) return;
		setSearching( true );
		try {
			const rows = await dispatch( lookupItem( { q, location_id: 0 } ) ).unwrap();
			setResults( ( rows || [] ).map( normalize ) );
		} catch {
			setResults( [] );
		} finally {
			setSearching( false );
		}
	};

	// Reflect an adjustment in whichever list the row came from.
	const onAdjusted = ( item, qtyAfter ) => {
		const patch = ( list ) =>
			list.map( ( r ) =>
				r.product_id === item.product_id && r.variation_id === item.variation_id
					? { ...r, qty: qtyAfter }
					: r
			);
		setResults( patch );
		setLowStock( patch );
	};

	return (
		<div className="flex-1 p-6 se-admin-tw overflow-y-auto">
			<div className="max-w-3xl mx-auto">
				<h2 className="text-base font-semibold text-se-text mb-4">
					{ __( 'Inventory', 'storeengine' ) }
				</h2>

				{ /* Find any product to adjust */ }
				<div className="bg-white rounded-lg border border-solid border-se-border p-4 mb-5">
					<form onSubmit={ runSearch } className="flex gap-2">
						<input
							className="flex-1 rounded-md border border-solid border-se-border px-3 py-2 text-sm outline-none focus:border-se-primary"
							value={ search }
							onChange={ ( e ) => setSearch( e.target.value ) }
							placeholder={ __( 'Search a product to adjust stock…', 'storeengine' ) }
						/>
						<button
							onClick={ runSearch }
							isDisabled={ searching }
							className='px-4 py-2 rounded-md border border-solid border-se-primary bg-se-primary text-white text-[14px] font-medium cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50 transition-opacity'
						>
							{ searching ? __( 'Searching…', 'storeengine' ) : __( 'Search', 'storeengine' ) }
						</button>
					</form>
					{ results.length > 0 && (
						<div className="mt-2">
							{ results.map( ( item ) => (
								<AdjustRow
									key={ `${ item.product_id }:${ item.variation_id }` }
									item={ item }
									onAdjusted={ onAdjusted }
								/>
							) ) }
						</div>
					) }
				</div>

				{ /* Low stock */ }
				<div className="bg-white rounded-lg border border-solid border-se-border p-4">
					<div className="flex items-center justify-between mb-1">
						<h3 className="text-sm font-medium text-se-text m-0">
							{ __( 'Low stock', 'storeengine' ) }
						</h3>
						<button
							type="button"
							className="text-xs text-se-primary bg-transparent border-none cursor-pointer"
							onClick={ loadLow }
						>
							{ __( 'Refresh', 'storeengine' ) }
						</button>
					</div>
					{ loadingLow ? (
						<p className="text-sm text-se-subtitle">{ __( 'Loading…', 'storeengine' ) }</p>
					) : lowStock.length === 0 ? (
						<p className="text-sm text-se-subtitle">
							{ __( 'Nothing low on stock. Items show here once they hit their low-stock threshold.', 'storeengine' ) }
						</p>
					) : (
						lowStock.map( ( item ) => (
							<AdjustRow
								key={ `${ item.product_id }:${ item.variation_id }` }
								item={ item }
								onAdjusted={ onAdjusted }
							/>
						) )
					) }
				</div>
			</div>
		</div>
	);
};

export default InventoryPage;
