import React, { useEffect, useMemo, useState } from 'react';
import ListTable from '@Components/ListTable';
import SnackbarAction from '@Components/SnackbarAction';
import { useDispatch, useSelector } from 'react-redux';
import Search from '@Components/Search';
import { __ } from '@wordpress/i18n';
import {
	updateSubscriptionStatus,
	restoreSubscription,
	fetchAllSubscriptions,
	moveSubscriptionToTrash,
	deleteSubscription,
} from '@Redux/Slices/subscriptionSlice/subscriptionSlice';
import StatusOptions from '@Components/StatusOptions';
import { Link, useNavigate } from 'react-router-dom';
import { get_route_path, prepare_admin_route_path } from '@Utils/helper';
import OptionMenu from '@Components/OptionMenu';
import moment from 'moment';
import { useLocationQuery } from '@Hooks';
import useScreenOptions from '@Hooks/useScreenOptions';
import Gravatar from '@Components/Gravatar';
import Time from '@Components/Time';

// Mirrors SubscriptionCollection::get_subscription_statuses() on the server.
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
		label: __( 'Active', 'storeengine' ),
		value: 'active',
	},
	{
		label: __( 'On-Hold', 'storeengine' ),
		value: 'on_hold',
	},
	{
		label: __( 'Pending Cancel', 'storeengine' ),
		value: 'pending_cancel',
	},
	{
		label: __( 'Cancelled', 'storeengine' ),
		value: 'cancelled',
	},
	{
		label: __( 'Completed', 'storeengine' ),
		value: 'completed',
	},
	{
		label: __( 'Expired', 'storeengine' ),
		value: 'expired',
	},
];

const SubscriptionsTable = () => {
	const subscriptions = useSelector( ( state ) => state.subscriptions );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState( false );
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ confirm, setConfirm ] = useState( false );
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();
	const subscriptionStatus = location.getValue(
		'status',
		'all',
		statusArray.map( ( i ) => i.value )
	);
	const { perPage: screenPerPage } = useScreenOptions( 'subscriptions' );
	const perPage = location.getValue( 'perPage', screenPerPage || 10 );
	const searchText = location.getValue( 'search', '' );
	const urlPage = Math.max( 1, location.getValue( 'page_no', 1 ) );

	const handleNavigate = (
		status = '',
		page = 1,
		per_page = 10,
		search = ''
	) => {
		navigate(
			prepare_admin_route_path( 'storeengine-subscriptions', {
				status,
				page,
				per_page,
				search,
			} )
		);
	};

	const handleTableDataFetch = async (
		subscriptionStatus = 'any',
		page = 1,
		perPage = 10,
		searchText = ''
	) => {
		setDataFetchingStatus( true );
		await dispatch(
			fetchAllSubscriptions( {
				status: subscriptionStatus,
				page,
				per_page: perPage,
				search: searchText,
			} )
		);
		setDataFetchingStatus( false );
	};

	useEffect( () => {
		( async () => {
			setDataFetchingStatus( true );

			if (
				subscriptions?.data.length <= 1 ||
				subscriptionStatus !== subscriptions.status ||
				perPage !== subscriptions.rowsPerPage ||
				urlPage !== subscriptions.page ||
				searchText !== subscriptions.search
			) {
				await handleTableDataFetch(
					subscriptionStatus,
					urlPage ?? 1,
					perPage,
					searchText
				);
			}
		} )();

		setDataFetchingStatus( false );
	}, [ subscriptionStatus, urlPage, perPage, searchText ] );

	const handlePageChange = async ( itemPerPage = 10, page = 1 ) => {
		handleNavigate( subscriptionStatus, page, itemPerPage, searchText );
	};

	const handleItemsPage = async ( page = 1, itemsPerPage = 10 ) => {
		handleNavigate( subscriptionStatus, page, itemsPerPage, searchText );
	};

	const publishAction =
		subscriptionStatus !== 'Cancel'
			? [
					{
						suffix: 'trash',
						label: __( 'Archive', 'storeengine' ),
						onClick: () =>
							setSnackbarOption( {
								value: 'archive',
								message: __(
									'Are you sure, you want to move these item to archive!',
									'storeengine'
								),
							} ),
					},
			  ]
			: [];

	const trashAction =
		subscriptionStatus === 'cancel'
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
			  ]
			: [];

	const snackbarOptions = [ ...publishAction, ...trashAction ];

	const handleReset = () => {
		setSelectedItems( [] );
		setSnackbarOption( {} );
		setResetSelectedItems( true );
		setConfirm( false );
	};

	const snackbarActionHandler = async ( option ) => {
		for ( const item of selectedItems ) {
			handleReset();
			if ( subscriptionStatus !== 'cancel' && option === 'cancel' ) {
				await dispatch( moveSubscriptionToTrash( item ) );
			} else if ( option === 'restore' ) {
				await dispatch(
					restoreSubscription( { ...item, status: 'draft' } )
				);
			} else {
				await dispatch(
					deleteSubscription( { ID: item.id ? item.id : item.ID } )
				);
			}
		}
	};

	const handleEditAction = ( row ) =>
		navigate(
			get_route_path( {
				page: 'storeengine-subscriptions',
				id: row.id,
				action: 'edit',
			} )
		);

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
		await dispatch(
			updateSubscriptionStatus( {
				id: row?.id,
				status: itemStatus,
				// subscription_cotent: row?.status?.raw ?? '',
			} )
		);
	};

