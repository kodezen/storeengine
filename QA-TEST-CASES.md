# QA Test Cases — `embeded-checkout` → `release/2.9.0`

Scope: changes related to the **Buy Now button consolidation**, **Instant Checkout modal launcher**, **subscription debug actions**, and **installment-plan run-next** introduced in this branch. QA to manually verify each scenario and mark Pass / Fail.

> **Note:** Test cases for the wider PR (gateway refactors, embeddable-checkout addon, embed-key auth, instant-checkout React app internals) are NOT covered here — they need a separate QA pass.

---

## 0. Test Environment Setup

**Required:**
- Fresh WP install with StoreEngine + StoreEngine Pro on `embeded-checkout` branch (post-build).
- Test products configured:
  - **Simple product (single price)** — e.g. "T-Shirt", $25 one-time.
  - **Multi-price product** — e.g. "Plan", with prices: One-time $50, Monthly subscription $10/mo, 3-installment $30/3.
  - **Trial subscription** — e.g. 7-day trial, then $10/mo.
  - **Installment-plan order** — already paid first installment, with ≥ 2 future installments scheduled.
- Stripe gateway in **test mode** with publishable + secret keys.
- COD (Cash on Delivery) gateway enabled.
- Admin user + a customer user.
- Test card: `4242 4242 4242 4242` / any future expiry / any CVC.

**Tooling:**
- Browser devtools open with **Console** + **Network** tabs visible during all front-end tests.
- For payment-trigger tests: `Tools → Scheduled Actions` admin page open in a second tab.

**Build verification before starting:**
- [ ] Hard-refresh storefront page (Cmd-Shift-R / Ctrl-F5) after deploy to bypass JS bundle cache.
- [ ] Confirm `assets/build/frontend.1.8.1.js` modification date matches the deploy.

---

## 1. Buy Now button — legacy mode (Instant Checkout addon DISABLED)

**Precondition:** `Settings → Products → Enable Direct Checkout` is **ON**. Instant Checkout addon is **OFF**.

| # | Test | Steps | Expected | P/F |
|---|---|---|---|---|
| 1.1 | Buy Now appears on single product | Visit Simple product page | "Buy Now" button is rendered alongside "Add to Cart" | ☐ |
| 1.2 | Buy Now appears on shop archive | Visit shop / category / tag archive | Each product card shows "Buy Now" button | ☐ |
| 1.3 | Buy Now redirects to checkout | Click Buy Now on Simple product | Cart is cleared, item added, browser navigates to `/checkout/` page with the product in cart | ☐ |
| 1.4 | Buy Now button has NO modal flag | Inspect button HTML in devtools | Button has `data-action="buy_now"` but **no** `data-instant-checkout` attribute | ☐ |
| 1.5 | Loop Buy Now redirects | Click Buy Now from shop loop | Same as 1.3 | ☐ |
| 1.6 | Subscription product shows Buy Now | Visit Multi-price product, pick the "Monthly subscription" price | The Add-to-Cart button label changes to "Buy Now"; clicking redirects to checkout | ☐ |
| 1.7 | Catalog mode page shows Buy Now | Visit a catalog-mode-enabled product page | Same legacy redirect behavior | ☐ |
| 1.8 | Disable Direct Checkout setting | Turn `Enable Direct Checkout` OFF, revisit shop | "Buy Now" disappears; only "Add to Cart" is shown | ☐ |

---

## 2. Buy Now button — modal mode (Instant Checkout addon ENABLED)

**Precondition:** Instant Checkout addon **enabled** AND `Enable Direct Checkout` setting **ON**.

| # | Test | Steps | Expected | P/F |
|---|---|---|---|---|
| 2.1 | Modal flag added to button | Inspect Buy Now button HTML | Button has `data-instant-checkout="modal"`, `data-product-id="..."`, `data-price-id="..."` | ☐ |
| 2.2 | Launcher script enqueued | View page source on shop / single product page | `<script src=".../instant-checkout-app.1.8.1.js">` is in the DOM | ☐ |
| 2.3 | Inline launcher config emitted | View page source | A `<script>` tag containing `window.StoreEngineInstantCheckout=...` with `storeUrl` + `nonce` is printed before frontend.js | ☐ |
| 2.4 | Buy Now opens modal (single product) | Click Buy Now on Simple product | Quick Checkout modal/iframe opens; URL stays on the storefront (no full-page redirect) | ☐ |
| 2.5 | Buy Now opens modal (shop archive) | Click Buy Now from a shop loop card | Modal opens with that product loaded | ☐ |
| 2.6 | No console errors during open | Watch devtools Console while clicking Buy Now | No `[StoreEngine.Checkout]` errors logged | ☐ |
| 2.7 | Modal closes restores button label | Open modal, then close it (×, ESC, or backdrop click) | Button label returns to "Buy Now" (no spinner stuck) | ☐ |
| 2.8 | Modal completes purchase | Open modal, fill billing + Stripe test card, submit | Order created; modal shows success state; button restores after close | ☐ |
| 2.9 | Toggle addon off then back on | Disable addon → click Buy Now (verify legacy redirect) → re-enable addon → reload → click Buy Now | First click redirects to checkout; second click opens modal — no caching issues | ☐ |
| 2.10 | Instant Checkout disabled, setting on | Disable addon, keep `Enable Direct Checkout` on | Buy Now button has NO `data-instant-checkout`; clicking does the legacy redirect | ☐ |

