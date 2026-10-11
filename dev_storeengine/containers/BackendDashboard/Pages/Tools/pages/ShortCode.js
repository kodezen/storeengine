import React, { useMemo } from 'react';
import ShortCodeItem from '../components/ShortCodeItem';
import { Scope, Card, Heading } from '@Components/ui';
import { __ } from '@wordpress/i18n';

const shortCodeData = [
	{
		title: __( 'Login Form', 'storeengine' ),
		shortCode: '[storeengine_login_form]',
		description: `[storeengine_login_form]`,
		url: false,
	},
	{
		title: __( 'Products', 'storeengine' ),
		shortCode: '[storeengine_products]',
		description: `[storeengine_products ids="6,7,8" exclude_ids="2,4,5" category="18,19" cat_not_in="19,36" tag="3,5,7" tag_not_in="5,7" orderby="title/date/modified" order="ASC/DESC" count="6" column_per_row="2/3/4/6/12" ]`,
		url: false,
	},
	{
		title: __( 'Apply Coupon Form', 'storeengine' ),
		shortCode: '[storeengine_apply_coupon_form]',
		description: `[storeengine_apply_coupon_form]`,
		url: false,
	},
	{
		title: __( 'Product Archive Header Filter', 'storeengine' ),
		shortCode: '[storeengine_archive_header_filter]',
		description: `[storeengine_archive_header_filter]`,
		url: false,
	},
	{
		title: __( 'Cart List Table', 'storeengine' ),
		shortCode: '[storeengine_cart_list_table]',
		description: `[storeengine_cart_list_table]`,
		url: false,
	},
	{
		title: __( 'Cart Sub Total Table', 'storeengine' ),
		shortCode: '[storeengine_cart_sub_total_table]',
		description: `[storeengine_cart_sub_total_table]`,
		url: false,
	},
	{
		title: __( 'Checkout Form', 'storeengine' ),
		shortCode: '[storeengine_checkout_form]',
		description: `[storeengine_checkout_form]`,
		url: false,
	},
	{
		title: __( 'Continue Shopping', 'storeengine' ),
		shortCode: '[storeengine_continue_shopping]',
		description: `[storeengine_continue_shopping]`,
		url: false,
	},
	{
		title: __( 'Frontend Dashboard', 'storeengine' ),
		shortCode: '[storeengine_dashboard]',
		description: `[storeengine_dashboard]`,
		url: false,
	},
	{
		title: __( 'Order Billing Address', 'storeengine' ),
		shortCode: '[storeengine_order_billing_address]',
		description: `[storeengine_order_billing_address]`,
		url: false,
	},
	{
		title: __( 'Order Details', 'storeengine' ),
		shortCode: '[storeengine_order_details]',
		description: `[storeengine_order_details]`,
		url: false,
	},
	{
		title: __( 'Order Downloads', 'storeengine' ),
		shortCode: '[storeengine_order_downloads]',
		description: `[storeengine_order_downloads]`,
		url: false,
	},
	{
		title: __( 'Order Summary', 'storeengine' ),
		shortCode: '[storeengine_order_summary]',
		description: `[storeengine_order_summary]`,
		url: false,
	},
	{
		title: __( 'Proceed To Checkout', 'storeengine' ),
		shortCode: '[storeengine_proceed_to_checkout]',
		description: `[storeengine_proceed_to_checkout]`,
		url: false,
	},
	{
		title: __( 'Thank You Order Info', 'storeengine' ),
		shortCode: '[storeengine_thankyou_order_info]',
		description: `[storeengine_thankyou_order_info]`,
		url: false,
	},
	{
		title: __( 'Thank You Payments Instructions', 'storeengine' ),
		shortCode: '[storeengine_thankyou_payment_instructions]',
		description: `[storeengine_thankyou_payment_instructions]`,
		url: false,
	},
	{
		title: __( 'Inline checkout form', 'storeengine' ),
		shortCode: '[storeengine_instant_checkout product_id="123"]',
		description: `[storeengine_instant_checkout product_id="123"] to embed the full Quick Checkout form (with billing/payment) on any WP page. Replace 123 with your product ID.`,
		url: false,
	},
	{
		title: __( 'Quick Checkout launcher button', 'storeengine' ),
		shortCode:
			'[storeengine_instant_checkout product_id="123" mode="modal"]',
		description: `[storeengine_instant_checkout product_id="123" mode="modal"] to render just a button. Clicking it opens the Quick Checkout modal — useful for landing pages.`,
		url: false,
	},
	{
		title: __( 'Multi-product / optional add-ons', 'storeengine' ),
		shortCode:
			'[storeengine_instant_checkout]\n  [se_checkout_item product_id="27" price_id="5"]\n  [se_checkout_item product_id="28" optional="yes" label="Add gift wrap"]\n  [se_checkout_item product_id="29" optional="yes" default="yes"]\n[/storeengine_instant_checkout]',
		description: `[storeengine_instant_checkout]\n  [se_checkout_item product_id="27" price_id="5"]\n  [se_checkout_item product_id="28" optional="yes" label="Add gift wrap"]\n  [se_checkout_item product_id="29" optional="yes" default="yes"]\n[/storeengine_instant_checkout] to bundle multiple products into one checkout. Use optional="yes" for add-ons the shopper can toggle.`,
		url: false,
	},
];

// Funnel Builder shortcodes — only relevant when the addon is active. These are
// used inside funnel step pages (checkout / upsell / downsell steps).
const funnelShortCodeData = [
	{
		title: __( 'Funnel Checkout', 'storeengine' ),
		shortCode: '[storeengine_funnel_checkout]',
		description: `[storeengine_funnel_checkout] renders the StoreEngine checkout on a funnel Checkout step page and stamps the funnel context so orders are attributed to the funnel.`,
		url: false,
	},
	{
		title: __( 'Funnel Offer', 'storeengine' ),
		shortCode: '[storeengine_funnel_offer]',
		description: `[storeengine_funnel_offer] displays the offer on an Upsell/Downsell step page. With StoreEngine Pro it renders the live one-click offer.`,
		url: false,
	},
	{
		title: __( 'Funnel Accept Button', 'storeengine' ),
		shortCode: '[storeengine_funnel_accept label="Yes, add this to my order"]',
		description: `[storeengine_funnel_accept label="Yes, add this to my order"] accept button for an offer step. Pro charges the saved payment method, then routes to the next step.`,
		url: false,
	},
	{
		title: __( 'Funnel Skip Button', 'storeengine' ),
		shortCode: '[storeengine_funnel_skip label="No thanks"]',
		description: `[storeengine_funnel_skip label="No thanks"] decline button for an offer step — always routes the buyer to the next step.`,
		url: false,
	},
];

const ShortCode = () => {
	const items = useMemo( () => {
		const addons = window.StoreEngineGlobal?.addons || {};
		const list = [ ...shortCodeData ];

		if ( addons.membership ) {
			list.push( {
				title: __( 'Membership Pricing', 'storeengine' ),
				shortCode: '[storeengine_membership_pricing]',
				description: `[storeengine_membership_pricing]`,
				url: '#',
			} );
		}

		if ( addons[ 'funnel-builder' ] ) {
			list.push( ...funnelShortCodeData );
		}

		return list;
	}, [] );

	return (
		<Scope>
			<Heading>{ __( 'Shortcode', 'storeengine' ) }</Heading>
			{ items.map( ( item, index ) => (
				<ShortCodeItem shortCodeItem={ item } key={ index } />
			) ) }
		</Scope>
	);
};

export default ShortCode;
