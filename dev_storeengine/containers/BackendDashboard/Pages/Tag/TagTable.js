import React, { useEffect, useState } from 'react';
import useScreenOptions from '@Hooks/useScreenOptions';

import SnackbarAction from '@Components/BulkAction/SnackbarAction';
import ListTable from '@Components/ListTable';
import PropTypes from 'prop-types';
import Search from '@Components/Search';
import { __, sprintf } from '@wordpress/i18n';
import { sliceString, prepare_admin_route_path } from '@Utils/helper';
import OptionMenu from '@Components/OptionMenu';
import { useDispatch, useSelector } from 'react-redux';
import {
	fetchAllTags,
	updateItemPerPage,
	updateCurrentPage,
} from '@Redux/Slices/tagsSlice/tagsSlice';
import { useNavigate } from 'react-router-dom';
import { useLocationQuery } from '@Hooks';

const propTypes = {
	deleteHandler: PropTypes.func,
};

export default function TagTable( { editItemHandler, deleteHandler } ) {
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState( false );
	const tags = useSelector( ( state ) => state.tags );
	const [ selectedItems, setSelectedItems ] = useState( [] );
	const [ snackbarOption, setSnackbarOption ] = useState( {} );
	const [ confirm, setConfirm ] = useState( false );
	const [ resetSelectedItems, setResetSelectedItems ] = useState( false );

	const dispatch = useDispatch();
	const navigate = useNavigate();

	const location = useLocationQuery();
	const searchText = location.getValue( 'search', '' );
	const { perPage: screenPerPage } = useScreenOptions( 'tags' );
	const perPage = location.getValue( 'perPage', screenPerPage || tags?.itemPerPage || 10 );
	const currentPage = Math.max( 1, location.getValue( 'page_no', 1 ) );

	const handleNavigate = ( page = 1, per_page = 10, search = '' ) => {
		navigate(
			prepare_admin_route_path( 'tags', {
				page,
				per_page,
				search,
			} )
		);
	};

	const handleTableDataFetch = async ( page = 1, perPage = 10 ) => {
		setDataFetchingStatus( true );
		await dispatch( fetchAllTags( { search: searchText, page, perPage } ) );
		setDataFetchingStatus( false );
	};

	const publishAction = [
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
	];

	const snackbarOptions = [ ...publishAction ];

	useEffect( () => {
		( async () => {
			if ( ! tags?.data || ( tags?.data && tags?.data?.length <= 1 ) ) {
				await handleTableDataFetch();
			}
		} )();
	}, [] );

	useEffect( () => {
		handleNavigate( currentPage, perPage, searchText );
	}, [ perPage, currentPage, searchText ] );

	const tagDeleteHandler = ( item ) => {
		if (
			window.confirm(
				__(
					'Are you sure you want to permanently delete selected course tag?',
					'storeengine'
				)
			)
		) {
			deleteHandler( item.id );
		}
	};

	const handleReset = () => {
		setSelectedItems( [] );
		setSnackbarOption( {} );
		setResetSelectedItems( true );
		setConfirm( false );
	};

	const snackbarActionHandler = async () => {
		for ( const item of selectedItems ) {
			await deleteHandler( item.id );
		}

		handleReset();
	};

	const handlePageChange = async ( page = 1, perPage = 10 ) => {
		dispatch( updateCurrentPage( page ) );
		await handleTableDataFetch( page, perPage );
	};

	const handleItemsPage = async ( itemsPerPage, page = 1 ) => {
		dispatch( updateItemPerPage( itemsPerPage ) );
		await handleTableDataFetch( page, itemsPerPage );
		handleNavigate( page, itemsPerPage, searchText );
	};

	React.useMemo( () => {
		( async () => {
			if ( confirm ) {
				await snackbarActionHandler( snackbarOption.value );
			} else {
				handleReset();
			}
		} )();
	}, [ confirm ] );

	const columns = [
		{
			name: __( 'Name', 'storeengine' ),
			suffix: 'title',
			cell: ( row ) => (
				<div>
					<div className="storeengine-table-title">
						<div
							onClick={ () => editItemHandler( row ) }
							role="presentation"
						>
							<p>{ sliceString( row.name ) }</p>
						</div>
						<a href={ row.link } target="_blank" rel="noreferrer">
							<span
								className="storeengine-icon storeengine-icon--eye"
								aria-hidden={ true }
							/>
						</a>
					</div>
					<div className="storeengine-table-sub-title">
						<div className="storeengine-table-sub-title__item">
							{
								// translators: %d. Object ID.
								sprintf( __( 'ID: %d', 'storeengine' ), row.id )
							}
						</div>
					</div>
				</div>
			),
		},
		{
			name: __( 'Slug', 'storeengine' ),
			cell: ( row ) => <span>{ row.slug }</span>,
		},
		{
			name: __( 'Description', 'storeengine' ),
			cell: ( row ) => (
				<span>{ sliceString( row.description, 30 ) }</span>
			),
		},
		{
			name: __( 'Count', 'storeengine' ),
			cell: ( row ) => <span>{ row.count }</span>,
		},
		{
			name: __( 'Action', 'storeengine' ),

			cell: ( row ) => (
				<div className="storeengine-table-item-control">
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
								onClick: () => editItemHandler( row ),
							},
							{
								type: 'link',
								label: __( 'View', 'storeengine' ),
								hasBorder: true,
								icon: (
									<span
										className="storeengine-icon storeengine-icon--eye"
										aria-hidden={ true }
									/>
								),
								link: row.link,
								target: '_blank',
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
								onClick: () => tagDeleteHandler( row ),
							},
						] }
					/>
				</div>
			),
		},
	];

	const noDataText =
		tags?.data?.length === 0 && ! searchText
			? __(
					'Please, create Tags to see the available list here.',
					'storeengine'
			  )
			: __(
					'No matching results found. Please try a different search.',
					'storeengine'
			  );

	const subHeaderComponentMemo = React.useMemo( () => {
		const searchHandler = async ( value ) => {
			setDataFetchingStatus( true );
			await dispatch(
				fetchAllTags( { search: value, page: 1, perPage } )
			);
			setDataFetchingStatus( false );
			handleNavigate( 1, perPage, value );
		};

		return (
			<>
				<div className="kzui-table__sub-header-actions-left"></div>
				<div className="kzui-list-table-sub-header-actions-right">
					<Search
						placeholder={ __( 'Search Tag', 'storeengine' ) }
						onSearchHandler={ searchHandler }
					/>
					<div className="kzui-list-table-sub-header-actions-right--border" />
				</div>
			</>
		);
	}, [ searchText ] );

	const data = tags.data;

	return (
		<>
			<ListTable
				columns={ columns }
				data={ data ?? false }
				showSubHeader={ true }
				subHeaderComponent={ subHeaderComponentMemo }
				isRowSelectable={ true }
				noDataText={ noDataText }
				showColumnFilter={ true }
				getSelectRowValue={ ( selectedRow ) => {
					setSelectedItems( selectedRow );
					setResetSelectedItems( false );
				} }
				showPagination={ tags?.totalItems >= 10 }
				onChangePage={ handlePageChange }
				onChangeItemsPerPage={ handleItemsPage }
				totalItems={ tags?.totalItems }
				totalRows={ data?.length }
				dataFetchingStatus={ dataFetchingStatus }
				resetSelected={ resetSelectedItems }
				rowsPerPage={ tags?.rowsPerPage ? tags?.rowsPerPage : perPage }
				suffix="product-tag"
				screenId="tags"
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
}

TagTable.propTypes = propTypes;
