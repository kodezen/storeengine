# Cross-platform release build

One command produces a shippable StoreEngine zip on **Linux, macOS, and Windows** —
no bash / `zip` / `rsync` / `wp dist-archive` required. (The old `build.sh` still
works on Unix, but this is the portable path.)

```bash
npm run dist          # full release: JS build → composer (no-dev + Strauss) → POT → zip
npm run dist:zip      # only repackage the current tree into the release zip
npm run dist:dev      # keep dev dependencies (debug build)

# single steps / skips:
node build-tools/build.mjs --only=js|composer|pot|zip
node build-tools/build.mjs --skip-composer
node build-tools/build.mjs --no-download   # fail instead of fetching wp-cli/strauss phars
```

## What each step does

| # | Step | How |
|---|------|-----|
| 1 | Production JS | `wp-scripts build` (install auto-skips when `node_modules` exists) |
| 2 | Composer + Strauss | delegates to `composer run build` → `install --no-dev` + Strauss namespace prefixing via `post-install-cmd` (`@prefix-namespaces`) |
| 3 | POT | delegates to `npm run wp:pot` (`bin/make-pot.mjs`) → `i18n/languages/storeengine.pot` |
| 4 | Zip | built in Node from `.distignore` — **never drops `vendor/autoload.php`** and needs no system `zip` |

The zip lands in the parent `plugins/` folder as `storeengine.<version>.zip`
(`outputDir: ".."` in [`build.config.json`](../build.config.json)).

## Notes

- All four steps are cross-platform.
- Step 2 delegates to the existing `composer run build`. Strauss is wired through
  its `post-install-cmd` hook, so we don't run it separately (`steps.strauss: false`).
- Step 3 delegates to `bin/make-pot.mjs` instead of a bare `wp i18n make-pot`:
  the multi-megabyte admin bundle (`assets/build/backend.<ver>.js`) trips WP-CLI's
  Peast JS parser, which silently drops **every** string in an unparseable file.
  The wrapper stages the tree, transpiles any such bundle down to ES5 (preserving
  the `__()`/`_x()`/`_n()` calls), then extracts — so admin strings survive and the
  file hashes match what WordPress computes at runtime.
- The zip step needs the `archiver` + `ignore` dev deps (already in `package.json`).

Config lives in [`build.config.json`](../build.config.json).
