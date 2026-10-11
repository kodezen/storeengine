import React, { useEffect, useMemo, useState } from 'react';
import { applyFilters } from '@wordpress/hooks';
import useScreenOptions from '@Hooks/useScreenOptions';
import ListTable from '@Components/ListTable';
import SnackbarAction from '@Components/SnackbarAction';
import Search from '@Components/Search';
import { useDispatch, useSelector } from 'react-redux';
import { Scope, Button, Switch } from '@Components/ui';
import moment from 'moment';
import {
	fetchAllCoupons,
	deleteCoupon,
	updateCoupon,
} from '@Redux/Slices/couponsSlice/couponsSlice';
import { __, _x, sprintf } from '@wordpress/i18n';
import OptionMenu from '@Components/OptionMenu';
import {
	copyToClipboard,
	prepare_admin_route_path,
	get_route_path,
	sliceString,
} from '@Utils/helper';
import { Link, useNavigate } from 'react-router-dom';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import Preloader from '@Components/Loader/Preloader';
import Currency from '@Components/Currency';
import { useLocationQuery } from '@Hooks';
import { useListFilters } from '@Components/AdvancedFilter';
import { couponFilterFields } from './filterFields';

import './styles.scss';

const tabOptions = [
	{
		label: __( 'All', 'storeengine' ),
		value: 'all',
	},
	{
		label: __( 'Active', 'storeengine' ),
		value: 'active',
	},
	{
		label: __( 'Inactive', 'storeengine' ),
		value: 'inactive',
	},
	{
		label: __( 'Expired', 'storeengine' ),
		value: 'expired',
	},
	{
		label: __( 'No end date', 'storeengine' ),
		value: 'no_end',
	},
	{
		label: __( 'Forever', 'storeengine' ),
		value: 'forever',
	},
];


// One line of a category/product restriction (e.g. "Categories: A, B") that
// shows only the first two names by default. Two independent overflows are
// managed separately: how many items are shown is handled by the chevron
// toggle (RESTRICTION_PREVIEW_COUNT), while how long any single name can get
// is handled by `sliceString` (RESTRICTION_NAME_LENGTH) so one long name
// can't blow up the row width on its own. `items` are `{ id, name }` pairs
// from the `restriction_labels` REST field, which resolves the raw id meta
// server-side.
const RESTRICTION_PREVIEW_COUNT = 2;
const RESTRICTION_NAME_LENGTH = 20;

const RestrictionGroup = ( { label, items } ) => {
	const [ expanded, setExpanded ] = useState( false );

	if ( ! items?.length ) {
		return null;
	}

	const hasMore = items.length > RESTRICTION_PREVIEW_COUNT;
	const visibleItems = expanded
		? items
		: items.slice( 0, RESTRICTION_PREVIEW_COUNT );
	const fullNames = visibleItems.map( ( item ) => item.name ).join( ', ' );
	// Collapsed: slice each name so a long one can't blow up the row.
	// Expanded: the user explicitly asked to see everything, so show full names.
	const visibleNames = expanded
		? fullNames
		: visibleItems
				.map( ( item ) => sliceString( item.name, RESTRICTION_NAME_LENGTH ) )
				.join( ', ' );

	return (
		<p
			className="storeengine-m-0 storeengine-coupon-duration__row storeengine-coupon-restriction__row"
			title={ fullNames }
		>
			<span className="storeengine-title">{ label }</span>
			<span className="storeengine-coupon-restriction__value storeengine-sub-title">
				{ visibleNames }
			</span>
			{ hasMore && (
				<button
					type="button"
					className="storeengine-coupon-restriction__toggle"
					onClick={ () => setExpanded( ( prev ) => ! prev ) }
					aria-label={
						expanded
							? __( 'Show fewer', 'storeengine' )
							: sprintf(
									// translators: %d: number of additional hidden items.
									__( 'Show %d more', 'storeengine' ),
									items.length - RESTRICTION_PREVIEW_COUNT
							  )
					}
				>
					<span
						className={ `storeengine-icon storeengine-icon--arrow-down storeengine-coupon-restriction__toggle-icon${
							expanded
								? ' storeengine-coupon-restriction__toggle-icon--open'
								: ''
						}` }
						aria-hidden={ true }
					/>
				</button>
			) }
		</p>
	);
};

