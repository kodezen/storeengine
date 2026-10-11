import { __ } from '@wordpress/i18n';

export const delaysOptions = [
	{
		label: __( '30 Minutes', 'storeengine' ),
		value: 1800,
	},
	{
		label: __( '1 Hour', 'storeengine' ),
		value: 3600,
	},
	{
		label: __( '2 Hours', 'storeengine' ),
		value: 7200,
	},
	{
		label: __( '3 Hours', 'storeengine' ),
		value: 10800,
	},
	{
		label: __( '6 Hours', 'storeengine' ),
		value: 21600,
	},
	{
		label: __( '12 Hours', 'storeengine' ),
		value: 43200,
	},
	{
		label: __( '1 Day', 'storeengine' ),
		value: 86400,
	},
	{
		label: __( '1.5 Days', 'storeengine' ),
		value: 129600,
	},
	{
		label: __( '2 Days', 'storeengine' ),
		value: 172800,
	},
	{
		label: __( '3 Days', 'storeengine' ),
		value: 259200,
	},
	{
		label: __( '4 Days', 'storeengine' ),
		value: 345600,
	},
	{
		label: __( '5 Days', 'storeengine' ),
		value: 432000,
	},
	{
		label: __( '6 Days', 'storeengine' ),
		value: 518400,
	},
	{
		label: __( '1 week', 'storeengine' ),
		value: 604800,
	},
];

export const emailOptions = [
	{
		label: __( 'First Remainder Email', 'storeengine' ),
		value: 'first_email',
		delays: delaysOptions,
		default: 1,
	},
	{
		label: __( 'Second Remainder Email', 'storeengine' ),
		value: 'second_email',
		delays: delaysOptions,
		default: 5,
	},
	{
		label: __( 'Third Remainder Email', 'storeengine' ),
		value: 'third_email',
		delays: delaysOptions,
		default: 10,
	},
];

export const discountTypes = [
	{ value: 'percentage', label: __( 'Percentage', 'storeengine' ) },
	{ value: 'fixed', label: __( 'Fixed', 'storeengine' ) },
];

export const discountNotificationOptions = [
	{
		label: __( 'With First Remainder Email', 'storeengine' ),
		value: 'first_email',
	},
	{
		label: __( 'With Second Remainder Email', 'storeengine' ),
		value: 'second_email',
	},
	{
		label: __( 'With Third Remainder Email', 'storeengine' ),
		value: 'third_email',
	},
];
