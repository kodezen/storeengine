# Decimal Quantities & Unit of Measure

This document explains **storeengine PR #1122** and **storeengine-pro PR #90**, two connected pull requests that let StoreEngine sell things by weight, length, or volume — not just by whole units.

Both PRs must be merged together. PR #90 (Pro) depends on PR #1122 (Core) — merge Core first.

---

# Part 1 — For Everyone (Non-Technical)

## The problem, in plain words

Before this change, StoreEngine could only count products as whole numbers. If you sold rice, cable, or oil, the system treated "1" as the smallest unit — it couldn't understand "0.75 kilograms of rice" or "1.35 meters of cable." It would just round it down, or worse, silently save it as **zero**, meaning the sale wouldn't reduce your stock at all.

This meant StoreEngine could not properly serve:
- **Grocery stores** — selling rice, vegetables, or oil by weight
- **Pharmacies** — selling loose tablets, syrups, or controlled medicine
- **Hardware/fabric shops** — selling cable, pipe, or fabric by length
- **Super shops** — a mix of all of the above, plus normal packaged goods

## What changed

### 1. You can now sell things by weight, volume, or length (Core)

Every product can be marked as sold **"each"** (like before — 1 shirt, 2 chairs), or by:
- **Weight** (kg, g, lb) — e.g. 0.750 kg of rice
- **Volume** (L, mL) — e.g. 1.5 liters of oil
- **Length** (m, cm) — e.g. 1.35 meters of cable

This is set per-product in a new **"Sold by"** section on the product edit page. If you don't touch it, everything works exactly as before — whole numbers only.

You can also set a **step**, meaning the smallest amount that can be sold — e.g. rice must be sold in steps of 0.05 kg, not 0.001 kg.

### 2. Buying in cartons, selling in pieces (Core)

Some products come in from your supplier packed differently than you sell them. Example: a carton of 20 strips, each with 10 tablets, equals 200 tablets. The system now understands this conversion, so your stock count stays accurate whether you're receiving a carton or selling one tablet.

### 3. Batches & expiry dates (Pro — Inventory)

For products that expire (medicine, food), you can now track **batches (lots)** — each with its own expiry date, cost, and supplier. Turn this on per product with a **"Track this product in batches"** toggle.

- When you sell, the system automatically sells from the batch that expires **soonest first** (so nothing expires unnecessarily on the shelf).
- Expired or recalled batches can never be accidentally sold.
- A new **Inventory → Batches** page shows every batch, color-coded by how close it is to expiring, with a one-click "expiring within 30 days" filter.
- You can write off, recall, or quarantine a batch directly from that page.

### 4. Physical stock counting — "Stocktake" (Pro)

You can now do a proper physical stock count ("we counted 37 boxes on the shelf") without it getting confused by sales happening during the count. The system remembers what it expected at the start, and only adjusts stock by the *difference* — so a sale mid-count doesn't wipe out your count.

### 5. Serial numbers / IMEI tracking (Pro)

For electronics or appliances where every single unit matters (phones, laptops), you can track **one row per physical item** with its own serial number and warranty start date. Returned items are marked "returned," not put back as brand-new stock, but they keep their original warranty.

### 6. Supplier returns / vendor credit (Pro)

If a batch of stock has expired or is faulty, you can now send it back to the supplier and track the credit note, right down to which specific batch it came from.

### 7. Real profit tracking (Pro — Cost & Profit)

Previously, profit was estimated assuming everything cost today's price. Now, if you're tracking batches, the system knows exactly what each batch cost when you bought it, so your profit numbers are based on real purchase prices, not guesses.

### 8. Grocery & Pharmacy features (Pro — new "Retail" add-on)

A new add-on for two kinds of shops in one:

**Grocery mode:**
- Handles the three kinds of barcodes a cashier sees at the till: normal barcodes, hand-typed codes for loose produce (like a banana with no label), and scale-printed barcodes (where the weight or price is baked into the barcode itself by the deli scale).

**Pharmacy mode:**
- Tracks prescriptions with a "budget" of refills — a partial handout doesn't burn a full refill.
- Every refused sale explains *why* ("prescription expired," "no refills left," etc.)
- A tamper-evident **controlled substance register** — every entry is permanently linked to the one before it, like a chain. If anyone tries to secretly edit or delete a past entry, the system will detect it and say exactly which entry was tampered with.

Both modes are **off by default** — turning on Retail doesn't change anything until you explicitly enable grocery or pharmacy mode in Settings → Retail.