const COLUMNS_HIDDEN_BY_DEFAULT = [ __( 'Integrations', 'storeengine' ) ];
	const COLUMNS_LOCKED = [
		__( 'Order Number', 'storeengine' ),
		__( 'Action', 'storeengine' ),
	];
	const columns = [
		{
			name: __( 'Order Number', 'storeengine' ),
			cell: ( row ) => {
				return (
					<Link
						to={ get_route_path( {
							page: 'storeengine-subscriptions',
							id: row.id,
							action: 'edit',
						} ) }
						className="order-details"
					>
						#{ row.id }
					</Link>
				);
			},
		},
		{
			name: __( 'Customer Details', 'storeengine' ),
			suffix: 'title',
			className: 'nobr',
			cell: ( row ) => (
				<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-4">
					<Gravatar
						hash={ row?.email_hash }
						size={ 30 }
						alt={ row?.customer_name }
						style={ { borderRadius: '50%' } }
					/>
					<div>
						<p className="storeengine-title">
							{ row?.customer_name || __( 'N/A', 'storeengine' ) }
						</p>
						<p className="storeengine-sub-title-light">
							{ row?.customer_email ||
								__( 'N/A', 'storeengine' ) }
						</p>
					</div>
				</div>
			),
		},
		{
			name: __( 'Plan', 'storeengine' ),
			cell: ( row ) => (
				<div
					role="presentation"
					dangerouslySetInnerHTML={ { __html: row?.price_structure } }
				></div>
			),
		},
		{
			name: __( 'Date', 'storeengine' ),
			cell: ( row ) => (
				<Time
					dateTime={ row?.date_created_gmt }
					fallback={ __( 'N/A', 'storeengine' ) }
					format={ 'hh:mm A[<br>]Do MMMM, YYYY' }
				/>
			),
		},
		{
			name: __( 'Integrations', 'storeengine' ),
			cell: ( row ) => (
				<div className="storeengine-column-items">
					{ Array.isArray( row?.integrations ) &&
					row.integrations.length > 0 ? (
						row.integrations.map( ( integration, idx ) => (
							<>
								<div
									className="storeengine-flex"
									style={ { gap: '5px' } }
									key={ idx }
								>
									{ integration?.provider_logo && (
										<img
											width={ 20 }
											height={ 20 }
											src={ integration.provider_logo }
											alt={ integration.provider_label }
										/>
									) }
									<span>{ integration?.details }</span>
								</div>
							</>
						) )
					) : (
						<span>...</span>
					) }
				</div>
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
									label: __( 'Active', 'storeengine' ),
									value: 'active',
								},
								{
									label: __( 'Pending', 'storeengine' ),
									value: 'pending',
								},
								{
									label: __( 'On-Hold', 'storeengine' ),
									value: 'on_hold',
								},
								{
									label: __( 'Cancelled', 'storeengine' ),
									value: 'cancelled',
								},
							],
						} }
						onChangeHandler={ async ( itemStatus ) => {
							const data = { ...row, status: itemStatus };
							await dispatch(
								updateSubscriptionStatus( {
									id: data.id,
									formData: data,
								} )
							);
						} }
					/>
				</div>
			),
		},
		{
			name: __( 'Action', 'storeengine' ),
			cell: ( row ) => (
				<div className="action-cell">
					<OptionMenu
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
						] }
					/>
				</div>
			),
		},
	];

	const subHeaderComponentMemo = useMemo( () => {
		const searchHandler = async ( value ) => {
			handleNavigate( subscriptionStatus, urlPage, perPage, value );
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
									item?.value === subscriptionStatus
										? 'is-active'
										: ''
								} ` }
								key={ index }
								onClick={ () =>
									dataFetchHandler( item?.value )
								}
							>
								{ item.label }
							</span>
						) ) }
					</div>
				</div>

				<div className="kzui-list-table-sub-header-actions-right">
					<Search
						placeholder={ __(
							'Search Subscription',
							'storeengine'
						) }
						onSearchHandler={ searchHandler }
					/>
				</div>
			</>
		);
	}, [ subscriptionStatus ] );

	return (
		<React.Fragment>
			<ListTable
				columns={ columns.map( ( column ) => ( {
					...column,
					defaultHidden: COLUMNS_HIDDEN_BY_DEFAULT.includes(
						column.name
					),
					locked: COLUMNS_LOCKED.includes( column.name ),
				} ) ) }
				data={ subscriptions?.data ?? [] }
				showSubHeader={ true }
				subHeaderComponent={ subHeaderComponentMemo }
				isRowSelectable={ false }
				showColumnFilter={ true }
				getSelectRowValue={ ( selectedRow ) => {
					setSelectedItems( selectedRow );
					setResetSelectedItems( false );
				} }
				noDataText={ __(
					'No subscription data is available to see the list here.',
					'storeengine'
				) }
				showPagination={ subscriptions?.totalItems >= 10 }
				onChangePage={ handlePageChange }
				onChangeItemsPerPage={ handleItemsPage }
				totalItems={ subscriptions?.totalItems }
				totalRows={ subscriptions?.data?.length }
				dataFetchingStatus={ dataFetchingStatus }
				resetSelected={ resetSelectedItems }
				currentPageNumber={ subscriptions?.currentPage }
				rowsPerPage={
					subscriptions?.rowsPerPage ? subscriptions?.rowsPerPage : 10
				}
				suffix="subscriptions"
				screenId="subscriptions"
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

export default SubscriptionsTable;
