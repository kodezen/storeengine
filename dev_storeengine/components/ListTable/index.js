import React, { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
// component
import TableSubHeader from './TableSubHeader';
import TableHeader from './TableHeader';
import TableBody from './TableBody';
import TableFooter from './TableFooter';
import _ from 'lodash';
import Preloader from '../Loader/Preloader';
import CustomTableMessage from '@Components/Oops/CustomTableMessage';
import classnames from 'classnames';
import useScreenOptions, {
	mergeColumns,
	toSavedColumns,
	useRegisterScreenMeta,
} from '@Hooks/useScreenOptions';

const propTypes = {
	columns: PropTypes.array,
	data: PropTypes.array,
	isRowSelectable: PropTypes.bool,
	getSelectRowValue: PropTypes.func,
	showSubHeader: PropTypes.bool,
	subHeaderComponent: PropTypes.any,
	subHeaderBelow: PropTypes.node,
	showColumnFilter: PropTypes.bool,
	showPagination: PropTypes.bool,
	onChangePage: PropTypes.func,
	onChangeItemsPerPage: PropTypes.func,
	suffix: PropTypes.string,
	noDataText: PropTypes.string,
	currentPageNumber: PropTypes.number,
	totalItems: PropTypes.number,
	dataFetchingStatus: PropTypes.bool,
	resetSelected: PropTypes.bool,
	rowsPerPage: PropTypes.number,
};

const ListTable = ( props ) => {
	const {
		columns = [],
		data = [],
		isRowSelectable = true,
		getSelectRowValue,
		showSubHeader = true,
		subHeaderComponent,
		// Full-width row under the sub-header (e.g. applied filter chips).
		subHeaderBelow,
		subHeaderExtraActions,
		showColumnFilter = true,
		showPagination = false,
		onChangePage,
		onChangeItemsPerPage,
		suffix = '',
		// Stable screen id. When set, column visibility/order persists per-user
		// to server-side Screen Options (single user meta) instead of
		// localStorage, and the Screen Options panel can drive these columns.
		screenId = '',
		// Whether the Screen Options panel should offer the "items per page"
		// control for this screen. Off for tables that paginate client-side or
		// with a fixed fetch size (where the pref wouldn't apply).
		showPerPageOption = true,
		noDataText = __(
			'Please, create data to see the available list here.',
			'storeengine'
		),
		totalItems = 0,
		dataFetchingStatus = false,
		resetSelected = false,
		currentPageNumber = 1,
		rowsPerPage = 10,
	} = props;
	const bodyRef = useRef( null );
	const headerRef = useRef( null );

	const so = useScreenOptions( screenId );
	const useStorePrefs = !! screenId;

	// Announce this screen to the global Screen Options + Help meta. A no-op when
	// screenId is empty (tables that opt out).
	useRegisterScreenMeta( screenId );

	// ListTable state
	// eslint-disable-next-line
	const [ isRowsPerPage, setIsRowsPerPage ] = useState( '10' );
	const [ loadingHeight, setLoadingHeight ] = useState( '300px' );
	const [ headerHeight, setHeaderHeight ] = useState( 0 );
	const [ copyDataArr, setCopyDataArr ] = useState( false );
	const [ copyColumns, setCopyColumns ] = useState(
		columns?.map( ( copyColumn, index ) => ( {
			...copyColumn,
			// Locked columns are always shown; otherwise honor `defaultHidden`
			// so heavy tables can open with a curated subset (the rest stay
			// one click away in the Columns manager).
			visible: copyColumn.locked ? true : ! copyColumn.defaultHidden,
			id: `column-${ index }`,
		} ) )
	);
	const shouldRerender = _.isEqual( data, copyDataArr );

	const [ visibleColumn, setVisibleColumn ] = useState(
		copyColumns?.filter( ( copyColumn ) => copyColumn.visible )
	);
	const [ tempCopyColumns, setTempCopyColumns ] = useState( [
		...copyColumns,
	] );
	const [ showSlider, setShowSlider ] = useState( false );

	const isCheckboxColumnVisible = visibleColumn.length > 0 && isRowSelectable;

	const selectRowChange = ( { row, select } ) => {
		const updatedDataArr = copyDataArr.map( ( dataItem ) => {
			if ( dataItem.rowId === row.rowId ) {
				return { ...dataItem, select };
			}
			return dataItem;
		} );
		setCopyDataArr( updatedDataArr );
	};

	const selectAllRow = ( event ) =>
		setCopyDataArr( ( prev ) =>
			prev.map( ( prevData ) => ( {
				...prevData,
				select: event.target.checked,
			} ) )
		);

	const checkedChange = ( { id, visible } ) => {
		const updatedColumns = tempCopyColumns.map( ( column ) => {
			// Locked columns can't be toggled off.
			if ( column.id === id && ! column.locked ) {
				return { ...column, visible };
			}
			return column;
		} );

		setTempCopyColumns( updatedColumns );
	};

	const paginationPerPageChange = ( option ) => {
		setIsRowsPerPage( option );
		setLoadingHeight( `${ bodyRef.current.offsetHeight }px` );
		onChangeItemsPerPage( parseInt( option ), 1 );
	};

	// Reset copyDataArr if shouldRerender is false
	useEffect( () => {
		if ( ! shouldRerender ) {
			setCopyDataArr(
				data?.map( ( row, index ) => ( {
					...row,
					rowId: `row-${ index }`,
					select: false,
				} ) )
			);
		}
	}, [ shouldRerender, data ] );

	//side effect
	useEffect( () => {
		setCopyDataArr(
			data &&
				data?.map( ( row, index ) => ( {
					...row,
					rowId: `row-${ index }`,
					select: false,
				} ) )
		);
	}, [ data?.length ] );

	useEffect( () => {
		if ( 0 === data.length || false === data ) {
			setLoadingHeight( '300px' );
		} else if ( bodyRef.current.offsetHeight < 100 ) {
			setLoadingHeight( `100px` );
		} else {
			setLoadingHeight( `${ bodyRef.current.offsetHeight - 20 }px` );
		}

		if ( headerRef.current ) {
			setHeaderHeight( headerRef.current.offsetHeight - 20 );
		}
	}, [ data?.length, bodyRef, headerRef, rowsPerPage ] );

	useEffect( () => {
		const visibleColumns = copyColumns.filter(
			( item ) => item.visible === true
		);

		function handleResponsiveScroll() {
			const contentContainer = document.querySelector(
				'.storeengine-content-section'
			);
			const contentWidth = contentContainer
				? contentContainer.scrollWidth
				: 0;
			const containerWidth = contentContainer
				? contentContainer.offsetWidth
				: 0;

			if (
				window.innerWidth < 1280 ||
				visibleColumns.length > 6 ||
				contentWidth > containerWidth ||
				contentWidth < 860
			) {
				setShowSlider( true );
			} else {
				setShowSlider( false );
			}
		}

		// Add event listener for window resize
		window.addEventListener( 'resize', handleResponsiveScroll );

		// Initial check on component mount
		handleResponsiveScroll();

		// Clean up the event listener when the component unmounts
		return () => {
			window.removeEventListener( 'resize', handleResponsiveScroll );
		};
	}, [ window.innerWidth, copyColumns ] );

	useEffect( () => {
		setVisibleColumn(
			copyColumns?.filter( ( copyColumn ) => copyColumn.visible )
		);
	}, [ copyColumns ] );

	// Register the code column definitions so the Screen Options panel can list
	// them (once per screen).
	useEffect( () => {
		if ( ! useStorePrefs ) {
			return;
		}
		so.register(
			columns.map( ( c, index ) => ( {
				id: `column-${ index }`,
				name: c.name,
				locked: !! c.locked,
				defaultHidden: !! c.defaultHidden,
			} ) ),
			showPerPageOption
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ useStorePrefs ] );

	// One-time migration: import a returning user's per-browser localStorage
	// column layout into the server-backed store, then drop the old key.
	useEffect( () => {
		if ( ! useStorePrefs || so.savedColumns ) {
			return;
		}
		let ls = null;
		try {
			ls = JSON.parse( localStorage.getItem( suffix ) );
		} catch ( e ) {
			ls = null;
		}
		if ( Array.isArray( ls ) && ls.length ) {
			so.setColumns(
				ls.map( ( item, index ) => ( {
					id: item.id,
					visible: !! item.visible,
					order: index,
				} ) )
			);
			try {
				localStorage.removeItem( suffix );
			} catch ( e ) {
				// ignore
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ useStorePrefs ] );

	// Store-backed restore: merge saved visibility/order onto the current code
	// columns whenever the saved prefs change (Screen Options panel OR the
	// column manager modal). The code columns stay the source of truth.
	useEffect( () => {
		if ( ! useStorePrefs ) {
			return;
		}
		const base = columns.map( ( c, index ) => ( {
			...c,
			visible: c.locked ? true : ! c.defaultHidden,
			id: `column-${ index }`,
		} ) );
		const merged = mergeColumns( base, so.savedColumns );
		setTempCopyColumns( merged );
		setCopyColumns( merged );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ useStorePrefs, so.savedColumns ] );

	// Legacy localStorage restore for tables without a screenId. The CURRENT
	// code columns are the source of truth; from the saved prefs we take only
	// each column's `visible` state + display order.
	useEffect( () => {
		if ( useStorePrefs ) {
			return;
		}
		let localColumns = null;
		try {
			localColumns = JSON.parse( localStorage.getItem( suffix ) );
		} catch ( e ) {
			localColumns = null;
		}

		if ( ! localColumns || ! Array.isArray( localColumns ) ) {
			return;
		}

		const savedById = {};
		localColumns.forEach( ( item, index ) => {
			savedById[ item.id ] = { visible: !! item.visible, order: index };
		} );

		const merged = copyColumns
			.map( ( column ) => {
				const saved = savedById[ column.id ];
				const visible = column.locked
					? true
					: saved
					? saved.visible
					: ! column.defaultHidden;

				return {
					...column,
					visible,
					__order: saved ? saved.order : Number.MAX_SAFE_INTEGER,
				};
			} )
			.sort( ( a, b ) => a.__order - b.__order )
			.map( ( { __order, ...rest } ) => rest );

		setTempCopyColumns( merged );
		setCopyColumns( merged );
	}, [] );

	// current select row
	useEffect( () => {
		if ( typeof getSelectRowValue === 'function' ) {
			getSelectRowValue(
				copyDataArr &&
					copyDataArr?.filter( ( copyRow ) => copyRow.select )
			);
		}
	}, [ copyDataArr ] );

	// reset selected
	useEffect( () => {
		if ( resetSelected && copyDataArr ) {
			setCopyDataArr(
				copyDataArr &&
					copyDataArr?.map( ( row ) => ( { ...row, select: false } ) )
			);
		}
	}, [ resetSelected ] );

	const showPaginationData = showPagination && copyDataArr?.length > 0;

	return (
		<div
			className={ classnames( 'kzui-table', {
				[ 'kzui-table--' + suffix ]: suffix,
			} ) }
		>
			<div className="kzui-table__container">
				{ showSubHeader && (
					<TableSubHeader
						subHeaderComponent={ subHeaderComponent }
						extraActions={ subHeaderExtraActions }
						setTempCopyColumns={ setTempCopyColumns }
						tempCopyColumns={ tempCopyColumns }
						showColumnFilter={ showColumnFilter }
						checkedChange={ checkedChange }
						setCopyColumns={ setCopyColumns }
						copyColumns={ copyColumns }
						suffix={ suffix }
						persistColumns={
							useStorePrefs
								? ( cols ) =>
										so.setColumns( toSavedColumns( cols ) )
								: null
						}
					/>
				) }

				{ subHeaderBelow }

				<div
					className="kzui-table__loading-wrapper"
					style={ {
						minHeight: dataFetchingStatus ? loadingHeight : 'auto',
					} }
				>
					{ dataFetchingStatus && (
						<div
							className="kzui-table__loader"
							style={ { top: headerHeight } }
						>
							<Preloader />
						</div>
					) }
					<div
						className={ classnames( 'kzui-table__table', {
							'kzui-table--has-slider': showSlider,
						} ) }
					>
						<TableHeader
							data={ data }
							headerRef={ headerRef }
							visibleColumn={ visibleColumn }
							copyDataArr={ copyDataArr }
							selectAllRow={ selectAllRow }
							isCheckboxColumnVisible={ isCheckboxColumnVisible }
						/>
						<TableBody
							dataFetchingStatus={ dataFetchingStatus }
							copyDataArr={ copyDataArr }
							visibleColumn={ visibleColumn }
							isCheckboxColumnVisible={ isCheckboxColumnVisible }
							selectRowChange={ selectRowChange }
							noDataText={ noDataText }
							bodyRef={ bodyRef }
						/>
					</div>
					{ /* Decide "empty" from the `data` prop, not copyDataArr: the copy is
					   filled by an effect one render AFTER the rows arrive, so keying off
					   it flashed "no data" for a split second on tables that do have rows. */ }
					{ ! dataFetchingStatus &&
						( ! data || data.length === 0 ) && (
							<div className="kzui-table__empty">
								<CustomTableMessage title={ noDataText } />
							</div>
						) }
				</div>

				{ showPaginationData && (
					<TableFooter
						data={ data }
						totalItems={ totalItems }
						paginationPerPageChange={ paginationPerPageChange }
						rowsPerPage={ rowsPerPage }
						onChangePage={ onChangePage }
						currentPageNumber={ currentPageNumber }
					/>
				) }
			</div>
		</div>
	);
};

ListTable.propTypes = propTypes;
export default ListTable;
