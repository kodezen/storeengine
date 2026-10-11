import { __ } from '@wordpress/i18n';
import moment from 'moment';
import { momentFrom } from '@Utils/helper';

/**
 * Shared analytics date-range helpers.
 *
 * Consumed by both the core Dashboard filters (free) and the Pro Deployments
 * analytics filters. It lives in free so the core Dashboard never has to reach
 * into a Pro page directory; the Pro copy at
 * `Deployments/Analytics/helper.js` simply re-exports from here.
 */
export const compareOptions = [
	{ label: __( 'Last 30 days', 'storeengine' ), value: 30 },
	{ label: __( 'Last 15 days', 'storeengine' ), value: 15 },
	{ label: __( 'Last 7 days', 'storeengine' ), value: 7 },
	{ label: __( 'Last day', 'storeengine' ), value: 1 },
];

const dateFormat = 'MMM DD, YYYY';
const valueFormat = 'YYYY-MM-DD';

const makeOptItem = ( label, val, period ) => {
	const from = val && period ? moment().add( val, period ) : moment();
	const to = moment();
	return {
		label,
		value: {
			from: from.format( valueFormat ),
			to: to.format( valueFormat ),
		},
		rangeLabel: `${ from.format( dateFormat ) } - ${ to.format(
			dateFormat
		) }`,
	};
};

export const generateDateRangeOptions = ( startDate ) => {
	startDate = startDate
		? momentFrom( startDate, 'mysql' )
		: moment().add( -1, 'year' );
	const from = moment().startOf( 'month' );
	const today = moment();

	const list = [
		makeOptItem( __( 'Today', 'storeengine' ) ),
		makeOptItem( __( 'Last 7 Days', 'storeengine' ), -1, 'weeks' ),
		makeOptItem( __( 'Last 15 Days', 'storeengine' ), -15, 'days' ),
		makeOptItem( __( 'Past 30 days', 'storeengine' ), -1, 'month' ),
		makeOptItem( __( 'Last 3 Months', 'storeengine' ), -3, 'month' ),
		makeOptItem( __( 'Last 6 Months', 'storeengine' ), -6, 'month' ),
		{
			label: __( 'All Time', 'storeengine' ),
			value: {
				from: startDate.format( valueFormat ),
				to: today.format( valueFormat ),
			},
			rangeLabel: `${ startDate.format( dateFormat ) } - ${ today.format(
				dateFormat
			) }`,
		},
		{
			label: __( 'Custom', 'storeengine' ),
			value: { from: 'custom', to: 'custom' },
			rangeLabel: __( 'Custom Date Range', 'storeengine' ),
		},
	];

	if ( from.format( valueFormat ) !== moment().format( valueFormat ) ) {
		return [
			{
				label: __( 'Month to Date', 'storeengine' ),
				value: {
					from: from.format( valueFormat ),
					to: today.format( valueFormat ),
				},
				rangeLabel: `${ from.format( dateFormat ) } - ${ today.format(
					dateFormat
				) }`,
			},
			...list,
		];
	}

	return list;
};
