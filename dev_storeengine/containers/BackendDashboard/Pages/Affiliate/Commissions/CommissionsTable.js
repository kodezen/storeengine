import React, { useEffect, useMemo, useState } from 'react';
import useScreenOptions from '@Hooks/useScreenOptions';
import ListTable from '@Components/ListTable';
import { useDispatch, useSelector } from 'react-redux';
import Search from '@Components/Search';
import {
	fetchAllCommission,
	updateCommission,
} from '@Redux/Slices/commissionsSlice/commissionsSlice';
import { __ } from '@wordpress/i18n';
import StatusOptions from '@Components/StatusOptions';
import { useNavigate } from 'react-router-dom';
import {
	getTranslatedStatus,
	prepare_admin_route_path,
	get_route_path,
} from '@Utils/helper';
import moment from 'moment';
import Currency from '@Components/Currency';
import { useLocationQuery } from '@Hooks';

import './styles.scss';

const statusArray = [
	{
		label: __( 'All', 'storeengine' ),
		value: 'all',
	},
	{
		label: __( 'Pending', 'storeengine' ),
		value: 'pending',
	},
	{
		label: __( 'Approved', 'storeengine' ),
		value: 'approved',
	},
	{
		label: __( 'Paid out', 'storeengine' ),
		value: 'paid',
	},
	{
		label: __( 'Rejected', 'storeengine' ),
		value: 'rejected',
	},
];

// A commission that has been paid out to the affiliate. "Paid out" (not just
// "Paid") makes clear it's the earning being disbursed, not a payment received —
// only relabelled here; the shared statusLabel map keeps "Paid" for orders.
const commissionStatusLabel = ( status ) =>
	'paid' === status
		? __( 'Paid out', 'storeengine' )
		: getTranslatedStatus( status );

