# Test plan — Paddle setup-fee + async order email (PR #1083)

The pure-PHP unit tests in `tests/Unit/Paddle/PaddleSetupFeeTest.php` lock down
`build_setup_fee_item()` and the reconciliation arithmetic. The scenarios below
need a real WP install + Paddle **sandbox** (and an SMTP endpoint for the email
cases), so they're run manually / in the wp-env integration suite.

**Runtime fact (verified live against the cart + checkout-service):** the setup
fee is NOT baked into the per-item `line_subtotal`/`subtotal` — those carry the
CLEAN recurring amount. The fee shows up only in the cart's aggregate subtotal
and is billed as its own one-time Paddle line. Subscriptions are always
quantity 1.

**Core invariant for every Paddle case:** the recurring line carries the base
price **unchanged** (no fee subtracted), and the setup fee appears exactly
**once** as its own line with **no `billing_cycle`**, and **never** on a renewal.
First payment = base + fee.

## Setup
- Paddle gateway in **sandbox** mode, valid API key + client token.
- A **subscription** product with a **setup/signup fee** (e.g. base 100.00, fee 10.00).
- Action Scheduler running (default WP-Cron is fine).

## Cases

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| **P1** | First charge (regression) | Buy the sub via Paddle | Paddle payload: recurring line `unit_price = 100.00` (**not** 90.00), `billing_cycle` present; one setup-fee line `10.00 × 1`, no billing_cycle. **First charge = 110.00.** (The 90.00 under-charge is the bug this fixes.) |
| **P2** | **Renewal** | Let the Paddle subscription renew | Renewal amount = **100.00**. No setup-fee line. (`_subscription_renewal` meta zeroes `$setup_fee`.) |
| **P3** | Setup fee **+ % coupon** | Apply e.g. 10% coupon | Coupon applied once via Paddle `discount_id`; recurring line = clean base; setup fee once. Final total matches cart. |
| **P4** | **Installment** deposit + setup fee | Buy on an installment plan | Recurring/main line uses the deposit amount (line total), not full catalog price; setup-fee line still present; recurring not reduced by the fee. |
| **P5** | **No setup fee** | Buy a plain subscription | No setup-fee line; recurring line = base. |
| **P6** | Zero-decimal currency | Order currency JPY with a setup fee | Setup-fee line `amount` is the raw integer (not ×100) and `currency_code = JPY`. (Guards the currency-passthrough fix in `build_setup_fee_item`.) |
| **P7** | `prepare_items_from_order` path | Pay-for-existing-order / installment retry (cart empty) | Same amounts as the cart path — order-item `subtotal` is the clean base, recurring sent as-is, fee as its own line. |

## Async order-confirmation email

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| **E1** | Deferred send | Complete any checkout (Razorpay is the motivating gateway) | Checkout response returns immediately; admin + customer emails arrive shortly after via the `storeengine/email/send_order_confirmation` Action Scheduler job. |
| **E2** | Exactly-once | Inspect the queue / retry `after_place_order` | Exactly one admin + one customer email. The `new_order_email_sent` flag guards against a duplicate async job double-sending. |
| **E3** | **Action Scheduler unavailable** (fail-safe) | Simulate `as_enqueue_async_action` missing (e.g. AS not loaded) | Email is sent **inline** as a fallback — never silently dropped. |
| **E4** | Broken WP-Cron | Disable WP-Cron | Checkout still succeeds; email is delayed but delivered when the queue next runs. |

## Native Stripe subscriptions (setup fee was previously dropped)

Native billing mode bills the **clean recurring price** (the fee is stripped from
the recurring cart), so the setup fee is billed as a one-time `add_invoice_items`
line on the subscription's first invoice. Requires **Stripe native subscriptions
enabled** + a Stripe test key.

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| **S1** | Fee is charged, qty 1 | Buy a sub with a setup fee in native mode | First Stripe invoice = base + fee. Recurring price on the subscription = base only. (Pre-fix: fee was **not** charged.) |
| **S2** | Recurring stays clean | Let it renew | Renewal invoice = base only, no setup fee. |
| **S3** | **Qty 2** | Buy qty 2 | First invoice = `(base + fee) × 2`; setup-fee invoice line quantity = 2. |
| **S4** | Mixed cart | Sub w/ fee + a one-time product | First invoice carries the one-time product line AND the setup-fee line; recurring = base only. |
| **S5** | No fee | Plain native sub | No setup-fee invoice line (identical to prior behaviour). |
| **S6** | **Trial + fee** (nuance) | Sub with a free trial + setup fee | With `trial_period_days`, Stripe adds the pending invoice item to the invoice raised at **trial end**, so the fee is collected then, not at signup. Confirm this matches product intent (still strictly better than the pre-fix "never charged"). |

## Core: order total must include the subscription setup fee

Root cause of the "Paddle charged 500 but order shows 400" report: subscription
setup fees were never materialized as an order item, so `Order::calculate_totals()`
(line items + fee items) dropped the fee. `CheckoutService::add_subscription_setup_fees()`
now adds it as a one-time `OrderItemFee`. Verified live: base 400 + fee 100 →
order total **500** (1 line item + 1 fee item; `get_items()` stays line-item-only
so gateways don't double-count).

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| **C1** | Order total | Buy a sub (base 400, fee 100), any gateway | Order records **total 500** with a separate "Setup Fee" fee line of 100 + product line 400. |
| **C2** | Razorpay/PayPal charge | Complete via Razorpay or PayPal | Customer charged **500** (was 400 — these charge `get_total()`). |
| **C3** | Paddle reconciliation | Complete via Paddle | Paddle charges 500 (base 400 + fee line 100) AND the order records 500 — no mismatch, no double charge. |
| **C4** | Stripe native reconciliation | Complete via native Stripe | First invoice 500 (recurring 400 + invoice fee 100), order records 500. |
| **C5** | Renewal | Let any of them renew | Renewal = **400**; no setup-fee item on the renewal order (guarded by `_subscription_renewal`). |
| **C6** | No fee | Plain subscription | No setup-fee item; order total = base. |

## Highest-risk (run first, real money on renewals)
- Paddle: **P2** (renewal must not re-charge the fee) and **P3** (qty > 1 must reconcile).
- Stripe: **S1** (fee is now actually collected) and **S2** (renewal stays clean).
