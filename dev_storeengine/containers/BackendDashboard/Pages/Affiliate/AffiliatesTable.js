import React, { memo, useEffect, useMemo, useState } from 'react';
import useScreenOptions from '@Hooks/useScreenOptions';
import ListTable from '@Components/ListTable';
import { Scope, Button, cx } from '@Components/ui';
import SnackbarAction from '@Components/SnackbarAction';
import { useDispatch, useSelector } from 'react-redux';
import Search from '@Components/Search';
import { __, sprintf } from '@wordpress/i18n';
import StatusOptions from '@Components/StatusOptions';
import { useNavigate } from 'react-router-dom';
import ReactModal from '@Components/Modal/ReactModal';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import {
	copyToClipboard,
	sliceString,
	prepare_admin_route_path,
} from '@Utils/helper';
import Preloader from '@Components/Loader/Preloader';
import Currency from '@Components/Currency';
import { useLocationQuery } from '@Hooks';
import {
	fetchAllAffiliates,
	updateAffiliate,
} from '@Redux/Slices/affiliatesSlice/affiliatesSlice';

import './styles.scss';

const STATUS_BADGE_BASE =
	'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize';
const STATUS_BADGE = {
	active: 'bg-se-success-light text-se-success',
	inactive: 'bg-se-error-light text-se-error',
	pending: 'bg-se-warning-light text-se-warning',
	rejected: 'bg-se-error-light text-se-error',
	suspended: 'bg-se-warning-light text-se-warning',
};

const AffiliateStatuses = [
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
		label: __( 'Pending', 'storeengine' ),
		value: 'pending',
	},
	{
		label: __( 'Rejected', 'storeengine' ),
		value: 'rejected',
	},
	{
		label: __( 'Suspended', 'storeengine' ),
		value: 'suspended',
	},
];

const AffiliatesTableSubHeader = memo(
	( { onTabChange, onSearch, currentTab, currentSearch } ) => {
		return (
			<>
				<div className="kzui-table__sub-header-actions-left">
					<div className="kzui-table-sub-header-tabs">
						{ AffiliateStatuses.map( ( item, index ) => (
							<a
								role="presentation"
								className={ `tab${
									item.value === currentTab
										? ' is-active'
										: ''
								}` }
								key={ index }
								onClick={ ( e ) => {
									e.preventDefault();
									onTabChange( item.value );
								} }
							>
								{ item.label }
							</a>
						) ) }
					</div>
				</div>
				<div className="kzui-list-table-sub-header-actions-right">
					<Search
						placeholder={ __( 'Search Affiliate', 'storeengine' ) }
						onSearchHandler={ onSearch }
						defaultValue={ currentSearch }
					/>
				</div>
			</>
		);
	}
);

const AffiliateDetailRow = ( { label, value, onCopy, isLink, multiline } ) => {
	const hasValue = value !== undefined && value !== null && value !== '';
	const display = hasValue ? value : '—';

	return (
		<div className="storeengine-affiliate-request__row storeengine-mb-4">
			<div className="storeengine-affiliate-request__label">
				{ label }
			</div>
			<div className="storeengine-flex storeengine-flex-gap-8">
				{ isLink && hasValue ? (
					<a
						href={ value }
						target="_blank"
						rel="noreferrer"
						className="storeengine-affiliate-request__value storeengine-affiliate-request__value--link"
					>
						{ value }
					</a>
				) : (
					<div
						className={ `storeengine-affiliate-request__value${
							multiline
								? ' storeengine-affiliate-request__value--multiline'
								: ''
						}` }
					>
						{ display }
					</div>
				) }
				{ onCopy && hasValue && (
					<Button
						icon="storeengine-icon--duplicate"
						onClick={ onCopy }
						preset="ghost"
					/>
				) }
			</div>
		</div>
	);
};

