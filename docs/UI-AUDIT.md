# Admin UI / color audit

Audit of the React admin (2026-09): static token scan of `dev_storeengine/**`,
`assets/**`, plus a runtime pass (headless Chromium, computed styles on 15 admin
pages at 1440px). Re-run recipe at the bottom.

## Fixed

| Finding | Fix |
|---|---|
| Three different color-token sets (`admin.css`, `_root.scss`, `settings/base.php` defaults): e.g. secondary `#FF5000` vs `#EAE8FA`, border `#DDDEDF` / `#DFE1E5` / `#EBEBEB`, error `#FF4D4D` vs `#E2483D`. Which one showed depended on load order. | `admin.css` and `_root.scss` now carry the same fallbacks, equal to the shipped defaults. Comment in both points at the other. |
| `--storeengine-primary-light` was a fixed `#E5F1FF`, so tints ignored a custom primary color. | Now `color-mix(primary 10%, white)` (same look by default). |
| `var(--storeengine-primary-border-color)` was never defined, so 4 borders silently rendered nothing. | Defined (= border color). |
| Typos: `--storeengine-texts-color`, `--storeengine-subtile-color` (frontend archive). | Fixed. |
| Undefined names with off-palette fallbacks: `--se-border/danger/error/subtitle/success/title/bg`, `--storeengine-primary` (fallback purple `#5b3df6` in settings), `-title-color`, `-error`, `-success`, `-danger-color`, `-success-color`, `-text-secondary-color`, `-text-muted`. | Mapped to the real tokens. |
| WP core `forms.css` beat `.storeengine-input` (0,1,0) so fields were 2px instead of the 4px standard; variants inputs were 8px. | Specificity fix in `admin.css`; variants inputs 4px; table search input 4px. |
| Table title / header links used WP admin blue `#3858e9`, next to `#008DFF` buttons. | Use the primary token. |
| Hard-coded `#008DFF` / `#006bff` in Customers, Coupons, Logs, Pagination, Licence CSS. | Use `--storeengine-primary-color`. |
| Product Form / quick-add styles (new code) used undefined names with purple fallbacks. | Use tokens (`primary`, `primary-light`, `error`, `text`). |
| Notice banner's own action button (`AdminNotices/styles.scss`, e.g. "Manage License", shown on almost every admin page) hard-coded its own 13px/600/9px-16px, a visibly smaller and bolder button than the standard 14px/500/8px-14px used everywhere else — this is what the "two primary button sizes" gap below turned out to be. | Matched to the standard geometry. (`assets/css/admin.css` carried a byte-identical but dead duplicate of the same rule — fixed too, though the SCSS one is what actually ships.) |
| `SaveSplitButton` (the product/order editor's main Save/Update button) hard-coded `#006BFF`, a visibly different blue from the `#008DFF` primary used everywhere else, with no way to pick up a custom primary color. | Uses `var(--storeengine-primary-color)`. |
| "+ Add New Brand" rendered as a bare browser button (black text, bordered box) right under "+ Add New Category" (blue text link) — same markup and class, but the styling was scoped to `.storeengine-widget--category` only, so `.storeengine-widget--brand` never matched it. | Moved the shared rule to the top level; both widgets get it now. |

## Open gaps (tracked)

1. ~~Two primary button sizes.~~ Fixed above — both traced to the notice-banner button and `SaveSplitButton`, not to the `ui/Button` kit itself. Still open: `.storeengine-btn--md`'s own padding (`10px 16px`) is 2px roomier than the kit's `8px 14px`, and the kit's `sm`/`md`/`lg` sizes have no legacy equivalent, so the two systems remain separate rather than one sharing the other's scale.
2. **Neutral tokens don't exist.** ~30 uses of `--storeengine-bg-color`, `-bg-light`, `-gray-50/100/200/600`, `-surface-secondary-color`, `-background-gray-color`, `-section-background`, `-dark-gray-color` (frontend dashboard, no fallback) each with its own grey fallback. Define a small neutral scale in `_root.scss` and replace.
3. **Hard-coded brand-ish colors that ignore the primary color:** `components/Oops` (`#6c63ff` ×26), `Addons` icon palette, `ScreenMeta` (`#2271b1`), `Funnels`, `Members/Analytics` inline styles, setup wizard, POS terminal (`#008DFF` ×8 in `Terminal.js`), block editor styles (`#006bff`).
4. **Raw `<select>` in the product editor has a slate border (`#E2E8F0`)** instead of the border token; source component not identified.
5. **WP `FormTokenField` (Tags input) draws a `#1e1e1e` 2px-radius border** inside the product editor.
6. **Three border-radius values on search inputs** (global search 6px, table search now 4px). Decide one.
7. **`--storeengine-primary-font` is `inherit`** in `_root.scss`/`admin.css`, but admin notice CSS writes `var(--storeengine-primary-font) sans-serif` (invalid with `inherit`, silently ignored).
8. **Compiled frontend CSS** (`assets/scss/*.css`) must be rebuilt for the frontend typo fix to ship.
9. **Secondary color meaning.** `docs/storeengine-ui-rules.md` calls `se-secondary` a "soft blue", but the shipped default (`global_secondary_color`) is orange `#FF5000`, while the old `_root.scss` fallback was lavender `#EAE8FA`. Decide the intent, then fix the default or the doc.
10. Dashboard page (`page=storeengine-dashboard`) gave no primary color in the runtime audit; slug/route not verified.

## Re-run recipe

- Static: collect every `--name:` definition and every `var(--name…)` use; list uses with no definition (`--storeengine*`, `--se*`).
- Runtime: Playwright with a minted admin cookie; for each page walk `#wpbody-content *`, read computed `color/background/border` and flag saturated colors whose hue is not the primary's; also group inputs by `border-radius`/border color and buttons (primary background) by height/radius/font.
