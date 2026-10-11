import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import TopBar from '@Components/TopBar';
import SubTopBar from '@Components/SubTopBar';
import ListTable from '@Components/ListTable';
import Search from '@Components/Search';
import StatusOptions from '@Components/StatusOptions';
import OptionMenu from '@Components/OptionMenu';
import SnackbarAction from '@Components/SnackbarAction';
import { Scope, Button, Select } from '@Components/ui';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import Stars from './Stars';
import ReviewModal from './ReviewModal';
import './styles.scss';

const PER_PAGE = 20;

const STATUS_TABS = [
	{ value: 'all', label: __( 'All', 'storeengine' ) },
	{ value: 'approve', label: __( 'Approved', 'storeengine' ) },
	{ value: 'hold', label: __( 'Pending', 'storeengine' ) },
	{ value: 'spam', label: __( 'Spam', 'storeengine' ) },
	{ value: 'trash', label: __( 'Trash', 'storeengine' ) },
];

const statusOptions = [
	{ value: 'approve', label: __( 'Approved', 'storeengine' ) },
	{ value: 'hold', label: __( 'Pending', 'storeengine' ) },
	{ value: 'spam', label: __( 'Spam', 'storeengine' ) },
];

const RATING_OPTIONS = [
	{ value: 0, label: __( 'All ratings', 'storeengine' ) },
	{ value: 5, label: __( '5 stars', 'storeengine' ) },
	{ value: 4, label: __( '4 stars', 'storeengine' ) },
	{ value: 3, label: __( '3 stars', 'storeengine' ) },
	{ value: 2, label: __( '2 stars', 'storeengine' ) },
	{ value: 1, label: __( '1 star', 'storeengine' ) },
];

