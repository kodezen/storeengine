import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import debounce from 'just-debounce-it';
import {
	createProduct,
	getProduct,
	listProductsPaged,
	updateProduct,
} from '@Redux/Slices/posSlice/posSlice';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import AddProductPage from './AddProductPage';

const PER_PAGE = 15;
const fmt = ( n ) => ( Math.round( Number( n || 0 ) * 100 ) / 100 ).toFixed( 2 );

// Same rationale as AddProductPage.js — @Components/Button's stylesheet isn't
// loaded in the standalone POS bundle, so it rendered unstyled here. Match
// the rest of the terminal's native Tailwind buttons instead.
const primaryBtnCls =
	'px-4 py-2 rounded-md border border-solid border-se-primary bg-se-primary text-white text-[14px] font-medium cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50 transition-opacity';
const pageNavCls =
	'min-w-7 h-7 px-1.5 flex items-center justify-center rounded text-xs border border-solid border-se-border bg-white text-se-subtitle cursor-pointer hover:bg-se-bg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white';

// Numbered-page-with-ellipsis pattern, same algorithm as the admin dashboard's
// shared @Components/Pagination — that component's stylesheet/icon font isn't
// loaded in this standalone bundle, so this re-implements the same pattern
// with native Tailwind buttons instead of pulling it in directly.
const Pagination = ( { page, totalPages, onChange } ) => {
	if ( totalPages <= 1 ) {
		return null;
	}

	const pageBtn = ( i ) => (
		<button
			key={ i }
			type="button"
			onClick={ () => onChange( i ) }
			aria-current={ i === page ? 'page' : undefined }
			className={ `min-w-7 h-7 px-1.5 flex items-center justify-center rounded text-xs cursor-pointer border-none ${
				i === page
					? 'bg-se-primary text-white'
					: 'bg-white text-se-subtitle hover:bg-se-bg'
			}` }
		>
			{ i }
		</button>
	);
	const dots = ( key ) => (
		<span
			key={ key }
			className="min-w-7 h-7 flex items-center justify-center text-xs text-se-subtitle"
		>
			…
		</span>
	);

	const items = [];
	if ( totalPages <= 5 ) {
		for ( let i = 1; i <= totalPages; i++ ) items.push( pageBtn( i ) );
	} else if ( page <= 3 ) {
		for ( let i = 1; i <= 3; i++ ) items.push( pageBtn( i ) );
		items.push( dots( 'dots' ), pageBtn( totalPages ) );
	} else if ( page >= totalPages - 2 ) {
		items.push( pageBtn( 1 ), dots( 'dots' ) );
		for ( let i = totalPages - 2; i <= totalPages; i++ ) items.push( pageBtn( i ) );
	} else {
		items.push( pageBtn( 1 ), dots( 'dots-start' ) );
		for ( let i = page - 1; i <= page + 1; i++ ) items.push( pageBtn( i ) );
		items.push( dots( 'dots-end' ), pageBtn( totalPages ) );
	}

	return (
		<div className="flex items-center justify-center gap-1 mt-4">
			<button
				type="button"
				onClick={ () => onChange( 1 ) }
				disabled={ page <= 1 }
				className={ pageNavCls }
				aria-label={ __( 'First page', 'storeengine' ) }
			>
				«
			</button>
			<button
				type="button"
				onClick={ () => onChange( Math.max( 1, page - 1 ) ) }
				disabled={ page <= 1 }
				className={ pageNavCls }
				aria-label={ __( 'Previous page', 'storeengine' ) }
			>
				‹
			</button>
			{ items }
			<button
				type="button"
				onClick={ () => onChange( Math.min( totalPages, page + 1 ) ) }
				disabled={ page >= totalPages }
				className={ pageNavCls }
				aria-label={ __( 'Next page', 'storeengine' ) }
			>
				›
			</button>
			<button
				type="button"
				onClick={ () => onChange( totalPages ) }
				disabled={ page >= totalPages }
				className={ pageNavCls }
				aria-label={ __( 'Last page', 'storeengine' ) }
			>
				»
			</button>
		</div>
	);
};

const Bone = ( { className = '' } ) => (
	<span className={ `block animate-pulse rounded-md bg-se-bg ${ className }` } />
);