const CommissionsTable = () => {
	const commissions = useSelector( ( state ) => state.commissions );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState(
		! commissions?.data?.length
	);
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );

	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();

	const commissionsStatus = location.getValue(
		'status',
		'all',
		statusArray.map( ( i ) => i.value )
	);
	const { perPage: screenPerPage } = useScreenOptions( 'commissions' );
	const perPage = location.getValue( 'perPage', screenPerPage || 10 );
	const searchText = location.getValue( 'search', '' );
	const urlPage = Math.max( 1, location.getValue( 'page_no', 1 ) );

	const handleNavigate = (
		status = 'all',
		page = 1,
		per_page = 10,
		search = ''
	) => {
		navigate(
			prepare_admin_route_path( 'affiliates', {
				sub_path: 'commissions',
				status,
				page,
				per_page,
				search,
			} )
		);
	};

	const handleTableDataFetch = async (
		status = 'all',
		page = 1,
		perPage = 10,
		search = ''
	) => {
		await dispatch(
			fetchAllCommission( { status, page, per_page: perPage, search } )
		);
	};

	useEffect( () => {
		( async () => {
			setDataFetchingStatus( true );
			if (
				commissions?.data.length <= 1 ||
				commissionsStatus !== commissions.status ||
				perPage !== commissions.rowsPerPage ||
				urlPage !== commissions.page ||
				searchText !== commissions.search
			) {
				await handleTableDataFetch(
					commissionsStatus,
					urlPage ?? 1,
					perPage,
					searchText
				);
			}
			setDataFetchingStatus( false );
		} )();
	}, [ commissionsStatus, urlPage, perPage, searchText ] );

	const handlePageChange = async ( page = 1, perPage = 10 ) => {
		handleNavigate( commissionsStatus, page, perPage, searchText );
	};

	const handleItemsPage = async ( perPage = 10, page = 1 ) => {
		handleNavigate( commissionsStatus, page, perPage, searchText );
	};

	const statusHandler = ( row ) => async ( itemStatus ) => {
		await dispatch(
			updateCommission( { id: row?.commission_id, status: itemStatus } )
		);
	};
	const columns = [
		{
			name: __( 'ID', 'storeengine' ),
			suffix: 'title',
			cell: ( row ) => (
				<div className="storeenging-table-title-wrap">
					<div className="storeengine-table-title">
						<p>#{ row?.commission_id }</p>
					</div>
				</div>
			),
		},
		{
			name: __( 'Affiliate', 'storeengine' ),
			suffix: 'title',
			cell: ( row ) => (
				<div className="">
					<p className="storeengine-m-0">{ row?.display_name }</p>
					<span>{ row?.user_email }</span>
				</div>
			),
		},
		{
			name: __( 'Date', 'storeengine' ),
			cell: ( row ) => (
				<div>
					{ moment( row?.created_at ).format( 'MMMM DD, YYYY' ) }
				</div>
			),
		},
		{
			name: __( 'Order', 'storeengine' ),
			cell: ( row ) => (
				<div>
					{ row?.order_id ? (
						<a
							href={ get_route_path( {
								page: 'storeengine-orders',
								id: row.order_id,
								action: 'edit',
							} ) }
							className="storeengine-table-title__link"
							title={ __(
								'Open this order to verify the commission',
								'storeengine'
							) }
						>
							#{ row.order_id }
						</a>
					) : (
						<p>—</p>
					) }
				</div>
			),
		},
		{
			name: __( 'Total', 'storeengine' ),
			cell: ( row ) => (
				<div className="action-cell">
					<Currency value={ row.total_amount } />
				</div>
			),
		},
		{
			name: __( 'Rate', 'storeengine' ),
			cell: ( row ) => (
				<div className="action-cell">
					<p>{ row?.commission_rate }%</p>
				</div>
			),
		},
		{
			name: __( 'Commission', 'storeengine' ),
			cell: ( row ) => (
				<div className="action-cell">
					<div>
						<p>${ row?.commission_amount }</p>
					</div>
				</div>
			),
		},
		{
			name: __( 'Status', 'storeengine' ),
			cell: ( row ) => {
				return (
					<div className='storeengine-flex storeengine-flex-justify-center'>
						{ row?.status === 'pending' ? (
							<StatusOptions
								value={ row?.status }
								options={ {
									items: [
										{
											label: __(
												'Pending',
												'storeengine'
											),
											value: 'pending',
										},
										{
											label: __(
												'Approved',
												'storeengine'
											),
											value: 'approved',
										},
										{
											label: __(
												'Paid out',
												'storeengine'
											),
											value: 'paid',
										},
										{
											label: __(
												'Rejected',
												'storeengine'
											),
											value: 'rejected',
										},
									],
								} }
								onChangeHandler={ statusHandler( row ) }
							/>
						) : (
							<span className="status-label">
								{ commissionStatusLabel( row.status ) }
							</span>
						) }
					</div>
				);
			},
		},
	];

	const noDataText =
		commissions?.data?.length === 0 && ! searchText
			? __(
					'Please, create Commissions to see the available list here.',
					'storeengine'
			  )
			: __(
					'No matching results found. Please try a different search.',
					'storeengine'
			  );

	const subHeaderComponentMemo = useMemo( () => {
		const searchHandler = ( value ) => {
			handleNavigate( commissionsStatus, urlPage, perPage, value );
		};

		const dataFetchHandler = ( itemStatus ) => {
			setDataFetchingStatus( true );
			handleNavigate( itemStatus );
		};

		return (
			<>
				<div className="kzui-table__sub-header-actions-left">
					<div className="kzui-table-sub-header-tabs">
						{ statusArray.map( ( item, index ) => (
							<span
								role="presentation"
								className={ `tab ${
									item?.value === commissionsStatus
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
				<div className="kzui-list-table-sub-header-actions-right">
					<Search
						placeholder={ __(
							'Search Commissions',
							'storeengine'
						) }
						onSearchHandler={ searchHandler }
						defaultValue={ searchText }
					/>
				</div>
			</>
		);
	}, [ commissionsStatus, searchText ] );

	return (
		<>
			<ListTable
				noDataText={ noDataText }
				columns={ columns }
				data={ commissions?.data ?? [] }
				showSubHeader={ true }
				subHeaderComponent={ subHeaderComponentMemo }
				isRowSelectable={ true }
				showColumnFilter={ true }
				getSelectRowValue={ ( selectedRow ) => {
					setSelectedItems( selectedRow );
					setResetSelectedItems( false );
				} }
				showPagination={ commissions?.totalItems >= 10 }
				onChangePage={ handlePageChange }
				onChangeItemsPerPage={ handleItemsPage }
				totalItems={ commissions?.totalItems }
				totalRows={ commissions?.data?.length }
				dataFetchingStatus={ dataFetchingStatus }
				resetSelected={ resetSelectedItems }
				currentPageNumber={ commissions?.page }
				rowsPerPage={
					commissions?.rowsPerPage
						? commissions?.rowsPerPage
						: perPage
				}
				suffix="commission"
				screenId="commissions"
			/>
		</>
	);
};

export default CommissionsTable;