// Shared by the Coupon column (nested under the coupon name/code) — the
// coupon's time window, or a "Forever" / "Never expires" badge when open-ended.
const renderTimeDuration = ( meta = {} ) => {
	const start = meta._storeengine_coupon_start_date_time;
	const end = meta._storeengine_coupon_end_date_time;

	// No time window configured at all — the coupon is open-ended by
	// choice, not by an unset end date.
	if ( meta._storeengine_coupon_time_type !== 'set_time_limit' ) {
		return (
			<span className="storeengine-coupon-duration__badge storeengine-coupon-duration__badge--muted">
				{ __( 'Forever', 'storeengine' ) }
			</span>
		);
	}

	const formatWhen = ( date, time ) => {
		if ( ! date ) {
			return null;
		}
		const day = moment( date ).format( 'MMM DD, YYYY' );
		return time ? `${ day } ${ time }` : day;
	};

	const startLabel = formatWhen( start?.date, start?.time );
	const hasEnd = !! end?.date;
	const endLabel = formatWhen( end?.date, end?.time );
	const isExpired =
		hasEnd &&
		moment(
			`${ end.date } ${ end.time || '00:00' }`,
			'YYYY-MM-DD HH:mm'
		).isBefore( moment() );

	return (
		<div className="storeengine-coupon-duration">
			{ startLabel && (
				<p className="storeengine-m-0 storeengine-coupon-duration__row">
					<span className="storeengine-coupon-duration__label">
						{ __( 'Start:', 'storeengine' ) }
					</span>{ ' ' }
					{ startLabel }
				</p>
			) }

			{ hasEnd ? (
				<p className="storeengine-m-0 storeengine-coupon-duration__row">
					<span className="storeengine-coupon-duration__label">
						{ __( 'End:', 'storeengine' ) }
					</span>{ ' ' }
					{ endLabel }
					{ isExpired && (
						<span className="storeengine-coupon-duration__badge storeengine-coupon-duration__badge--danger">
							{ __( 'Expired', 'storeengine' ) }
						</span>
					) }
				</p>
			) : (
				<span
					className="storeengine-coupon-duration__badge storeengine-coupon-duration__badge--warning"
					title={ __(
						'This coupon has no end date and will never expire.',
						'storeengine'
					) }
				>
					{ __( 'Never expires', 'storeengine' ) }
				</span>
			) }
		</div>
	);
};

// Categories and Products share one column. Each of the four possible lists
// (include/exclude categories, include/exclude products) renders as its own
// RestrictionGroup row, previewing 2 names with a toggle to expand the rest.
const renderRestrictionsCell = ( restriction ) => {
	const {
		include_categories: includeCategories,
		exclude_categories: excludeCategories,
		include_products: includeProducts,
		exclude_products: excludeProducts,
	} = restriction ?? {};

	const hasAnyRestriction =
		includeCategories?.length ||
		excludeCategories?.length ||
		includeProducts?.length ||
		excludeProducts?.length;

	if ( ! hasAnyRestriction ) {
		return (
			<span className="storeengine-coupon-duration__badge storeengine-coupon-duration__badge--muted">
				{ __( 'All products & categories', 'storeengine' ) }
			</span>
		);
	}

	return (
		<div className="storeengine-coupon-duration storeengine-coupon-restriction">
			<RestrictionGroup
				label={ __( 'Categories:', 'storeengine' ) }
				items={ includeCategories }
			/>
			<RestrictionGroup
				label={ __( 'Exclude categories:', 'storeengine' ) }
				items={ excludeCategories }
			/>
			<RestrictionGroup
				label={ __( 'Products:', 'storeengine' ) }
				items={ includeProducts }
			/>
			<RestrictionGroup
				label={ __( 'Exclude products:', 'storeengine' ) }
				items={ excludeProducts }
			/>
		</div>
	);
};

