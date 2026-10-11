import { __ } from '@wordpress/i18n';

export const contentType = [
	{
		label: __( 'Entire Website', 'storeengine' ),
		value: 'basic-global',
	},
	{
		label: __( 'All Posts', 'storeengine' ),
		value: 'post|all',
	},
	{
		label: __( 'All Categories Archive', 'storeengine' ),
		value: 'post|all|taxarchive|category',
	},
	{
		label: __( 'All Tags Archive', 'storeengine' ),
		value: 'post|all|taxarchive|post_tag',
	},
	{
		label: __( 'All Pages', 'storeengine' ),
		value: 'page|all',
	},
	{
		label: __( 'Specific Posts/ Pages/ Taxonomies', 'storeengine' ),
		value: 'specifics',
	},
];

export const expirationDateType = [
	{
		label: __( 'Relative Date', 'storeengine' ),
		value: 'relative_date',
	},
	{
		label: __( 'Specific Date', 'storeengine' ),
		value: 'specific_date',
	},
];

export const subscriptionDateType = [
	{
		label: __( 'Days', 'storeengine' ),
		value: 'day',
	},
	{
		label: __( 'Weeks', 'storeengine' ),
		value: 'week',
	},
	{
		label: __( 'Months', 'storeengine' ),
		value: 'month',
	},
	{
		label: __( 'Years', 'storeengine' ),
		value: 'year',
	},
];

export const featureIcons = [
	{
		value: 'check',
		label: 'storeengine-icon storeengine-icon--check',
		title: __( 'Check', 'storeengine' ),
	},
	{
		value: 'filled-checkmark',
		label: 'storeengine-icon storeengine-icon--filled-checkmark',
		title: __( 'Filled checkmark', 'storeengine' ),
	},
	{
		value: 'stoke-checkmark',
		label: 'storeengine-icon storeengine-icon--stoke-checkmark',
		title: __( 'Outline checkmark', 'storeengine' ),
	},
	{
		value: 'add',
		label: 'storeengine-icon storeengine-icon--add',
		title: __( 'Add', 'storeengine' ),
	},
	{
		value: 'close',
		label: 'storeengine-icon storeengine-icon--close',
		title: __( 'Close', 'storeengine' ),
	},
	{
		value: 'stoke-close',
		label: 'storeengine-icon storeengine-icon--stoke-close',
		title: __( 'Outline close', 'storeengine' ),
	},
	{
		value: 'minus',
		label: 'storeengine-icon storeengine-icon--minus',
		title: __( 'Minus', 'storeengine' ),
	},
];
