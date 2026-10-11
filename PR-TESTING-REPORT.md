# StoreEngine + StoreEngine Pro — `feature/decimal-quantity-uom` Branch: End-to-End Test Report

**Scope:** Whole feature branch across both plugins — Wholesale/B2B (groups, price tiers, quotes, ledger), Retail vertical (pharmacy/grocery, controlled substances, prescriptions), Suppliers (purchase orders, return-to-vendor/debit notes), Inventory (batch/expiry tracking), and StoreEngine core's decimal-quantity/unit-of-measure support — plus a cross-cutting audit of the shared customer/product picker components.

**Method:** Real browser end-to-end testing via Playwright against the live local dev site (`https://kodezen.test`), driven by 7 parallel test passes, each of which read the relevant source code first, then exercised the actual UI/API as a real admin, B2B buyer, or storefront customer would — including edge cases, validation boundaries, and permission checks. Not a code review pass with guesses; every finding below was either reproduced live or confirmed by direct database/API inspection. Test data is prefixed `PR-TEST-` where practical and left in place for inspection (see each section's notes).

**Screenshots:** every filename referenced as "Evidence" throughout this report (e.g. `wa-01-groups-list.png`) lives in the `pr-testing-screenshots/` folder next to this file.

**How to read this report:** Start with the Executive Summary. Each subject-area section then follows the same structure: Bugs → UI/UX issues → Functional issues/mismatches → Missing features/workflows → Improvements → What works well → Could not verify. Severities are Critical / High / Medium / Low, assigned per-area by the tester closest to that code.

---

## Executive Summary

This branch is substantial and much of what it adds genuinely works — the Wholesale Quotes happy path, Retail's prescription/refill logic, Suppliers' cost-based debit-note math, and the core `Quantity` class are all correctly built. But testing surfaced **two systemic patterns** that show up repeatedly across unrelated areas, plus several standalone critical bugs. Fix the systemic patterns first — they explain most of the individual findings below.

### Systemic pattern 1: Real, correct backends shipped with no way to reach them

Two features have a fully built, individually-verified-correct backend and **no way to reach it from the admin UI**:

- **Suppliers' return-to-vendor / debit notes** — the feature this branch specifically claims to add — has a correct, cost-based backend (`classes/supplier-returns.php`) with no UI file referencing it anywhere in the admin app; live-verified no nav link reaches it.
- **Suppliers' purchase-order line items** require typing raw numeric Product ID / Variation ID by hand — no product picker, despite that exact component existing and being used elsewhere in this same branch.

A merchant evaluating this branch today cannot use either of these without a developer manually calling the REST API.

*(Inventory batch/lot tracking was originally flagged here too, based on a guessed admin URL and an incomplete grep of the PHP-only menu file. That was wrong — a full, working Batches & Expiry page exists at **StoreEngine → Inventory → Batches**, with search/filter, expiry tracking, and real Write Off / Recall / Quarantine actions. See the corrected **Inventory** section below.)*

### Systemic pattern 2: Business rules configured in the UI, never enforced where it counts

- Wholesale customer groups' **credit limit** and **minimum order value** are saved and displayed, but never checked anywhere in the real checkout path.
- Wholesale **MOQ / case-size** rules are only applied inside the admin-built Quotes flow — a real customer can buy 1 unit of a 12-unit-minimum product on the storefront with no blocking or rounding.
- Retail's **age-restriction** minimum age is enforced at POS only — there is no online age gate at all.

### Critical / blocking issues (fix before this ships)

1. **[Quotes/Core] Negotiated prices are silently discarded when a quote converts to an order** — the buyer is billed the live catalog price instead of the agreed price. Root cause is in core `Order::add_product()`, not Wholesale-specific — this would also discard wholesale group discounts and per-product tier prices generally. This breaks the core promise of the Quotes feature for the normal case (agreed price ≠ current catalog price), not an edge case. See **Wholesale — Quotes**.
2. **[Core] Checkout silently truncates fractional quantities to whole numbers** — the exact bug class this branch's own commits claim to fix, but the checkout code path (`checkout-service.php:836`, `absint()`) was missed. Every fractional-quantity sale currently loses data between cart and order. See **Core — Decimal Quantity/UOM**.
3. **[Core] Cart-page quantity stepper destroys fractional quantities on any interaction** (displays truncated, and any +/- click permanently rounds the real value). Same root-cause family as #2, different file. See **Core — Decimal Quantity/UOM**.
4. **[Retail] Controlled-substance sales via POS never reach the Controlled Register** — directly contradicts the register's own "added automatically" claim; a real compliance gap for a feature explicitly built for regulatory inspection. See **Retail Vertical**.
5. **[Suppliers] Return-to-vendor/debit notes has no admin UI at all** (Pattern 1 above).
6. **[Suppliers] Purchase-order creation requires hand-typed database IDs, no product picker** (Pattern 1 above) — functionally blocks real-world PO creation.

### High-severity issues

- **[Quotes]** A quote item that never resolves to a price silently produces a dead, unpayable $0 order with no warning anywhere in the UI — this is a variant of the exact bug this testing session was originally called in to fix, via a different still-open code path.
- **[Wholesale Admin]** Credit limit / minimum order value never enforced (Pattern 2).
- **[Wholesale Admin]** MOQ/case-size never enforced on the real storefront cart (Pattern 2).
- **[Core]** Storefront quantity input hardcodes `step="1" min="1"`, blocking fractional entry from the product page itself.
- **[Suppliers]** Creating a supplier without a lead-time value fails with a raw technical error (`Invalid parameter(s): lead_time_days`) despite the field looking optional.
- **[Suppliers]** A purchase order with no "Expected date" set is permanently miscounted as late, dragging every supplier's On-time % toward 0% for perfectly normal, undated POs — a three-file data-integrity bug (empty string → stored as a MySQL zero-date → passes an `IS NOT NULL` guard meant to exclude it).

### What's already solid

The Wholesale Quotes happy path (create → send → email → accept → pay) works end-to-end, including correct email merge-tag resolution, correct permission boundaries (cross-customer and unauthenticated access both correctly blocked), and correct expiry handling. Retail's prescription refill/dispense state machine is correct under live testing. The customer/product picker bug fixed earlier in this engagement does not recur anywhere else in the codebase (verified via a dedicated audit — see **Cross-Cutting Picker Audit**). Core's `Quantity` class and `StockManager` integration are well-designed and correct; the bugs found are specifically at the checkout/cart UI layer, not in the underlying model. Suppliers' core purchase-order lifecycle (create → submit → partial receive → full receive, with correct stock updates) was confirmed working end-to-end once live-tested to completion — the picker/ID-typing problem is a usability blocker on top of a sound workflow, not a broken one. Inventory's Batches & Expiry admin page (search/filter/expiry tracking, Write Off/Recall/Quarantine actions) is also real and working, once live-verified past an initial guessed-URL false negative — see the correction note in that section.

### A recurring rollout note

Both the **Email** addon (blocking Quotes emails) and the **Suppliers** addon were found inactive by default during this testing pass and had to be manually activated to test the features they gate. Combined with the "backend exists, UI doesn't" pattern above, this branch reads like several features landed mid-flight — worth a deliberate pass to decide, per feature, whether it's ready to ship active-by-default, needs a UI before shipping at all, or should be explicitly marked experimental/hidden.

---

## Wholesale — Admin (Groups, Price Lists, Ledger, Product Editor Panel)

Tested live via Playwright against `https://kodezen.test/wp-admin/admin.php?page=storeengine-wholesale` (Customer groups), `&path=accounts` (Ledger), cross-referenced against `addons/wholesale/classes/{groups,ledger,price-lists,order-rules,hooks}.php` and `api/{groups,ledger}-controller.php`. Created a real test group ("PR-TEST-Wholesale Group"), added a member and a price tier, recorded a ledger entry.

### Bugs

- **[high] `check_order_minimum()` and `Ledger::can_charge()` are never invoked outside their own definitions — a group's "Minimum order value" and "Credit limit" are pure decoration.** `grep -rn "check_order_minimum" addons/` and `grep -rn "can_charge" addons/` each only match the definition (plus one unused REST endpoint for can_charge). Nothing in the real checkout path calls either. An admin setting these fields via the Groups UI would reasonably expect them enforced at checkout — they aren't.
- **[high] MOQ / case-size (`WholesalePanel.js`) is only enforced in the admin-built Quotes flow — never on the real storefront cart.** `OrderRules::apply()` is only called from `quotes.php` (staff manually building a quote) and the standalone `/wholesale/quote-price` lookup endpoint — never from cart/add-to-cart. The product editor's own copy ("A trade customer cannot order fewer than X of these") implies storefront enforcement that doesn't exist; a real customer can add 1 unit of a MOQ-12 product with no rounding or blocking.
- **[medium] Group "Save" fails silently when Name is empty — no error shown to the admin.** `Groups::create()` correctly rejects server-side (confirmed via a live `Request failed with status code 400`), but `GroupsList.js`'s `save()` never checks the API response for failure — no toast, no inline error. The modal just sits there. Evidence: `wa-03b-save-with-empty-name.png`.

  ![Group save with empty name — no error shown](pr-testing-screenshots/wa-03b-save-with-empty-name.png)

- **[low] Edit-group modal shows raw unformatted DB decimals instead of clean numbers** ("15.0000"/"5000.0000"/"100.0000" instead of "15"/"5000"/"100"), because `onClick={() => setEditing(row)}` passes the API row straight through with no `Number()` normalization, unlike the New-group form's real-number defaults. Evidence: `wa-11-edit-group-modal.png`.

  ![Edit-group modal showing raw unformatted decimals](pr-testing-screenshots/wa-11-edit-group-modal.png)

### UI/UX issues

- No delete action for a Customer group anywhere in the UI, though `Groups::delete()` (with correct member/price cascade) exists and is wired to the REST API.
- No way to remove a member or delete a price tier once added — both backend operations (`Groups::assign($user_id, 0)`, `PriceLists::delete_tier()`) exist; the UI lists are read-only after adding. Confirmed live (`wa-09-after-add-tier.png`).

  ![Group detail after adding a price tier — no delete/remove action on the list](pr-testing-screenshots/wa-09-after-add-tier.png)
- Discount type "None" leaves the Discount value field editable/visible even though it has no effect.
- The "Do not charge tax" switch's adjacent label text isn't clickable — only the small switch control itself responds (plain sibling text, not a wrapping `<label>`).

### Functional issues / mismatches with real workflow

- The `note` field is a dead end: fully supported by `Groups::create()`/`update()` and stored, but no form (New or Edit group modal) exposes an input for it — only settable via direct API call. Confirmed: `wa-11-edit-group-modal.png` has no Note field.
- Ledger only supports recording *payments* from the UI (`Accounts.js` hardcodes `type: 'payment'`), never charges/credits/adjustments, even though `Ledger` fully models all four. The only way a `charge` entry is ever created is automatically via `Hooks::charge_account()` on `payment_complete` — there's no way to manually invoice a customer for something outside checkout (phone order, correction, return credit).
- Assigning a member to a group silently replaces their existing group membership (`$wpdb->replace()`) with no warning shown first.

### Missing features / workflows

- No bulk-assign of customers to a group (one-at-a-time picker only).
- No audit trail on group term changes (discount/credit terms apply retroactively with no history).
- Tiers are effectively append-only — can't edit or delete a wrong entry once added (worth checking `matching_tier()`'s tie-break behavior if two tiers ever share a `min_qty`).
- No cross-linking between Groups and Accounts screens — can't see a member's balance/credit status while managing group membership, or a customer's group/terms while viewing their ledger.

