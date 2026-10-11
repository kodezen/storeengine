import React, { useEffect, useMemo, useState } from 'react';
import ListTable from '@Components/ListTable';
import SnackbarAction from '@Components/SnackbarAction';
import { useDispatch, useSelector } from 'react-redux';
import Search from '@Components/Search';
import {
	fetchAllProducts,
	deleteProduct,
	restoreProduct,
	updateProduct,
	moveProductToTrash,
} from '@Redux/Slices/productsSlice/productsSlice';
import { __, sprintf } from '@wordpress/i18n';
import StatusOptions from '@Components/StatusOptions';
import { fetchAllCategories } from '@Redux/Slices/categorySlice/categorySlice';
import { fetchAllTags } from '@Redux/Slices/tagsSlice/tagsSlice';
import { Link, useNavigate } from 'react-router-dom';
import {
	admin_url,
	API,
	get_route_path,
	isAddonActive,
	namespace,
	prepare_admin_route_path,
	sliceString,
} from '@Utils/helper';
import OptionMenu from '@Components/OptionMenu';
import moment from 'moment';
import Preloader from '@Components/Loader/Preloader';
import Currency from '@Components/Currency';
import { useLocationQuery } from '@Hooks';
import useScreenOptions from '@Hooks/useScreenOptions';
import { Button } from '@Components/ui';
import EmptyProducts from './EmptyProducts';
import {
	AdvancedFilter,
	FilterChips,
	cleanGroups,
	SavedViewsMenu,
	decodeGroups,
	encodeGroups,
	useSavedViews,
} from '@Components/AdvancedFilter';
import { productFilterFields } from './filterFields';

import './styles.scss';

const statusArray = [
	{
		label: __( 'All', 'storeengine' ),
		value: 'all',
	},
	{
		label: __( 'Publish', 'storeengine' ),
		value: 'publish',
	},
	{
		label: __( 'Draft', 'storeengine' ),
		value: 'draft',
	},
	{
		label: __( 'Pending', 'storeengine' ),
		value: 'pending',
	},
	{
		label: __( 'Trash', 'storeengine' ),
		value: 'trash',
	},
];