---

## 3. Multi-price selection sync (modal mode)

**Precondition:** Instant Checkout enabled. Use the Multi-price product (one-time / subscription / installment).

| # | Test | Steps | Expected | P/F |
|---|---|---|---|---|
| 3.1 | First price loads by default | Visit product page; do **not** click any price option; click Buy Now | Modal opens with the first price (the one with the lowest price_id baked into `data-price-id`) | ☐ |
| 3.2 | Selected price flows to modal | Pick a non-first price (e.g. Monthly $10/mo); click Buy Now | Modal opens with the **selected** price visible in the order summary | ☐ |
| 3.3 | Quantity input flows to modal | Change quantity to 3; click Buy Now | Modal opens with quantity = 3 in the line item | ☐ |
| 3.4 | Switching prices updates modal each time | Open modal with Price A → close → switch to Price B → open again | Second open shows Price B (no stale cached state) | ☐ |
| 3.5 | Subscription price → modal opens with correct price | Pick the subscription price option; click Buy Now | Modal opens with the subscription price; recurring info visible in summary | ☐ |
| 3.6 | Installment price → modal opens with correct price | Pick the installment price option; click Buy Now | Modal opens with the installment price; installment schedule visible | ☐ |

---

## 4. priceTypeHandler — subscription/installment auto-toggle (legacy mode)

**Precondition:** `Enable Direct Checkout` is **OFF**. Instant Checkout disabled. Multi-price product has only an "Add to Cart" button initially.

| # | Test | Steps | Expected | P/F |
|---|---|---|---|---|
| 4.1 | Selecting subscription converts button | Visit product, pick "Monthly subscription" price | Add-to-Cart button label changes to "Buy Now"; quantity input hides | ☐ |
| 4.2 | Converted button actually buys (regression) | Click the converted "Buy Now" | Order is created and page redirects to checkout (NOT the regular add-to-cart silent flow). Verify in devtools Network: a request hits `/cart/items/direct-checkout`, NOT `/cart/items` | ☐ |
| 4.3 | Selecting one-time reverts button | Pick the one-time price option | Button reverts to "Add to Cart"; quantity input is visible again | ☐ |
| 4.4 | Add to Cart still works after revert | Click the reverted "Add to Cart" | Item adds to cart, no redirect, mini-cart updates | ☐ |
| 4.5 | Installment price converts button | Pick the installment price | Same as 4.1 — converts to "Buy Now" with `data-action="buy_now"` in DOM | ☐ |

---

## 5. Subscription debug actions (admin)

**Precondition:**
- `define( 'WP_DEBUG', true );` in `wp-config.php`.
- A subscription with status `active`, with both `trial_end_date` and `next_payment_date` set in the future.
- Stripe-paid subscription (or COD if testing manual flow).

| # | Test | Steps | Expected | P/F |
|---|---|---|---|---|
| 5.1 | Debug buttons hidden when WP_DEBUG off | Set `WP_DEBUG = false`; reload subscription edit page | "Process Renewal Now" and "End Trial Now" buttons are NOT visible | ☐ |
| 5.2 | Debug buttons visible when WP_DEBUG on | Set `WP_DEBUG = true`; reload | Both buttons are visible in the TopBar of the subscription edit screen | ☐ |
| 5.3 | End Trial Now fires hook | Click "End Trial Now" on a trial subscription | Toast: "Trial end fired. Refreshing subscription…"; page refreshes; `trial_end_date` is cleared/past; subscription status remains `active`; in `wp-content/debug.log` confirm `storeengine/subscription/schedule_trial_end` fired | ☐ |
| 5.4 | Process Renewal Now creates renewal order | Click "Process Renewal Now" | Toast: "Renewal triggered. Refreshing subscription…"; a new renewal order appears in subscription's related orders list; `next_payment_date` advances by one billing cycle | ☐ |
| 5.5 | Renewal charges Stripe (test mode) | With Stripe-paid subscription, click Process Renewal Now | Stripe Dashboard → Test mode → Payments shows a new PaymentIntent for the renewal amount | ☐ |
| 5.6 | Renewal generates manual order on COD | With COD subscription, click Process Renewal Now | New renewal order created in `pending_payment` status; subscription marked `requires_manual_renewal=true`; `storeengine/subscription/generated_manual_renewal_order` fires | ☐ |
| 5.7 | Buttons disabled while processing | Click Process Renewal Now and watch | Button shows loading spinner; second click during loading is rejected | ☐ |
| 5.8 | 403 when WP_DEBUG off and admin posts directly | With `WP_DEBUG = false`, manually POST to `admin-ajax.php` with `action=storeengine/debug_process_renewal` | Returns JSON error with "Debug actions are disabled." | ☐ |
| 5.9 | Non-admin cannot trigger | Log in as a non-admin (Subscriber); attempt to call the AJAX endpoint | Returns 403 / capability error | ☐ |

