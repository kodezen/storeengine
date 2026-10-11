import { current_user_id, webhooks, webhooks_groups } from '@Utils/helper';
import { __ } from '@wordpress/i18n';

export const webhookStatus = [
	{
		label: __( 'Active', 'storeengine' ),
		value: 'publish',
	},
	{
		label: __( 'Paused', 'storeengine' ),
		value: 'draft',
	},
	{
		label: __( 'Disabled', 'storeengine' ),
		value: 'pending',
	},
];

/**
 * react-select options for the event picker. Prefers the grouped shape
 * (`[{ label, options: [{label, value}] }]`) exposed by PHP since v1.10;
 * falls back to the legacy flat array on older StoreEngine builds.
 *
 * The grouped shape renders collapsible sections in react-select (e.g.
 * "Products", "Orders", "Pages", "Block Theme / Site Editor", "Vendor")
 * so the ~30-event list stays scannable.
 */
export const webhookEvents =
	Array.isArray( webhooks_groups ) && webhooks_groups.length > 0
		? webhooks_groups
		: webhooks || [];

/**
 * Flat list of every option across all groups — used to resolve the
 * current selection back into the option objects react-select wants for
 * the `value` prop.
 */
export const webhookEventsFlat = webhookEvents.flatMap( ( item ) =>
	Array.isArray( item?.options ) ? item.options : [ item ]
);

/**
 * Colour bucket for an event badge, keyed on the STABLE English value prefix
 * (e.g. `order_created`) rather than the translated label, so the colour stays
 * consistent across locales. Each slug maps to a `--{slug}` CSS modifier in the
 * Webhooks stylesheet. Unknown/filter-injected events fall back to `default`.
 */
const EVENT_COLOR_BUCKETS = [
	{ slug: 'products', test: ( v ) => v.startsWith( 'product_' ) },
	{ slug: 'orders', test: ( v ) => v.startsWith( 'order_' ) },
	{ slug: 'coupons', test: ( v ) => v.startsWith( 'coupon_' ) },
	{ slug: 'customers', test: ( v ) => v.startsWith( 'customer_' ) },
	{ slug: 'pages', test: ( v ) => v.startsWith( 'page_' ) },
	{ slug: 'posts', test: ( v ) => v.startsWith( 'post_' ) },
	{
		slug: 'site-editor',
		test: ( v ) =>
			/^(template_|template_part_|global_styles_)/.test( v ),
	},
	{ slug: 'navigation', test: ( v ) => v.startsWith( 'nav_' ) },
];

export const getEventColorSlug = ( value = '' ) =>
	EVENT_COLOR_BUCKETS.find( ( b ) => b.test( value ) )?.slug || 'default';

/**
 * Human-readable event name derived from the value, so it reads the same whether
 * the grouped shape (short "Created" labels) or the legacy flat shape is active:
 * `order_created` → "Order Created", `nav_menu_updated` → "Nav Menu Updated".
 */
export const formatEventLabel = ( value = '' ) =>
	value
		.split( '_' )
		.filter( Boolean )
		.map( ( w ) => w.charAt( 0 ).toUpperCase() + w.slice( 1 ) )
		.join( ' ' );

export const getWebhookInitialValues = ( data = null ) => {
	if ( data ) {
		const {
			status,
			author,
			title,
			meta: {
				_storeengine_webhook_delivery_url,
				_storeengine_webhook_secret,
				_storeengine_webhook_events,
			},
		} = data;

		return {
			title: title?.raw,
			author,
			status,
			meta: {
				_storeengine_webhook_delivery_url:
					_storeengine_webhook_delivery_url || '',
				_storeengine_webhook_secret: _storeengine_webhook_secret || '',
				_storeengine_webhook_events: _storeengine_webhook_events || [],
			},
		};
	}

	return {
		title: '',
		author: current_user_id,
		status: 'pending',
		meta: {
			_storeengine_webhook_delivery_url: '',
			_storeengine_webhook_secret: '',
			_storeengine_webhook_events: [],
		},
	};
};
