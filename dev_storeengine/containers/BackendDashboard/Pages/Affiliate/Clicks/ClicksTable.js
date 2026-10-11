import React, { useEffect, useState } from 'react';
import useScreenOptions from '@Hooks/useScreenOptions';
import ListTable from '@Components/ListTable';
import SnackbarAction from '@Components/SnackbarAction';
import { useDispatch, useSelector } from 'react-redux';
import Search from '@Components/Search';
import {
	updateClick,
	fetchAllClicks,
	deleteClick,
	restoreClick,
} from '@Redux/Slices/clicksSlice/clicksSlice';
import { sprintf, __ } from '@wordpress/i18n';
import StatusOptions from '@Components/StatusOptions';
import { Link, useNavigate } from 'react-router-dom';
import { get_route_path, prepare_admin_route_path } from '@Utils/helper';
import OptionMenu from '@Components/OptionMenu';
import moment from 'moment';
import { useLocationQuery } from '@Hooks';

const ClicksTable = () => {
	const affiliates = useSelector( ( state ) => state.affiliates );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState( false );
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ confirm, setConfirm ] = useState( false );
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const location = useLocationQuery();
	const affiliatesStatus = location.getValue( 'status', 'all' );
	const { perPage: screenPerPage } = useScreenOptions( 'clicks' );
	const perPage = location.getValue( 'perPage', screenPerPage || 10 );
	const searchText = location.getValue( 'search', '' );
	const currentPage = Math.max( 1, location.getValue( 'page_no', 1 ) );
	const [ status, setStatus ] = useState( affiliatesStatus );

	const handleNavigate = (
		status = 'all',
		page = 1,
		per_page = 10,
		search = ''
	) => {
		navigate(
			prepare_admin_route_path( 'affiliates', {
				sub_path: 'clicks',
				status,
				page,
				per_page,
				search,
			} )
		);
	};

	const handleTableDataFetch = async ( page = 1, per_page = 10 ) => {
		setDataFetchingStatus( true );
		await dispatch(
			fetchAllClicks( {
				status: affiliatesStatus,
				page,
				per_page,
				search: searchText,
			} )
		);
		setDataFetchingStatus( false );
	};

	useEffect( () => {
		( async () => {
			if (
				! affiliates.data ||
				( affiliates.data && affiliates.data.length <= 1 )
			) {
				await handleTableDataFetch();
			}
		} )();
	}, [ status ] );

	useEffect( () => {
		handleNavigate( affiliatesStatus, currentPage, perPage, searchText );
	}, [ affiliatesStatus, currentPage, perPage, searchText ] );

	const handlePageChange = async ( page = 1 ) => {
		await handleTableDataFetch( page, perPage );
	};

	const handleItemsPage = async ( per_page = 10, page = 1 ) => {
		await handleTableDataFetch( page, per_page );
		handleNavigate( status, page, per_page, searchText );
	};

	const publishAction =
		status !== 'trash'
			? [
					{
						suffix: 'trash',
						label: __( 'Trash', 'storeengine' ),
						suffix: 'trash',
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
		status === 'trash'
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

	const snackbarOptions = [ ...publishAction, ...trashAction ];

	const handleReset = () => {
		setSelectedItems( [] );
		setSnackbarOption( {} );
		setResetSelectedItems( true );
		setConfirm( false );
	};

	const snackbarActionHandler = async ( option ) => {
		for ( const item of selectedItems ) {
			if ( status !== 'trash' && option === 'trash' ) {
				await dispatch(
					updateClick( {
						id: item.id ? item.id : item.ID,
						formData: {
							...item,
							status: 'trash',
							product_content: item?.coupon_content?.raw ?? '',
						},
					} )
				);
			} else if ( option === 'restore' ) {
				await dispatch( restoreClick( { ...item, status: 'draft' } ) );
			} else {
				await dispatch(
					deleteClick( { ID: item.id ? item.id : item.ID } )
				);
			}
		}
		handleReset();
	};

	const handleEditAction = ( row ) =>
		navigate(
			get_route_path( {
				page: 'storeengine-affiliates',
				path: 'clicks',
				id: row.id,
				action: 'edit',
			} )
		);

	const handleViewAction = ( row ) => window.open( row.link, '_blank' );

	React.useMemo( () => {
		( async () => {
			if ( confirm ) {
				await snackbarActionHandler( snackbarOption.value );
			} else {
				handleReset();
			}
		} )();
	}, [ confirm ] );

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

	const statusHandler = ( row ) => async ( itemStatus ) => {
		await dispatch(
			updateClick( {
				id: row.id,
				formData: {
					...row,
					status: itemStatus,
					coupon_content: row?.status?.raw ?? '',
				},
			} )
		);
	};

	const columns = [
		{
			name: __( 'Title', 'storeengine' ),
			cell: ( row ) => {
				return (
					<div className="storeenging-table-title-wrap">
						<div className="storeengine-table-title">
							<Link
								to={ get_route_path( {
									page: 'storeengine-affiliates',
									path: 'clicks',
									id: row.id,
									action: 'edit',
								} ) }
							>
								<p>#{ row.affiliate_id }</p>
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
						<div className="storeengine-table-sub-title">
							<div className="storeengine-table-sub-title__item">
								{ sprintf(
									// translators: %s. Affiliate code.
									__( 'Code: %s', 'storeengine' ),
									row.affiliate_code
								) }
							</div>
						</div>
					</div>
				);
			},
		},
		{
			name: __( 'Publish Date', 'storeengine' ),
			cell: ( row ) => (
				<p className="storeengine-m-0">
					<span className="">
						{ moment( row.created_at ).format( 'D MMMM, YYYY' ) }
					</span>
					<br />
					<span className="">{ row.created_at }</span>
				</p>
			),
		},
		{
			name: __( 'Type', 'storeengine' ),
			cell: ( row ) => (
				<div>
					<p>
						{ row.commission_rate } - { row.commission_type }
					</p>
				</div>
			),
		},
		{
			name: __( 'Status', 'storeengine' ),
			cell: ( row ) => {
				return (
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
				);
			},
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
							{
								type: 'button',
								label: __( 'View', 'storeengine' ),
								icon: (
									<span
										className="storeengine-icon storeengine-icon--eye"
										aria-hidden={ true }
									/>
								),
								onClick: () => handleViewAction( row ),
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
								onClick: () =>
									dispatch(
										deleteClick( {
											ID: row.id ? row.id : row.ID,
										} )
									),
							},
						] }
					/>
				</div>
			),
		},
	];

	const subHeaderComponentMemo = React.useMemo( () => {
		const searchHandler = ( value ) => {
			setDataFetchingStatus( true );
			dispatch(
				fetchAllClicks( {
					status: 'all',
					page: 1,
					per_page: 10,
					search: value,
				} )
			).then( () => {
				setDataFetchingStatus( false );
				handleNavigate( affiliatesStatus, perPage, value );
			} );
		};

		const dataFetchHandler = ( itemStatus ) => {
			setDataFetchingStatus( true );
			handleNavigate( itemStatus );
			dispatch(
				fetchAllClicks( {
					status: itemStatus,
					page: 1,
					per_page: perPage,
				} )
			).then( () => {
				setDataFetchingStatus( false );
			} );
		};

		return (
			<>
				<div className="kzui-table__sub-header-actions-left">
					<div className="kzui-table-sub-header-tabs">
						{ statusArray.map( ( item, index ) => (
							<span
								role="presentation"
								className={ `tab ${
									item?.value === status ? 'is-active' : ''
								} ` }
								key={ index }
								onClick={ () => {
									setStatus( item.value );
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
						placeholder={ __( 'Search Clicks', 'storeengine' ) }
						onSearchHandler={ searchHandler }
						defaultValue={ searchText }
					/>
				</div>
			</>
		);
	}, [ status ] );

	return (
		<>
			<ListTable
				columns={ columns }
				data={ affiliates?.data ?? [] }
				showSubHeader={ true }
				subHeaderComponent={ subHeaderComponentMemo }
				isRowSelectable={ true }
				showColumnFilter={ true }
				getSelectRowValue={ ( selectedRow ) => {
					setSelectedItems( selectedRow );
					setResetSelectedItems( false );
				} }
				showPagination={ affiliates?.totalItems >= 10 }
				onChangePage={ handlePageChange }
				onChangeItemsPerPage={ handleItemsPage }
				totalItems={ affiliates?.totalItems }
				totalRows={ affiliates?.data?.length }
				dataFetchingStatus={ dataFetchingStatus }
				resetSelected={ resetSelectedItems }
				rowsPerPage={
					affiliates?.rowsPerPage ? affiliates?.rowsPerPage : perPage
				}
				suffix="clicksTable"
				screenId="clicks"
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
		</>
	);
};

export default ClicksTable;