---

## 6. Installment Plan — Run Next Installment Now (admin)

**Precondition:**
- `WP_DEBUG = true`.
- An installment plan with status `active`, with at least 2 unpaid future installments.

| # | Test | Steps | Expected | P/F |
|---|---|---|---|---|
| 6.1 | Button hidden when WP_DEBUG off | Set `WP_DEBUG = false`; load installment-plan edit page | "Run Next Installment Now" button is hidden | ☐ |
| 6.2 | Button visible when WP_DEBUG on | Set `WP_DEBUG = true`; reload | Button is visible in TopBar of installment-plan edit screen | ☐ |
| 6.3 | Triggers next installment | Click button | Toast: "Next installment triggered. Refreshing plan…"; the next-due installment order moves from pending to processing/completed; remaining installments count decreases by 1 | ☐ |
| 6.4 | Stripe-paid plan auto-charges | Stripe test-mode plan, click button | Stripe Dashboard shows new PaymentIntent for the installment amount | ☐ |
| 6.5 | COD plan generates manual order | COD plan, click button | New order in `pending_payment`; plan flagged `requires_manual_renewal=true` | ☐ |
| 6.6 | Last installment completes plan | On a 3-installment plan with 1 remaining, click button | Plan status moves to `completed` after the final installment | ☐ |
| 6.7 | Bypasses time gate | Plan with next payment scheduled days/weeks in the future | Button still triggers payment immediately (bypasses the `_payment_date` time check) | ☐ |
| 6.8 | REST endpoint refuses with WP_DEBUG off | `curl -X POST .../wp-json/storeengine/v1/installment-plan/{id}/run-next` with admin nonce + `WP_DEBUG=false` | 403 with "Debug actions are disabled." | ☐ |
| 6.9 | REST endpoint refuses non-admin | Same call with non-admin user | 403 / capability error | ☐ |
| 6.10 | No upcoming payment edge case | Plan with all installments paid, click button | Returns 400 / "No upcoming installment to process." — no orders created | ☐ |

---

## 7. Performance / non-regression checks

| # | Test | Steps | Expected | P/F |
|---|---|---|---|---|
| 7.1 | Launcher dormant when addon off | Disable Instant Checkout addon, reload shop page | View page source: NO `<script>` tag for `instant-checkout-app.*.js`; NO inline `window.StoreEngineInstantCheckout` config | ☐ |
| 7.2 | Launcher dormant when setting off | Addon enabled but `Enable Direct Checkout` off, reload shop | Same as 7.1 — bundle and config not on the page | ☐ |
| 7.3 | Buy Now button rendered from one place | View source on single, loop, catalog-mode-single, catalog-mode-loop pages — Buy Now markup matches | All four sites render identical button markup (same classes, same data attrs) — sourced from `templates/global/buy-now-button.php` | ☐ |
| 7.4 | No double-click race | Open devtools Network, click Buy Now once with Instant Checkout enabled | Exactly ONE network request fires (to `/wp-json/storeengine/v1/instant-checkout/session`); no parallel `/cart/items/direct-checkout` call | ☐ |
| 7.5 | Add to Cart still works on Buy Now-enabled product | Click "Add to Cart" (the secondary button, not Buy Now) on single product | Item adds to cart, no redirect, no modal | ☐ |
| 7.6 | Theme override compatibility | Override `single-product/add-to-cart.php` in active theme to a copy from before this PR | Storefront still works; Buy Now button reverts to legacy markup but legacy redirect path still functions | ☐ |
| 7.7 | Mobile viewport | Test all of section 2 on a mobile-width viewport (≤ 768px) | Modal opens fullscreen; Buy Now button styling is intact | ☐ |
| 7.8 | RTL locale | Switch site to an RTL language (e.g. Arabic) | Buy Now button right-aligned correctly; modal opens with RTL layout | ☐ |

---

## 8. Cross-browser smoke

Run **section 2.4, 3.2, 5.4, 6.3** in each:

| Browser | Version | Pass / Fail |
|---|---|---|
| Chrome (latest) | | ☐ |
| Firefox (latest) | | ☐ |
| Safari (latest) | | ☐ |
| Edge (latest) | | ☐ |

---

## 9. Sign-off

- [ ] All P0 tests in sections 1–6 pass.
- [ ] All P1 tests (sections 7–8) pass OR have logged tickets for non-blockers.
- [ ] No `[StoreEngine.Checkout]` errors in browser Console during normal storefront browsing.
- [ ] No PHP fatal / warnings in `wp-content/debug.log` after running through all scenarios.

**Tested by:** _______________
**Date:** _______________
**Build / commit:** _______________
**Result:** ☐ Approved for merge / ☐ Blocked — see issues above
