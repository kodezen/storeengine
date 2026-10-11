import { __ } from '@wordpress/i18n';

export const paperSizes = [
	{ label: __( 'A4', 'storeengine' ), value: 'a4' },
	{ label: __( 'A3', 'storeengine' ), value: 'a3' },
	{ label: __( 'Letter', 'storeengine' ), value: 'letter' },
];

export const dateOptions = [
	{ label: __( '06 July, 2025', 'storeengine' ), value: 'd F,y' },
	{ label: __( '06/07/2025', 'storeengine' ), value: 'd/m/y' },
	{ label: __( 'July 06, 2025', 'storeengine' ), value: 'F d,y' },
	{ label: __( '06–07–2025', 'storeengine' ), value: 'd-m-y' },
	{ label: __( '07/06/2025', 'storeengine' ), value: 'm/d/y' },
	{ label: __( '07–06–2025', 'storeengine' ), value: 'm-d-y' },
];
export const displayInvoiceButtonOptions = [
	{ label: __( 'Always', 'storeengine' ), value: 'always' },
	{ label: __( 'When order is paid', 'storeengine' ), value: 'order_paid' },
	{ label: __( 'Never', 'storeengine' ), value: 'never' },
];

export const viewPdfOptions = [
	{ label: __( 'Preview', 'storeengine' ), value: 'preview' },
	{ label: __( 'Download', 'storeengine' ), value: 'download' },
];
export const dateShowOptions = [
	{
		label: __( 'Date of order creation', 'storeengine' ),
		value: 'order_created',
	},
	{
		label: __( 'Date when order turns into paid', 'storeengine' ),
		value: 'order_paid',
	},
];
export const emailAttachMentsOptions = [
	{
		label: __( 'Order Refund Customer', 'storeengine' ),
		value: 'order_refund',
	},
	{
		label: __( 'Order Confirmation Customer', 'storeengine' ),
		value: 'order_confirmation',
	},
	{
		label: __( 'Order Status Customer', 'storeengine' ),
		value: 'order_status',
	},
];
