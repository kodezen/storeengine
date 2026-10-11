import React, { useEffect, useMemo, useState } from 'react';
import ListTable from '@Components/ListTable';
import { useDispatch, useSelector } from 'react-redux';
import Search from '@Components/Search';
import { __ } from '@wordpress/i18n';
import OptionMenu from '@Components/OptionMenu';
import { get_route_path, prepare_admin_route_path } from '@Utils/helper';
import { useLocationQuery } from '@Hooks';
import useScreenOptions from '@Hooks/useScreenOptions';
import { useNavigate } from 'react-router-dom';
import Preloader from '@Components/Loader/Preloader';
import {
	fetchAllAccessGroups,
	deleteAccessGroup,
} from '@Redux/Slices/accessGroupsSlice/accessGroupsSlice';
import moment from 'moment';
import { cx } from '@Components/ui';
import { contentType } from '../AccessGroup/AccessGroupCreate/options';

const STATUS_BADGE_BASE =
	'inline-block px-2.5 py-1 rounded-se text-xs font-medium leading-tight';
const STATUS_BADGE = {
	active: 'bg-se-success-light text-se-success',
	inactive: 'bg-se-bg text-se-subtitle',
};

const AccessGroupTable = () => {
	const accessGroups = useSelector( ( state ) => state.accessGroups );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState(
		! accessGroups?.data?.length
	);
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ confirm, setConfirm ] = useState( false );
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );

	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();

	const accessGroupStatus = location.getValue( 'status', 'all' );
	const searchText = location.getValue( 'search', '' );
	const { perPage: screenPerPage } = useScreenOptions( 'access-groups' );
	const perPage = location.getValue( 'perPage', screenPerPage || 10 );
	const urlPage = Math.max( 1, location.getValue( 'page_no', 1 ) );

	const handleNavigate = (
		status = '',
		page = 1,
		per_page = 10,
		search = ''
	) => {
		navigate(
			prepare_admin_route_path( 'membership-rules', {
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
			fetchAllAccessGroups( {
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
				accessGroups?.data.length <= 1 ||
				accessGroupStatus !== accessGroups.status ||
				perPage !== accessGroups.rowsPerPage ||
				urlPage !== accessGroups.page ||
				searchText !== accessGroups.search
			) {
				// Call for new data
				await handleTableDataFetch(
					accessGroupStatus,
					urlPage ?? 1,
					perPage,
					searchText
				);
			}
			setDataFetchingStatus( false );
		} )();
	}, [ accessGroupStatus, urlPage, perPage, searchText ] );

	const handleItemsPage = async ( itemsPerPage = 10, page = 1 ) => {
		handleNavigate( accessGroupStatus, page, itemsPerPage, searchText );
	};

	const handlePageChange = async ( page = 1, itemPerPage = 10 ) => {
		handleNavigate( accessGroupStatus, page, itemPerPage, searchText );
	};

	// const snackbarOptions = [
	// 	{
	// 		suffix: 'delete',
	// 		label: __('Delete Permanently', 'storeengine'),
	// 		onClick: () =>
	// 			setSnackbarOption( {
	// 				value: 'delete',
	// 				message: __( 'Are you sure, you want to delete these items?', 'storeengine' ),
	// 			} ),
	// 	},
	// ];

	const handleReset = () => {
		setSelectedItems( [] );
		setSnackbarOption( {} );
		setResetSelectedItems( true );
		setConfirm( false );
	};

	const snackbarActionHandler = async () => {
		for ( const item of selectedItems ) {
			await dispatch(
				deleteAccessGroup( { ID: item.id ? item.id : item.ID } )
			);
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

	const handleEditAction = ( { id } ) =>
		navigate(
			get_route_path( {
				page: 'storeengine-membership-rules',
				id,
				action: 'edit',
			} )
		);

	const subHeaderComponentMemo = useMemo( () => {
		const searchHandler = async ( value ) => {
			handleNavigate( accessGroupStatus, urlPage, perPage, value );
		};

		return (
			<>
				<div className="kzui-table__sub-header-actions-left"></div>
				<div className="kzui-list-table-sub-header-actions-right">
					<Search
						placeholder={ __(
							'Search Access Groups',
							'storeengine'
						) }
						onSearchHandler={ searchHandler }
						defaultValue={ searchText }
					/>
				</div>
			</>
		);
	}, [ accessGroupStatus, searchText ] );

	const getLabelForValue = ( value ) => {
		// Data format for Include
		const item = contentType.find( ( content ) => content.value === value );
		return item ? item.label : value;
	};

	const columns = [
		{
			name: __( 'Title', 'storeengine' ),
			cell: ( row ) => {
				return (
					<div
						className="storeengine-pointer"
						onClick={ () => handleEditAction( row ) }
					>
						<p>{ row?.title?.rendered }</p>
					</div>
				);
			},
		},
		{
			name: __( 'Status', 'storeengine' ),
			cell: ( row ) => {
				// Active = published group (enforced); Inactive = draft (parked).
				// Same badge palette as the product editor's status badge.
				const isActive = 'publish' === row?.status;
				return (
					<span
						className={ cx(
							STATUS_BADGE_BASE,
							isActive
								? STATUS_BADGE.active
								: STATUS_BADGE.inactive
						) }
					>
						{ isActive
							? __( 'Active', 'storeengine' )
							: __( 'Inactive', 'storeengine' ) }
					</span>
				);
			},
		},
		{
			name: __( 'Pricing', 'storeengine' ),
			cell: ( row ) => {
				const isPaid = Array.isArray( row?.prices )
					? row.prices.length > 0
					: false;
				return (
					<span
						className={ cx(
							STATUS_BADGE_BASE,
							isPaid
								? STATUS_BADGE.active
								: STATUS_BADGE.inactive
						) }
					>
						{ isPaid
							? __( 'Paid', 'storeengine' )
							: __( 'Free', 'storeengine' ) }
					</span>
				);
			},
		},
		{
			name: __( 'Include', 'storeengine' ),
			cell: ( row ) => {
				const includeItems =
					row.meta._storeengine_membership_content_protect_types
						?.rules;
				if ( ! includeItems?.length ) {
					return '...';
				}
				return (
					<div>
						{ includeItems.map( ( item, index ) => (
							<p key={ index }>
								{ getLabelForValue( item ) }
								{ index < includeItems.length - 1 && ',' }
							</p>
						) ) }
					</div>
				);
			},
		},
		{
			name: __( 'Exclude', 'storeengine' ),
			cell: ( row ) => {
				const excludedItems =
					row?.meta
						?._storeengine_membership_content_protect_excluded_items;
				if ( ! excludedItems?.length ) {
					return '...';
				}
				return (
					<div>
						{ excludedItems.map( ( item, index ) => (
							<p key={ index }>
								{ item.label.split( ' - ' )[ 0 ] }
								{ index < excludedItems.length - 1 && ',' }
							</p>
						) ) }
					</div>
				);
			},
		},
		{
			name: __( 'Priority', 'storeengine' ),
			cell: ( row ) => {
				const priority =
					row?.meta?._storeengine_membership_priority ||
					__( 'N/A', 'storeengine' );
				return <p>{ priority }</p>;
			},
		},
		{
			name: __( 'User Roles', 'storeengine' ),
			cell: ( row ) => {
				const userRoles = row?.meta?._storeengine_membership_user_roles;
				if ( ! userRoles?.length ) {
					return '...';
				}
				return (
					<div>
						{ userRoles.map( ( role, index ) => (
							<p key={ index }>
								{ role.label }
								{ index < userRoles.length - 1 && ',' }
							</p>
						) ) }
					</div>
				);
			},
		},
		// {
		// 	name: __( 'Address', 'storeengine' ),
		// 	cell: () => (
		// 		<div>
		// 			<p>{  }</p>
		// 		</div>
		// 	),
		// },
		{
			name: __( 'Create date', 'storeengine' ),
			cell: ( row ) => (
				<p>{ moment( row?.date ).format( 'D MMMM, YYYY' ) }</p>
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
								label: (
									<span>{ __( 'Edit', 'storeengine' ) }</span>
								),
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
								label: (
									<span>
										{ __( 'Delete', 'storeengine' ) }
									</span>
								),
								suffix: 'trash',
								icon: (
									<span
										className="storeengine-icon storeengine-icon--trash"
										aria-hidden={ true }
									/>
								),
								onClick: () =>
									dispatch(
										deleteAccessGroup( {
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

	const noDataText =
		accessGroups?.data?.length === 0 && ! searchText
			? __(
					'Please, create Members to see the available list here.',
					'storeengine'
			  )
			: __(
					'No matching results found. Please try a different search.',
					'storeengine'
			  );

	return (
		<>
			{ dataFetchingStatus ? (
				<Preloader />
			) : (
				<ListTable
					columns={ columns }
					data={ accessGroups?.data ?? false }
					showSubHeader={ true }
					subHeaderComponent={ subHeaderComponentMemo }
					isRowSelectable={ false }
					showColumnFilter={ true }
					showPagination={ accessGroups?.totalItems >= 10 }
					onChangePage={ handlePageChange }
					onChangeItemsPerPage={ handleItemsPage }
					totalItems={ accessGroups?.totalItems }
					totalRows={ accessGroups?.data?.length }
					dataFetchingStatus={ dataFetchingStatus }
					currentPageNumber={ accessGroups?.page ?? urlPage }
					rowsPerPage={
						accessGroups?.rowsPerPage
							? accessGroups?.rowsPerPage
							: perPage
					}
					noDataText={ noDataText }
					suffix="access-groups"
					screenId="access-groups"
				/>
			) }
		</>
	);
};

export default AccessGroupTable;