### 9. Wholesale / B2B selling (Pro — new "Wholesale" add-on)

For shops that also sell in bulk to other businesses:
- Customers belong to a pricing **group** (so "what does this customer pay?" always has one clear answer).
- Special negotiated prices for specific customers always win over general group discounts.
- Orders can ship in whole cases only (e.g., you can't sell two-thirds of a case).
- Customers can be given **store credit / terms** (pay later, up to a limit). A credit limit of zero correctly means "no credit account," not "unlimited credit."
- You can send **quotes** with prices that are locked in at the moment they're sent, so the price can't quietly change before the customer accepts.

## How you'll use this, day to day

1. **Selling a normal product?** Nothing changes for you.
2. **Selling something by weight/volume/length?** Go to the product's edit page → "Sold by" section → choose weight/volume/length, pick a unit, save. From then on, that product can be sold in fractional amounts (e.g., 0.75 kg) at checkout or POS.
3. **Want expiry tracking?** Turn on the "Track this product in batches" toggle on that product, then receive stock through Suppliers as normal — batch info is captured when stock comes in.
4. **Doing a stock count?** Use the new Stocktake feature under Inventory.
5. **Running a pharmacy or grocery store?** Go to Settings → Retail and turn on the mode you need.
6. **Selling wholesale?** Set up customer groups and pricing under the new Wholesale menu.

## What to double-check before relying on this

The developers verified this with automated tests (296 checks), but **nobody has clicked through the actual screens yet** — it's only been checked "on paper." Before trusting this in a live store, someone should manually click through:
- Selling a weighed product at the POS till
- Adding a batch-tracked product and receiving stock for it
- The new Retail and Wholesale admin screens

Also note: the **POS desktop app** (the separate offline till application) has **not** been updated yet — it still only understands whole numbers, so a weighed sale through that specific app would still be wrong. This was a deliberate, known gap for now.

---

# Part 2 — For Developers Working On This

## Big picture

Two PRs, split by dependency:

- **storeengine#1122** (this repo, free core) — widens quantity columns to decimal and adds the `Quantity` utility class + UI. Base branch: `feature/donation-fundraising`, not `master`.
- **storeengine-pro#90** (storeengine-pro repo) — everything vertical-specific: batches/FEFO, stocktake, serials, supplier returns, cost valuation, and two new addons (`retail`, `wholesale`). **Depends on #1122** for `Quantity` and the decimal-column migration helper — merge core first.

Both were built with 296 PHP assertions across 14 end-to-end suites (green), including a check that every test run is grep'd for implicit float→int conversion deprecation warnings (that's literally how the `add_product` bug below was found).

**Known gap:** no visual/browser verification was done on either PR (dev-site browser tooling requires per-action approval). Contract-verified only. Two runtime-only UI bugs were caught by manually checking component contracts (see "UI bugs" below) — do a real click-through before considering this done.

## PR #1122 — Core: decimal quantities + Unit of Measure

### Schema changes

`product_qty`, variation stock, reserved stock, the stock-movement ledger, and low-stock thresholds all move from `INT` to **`DECIMAL(12,3)`**.

Since `dbDelta` cannot reliably do in-place column type changes, the migration is a hand-written pass in `includes/database.php` that:
1. Probes `information_schema.COLUMNS` to check the current column type.
2. Issues an explicit `MODIFY COLUMN` only if needed (idempotent / no-op if already applied).

Widening INT → DECIMAL is loss-free, no data migration logic needed beyond the type change.

### `StoreEngine\Utils\Quantity` (`includes/utils/quantity.php`, new, 298 lines)

Central place for all quantity handling:
- Sell-by modes: `each` / `weight` / `volume` / `length`
- Per-product unit + step (smallest incrementable amount)
- `parse()` — normalizes input; for `each`-mode products it **truncates toward zero**, preserving old whole-number behavior automatically (no migration needed for existing "each" products)
- Formatting for display
- Purchase-unit ↔ stock-unit pack conversion (carton → strips → tablets)

### Product editor

New **"Sold by"** block in the Stock section (`dev_storeengine/containers/BackendDashboard/Pages/Products/AddProduct/Options/Inventory.js`). The unit dropdown list is served from PHP as `StoreEngineGlobal.quantity_units` so JS never hardcodes units — they come from `Quantity`'s own filterable definitions. `Counter` component (`dev_storeengine/components/Formik/Counter/index.js`) gained a `step` prop so a weighed product's +/- nudges by its own increment and snaps to that precision instead of accumulating float error.

