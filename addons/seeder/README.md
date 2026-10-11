# Seeder addon

Dummy-data generator for quick local testing, packaged as a **toggleable addon**
so it loads zero code when disabled (the intended state on production). Spins up
coherent sample data and removes it again with one command.

Both halves share the **same `seeder` slug**, so a single toggle controls them:

- **Free half** (`seeder`, this folder) — the framework + CLI + admin page +
  core/free-addon providers.
- **Pro half** (`seeder`, in storeengine-pro/addons/seeder) — adds the Pro data
  sets (licenses, cost/profit, staff) by hanging providers off the same filter.

Because the slug is identical, activating `seeder` enables both the free and
Pro halves at once; deactivating it disables both. Disable it and nothing runs —
no CLI command, no admin page, no providers.

**Enabling it:** a "Dummy Data Seeder" card shows in **StoreEngine → Add-ons**
(registered on the `storeengine/admin/extra_addons` filter from the addon's
constructor, so the card appears even while the addon is off). Toggle it on
there. You can also flip it from code:
`\StoreEngine\Addons::activate('seeder')` / `deactivate('seeder')`.

## What each provider creates (only if its target addon is active)

| Provider key | Data | Where |
| --- | --- | --- |
| `customers` | customers (login: `password`) | free `seeder` |
| `products` | simple products + one-time prices | free `seeder` |
| `coupons` | percentage / fixed coupons | free `seeder` |
| `orders` | orders across statuses, backdated | free `seeder` |
| `subscriptions` | recurring products + subscriptions | free `seeder` (needs `subscription`) |
| `inventory_stock` | managed stock + opening movements | free `seeder` (needs `inventory`) |
| `licenses` | license keys (active/expired/revoked) | Pro `seeder` (needs `license-management`) |
| `cost_profit` | product cost + completed orders w/ COGS | Pro `seeder` (needs `cost-profit`) |
| `staff` | staff users with random permission sets | Pro `seeder` (needs `role-permission`) |

## Usage

Both entry points delegate to the same `Manager`.

### CLI

```bash
wp storeengine seed list                       # show registered providers
wp storeengine seed run                        # seed everything (default counts)
wp storeengine seed run --count=20             # 20 of each
wp storeengine seed run --customers=50 --orders=200   # per-provider counts
wp storeengine seed run --only=products,orders        # subset (deps pulled in)
wp storeengine seed reset                       # delete everything seeded so far
wp storeengine seed reset --force               # ...without the prompt
```

### Admin UI (click button)

**StoreEngine → Tools → Dummy Data** (`admin.php?page=storeengine-tools&path=dummy-data`,
requires `manage_options`; the tab appears once the addon is active). Reach it
from the **settings link on the Add-ons card**, or from the one-click **Insert
dummy data** admin notice (which enables the addon and lands you here). Tick the
data sets, optionally set per-set counts, click **Seed data**; **Reset seeded
data** removes everything. On a production environment the Seed action is blocked
unless you tick the override. The tab talks to the `Manager` over AJAX
(`storeengine/seeder_data|seeder_run|seeder_reset`) — the same engine as the CLI.

Seeded customers get the password **`password`**. Everything created is tracked
in the `storeengine_seeder_manifest` option, so `reset` removes exactly what was
created (reverse dependency order, line items included) and nothing else.

---

## Guideline: adding a new data set

> **When you add a feature with a new data type, add a seeder provider for it.**
> Put it in the seeder addon that owns its tier — free providers in this addon
> (`storeengine/addons/seeder`), Pro providers in the Pro half
> (`storeengine-pro/addons/seeder`) — and gate registration on the target addon
> being active. This keeps the seeder a one-command "fill the store" button as
> StoreEngine grows, while a feature being disabled means its provider never
> loads.

### 1. Write the provider

Extend `StoreEngine\Addons\Seeder\Classes\AbstractSeederProvider` (Pro providers
extend the same class — Pro depends on free):

```php
namespace StoreEngine\Addons\Seeder\Providers;

use StoreEngine\Addons\Seeder\Classes\AbstractSeederProvider;
use StoreEngine\Addons\Seeder\Classes\SeederContext;
use StoreEngine\Addons\Seeder\Classes\SeederData;

class MyThingProvider extends AbstractSeederProvider {
    public function get_key(): string { return 'my_things'; }
    public function get_label(): string { return 'My Things'; }
    public function get_default_count(): int { return 10; }
    public function get_dependencies(): array { return [ 'customers' ]; }

    public function seed( SeederContext $context, int $count ): void {
        $customer_ids = $context->ids( 'customers', 'customer' ); // read upstream
        for ( $i = 0; $i < $count; $i++ ) {
            $thing = new MyThing();
            $thing->save();
            $context->record( 'my_thing', $thing->get_id() ); // record for cleanup
        }
    }
}
```

### 2. Register it (gated on the target addon)

In the free seeder addon's `register_providers()`, or the Pro seeder addon's
`register_providers()` (both addons share the `seeder` slug):

```php
if ( Helper::get_addon_active_status( 'my-feature' ) ) {
    $providers[] = new Providers\MyThingProvider();
}
```

### 3. Teach the deleter about new object types

The `Manager` deletes the built-ins (`customer`, `product`, `price`, `coupon`,
`order`, `subscription`, `refund`) itself. For a new type, handle it in the
addon's `delete_object()`:

```php
public function delete_object( $handled, $type, $id ) {
    if ( 'my_thing' === $type ) { ( new MyThing( $id ) )->delete(); return true; }
    return $handled;
}
```

If you only record built-in types you can skip step 3.

### Rules of a good provider

1. **Record every persisted object** with `$context->record()` — unrecorded
   objects are what `reset` leaves orphaned.
2. **Read dependencies from the context**, don't query; declare them in
   `get_dependencies()`.
3. **Never fatal on one bad record** — skip and continue.
4. **Be self-contained** — if you need a special prerequisite (the subscription
   provider needs a recurring-price product), create and record it yourself.
5. **Gate registration on the target addon being active**, so a disabled
   feature never contributes a provider.
