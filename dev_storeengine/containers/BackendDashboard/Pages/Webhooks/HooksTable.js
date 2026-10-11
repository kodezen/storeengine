import React, { useState, useEffect, useRef } from 'react';
import useScreenOptions from '@Hooks/useScreenOptions';
import { useDispatch, useSelector } from 'react-redux';
import SnackbarAction from '@Components/BulkAction/SnackbarAction';
import ListTable from '@Components/ListTable';
import Search from '@Components/Search';
import { __, sprintf } from '@wordpress/i18n';
import StatusOptions from '@Components/StatusOptions';
import moment from 'moment';
import {
	updateHooksStatus,
	deleteHooks,
	fetchAllHooks,
	updateHooksItemPerPage,
	updateHooksCurrentPage,
} from '@Redux/Slices/webHookSlice/webHookSlice';
import OptionMenu from '@Components/OptionMenu';
import { sliceString, prepare_admin_route_path } from '@Utils/helper';
import { useNavigate } from 'react-router-dom';
import { useLocationQuery } from '@Hooks';
import {
	webhookStatus,
	getEventColorSlug,
	formatEventLabel,
} from './HooksModal/helper';

const HooksTable = ( { modalOpenHandler } ) => {
	const hooks = useSelector( ( state ) => state.webHooks );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ confirm, setConfirm ] = useState( false );
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const dispatch = useDispatch();

	const navigate = useNavigate();
	const location = useLocationQuery();
	const hookStatus = location.getValue( 'status', 'all', [
		'all',
		...webhookStatus.map( ( i ) => i.value ),
	] );
	const { perPage: screenPerPage } = useScreenOptions( 'outgoing-webhooks' );
	const perPage = location.getValue( 'perPage', screenPerPage || hooks?.itemPerPage || 10 );
	const searchText = location.getValue( 'search', '' );
	const urlPage = Math.max( 1, location.getValue( 'page_no', 1 ) );
	const [ status, setStatus ] = useState( hookStatus );
	const isFirstRender = useRef( true );

	const handleNavigate = (
		status = '',
		page = 1,
		per_page = 10,
		search = ''
	) => {
		navigate(
			prepare_admin_route_path( 'storeengine-webhooks', {
				status,
				page,
				per_page,
				search,
			} )
		);
	};

	// Table data fetch
	const handleTableDataFetch = async (
		status = 'all',
		page = 1,
		itemPerPage = 10,
		searchText = ''
	) => {
		setDataFetchingStatus( true );
		await dispatch(
			fetchAllHooks( {
				status,
				page,
				per_page: itemPerPage,
				search: searchText,
			} )
		);
		setDataFetchingStatus( false );
	};

	// Sync URL params to the slice, then fetch — but reuse cached rows on the
	// first render of a (re)mount when the list is already populated. After that
	// first render, always refetch when status/page/perPage/search change.
	useEffect( () => {
		( async () => {
			setStatus( hookStatus );
			dispatch( updateHooksCurrentPage( urlPage ) );
			dispatch( updateHooksItemPerPage( perPage ) );

			const hasCache = hooks?.data?.length > 1;
			if ( ! isFirstRender.current || ! hasCache ) {
				await handleTableDataFetch(
					hookStatus,
					urlPage,
					perPage,
					searchText
				);
			}
			isFirstRender.current = false;
		} )();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ hookStatus, urlPage, perPage, searchText ] );

	const handleReset = () => {
		setSelectedItems( [] );
		setSnackbarOption( {} );
		setResetSelectedItems( true );
		setConfirm( false );
	};

	const publishAction =
		status !== 'trash'
			? [
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
	const snackbarOptions = [ ...publishAction ];

	const snackbarActionHandler = () => {
		selectedItems.forEach( ( item ) =>
			dispatch( deleteHooks( { ID: item.id ? item.id : item.ID } ) )
		);
		handleReset();
	};

	React.useMemo( () => {
		if ( confirm ) {
			snackbarActionHandler();
		} else {
			handleReset();
		}
	}, [ confirm ] );

	// Pagination
	const handlePageChange = async ( page = 1, itemPerPage = 10 ) => {
		dispatch( updateHooksCurrentPage( page ) );
		await handleTableDataFetch( status, page, itemPerPage, searchText );
		handleNavigate( status, page, itemPerPage, searchText );
	};

	// Total items
	const handleItemsPage = async ( itemsPerPage = 10, page = 1 ) => {
		dispatch( updateHooksItemPerPage( itemsPerPage ) );
		await handleTableDataFetch( status, page, itemsPerPage, searchText );
		handleNavigate( status, page, itemsPerPage, searchText );
	};

	const deleteHandler = ( item ) => {
		if (
			window.confirm(
				__(
					'Are you sure you want to delete this hook?',
					'storeengine'
				)
			)
		) {
			dispatch( deleteHooks( { ID: item.id ? item.id : item.ID } ) );
		}
	};

	const columns = [
		{
			name: __( 'Title', 'storeengine' ),
			suffix: 'title',
			cell: ( row ) => {
				return (
					<div className="storeengine-table-title-wrap">
						<div
							className="storeengine-table-title"
							onClick={ () => modalOpenHandler( row ) }
							role="presentation"
						>
							<span
								className="storeengine-table-title"
								dangerouslySetInnerHTML={ {
									__html: sliceString( row.title?.raw ?? row.title?.rendered ),
								} }
							/>
						</div>
						<div className="storeengine-table-sub-title">
							<div className="storeengine-table-sub-title__item">
								{
									// translators: %d. Object ID.
									sprintf(
										__( 'ID: %d', 'storeengine' ),
										row.id
									)
								}
							</div>
						</div>
					</div>
				);
			},
		},
		{
			name: __( 'Events', 'storeengine' ),
			cell: ( {
				meta: { _storeengine_webhook_events: events = [] },
			} ) =>
				events && events.length ? (
					<div className="storeengine-webhook-events">
						{ events.map( ( value ) => (
							<span
								key={ value }
								className={ `storeengine-webhook-event-badge storeengine-webhook-event-badge--${ getEventColorSlug(
									value
								) }` }
							>
								{ formatEventLabel( value ) }
							</span>
						) ) }
					</div>
				) : (
					<span className="storeengine-webhook-events__na">
						{ __( 'N/A', 'storeengine' ) }
					</span>
				),
		},
		{
			name: __( 'Delivery URL', 'storeengine' ),

			cell: ( row ) => {
				return (
					<>
						<span>
							{ sliceString(
								row?.meta?._storeengine_webhook_delivery_url,
								20
							) }
						</span>
					</>
				);
			},
		},
		{
			name: __( 'Date', 'storeengine' ),

			cell: ( row ) => (
				<div>
					<span>
						{ moment( row.date ).format( 'MMMM DD, YYYY' ) }
					</span>
					<br />
					<span className="storeengine-table-time">
						{ moment( row.date ).format( 'h:mm A' ) }
					</span>
				</div>
			),
		},
		{
			name: __( 'Status', 'storeengine' ),
			width: '15%',
			cell: ( row ) => {
				const hooksStatusHandler = ( itemStatus ) => {
					const data = { ...row, status: itemStatus };
					dispatch( updateHooksStatus( data ) );
				};
				return (
					<div className='storeengine-flex storeengine-flex-justify-center'>
						<StatusOptions
							value={ row?.status }
							options={ { items: webhookStatus } }
							onChangeHandler={ hooksStatusHandler }
						/>
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
									label: __( 'Edit', 'storeengine' ),
									hasBorder: true,
									icon: (
										<span
											className="storeengine-icon storeengine-icon--edit"
											aria-hidden={ true }
										/>
									),
									onClick: () => modalOpenHandler( row ),
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
		const searchHandler = async ( value ) => {
			setDataFetchingStatus( true );
			await dispatch(
				fetchAllHooks( {
					status,
					page: 1,
					per_page: perPage,
					search: value,
				} )
			);
			handleNavigate( hookStatus, 1, perPage, value );
			setDataFetchingStatus( false );
		};

		const dataFetchHandler = async ( itemStatus ) => {
			setDataFetchingStatus( true );
			setStatus( itemStatus );
			await dispatch(
				fetchAllHooks( {
					status: itemStatus,
					page: 1,
					per_page: perPage,
				} )
			);
			handleNavigate( itemStatus, 1, perPage );
			setDataFetchingStatus( false );
		};

		return (
			<>
				<div className="kzui-table__sub-header-actions-left">
					<div className="kzui-table-sub-header-tabs">
						{ [
							{ label: __( 'All', 'storeengine' ), value: 'all' },
							...webhookStatus,
						].map( ( item, index ) => (
							<span
								role="presentation"
								className={ `tab ${
									item?.value === status ? 'is-active' : ''
								} ` }
								key={ index }
								onClick={ () => dataFetchHandler( item.value ) }
							>
								{ item.label }
							</span>
						) ) }
					</div>
				</div>
				<div className="kzui-table-sub-header-actions-right">
					<Search
						placeholder={ __( 'Search Webhooks', 'storeengine' ) }
						onSearchHandler={ searchHandler }
						defaultValue={ searchText ? searchText : '' }
					/>
					<div className="kzui-table-sub-header-actions-right--border" />
				</div>
			</>
		);
	}, [ status, searchText ] );

	return (
		<>
			<ListTable
				columns={ columns }
				data={ hooks?.data ? hooks?.data : [] }
				showSubHeader={ true }
				subHeaderComponent={ subHeaderComponentMemo }
				isRowSelectable={ true }
				showColumnFilter={ true }
				noDataText={ __(
					'Please, create Webhooks to see the available list here.',
					'storeengine'
				) }
				getSelectRowValue={ ( selectedRow ) => {
					setSelectedItems( selectedRow );
					setResetSelectedItems( false );
				} }
				showPagination={ hooks?.totalItems >= 10 }
				onChangePage={ handlePageChange }
				onChangeItemsPerPage={ handleItemsPage }
				totalItems={ hooks?.totalItems }
				totalRows={ hooks?.data?.length }
				dataFetchingStatus={ dataFetchingStatus }
				resetSelected={ resetSelectedItems }
				rowsPerPage={ perPage }
				currentPageNumber={ urlPage }
				suffix="web-hooks"
				screenId="outgoing-webhooks"
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

export default HooksTable;