const ProductsTable = () => {
	const products = useSelector( ( state ) => state.products );
	const categories = useSelector( ( state ) => state.categories );
	const tags = useSelector( ( state ) => state.tags );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState(
		! products.data.length
	);
	// Whether the first fetch has resolved. Until it has we can't tell an empty
	// store from a still-loading one, so we render neither the table nor the
	// empty-state hero (that flash of table chrome → hero is exactly what this
	// guards). Seeded true when redux already holds products so a cached list
	// paints immediately without a loader frame.
	const [ initialLoaded, setInitialLoaded ] = useState(
		( products?.data?.length ?? 0 ) > 0
	);
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ confirm, setConfirm ] = useState( false );
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );
	const dispatch = useDispatch();

	// For handleNavigate
	const navigate = useNavigate();
	const location = useLocationQuery();
	const productStatus = location.getValue(
		'status',
		'all',
		statusArray.map( ( i ) => i.value )
	);
	const { perPage: screenPerPage } = useScreenOptions( 'products' );
	const perPage = location.getValue( 'perPage', screenPerPage || 10 );
	const searchText = location.getValue( 'search', '' );
	// Advanced filter groups (JSON) and the saved view they came from, both in
	// the URL so a filtered list can be bookmarked, shared and reloaded.
	const filtersRaw = location.getValue( 'filters', '' );
	const viewId = location.getValue( 'view', '' );
	const filterFields = useMemo(
		() => productFilterFields( categories?.data || [], tags?.data || [] ),
		[ categories?.data, tags?.data ]
	);
	// Incomplete conditions (e.g. from a hand-edited URL) are dropped, exactly
	// as the server does, so chips and counts match what is applied.
	const filterGroups = useMemo(
		() => cleanGroups( filterFields, decodeGroups( filtersRaw ) ),
		[ filterFields, filtersRaw ]
	);
	const [ filterOpen, setFilterOpen ] = useState( false );
	const { views, save: saveView, remove: removeView } = useSavedViews( 'products' );
	const activeView = views.find( ( v ) => v.id === viewId ) || null;
	const urlPage = Math.max( 1, location.getValue( 'page_no', 1 ) );

	const handleNavigate = (
		status = '',
		page = 1,
		per_page = 10,
		search = '',
		// Filters/view carry over unless explicitly replaced.
		{ filters = filtersRaw, view = viewId } = {}
	) => {
		navigate(
			prepare_admin_route_path( 'storeengine-products', {
				status,
				page,
				per_page,
				search,
				filters,
				view: filters ? view : '',
			} )
		);
	};

	// Apply new filter groups (page resets to 1). Keeps the active view id so
	// "Update view" can offer to save the changes into it.
	const applyFilters = ( groups, view = viewId ) =>
		handleNavigate( productStatus, 1, perPage, searchText, {
			filters: encodeGroups( groups ),
			view: groups.length ? view : '',
		} );

	const selectView = ( view ) =>
		view
			? handleNavigate( productStatus, 1, perPage, searchText, { filters: view.filters, view: view.id } )
			: handleNavigate( productStatus, 1, perPage, searchText, { filters: '', view: '' } );

	const handleSaveView = async ( { id, name } ) => {
		const view = await saveView( { id, name, groups: filterGroups } );
		if ( view ) {
			handleNavigate( productStatus, urlPage, perPage, searchText, { filters: view.filters, view: view.id } );
		}
	};

	const handleDeleteView = async ( id ) => {
		await removeView( id );
		if ( id === viewId ) {
			handleNavigate( productStatus, urlPage, perPage, searchText, { filters: filtersRaw, view: '' } );
		}
	};



	// Table data fetch
	const handleTableDataFetch = async (
		status = 'all',
		page = 1,
		itemPerPage = 10,
		search = '',
		filters = ''
	) => {
		await dispatch(
			fetchAllProducts( {
				status,
				page,
				per_page: itemPerPage,
				search,
				filters,
			} )
		);
	};

	useEffect( () => {
		( async () => {
			setDataFetchingStatus( true );

			if ( categories?.data.length === 0 ) {
				await dispatch( fetchAllCategories( {} ) );
			}

			if ( tags?.data.length === 0 ) {
				await dispatch( fetchAllTags( {} ) );
			}

			if (
				products?.data.length <= 1 ||
				productStatus !== products.status ||
				perPage !== products.rowsPerPage ||
				urlPage !== products.page ||
				searchText !== products.search ||
				filtersRaw !== ( products.filters || '' )
			) {
				await handleTableDataFetch(
					productStatus,
					urlPage ?? 1,
					perPage,
					searchText,
					filtersRaw
				);
			}

			setDataFetchingStatus( false );
			setInitialLoaded( true );
		} )();
	}, [ productStatus, urlPage, perPage, searchText, filtersRaw ] );

	// Total items
	const handleItemsPage = async ( itemsPerPage = 10, page = 1 ) => {
		handleNavigate( productStatus, page, itemsPerPage, searchText );
	};

	// Pagination
	const handlePageChange = async ( page = 1, itemPerPage = 10 ) => {
		handleNavigate( productStatus, page, itemPerPage, searchText );
	};

	const publishAction =
		productStatus !== 'trash'
			? [
					{
						suffix: 'trash',
						label: __( 'Trash', 'storeengine' ),
						onClick: () =>
							setSnackbarOption( {
								value: 'trash',
								message: __(
									'Are you sure, you want to move these item to trash!',
									'storeengine'
								),
							} ),
					},
			  ]
			: [];

	const trashAction =
		productStatus === 'trash'
			? [
					{
						suffix: 'restore',
						label: __( 'Restore', 'storeengine' ),
						onClick: () =>
							setSnackbarOption( {
								value: 'restore',
								message: __(
									'Are you sure, you want to restore these items?',
									'storeengine'
								),
							} ),
					},
					{
						suffix: 'delete',
						label: __( 'Delete Permanently', 'storeengine' ),
						onClick: () =>
							setSnackbarOption( {
								value: 'delete',
								message: __(
									'Are you sure, you want to delete these items?',
									'storeengine'
								),
							} ),
					},
			  ]
			: [];

	// "Print labels" — carry the selected product IDs to the Barcodes page.
	// Not a confirm action: navigates immediately. Gated on inventory-pro
	// (the addon that owns the Barcode Labels page).
	const printLabelsAction =
		productStatus !== 'trash' && isAddonActive( 'inventory-pro' )
			? [
					{
						suffix: 'print-labels',
						label: __( 'Print labels', 'storeengine' ),
						onClick: () => {
							const ids = selectedItems
								.map( ( it ) => it.id ?? it.ID )
								.filter( Boolean );
							if ( ! ids.length ) {
								return;
							}
							navigate(
								get_route_path( {
									page: 'storeengine-inventory',
									path: 'barcodes',
									product_ids: ids.join( ',' ),
								} )
							);
						},
					},
			  ]
			: [];

	const snackbarOptions = [
		...publishAction,
		...printLabelsAction,
		...trashAction,
	];

	const handleReset = () => {
		setSelectedItems( [] );
		setSnackbarOption( {} );
		setResetSelectedItems( true );
		setConfirm( false );
	};

	const snackbarActionHandler = async ( option ) => {
		for ( const item of selectedItems ) {
			if ( productStatus !== 'trash' && option === 'trash' ) {
				await dispatch( moveProductToTrash( item ) );
			} else if ( option === 'restore' ) {
				await dispatch(
					restoreProduct( { ...item, status: 'draft' } )
				);
			} else {
				await dispatch(
					deleteProduct( { ID: item.id ? item.id : item.ID } )
				);
			}
		}
		handleReset();
	};

	const handleEditAction = ( { id } ) =>
		navigate(
			get_route_path( {
				page: 'storeengine-products',
				id,
				action: 'edit',
			} )
		);

	const handleViewAction = ( { link } ) => window.open( link, '_blank' );

	useMemo( () => {
		( async () => {
			if ( confirm ) {
				await snackbarActionHandler( snackbarOption.value );
			} else {
				handleReset();
			}
		} )();
	}, [ confirm ] );

	const renderTagsCell = ( row ) => {
		if ( ! tags?.data || row?.storeengine_product_tag?.length === 0 ) {
			return (
				<span className="storeengine-sub-title-light">&hellip;</span>
			);
		}

		return (
			<div className="storeengine-list-wrap__term-lists">
				{ tags?.data
					.filter( ( item ) =>
						row.storeengine_product_tag.includes( item.id )
					)
					.map( ( tag, index ) => {
						return (
							<div key={ index }>
								<a
									href={ tag.link }
									target="_blank"
									rel="noreferrer"
									className="storeengine-category-items"
								>
									{ sliceString( tag.name, 15, '' ) }
								</a>
								{ tags.length - 1 > index ? ', ' : '' }
							</div>
						);
					} ) }
			</div>
		);
	};

	const renderCategoriesCell = ( row ) => {
		if (
			! categories?.data ||
			row?.storeengine_product_category?.length === 0
		) {
			return (
				<span className="storeengine-sub-title-light">&hellip;</span>
			);
		}

		return (
			<div className="storeengine-list-wrap__term-lists">
				{ categories?.data
					.filter( ( item ) =>
						row.storeengine_product_category.includes( item.id )
					)
					.map( ( category, index ) => {
						return (
							<div key={ index }>
								<a
									href={ category.link }
									target="_blank"
									rel="noreferrer"
									className="store-category-items"
								>
									{ sliceString( category.name, 15, '' ) }
								</a>
								{ categories.length - 1 > index ? ', ' : '' }
							</div>
						);
					} ) }
			</div>
		);
	};

	const renderPriceCell = ( prices ) => {
		if ( prices.length === 0 ) {
			return (
				<span className="storeengine-sub-title-light">&hellip;</span>
			);
		}
		const priceNumbers = [ ...prices ].sort(
			( a, b ) => a.price - b.price
		);

		if ( priceNumbers.length === 1 ) {
			return (
				<span className="storeengine-sub-title-light">
					<Currency value={ priceNumbers[ 0 ].price } />
				</span>
			);
		}

		return (
			<div
				className="storeengine-sub-title-light storeengine-flex"
				style={ { gap: '5px' } }
			>
				<Currency
					value={ priceNumbers.at( 0 ).price }
					symbol={ false }
				/>
				<span className="price-separator">&mdash;</span>
				<Currency
					value={ priceNumbers.at( -1 ).price }
					symbol={ false }
				/>
			</div>
		);
	};

	const statusHandler = ( row ) => async ( itemStatus ) => {
		if ( 'trash' === itemStatus ) {
			await dispatch( moveProductToTrash( row ) );
		} else {
			// Send ONLY the status — never the whole read-shaped row. The row
			// carries `author` (the product's real owner), and re-posting it on a
			// product the admin doesn't personally own trips WordPress's
			// "edit others as this user" check (403). It also re-saves prices/meta
			// for no reason. A status toggle only needs the status.
			await dispatch(
				updateProduct( {
					id: row.id,
					formData: { status: itemStatus },
				} )
			);
		}
	};

