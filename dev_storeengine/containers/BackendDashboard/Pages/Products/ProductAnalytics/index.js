import React, { useEffect, useMemo, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

import TopBar from '@Components/TopBar';
import GetHelp from '@Components/GetHelp';
import Price from '@Components/Currency';
import ChangeRate from '@Components/ChangeRate';
import TimeLineLabel from '@Components/TimeLineLabel';
import AnalyticsSectionHeader from '@Components/AnalyticsSectionHeader';
import { Scope, Card, Button, cx } from '@Components/ui';
import ProductPicker from '@Components/ProductPicker';
import { useLocationQuery } from '@Hooks';
import { get_route_path, getSeGlobal } from '@Utils/helper';
import { getProductAnalytics } from '@Redux/Slices/analyticsSlice/analyticsSlice';

import FiltersHeader from '../../Dashboard/components/FiltersHeader/FiltersHeader';
import OverviewCards from '../../Dashboard/components/OverviewCards/OverviewCard';
import SalesGrowth from '../../Dashboard/components/SalesGrowth/SalesGrowth';

import './styles.scss';

const ProductAnalytics = ( { id } ) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();

	const data = useSelector( ( state ) => state?.analytics?.product );
	const loading = useSelector( ( state ) => state?.analytics?.productLoading );
	const settings = useSelector( ( state ) => state?.settings?.data );

	const defaultCurrency =
		settings?.store_currency || getSeGlobal( 'currency_options.currency' );

	const [ filterType, setFilterType ] = useState( null );

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
				id,
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

	useEffect( () => {
		if ( ! filterType ) {
			setFilterType( {
				from: dateFrom,
				to: dateTo,
				currency: selectedCurrency,
			} );
			return;
		}

		dispatch(
			getProductAnalytics( {
				id,
				from: dateFrom,
				to: dateTo,
				compare: compareDays,
				currency: selectedCurrency ? selectedCurrency : defaultCurrency,
			} )
		);
	}, [ filterType, id, dateFrom, dateTo, compareDays, selectedCurrency ] );

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

	const timeline = useMemo(
		() => <TimeLineLabel from={ dateFrom } to={ dateTo } />,
		[ dateFrom, dateTo ]
	);

	const product = data?.product;
	const currency = data?.currency || selectedCurrency || defaultCurrency;

	// Extension slot — StoreEngine Pro (license-management) injects the License
	// analytics section here for licensed products. Addons push React nodes onto
	// the array; it stays empty (renders nothing) when no extension is active.
	const extraSections = applyFilters(
		'storeengine.product_analytics.sections',
		[],
		{
			productId: id,
			product,
			from: dateFrom,
			to: dateTo,
			compare: compareDays,
			currency: selectedCurrency ? selectedCurrency : defaultCurrency,
		}
	);

	const goBack = () =>
		navigate( get_route_path( { page: 'storeengine-products' } ) );

	return (
		<Scope>
			<TopBar
				title={ __( 'Product Analytics', 'storeengine' ) }
				render={ () => <GetHelp filterText={ [ 'analytics' ] } /> }
			/>
			<div className="storeengine-dashboard storeengine-page-content storeengine-product-analytics">
				{ /* Header */ }
				<div className="flex items-center gap-4 mb-6">
					<Button
						preset="outline"
						size="sm"
						icon="storeengine-icon--arrow-left"
						onClick={ goBack }
						aria-label={ __( 'Back to products', 'storeengine' ) }
					/>
					{ product?.thumbnail ? (
						<img
							src={ product.thumbnail }
							alt=""
							className="w-12 h-12 rounded-lg object-cover border border-se-border"
						/>
					) : (
						<span
							className="storeengine-icon storeengine-icon--bag flex items-center justify-center w-12 h-12 rounded-lg bg-se-surface-secondary text-se-subtitle text-xl"
							aria-hidden={ true }
						/>
					) }
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<h2 className="text-2xl font-semibold text-se-text m-0 truncate">
								{ product?.name ||
									__( 'Product', 'storeengine' ) }
							</h2>
							{ product?.is_license && (
								<span className="storeengine-product-analytics__badge">
									<span
										className="storeengine-icon storeengine-icon--key"
										aria-hidden={ true }
									/>
									{ __( 'License', 'storeengine' ) }
								</span>
							) }
						</div>
						<p className="text-sm text-se-subtitle m-0">
							{ __(
								'Sales performance for this product',
								'storeengine'
							) }
						</p>
					</div>
					<Button
						preset="outline"
						size="sm"
						icon="storeengine-icon--edit"
						onClick={ () =>
							navigate(
								get_route_path( {
									page: 'storeengine-products',
									id,
									action: 'edit',
								} )
							)
						}
					>
						{ __( 'Edit product', 'storeengine' ) }
					</Button>
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
					extra={
						<ProductPicker
							placeholder={ __(
								'Switch product…',
								'storeengine'
							) }
							value={ product?.id || Number( id ) }
							valueLabel={ product?.name || '' }
							showAllOption
							onShowAll={ () =>
								navigate(
									get_route_path( {
										page: 'storeengine-products',
										path: 'analytics',
									} )
								)
							}
							onSelect={ ( productId ) => {
								if ( Number( productId ) === Number( id ) ) {
									return;
								}
								navigate(
									get_route_path( {
										page: 'storeengine-products',
										id: productId,
										path: 'analytics',
									} )
								);
							} }
						/>
					}
				/>

				<OverviewCards
					stats={ data?.stats }
					compareDays={ compareDays }
					loading={ loading }
					currency={ currency }
				/>

				<SalesGrowth
					growth_report={ data?.growth }
					timeline={ timeline }
					loading={ loading }
					currency={ currency }
				/>

				{ /* Price breakdown + Top customers */ }
				<div className="storeengine-product-analytics__cols mb-6">
					<PriceBreakdown
						rows={ data?.price_breakdown }
						timeline={ timeline }
						currency={ currency }
						loading={ loading }
					/>
					<TopCustomers
						rows={ data?.top_customers }
						timeline={ timeline }
						currency={ currency }
						loading={ loading }
					/>
				</div>

				<RecentOrders
					rows={ data?.recent_orders }
					timeline={ timeline }
					navigate={ navigate }
				/>

				{ /* Pro-injected sections (license analytics) */ }
				{ Array.isArray( extraSections ) &&
					extraSections.map( ( node, i ) => (
						<React.Fragment key={ i }>{ node }</React.Fragment>
					) ) }
			</div>
		</Scope>
	);
};