// Mirrors the grid card's shape (image + 2 text lines + price row) so the
// swap from skeleton to real content doesn't jump.
const GridSkeleton = () => (
	<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
		{ [ ...Array( 8 ) ].map( ( _, i ) => (
			<div key={ i } className="flex flex-col bg-white border border-solid border-se-border rounded-md p-2.5">
				<Bone className="w-full h-20 mb-2" />
				<Bone className="w-3/4 h-3 mb-1.5" />
				<Bone className="w-1/2 h-2.5 mb-2" />
				<div className="flex items-center justify-between">
					<Bone className="w-10 h-3" />
					<Bone className="w-8 h-2.5" />
				</div>
			</div>
		) ) }
	</div>
);

// Mirrors the list row's shape (thumbnail + 2 text lines + price block).
const ListSkeleton = () => (
	<div className="flex flex-col border border-solid border-se-border rounded-md overflow-hidden">
		{ [ ...Array( 8 ) ].map( ( _, i ) => (
			<div
				key={ i }
				className="flex items-center gap-3 p-3 bg-white border-0 border-b border-solid border-se-border last:border-b-0"
			>
				<Bone className="w-10 h-10 shrink-0" />
				<div className="flex-1 min-w-0">
					<Bone className="w-1/3 h-3 mb-1.5" />
					<Bone className="w-1/4 h-2.5" />
				</div>
				<div className="shrink-0 text-right">
					<Bone className="w-12 h-3 mb-1.5 ml-auto" />
					<Bone className="w-16 h-2.5 ml-auto" />
				</div>
			</div>
		) ) }
	</div>
);

// Mirrors AddProductPage's layout (header row, thumbnail+name, two field
// rows, action buttons) so opening an existing product for editing doesn't
// flash blank/empty content while getProduct is in flight.
const FormSkeleton = () => (
	<div className="flex-1 p-6">
		<div className="se-admin-tw max-w-2xl mx-auto">
			<div className="flex items-center gap-3 mb-4">
				<Bone className="w-14 h-4" />
				<Bone className="w-40 h-5" />
			</div>
			<div className="bg-white rounded-lg border border-solid border-se-border p-5 flex flex-col gap-4">
				<div className="flex gap-4">
					<Bone className="w-20 h-20" />
					<div className="flex-1">
						<Bone className="w-16 h-3 mb-2" />
						<Bone className="w-full h-9" />
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<Bone className="h-9" />
					<Bone className="h-9" />
				</div>
				<div className="grid grid-cols-3 gap-4">
					<Bone className="h-9" />
					<Bone className="h-9" />
					<Bone className="h-9" />
				</div>
			</div>
			<div className="flex justify-end gap-3 mt-4">
				<Bone className="w-24 h-10" />
				<Bone className="w-32 h-10" />
			</div>
		</div>
	</div>
);

/**
 * "Products" tab (sidebar, page === 'add-product'). Shows the full catalog
 * by default — not the create form — with an "Add product" button to create
 * one and a click-to-edit row for every product. Create/edit both reuse
 * AddProductPage; after either, we return to the (refreshed) list instead of
 * jumping back to the cart/Home tab.
 */