const COLUMNS_HIDDEN_BY_DEFAULT = [
		__( 'Tags', 'storeengine' ),
		__( 'Publish Date', 'storeengine' ),
	];
	const COLUMNS_LOCKED = [
		__( 'Title', 'storeengine' ),
		__( 'Action', 'storeengine' ),
	];
	const columns = [
		{
			name: __( 'Title', 'storeengine' ),
			suffix: 'title',
			width: '25%',
			cell: ( row ) => (
				<div className="storeenging-table-title-wrap">
					<div className="storeengine-table-title">
						<Link
							to={ get_route_path( {
								page: 'storeengine-products',
								id: row.id,
								action: 'edit',
							} ) }
						>
							<div
								dangerouslySetInnerHTML={ {
									__html: row.title?.rendered,
								} }
							></div>
						</Link>
						<a
							href={ row.link }
							target="_blank"
							rel="noreferrer"
							className="storeengine-table-title__link"
						>
							<span
								className="storeengine-icon storeengine-icon--go-on"
								aria-hidden={ true }
							/>
						</a>
					</div>
					<div className="storeengine-table-sub-title">
						<div className="storeengine-table-sub-title__item">
							{
								// translators: %d. Object ID.
								sprintf( __( 'ID: %d', 'storeengine' ), row.id )
							}
						</div>
					</div>
				</div>
			),
		},
		{
			name: __( 'Category', 'storeengine' ),
			cell: ( row ) => renderCategoriesCell( row ),
		},
		{
			name: __( 'Price', 'storeengine' ),
			cell: ( row ) => renderPriceCell( row?.prices ),
		},
		{
			name: __( 'Tags', 'storeengine' ),
			cell: ( row ) => renderTagsCell( row ),
		},
		{
			name: __( 'Publish Date', 'storeengine' ),
			cell: ( row ) => (
				<p>{ moment( row.date ).format( 'D MMMM, YYYY' ) }</p>
			),
		},
		{
			name: __( 'Status', 'storeengine' ),
			cell: ( row ) => (
				<div className="status-cell storeengine-flex storeengine-flex-justify-center">
					<StatusOptions
						value={ row?.status }
						options={ {
							items: [
								{
									label: __( 'Published', 'storeengine' ),
									value: 'publish',
								},
								{
									label: __( 'Draft', 'storeengine' ),
									value: 'draft',
								},
								{
									label: __( 'Pending', 'storeengine' ),
									value: 'pending',
								},
								{
									label: __( 'Trash', 'storeengine' ),
									value: 'trash',
								},
							],
						} }
						onChangeHandler={ statusHandler( row ) }
					/>
				</div>
			),
		},
		{
			name: __( 'Action', 'storeengine' ),
			cell: ( row ) => {
				const publishedActions =
					row.status !== 'trash'
						? [
								{
									type: 'button',
									label: __( 'Trash', 'storeengine' ),
									suffix: 'trash',
									icon: (
										<span
											className="storeengine-icon storeengine-icon--trash"
											aria-hidden={ true }
										/>
									),
									onClick: () =>
										dispatch( moveProductToTrash( row ) ),
								},
						  ]
						: [];

				const trashActions =
					row.status === 'trash'
						? [
								{
									type: 'button',
									label: __( 'Restore', 'storeengine' ),
									icon: (
										<span
											className="storeengine-icon storeengine-icon--restore"
											aria-hidden={ true }
										/>
									),
									onClick: () =>
										dispatch(
											updateProduct( {
												id: row.id,
												// Status-only payload — see statusHandler note.
												formData: {
													status: 'draft',
												},
											} )
										),
								},
								{
									type: 'button',
									label: __( 'Delete', 'storeengine' ),
									suffix: 'trash',
									icon: (
										<span
											className="storeengine-icon storeengine-icon--trash"
											aria-hidden={ true }
										/>
									),
									onClick: () =>
										dispatch(
											deleteProduct( {
												ID: row.id ? row.id : row.ID,
											} )
										),
								},
						  ]
						: [];

				return (
					<div className="action-cell">
						<Button
							icon="storeengine-icon--edit"
							size="sm"
							onClick={ () => handleEditAction( row ) }
							preset="outline"
							aria-label={ __( 'Edit', 'storeengine' ) }
						/>
						<Button
							icon="storeengine-icon--wordpress"
							onClick={ () => {
								window.open(
									`${ admin_url }post.php?post=${ row.id }&action=edit`
								);
							} }
							size="sm"
							preset="outline"
							aria-label={ __( 'Edit in WordPress', 'storeengine' ) }
						/>
						<OptionMenu
							suffix="product-table"
							options={ [
								{
									type: 'button',
									label: __( 'Edit', 'storeengine' ),
									icon: (
										<span
											className="storeengine-icon storeengine-icon--edit"
											aria-hidden={ true }
										/>
									),
									onClick: () => handleEditAction( row ),
								},
								{
									type: 'button',
									label: __( 'View', 'storeengine' ),
									icon: (
										<span
											className="storeengine-icon storeengine-icon--go-on"
											aria-hidden={ true }
										/>
									),
									onClick: () => handleViewAction( row ),
								},
								{
									type: 'button',
									label: __( 'Analytics', 'storeengine' ),
									icon: (
										<span
											className="storeengine-icon storeengine-icon--chart-alt"
											aria-hidden={ true }
										/>
									),
									onClick: () =>
										navigate(
											get_route_path( {
												page: 'storeengine-products',
												id: row.id ? row.id : row.ID,
												path: 'analytics',
											} )
										),
									hasBorder: true,
								},
								...publishedActions,
								...trashActions,
							] }
						/>
					</div>
				);
			},
		},
	];

	const noDataText = filterGroups.length
		? __( 'No products match these filters.', 'storeengine' )
		: products?.data?.length === 0 && ! searchText
			? __(
					'Please, create Products to see the available list here.',
					'storeengine'
			  )
			: __(
					'No matching results found. Please try a different search.',
					'storeengine'
			  );

	const subHeaderComponentMemo = React.useMemo( () => {
		const searchHandler = ( value ) => {
			handleNavigate( productStatus, urlPage, perPage, value ); // Pass the URL params
		};

		const dataFetchHandler = ( itemStatus ) => {
			setDataFetchingStatus( true );
			handleNavigate( itemStatus ); // Pass the URL params
		};

		return (
			<React.Fragment>
				<div className="kzui-table__sub-header-actions-left">
					<div className="kzui-table-sub-header-tabs">
						{ statusArray.map( ( item, index ) => (
							<span
								role="presentation"
								className={ `tab ${
									item?.value === productStatus
										? 'is-active'
										: ''
								} ` }
								key={ index }
								onClick={ () => {
									dataFetchHandler( item.value );
								} }
							>
								{ item.label }
							</span>
						) ) }
					</div>
				</div>
				<div className="kzui-list-table-sub-header-actions-right storeengine-list-filter-bar">
					<SavedViewsMenu
						views={ views }
						activeId={ viewId }
						onSelect={ selectView }
						onDelete={ handleDeleteView }
						allLabel={ __( 'All products', 'storeengine' ) }
						onSave={ handleSaveView }
						canSave={ filterGroups.length > 0 }
					/>
					<AdvancedFilter
						fields={ filterFields }
						value={ filterGroups }
						onApply={ ( groups ) => applyFilters( groups ) }
						open={ filterOpen }
						onOpenChange={ setFilterOpen }
					/>
					<Search
						placeholder={ __( 'Search Product', 'storeengine' ) }
						onSearchHandler={ searchHandler }
						defaultValue={ searchText }
					/>
				</div>
			</React.Fragment>
		);
	}, [ searchText, productStatus, filtersRaw, viewId, views, filterFields, filterOpen ] );

	// "All" excludes the trash, so an empty "All" tab does not mean an empty
	// store: products that only live in the trash must not trigger the
	// first-run hero. Ask once for the trash count before deciding.
	const mayBeEmptyStore =
		initialLoaded &&
		! searchText &&
		! filterGroups.length &&
		productStatus === 'all' &&
		( products?.totalItems ?? 0 ) === 0 &&
		( products?.data?.length ?? 0 ) === 0;
	const [ trashCount, setTrashCount ] = useState( null );
	useEffect( () => {
		if ( ! mayBeEmptyStore ) {
			setTrashCount( null );
			return undefined;
		}
		let live = true;
		API.get( namespace + 'storeengine_product', {
			params: { status: 'trash', per_page: 1 },
		} )
			.then( ( res ) => {
				if ( live ) {
					setTrashCount(
						parseInt( res.headers[ 'x-wp-total' ], 10 ) || 0
					);
				}
			} )
			.catch( () => live && setTrashCount( 0 ) );
		return () => {
			live = false;
		};
	}, [ mayBeEmptyStore ] );

	// Hold everything until the first fetch resolves — otherwise the list-table
	// chrome (tabs/headers) paints for a beat and is then swapped for the hero.
	if ( ! initialLoaded || ( mayBeEmptyStore && null === trashCount ) ) {
		return <Preloader />;
	}

	// Fresh-install first-run state: the store has no products at all (the "All"
	// tab, no active search). Show an inviting CTA hero instead of an empty
	// table with headers. A trash-only store or a search with no hits is NOT
	// "empty" — those keep the normal table + noDataText.
	const isStoreEmpty = mayBeEmptyStore && 0 === trashCount;

	if ( isStoreEmpty ) {
		return <EmptyProducts />;
	}

	return (
		<React.Fragment>
			<ListTable
				key={ 'product-table-' + products?.data.length }
				columns={ columns.map( ( column ) => ( {
					...column,
					defaultHidden: COLUMNS_HIDDEN_BY_DEFAULT.includes(
						column.name
					),
					locked: COLUMNS_LOCKED.includes( column.name ),
				} ) ) }
				data={ products?.data ?? [] }
				showSubHeader={ true }
				subHeaderComponent={ subHeaderComponentMemo }
				subHeaderBelow={
					<FilterChips
						fields={ filterFields }
						groups={ filterGroups }
						onChange={ ( groups ) => applyFilters( groups ) }
						onEdit={ () => setFilterOpen( true ) }
						activeView={ activeView }
						onSave={ handleSaveView }
					/>
				}
				isRowSelectable={ true }
				showColumnFilter={ true }
				getSelectRowValue={ ( selectedRow ) => {
					setSelectedItems( selectedRow );
					setResetSelectedItems( false );
				} }
				noDataText={ noDataText }
				showPagination={ products?.totalItems >= 10 }
				onChangePage={ handlePageChange }
				onChangeItemsPerPage={ handleItemsPage }
				totalItems={ products?.totalItems }
				totalRows={ products?.data?.length }
				dataFetchingStatus={ dataFetchingStatus }
				resetSelected={ resetSelectedItems }
				currentPageNumber={ products?.page ?? urlPage }
				rowsPerPage={
					products?.rowsPerPage ? products?.rowsPerPage : perPage
				}
				suffix="product"
				screenId="products"
			/>

			{ selectedItems.length > 0 && (
				<SnackbarAction
					actionButtons={ snackbarOptions }
					itemsLength={ selectedItems?.length }
					confirmHandler={ setConfirm }
					isActionSelected={ snackbarOption }
					resetHandler={ handleReset }
				/>
			) }
		</React.Fragment>
	);
};

export default ProductsTable;
