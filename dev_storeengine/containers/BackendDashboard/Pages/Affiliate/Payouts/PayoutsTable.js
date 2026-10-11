import React, { useEffect, useMemo, useState } from 'react';
import useScreenOptions from '@Hooks/useScreenOptions';
import ListTable from '@Components/ListTable';
import { useDispatch, useSelector } from 'react-redux';
import Search from '@Components/Search';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate } from 'react-router-dom';
import {
	updatePayout,
	fetchAllPayouts,
} from '@Redux/Slices/payoutsSlice/payoutsSlice';
import {
	getTranslatedStatus,
	prepare_admin_route_path,
	get_route_path,
} from '@Utils/helper';
import StatusOptions from '@Components/StatusOptions';
import moment from 'moment';
import Currency from '@Components/Currency';
import { useLocationQuery } from '@Hooks';

const statusArray = [
	{
		label: __( 'Pending', 'storeengine' ),
		value: 'pending',
	},
	{
		label: __( 'Completed', 'storeengine' ),
		value: 'completed',
	},
];

const PayoutsTable = () => {
	const payouts = useSelector( ( state ) => state.payouts );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState(
		! payouts?.data?.length
	);
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );

	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();

	const payoutsStatus = location.getValue(
		'status',
		'all',
		statusArray.map( ( i ) => i.value )
	);
	const { perPage: screenPerPage } = useScreenOptions( 'affiliate-payouts' );
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
				sub_path: 'payouts',
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
		itemPerPage = 10,
		searchText = ''
	) => {
		await dispatch(
			fetchAllPayouts( {
				status,
				page,
				per_page: itemPerPage,
				search: searchText,
			} )
		);
	};

	useEffect( () => {
		( async () => {
			setDataFetchingStatus( true );
			if (
				payouts?.data.length <= 1 ||
				payoutsStatus !== payouts.status ||
				perPage !== payouts.rowsPerPage ||
				urlPage !== payouts.page ||
				searchText !== payouts.search
			) {
				await handleTableDataFetch(
					payoutsStatus,
					urlPage ?? 1,
					perPage,
					searchText
				);
			}
			setDataFetchingStatus( false );
		} )();
	}, [ payoutsStatus, urlPage, perPage, searchText ] );

	const handlePageChange = async ( page = 1, per_page = 10 ) => {
		handleNavigate( payoutsStatus, page, per_page, searchText );
	};

	const handleItemsPage = async ( perPage = 10, page = 1 ) => {
		handleNavigate( payoutsStatus, page, perPage, searchText );
	};

	const statusHandler = ( row ) => async ( itemStatus ) => {
		await dispatch(
			updatePayout( { id: row?.payout_id, status: itemStatus } )
		);
	};

	const columns = [
		{
			name: __( 'ID', 'storeengine' ),
			suffix: 'title',
			cell: ( row ) => {
				return (
					<div className="storeenging-table-title-wrap">
						<div className="storeengine-table-title">
							<Link
								to={ get_route_path( {
									page: 'storeengine-affiliates',
									path: 'payouts',
									id: row.id,
									action: 'edit',
								} ) }
							>
								<p>#{ row.payout_id }</p>
							</Link>
							<a
								href={ row.link }
								target="_blank"
								rel="noreferrer"
								className="storeengine-table-title__link"
							>
								<span
									className="storeengine-icon storeengine-icon--eye"
									aria-hidden={ true }
								/>
							</a>
						</div>
					</div>
				);
			},
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
			name: __( 'Payment Method', 'storeengine' ),
			cell: ( row ) => (
				<div className="action-cell">
					<div>
						<p>{ row.payment_method }</p>
					</div>
				</div>
			),
		},
		{
			name: __( 'Amount', 'storeengine' ),
			cell: ( row ) => (
				<div className="action-cell">
					<Currency value={ row.payout_amount } />
				</div>
			),
		},
		{
			name: __( 'Transaction ID', 'storeengine' ),
			cell: ( row ) => (
				<div className="action-cell">
					<div>
						<p>{ row.transaction_id }</p>
					</div>
				</div>
			),
		},
		{
			name: __( 'Created on', 'storeengine' ),
			cell: ( row ) => (
				<div>
					{ moment( row?.created_at ).format( 'MMMM DD, YYYY' ) }
				</div>
			),
		},
		{
			name: __( 'Status', 'storeengine' ),
			cell: ( row ) => {
				return (
					<div className="status-cell storeengine-flex storeengine-flex-justify-center">
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
												'Complete',
												'storeengine'
											),
											value: 'completed',
										},
									],
								} }
								onChangeHandler={ statusHandler( row ) }
							/>
						) : (
							<span className="status-label">
								{ getTranslatedStatus( row.status ) }
							</span>
						) }
					</div>
				);
			},
		},
	];

	const noDataText =
		payouts?.data?.length === 0 && ! searchText
			? __(
					'Please, create Payouts to see the available list here.',
					'storeengine'
			  )
			: __(
					'No matching results found. Please try a different search.',
					'storeengine'
			  );

	const subHeaderComponentMemo = useMemo( () => {
		const searchHandler = ( value ) => {
			handleNavigate( payoutsStatus, urlPage, perPage, value );
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
									item?.value === payoutsStatus
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
						placeholder={ __( 'Search Payouts', 'storeengine' ) }
						onSearchHandler={ searchHandler }
						defaultValue={ searchText }
					/>
				</div>
			</>
		);
	}, [ payoutsStatus, searchText ] );

	return (
		<>
			<ListTable
				columns={ columns }
				data={ payouts?.data ?? [] }
				showSubHeader={ true }
				subHeaderComponent={ subHeaderComponentMemo }
				isRowSelectable={ true }
				showColumnFilter={ true }
				getSelectRowValue={ ( selectedRow ) => {
					setSelectedItems( selectedRow );
					setResetSelectedItems( false );
				} }
				showPagination={ payouts?.totalItems >= 10 }
				onChangePage={ handlePageChange }
				onChangeItemsPerPage={ handleItemsPage }
				totalItems={ payouts?.totalItems }
				totalRows={ payouts?.data?.length }
				dataFetchingStatus={ dataFetchingStatus }
				resetSelected={ resetSelectedItems }
				currentPageNumber={ payouts?.page }
				rowsPerPage={
					payouts?.rowsPerPage ? payouts?.rowsPerPage : perPage
				}
				noDataText={ noDataText }
				suffix="payouts"
				screenId="affiliate-payouts"
			/>
		</>
	);
};

export default PayoutsTable;