### Inventory → Batches admin page

`dev_storeengine/containers/BackendDashboard/Pages/Inventory/BatchesPage.js` (new) — the UI shell for the batch data that Pro's `inventory-pro` addon provides. Plus a per-product "track in batches" toggle, shown only when Pro's inventory-pro is active.

### Bugs fixed along the way (all silent failures — none broke a build)

| Bug | Where | Fix |
|---|---|---|
| `$wpdb` `%d` format specifiers truncate floats on write | variation data-format map, stock adjustments, reservations, order-lookup writers | Changed to `%f` |
| `Order::add_product(int $quantity)` and `CartItem::$quantity` typed `?int` | order/cart-item classes | Widened to accept float; a 0.75 kg POS sale was recording **zero** quantity and deducting no stock — PHP 8.1 only surfaces this as a deprecation notice, so it failed silently |
| `Cart::get_count(): int` returned 0 for a fractional line | `includes/classes/cart.php` | Fixed — a fractional line now counts as 1 item in the cart badge |
| Low-stock digest cast `meta_value AS SIGNED` | low-stock schedule/report | Floored 0.5 kg to 0, dropping the product from the report entirely — fixed |
| Product editor discards any meta key not on an explicit whitelist | `includes/api/product.php` | The new UoM meta fields were silently dropped on save from the actual editor (REST tests didn't catch it because REST bypasses the form). Added the 5 UoM keys to the whitelist, and added filter `storeengine.product.editor.meta_keys` so addons (Pro) can register their own keys |

### Key files touched

`includes/database.php`, `includes/utils/quantity.php` (new), `includes/classes/{cart,cart-item,price,stock-manager,variation,abstract-product}.php`, `includes/classes/order/*`, `includes/api/{cart,product,orders}.php`, `includes/database/create-*-table.php`.

## PR #90 — Pro: retail verticals

### Inventory: batches / lot tracking with FEFO (`addons/inventory-pro/`)

New tables: `storeengine_stock_batches` (lot, expiry, cost, supplier) and `storeengine_order_item_batches` (which lots a sold line drew from — answers "who bought batch X?"). Stock movements gained a `batch_id`.

- Allocation is **FEFO** (First-Expiry-First-Out), not FIFO — dated lots are consumed before undated ones; expired/recalled lots are never allocated.
- Allocation query uses `SELECT ... FOR UPDATE` to prevent two tills selling the last unit of a lot concurrently.
- Cancelling an order returns quantity to the **exact lots it took** (traceable recalls).
- Opt-in per product — with the flag off, every method in `Batches` is a no-op, so untracked products behave exactly as before.
- Short stock reports a **shortfall** rather than throwing — caller has already decremented the aggregate, so raising would leave books inconsistent.
- Daily sweep (`classes/batch-scheduler.php`) flips past-date lots to `expired` and emails a digest. Quantity is **not** zeroed on expiry — the stock physically exists until someone writes it off.

### Stocktake (`addons/inventory-pro/classes/stocktake.php`)

Snapshots expected quantity at count-open, posts by **variance** (not overwrite) so sales during the count aren't reported as shrinkage. Test case: expect 40, count 37, sell 2 mid-count → posts to 35, not 37. Uncounted lines are skipped, not zeroed.

### Serials (`addons/inventory-pro/classes/serials.php`)

One row per physical unit; on-hand count = count of `in_stock` rows (can't drift from reality). Warranty starts at sale, not goods-in. Returned units become `returned` (not `in_stock`) but keep original warranty dates. Duplicate serials are rejected and reported as a likely mis-scan.

### Suppliers: returns / debit notes (`addons/suppliers/classes/supplier-returns.php`)

Draws from specific lots. Stock leaves inventory on **send**, not on draft save. Over-claiming a lot's quantity is clamped, not rejected outright (usual cause: a sale happened between drafting and sending).

### Cost & Profit: real valuation (`addons/cost-profit/valuation.php`)

Once batches carry purchase cost, stock value = sum of lots on hand; a sale's cost = sum of what the specific (FEFO-selected) lots consumed actually cost. Lots with no recorded cost are reported separately as "uncosted units," not valued at zero (which would overstate margin).

### New addon: `retail` (`addons/retail/`)

One addon, additive mode toggle (`none` by default — enabling the addon changes nothing until a mode is picked).

**Grocery** (`classes/barcode-rules.php`) — three barcode types at the till: plain barcode, hand-typed PLU, and scale-printed barcode (weight/price baked in). Scale-printed is tried **first** since it's a valid numeric code that would otherwise false-match nothing and fall through to "not found."

**Pharmacy** (`classes/prescriptions.php`, `classes/controlled-register.php`) — prescription = authorization with a refill budget; partial fills don't burn a full refill. Refusal reasons are specific (expired vs. no refills, etc).

The **controlled-substance register** is append-only and **hash-chained** — each row's digest includes the previous row's digest, so any edit/delete breaks every subsequent digest. `verify()` walks the chain and reports the exact row where it breaks. Corrections are new entries, never edits.

### New addon: `wholesale` (`addons/wholesale/`)

Customers belong to exactly **one** group (no ambiguity on "what price applies"). Price resolution order: **explicit per-product tier → group blanket discount → list price** — a negotiated tier always beats a larger blanket discount. Case quantities round **up**. Ledger (`classes/ledger.php`) is the account: running balance stored per row. **Zero credit limit = no account**, not unlimited (deliberate choice — the alternative fails expensive). Quotes freeze unit prices at issue time.

### Admin screens

Both addons shipped backend/API-only at first, then got admin UI (`dev_storeengine-pro/containers/SettingsTabs/Retail/`, plus wholesale/retail pages under the core SPA's `storeengine.admin.pages` filter). Menus are two top-level entries (Retail, Wholesale) with child screens, same shape as Inventory's menu — not six flat top-level items. Retail's settings live under Settings → Retail (moved there from being its own top-level page; old paths redirect).

Lists use `ProductPicker` / `CustomersSelect` (existing admin pickers) instead of raw numeric IDs. Every list is a `ListTable` with a stable `screenId` for per-user Screen Options (column show/hide).

### UI bugs found by contract-checking (not caught by build)

- `Button` was passed `variant`/`disabled` props; the actual component takes `preset`/`isDisabled` — unknown props spread onto the DOM node, buttons rendered unstyled.
- `<label>` wrapping a `<button role="switch">` — Switch renders a `<button>`, which isn't a labelable element, so the caption looked clickable but did nothing.
- Modals rendered unstyled: admin Tailwind is scoped to `.se-admin-tw`, but `react-modal` portals to `document.body`, escaping the scope. Fix: re-open the scope inside the modal body (existing pattern other dialogs already used). A source-level guard (`scratchpad/modal-scope.test.mjs`) now asserts any Tailwind-using `ReactModal` re-opens the scope.
- `ListTable`'s `data?.map(...)` — optional chaining doesn't short-circuit on `false` (only null/undefined). Passing `data={loading ? false : items}` crashed on refetch when `data` dropped back to `false` while the internal copy still held the old array. Fixed by passing the array straight through and letting `dataFetchingStatus` drive the loading state.

### Copy pass

A later commit (`1a39865`) rewrote admin copy to replace internal/implementation jargon ("blanket discount," "break point," "append-only") with trade language customers actually use ("discount on everything," "prices by quantity"). Scoped to Retail/Wholesale only — Batches and product-editor panels weren't touched.

### Demo data

`addons/seeder/providers/{batch,retail,wholesale}-provider.php` — three opt-in seed providers (gated per-addon) so the new screens aren't evaluated empty. Seeding also surfaced two real bugs: refill counting treated the original fill as a refill (fixed — only cycles beyond the first count), and back-dated prescriptions were created `active` with nothing to sweep them to `expired` (provider now runs the same sweep as the nightly job).

### Explicitly deferred / not covered

- **POS desktop app** (separate offline app) — its SQLite schema, sync, and cart logic are still integer-only. A weighed line sold through that specific app will still truncate. Deliberate, known gap.
- No browser/visual verification on either PR.

## If you're picking this work up

1. Merge order matters: **storeengine#1122 before storeengine-pro#90**.
2. Read `includes/utils/quantity.php` first — nearly everything downstream depends on `Quantity::parse()` behaving correctly for the product's `sell_by` mode.
3. If you add a new admin field that writes product meta, remember it must be registered via the `storeengine.product.editor.meta_keys` filter or the editor will silently drop it on save — this exact bug shipped twice in this PR series before the filter existed.
4. Grep test runs for float→int deprecation warnings when touching quantity code — that's the technique that caught the worst bug here (`add_product` recording zero-quantity sales).
