# StoreEngine Google Analytics 4 (GA4) Integration

This document describes how StoreEngine ships ecommerce events to Google
Analytics 4 / Google Tag Manager, how to enable it, what fires, and how to
extend or debug it.

---

## 1. What this integration does

StoreEngine pushes standard **GA4 enhanced ecommerce events** to whatever
analytics container is loaded on your site:

- `view_item_list` — shop / search / category page render
- `search` — internal product search query submitted
- `view_item` — product page render
- `view_cart` — cart page render
- `add_to_cart` — item added to cart (also fires on cart-page quantity bumps)
- `remove_from_cart` — item removed from cart
- `begin_checkout` — checkout page mount
- `add_shipping_info` — shipping method chosen
- `add_payment_info` — payment method submitted
- `purchase` — order placed successfully (the money event)
- `subscription_start` — *custom* event, fires alongside `purchase` when the
  order contains any subscription line items

Each event payload follows the GA4 spec: `currency`, `value`, `items[]`, plus
event-specific fields (`transaction_id`, `tax`, `shipping`, `coupon`, etc.).

> **What it does NOT do:** load `gtag.js` or `googletagmanager.com/gtm.js`.
> You bring your own tag (see §3). StoreEngine only emits the events; the tag
> ships them to Google.

---

## 2. Enabling the integration

1. WordPress admin → **StoreEngine → Settings → Analytics**.
2. Tick **"Google Analytics / Google Tag Integration"**.
3. Save.

Internally this writes `analytics.google = true` to the `storeengine_settings`
option. At runtime, `dev_storeengine/pixel-integrations/index.ts` reads
`settings.analytics.google` and only attaches event listeners if it's `true`.

---

## 3. Installing a tag (required)

The integration assumes a GA4 tag or GTM container is already live on the page.
Pick **one** of these:

### Option A — Google Site Kit (easiest)

Install the [Google Site Kit](https://wordpress.org/plugins/google-site-kit/)
plugin and connect a GA4 property. Site Kit injects `gtag.js` into `<head>`
sitewide. StoreEngine events will go to the connected property automatically.

### Option B — Google Tag Manager

Install your GTM container snippet in your theme's `<head>` (or via a plugin
such as **GTM4WP**). Inside GTM, configure a **GA4 Configuration** tag and
**GA4 Event** triggers for each event name listed in §1.

When GTM is detected (`window.dataLayer` exists but `window.gtag` does not),
StoreEngine pushes events as standard `dataLayer.push({ event, ecommerce, ... })`
payloads that GA4 Event tags can read directly.

### Option C — Manual gtag.js

Paste your GA4 install snippet into your theme's `<head>`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

### How StoreEngine detects which one is loaded

`triggerTag()` in [utils/pixel/google.ts](../utils/pixel/google.ts) checks at
event time:

| Detected | Behavior |
| --- | --- |
| `window.gtag` is a function | `gtag('event', name, payload)` |
| Only `window.dataLayer` exists | `dataLayer.push({ event: name, ecommerce: payload })` |
| Neither exists | Event is dropped silently; one warning logged to `console.warn` per page load |

If you tick the setting but no tag is installed, you'll see this in the browser
console exactly once:

> `[StoreEngine] Google Analytics integration is enabled in settings, but neither window.gtag nor window.dataLayer was found...`

---

## 4. Event reference

All events resolve a Promise once GA acknowledges them (`event_callback`) or
after a **2500 ms** fallback timeout — whichever comes first. This lets the
checkout flow proceed to redirect even if GA never responds.

### `purchase` (most important)

Fires on the `storeengine.checkout.purchase_completed` hook, before the
~850 ms thank-you-page redirect.

**Payload:**

```js
{
  transaction_id: 'wc_order_abc123',   // order.transaction_id or order.order_key
  value:        129.00,                // order.total
  tax:           10.32,                // order.total_tax
  shipping:       8.00,                // order.shipping_total_amount
  discount:      20.00,                // order.discount_total_amount (omitted if 0)
  coupon:       'SUMMER20',            // comma-separated codes (omitted if no coupons)
  currency:     'USD',
  items: [
    {
      item_id:      '42-7',            // product_id-price_id
      item_name:    'Pro License',
      currency:     'USD',
      discount:      5.00,             // per-unit, computed from (subtotal - total) / qty
      price:        45.00,
      quantity:      2,
      item_variant: 'Yearly / Team',   // present when variation_id is set
    }
  ]
}
```

**`value` vs `tax` vs `shipping`:** GA4 reports `value` as your gross revenue
metric. Tax and shipping are sent as separate fields so reports can subtract
them to compute net product revenue.

### `subscription_start` (custom)

Fires alongside `purchase` when `order.line_items` contains any item with
`price_type === 'subscription'`.

