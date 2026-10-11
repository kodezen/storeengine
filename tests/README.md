# StoreEngine — Test Suite

Tests live in their own composer scope (`tests/composer.json`) so the
production zip build doesn't have to strip dev dependencies. To package a
release, simply exclude this entire `tests/` directory.

## Quick start — unit tests (sub-second, no Docker)

```bash
cd wp-content/plugins/storeengine/tests
composer install
composer test
```

Expected output: `OK (N tests)`.

## Quick start — integration tests (Docker required)

Integration tests run inside a wp-env Docker container with a real
WordPress install. **Requirements**: Docker Desktop running, Node 18+.

```bash
# One-time setup (from the project root, where package.json lives):
cd wp-content/plugins/storeengine
npm install                    # picks up @wordpress/env from devDependencies
npm run wp-env:start           # boots WordPress + MySQL containers

# Install test deps for both plugins (one-time per plugin):
( cd tests && composer install )
( cd ../storeengine-pro/tests && composer install )

# Run integration tests:
npm run test:integration       # free plugin's Integration/
npm run test:integration:pro   # pro plugin's Integration/

# Shut everything down when done:
npm run wp-env:stop
```

The integration suite runs **inside** the Docker container — phpunit on
the host can't reach WordPress directly. The npm scripts do the
`wp-env run tests-cli …` plumbing for you.

If `wp-env:start` errors, check that Docker Desktop is actually running
and that ports 8888 (WordPress) and 8889 (tests) are free.

## What's covered (unit, pure PHP, no WP)

All tests in `Unit/` run without a WordPress environment — they exercise
static methods, value transformations, and constants. They're fast (sub-
second), deterministic, and run with zero infrastructure beyond PHP +
phpunit. CI can run them on every push.

Current coverage focuses on the **highest-blast-radius** logic in the
plugin — code paths that, if they regress, would silently corrupt every
customer's data on the next upgrade or send malformed emails to every
inbox.

| File | Pins down |
|---|---|
| `Unit/Email/SettingsMigrationTest.php` | `Settings::migrate_threading_safe_subjects()` — the one-shot subject upgrade that runs on every site at install/update. Three tests: upgrades exact-match old defaults, preserves customizations, idempotent. |
| `Unit/Email/SubjectThreadingTokensTest.php` | Every per-order email's default subject contains `{order_id}`. Without this token, Gmail/Outlook collapse all order notifications into one thread in the admin's inbox. Parameterized across all five built-in defaults and four newer email classes. |
| `Unit/Email/EmailDefaultsContractTest.php` | The `register_defaults` filter pattern: adds the key when missing, preserves existing data when present, returns a complete shape. Parameterized across five newer email classes. |

## What's NOT covered (intentional)

Things that need a real WordPress environment — DB, hooks firing,
`$wpdb`, `WP_REST_Server`, user creation — are **not** in this suite.
They belong in a future `integration` test suite running under
[`@wordpress/env`](https://www.npmjs.com/package/@wordpress/env) or the
`wp-phpunit` harness. Examples that should land there:

- `License::get_status()` view/edit context behavior
- `ExpirationHandler::sweep()` flipping overdue rows + dedup of the
  expiring-soon reminder via `wp_options`
- `StorefrontAuth` REST endpoints (`auth/register`, `auth/forgot-password`,
  `auth/reset-password`) — happy path + each error branch
- `ForgotPassword::set_password()` handler — full nonce + key validation
  pipeline
- `Register::register()` handler — full lifecycle including
  `customer_created` action firing
- Subscription / installment `payment_failed` action triggers the
  appropriate email class

Don't pile WP function stubs into `bootstrap.php` to fake these — every
shim added there silently broadens what unit tests pretend to verify.
Spin up the integration suite when those flows need coverage; it's a
larger setup but it's the right tool.

## Adding a new unit test

```bash
tests/Unit/<area>/<Subject>Test.php
```

Class name = filename, namespace = `StoreEngine\Tests\Unit\<area>`.
Extend `PHPUnit\Framework\TestCase`. The bootstrap registers the plugin's
namespace autoloader, so a test can just `use \StoreEngine\Foo\Bar` and
PHP resolves the file. WordPress functions are stubbed minimally in
`bootstrap.php` — call them and they return passthrough values.

## Build / release flow

The plugin's main `composer.json` has no test dependencies. To package:

```bash
cd wp-content/plugins/storeengine
composer install --no-dev --optimize-autoloader --classmap-authoritative
zip -r storeengine.zip . -x "tests/*" "node_modules/*" "dev_storeengine/*" ".git/*"
```

No "install dev → test → reinstall prod" dance. The test scope is
permanently separated.