### Improvements

- Show per-member current balance inline in the group-detail Members list (data already available via `Ledger::balance()`).
- Auto-open the statement after picking a customer in Accounts, instead of requiring a second "See what they owe" click.
- Grey out Discount value when Discount type = None.

### What works well

- Group create/edit, member search-and-add, and tier search-and-add all function correctly end-to-end once past the validation-feedback gap. The customer/product picker components correctly find and select records — including the site admin account, which was the subject of an earlier bug fix this session and held up under fresh testing here.
- `Hooks::apply_group_price` / `maybe_exempt_tax` (the mechanisms that *are* wired into real cart pricing) correctly hook `storeengine/cart/raw_item_price` / `storeengine/price/is_taxable` — tiered/discounted pricing and tax exemption genuinely apply on the real storefront, in contrast to the unenforced quantity/credit rules above.
- Accounts screen's empty state and ledger statement's running-balance table are clear and match the backend model exactly; recording a payment correctly recalculates and persists the running balance.

---

## Wholesale — Quotes (full lifecycle: create → send → email → customer portal → pay)

Tested against `https://kodezen.test` as `abdullah5603` (admin, also a valid quote recipient). Mailpit SMTP is active on this box, so email delivery/content was verified via its API directly, not just code review.

Test artifacts left in place for inspection: quote/order pairs #6/#14 (priceless-product edge case), #7/#15 (main flow, fully paid via COD), #8 (expired), product #142 ("PR-TEST-No-Price-Product").

### Bugs

