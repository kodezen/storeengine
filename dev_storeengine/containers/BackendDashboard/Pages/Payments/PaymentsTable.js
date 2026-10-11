import React, { useEffect, useMemo, useState } from 'react';
import ListTable from '@Components/ListTable';
import SubHeaderMoreTabs from '@Components/SubHeaderMoreTabs';
import Search from '@Components/Search';
import { __, _x, sprintf } from '@wordpress/i18n';
import StatusOptions from '@Components/StatusOptions';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import {
	updatePaymentStatus,
	restorePayment,
	fetchAllPayments,
	deletePayment,
	movePaymentToTrash,
} from '@Redux/Slices/paymentsSlice/paymentsSlice';
import { format_price, prepare_admin_route_path } from '@Utils/helper';
import RefundModal from './RefundModal';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Currency from '@Components/Currency';
import { useLocationQuery } from '@Hooks';
import { useListFilters } from '@Components/AdvancedFilter';
import { orderFilterFields } from '../Orders/filterFields';
import useScreenOptions from '@Hooks/useScreenOptions';
import OptionMenu from '@Components/OptionMenu';
import './styles.scss';

const statusArray = [
	{
		label: __( 'All', 'storeengine' ),
		value: 'all',
	},
	{
		label: __( 'Completed', 'storeengine' ),
		value: 'completed',
	},
	{
		label: __( 'Pending Payment', 'storeengine' ),
		value: 'pending_payment',
	},
	{
		label: __( 'Payment Confirmed', 'storeengine' ),
		value: 'payment_confirmed',
	},
	{
		label: __( 'Processing', 'storeengine' ),
		value: 'processing',
	},
	{
		label: __( 'On-hold', 'storeengine' ),
		value: 'on_hold',
	},
	{
		label: __( 'Payment Failed', 'storeengine' ),
		value: 'payment_failed',
	},
	{
		label: __( 'Refunded', 'storeengine' ),
		value: 'refunded',
	},
	{
		label: __( 'Cancelled', 'storeengine' ),
		value: 'cancelled',
	},
	// {
	// 	label: __( 'Trash', 'storeengine' ),
	// 	value: 'trash',
	// },
];