const AffiliatesTable = () => {
	const affiliates = useSelector( ( state ) => state.affiliates );
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ showDataModal, isShowDataModal ] = useState( {
		isShow: false,
		data: null,
	} );
	const [ confirm, setConfirm ] = useState( false );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState(
		! affiliates?.data?.length
	);
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState( [] );

	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();

	const statuses = [
		'all',
		'active',
		'inactive',
		'pending',
		'rejected',
		'suspended',
	];
	const affiliatesStatus = location.getValue( 'status', 'all', statuses );
	const { perPage: screenPerPage } = useScreenOptions( 'affiliates' );
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
			prepare_admin_route_path( 'affiliates', {
				status,
				page,
				per_page,
				search,
			} )
		);
	};

	const handleTableDataFetch = async (
		affiliatesStatus = 'all',
		currentPage = 1,
		per_page = 10,
		searchText = ''
	) => {
		await dispatch(
			fetchAllAffiliates( {
				status: affiliatesStatus,
				page: currentPage,
				per_page,
				search: searchText,
			} )
		);
	};

	useEffect( () => {
		( async () => {
			setDataFetchingStatus( true );
			if (
				affiliates?.data.length <= 1 ||
				affiliatesStatus !== affiliates.status ||
				perPage !== affiliates.rowsPerPage ||
				urlPage !== affiliates.page ||
				searchText !== affiliates.search
			) {
				await handleTableDataFetch(
					affiliatesStatus,
					urlPage ?? 1,
					perPage,
					searchText
				);
			}
			setDataFetchingStatus( false );
		} )();
	}, [ affiliatesStatus, urlPage, perPage, searchText ] );

	const handleItemsPerPage = ( itemsPerPage = 10, page = 1 ) => {
		handleNavigate( affiliatesStatus, page, itemsPerPage, searchText );
	};

	const handlePageChange = ( page = 1, itemPerPage = 10 ) => {
		handleNavigate( affiliatesStatus, page, itemPerPage, searchText );
	};

	const handleCopy =
		( data, name = '' ) =>
		() => {
			copyToClipboard( data );
			dispatch(
				showNotification( {
					message: __(
						`${ name } Copied To Clipboard`,
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
		};

	const columns = [
		{
			name: __( 'ID', 'storeengine' ),
			suffix: 'title',
			cell: ( row ) => {
				return (
					<div className="storeenging-table-title-wrap">
						<div
							className="storeengine-table-title"
							role="button"
							tabIndex={ 0 }
							onClick={ () =>
								isShowDataModal( {
									isShow: true,
									data: row,
								} )
							}
						>
							{ row?.display_name ||
								sliceString( row.user_email, 40 ) }
							<a
								href={ row.link }
								target="_blank"
								rel="noreferrer"
								className="storeengine-table-title__link"
							>
								<span className="storeengine-icon storeengine-icon--eye"></span>
							</a>
						</div>
						<div className="storeengine-table-sub-title">
							<div className="storeengine-table-sub-title__item">
								{ sliceString( row?.user_email, 40 ) }
							</div>
							<div className="storeengine-table-sub-title__item">
								{
									// translators: %d. Object ID.
									sprintf(
										__( 'ID: %d', 'storeengine' ),
										row?.affiliate_id
									)
								}
							</div>
							{ row?.created_at && (
								<div className="storeengine-table-sub-title__item">
									{ sprintf(
										// translators: %s. Application date.
										__( 'Applied: %s', 'storeengine' ),
										row.created_at.split( ' ' )[ 0 ]
									) }
								</div>
							) }
						</div>
					</div>
				);
			},
		},
		{
			name: __( 'Referrals', 'storeengine' ),
			cell: ( row ) => {
				return (
					<div className="storeengine-referral-url">
						<span className="storeengine-referral-url__text">
							{ sliceString( row?.referral_url ?? '...' ) }
						</span>
						{ row?.referral_url && (
							<Button
								icon="storeengine-icon--duplicate"
								onClick={ handleCopy(
									row?.referral_url,
									'Referral URL'
								) }
								preset="ghost"
							/>
						) }
					</div>
				);
			},
		},
		{
			name: __( 'Total Clicks', 'storeengine' ),
			cell: ( row ) => {
				return (
					<div className="action-cell">
						<p>{ row?.total_clicks }</p>
					</div>
				);
			},
		},
		{
			name: __( 'Com. Rate', 'storeengine' ),
			cell: ( row ) => {
				return <span>{ row?.commission_rate }%</span>;
			},
		},
		{
			name: __( 'Earnings', 'storeengine' ),
			cell: ( row ) => {
				return <Currency value={ row?.total_commissions || 0 } />;
			},
		},
		{
			name: __( 'Balance', 'storeengine' ),
			cell: ( row ) => {
				return <Currency value={ row?.current_balance || 0 } />;
			},
		},
		{
			name: __( 'Status', 'storeengine' ),
			cell: ( row ) => {
				const statusHandler = ( itemStatus ) => {
					dispatch(
						updateAffiliate( {
							id: row?.affiliate_id,
							status: itemStatus,
						} )
					);
				};
				return (
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
										label: __( 'Inactive', 'storeengine' ),
										value: 'inactive',
									},
									{
										label: __( 'Pending', 'storeengine' ),
										value: 'pending',
									},
									{
										label: __( 'Rejected', 'storeengine' ),
										value: 'rejected',
									},
									{
										label: __( 'Suspended', 'storeengine' ),
										value: 'suspended',
									},
								],
							} }
							onChangeHandler={ statusHandler }
						/>
					</div>
				);
			},
		},
	];

	const publishAction =
		affiliatesStatus !== 'inactive'
			? [
					{
						suffix: 'inactive',
						label: __( 'Inactive', 'storeengine' ),
						onClick: () =>
							setSnackbarOption( {
								value: 'inactive',
								message: __(
									'Are you sure, you want to move these affiliate to inactive!',
									'storeengine'
								),
							} ),
					},
			  ]
			: [];

	const trashAction =
		affiliatesStatus === 'inactive'
			? [
					{
						suffix: 'active',
						label: __( 'Active', 'storeengine' ),
						onClick: () =>
							setSnackbarOption( {
								value: 'active',
								message: __(
									'Are you sure, you want to activate these affiliates?',
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
			if ( affiliatesStatus !== 'inactive' && option === 'inactive' ) {
				await dispatch(
					updateAffiliate( {
						id: item?.affiliate_id,
						status: 'inactive',
					} )
				);
			} else if ( option === 'active' ) {
				await dispatch(
					updateAffiliate( {
						id: item?.affiliate_id,
						status: 'active',
					} )
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

	const modalStatusUpdate = ( status ) => {
		dispatch(
			updateAffiliate( {
				id: showDataModal.data?.affiliate_id,
				status,
			} )
		);
		isShowDataModal( { isShow: false, data: null } );
	};

	const noDataText =
		affiliates?.data?.length === 0 && ! searchText
			? __(
					'Please, create Affiliates to see the available list here.',
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
					data={ affiliates?.data ?? [] }
					showSubHeader={ true }
					subHeaderComponent={
						<AffiliatesTableSubHeader
							onSearch={ ( keywords ) => {
								handleNavigate(
									affiliatesStatus,
									urlPage,
									perPage,
									keywords
								);
							} }
							onTabChange={ ( status ) => {
								handleNavigate( status );
							} }
							currentTab={ affiliatesStatus }
							currentSearch={ searchText }
						/>
					}
					isRowSelectable={ true }
					showColumnFilter={ true }
					getSelectRowValue={ ( selectedRow ) => {
						setSelectedItems( selectedRow );
						setResetSelectedItems( false );
					} }
					showPagination={ affiliates?.totalItems >= 10 }
					onChangePage={ handlePageChange }
					onChangeItemsPerPage={ handleItemsPerPage }
					totalItems={ affiliates?.totalItems }
					totalRows={ affiliates?.data?.length }
					dataFetchingStatus={ dataFetchingStatus }
					resetSelected={ resetSelectedItems }
					currentPageNumber={ affiliates?.page }
					rowsPerPage={
						affiliates?.rowsPerPage ? affiliates?.rowsPerPage : 10
					}
					noDataText={ noDataText }
					suffix="affiliate"
					screenId="affiliates"
				/>
			) }

			{ selectedItems.length > 0 && (
				<SnackbarAction
					actionButtons={ snackbarOptions }
					itemsLength={ selectedItems?.length }
					confirmHandler={ setConfirm }
					isActionSelected={ snackbarOption }
					resetHandler={ handleReset }
				/>
			) }

			{ showDataModal.isShow && (
				<ReactModal
					isOpen={ showDataModal.isShow }
					onRequestClose={ () =>
						isShowDataModal( {
							isShow: false,
							data: null,
						} )
					}
					title={ __( 'Affiliate Request Details', 'storeengine' ) }
					suffix="affiliate-user-data"
					size="medium"
				>
					<Scope className="storeengine-affiliate-request storeengine-mb-6">
						<AffiliateDetailRow
							label={ __( 'Applicant', 'storeengine' ) }
							value={ showDataModal.data?.display_name }
						/>
						<AffiliateDetailRow
							label={ __( 'Email', 'storeengine' ) }
							value={ showDataModal.data?.user_email }
							onCopy={ handleCopy(
								showDataModal.data?.user_email,
								'Email'
							) }
						/>
						<AffiliateDetailRow
							label={ __(
								'Website / Promotional URL',
								'storeengine'
							) }
							value={ showDataModal.data?.website_url }
							isLink
						/>
						<AffiliateDetailRow
							label={ __( 'Promotional Methods', 'storeengine' ) }
							value={ showDataModal.data?.promotional_methods }
							multiline
						/>
						<AffiliateDetailRow
							label={ __( 'Payout Email', 'storeengine' ) }
							value={ showDataModal.data?.payout_email }
						/>
						<AffiliateDetailRow
							label={ __( 'Applied On', 'storeengine' ) }
							value={ showDataModal.data?.created_at }
						/>
						<AffiliateDetailRow
							label={ __( 'Terms Accepted', 'storeengine' ) }
							value={
								showDataModal.data?.agreed_terms ||
								__( 'Not accepted', 'storeengine' )
							}
						/>
						<AffiliateDetailRow
							label={ __( 'Referral Code', 'storeengine' ) }
							value={ showDataModal.data?.referral_code }
							onCopy={
								showDataModal.data?.referral_code
									? handleCopy(
											showDataModal.data?.referral_code,
											'Referral Code'
									  )
									: null
							}
						/>
						<AffiliateDetailRow
							label={ __( 'Referral URL', 'storeengine' ) }
							value={ showDataModal.data?.referral_url }
							onCopy={
								showDataModal.data?.referral_url
									? handleCopy(
											showDataModal.data?.referral_url,
											'Referral URL'
									  )
									: null
							}
						/>

						<div className="storeengine-affiliate-request__footer storeengine-flex storeengine-flex-gap-8">
							{ showDataModal.data?.status === 'pending' ? (
								<>
									<Button
										preset="primary"
										onClick={ () =>
											modalStatusUpdate( 'active' )
										}
									>
										{ __( 'Approve', 'storeengine' ) }
									</Button>
									<Button
										preset="ghost"
										onClick={ () =>
											modalStatusUpdate( 'rejected' )
										}
									>
										{ __( 'Reject', 'storeengine' ) }
									</Button>
								</>
							) : (
								<>
									<span
										className={ cx(
											STATUS_BADGE_BASE,
											STATUS_BADGE[
												showDataModal.data?.status
											] || 'bg-se-bg text-se-subtitle'
										) }
									>
										{ showDataModal.data?.status }
									</span>
									{ showDataModal.data?.status ===
										'active' && (
										<Button
											preset="ghost"
											onClick={ () =>
												modalStatusUpdate(
													'suspended'
												)
											}
										>
											{ __( 'Suspend', 'storeengine' ) }
										</Button>
									) }
									{ showDataModal.data?.status ===
										'suspended' && (
										<Button
											preset="primary"
											onClick={ () =>
												modalStatusUpdate( 'active' )
											}
										>
											{ __(
												'Reactivate',
												'storeengine'
											) }
										</Button>
									) }
								</>
							) }
						</div>
					</Scope>
				</ReactModal>
			) }
		</>
	);
};

export default AffiliatesTable;
