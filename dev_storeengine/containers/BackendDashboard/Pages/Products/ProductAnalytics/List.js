import React, { useEffect, useMemo, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

import TopBar from '@Components/TopBar';
import GetHelp from '@Components/GetHelp';
import Price from '@Components/Currency';
import Preloader from '@Components/Loader/Preloader';
import { Scope, Card, Button, Table, THead, TH, TR, TD, Input } from '@Components/ui';
import { useLocationQuery } from '@Hooks';
import { get_route_path, getSeGlobal } from '@Utils/helper';
import { getProductAnalyticsList } from '@Redux/Slices/analyticsSlice/analyticsSlice';

import FiltersHeader from '../../Dashboard/components/FiltersHeader/FiltersHeader';

import './styles.scss';

const PER_PAGE = 20;

const ProductAnalyticsList = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();

	const data = useSelector( ( state ) => state?.analytics?.productList );
	const loading = useSelector(
		( state ) => state?.analytics?.productListLoading
	);
	const settings = useSelector( ( state ) => state?.settings?.data );

	const defaultCurrency =
		settings?.store_currency || getSeGlobal( 'currency_options.currency' );

	const [ filterType, setFilterType ] = useState( null );
	const [ search, setSearch ] = useState( '' );
	const [ page, setPage ] = useState( 1 );

	const dateFrom = location.getValue(
		'from',
		moment().add( -1, 'months' ).format( 'YYYY-MM-DD' ),
		null,
		'string'
	);
	const dateTo = location.getValue(
		'to',
		moment().format( 'YYYY-MM-DD' ),
		null,
		'string'
	);
	const compareDays = location.getValue( 'compare', 30, null, 'int' );
	const urlCurrency = location.getValue( 'currency', '', null, 'string' );

	const [ selectedCurrency, setSelectedCurrency ] = useState(
		urlCurrency ? urlCurrency : data?.currency
	);

	const onUpdateFilter = ( filters ) => {
		navigate(
			get_route_path( {
				page: 'storeengine-products',
				path: 'analytics',
				...filters,
			} )
		);
	};

	const onCurrencyChange = ( value ) => {
		if ( ! value ) {
			value = defaultCurrency;
		}
		setSelectedCurrency( value );
		onUpdateFilter( {
			from: dateFrom,
			to: dateTo,
			compare: compareDays,
			currency: value,
		} );
	};

	// Debounce search into the request.
	useEffect( () => {
		const t = setTimeout( () => setPage( 1 ), 0 );
		return () => clearTimeout( t );
	}, [ search ] );

	useEffect( () => {
		if ( ! filterType ) {
			setFilterType( {
				from: dateFrom,
				to: dateTo,
				currency: selectedCurrency,
			} );
			return;
		}

		const t = setTimeout( () => {
			dispatch(
				getProductAnalyticsList( {
					from: dateFrom,
					to: dateTo,
					currency: selectedCurrency
						? selectedCurrency
						: defaultCurrency,
					search,
					page,
					per_page: PER_PAGE,
				} )
			);
		}, search ? 400 : 0 );

		return () => clearTimeout( t );
	}, [
		filterType,
		dateFrom,
		dateTo,
		selectedCurrency,
		search,
		page,
	] );

	useEffect( () => {
		if ( ! filterType ) {
			return;
		}
		if ( 'custom' === filterType.from || 'custom' === filterType.to ) {
			return;
		}
		if ( dateFrom === filterType.from && dateTo === filterType.to ) {
			return;
		}
		onUpdateFilter( { ...filterType, compare: compareDays } );
	}, [ filterType, dateFrom, dateTo ] );

	const currency = data?.currency || selectedCurrency || defaultCurrency;
	const products = data?.products || [];
	const totalPages = data?.total_pages || 1;

	const openProduct = ( productId ) =>
		navigate(
			get_route_path( {
				page: 'storeengine-products',
				id: productId,
				path: 'analytics',
			} )
		);

	const totalsLabel = useMemo( () => {
		if ( ! data ) {
			return '';
		}
		return sprintf(
			// translators: %d: number of products
			__( '%d products', 'storeengine' ),
			data.total || 0
		);
	}, [ data ] );

	return (
		<Scope>
			<TopBar
				title={ __( 'Product Analytics', 'storeengine' ) }
				render={ () => <GetHelp filterText={ [ 'analytics' ] } /> }
			/>
			<div className="storeengine-dashboard storeengine-page-content storeengine-product-analytics-list">
				<div className="mb-6">
					<h2 className="text-2xl font-semibold text-se-text m-0">
						{ __( 'Product Analytics', 'storeengine' ) }
					</h2>
					<p className="text-sm text-se-subtitle m-0">
						{ __(
							'Sales performance across all products. Select one to drill in.',
							'storeengine'
						) }
					</p>
				</div>

				<FiltersHeader
					filterType={ filterType }
					setFilterType={ setFilterType }
					from={ dateFrom }
					to={ dateTo }
					compare={ compareDays }
					currency={ selectedCurrency }
					onCurrencyChange={ onCurrencyChange }
					onUpdateFilter={ onUpdateFilter }
					startDate={ getSeGlobal( 'first_order' ) }
					analyticsData={ data }
				/>

				<Card className="mb-6">
					<div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
						<span className="text-sm text-se-subtitle">
							{ totalsLabel }
						</span>
						<div className="storeengine-product-analytics-list__search">
							<span
								className="storeengine-icon storeengine-icon--search"
								aria-hidden={ true }
							/>
							<Input
								type="search"
								value={ search }
								placeholder={ __(
									'Search products…',
									'storeengine'
								) }
								onChange={ ( e ) =>
									setSearch( e.target.value )
								}
							/>
						</div>
					</div>

					{ loading ? (
						<Preloader />
					) : products.length ? (
						<Table>
							<THead>
								<TR>
									<TH>{ __( 'Product', 'storeengine' ) }</TH>
									<TH className="text-end">
										{ __( 'Revenue', 'storeengine' ) }
									</TH>
									<TH className="text-end">
										{ __( 'Units', 'storeengine' ) }
									</TH>
									<TH className="text-end">
										{ __( 'Orders', 'storeengine' ) }
									</TH>
									<TH className="text-end">
										{ __( 'Analytics', 'storeengine' ) }
									</TH>
								</TR>
							</THead>
							<tbody>
								{ products.map( ( product ) => (
									<TR
										key={ product.product_id }
										className="storeengine-product-analytics-list__row"
										onClick={ () =>
											openProduct( product.product_id )
										}
									>
										<TD>
											<div className="flex items-center gap-3">
												{ product.thumbnail ? (
													<img
														src={
															product.thumbnail
														}
														alt=""
														className="w-9 h-9 rounded-md object-cover border border-se-border shrink-0"
													/>
												) : (
													<span
														className="storeengine-icon storeengine-icon--bag flex items-center justify-center w-9 h-9 rounded-md bg-se-surface-secondary text-se-subtitle shrink-0"
														aria-hidden={ true }
													/>
												) }
												<span className="font-medium text-se-text truncate">
													{ product.name }
												</span>
												{ product.is_license && (
													<span className="storeengine-product-analytics-list__badge">
														{ __(
															'License',
															'storeengine'
														) }
													</span>
												) }
											</div>
										</TD>
										<TD className="text-end font-semibold whitespace-nowrap">
											<Price
												value={ product.revenue }
												args={ { currency } }
											/>
										</TD>
										<TD className="text-end whitespace-nowrap">
											{ product.units }
										</TD>
										<TD className="text-end whitespace-nowrap">
											{ product.orders }
										</TD>
										<TD className="text-end">
											<Button
												preset="outline"
												size="sm"
												icon="storeengine-icon--chart-alt"
												onClick={ ( e ) => {
													e.stopPropagation();
													openProduct(
														product.product_id
													);
												} }
												aria-label={ __(
													'View analytics',
													'storeengine'
												) }
											/>
										</TD>
									</TR>
								) ) }
							</tbody>
						</Table>
					) : (
						<p className="text-center text-sm text-se-subtitle py-8 m-0">
							{ __(
								'No products match this search.',
								'storeengine'
							) }
						</p>
					) }
				</Card>

				{ totalPages > 1 && (
					<div className="flex items-center justify-center gap-3">
						<Button
							preset="outline"
							size="sm"
							disabled={ page <= 1 }
							onClick={ () =>
								setPage( ( p ) => Math.max( 1, p - 1 ) )
							}
						>
							{ __( 'Previous', 'storeengine' ) }
						</Button>
						<span className="text-sm text-se-subtitle">
							{ sprintf(
								// translators: %1$d: current page, %2$d: total pages
								__( 'Page %1$d of %2$d', 'storeengine' ),
								page,
								totalPages
							) }
						</span>
						<Button
							preset="outline"
							size="sm"
							disabled={ page >= totalPages }
							onClick={ () =>
								setPage( ( p ) =>
									Math.min( totalPages, p + 1 )
								)
							}
						>
							{ __( 'Next', 'storeengine' ) }
						</Button>
					</div>
				) }
			</div>
		</Scope>
	);
};

export default ProductAnalyticsList;