const PaymentsTable = () => {
	const payments = useSelector( ( state ) => state.payments );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState(
		! payments?.data?.length
	);
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ confirm, setConfirm ] = useState( false );
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );
	const [ selectedLabel, setSelectedLabel ] = useState(
		statusArray[ 5 ].label
	);
	const [ isExpanded, setIsExpanded ] = useState( false );

	// refund modal controls
	const [ refund, setRefund ] = useState( false );
	const [ isRefundModalOpen, setIsRefundModalOpen ] = useState( false );

	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();

	const paymentsStatus = location.getValue(
		'status',
		'all',
		statusArray.map( ( i ) => i.value )
	);
	const searchText = location.getValue( 'search', '' );
	const { perPage: screenPerPage } = useScreenOptions( 'payments' );
	const perPage = location.getValue( 'perPage', screenPerPage || payments?.itemPerPage || 10 );
	const urlPage = Math.max( 1, location.getValue( 'page_no', 1 ) );

	// Advanced filters + saved views (URL: filters, view).
	const navigateWith = ( extra, { keepPage = false } = {} ) =>
		navigate(
			prepare_admin_route_path( 'storeengine-payments', {
				status: paymentsStatus,
				page: keepPage ? urlPage : 1,
				per_page: perPage,
				search: searchText,
				...extra,
			} )
		);
	const filterFields = React.useMemo( () => orderFilterFields( statusArray, 'payments' ), [] );
	const {
		filtersRaw,
		viewId,
		groups: filterGroups,
		toolbar: filterToolbar,
		chips: filterChips,
	} = useListFilters( { screen: 'payments', fields: filterFields, location, navigateWith } );

	const handleNavigate = (
		status = '',
		page = 1,
		per_page = 10,
		search = ''
	) => {
		navigate(
			prepare_admin_route_path( 'storeengine-payments', {
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
		per_page = 10,
		search = '',
		filters = ''
	) => {
		await dispatch(
			fetchAllPayments( { status, page, per_page, search, filters } )
		);
	};

	useEffect( () => {
		( async () => {
			setDataFetchingStatus( true );
			if (
				payments?.data.length <= 1 ||
				paymentsStatus !== payments.status ||
				perPage !== payments.rowsPerPage ||
				urlPage !== payments.page ||
				searchText !== payments.search ||
				filtersRaw !== ( payments.filters || '' )
			) {
				await handleTableDataFetch(
					paymentsStatus,
					urlPage ?? 1,
					perPage,
					searchText,
					filtersRaw
				);
			}
			setDataFetchingStatus( false );
		} )();
	}, [ paymentsStatus, urlPage, perPage, searchText, filtersRaw ] );

	const handleItemsPage = async ( itemsPerPage = 10, page = 1 ) => {
		handleNavigate( paymentsStatus, page, itemsPerPage, searchText );
	};

	const handlePageChange = async ( page = 1, itemPerPage = 10 ) => {
		handleNavigate( paymentsStatus, page, itemPerPage, searchText );
	};

	// const publishAction = paymentsStatus !== 'trash' ? [
	// 			{
	// 				suffix: 'trash',
	// 				label: __( 'Trash', 'storeengine' ),
	// 				onClick: () =>
	// 					setSnackbarOption( {
	// 						value: 'trash',
	// 						message: __( 'Are you sure, you want to move these item to trash!', 'storeengine' ),
	// 					} ),
	// 			},
	// 		]
	// 		: [];
	//
	// const trashAction = paymentsStatus === 'trash' ? [
	// 			{
	// 				suffix: 'restore',
	// 				label: __( 'Restore', 'storeengine' ),
	// 				onClick: () =>
	// 					setSnackbarOption( {
	// 						value: 'restore',
	// 						message: __( 'Are you sure, you want to restore these items?', 'storeengine' ),
	// 					} ),
	// 			},
	// 			{
	// 				suffix: 'delete',
	// 				label: __( 'Delete Permanently', 'storeengine' ),
	// 				onClick: () =>
	// 					setSnackbarOption( {
	// 						value: 'delete',
	// 						message: __( 'Are you sure, you want to delete these items?', 'storeengine' ),
	// 					} ),
	// 			},
	// 		]
	// 		: [];

	// const snackbarOptions = [ ...publishAction, ...trashAction ];

	const handleReset = () => {
		setSelectedItems( [] );
		setSnackbarOption( {} );
		setResetSelectedItems( true );
		setConfirm( false );
	};

	const snackbarActionHandler = async ( option ) => {
		for ( const item of selectedItems ) {
			if ( paymentsStatus !== 'trash' && option === 'trash' ) {
				await dispatch( movePaymentToTrash( item ) );
			} else if ( option === 'restore' ) {
				await dispatch(
					restorePayment( { ...item, status: 'draft' } )
				);
			} else {
				await dispatch(
					deletePayment( { ID: item.id ? item.id : item.ID } )
				);
			}
		}
		handleReset();
	};

	useMemo( () => {
		( async () => {
			if ( confirm ) {
				await snackbarActionHandler( snackbarOption.value );
			} else {
				handleReset();
			}
		} )();
	}, [ confirm ] );

	const statusHandler = ( row ) => async ( itemStatus ) => {
		if ( 'trash' === itemStatus ) {
			await dispatch( movePaymentToTrash( row ) );
		} else {
			await dispatch(
				updatePaymentStatus( { id: row.id, status: itemStatus } )
			);
		}
	};

	const columns = [
		{
			name: __( 'Amount', 'storeengine' ),
			suffix: 'title',
			cell: ( row ) => {
				return (
					<div className="storeenging-table-title-wrap">
						<div
							className="storeengine-table-title"
							style={ {
								flexDirection: 'column',
								alignItems: 'flex-start',
							} }
						>
							{ row.refunds_total > 0 ? (
								<>
									<del aria-hidden={ true }>
										<Currency
											value={ row.total_amount }
											args={ { currency: row.currency } }
										/>
									</del>
									<span className="screen-reader-text">
										{ sprintf(
											// translators: %s. Order total amount.
											_x(
												'Original payment was: %s',
												'Order payment total.',
												'storeengine'
											),
											format_price(
												row.total_amount,
												row.currency
											)
										) }
									</span>
									<ins aria-hidden={ true }>
										<Currency
											value={
												row.total_amount -
												row.refunds_total
											}
											args={ { currency: row.currency } }
										/>
									</ins>
									<span className="screen-reader-text">
										{ sprintf(
											// translators: %s. Total refunded.
											_x(
												'Total refunded: %s',
												'Order payment refund total.',
												'storeengine'
											),
											format_price(
												row.refunds_total,
												row.currency
											)
										) }
									</span>
								</>
							) : (
								<Currency
									value={ row.total_amount }
									args={ { currency: row.currency } }
								/>
							) }
						</div>
					</div>
				);
			},
		},
		{
			name: __( 'Date', 'storeengine' ),
			cell: ( row ) => {
				const formattedDate = moment( row.date_created_gmt ).format(
					'D MMMM, YYYY'
				);
				const formattedTime = moment( row.date_created_gmt ).format(
					'hh:mm A'
				);
				return (
					<div>
						{ formattedTime }
						{ ',' } <br />
						{ formattedDate }
					</div>
				);
			},
		},
		{
			name: __( 'Method', 'storeengine' ),
			cell: ( row ) => (
				<span>
					{ row.payment_method_title
						? row.payment_method_title
						: __( 'No payment method available', 'storeengine' ) }
				</span>
			),
		},
		{
			name: __( 'Status', 'storeengine' ),
			width: '15%',
			cell: ( row ) => (
				<div className="status-cell storeengine-flex storeengine-flex-justify-center">
					<StatusOptions
						value={ row?.status }
						options={ {
							items: [
								{
									label: __(
										'Pending Payment',
										'storeengine'
									),
									value: 'pending_payment',
								},
								{
									label: __( 'Processing', 'storeengine' ),
									value: 'processing',
								},
								{
									label: __(
										'Payment Confirmed',
										'storeengine'
									),
									value: 'payment_confirmed',
								},
								{
									label: __( 'Refunded', 'storeengine' ),
									value: 'refunded',
									isDisabled: true,
								},
								{
									label: __( 'Completed', 'storeengine' ),
									value: 'completed',
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
				return (
					<OptionMenu
						options={ [
							{
								type: 'button',
								label: __( 'Refund', 'storeengine' ),
								icon: (
									<span className="storeengine-icon storeengine-icon--refund" />
								),
								onClick: () => {
									setRefund( row );
									setIsRefundModalOpen( true );
								},
								isDisabled: ! row.can_refund,
							},
						] }
					/>
				);
			},
		},
	];

	// An element (not a component defined in render), so the filter panel
	// inside keeps its state across re-renders.
	const subHeaderComponentMemo = React.useMemo( () => {
		const searchHandler = ( value ) => {
			handleNavigate( paymentsStatus, urlPage, perPage, value );
		};

		const dataFetchHandler = async ( itemStatus, itemLabel = null ) => {
			setDataFetchingStatus( true );
			handleNavigate( itemStatus );
			if ( itemLabel ) {
				setSelectedLabel( itemLabel );
			}
		};

		let firstFiveItems;
		let remainingItems;

		if ( window.innerWidth <= 1024 ) {
			firstFiveItems = statusArray.slice( 0, 2 );
			remainingItems = statusArray.slice( firstFiveItems.length );
		} else if ( window.innerWidth <= 1280 ) {
			firstFiveItems = statusArray.slice( 0, 4 );
			remainingItems = statusArray.slice( firstFiveItems.length );
		} else {
			firstFiveItems = statusArray.slice( 0, 5 );
			remainingItems = statusArray.slice( firstFiveItems.length );
		}

		return (
			<>
				<div className="kzui-table__sub-header-actions-left">
					<div className="kzui-table-sub-header-tabs">
						{ firstFiveItems.map( ( item, index ) => (
							<span
								role="presentation"
								className={ `tab ${
									item?.value === paymentsStatus
										? 'is-active'
										: ''
								}` }
								key={ index }
								onClick={ async () => {
									await dataFetchHandler( item.value );
									setSelectedLabel( item.value );
								} }
							>
								{ item.label }
							</span>
						) ) }
						<SubHeaderMoreTabs
							items={ remainingItems }
							value={ paymentsStatus }
							onSelect={ ( item ) =>
								dataFetchHandler( item.value, item.label )
							}
						/>
					</div>
				</div>
				<div className="kzui-list-table-sub-header-actions-right storeengine-list-filter-bar">
					{ filterToolbar }
					<Search
						placeholder={ __( 'Search Payment', 'storeengine' ) }
						onSearchHandler={ searchHandler }
						defaultValue={ searchText }
					/>
				</div>
			</>
		);
	}, [ paymentsStatus, searchText, filterToolbar ] );

	const noDataText = filterGroups.length
		? __( 'No payments match these filters.', 'storeengine' )
		: payments?.data?.length === 0 && ! searchText
			? __(
					'Please, create Payments to see the available list here.',
					'storeengine'
			  )
			: __(
					'No matching results found. Please try a different search.',
					'storeengine'
			  );

	return (
		<>
			<ListTable
				columns={ columns }
				data={ payments?.data ?? [] }
				showSubHeader={ true }
				subHeaderComponent={ subHeaderComponentMemo }
				subHeaderBelow={ filterChips }
				isRowSelectable={ false }
				showColumnFilter={ true }
				getSelectRowValue={ ( selectedRow ) => {
					setSelectedItems( selectedRow );
					setResetSelectedItems( false );
				} }
				showPagination={ payments?.totalItems >= 10 }
				onChangePage={ handlePageChange }
				onChangeItemsPerPage={ handleItemsPage }
				totalItems={ payments?.totalItems }
				totalRows={ payments?.data?.length }
				dataFetchingStatus={ dataFetchingStatus }
				resetSelected={ resetSelectedItems }
				currentPageNumber={ payments?.page }
				rowsPerPage={
					payments?.rowsPerPage ? payments?.rowsPerPage : 10
				}
				noDataText={ noDataText }
				suffix="payments"
				screenId="payments"
			/>

			{ isRefundModalOpen && (
				<Formik
					initialValues={ {
						...refund,
						refund_amount:
							refund.total_amount - refund.refunds_total,
						reason: '',
						refund_type: 'full',
						api_refund: !! refund.gateway_can_refund_order,
					} }
				>
					<Form>
						<RefundModal
							row={ refund }
							isOpen={ isRefundModalOpen }
							setIsOpen={ setIsRefundModalOpen }
						/>
					</Form>
				</Formik>
			) }

			{ /* { selectedItems.length > 0 && (
				<SnackbarAction
					actionButtons={ snackbarOptions }
					itemsLength={ selectedItems?.length }
					confirmHandler={ setConfirm }
					isActionSelected={ snackbarOption }
					resetHandler={ handleReset }
				/>
			) } */ }
		</>
	);
};

export default PaymentsTable;
