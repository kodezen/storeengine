<?php

namespace StoreEngine\API;

use DateTime;
use StoreEngine\API\Schema\AnalyticsSchema;
use StoreEngine\Classes\Countries;
use StoreEngine\Classes\OrderCollection;
use StoreEngine\Utils\Caching;
use StoreEngine\Utils\Helper;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Analytics extends WP_REST_Controller {
	use AnalyticsSchema;

	public static function init() {
		$self            = new self();
		$self->namespace = STOREENGINE_PLUGIN_SLUG . '/v1';
		$self->rest_base = 'analytics';

		add_action( 'rest_api_init', [ $self, 'register_routes' ] );
	}

	public function register_routes() {
		register_rest_route( $this->namespace, '/' . $this->rest_base, [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_analytics' ],
				'permission_callback' => [ $this, 'get_permission_check' ],
				'args'                => [
					'context' => $this->get_context_param( [ 'default' => 'view' ] ),
					'from'    => [
						'title'       => __( 'From Date', 'storeengine' ),
						'type'        => 'string',
						'description' => __( 'Start unix timestamp.', 'storeengine' ),
						'default'     => gmdate( 'Y-m-d', strtotime( '- 1 month' ) ),
					],
					'to'      => [
						'title'       => __( 'To', 'storeengine' ),
						'type'        => 'string',
						'description' => __( 'End unix timestamp.', 'storeengine' ),
						'default'     => gmdate( 'Y-m-d' ),
					],
					'compare' => [
						'title'       => __( 'Compare days', 'storeengine' ),
						'type'        => 'integer',
						'description' => __( 'Compare data with last xx days.', 'storeengine' ),
						'default'     => 30,
					],
					// Optional currency filter. Defaults to store base currency.
					// Only currencies that have orders in the requested date range
					// are returned in currencies_in_period, so the frontend only
					// shows the filter dropdown when multiple currencies exist.
					'currency' => [
						'title'             => __( 'Currency', 'storeengine' ),
						'type'              => 'string',
						'description'       => __( 'ISO 4217 currency to filter analytics by. Defaults to store base currency.', 'storeengine' ),
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			],
		] );
	}

	public function get_permission_check() {
		return Helper::check_rest_user_cap( 'manage_options' );
	}

	public static function add_refund_statuses( array $statuses ): array {
		$statuses[] = 'refunded';

		return $statuses;
	}

	public function get_analytics( WP_REST_Request $request ) {
		if ( ! rest_parse_date( $request->get_param( 'from' ) . ' 00:00:00' ) ) {
			return new WP_Error( 'invalid_form_date', __( 'Invalid from date.', 'storeengine' ) );
		}

		if ( ! rest_parse_date( $request->get_param( 'to' ) . ' 00:00:00' ) ) {
			return new WP_Error( 'invalid_to_date', __( 'Invalid to date.', 'storeengine' ) );
		}

		if ( strtotime( Helper::get_first_order_date( 'Y-m-d' ) ) > strtotime( $request->get_param( 'from' ) ) ) {
			$request->set_param( 'from', Helper::get_first_order_date( 'Y-m-d' ) );
		}

		$from    = $request->get_param( 'from' );
		$to      = $request->get_param( 'to' );
		$compare = (int) $request->get_param( 'compare' );

		// Resolve the currency for this request.
		// Defaults to the store base currency — all existing behaviour unchanged.
		// Pass ?currency=BDT to filter all aggregate data to BDT orders only.
		$base_currency = strtoupper( Helper::get_settings( 'store_currency', 'USD' ) );
		$currency      = strtoupper( trim( $request->get_param( 'currency' ) ) ?: $base_currency );

		// Distinct currencies that have orders in the requested date range.
		// The frontend uses this to decide whether to show the currency filter
		// dropdown at all — if only one currency exists, no dropdown is needed.
		// Only orders within from..to are considered, not all-time.
		$currencies_in_period = $this->get_currencies_in_period( $from, $to );

		return rest_ensure_response( [
			// Active currency for this response — what all monetary values are in.
			'currency'             => $currency,
			// Currencies that have actual orders in this date range.
			// Empty array or single-item → frontend hides the currency filter.
			// Two or more → frontend shows a currency switcher dropdown.
			'currencies_in_period' => $currencies_in_period,
			// Tile list — addons append more rows via the
			// `storeengine/analytics/stats` filter (e.g. cost-profit injects
			// COGS / Profit / Margin here).
			'stats'                => apply_filters(
				'storeengine/analytics/stats',
				[
					[
						'label' => __( 'Sales', 'storeengine' ),
						'icon'  => 'money-receive',
						'data'  => $this->get_sales_stats( $from, $to, $compare, $currency ),
					],
					[
						'label' => __( 'Orders', 'storeengine' ),
						'icon'  => 'bag',
						'data'  => $this->get_orders_stats( $from, $to, $compare, $currency ),
					],
					[
						'label' => __( 'Refund', 'storeengine' ),
						'icon'  => 'money-send',
						'data'  => $this->get_refund_stats( $from, $to, $compare, $currency ),
					],
					[
						'label' => __( 'New Customers', 'storeengine' ),
						'icon'  => 'users',
						'data'  => $this->get_customer_stats( $from, $to, $compare, $currency ),
					],
				],
				$from,
				$to,
				$compare,
				$currency
			),
			'growth'        => $this->growth_report( $from, $to, $currency ),
			'heat_map'      => $this->heat_map( $from, $to, $currency ),
			'recent_orders' => $this->get_recent_orders(),
			'top_products'  => $this->get_top_selling_products( $from, $to, $compare, $currency ),
		] );
	}

	// ── Currency helper ───────────────────────────────────────────────────────

	/**
	 * Distinct currencies that have orders in the given date range.
	 *
	 * Only looks at the requested from..to window, not all-time.
	 * The frontend uses this to decide whether to render a currency filter
	 * dropdown — if only the base currency exists, the dropdown is hidden.
	 *
	 * Result is cached per date range.
	 *
	 * @return array  e.g. ['USD'] or ['BDT', 'USD']  (always sorted, base first)
	 */
	protected function get_currencies_in_period( string $from, string $to ): array {
		global $wpdb;

		$key    = $this->get_cache_key( 'storeengine_orders', 'currencies_in_period', $from, $to );
		$cached = wp_cache_get( $key, 'storeengine_orders-queries' );

		if ( false !== $cached ) {
			return $cached;
		}

		$query = $wpdb->prepare(
			"SELECT DISTINCT o.currency
				FROM {$wpdb->prefix}storeengine_orders AS o
				INNER JOIN {$wpdb->prefix}storeengine_orders_meta AS dm
					ON dm.order_id = o.id
					AND dm.meta_key = '_order_placed_date_gmt'
				WHERE o.type        = 'order'
				AND o.currency   IS NOT NULL
				AND o.currency   <> ''
				AND CAST( dm.meta_value AS DATE ) BETWEEN %s AND %s
				ORDER BY o.currency ASC",
			$from, $to
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared
		$rows = $wpdb->get_col( $query );

		$base        = strtoupper( Helper::get_settings( 'store_currency', 'USD' ) );
		$currencies  = array_map( 'strtoupper', $rows ?: [] );

		// Base currency always first.
		if ( in_array( $base, $currencies, true ) ) {
			$currencies = array_merge( [ $base ], array_diff( $currencies, [ $base ] ) );
		}

		wp_cache_set( $key, $currencies, 'storeengine_orders-queries' );

		return $currencies;
	}

	// ── Sales stats ───────────────────────────────────────────────────────────

	/**
	 * Total sales for the period vs comparison period.
	 *
	 * $currency defaults to base currency — behaviour identical to original
	 * when no ?currency= param is passed.
	 * When ?currency=BDT is passed, only BDT orders are summed.
	 */
	protected function get_sales_stats( string $from, string $to, int $compare, string $currency ): array {
		global $wpdb;

		$query = $wpdb->prepare( "
			SELECT
				curr.total_sales AS current_sales,
				prev.total_sales AS previous_sales,
				CASE
					WHEN prev.total_sales = 0 THEN NULL
					ELSE ROUND(
						((curr.total_sales - prev.total_sales) / prev.total_sales) * 100,
						2
					)
				END AS sales_rate
			FROM (
				SELECT
					COALESCE(SUM(CAST(total.meta_value AS DECIMAL(10,2))), 0) AS total_sales
				FROM {$wpdb->prefix}storeengine_orders_meta AS total
				INNER JOIN {$wpdb->prefix}storeengine_orders_meta AS date_meta
					ON total.order_id = date_meta.order_id
				INNER JOIN {$wpdb->prefix}storeengine_orders AS o
					ON o.id = total.order_id
				WHERE total.meta_key     = '_total'
					AND date_meta.meta_key = '_order_placed_date_gmt'
					AND CAST(date_meta.meta_value AS DATE) BETWEEN %s AND %s
					AND o.currency = %s
					AND o.status IN ('processing','payment_confirmed','completed')
			) AS curr
			CROSS JOIN (
				SELECT
					COALESCE(SUM(CAST(total.meta_value AS DECIMAL(10,2))), 0) AS total_sales
				FROM {$wpdb->prefix}storeengine_orders_meta AS total
				INNER JOIN {$wpdb->prefix}storeengine_orders_meta AS date_meta
					ON total.order_id = date_meta.order_id
				INNER JOIN {$wpdb->prefix}storeengine_orders AS o
					ON o.id = total.order_id
				WHERE total.meta_key     = '_total'
					AND date_meta.meta_key = '_order_placed_date_gmt'
					AND CAST(date_meta.meta_value AS DATE)
						BETWEEN DATE_SUB(%s, INTERVAL %d DAY) AND DATE_SUB(%s, INTERVAL %d DAY)
					AND o.currency = %s
			) AS prev
		",
			$from, $to, $currency,
			$from, $compare, $to, $compare, $currency
		);

		$key  = $this->get_cache_key( 'storeengine_orders', $query, $from, $to, $compare, $currency );
		$data = wp_cache_get( $key, 'storeengine_orders-queries' );

		if ( false === $data ) {
			$result = $wpdb->get_row( $query ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared

			if ( $result ) {
				$data = [
					'count'    => (float) $result->current_sales,
					'format'   => true,
					'rate'     => null !== $result->sales_rate ? (float) $result->sales_rate : null,
					'currency' => $currency,
				];
				wp_cache_set( $key, $data, 'storeengine_orders-queries' );
			} else {
				$data = [
					'count'    => __( 'N/A', 'storeengine' ),
					'rate'     => 0,
					'currency' => $currency,
				];
			}
		}

		return $data;
	}

	// ── Orders stats — currency-neutral ───────────────────────────────────────

	protected function get_orders_stats( string $from, string $to, int $compare, string $currency ): array {
		global $wpdb;

		$query = $wpdb->prepare( "
		SELECT
			SUM(CASE
				WHEN DATE(m.meta_value) BETWEEN %s AND %s THEN 1
				ELSE 0
			END) AS total_orders,
			SUM(CASE
				WHEN DATE(m.meta_value) BETWEEN DATE_SUB(%s, INTERVAL %d DAY)
				     AND DATE_SUB(%s, INTERVAL 1 DAY)
				THEN 1
				ELSE 0
			END) AS compare_orders
		FROM {$wpdb->prefix}storeengine_orders AS o
		INNER JOIN {$wpdb->prefix}storeengine_orders_meta AS m
			ON o.id = m.order_id
		WHERE
			o.type = 'order'
			AND m.meta_key = '_order_placed_date_gmt'
			AND m.meta_value <> ''
			AND o.currency = %s
			AND o.status IN ('processing','payment_confirmed','completed')
	", $from, $to, $from, $compare, $from, $currency );

		$key  = $this->get_cache_key( 'storeengine_orders', $query, $from, $to, $compare );
		$data = wp_cache_get( $key, 'storeengine_orders-queries' );

		if ( false === $data ) {
			$result = $wpdb->get_row( $query ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared

			if ( $result ) {
				$total_orders   = (int) $result->total_orders;
				$compare_orders = (int) $result->compare_orders;

				if ( $compare_orders > 0 ) {
					$order_rate = round( ( ( $total_orders - $compare_orders ) / $compare_orders ) * 100, 2 );
				} else {
					$order_rate = $total_orders > 0 ? 100 : 0;
				}

				$data = [ 'count' => $total_orders, 'rate' => $order_rate ];
				wp_cache_set( $key, $data, 'storeengine_orders-queries' );
			} else {
				$data = [ 'count' => __( 'N/A', 'storeengine' ), 'rate' => 0 ];
			}
		}

		return $data;
	}

	// ── Refund stats ──────────────────────────────────────────────────────────

	protected function get_refund_stats( string $from, string $to, int $compare, string $currency ): array {
		global $wpdb;

		$query = $wpdb->prepare( "
		    SELECT
		        curr.total_refunds AS current_refunds,
		        prev.total_refunds AS previous_refunds,
		        CASE
		            WHEN prev.total_refunds = 0 THEN NULL
		            ELSE ROUND(
		                ((curr.total_refunds - prev.total_refunds) / prev.total_refunds) * 100,
		                2
		            )
		        END AS refund_rate
		    FROM (
		        SELECT COALESCE(SUM(CAST(o.total_amount AS DECIMAL(10,2))), 0) AS total_refunds
		        FROM {$wpdb->prefix}storeengine_orders AS o
		        WHERE o.type = 'refund_order'
		          AND CAST(o.date_created_gmt AS DATE) BETWEEN %s AND %s
		          AND o.currency = %s
		    ) AS curr
		    CROSS JOIN (
		        SELECT COALESCE(SUM(CAST(o.total_amount AS DECIMAL(10,2))), 0) AS total_refunds
		        FROM {$wpdb->prefix}storeengine_orders AS o
		        WHERE o.type = 'refund_order'
		          AND CAST(o.date_created_gmt AS DATE)
		              BETWEEN DATE_SUB(%s, INTERVAL %d DAY) AND DATE_SUB(%s, INTERVAL %d DAY)
		          AND o.currency = %s
		    ) AS prev
		",
			$from, $to, $currency,
			$from, $compare, $to, $compare, $currency
		);

		$key  = $this->get_cache_key( 'storeengine_orders', $query, $from, $to, $compare, $currency );
		$data = wp_cache_get( $key, 'storeengine_orders-queries' );

		if ( false === $data ) {
			$result = $wpdb->get_row( $query ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared

			if ( $result ) {
				$data = [
					'count'    => (float) $result->current_refunds,
					'format'   => true,
					'rate'     => null !== $result->refund_rate ? (float) $result->refund_rate : null,
					'currency' => $currency,
				];
				wp_cache_set( $key, $data, 'storeengine_orders-queries' );
			} else {
				$data = [ 'count' => __( 'N/A', 'storeengine' ), 'format' => false, 'rate' => 0 ];
			}
		}

		return $data;
	}

	// ── Customer stats — currency-neutral ─────────────────────────────────────

	protected function get_customer_stats( string $from, string $to, int $compare, string $currency ): array {
		global $wpdb;

		$query = $wpdb->prepare( "
			SELECT
				curr.new_customers AS current_customers,
				prev.new_customers AS previous_customers,
				CASE
					WHEN prev.new_customers = 0 THEN NULL
					ELSE ROUND(
						((curr.new_customers - prev.new_customers) / prev.new_customers) * 100,
						2
					)
				END AS customer_rate
			FROM (

				/* CURRENT PERIOD */
				SELECT COUNT(DISTINCT o.customer_id) AS new_customers
				FROM {$wpdb->prefix}storeengine_orders o
				WHERE o.type = 'order'
				AND o.currency = %s
				AND o.status IN ('processing','payment_confirmed','completed')
				AND DATE(o.date_created_gmt) BETWEEN %s AND %s
				AND NOT EXISTS (
						SELECT 1
						FROM {$wpdb->prefix}storeengine_orders o2
						WHERE o2.type = 'order'
						AND o2.currency = %s
						AND o2.customer_id = o.customer_id
						AND DATE(o2.date_created_gmt) < %s
				)

			) AS curr

			CROSS JOIN (

				/* PREVIOUS PERIOD */
				SELECT COUNT(DISTINCT o.customer_id) AS new_customers
				FROM {$wpdb->prefix}storeengine_orders o
				WHERE o.type = 'order'
				AND o.currency = %s
				AND DATE(o.date_created_gmt)
						BETWEEN DATE_SUB(%s, INTERVAL %d DAY)
							AND DATE_SUB(%s, INTERVAL %d DAY)
				AND NOT EXISTS (
						SELECT 1
						FROM {$wpdb->prefix}storeengine_orders o2
						WHERE o2.type = 'order'
						AND o2.currency = %s
						AND o2.customer_id = o.customer_id
						AND DATE(o2.date_created_gmt) < DATE_SUB(%s, INTERVAL %d DAY)
				)

			) AS prev
		",
			$currency, $from, $to, $currency, $from,
			$currency, $from, $compare, $to, $compare,
			$currency, $from, $compare
		);

		$key  = $this->get_cache_key( 'users', $query, $from, $to, $compare, $currency );
		$data = wp_cache_get( $key, 'users-queries' );

		if ( false === $data ) {
			$result = $wpdb->get_row( $query ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared

			if ( $result ) {
				$data = [
					'count' => (int) $result->current_customers,
					'rate'  => $result->customer_rate !== null ? (float) $result->customer_rate : null,
					'currency' => $currency,
				];

				wp_cache_set( $key, $data, 'storeengine_orders-queries' );
			} else {
				$data = [
					'count' => 0,
					'rate'  => 0,
					'currency' => $currency,
				];
			}
		}

		return $data;
	}

	// ── Growth chart ──────────────────────────────────────────────────────────

	/**
	 * Day-by-day sales, refunds and order counts for the chart.
	 *
	 * Filters by $currency so amounts are all in the same unit.
	 * Default = base currency → single-line chart, same as original.
	 * Pass ?currency=BDT → BDT-only chart.
	 */
	protected function growth_report( string $from, string $to, string $currency ): array {
		global $wpdb;

		$chart_data = [
			'datasets' => [
				[
					'label'           => __( 'Sales', 'storeengine' ),
					'format'          => true,
					'data'            => [],
					'borderColor'     => '#16A34A',
					'backgroundColor' => '#16A34A',
				],
				[
					'label'           => __( 'Refunds', 'storeengine' ),
					'format'          => true,
					'data'            => [],
					'borderColor'     => '#FF4D4D',
					'backgroundColor' => '#FF4D4D',
				],
				[
					'label'           => __( 'Orders', 'storeengine' ),
					'data'            => [],
					'borderColor'     => '#FF7A00',
					'backgroundColor' => '#FF7A00',
				],
			],
		];

		$query = $wpdb->prepare(
			"SELECT
			    daily.date,
			    COALESCE(SUM(daily.sales),  0) AS total_sales,
			    COALESCE(SUM(daily.refunds), 0) AS total_refunds,
			    COALESCE(SUM(daily.orders),  0) AS total_orders
			FROM (
			    SELECT
			        DATE(dm.meta_value)                          AS date,
			        SUM(CAST(o.total_amount AS DECIMAL(10,2)))   AS sales,
			        0                                            AS refunds,
			        COUNT(DISTINCT dm.order_id)                  AS orders
			    FROM {$wpdb->prefix}storeengine_orders_meta AS dm
			    STRAIGHT_JOIN {$wpdb->prefix}storeengine_orders AS o
			        ON o.id = dm.order_id
			    WHERE dm.meta_key    = '_order_placed_date_gmt'
			      AND dm.meta_value <> ''
			      AND DATE(dm.meta_value) BETWEEN %s AND %s
			      AND o.type        = 'order'
			      AND o.currency    = %s
			    GROUP BY DATE(dm.meta_value)

			    UNION ALL

			    SELECT
			        DATE(o.date_created_gmt)                     AS date,
			        0                                            AS sales,
			        SUM(CAST(o.total_amount AS DECIMAL(10,2)))   AS refunds,
			        0                                            AS orders
			    FROM {$wpdb->prefix}storeengine_orders AS o
			    WHERE o.type = 'refund_order'
			      AND DATE(o.date_created_gmt) BETWEEN %s AND %s
			      AND o.currency = %s
			    GROUP BY DATE(o.date_created_gmt)
			) AS daily
			GROUP BY daily.date
			ORDER BY daily.date ASC",
			$from, $to, $currency,
			$from, $to, $currency
		);

		$key  = $this->get_cache_key( 'storeengine_orders', $query, $from, $to, $currency );
		$data = wp_cache_get( $key, 'storeengine_orders-queries' );

		if ( false === $data ) {
			$results = $wpdb->get_results( $query, OBJECT_K ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared

			$start = new DateTime( $from );
			$end   = new DateTime( $to );
			$end->modify( '+1 day' );

			$data = [ 'labels' => [], 'sales' => [], 'refunds' => [], 'orders' => [] ];

			for ( $date = $start; $date < $end; $date->modify( '+1 day' ) ) {
				$day              = $date->format( 'Y-m-d' );
				$data['labels'][] = $date->format( 'M j, Y' );

				if ( isset( $results[ $day ] ) ) {
					$row               = $results[ $day ];
					$data['sales'][]   = abs( (float) $row->total_sales );
					$data['refunds'][] = abs( (float) $row->total_refunds );
					$data['orders'][]  = (int) $row->total_orders;
				} else {
					$data['sales'][]   = 0;
					$data['refunds'][] = 0;
					$data['orders'][]  = 0;
				}
			}

			$data['totals'] = [
				'sales'      => array_sum( $data['sales'] ),
				'refunds'    => array_sum( $data['refunds'] ),
				'orders'     => array_sum( $data['orders'] ),
				'avg_return' => 0,
			];

			if ( $data['totals']['sales'] && $data['totals']['refunds'] ) {
				$data['totals']['avg_return'] = ( $data['totals']['refunds'] / $data['totals']['sales'] ) * 100;
			}

			wp_cache_set( $key, $data, 'storeengine_orders-queries' );
		}

		$chart_data['labels']              = $data['labels'];
		$chart_data['totals']              = $data['totals'];
		$chart_data['currency']            = $currency;
		$chart_data['datasets'][0]['data'] = $data['sales'];
		$chart_data['datasets'][1]['data'] = $data['refunds'];
		$chart_data['datasets'][2]['data'] = $data['orders'];

		return $chart_data;
	}

	// ── Heat map — currency-neutral ───────────────────────────────────────────

	protected function heat_map( string $from, string $to, string $currency ): array {
		global $wpdb;

		$query = $wpdb->prepare( "
			SELECT
				oa.country AS country,
				COUNT(DISTINCT oa.order_id) AS total
			FROM {$wpdb->prefix}storeengine_orders_meta AS om
			INNER JOIN {$wpdb->prefix}storeengine_order_addresses AS oa
				ON om.order_id = oa.order_id
				AND oa.address_type = 'billing'
			INNER JOIN {$wpdb->prefix}storeengine_orders AS o
				ON o.id = om.order_id
			WHERE om.meta_key = '_order_placed_date_gmt'
			AND om.meta_value <> ''
			AND DATE(om.meta_value) BETWEEN %s AND %s
			AND o.currency = %s
			AND o.status IN ('processing','payment_confirmed','completed')
			GROUP BY oa.country
			ORDER BY total DESC
		",
			$from, $to, $currency
		);

		$key  = $this->get_cache_key(
			'storeengine_orders',
			$query,
			$from,
			$to,
			$currency
		);

		$data = wp_cache_get( $key, 'storeengine_orders-queries' );

		if ( false === $data ) {
			$data    = [];
			$results = $wpdb->get_results( $query, ARRAY_N ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared

			foreach ( $results as [ $cc, $total ] ) {
				if ( ! $cc ) {
					continue;
				}

				$cc = strtoupper( $cc );

				$data[$cc] = [
					'cc'    => $cc,
					'name'  => Countries::init()->get_country( $cc ) ?? $cc,
					'value' => (int) $total,
				];
			}

			wp_cache_set( $key, $data, 'storeengine_orders-queries' );
		}

		return array_values( $data );
	}

	// ── Recent orders — each in its own currency ──────────────────────────────

	protected function get_recent_orders(): array {
		$query = new OrderCollection( [
			'per_page' => 6,
			'orderby'  => 'id',
			'order'    => 'DESC',
			'where'    => [
				'relation' => 'AND',
				[ 'key' => 'type', 'value' => 'order' ],
				[
					'key'     => 'status',
					'value'   => [ 'pending', 'completed', 'processing', 'payment_confirmed' ],
					'compare' => 'IN',
				],
			],
		] );

		if ( ! $query->have_results() ) {
			return [];
		}

		$data = [];
		$na   = __( 'N/A', 'storeengine' );

		while ( $query->have_results() ) {
			$order    = $query->next_result();
			$products = $order->get_line_product_items();
			$total    = count( $products );

			if ( $total ) {
				$product = reset( $products )->get_name();
				if ( $total > 1 ) {
					// translators: %1$s: product name, %2$d: remaining count.
					$product = sprintf( __( '%1$s and %2$d more', 'storeengine' ), $product, $total - 1 );
				}
			} else {
				$product = $na;
			}

			$date  = $na;
			$since = $na;

			if ( $order->get_order_placed_date_gmt() ) {
				$date  = $order->get_order_placed_date_gmt()->format( 'Y-m-d H:i:s' );
				/* translators: %s: Human-readable time difference. */
				$since = sprintf( __( '%s ago', 'storeengine' ), human_time_diff( $order->get_order_placed_date_gmt()->format( 'U' ) ) );
			}

			$data[] = [
				'product'  => $product,
				'customer' => $order->get_customer() ? $order->get_customer()->get_name() : $na,
				'amount'   => (float) $order->get_total(),
				'currency' => $order->get_currency(),
				'status'   => $order->get_status(),
				'payment'  => $order->get_paid_status(),
				'date'     => $date,
				'since'    => $since,
			];
		}

		return $data;
	}

	// ── Top selling products ──────────────────────────────────────────────────

	/**
	 * Top 5 products by revenue in $currency, with the change vs the compare
	 * window.
	 *
	 * Performance (audit 2026-09): the old query put the date range only inside
	 * SUM(CASE …), so every paid order line ever recorded was joined (4 meta
	 * joins each) and grouped on every dashboard load (~4s at 200k orders), and
	 * its wp_cache result didn't persist without an object cache. Now:
	 * - the query is DRIVEN by the date range (range scan on the
	 *   `_order_placed_date_gmt` meta index, STRAIGHT_JOIN so the optimizer
	 *   can't flip to a full orders scan);
	 * - lines are read from `storeengine_order_product_lookup` (one indexed row
	 *   per line) instead of three item-meta joins — 161ms / 624ms for 30-day /
	 *   1-year at 200k orders;
	 * - products are joined AFTER aggregating (a BIGINT id vs text meta join
	 *   can't use the posts PK);
	 * - the result is cached in a short transient.
	 * The lookup is filled by a queued job, so any in-window order missing from
	 * it makes this fall back to the (date-bounded) order-meta query and queue a
	 * rebuild for those orders; numbers are never computed from partial data.
	 */
	protected function get_top_selling_products( string $from, string $to, int $compare, string $currency ): array {
		$from_ts = strtotime( $from . ' 00:00:00 UTC' );
		$to_ts   = strtotime( $to . ' 00:00:00 UTC' );
		if ( ! $from_ts || ! $to_ts ) {
			return [];
		}

		$compare = max( 0, $compare );
		$w       = [
			'cur_start' => gmdate( 'Y-m-d 00:00:00', $from_ts ),
			'cur_end'   => gmdate( 'Y-m-d 23:59:59', $to_ts ),
			'cmp_start' => gmdate( 'Y-m-d 00:00:00', $from_ts - $compare * DAY_IN_SECONDS ),
			'cmp_end'   => gmdate( 'Y-m-d 23:59:59', $from_ts - DAY_IN_SECONDS ),
		];
		$w['range_start'] = $compare > 0 ? $w['cmp_start'] : $w['cur_start'];

		$cache_key = 'storeengine_top_products_' . md5( wp_json_encode( [ $w, $currency ] ) );
		$cached    = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$totals = $this->top_products_from_lookup( $w, $currency );
		if ( null === $totals ) {
			$totals = $this->top_products_from_meta( $w, $currency );
		}

		$results = $this->finalize_top_products( $totals );

		// Short-lived: a new order shows up within a few minutes.
		set_transient( $cache_key, $results, 5 * MINUTE_IN_SECONDS );

		return $results;
	}

	/**
	 * Per-product totals from the product lookup table, or null when any paid
	 * order in the window has no lookup rows yet (then a rebuild is queued).
	 *
	 * @return array<int, object>|null product_id => totals.
	 */
	protected function top_products_from_lookup( array $w, string $currency ): ?array {
		global $wpdb;

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- bounded aggregate, cached by the caller.

		// 1) Any paid order in the window without lookup rows? Index-only and
		//    stops at the first hit (~20ms / ~170ms for 30d / 1y at 200k orders).
		$has_gap = $wpdb->get_var( $wpdb->prepare( "
			SELECT 1
			FROM {$wpdb->prefix}storeengine_orders_meta AS dm
			STRAIGHT_JOIN {$wpdb->prefix}storeengine_orders AS o
			    ON o.id = dm.order_id
			    AND o.type = 'order'
			    AND o.status IN ( 'processing', 'payment_confirmed', 'completed' )
			    AND o.currency = %s
			WHERE dm.meta_key = '_order_placed_date_gmt'
			  AND dm.meta_value BETWEEN %s AND %s
			  AND NOT EXISTS (
			      SELECT 1 FROM {$wpdb->prefix}storeengine_order_product_lookup AS l
			      WHERE l.order_id = o.id
			  )
			LIMIT 1
			",
			$currency,
			$w['range_start'], $w['cur_end']
		) );

		if ( $has_gap ) {
			// Don't report partial numbers; heal the lookup for next time.
			$this->queue_lookup_rebuild( $w, $currency );
			return null;
		}

		// 2) Totals: one indexed lookup row per order line, no meta joins.
		$rows = $wpdb->get_results( $wpdb->prepare( "
			SELECT
			    l.product_id,
			    SUM( CASE WHEN dm.meta_value BETWEEN %s AND %s THEN l.product_net_revenue ELSE 0 END ) AS total_sales,
			    SUM( CASE WHEN dm.meta_value BETWEEN %s AND %s THEN l.product_qty ELSE 0 END ) AS units_sold,
			    SUM( CASE WHEN dm.meta_value BETWEEN %s AND %s THEN l.product_net_revenue ELSE 0 END ) AS compare_sales,
			    SUM( CASE WHEN dm.meta_value BETWEEN %s AND %s THEN l.product_qty ELSE 0 END ) AS compare_units
			FROM {$wpdb->prefix}storeengine_orders_meta AS dm
			STRAIGHT_JOIN {$wpdb->prefix}storeengine_orders AS o
			    ON o.id = dm.order_id
			    AND o.type = 'order'
			    AND o.status IN ( 'processing', 'payment_confirmed', 'completed' )
			    AND o.currency = %s
			INNER JOIN {$wpdb->prefix}storeengine_order_product_lookup AS l
			    ON l.order_id = o.id
			WHERE dm.meta_key = '_order_placed_date_gmt'
			  AND dm.meta_value BETWEEN %s AND %s
			GROUP BY l.product_id
			",
			$w['cur_start'], $w['cur_end'],
			$w['cur_start'], $w['cur_end'],
			$w['cmp_start'], $w['cmp_end'],
			$w['cmp_start'], $w['cmp_end'],
			$currency,
			$w['range_start'], $w['cur_end']
		) );
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$totals = [];
		foreach ( (array) $rows as $row ) {
			$totals[ (int) $row->product_id ] = $row;
		}

		return $totals;
	}

	/**
	 * Queue the lookup rebuild (the existing storeengine/store_product_lookup
	 * job) for up to 50 in-window paid orders that have no lookup rows.
	 */
	protected function queue_lookup_rebuild( array $w, string $currency ): void {
		global $wpdb;

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- small bounded id list.
		$ids = $wpdb->get_col( $wpdb->prepare( "
			SELECT o.id
			FROM {$wpdb->prefix}storeengine_orders_meta AS dm
			STRAIGHT_JOIN {$wpdb->prefix}storeengine_orders AS o
			    ON o.id = dm.order_id
			    AND o.type = 'order'
			    AND o.status IN ( 'processing', 'payment_confirmed', 'completed' )
			    AND o.currency = %s
			LEFT JOIN {$wpdb->prefix}storeengine_order_product_lookup AS l
			    ON l.order_id = o.id
			WHERE dm.meta_key = '_order_placed_date_gmt'
			  AND dm.meta_value BETWEEN %s AND %s
			  AND l.order_id IS NULL
			LIMIT 50
			",
			$currency,
			$w['range_start'], $w['cur_end']
		) );
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$queue = \StoreEngine::init()->queue();
		foreach ( $ids as $id ) {
			if ( ! $queue->get_next( 'storeengine/store_product_lookup', [ (int) $id ] ) ) {
				$queue->schedule_single( time() + 1, 'storeengine/store_product_lookup', [ (int) $id ] );
			}
		}
	}

	/**
	 * Per-product totals from order item meta (fallback; date-bounded).
	 *
	 * @return array<int, object> product_id => totals.
	 */
	protected function top_products_from_meta( array $w, string $currency ): array {
		global $wpdb;

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- bounded aggregate, cached by the caller.
		$rows = $wpdb->get_results( $wpdb->prepare( "
			SELECT
			    CAST( product_id.meta_value AS UNSIGNED ) AS product_id,
			    SUM( CASE WHEN dm.meta_value BETWEEN %s AND %s
			              THEN CAST( line_total.meta_value AS DECIMAL( 26, 8 ) ) ELSE 0 END ) AS total_sales,
			    SUM( CASE WHEN dm.meta_value BETWEEN %s AND %s
			              THEN CAST( quantity.meta_value AS DECIMAL( 15, 3 ) ) ELSE 0 END ) AS units_sold,
			    SUM( CASE WHEN dm.meta_value BETWEEN %s AND %s
			              THEN CAST( line_total.meta_value AS DECIMAL( 26, 8 ) ) ELSE 0 END ) AS compare_sales,
			    SUM( CASE WHEN dm.meta_value BETWEEN %s AND %s
			              THEN CAST( quantity.meta_value AS DECIMAL( 15, 3 ) ) ELSE 0 END ) AS compare_units
			FROM {$wpdb->prefix}storeengine_orders_meta AS dm
			STRAIGHT_JOIN {$wpdb->prefix}storeengine_orders AS o
			    ON o.id = dm.order_id
			    AND o.type = 'order'
			    AND o.status IN ( 'processing', 'payment_confirmed', 'completed' )
			    AND o.currency = %s
			INNER JOIN {$wpdb->prefix}storeengine_order_items AS oi
			    ON oi.order_id = o.id
			INNER JOIN {$wpdb->prefix}storeengine_order_item_meta AS product_id
			    ON product_id.order_item_id = oi.order_item_id
			    AND product_id.meta_key = '_product_id'
			INNER JOIN {$wpdb->prefix}storeengine_order_item_meta AS quantity
			    ON quantity.order_item_id = oi.order_item_id
			    AND quantity.meta_key = '_quantity'
			INNER JOIN {$wpdb->prefix}storeengine_order_item_meta AS line_total
			    ON line_total.order_item_id = oi.order_item_id
			    AND line_total.meta_key = '_line_total'
			WHERE dm.meta_key = '_order_placed_date_gmt'
			  AND dm.meta_value BETWEEN %s AND %s
			GROUP BY product_id
			",
			$w['cur_start'], $w['cur_end'],
			$w['cur_start'], $w['cur_end'],
			$w['cmp_start'], $w['cmp_end'],
			$w['cmp_start'], $w['cmp_end'],
			$currency,
			$w['range_start'], $w['cur_end']
		) );
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$totals = [];
		foreach ( (array) $rows as $row ) {
			$totals[ (int) $row->product_id ] = $row;
		}

		return $totals;
	}

	/**
	 * Keep published products with sales in the window, top 5 by revenue, and
	 * add names + change rates. Product rows are fetched for the few ids only.
	 *
	 * @param array<int, object> $totals product_id => totals.
	 */
	protected function finalize_top_products( array $totals ): array {
		global $wpdb;

		$totals = array_filter( $totals, fn( $t ) => (float) $t->total_sales > 0 );
		if ( ! $totals ) {
			return [];
		}

		$ids = array_map( 'intval', array_keys( $totals ) );
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- id list is int-cast; placeholders built per id.
		$names = $wpdb->get_results( $wpdb->prepare(
			"SELECT ID, post_title FROM {$wpdb->posts}
			WHERE post_type = 'storeengine_product' AND post_status = 'publish'
			  AND ID IN ( " . implode( ',', array_fill( 0, count( $ids ), '%d' ) ) . ' )',
			...$ids
		), OBJECT_K );
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		$rate = static function ( float $now, float $before ): float {
			if ( 0.0 === $before ) {
				return $now > 0 ? 100.0 : 0.0;
			}
			return round( ( $now - $before ) / $before * 100, 2 );
		};

		$results = [];
		foreach ( $totals as $id => $t ) {
			if ( ! isset( $names[ $id ] ) ) {
				continue;
			}
			$sales    = (float) $t->total_sales;
			$units    = (float) $t->units_sold;
			$c_sales  = (float) $t->compare_sales;
			$c_units  = (float) $t->compare_units;

			$results[] = (object) [
				'product_id'    => (int) $id,
				'product_name'  => $names[ $id ]->post_title,
				'total_sales'   => $sales,
				'units_sold'    => $units,
				'compare_sales' => $c_sales,
				'compare_units' => $c_units,
				'sales_rate'    => $rate( $sales, $c_sales ),
				'units_rate'    => $rate( $units, $c_units ),
			];
		}

		usort( $results, fn( $a, $b ) => $b->total_sales <=> $a->total_sales );

		return array_slice( $results, 0, 5 );
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	protected function get_cache_key( $group, $sql, ...$args ): string {
		return get_class( $this ) . ':' . Caching::get_query_cache_key( $group, $sql, ...$args );
	}

	/**
	 * @deprecated 1.5.7
	 */
	public function get_analytics_old( $request ): WP_REST_Response {
		$start_date = gmdate( 'Y-m-d H:i:00', strtotime( $request->get_param( 'start_date' ) ) );
		$end_date   = gmdate( 'Y-m-d H:i:59', strtotime( $request->get_param( 'end_date' ) ?? gmdate( 'd-m-Y h:i:s', strtotime( '-7 days' ) ) ) );

		add_filter( 'storeengine/order_paid_statuses', [ __CLASS__, 'add_refund_statuses' ] );

		$analytics    = new \StoreEngine\Classes\Analytics();
		$totals       = $analytics->get_orders_totals( $start_date, $end_date );
		$total_orders = (float) $totals->total_orders;
		$total_sales  = (float) $totals->total_sales;
		$total_tax    = (float) $totals->total_tax;

		$total_refunds = $analytics->get_total_refunds( $start_date, $end_date );
		$total_refunds = $total_refunds ? (float) $total_refunds->total_refunds : 0;
		$gross_sales   = $total_sales - $total_refunds;

		$product_sold        = $analytics->get_product_sold( $start_date, $end_date );
		$total_products_sold = $product_sold ? (float) $product_sold->total_products_sold : 0;
		$new_customers_count = Helper::get_new_customers_count( $start_date, $end_date );

		remove_filter( 'storeengine/order_paid_statuses', [ __CLASS__, 'add_refund_statuses' ] );

		$response = compact( 'total_orders', 'total_sales', 'total_refunds', 'gross_sales', 'total_tax', 'total_products_sold', 'new_customers_count' );

		return new WP_REST_Response( $response, 200 );
	}
}