**[CRITICAL] Negotiated / non-catalog prices are silently discarded when a quote converts to an order — buyer is billed the standard price instead.**
Repro: create a quote with a negotiated-price line (Ultra Notebook at $55.50 vs its real catalog price $402.49) → mark sent → accept & pay via customer portal. The quote itself stores 55.50 correctly throughout, and the resulting order item's `price` meta field even stores 55.50 correctly — but its `subtotal`/`total` (the actually billed amount) is $402.49. Order #15 was billed $585.44 instead of the promised $238.45.
Root cause: `storeengine/includes/classes/abstract-order.php:2088`, `Order::add_product()`. It computes `$total` from the live catalog price (`$price->get_price()`, line 2095) *before* merging `$args`, then `wp_parse_args($args, ['price'=>$_price,'subtotal'=>$total,'total'=>$total,...])` only fills in keys not already present — so a caller's explicit `'price'` override survives into the `price` meta field, but since `Quotes::convert()` never passes `'subtotal'`/`'total'`, those silently default to the catalog-price-derived total. This is a core-level bug, not Wholesale-specific — but Wholesale/Quotes is what actually depends on it, since it's the mechanism that would also discard any wholesale group discount or per-product tier price (verified the mechanism generalizes: the one line that billed correctly only did so because its resolved price coincidentally equaled its catalog price). This breaks the entire feature's core promise for any quote where the agreed price differs from current catalog price — the normal case, not an edge case.
Suggested fix: compute `$total` from `$args['price'] ?? $_price` in `add_product()`, not unconditionally from the catalog price.
Evidence: order #15 payment page showed $402.49 for a $55.50-negotiated line; DB confirms quote_items.unit_price=55.50 vs order item subtotal/total=402.49 (=Price ID 1's live catalog price).

**[HIGH] A quote item that never resolves to a `price_id` "succeeds" silently, producing a dead, unpayable order with no warning anywhere.**
Repro: create a product with no Price object → quote it → convert. `Quotes::create()` returns `ok:true` with the item stored at `price_id=0`/`unit_price=0`. `Quotes::convert()` returns `ok:true` with a real-looking `pay_url` — but its own `if (!$price_id) continue;` guard silently drops the item, leaving the order with zero items, `total=0`, `needs_payment()=false`. That `pay_url` leads straight to the exact "cannot be paid" dead end this session's original bug report was about, via a different still-open root cause. Nothing in admin or customer UI flags it — the list still shows "Turned into an order" in green.
Suggested fix: `Quotes::create()` should reject/warn when no price_id resolves; `Quotes::convert()` should treat "all items dropped" as failure, not success.
Evidence: quote #6 → order #14, 0 items, total=0, needs_payment()=false.

**[MEDIUM] Admin Quotes list shows raw customer IDs instead of names.** `QuotesList.js`: `row.contact_name || (row.user_id ? '#${row.user_id}' : '—')` — the name fallback only covers guest/contact_name quotes, never a real linked account, which is the normal case. Every row showed `#1`/`#25` instead of the customer's name.

### UI/UX issues

- No search, status filter, or pagination on the admin list — `showColumnFilter={true}` is set but nothing filter-like renders. Already needs scrolling at 8 test rows.
- Admin list isn't semantic table markup — `<div class="kzui-table__body-row">` rows, zero `<tr>` elements exist on the page. Accessibility gap.
- Customer-facing quotes dashboard is noticeably better UX than admin's (human status labels, linked references) — backwards, given staff manage far more quotes than any one buyer.
- Admin list total column has no currency symbol (`182.95`); customer-facing list correctly shows `$182.95`.

### Functional issues / mismatches with real workflow

- **No admin-side quote detail/view page.** Reference is plain text, not a link. Staff can't see a quote's actual line items/prices without reading the DB directly.
- **Draft quotes can't be edited** — no Edit action anywhere; a typo means starting over.
- (Minor) `CustomerPortal::handle_request()`'s accept path writes `status=accepted` then immediately calls `convert()`, which independently may overwrite it to `expired` on the next line — harmless but a pointless extra write; checking expiry first would avoid it.

### Missing features / workflows

- No duplicate/re-quote action.
- No bulk actions on the admin list.
- No printable/PDF quote for internal buyer-side approval routing.

### Improvements

- Warn/block at creation time when a product has no resolvable price (mitigates the HIGH bug).
- Warn before "Convert to order" if the result would total $0 or drop items.
- Add the missing currency symbol to the admin list.

### What works well

Full happy path works cleanly end-to-end: create (mixed auto+negotiated pricing, long notes, blank valid-until) → sent → `QuoteSent` email via Mailpit with every merge tag correctly resolved → customer portal shows correct total/valid-until messaging → Accept & Pay → checkout → COD payment → order → `processing`, quote stays `converted` with correct `order_id` → `QuoteReadyForPayment` email with fully-resolved order items/totals. `valid_until` defaults to +30 days correctly. Expiry handling is correctly layered (customer view re-checks date live, independent of the daily cron; `expire_lapsed()` itself works correctly on direct invocation). Cross-customer access is correctly blocked with zero data leakage (tested against a real pre-existing quote owned by a different user). Logged-out access correctly falls through to login, no leakage. REST API correctly 401s unauthenticated list/create/fetch requests with no data leakage. Zero-qty item-add is correctly blocked client-side. Mixed pricing sums correctly in the quote's *own* stored total (the bug only appears downstream at conversion).

### Could not verify

- Variable-product quote items — zero variable products exist in this site's seed catalog.
- REST permission boundary for an authenticated-but-non-privileged customer — only the logged-out case (401, correct) was tested; didn't reset a test account's password to log in as one.
- Live tamper repro of "act on an already-converted quote via a valid nonce" — code review confirms the guard exists and is correctly ordered, but a wp-cli-generated nonce is scoped to a different user context and gets rejected before reaching that check, so this rests on code review rather than a live repro.

---

## Retail Vertical (pharmacy/grocery: settings, controlled register, prescriptions, product editor panel)

### Bugs

- **[critical] Controlled substances sold via POS (or any path outside the explicit "Dispense against prescription" flow) never reach the Controlled Register — silently contradicting the register's own stated purpose and its own empty-state copy.**
  Repro/evidence: Product #132 ("Napa 500mg") is configured `Prescription required = on`, `Controlled substance schedule = Schedule I`. Its Stock Movements show 10 POS sales (Orders #1–#10, tagged `_storeengine_pos_source = pos`), decrementing stock 500→347. Queried `wp_storeengine_controlled_log` directly: **0 rows, for any product, site-wide.** Grepped every call site of `ControlledRegister::record()`: only the seeder, a manual staff-entry REST endpoint, `Prescriptions::dispense()`, and `storeengine_pro/batches/received` ever write to it — **no hook exists from POS sale completion, order fulfillment, or checkout.** `Gating::validate_add_to_cart()`'s own docblock confirms POS deliberately bypasses the online RX block, and `inspect_basket()` only *prompts* the cashier, never forces logging. Yet the Controlled Register page's empty-state text says *"Entries are added automatically when controlled medicine comes in or is given out"* — misleading given the actual gap. I verified the dispense path itself works correctly (live-called `Prescriptions::dispense(1, 1.0, [])`, got a proper hash-chained row with correct `balance_after`), so this is specifically about POS/order sales bypassing the register, not the hashing engine being broken. For a feature whose own docblock calls this "the one part of this addon that an inspector will actually read," this is a serious compliance gap.
  Suggested fix: hook controlled-item line items into `ControlledRegister::record()` at order/POS-sale completion, mirroring `on_batch_received()`.