const PriceBreakdown = ( { rows, timeline, currency } ) => (
	<Card className="min-w-0 self-start flex flex-col">
		<AnalyticsSectionHeader
			label={ __( 'Pricing Plans', 'storeengine' ) }
			timeline={ timeline }
		/>
		<div className="mt-4 flex flex-col gap-3">
			{ rows && rows.length ? (
				rows.map( ( row, index ) => (
					<div className="flex items-center gap-3" key={ index }>
						<div className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full border border-solid border-se-border text-xs text-se-text">
							{ index + 1 }
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-se-text m-0 mb-0.5 truncate">
								{ row.name }
							</p>
							<p className="text-sm text-se-subtitle m-0">
								{ sprintf(
									// translators: %d: units sold
									__( '%d sold', 'storeengine' ),
									row.units
								) }
								<span> • </span>
								{ sprintf(
									// translators: %d: order count
									__( '%d orders', 'storeengine' ),
									row.orders
								) }
							</p>
						</div>
						<div className="text-sm font-semibold text-se-text whitespace-nowrap">
							<Price
								value={ row.revenue }
								args={ { currency } }
							/>
						</div>
					</div>
				) )
			) : (
				<EmptyRow />
			) }
		</div>
	</Card>
);

const TopCustomers = ( { rows, timeline, currency } ) => (
	<Card className="min-w-0 self-start flex flex-col">
		<AnalyticsSectionHeader
			label={ __( 'Top Customers', 'storeengine' ) }
			timeline={ timeline }
		/>
		<div className="mt-4 flex flex-col gap-3">
			{ rows && rows.length ? (
				rows.map( ( row, index ) => (
					<div className="flex items-center gap-3" key={ index }>
						{ row.avatar ? (
							<img
								src={ row.avatar }
								alt=""
								className="w-8 h-8 rounded-full shrink-0"
							/>
						) : (
							<span className="w-8 h-8 rounded-full bg-se-surface-secondary shrink-0" />
						) }
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-se-text m-0 mb-0.5 truncate">
								{ row.name }
							</p>
							{ row.email && (
								<p className="text-xs text-se-subtitle m-0 truncate">
									{ row.email }
								</p>
							) }
						</div>
						<div className="text-right whitespace-nowrap">
							<p className="text-sm font-semibold text-se-text m-0">
								<Price
									value={ row.revenue }
									args={ { currency } }
								/>
							</p>
							<p className="text-xs text-se-subtitle m-0">
								{ sprintf(
									// translators: %d: order count
									__( '%d orders', 'storeengine' ),
									row.orders
								) }
							</p>
						</div>
					</div>
				) )
			) : (
				<EmptyRow />
			) }
		</div>
	</Card>
);

const STATUS_CLASS = {
	completed: 'is-success',
	payment_confirmed: 'is-success',
	processing: 'is-info',
	pending_payment: 'is-warning',
	on_hold: 'is-warning',
	refunded: 'is-muted',
	cancelled: 'is-danger',
	failed: 'is-danger',
};

const RecentOrders = ( { rows, timeline, navigate } ) => (
	<Card className="mb-6">
		<AnalyticsSectionHeader
			label={ __( 'Recent Orders', 'storeengine' ) }
			timeline={ timeline }
		/>
		<div className="mt-2 flex flex-col">
			{ rows && rows.length ? (
				rows.map( ( row, index ) => (
					<button
						type="button"
						key={ index }
						className="storeengine-product-analytics__order-row"
						onClick={ () =>
							navigate(
								get_route_path( {
									page: 'storeengine-orders',
									id: row.order_id,
								} )
							)
						}
					>
						<span className="font-medium text-se-text">
							#{ row.order_id }
						</span>
						<span className="flex-1 min-w-0 truncate text-se-subtitle">
							{ row.customer }
						</span>
						<span
							className={ cx(
								'storeengine-product-analytics__status',
								STATUS_CLASS[ row.status ] || 'is-muted'
							) }
						>
							{ row.status?.replace( /_/g, ' ' ) }
						</span>
						<span className="text-se-subtitle whitespace-nowrap hidden sm:inline">
							{ row.date }
						</span>
						<span className="font-semibold text-se-text whitespace-nowrap">
							<Price
								value={ row.amount }
								args={ { currency: row.currency } }
							/>
						</span>
					</button>
				) )
			) : (
				<EmptyRow />
			) }
		</div>
	</Card>
);

const EmptyRow = () => (
	<p className="text-center text-sm text-se-subtitle py-6 m-0">
		{ __( 'No data for this period.', 'storeengine' ) }
	</p>
);

export default ProductAnalytics;