const CouponsTable = () => {
	const coupons = useSelector( ( state ) => state.coupons );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState(
		! coupons?.data?.length
	);
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ confirm, setConfirm ] = useState( false );
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );

	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();
	const couponStatus = location.getValue(
		'status',
		'all',
		tabOptions.map( ( i ) => i.value )
	);
	const { perPage: screenPerPage } = useScreenOptions( 'coupons' );
	const perPage = location.getValue( 'perPage', screenPerPage || 10 );
	const searchText = location.getValue( 'search', '' );
	const urlPage = Math.max( 1, location.getValue( 'page_no', 1 ) );

	// Advanced filters + saved views (URL: filters, view).
	const navigateWith = ( extra, { keepPage = false } = {} ) =>
		navigate(
			prepare_admin_route_path( 'coupons', {
				status: couponStatus,
				page: keepPage ? urlPage : 1,
				per_page: perPage,
				search: searchText,
				...extra,
			} )
		);
	const {
		filtersRaw,
		viewId,
		groups: filterGroups,
		toolbar: filterToolbar,
		chips: filterChips,
	} = useListFilters( {
		screen: 'coupons',
		fields: couponFilterFields,
		location,
		navigateWith,
	} );

	const handleNavigate = (
		status = 'all',
		page = 1,
		per_page = 10,
		search = ''
	) => {
		navigate(
			prepare_admin_route_path( 'coupons', {
				status,
				page,
				per_page,
				search,
				filters: filtersRaw,
				view: filtersRaw ? viewId : '',
			} )
		);
	};

	const handleTableDataFetch = async (
		status = 'all',
		page = 1,
		itemPerPage = 10,
		searchText = '',
		filters = ''
	) => {
		await dispatch(
			fetchAllCoupons( {
				status,
				page,
				per_page: itemPerPage,
				search: searchText,
				filters,
			} )
		);
	};

	const handleEditAction = ( row ) => {
		navigate(
			get_route_path( {
				page: 'storeengine-coupons',
				id: row.id,
				action: 'edit',
			} )
		);
	};

	const handleItemsPage = ( itemsPerPage = 10, page = 1 ) => {
		handleNavigate( couponStatus, page, itemsPerPage, searchText );
	};

	useEffect( () => {
		( async () => {
			setDataFetchingStatus( true );
			if (
				coupons?.data.length <= 1 ||
				couponStatus !== coupons.status ||
				perPage !== coupons.rowsPerPage ||
				urlPage !== coupons.page ||
				searchText !== coupons.search ||
				filtersRaw !== ( coupons.filters || '' )
			) {
				await handleTableDataFetch(
					couponStatus,
					urlPage ?? 1,
					perPage,
					searchText,
					filtersRaw
				);
			}
			setDataFetchingStatus( false );
		} )();
	}, [ couponStatus, urlPage, perPage, searchText, filtersRaw ] );

	const handlePageChange = async ( page = 1, itemPerPage = 10 ) => {
		handleNavigate( couponStatus, page, itemPerPage, searchText );
	};

	// Coupons delete permanently (no trash). The bulk action mirrors the
	// per-row Delete and always warns that it cannot be undone.
	const snackbarOptions = [
		{
			suffix: 'delete',
			label: __( 'Delete Permanently', 'storeengine' ),
			onClick: () =>
				setSnackbarOption( {
					value: 'delete',
					message: __(
						'Are you sure you want to permanently delete these coupons? This cannot be undone.',
						'storeengine'
					),
				} ),
		},
	];

	const handleReset = () => {
		setSelectedItems( [] );
		setSnackbarOption( {} );
		setResetSelectedItems( true );
		setConfirm( false );
	};

	const snackbarActionHandler = async () => {
		for ( const item of selectedItems ) {
			await dispatch( deleteCoupon( { ID: item.id ? item.id : item.ID } ) );
		}

		handleReset();
	};

	useMemo( () => {
		( async () => {
			if ( confirm ) {
				await snackbarActionHandler();
			} else {
				handleReset();
			}
		} )();
	}, [ confirm ] );

	const deleteHandler = async ( item ) => {
		if (
			window.confirm(
				__(
					'Are you sure you want to permanently delete this coupon? This cannot be undone.',
					'storeengine'
				)
			)
		) {
			await dispatch( deleteCoupon( { ID: item.id ? item.id : item.ID } ) );
		}
	};

	const statusHandler = ( row ) => async ( itemStatus ) => {
		await dispatch(
			updateCoupon( { id: row.id, formData: { status: itemStatus } } )
		);
	};

	const columns = [
		{
			name: __( 'Coupon', 'storeengine' ),
			suffix: 'title',
			cell: ( { id, title, meta } ) => {
				const coupon = meta?._storeengine_coupon_name;
				// `raw` exists only in edit context; `rendered` is returned in
				// view context. Fall back so the name shows under either.
				const displayTitle = title?.raw ?? title?.rendered ?? '';
				return (
					<div className="flex flex-col items-start gap-1.5">
						<Link
							to={ get_route_path( {
								page: 'storeengine-coupons',
								id,
								action: 'edit',
							} ) }
							className="storeengine-coupon-item-label"
						>
							<span
								dangerouslySetInnerHTML={ {
									__html: displayTitle,
								} }
							/>
						</Link>
						{ coupon && (
							<Button
								preset="outline"
								size="xs"
								icon="storeengine-icon--copy"
								className="uppercase"
								onClick={ () => {
									copyToClipboard( coupon );
									// translators: %s: Coupon code
									dispatch(
										showNotification( {
											message: sprintf(
												__(
													'Coupon code "%s" copied to clipboard',
													'storeengine'
												),
												coupon
											),
											isShow: true,
											type: 'success',
										} )
									);
								} }
							>
								<span className="block max-w-[10.4em] overflow-hidden text-ellipsis whitespace-nowrap">
									{ coupon }
								</span>
							</Button>
						) }
					</div>
				);
			},
		},
		{
			name: __( 'Offer', 'storeengine' ),
			cell: ( row ) => {
				const type = row?.meta?._storeengine_coupon_type;
				const meta = row?.meta ?? {};

				let content;
				if ( type === 'percentage' ) {
					content = sprintf(
						// translators: %.2f Coupon discount percentage.
						_x( '%.2f%%', 'Coupon percentage amount', 'storeengine' ),
						meta._storeengine_coupon_amount || 0
					);
				} else if ( type === 'freeShipping' ) {
					content = __( 'Free Shipping', 'storeengine' );
				} else {
					content = (
						<Currency value={ meta._storeengine_coupon_amount || 0 } />
					);
				}

				// Add-on discount types describe themselves — an add-on returns
				// its own summary string for the types it owns.
				content = applyFilters(
					'storeengine.coupon_editor.offer_summary',
					content,
					{ type, meta, row }
				);

				const usageLimitText = sprintf(
					'%s / %s',
					meta._storeengine_coupon_usage_count ?? 0,
					! meta._storeengine_coupon_usage_limit
						? '∞'
						: meta._storeengine_coupon_usage_limit
				);

				return (
					<div className="storeengine-coupon-duration">
						<p className="price-cell storeengine-m-0 storeengine-coupon-duration__row">
							<span className="price-cell--currency">
								{ content }
							</span>
						</p>
						<p className="storeengine-m-0 storeengine-coupon-duration__row">
							<span className="storeengine-coupon-duration__label">
								{ __( 'Usage:', 'storeengine' ) }
							</span>{ ' ' }
							{ usageLimitText }
						</p>
					</div>
				);
			},
		},
		{
			name: __( 'Time duration', 'storeengine' ),
			cell: ( row ) => renderTimeDuration( row?.meta ),
		},
		{
			name: __( 'Categories & Products', 'storeengine' ),
			width: '22%',
			cell: ( row ) => renderRestrictionsCell( row?.restriction_labels ),
		},
		{
			name: __( 'Status', 'storeengine' ),
			width: '15%',
			cell: ( row ) => {
				// Published = usable, draft = paused. The toggle flips between
				// the two and persists immediately (there is no save button in
				// the list).
				const isActive = row?.status === 'publish';
				return (
					<div className="status-cell storeengine-flex storeengine-flex-align-center storeengine-flex-justify-center storeengine-flex-gap-8">
						<Switch
							checked={ isActive }
							onChange={ ( checked ) =>
								statusHandler( row )(
									checked ? 'publish' : 'draft'
								)
							}
						/>
						<span
							className={ `storeengine-coupon-status-label storeengine-coupon-status-label--${
								isActive ? 'active' : 'inactive'
							}` }
						>
							{ isActive
								? __( 'Active', 'storeengine' )
								: __( 'Inactive', 'storeengine' ) }
						</span>
					</div>
				);
			},
		},
		{
			name: __( 'Action', 'storeengine' ),
			cell: ( row ) => {
				return (
					<div className="storeengine-table-item-control">
						<OptionMenu
							options={ [
								{
									type: 'button',
									label: (
										<span>
											{ __( 'Edit', 'storeengine' ) }
										</span>
									),
									icon: (
										<span
											className="storeengine-icon storeengine-icon--edit"
											aria-hidden={ true }
										/>
									),
									onClick: () => handleEditAction( row ),
									hasBorder: true,
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
									onClick: () => deleteHandler( row ),
								},
							] }
						/>
					</div>
				);
			},
		},
	];

	const subHeaderComponentMemo = React.useMemo( () => {
		const searchHandler = ( value ) => {
			// Back to page 1: the result set is a different one, so staying on the
			// page the merchant happened to be on lands them past its end.
			handleNavigate( couponStatus, 1, perPage, value );
		};
		const dataFetchHandler = ( itemStatus ) => {
			handleNavigate( itemStatus );
		};

		return (
			<>
				<div className="kzui-table__sub-header-actions-left">
					<div className="kzui-table-sub-header-tabs">
						{ tabOptions.map( ( item, index ) => (
							<span
								role="presentation"
								className={ `tab ${
									item?.value === couponStatus
										? 'is-active'
										: ''
								} ` }
								key={ index }
								onClick={ () => dataFetchHandler( item.value ) }
							>
								{ item.label }
							</span>
						) ) }
					</div>
				</div>
				<div className="kzui-list-table-sub-header-actions-right storeengine-list-filter-bar">
					{ filterToolbar }
					<Search
						placeholder={ __( 'Search Coupons', 'storeengine' ) }
						onSearchHandler={ searchHandler }
						defaultValue={ searchText }
					/>
				</div>
			</>
		);
		// `perPage` is read by searchHandler, so it has to invalidate the memo too —
		// otherwise a search after a rows-per-page change navigates with the old one.
	}, [ couponStatus, searchText, perPage, filterToolbar ] );

	const noDataText =
		coupons?.data?.length === 0 && ! searchText && ! filterGroups.length
			? __(
					'Please, create Coupons to see the available list here.',
					'storeengine'
			  )
			: __(
					'No matching results found. Please try a different search.',
					'storeengine'
			  );

	return (
		<Scope>
			<ListTable
				columns={ columns }
				data={ coupons?.data ?? false }
				showSubHeader={ true }
				subHeaderComponent={ subHeaderComponentMemo }
				subHeaderBelow={ filterChips }
				isRowSelectable={ true }
				showColumnFilter={ true }
				getSelectRowValue={ ( selectedRow ) => {
					setSelectedItems( selectedRow );
					setResetSelectedItems( false );
				} }
				showPagination={ coupons?.totalItems >= 10 }
				onChangePage={ handlePageChange }
				onChangeItemsPerPage={ handleItemsPage }
				totalItems={ coupons?.totalItems }
				totalRows={ coupons?.data?.length }
				dataFetchingStatus={ dataFetchingStatus }
				resetSelected={ resetSelectedItems }
				currentPageNumber={ coupons?.page ?? urlPage }
				rowsPerPage={ coupons?.rowsPerPage ? coupons?.rowsPerPage : 10 }
				noDataText={ noDataText }
				suffix="coupons"
				screenId="coupons"
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
		</Scope>
	);
};

export default CouponsTable;