const Reviews = () => {
	const dispatch = useDispatch();
	const [ reviews, setReviews ] = useState( false );
	const [ loading, setLoading ] = useState( true );
	const [ total, setTotal ] = useState( 0 );
	const [ page, setPage ] = useState( 1 );
	const [ status, setStatus ] = useState( 'all' );
	const [ rating, setRating ] = useState( 0 );
	const [ search, setSearch ] = useState( '' );
	const [ modalOpen, setModalOpen ] = useState( false );
	const [ editing, setEditing ] = useState( null );
	const [ selectedItems, setSelectedItems ] = useState( [] );
	const [ resetSelected, setResetSelected ] = useState( false );
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ confirm, setConfirm ] = useState( false );

	const isTrash = status === 'trash';

	const notify = ( message, type = 'success' ) =>
		dispatch( showNotification( { message, isShow: true, type } ) );

	const fetchReviews = useCallback( () => {
		setLoading( true );
		const params = new URLSearchParams( {
			page,
			per_page: PER_PAGE,
			status,
		} );
		if ( rating ) {
			params.set( 'rating', rating );
		}
		if ( search ) {
			params.set( 'search', search );
		}
		API.get( `${ namespace }reviews?${ params.toString() }` )
			.then( ( res ) => {
				setReviews( res.data || [] );
				setTotal( parseInt( res.headers[ 'x-wp-total' ] || '0', 10 ) );
			} )
			.catch( () => setReviews( [] ) )
			.finally( () => setLoading( false ) );
	}, [ page, status, rating, search ] );

	useEffect( () => {
		fetchReviews();
	}, [ fetchReviews ] );

	const setReviewStatus = useCallback(
		async ( id, newStatus ) =>
			API.post( `${ namespace }reviews/${ id }`, { status: newStatus } ),
		[]
	);

	const removeReview = useCallback(
		async ( id, permanent ) =>
			API.post(
				`${ namespace }reviews/${ id }${ permanent ? '?force=true' : '' }`,
				{},
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			),
		[]
	);

	const changeStatus = ( review ) => async ( newStatus ) => {
		try {
			await setReviewStatus( review.id, newStatus );
			notify( __( 'Review updated.', 'storeengine' ) );
			fetchReviews();
		} catch ( e ) {
			notify(
				e?.response?.data?.message ||
					__( 'Could not update the review.', 'storeengine' ),
				'error'
			);
		}
	};

	const moderate = async ( review, newStatus, message ) => {
		try {
			await setReviewStatus( review.id, newStatus );
			notify( message );
			fetchReviews();
		} catch ( e ) {
			notify(
				e?.response?.data?.message ||
					__( 'Could not update the review.', 'storeengine' ),
				'error'
			);
		}
	};

	const permanentDelete = async ( review ) => {
		// eslint-disable-next-line no-alert
		if (
			! window.confirm(
				__( 'Permanently delete this review?', 'storeengine' )
			)
		) {
			return;
		}
		try {
			await removeReview( review.id, true );
			notify( __( 'Review deleted.', 'storeengine' ) );
			fetchReviews();
		} catch ( e ) {
			notify(
				e?.response?.data?.message ||
					__( 'Could not delete the review.', 'storeengine' ),
				'error'
			);
		}
	};

	const switchTab = ( value ) => {
		setStatus( value );
		setPage( 1 );
		handleReset();
	};

	// Bulk actions.
	const handleReset = () => {
		setSelectedItems( [] );
		setSnackbarOption( {} );
		setResetSelected( true );
		setConfirm( false );
	};

	const snackbarOptions = isTrash
		? [
				{
					suffix: 'restore',
					label: __( 'Restore', 'storeengine' ),
					onClick: () =>
						setSnackbarOption( {
							value: 'restore',
							message: __(
								'Restore the selected reviews?',
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
								'Permanently delete the selected reviews?',
								'storeengine'
							),
						} ),
				},
		  ]
		: [
				{
					suffix: 'approve',
					label: __( 'Approve', 'storeengine' ),
					onClick: () =>
						setSnackbarOption( {
							value: 'approve',
							message: __(
								'Approve the selected reviews?',
								'storeengine'
							),
						} ),
				},
				{
					suffix: 'spam',
					label: __( 'Spam', 'storeengine' ),
					onClick: () =>
						setSnackbarOption( {
							value: 'spam',
							message: __(
								'Mark the selected reviews as spam?',
								'storeengine'
							),
						} ),
				},
				{
					suffix: 'trash',
					label: __( 'Move to Trash', 'storeengine' ),
					onClick: () =>
						setSnackbarOption( {
							value: 'trash',
							message: __(
								'Move the selected reviews to Trash?',
								'storeengine'
							),
						} ),
				},
		  ];

	useEffect( () => {
		if ( ! confirm ) {
			return;
		}
		( async () => {
			try {
				for ( const item of selectedItems ) {
					// eslint-disable-next-line no-await-in-loop
					if ( snackbarOption.value === 'delete' ) {
						await removeReview( item.id, true );
					} else if ( snackbarOption.value === 'trash' ) {
						await removeReview( item.id, false );
					} else if ( snackbarOption.value === 'restore' ) {
						await setReviewStatus( item.id, 'hold' );
					} else {
						await setReviewStatus( item.id, snackbarOption.value );
					}
				}
				notify( __( 'Done.', 'storeengine' ) );
			} catch ( e ) {
				notify(
					__( 'Could not complete the action.', 'storeengine' ),
					'error'
				);
			}
			handleReset();
			fetchReviews();
		} )();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ confirm ] );

	const columns = useMemo(
		() => [
			{
				name: __( 'Author', 'storeengine' ),
				locked: true,
				grow: 1,
				cell: ( row ) => (
					<div className="storeengine-review-author">
						<img
							src={ row.avatar }
							alt=""
							className="storeengine-review-author__avatar"
						/>
						<div>
							<strong>{ row.author }</strong>
							<span className="storeengine-review-author__email">
								{ row.email }
							</span>
						</div>
					</div>
				),
			},
			{
				name: __( 'Rating', 'storeengine' ),
				width: '120px',
				cell: ( row ) => <Stars value={ row.rating } />,
			},
			{
				name: __( 'Review', 'storeengine' ),
				grow: 2,
				cell: ( row ) => (
					<div className="storeengine-review-cell">
						<div className="storeengine-review-content-cell">
							{ row.content }
						</div>
						{ row.media && row.media.length > 0 && (
							<div className="storeengine-review-media-thumbs">
								{ row.media.map( ( m ) => (
									<a
										key={ m.id }
										href={ m.url }
										target="_blank"
										rel="noreferrer"
										className={ `storeengine-review-media-thumb is-${ m.type }` }
									>
										{ m.type === 'video' ? (
											<video src={ m.url } muted />
										) : (
											<img src={ m.thumb || m.url } alt="" />
										) }
									</a>
								) ) }
							</div>
						) }
					</div>
				),
			},
			{
				name: __( 'Product', 'storeengine' ),
				grow: 1,
				cell: ( row ) => row.product_title,
			},
			{
				name: __( 'Status', 'storeengine' ),
				width: '150px',
				cell: ( row ) =>
					isTrash ? (
						<span className="storeengine-review-status is-trash">
							{ __( 'Trash', 'storeengine' ) }
						</span>
					) : (
						<StatusOptions
							value={ row.status }
							options={ { items: statusOptions } }
							onChangeHandler={ changeStatus( row ) }
						/>
					),
			},
			{
				name: __( 'Actions', 'storeengine' ),
				locked: true,
				width: '110px',
				cell: ( row ) => {
					const menu = isTrash
						? [
								{
									type: 'button',
									label: (
										<span>{ __( 'Restore', 'storeengine' ) }</span>
									),
									icon: (
										<span
											className="storeengine-icon storeengine-icon--restore"
											aria-hidden={ true }
										/>
									),
									onClick: () =>
										moderate(
											row,
											'hold',
											__( 'Review restored.', 'storeengine' )
										),
									hasBorder: true,
								},
								{
									type: 'button',
									label: (
										<span>
											{ __(
												'Delete Permanently',
												'storeengine'
											) }
										</span>
									),
									suffix: 'trash',
									icon: (
										<span
											className="storeengine-icon storeengine-icon--trash"
											aria-hidden={ true }
										/>
									),
									onClick: () => permanentDelete( row ),
								},
						  ]
						: [
								row.status !== 'approve' && {
									type: 'button',
									label: (
										<span>{ __( 'Approve', 'storeengine' ) }</span>
									),
									icon: (
										<span
											className="storeengine-icon storeengine-icon--check"
											aria-hidden={ true }
										/>
									),
									onClick: () =>
										moderate(
											row,
											'approve',
											__( 'Review approved.', 'storeengine' )
										),
								},
								row.status !== 'hold' && {
									type: 'button',
									label: (
										<span>
											{ __( 'Unapprove', 'storeengine' ) }
										</span>
									),
									onClick: () =>
										moderate(
											row,
											'hold',
											__( 'Review unapproved.', 'storeengine' )
										),
								},
								row.status !== 'spam' && {
									type: 'button',
									label: (
										<span>{ __( 'Spam', 'storeengine' ) }</span>
									),
									onClick: () =>
										moderate(
											row,
											'spam',
											__( 'Marked as spam.', 'storeengine' )
										),
								},
								{
									type: 'button',
									label: (
										<span>{ __( 'Trash', 'storeengine' ) }</span>
									),
									suffix: 'trash',
									icon: (
										<span
											className="storeengine-icon storeengine-icon--trash"
											aria-hidden={ true }
										/>
									),
									onClick: () =>
										moderate(
											row,
											'trash',
											__( 'Moved to Trash.', 'storeengine' )
										),
									hasBorder: true,
								},
						  ].filter( Boolean );

					return (
						<div className="storeengine-faq-row-actions storeengine-table-item-control">
							{ ! isTrash && (
								<button
									type="button"
									className="storeengine-faq-row-actions__edit"
									aria-label={ __( 'Edit', 'storeengine' ) }
									onClick={ () => {
										setEditing( row );
										setModalOpen( true );
									} }
								>
									<span
										className="storeengine-icon storeengine-icon--edit"
										aria-hidden={ true }
									/>
								</button>
							) }
							<OptionMenu options={ menu } />
						</div>
					);
				},
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ isTrash ]
	);

	const subHeaderComponent = useMemo(
		() => (
			<>
				<div className="kzui-table__sub-header-actions-left">
					<div className="kzui-table-sub-header-tabs">
						{ STATUS_TABS.map( ( tab ) => (
							<span
								role="presentation"
								key={ tab.value }
								className={ `tab ${
									tab.value === status ? 'is-active' : ''
								}` }
								onClick={ () => switchTab( tab.value ) }
							>
								{ tab.label }
							</span>
						) ) }
					</div>
				</div>
				<div className="kzui-list-table-sub-header-actions-right storeengine-reviews-filters__right">
					<div style={ { minWidth: 150 } }>
						<Select
							options={ RATING_OPTIONS }
							value={ rating }
							onChange={ ( val ) => {
								setRating( val );
								setPage( 1 );
							} }
						/>
					</div>
					<Search
						placeholder={ __( 'Search reviews…', 'storeengine' ) }
						onSearchHandler={ ( value ) => {
							setSearch( value );
							setPage( 1 );
						} }
						defaultValue={ search }
					/>
				</div>
			</>
		),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ status, rating ]
	);

	return (
		<Scope>
			<TopBar title={ __( 'Reviews', 'storeengine' ) } />
			<SubTopBar heading={ __( 'Product Reviews', 'storeengine' ) }>
				<Button
					preset="primary"
					onClick={ () => {
						setEditing( null );
						setModalOpen( true );
					} }
				>
					{ __( 'Add Review', 'storeengine' ) }
				</Button>
			</SubTopBar>

			<div className="storeengine-page-content storeengine-page-content--reviews">
				<ListTable
					key={ `reviews-${ status }-${ reviews?.length ?? 0 }` }
					columns={ columns }
					data={ reviews }
					isRowSelectable={ true }
					getSelectRowValue={ ( selectedRow ) => {
						setSelectedItems( selectedRow );
						setResetSelected( false );
					} }
					showColumnFilter={ true }
					showSubHeader={ true }
					subHeaderComponent={ subHeaderComponent }
					showPagination={ total > PER_PAGE }
					onChangePage={ ( newPage ) => setPage( newPage ) }
					currentPageNumber={ page }
					totalItems={ total }
					rowsPerPage={ PER_PAGE }
					dataFetchingStatus={ loading }
					resetSelected={ resetSelected }
					noDataText={ __( 'No reviews found.', 'storeengine' ) }
					suffix="reviews"
					screenId="reviews"
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
			</div>

			{ modalOpen && (
				<ReviewModal
					open={ modalOpen }
					review={ editing }
					onClose={ () => setModalOpen( false ) }
					onSaved={ () => {
						setModalOpen( false );
						fetchReviews();
					} }
				/>
			) }
		</Scope>
	);
};

export default Reviews;