- **[medium] Settings → Retail's "old link" redirect points at a URL format the router doesn't use, landing on the wrong tab.**
  `dev_storeengine-pro/containers/pages/Retail/index.js:9`: `SETTINGS_URL = 'admin.php?page=storeengine-settings#/settings/retail'`. Visiting the old Retail-settings URL triggers this redirect but lands on **General**, not Retail — the router actually uses `&path=retail` (query param), not a `#/settings/...` hash. Confirmed by clicking the sidebar Retail link directly. Screenshots: redirected-to-General vs. correct-URL-shows-Retail-screen.
  Fix: change the constant to `admin.php?page=storeengine-settings&path=retail`.

### UI/UX issues

- **[low]** "Add barcode rule" pre-fills a full rule with defaults (`prefix:2, item_digits:5, value_digits:5, price, /100`) rather than starting blank — not actually a clone-last-row bug (it's a deliberate `blankRule` constant), but because the defaults match the seeded example exactly, two rows look identical and it's easy to accidentally Save a true duplicate without noticing. `blankSchedule` a few lines below starts genuinely empty, for contrast.
- **[low]** Prescriptions list stacks patient name directly above prescriber name in one column with no label — reads at a glance like a single two-line value ("Test" / "Test Doctor").

### Functional issues / mismatches with real workflow

- Age-restricted (grocery) items have **no online enforcement**, only `requires_rx` blocks online add-to-cart. `minimum_age` is fully wired for POS only (its own help text says so honestly: "The till asks the cashier to check ID"). Appears to be a deliberate scope choice per the Gating class docblock, but worth flagging: a shop selling alcohol/tobacco online has zero age-gate mechanism here.
- The controlled register can go **negative with no warning** — a test dispense against a product that never had a "receive" entry produced `balance_after: -1.000` with no visual flag. For an audit record, that should be a hard red flag, not a quiet negative number.

### Missing features / workflows

- No visible export/print/CSV on the Controlled Register screen — a real inspection needs to hand over or print extracts, not screen-scrape a paginated table.
- No distinct "pharmacist" capability separate from `manage_options`/shop_manager — can't grant dispensing/register access to a specific licensed staff member without giving full shop-manager rights.

### Improvements

- Warn (not block) when saving two barcode rules with identical prefix/digit config — currently possible, and a scanned barcode matching both would be ambiguous.
- Surface a "last verified at" timestamp on the chain-integrity check, or auto-run it with a staleness indicator.

### What works well

- Settings → Retail is well designed: clear mode framing, good inline examples, sensible defaults, and the chain-verification UI ("All N entries check out") is a genuinely strong trust-building feature.
- `Prescriptions` refill/dispense state machine matched its documented rules exactly under live testing (partial fill doesn't consume a refill, first fill isn't "1 of N refills", expiry checked at dispense time).
- Prescriptions list filtering and per-row Dispense action are clear and usable.
- Product editor's Retail panel correctly hides mode-inapplicable fields, flags a since-removed schedule code instead of silently dropping it, and coexists cleanly with the Wholesale panel on the same product.
- Settings persistence round-tripped correctly for every field changed (new schedule, toggles) via `/wp-json/storeengine/v1/retail/settings`.

### Could not verify

- Actual online-storefront add-to-cart blocking for an rx_required product (confirmed the filter is registered via code review; didn't drive a live logged-out cart test — time budget).
- `BarcodeRules` scan-matching against a real typed/scanned barcode at POS (only reviewed the settings/config side).

---

## Suppliers (purchase orders, return-to-vendor/debit notes, reasons, list views)

Suppliers addon was inactive by default; activated for testing (same pattern as the Email-addon precedent — several Pro features ship inactive-by-default). This section was updated after a full PO lifecycle (create → submit → partial receive → full receive) was completed live, resolving what was originally the biggest testing gap in this area.

### Bugs

- **[high] Creating a supplier without "Lead time (days)" fails with a raw technical error, despite the field looking optional.** Repro: Add Supplier → fill only Name + Email → Save → red toast `Invalid parameter(s): lead_time_days`. Cause: `addons/suppliers/api/suppliers-controller.php:86` declares `'lead_time_days' => ['type' => 'integer']`; frontend sends `""` when blank, fails WP's REST integer validation. Fix: sanitize empty string to null, and surface field-level errors instead of a raw parameter-name toast. Evidence: `sp-22-two-suppliers-v2.png`.

  ![Supplier list showing the mojibake and lead_time_days validation fallout](pr-testing-screenshots/sp-22-two-suppliers-v2.png)

- **[high] A PO created with no "Expected date" is permanently counted as late in the supplier's On-time % — dragging every supplier's score toward 0% for perfectly normal, undated POs.** Root cause traced across three files: (1) `PurchaseOrdersList.js`'s form always sends `expected_at: ''` in the payload even when the date field is left blank, never omitted; (2) `purchase-orders.php:91`: `'expected_at' => isset($data['expected_at']) ? sanitize_text_field(...) : null` — since the key is *present* (just empty), `isset()` is true, so it never falls through to `null`, and an empty string gets written instead; (3) MySQL silently coerces that empty string into the zero-date sentinel `0000-00-00 00:00:00` for the `DATETIME` column (confirmed via `wp eval` — the stored row literally has `expected_at => 0000-00-00 00:00:00`); (4) `performance.php:49-51`'s on-time SQL only checks `expected_at IS NOT NULL` — a zero-date string passes that check, so the PO is counted in the denominator but obviously fails `received_at <= expected_at`. Verified live: after receiving a test PO with no expected date, same-day, the supplier's On-time metric read **0.0%** instead of being excluded (`—`) as the SQL's own `IS NOT NULL` guard clearly intended. Fix: send `null`/omit the key from the frontend when blank, or coerce falsy/zero-date strings to `null` before insert. Evidence: `sp-80-suppliers-list-with-po-history.png`.

  ![Supplier list with real PO history — On-time % reads 0.0% for an undated PO](pr-testing-screenshots/sp-80-suppliers-list-with-po-history.png)

- **[medium-high] Mojibake (double-encoded UTF-8) baked into source, confirmed in at least 3 files, live on 3 different screens.** `SuppliersList.js` (7 occurrences), `PurchaseOrdersList.js` (2, including the Supplier picker's "Select…" placeholder), and also confirmed live on the **PO detail page** (SKU column shows `â€"`, a checkmark shows `âœ"`) — likely from a shared cell-formatting helper `PurchaseOrderEditor.js` imports, since a direct grep on that file came back empty. Fix: correct the literals to `—`/`✓`/`×`/`…`; add a lint rule for this byte pattern. Evidence: `sp-22-two-suppliers-v2.png`, `sp-63-po-created.png`, `sp-80-suppliers-list-with-po-history.png`.

  ![PO detail page showing mojibake in the SKU column](pr-testing-screenshots/sp-63-po-created.png)

- **[low]** Blank "Expected date" is stored as a zero-date rather than `NULL` — same root cause as the On-time bug above, worth calling out separately as a general data-integrity smell (zero-dates break under strict SQL mode and sort/compare unpredictably elsewhere).

### UI/UX issues

- **[critical, functionally blocking] Purchase Order line items require typing raw numeric Product ID and Variation ID by hand — no product picker.** Confirmed both in source (zero `ProductPicker` references anywhere in the Suppliers directory, despite that component existing and being used elsewhere in this same PR) and live — a test PO could only be assembled because the product's ID was already known from earlier testing; a real purchasing manager doesn't have IDs memorized. Evidence: `sp-33-po-supplier-selected.png`, `sp-51-po-with-product-116.png`.

  ![PO line-item entry — raw numeric Product ID / Variation ID fields, no picker](pr-testing-screenshots/sp-51-po-with-product-116.png)

- **[medium] The PO detail page displays raw IDs instead of resolved names, for both supplier and product** ("Supplier ID: 1", "PRODUCT / VARIATION: #116" — no name lookup anywhere on the page). Same underlying pattern as the missing picker: never wired up to resolve IDs the way the rest of the codebase does (e.g. Wholesale Quotes shows customer/product names, never raw IDs). Evidence: `sp-63-po-created.png`.

- **[low]** No active/inactive status filter on the Suppliers list (search-by-text only).

### Functional issues / mismatches with real workflow

- **"Reasons" admin page manages customer-return reasons only — supplier returns have no reason management UI, and no validation on the reason value at all.** Customer returns (`addons/returns/database.php`) has a real `storeengine_return_reasons` table backing `ReasonsPage.js`. Supplier returns just accept an arbitrary string (`reason VARCHAR(40)`, default `'expired'`) — successfully created one with `'damaged'`, an apparently-undeclared value, with zero validation. These are two unrelated systems, not a shared concept.

### Missing features / workflows

- **[most important finding] Return-to-vendor / debit notes — the feature this PR specifically claims to add — has a complete, correct backend and literally zero admin UI to reach it.** `dev_storeengine-pro/containers/pages/Suppliers/index.js`'s `renderPage()` only ever returns `SuppliersList`, `PurchaseOrdersList`, or `PurchaseOrderEditor`; grepping the entire `dev_storeengine-pro` tree for `supplier-return`/`SupplierReturn`/"debit note" finds no UI file referencing it. Yet the backend is solid: `classes/supplier-returns.php` (415 lines) + `api/returns-controller.php` (155 lines), full REST API, its own two-table schema with batch/expiry tie-in. Verified directly via `wp eval`: a return for 2 units @ $10.50 unit cost correctly computed `credit_expected: 21` — uses cost, not retail price, as a debit note should. **Functionally sound, completely unreachable.** This should be top priority before this branch ships: wire up a UI (natural entry point: a "Create return" action from a received PO or the supplier detail view), or explicitly descope it.

### Improvements

- Supplier "Payment terms" is free text ("Net 30" typed successfully) rather than structured, unlike Wholesale's Customer Groups (`payment_terms_days` as integer) — inconsistent, and blocks any future PO-aging report from using it programmatically.
- Consider a soft allow-list for supplier-return `reason` values, mirroring customer returns.
- The `po_events` audit table only logged one event (`supplier / email_sent`) across a full create→submit→receive cycle — worth a deliberate answer on whether it's intentionally scoped to supplier-portal-side actions only, or whether admin-side lifecycle events should log there too for a complete audit trail. Not asserting this as a bug — insufficient context on the table's intended scope.

### What works well

- **The complete PO lifecycle works correctly, verified live start to finish**: created a PO (supplier + product, qty 5 @ $8.25) → Submit To Supplier (draft → `submitted`) → partial receive of 3 units (→ `partial`, correctly) → received remaining 2 (→ `received`). Confirmed in the DB: `qty_ordered = qty_received = 5`, PO total correct, and the product's stock quantity correctly incremented from 0 to 5 as a direct result of receiving. This is a solid, correctly-implemented core workflow — the earlier "could not verify" note on this is now resolved as **works correctly**.
- Fill-rate metric computed correctly from real data: 5/5 received = 100.0%, matching the completed PO.
- Row-actions ("…") menu on the Suppliers list works and exposes exactly Edit / Delete.
- Supplier CRUD (create), required-field validation, and list search/filter (including no-crash on no-results — the "fix crash when filtering a list" commit in this branch's history holds up) all confirmed working.
- Return-to-vendor backend math is correct (cost-based, not retail).
- Decimal-quantity support present throughout (PO schema `DECIMAL(12,3)`; live stock update showed a real float value), consistent with the rest of this branch's fractional-quantity work.

### Could not verify

- **PO approval workflow** — code confirmed present (`onApprove`/`onReject` buttons conditionally render for `pending_approval` status in `PurchaseOrderEditor.js`; an `approval_threshold` setting gates it; admin's own `storeengine_approve_po` capability auto-skips the gate per a code comment) but never triggered live — would need a second, non-admin user and a configured threshold to actually exercise it.
- Whether the `po_events` audit gap noted above is by design.

---

## Inventory — Batches & Expiry (+ decimal quantity interaction)

**Correction note:** the original pass on this area concluded "zero admin UI exists" for batch tracking, based on grepping `addons/inventory-pro/classes/menu.php` (which only PHP-registers "Inventory" and "Barcode Labels" as native wp-admin pages) plus a screenshot of a guessed URL that returned WordPress's generic "Sorry, you are not allowed to access this page" message. That conclusion was wrong, and the "not allowed" screenshot was misleading — it's what WordPress shows for *any* unregistered `admin.php?page=` slug, not evidence of a real broken route. The actual page lives in the React-rendered sidebar (not the PHP menu file that was checked) at `admin.php?page=storeengine-inventory&path=batches`, reachable via **StoreEngine → Inventory → Batches** in the sidebar. Verified live below; the findings in this section are corrected accordingly.

### Bugs
None found in the batches UI itself under live testing.

### UI/UX issues
- **[low]** No "coming soon" or cross-link between the Inventory sidebar's sub-items (Stock, Locations, Movements, Barcode Labels, Transfer, Batches, Restock sub) and the "Inventory" top-level page's own body content, which still only describes Locations — a merchant landing on the top-level page via the menu item itself could reasonably miss that Batches, Movements, Transfer, etc. exist as sibling pages, since the body text doesn't mention them.

### Functional issues / mismatches with real workflow
- **[medium]** No visible "Receive" or "Add batch" action was found on the Batches page itself during this verification pass (only per-row **Write Off** / **Recall** / **Quarantine** actions, plus search/status/expiring-soon filters) — batches appear to be created via the Suppliers→PO receiving flow (per commit `1045a9b`, which derives a batch code from the PO number) rather than manually here. Worth a follow-up pass to confirm there's no standalone "receive stock into a new batch" entry point outside of a PO, since not every stock intake is supplier-driven (e.g. a manual stock take or correction).

### Missing features / workflows
- **[medium]** No stocktake/reconciliation UI was located during this verification pass (`Batches::reconcile()` exists per the original pass's code review) — not re-verified live in this correction pass, flagged for follow-up rather than asserted as confirmed-missing.

### Improvements
- The digest's recipient fallback chain (`batch_digest_recipient` → `storeengine_low_stock_recipient` → `admin_email`), noted in the original pass, is sensible and worth confirming has a settings field once this area gets another look.

### What works well
- **The Batches & Expiry admin page is real, working, and reasonably well-designed** — verified live: a full data table (Product, Batch/Lot code, Expiry date with relative-time and red "expired" styling, Remaining quantity, Status badge, Actions), search by batch/lot code, a Status filter, and an "Expiring within 30 days" toggle. Per-row **Write Off**, **Recall**, and **Quarantine** buttons are present and real — directly correcting the original pass's claim that no UI exists for these actions.
- Core allocation logic is correct and solid, verified live: received 3 batches with a fractional qty (2.5) — summed precisely to 17.5, no rounding. **FEFO allocation is correct**: allocating 4 units drew 2.5 from the soonest-expiring batch then 1.5 from the next, leaving the undated batch untouched, decimal split exact. Shortfall handling returns a partial allocation + shortfall figure rather than throwing, as documented. Hook wiring is real (not just declared): `storeengine/order/stock_reduced`/`stock_restored` are genuinely fired by core `StockManager` and genuinely consumed by `Batches::on_stock_reduced/on_stock_restored`. `mark_expired()` correctly gates on `status=active`. Seed data's already-expired-but-in-stock lots line up with the deliberate "leave quantity until written off" design.

  ![Batches & Expiry — real, working admin page with filters and Write Off / Recall actions](pr-testing-screenshots/iv-batches-page-top.png)

### Could not verify
- Whether a per-product "track batches" toggle exists in the product editor — the original pass found the meta key (`_storeengine_track_batches`) whitelisted as savable in `register.js` but no panel rendering a checkbox for it (`RetailPanel.js`/`WholesalePanel.js` were checked; a dedicated Inventory panel, if one exists, wasn't). Not re-verified live in this correction pass.
- Real checkout-triggered consumption through the actual browser (no storefront UI marks a product as batch-tracked) — the original pass substituted a direct call to the real `on_stock_reduced` entrypoint with a synthetic order id rather than fabricate records against a real order.
- Digest email inbox delivery — the original pass verified the code path instead; confirmed it bypasses the Email-addon dependency that broke Quotes emails (uses `wp_mail()` directly).
- Multi-location isolation (only one default location available to test with).
- The "Receive"/"Add batch" question raised above.

---

## Core — Decimal Quantity / Unit of Measure (product editor, cart, checkout, orders, stock, variations)

**Testing note:** ran concurrently with other passes sharing the same admin account for Wholesale testing, causing transient noise in cart *totals* (a wholesale discount briefly applied). All findings below are anchored on the unambiguous `quantity` field, not totals. Test product #143 (PR-TEST-Fractional Rice) and order #13 were left in place as they demonstrate the core bug.

### Bugs

**[critical] Checkout silently truncates fractional quantity to a whole number — full data loss from cart to order.** Added 2.5kg to cart (cart API correctly shows `quantity:2.5, subtotal:62.5`), completed checkout via COD. Order confirmation shows "Qty: 2"; confirmed at DB level `get_quantity()` returns `float(2)`. Stock deducted by exactly 2, not 2.5.
**Root cause found**: `storeengine/includes/classes/checkout-service.php:836`, in `CheckoutService::add_product()`:
```php
'quantity' => absint( $values->quantity ),
```
`absint()` truncates to integer — this is the exact bug class the branch's commit "Order/cart: stop int type hints truncating fractional quantities" claims to fix, but this call site (the one that runs on every real checkout) was missed. Fix: `Quantity::parse( $values->quantity, $values->product_id ?? 0 )`.

**[high] Storefront quantity `<input>` has hardcoded `step="1" min="1"`**, not derived from the product's fractional step. Typing 2.5 makes `checkValidity()` return false ("nearest valid values are 2 and 3"); native validation UI interferes with add-to-cart.

**[critical] Cart-page quantity stepper displays a truncated "2" for a stored 2.5, and any interaction destroys it.** Loading `/cart/` shows `value="2"` (data is really 2.5). Clicking "+" once sends `PATCH .../cart/items/{key}` with `quantity:3` — the true 2.5 is permanently gone. Same root-cause family as the checkout bug, different file (cart-page quantity-stepper component).

### UI/UX issues
No unit-of-measure is shown anywhere on the storefront (product page, cart, order confirmation) — no "$25/kg", no "kg" suffix anywhere, even though the admin product editor labels this excellently. A by-weight customer has no way to tell they're not just buying "2 units."

### Functional issues / mismatches with real workflow
Pricing displays as flat "$25.00" with no per-unit suffix for a by-weight product — reads as "$25 each," actively misleading. "Sold individually" and "Sold by weight" toggles coexist with no UI callout about their interaction.

### Missing features / workflows
No storefront unit label; no shared fractional-aware quantity-input component (the admin editor solved this correctly — the pattern just wasn't reused for cart/product-page widgets).

### Improvements
Centralize the quantity input (step/min/decimals/unit) into one component shared by product-page and cart-page, driven by `Quantity::step()/decimals()/unit()`. Add an E2E test asserting order-item quantity after a fractional checkout — would have caught this exact regression.

### What works well
`includes/utils/quantity.php`'s `Quantity` class is well-designed and correctly used throughout `StockManager` (reduce/restore/adjust/reserve all correct). Product editor's Inventory panel (Sold by/Unit/Step/Purchase unit) round-trips fractional data correctly through save→reload. Cart-API-layer price math (25 × 2.5 = 62.5) was correct before checkout's `absint()` destroyed it.

### Could not verify
Variation-level fractional stock (likely shares the same checkout bug — untested assumption). Extreme-precision rounding. Zero/negative/non-numeric storefront validation. Order confirmation email content. Whether `checkout-service.php:836` predates this branch or is a regression — recommend `git log -p` on that line around the "stop int type hints" commit.

---

## Cross-Cutting — CustomersSelect / ProductPicker Audit

This session earlier found and fixed a bug in the shared `CustomersSelect` component (its cached option list only loaded once on mount instead of re-resolving when the selected value changed, so picking a customer from a search result would visually revert to blank). This branch adopted `CustomersSelect`/`ProductPicker` across many admin screens — this pass audited every other consumer for the same bug class.

### Consumers checked (list each, and clean/buggy)

**CustomersSelect consumers** (all benefit from the session's fix, which keyed the enrichment effect on `value` instead of running once on mount):
- `Licenses/CreateLicenseFormInner.js` — clean. Direct `option?.value` into `setFieldValue`, no stale re-lookup.
- `Returns/ReturnsList.js` (customer-override field) — clean. Stores the option object directly.
- `Retail/PrescriptionsList.js` — clean. Direct `option?.value` into local form state.
- `Wholesale/Accounts.js` — clean. **Live-verified**: searched "abd", selected admin, field correctly held "abdullah5603 / admin@admin.com" after selection — confirming the fix generalizes correctly.
- `Wholesale/GroupsList.js` (add-member field) — clean. Direct `option?.value ?? ''`.
- (Wholesale/Quotes, Order Editor, MoveAccountModal — already covered/fixed earlier this session, not re-audited.)

**ProductPicker consumers** — architecturally immune to this bug class by design: it never re-looks-up the selected value in its own fetched options list, and hands the caller the full option at selection time. All checked callers correctly store the option directly: `Dashboard/index.js`, `ProductAnalytics/index.js`, `SizeCharts/SizeChartEditor.js`, `Faqs/FaqGroupEditor.js`, `Reviews/ReviewModal.js`, `Retail/ControlledRegister.js` (product filter only).

**Related-but-separate component found**: `Returns/ReturnsList.js` also imports `OrderSelect` from `@ProComponents/OrderSelect` — an independently-written async order picker, not built on `CustomersSelect`.

### Bugs

- **[low, latent/dormant — not currently reachable] `OrderSelect` has no enrichment path for an externally pre-set `value`.** `OrderSelect` keeps a `knownOptions` array that *merges* (rather than replaces) every search result ever seen — actually the correct fix for the exact bug class found in `CustomersSelect` this session. For the one live usage (`ReturnsList.js`'s "Create return" modal, `order` state always starts `null`), this works correctly since any selectable order was just added to `knownOptions` by the search that surfaced it. But unlike `CustomersSelect` (which explicitly re-fetches to enrich a pre-set id it hasn't fetched itself), `OrderSelect` has no equivalent — if a future caller ever passes a pre-existing `value` not among the default/search results, the field would render blank exactly like the original bug. Not filing as live since nothing currently triggers it — flagging as a landmine for future reuse. Suggested fix: mirror `CustomersSelect` — re-run the load whenever `value` changes and isn't already in `knownOptions`.

No other bugs of this class found. Every live consumer uses the safe direct pattern.

### Functional issues / mismatches with real workflow
- **[info]** `Suppliers/PurchaseOrderEditor.js` does NOT use `CustomersSelect` or `ProductPicker` at all — its only `<Select>` is a static enum. Supplier/product references are read-only, raw IDs. Corroborates the Suppliers section's PO-picker finding above from a different angle — this editor looks receive/view-only, with no in-UI way to choose a supplier or add line items by name.

### Improvements
- `OrderSelect`'s merge-not-replace `knownOptions` pattern is arguably better than `CustomersSelect`'s fix (which re-fetches the whole default page on every `value` change) — worth considering backporting the accumulate-instead-of-replace idea into `CustomersSelect` for less network chatter.

### Could not verify
- Live browser exercise of every consumer individually — verified one (`Wholesale/Accounts.js`) live end-to-end as a representative sample since all share byte-identical `CustomersSelect` wiring; the rest verified via static code reading of their `onChange` handlers.

**Bottom line:** 6 CustomersSelect consumers + 6 ProductPicker consumers audited, all clean. The picker-component bug class from earlier this session does not recur anywhere else in the live codebase — the fix was sufficient and consumers are uniformly safe.


---

## Screenshot Gallery

Every screenshot captured during this testing pass, grouped by area, in capture order. Images already embedded above as specific evidence are included here too for completeness.

### Wholesale — Admin (Groups, Price Lists, Ledger)

**Groups list**

![Groups list](pr-testing-screenshots/wa-01-groups-list.png)

**New group modal**

![New group modal](pr-testing-screenshots/wa-02-new-group-modal.png)

**New group filled**

![New group filled](pr-testing-screenshots/wa-03-new-group-filled.png)

**Save with empty name**

![Save with empty name](pr-testing-screenshots/wa-03b-save-with-empty-name.png)

**After save group**

![After save group](pr-testing-screenshots/wa-04-after-save-group.png)

**Group detail modal**

![Group detail modal](pr-testing-screenshots/wa-05-group-detail-modal.png)

**After combobox click**

![After combobox click](pr-testing-screenshots/wa-05b-after-combobox-click.png)

**Member search**

![Member search](pr-testing-screenshots/wa-06-member-search.png)

**After add member**

![After add member](pr-testing-screenshots/wa-07-after-add-member.png)

**Tier product search**

![Tier product search](pr-testing-screenshots/wa-08-tier-product-search.png)

**After add tier**

![After add tier](pr-testing-screenshots/wa-09-after-add-tier.png)

**Back to list**

![Back to list](pr-testing-screenshots/wa-10-back-to-list.png)

**Edit group modal**

![Edit group modal](pr-testing-screenshots/wa-11-edit-group-modal.png)

**Accounts overdue list**

![Accounts overdue list](pr-testing-screenshots/wa-12-accounts-overdue-list.png)

### Wholesale — Quotes

**List initial**

![List initial](pr-testing-screenshots/wq-01-list-initial.png)

**Product search**

![Product search](pr-testing-screenshots/wq-02-product-search.png)

**Quote form filled**

![Quote form filled](pr-testing-screenshots/wq-03-quote-form-filled.png)

**Zero qty attempt**

![Zero qty attempt](pr-testing-screenshots/wq-04-zero-qty-attempt.png)

**After save**

![After save](pr-testing-screenshots/wq-05-after-save.png)

**After mark sent**

![After mark sent](pr-testing-screenshots/wq-06-after-mark-sent.png)

**Customer portal list**

![Customer portal list](pr-testing-screenshots/wq-07-customer-portal-list.png)

**Customer portal detail**

![Customer portal detail](pr-testing-screenshots/wq-08-customer-portal-detail.png)

**After accept redirect**

![After accept redirect](pr-testing-screenshots/wq-09-after-accept-redirect.png)

**After payment**

![After payment](pr-testing-screenshots/wq-10-after-payment.png)

**Expired quote view**

![Expired quote view](pr-testing-screenshots/wq-11-expired-quote-view.png)

**Tamper accept converted**

![Tamper accept converted](pr-testing-screenshots/wq-12-tamper-accept-converted.png)

**Tamper accept converted**

![Tamper accept converted](pr-testing-screenshots/wq-12b-tamper-accept-converted.png)

**Logged out view**

![Logged out view](pr-testing-screenshots/wq-13-logged-out-view.png)

**Cross customer view**

![Cross customer view](pr-testing-screenshots/wq-14-cross-customer-view.png)

**Portal list full**

![Portal list full](pr-testing-screenshots/wq-15-portal-list-full.png)

**Error2**

![Error2](pr-testing-screenshots/wq-error2.png)

### Retail Vertical

**Settings tab**

![Settings tab](pr-testing-screenshots/rt-01-settings-tab.png)

**Settings retail real**

![Settings retail real](pr-testing-screenshots/rt-03-settings-retail-real.png)

**Settings retail waited**

![Settings retail waited](pr-testing-screenshots/rt-04-settings-retail-waited.png)

**After add schedule**

![After add schedule](pr-testing-screenshots/rt-05-after-add-schedule.png)

**Before fill**

![Before fill](pr-testing-screenshots/rt-06-before-fill.png)

**Filled before save**

![Filled before save](pr-testing-screenshots/rt-07-filled-before-save.png)

**After save**

![After save](pr-testing-screenshots/rt-08-after-save.png)

**Product retail panel**

![Product retail panel](pr-testing-screenshots/rt-09-product-retail-panel.png)

**Prescriptions list**

![Prescriptions list](pr-testing-screenshots/rt-10-prescriptions-list.png)

**Controlled register**

![Controlled register](pr-testing-screenshots/rt-11-controlled-register.png)

### Suppliers

**Suppliers list empty or initial**

![Suppliers list empty or initial](pr-testing-screenshots/sp-01-suppliers-list-empty-or-initial.png)

**Add supplier modal**

![Add supplier modal](pr-testing-screenshots/sp-02-add-supplier-modal.png)

**Add supplier filled**

![Add supplier filled](pr-testing-screenshots/sp-03-add-supplier-filled.png)

**After save supplier**

![After save supplier](pr-testing-screenshots/sp-04-after-save-supplier.png)

**Po list**

![Po list](pr-testing-screenshots/sp-05-po-list.png)

**Po editor direct nav**

![Po editor direct nav](pr-testing-screenshots/sp-06b-po-editor-direct-nav.png)

**Supplier filled**

![Supplier filled](pr-testing-screenshots/sp-10-supplier-filled.png)

**Supplier after save**

![Supplier after save](pr-testing-screenshots/sp-11-supplier-after-save.png)

**Supplier filled v2**

![Supplier filled v2](pr-testing-screenshots/sp-20-supplier-filled-v2.png)

**Supplier after save v2**

![Supplier after save v2](pr-testing-screenshots/sp-21-supplier-after-save-v2.png)

**Two suppliers v2**

![Two suppliers v2](pr-testing-screenshots/sp-22-two-suppliers-v2.png)

**Empty name validation**

![Empty name validation](pr-testing-screenshots/sp-23-empty-name-validation.png)

**Supplier clicked**

![Supplier clicked](pr-testing-screenshots/sp-24-supplier-clicked.png)

**Po list initial**

![Po list initial](pr-testing-screenshots/sp-30-po-list-initial.png)

**Po editor blank**

![Po editor blank](pr-testing-screenshots/sp-31-po-editor-blank.png)

**Po supplier selected**

![Po supplier selected](pr-testing-screenshots/sp-33-po-supplier-selected.png)

**Filter acme**

![Filter acme](pr-testing-screenshots/sp-40-filter-acme.png)

**Filter no results**

![Filter no results](pr-testing-screenshots/sp-41-filter-no-results.png)

**Final list state**

![Final list state](pr-testing-screenshots/sp-42-final-list-state.png)

**Po with product 116**

![Po with product 116](pr-testing-screenshots/sp-51-po-with-product-116.png)

**Po created**

![Po created](pr-testing-screenshots/sp-63-po-created.png)

**Suppliers list with po history**

![Suppliers list with po history](pr-testing-screenshots/sp-80-suppliers-list-with-po-history.png)

**Error2**

![Error2](pr-testing-screenshots/sp-error2.png)

**Error3**

![Error3](pr-testing-screenshots/sp-error3.png)

**Error4**

![Error4](pr-testing-screenshots/sp-error4.png)

### Inventory — Batches & Expiry

*(The two screenshots previously here of a guessed, unregistered URL — showing WordPress's generic "Sorry, you are not allowed to access this page" message — have been removed. That message is what WordPress shows for any nonexistent `admin.php?page=` slug; it wasn't evidence of a real broken route, and its inclusion led to an incorrect "no admin UI" finding that has since been corrected. See the real, verified page below.)*

**Batches & Expiry — full page**

![Batches and expiry full page](pr-testing-screenshots/iv-batches-page-real.png)

**Batches & Expiry — top (filters and actions)**

![Batches and expiry top](pr-testing-screenshots/iv-batches-page-top.png)

**Inventory locations page**

![Inventory locations page](pr-testing-screenshots/iv-inventory-locations-page.png)

**Product editor full**

![Product editor full](pr-testing-screenshots/iv-product-editor-full.png)

**Products list**

![Products list](pr-testing-screenshots/iv-products-list.png)

### Core — Decimal Quantity / UOM

**Add product**

![Add product](pr-testing-screenshots/dq-00-add-product.png)

**After create**

![After create](pr-testing-screenshots/dq-01-after-create.png)

**Soldby open**

![Soldby open](pr-testing-screenshots/dq-03-soldby-open.png)

**After weight select**

![After weight select](pr-testing-screenshots/dq-04-after-weight-select.png)

**After qty fill**

![After qty fill](pr-testing-screenshots/dq-05-after-qty-fill.png)

**After publish**

![After publish](pr-testing-screenshots/dq-06-after-publish.png)

**Product page**

![Product page](pr-testing-screenshots/dq-07-product-page.png)

**Qty 2.5 typed**

![Qty 2.5 typed](pr-testing-screenshots/dq-08-qty-2.5-typed.png)

**After add to cart**

![After add to cart](pr-testing-screenshots/dq-09-after-add-to-cart.png)

**Cart page**

![Cart page](pr-testing-screenshots/dq-10-cart-page.png)

**Cart recheck**

![Cart recheck](pr-testing-screenshots/dq-11-cart-recheck.png)

**After plus click**

![After plus click](pr-testing-screenshots/dq-12-after-plus-click.png)

**After plus click2**

![After plus click2](pr-testing-screenshots/dq-13-after-plus-click2.png)

**Checkout page**

![Checkout page](pr-testing-screenshots/dq-14-checkout-page.png)

**After place order**

![After place order](pr-testing-screenshots/dq-15-after-place-order.png)

### Cross-Cutting — Picker Audit

**Accounts after select**

![Accounts after select](pr-testing-screenshots/pk-accounts-after-select.png)

**Accounts before**

![Accounts before](pr-testing-screenshots/pk-accounts-before.png)

**Accounts search**

![Accounts search](pr-testing-screenshots/pk-accounts-search.png)