**Why a custom event?** GA4 has no built-in subscription/MRR event. This lets
you build a separate funnel in GA4 Explorations or BigQuery for recurring
revenue without polluting `purchase` metrics.

**Payload:** same shape as `purchase`, but `items[]` contains only the
subscription line items, and `value` is the sum of `price * quantity` for
those items only.

### `begin_checkout`

Fires when the checkout page mounts (`storeengine.checkout.checkout_initialized`).
Skipped if cart is empty.

### `add_shipping_info`

Fires on `storeengine.checkout.checkout_updated` **only when** the form
includes a `shipping_method` value. Includes `shipping_tier` (the method ID).

### `add_payment_info`

Fires on `storeengine.checkout.payment_info_added`. Includes `payment_type`
(the gateway slug) when the gateway provides it.

### `add_to_cart` / `remove_from_cart`

`value` is `price × quantity` for the affected line — not unit price — so
reporting reflects the size of the basket change.

`add_to_cart` fires on **both** initial adds and cart-page quantity changes.
GA4 considers this correct: any positive change to a cart line is an
add-to-cart event.

### `view_item` / `view_item_list` / `view_cart` / `search`

Standard GA4 ecommerce shapes. `view_cart` includes per-item `discount` and a
top-level `discount` field when a coupon is active.

---

## 5. Architecture

```
storefront page
      │
      ▼
WordPress JS action: doActionAsync('storeengine.checkout.purchase_completed', response)
      │
      ▼
addAction listener in pixel-integrations/google.ts
      │      builds GA4 payload from order data
      ▼
triggerTag('purchase', payload)  ──►  utils/pixel/google.ts
      │
      ├──► window.gtag(...)              if gtag.js present
      ├──► window.dataLayer.push(...)    if only GTM present
      └──► console.warn (once) + drop    if neither present
```

**Key files:**

| File | Purpose |
| --- | --- |
| [pixel-integrations/index.ts](index.ts) | Entry point; reads `analytics.google` setting, wires up listeners, fires page-view hooks. |
| [pixel-integrations/google.ts](google.ts) | All GA4 event payload builders. |
| [utils/pixel/google.ts](../utils/pixel/google.ts) | `triggerTag()` — dual gtag/dataLayer dispatcher with timeout. |
| [containers/.../Analytics/index.js](../containers/BackendDashboard/Pages/Settings/Tabs/Analytics/index.js) | Settings UI toggle. |

---

## 6. Extending — adding your own event

Inside `gtag_integration()`, add another `addAction` listener:

```ts
addAction(
    'storeengine.your.custom_hook',
    'se.gtag.your_event',
    function ( payload ) {
        return triggerTag( 'your_custom_event' as Gtag.EventNames, {
            currency: store_currency,
            value:    payload.amount,
            // ...any GA4-shaped fields
        } );
    }
);
```

Fire the hook anywhere in your frontend code via:

```ts
import { doActionAsync } from '@wordpress/hooks';
doActionAsync( 'storeengine.your.custom_hook', { amount: 42 } );
```

---

## 7. Debugging checklist

When events aren't appearing in GA4 DebugView or Realtime:

1. **Open browser console.** Look for the `[StoreEngine]` missing-tag warning.
   If you see it, your gtag/GTM isn't loaded — fix the install first.
2. **Run `typeof window.gtag` in console.** Should print `"function"`.
   Run `window.dataLayer` — should print an Array.
3. **Install the [GA Debugger Chrome extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)**
   and enable it. Reload the page. Every `gtag('event', ...)` call will log
   to console with the full payload.
4. **GTM users:** open GTM's Preview mode. Each StoreEngine event should
   appear as a `dataLayer` push with `event: "<event_name>"`. If pushes
   appear but no GA4 tag fires, check your GTM trigger configuration.
5. **GA4 DebugView:** install the GA Debug extension *and* enable debug mode
   in your GA4 property. Purchases should appear within ~30 seconds.
6. **Thank-you page refresh = duplicate purchase?** No. The `purchase` event
   fires from `purchase_completed`, which is dispatched *before* redirect to
   the thank-you page. Refreshing the thank-you page does **not** re-fire it.
7. **Build after editing.** Source files live under `dev_storeengine/`; you
   must run `npm run build` (or `npm run start` for watch mode) to compile
   into `dist/`.

---

## 8. Caveats

- **No consent gating.** The integration does not check for cookie consent.
  If you need GDPR/ePrivacy compliance, gate the GA tag itself (via Site Kit,
  GTM consent mode, or a consent plugin) — not the StoreEngine setting.
- **No PII is sent.** Payloads contain order IDs, prices, product IDs, and
  variation attribute values. Customer email/name/address are *not* included.
- **Variation values** for `item_variant` come from order item meta keys
  starting with `se_pa_` — the StoreEngine product-attribute prefix.
- **Failed orders never fire `purchase`.** The hook only runs when the
  gateway response indicates success and we proceed to redirect.