const ProductsPage = () => {
	const dispatch = useDispatch();
	const [ screen, setScreen ] = useState( 'list' ); // 'list' | 'form'
	const [ editingId, setEditingId ] = useState( 0 );
	const [ editingProduct, setEditingProduct ] = useState( null );
	const [ loadingProduct, setLoadingProduct ] = useState( false );

	// Grid vs list display of the catalog — same toggle/persistence pattern
	// as the Home tab's "Top selling" browse grid (ProductBrowse.js).
	const [ displayMode, setDisplayMode ] = useState(
		() => localStorage.getItem( 'se_pos_products_view' ) || 'grid'
	);
	const setMode = ( v ) => {
		setDisplayMode( v );
		localStorage.setItem( 'se_pos_products_view', v );
	};

	const [ rows, setRows ] = useState( [] );
	const [ page, setPage ] = useState( 1 );
	const [ totalPages, setTotalPages ] = useState( 1 );
	const [ loading, setLoading ] = useState( true );
	const [ search, setSearch ] = useState( '' );

	const load = useCallback(
		( q, pageNum ) => {
			setLoading( true );
			dispatch( listProductsPaged( { q, page: pageNum, per_page: PER_PAGE } ) )
				.unwrap()
				.then( ( { data, totalPages: pages } ) => {
					setRows( data || [] );
					setTotalPages( Math.max( 1, pages ) );
					setPage( pageNum );
				} )
				.catch( () => {
					setRows( [] );
					setTotalPages( 1 );
				} )
				.finally( () => setLoading( false ) );
		},
		[ dispatch ]
	);

	useEffect( () => {
		load( '', 1 );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// One sellable row per variant comes back from the list endpoint; for the
	// product-management grid we only want one card per product (editing
	// always operates on the whole product, all variants together). The
	// underlying pagination is computed over products (posts) server-side,
	// so this dedupe doesn't change how many cards a page shows.
	const products = useMemo( () => {
		const seen = new Set();
		const out = [];
		for ( const p of rows ) {
			if ( seen.has( p.product_id ) ) continue;
			seen.add( p.product_id );
			out.push( p );
		}
		return out;
	}, [ rows ] );

	// Live search, debounced — matches the same pattern as the admin
	// dashboard's shared @Components/Search. Typing alone re-queries the
	// server (no separate "Search" button to remember to click), and
	// clearing the field re-queries immediately rather than waiting on the
	// debounce, so "no products" never lingers after the input goes blank.
	const debouncedSearch = useCallback(
		debounce( ( value ) => load( value, 1 ), 600 ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ load ]
	);

	const onSearchChange = ( e ) => {
		const value = e.target.value;
		setSearch( value );
		debouncedSearch( value );
	};

	const clearSearch = () => {
		setSearch( '' );
		load( '', 1 );
	};

	const openCreate = () => {
		setEditingId( 0 );
		setEditingProduct( null );
		setScreen( 'form' );
	};

	const openEdit = ( productId ) => {
		setEditingId( productId );
		setEditingProduct( null );
		setLoadingProduct( true );
		setScreen( 'form' );
		dispatch( getProduct( productId ) )
			.unwrap()
			.then( ( data ) => {
				if ( data ) {
					setEditingProduct( data );
				} else {
					setScreen( 'list' );
				}
			} )
			.catch( () => setScreen( 'list' ) )
			.finally( () => setLoadingProduct( false ) );
	};

	const backToList = () => {
		setScreen( 'list' );
		setEditingId( 0 );
		setEditingProduct( null );
		load( search, 1 );
	};

	// After a successful create, stay on the form but switch into edit mode
	// for the product just made (instead of bouncing back to the list) —
	// lets a cashier add several products back-to-back without re-navigating.
	// After an update, just stay put; the list gets refreshed lazily when
	// the user actually leaves via Back.
	const onFormDone = ( result, wasEdit ) => {
		if ( ! wasEdit && result?.product_id ) {
			openEdit( result.product_id );
		}
	};

	const handleCreate = ( payload ) =>
		dispatch( createProduct( payload ) )
			.unwrap()
			.then( ( data ) => {
				if ( ! data ) throw new Error();
				dispatch(
					showNotification( {
						message: __( 'Product created.', 'storeengine' ),
						isShow: true,
						type: 'success',
					} )
				);
				return data;
			} );

	const handleUpdate = ( payload ) =>
		dispatch( updateProduct( { id: editingId, ...payload } ) )
			.unwrap()
			.then( ( data ) => {
				if ( ! data ) throw new Error();
				dispatch(
					showNotification( {
						message: __( 'Product updated.', 'storeengine' ),
						isShow: true,
						type: 'success',
					} )
				);
				return data;
			} );

	if ( screen === 'form' ) {
		if ( loadingProduct ) {
			return <FormSkeleton />;
		}
		return (
			<AddProductPage
				key={ editingId || 'new' }
				productId={ editingId || null }
				product={ editingProduct }
				onCreate={ handleCreate }
				onUpdate={ handleUpdate }
				onDone={ onFormDone }
				onCancel={ backToList }
				onAddAnother={ openCreate }
			/>
		);
	}

	return (
		<div className="flex-1 p-6 se-admin-tw overflow-y-auto">
			<div className="max-w-5xl mx-auto">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-base font-semibold text-se-text m-0">
						{ __( 'Products', 'storeengine' ) }
					</h2>
					<button
						type="button"
						onClick={ openCreate }
						className={ primaryBtnCls }
					>
						{ __( '+ Add product', 'storeengine' ) }
					</button>
				</div>

				<div className="relative mb-4">
					<input
						className="w-full rounded-md border border-solid border-se-border px-3 py-2 pr-9 text-sm outline-none focus:border-se-primary"
						value={ search }
						onChange={ onSearchChange }
						placeholder={ __( 'Search products…', 'storeengine' ) }
					/>
					{ search && (
						<button
							type="button"
							onClick={ clearSearch }
							className="absolute right-2 top-1 -translate-y-1/2 flex items-center justify-center w-6 h-6 text-se-subtitle hover:text-se-primary bg-transparent border-none cursor-pointer p-0"
							aria-label={ __( 'Clear search', 'storeengine' ) }
						>
							✕
						</button>
					) }
				</div>

				{ ( loading || products.length > 0 ) && (
					<div className="flex justify-end mb-2">
						<div className="flex border border-solid border-se-border rounded-md overflow-hidden">
							<button
								type="button"
								onClick={ () => setMode( 'grid' ) }
								className={ `px-2 py-1 border-none cursor-pointer ${ displayMode === 'grid' ? 'bg-se-primary text-white' : 'bg-white text-se-subtitle' }` }
								aria-label={ __( 'Grid view', 'storeengine' ) }
							>
								<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2.5" y="2.5" width="6" height="6" rx="1"/><rect x="11.5" y="2.5" width="6" height="6" rx="1"/><rect x="2.5" y="11.5" width="6" height="6" rx="1"/><rect x="11.5" y="11.5" width="6" height="6" rx="1"/></svg>
							</button>
							<button
								type="button"
								onClick={ () => setMode( 'list' ) }
								className={ `px-2 py-1 border-none cursor-pointer ${ displayMode === 'list' ? 'bg-se-primary text-white' : 'bg-white text-se-subtitle' }` }
								aria-label={ __( 'List view', 'storeengine' ) }
							>
								<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 5h11M6 10h11M6 15h11"/><circle cx="3" cy="5" r="1"/><circle cx="3" cy="10" r="1"/><circle cx="3" cy="15" r="1"/></svg>
							</button>
						</div>
					</div>
				) }

				{ loading ? (
					displayMode === 'list' ? <ListSkeleton /> : <GridSkeleton />
				) : products.length === 0 ? (
					<p className="text-sm text-se-subtitle">{ __( 'No products yet.', 'storeengine' ) }</p>
				) : displayMode === 'list' ? (
					<div className="flex flex-col border border-solid border-se-border rounded-md overflow-hidden">
						{ products.map( ( p ) => (
							<button
								type="button"
								key={ p.product_id }
								onClick={ () => openEdit( p.product_id ) }
								className="flex items-center gap-3 p-3 text-left bg-white border-0 border-b border-solid border-se-border last:border-b-0 cursor-pointer hover:bg-[#F7F7F8]"
							>
								<span
									className="w-10 h-10 shrink-0 rounded-md bg-[#F1F1F1] bg-cover bg-center"
									style={ p.image_url ? { backgroundImage: `url(${ p.image_url })` } : {} }
								/>
								<span className="flex-1 min-w-0">
									<span className="block truncate text-[13px] font-medium text-se-text">
										{ p.product_title.split( ' · ' )[ 0 ] }
									</span>
									<span className="block truncate text-[11px] text-se-subtitle">
										{ [ p.category, p.brand ].filter( Boolean ).join( ' · ' ) || '—' }
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
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
						{ products.map( ( p ) => (
							<button
								type="button"
								key={ p.product_id }
								onClick={ () => openEdit( p.product_id ) }
								className="flex flex-col text-left bg-white border border-solid border-se-border rounded-md p-2.5 cursor-pointer hover:shadow-se-card hover:border-se-primary transition-colors"
							>
								<span
									className="w-full h-20 mb-2 rounded-md bg-[#F1F1F1] bg-cover bg-center"
									style={ p.image_url ? { backgroundImage: `url(${ p.image_url })` } : {} }
								/>
								<span className="block truncate text-[12px] font-medium text-se-text">
									{ p.product_title.split( ' · ' )[ 0 ] }
								</span>
								{ [ p.category, p.brand ].filter( Boolean ).join( ' · ' ) && (
									<span className="block truncate text-[10px] text-se-subtitle">
										{ [ p.category, p.brand ].filter( Boolean ).join( ' · ' ) }
									</span>
								) }
								<span className="flex items-center justify-between mt-1">
									<span className="text-[12px] font-medium text-se-primary">
										{ fmt( p.price ) }
									</span>
									{ p.stock?.stock_quantity != null && (
										<span className="text-[10px] text-se-subtitle">
											{ p.stock.stock_quantity } { __( 'in stock', 'storeengine' ) }
										</span>
									) }
								</span>
							</button>
						) ) }
					</div>
				) }

				{ ! loading && (
					<Pagination
						page={ page }
						totalPages={ totalPages }
						onChange={ ( p ) => load( search, p ) }
					/>
				) }
			</div>
		</div>
	);
};

export default ProductsPage;
