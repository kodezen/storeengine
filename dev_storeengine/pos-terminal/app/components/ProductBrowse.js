import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { listProducts } from '@Redux/Slices/posSlice/posSlice';

const fmt = ( n ) => ( Math.round( Number( n || 0 ) * 100 ) / 100 ).toFixed( 2 );

/**
 * Default product browse list for the terminal — loads all products and shows
 * category, brand, SKU/barcode, price and stock. Grid or list view. Clicking
 * a product adds it to the cart.
 */
const ProductBrowse = ( { onAdd } ) => {
	const dispatch = useDispatch();
	// Grid rows come back priced for the attached customer, so tapping one
	// puts the same figure in the cart that scanning it would.
	const customer = useSelector( ( s ) => s.pos.customer );
	const [ products, setProducts ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ view, setView ] = useState(
		() => localStorage.getItem( 'se_pos_browse_view' ) || 'grid'
	);

	const setMode = ( v ) => {
		setView( v );
		localStorage.setItem( 'se_pos_browse_view', v );
	};

	useEffect( () => {
		let alive = true;
		setLoading( true );
		dispatch(
			listProducts( {
				top: 1,
				per_page: 10,
				customer_id: customer?.id || 0,
			} )
		)
			.unwrap()
			.then( ( rows ) => alive && setProducts( rows || [] ) )
			.catch( () => alive && setProducts( [] ) )
			.finally( () => alive && setLoading( false ) );
		return () => {
			alive = false;
		};
	}, [ dispatch, customer ] );

	const meta = ( p ) =>
		[ p.category, p.brand ].filter( Boolean ).join( ' · ' );
	const code = ( p ) => p.sku || p.barcode;

	return (
		<div className="mt-5">
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-[14px] font-medium text-[#101828] m-0">
					{ __( 'Top selling', 'storeengine' ) }
				</h3>
				<div className="flex border border-solid border-se-border rounded-md overflow-hidden">
					<button
						type="button"
						onClick={ () => setMode( 'grid' ) }
						className={ `px-2 py-1 border-none cursor-pointer ${ view === 'grid' ? 'bg-se-primary text-white' : 'bg-white text-se-subtitle' }` }
						aria-label={ __( 'Grid view', 'storeengine' ) }
					>
						<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2.5" y="2.5" width="6" height="6" rx="1"/><rect x="11.5" y="2.5" width="6" height="6" rx="1"/><rect x="2.5" y="11.5" width="6" height="6" rx="1"/><rect x="11.5" y="11.5" width="6" height="6" rx="1"/></svg>
					</button>
					<button
						type="button"
						onClick={ () => setMode( 'list' ) }
						className={ `px-2 py-1 border-none cursor-pointer ${ view === 'list' ? 'bg-se-primary text-white' : 'bg-white text-se-subtitle' }` }
						aria-label={ __( 'List view', 'storeengine' ) }
					>
						<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 5h11M6 10h11M6 15h11"/><circle cx="3" cy="5" r="1"/><circle cx="3" cy="10" r="1"/><circle cx="3" cy="15" r="1"/></svg>
					</button>
				</div>
			</div>

			{ loading ? (
				<p className="text-sm text-se-subtitle">{ __( 'Loading products…', 'storeengine' ) }</p>
			) : products.length === 0 ? (
				<p className="text-sm text-se-subtitle">{ __( 'No products yet.', 'storeengine' ) }</p>
			) : view === 'list' ? (
				<div className="flex flex-col border border-solid border-se-border rounded-md overflow-hidden">
					{ products.map( ( p ) => (
						<button
							type="button"
							key={ `${ p.product_id }:${ p.variation_id }` }
							onClick={ () => onAdd( p ) }
							className="flex items-center gap-3 p-3 text-left bg-white border-0 border-b border-solid border-se-border last:border-b-0 cursor-pointer hover:bg-[#F7F7F8]"
						>
							<span
								className="w-10 h-10 shrink-0 rounded-md bg-[#F1F1F1] bg-cover bg-center"
								style={ p.image_url ? { backgroundImage: `url(${ p.image_url })` } : {} }
							/>
							<span className="flex-1 min-w-0">
								<span className="block truncate text-[13px] font-medium text-se-text">{ p.product_title }</span>
								<span className="block truncate text-[11px] text-se-subtitle">
									{ [ meta( p ), code( p ) && `${ p.sku ? 'SKU' : 'Barcode' } ${ code( p ) }` ].filter( Boolean ).join( ' · ' ) || '—' }
								</span>
							</span>
							<span className="shrink-0 text-right">
								<span className="block text-[13px] font-medium text-se-primary">{ fmt( p.price ) }</span>
								{ p.stock?.stock_quantity != null && (
									<span className="block text-[10px] text-se-subtitle">{ p.stock.stock_quantity } { __( 'in stock', 'storeengine' ) }</span>
								) }
							</span>
						</button>
					) ) }
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{ products.map( ( p ) => (
						<button
							type="button"
							key={ `${ p.product_id }:${ p.variation_id }` }
							onClick={ () => onAdd( p ) }
							className="flex flex-col text-left bg-white border border-solid border-se-border rounded-md p-2.5 cursor-pointer hover:shadow-se-card"
						>
							<span
								className="w-full h-16 mb-2 rounded-md bg-[#F1F1F1] bg-cover bg-center"
								style={ p.image_url ? { backgroundImage: `url(${ p.image_url })` } : {} }
							/>
							<span className="block truncate text-[12px] font-medium text-se-text">{ p.product_title }</span>
							{ meta( p ) && (
								<span className="block truncate text-[10px] text-se-subtitle">{ meta( p ) }</span>
							) }
							<span className="flex items-center justify-between mt-1">
								<span className="text-[12px] font-medium text-se-primary">{ fmt( p.price ) }</span>
								{ p.stock?.stock_quantity != null && (
									<span className="text-[10px] text-se-subtitle">{ p.stock.stock_quantity }</span>
								) }
							</span>
							{ code( p ) && (
								<span className="block truncate text-[10px] text-se-subtitle mt-0.5">{ p.sku ? 'SKU ' : 'Barcode ' }{ code( p ) }</span>
							) }
						</button>
					) ) }
				</div>
			) }
		</div>
	);
};

export default ProductBrowse;
