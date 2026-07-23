# School Management System (Multi-Tenant SaaS)

Laravel 11 API backend for a multi-tenant School Management SaaS. Each school is a
tenant identified by subdomain (e.g. `acme.localhost`) with its own PostgreSQL
database, provisioned automatically by `stancl/tenancy`.

## Cursor Cloud specific instructions

### Services (must be running to develop/test)
- **PostgreSQL 16** and **Redis** are required. Start them with:
  `sudo service postgresql start` and `sudo service redis-server start`.
  They are NOT started automatically — start them at the beginning of a session.
- DB credentials (see `.env`): role `laravel` / password `secret`, central DB
  `school_central`. The `laravel` role has `CREATEDB` so tenancy can create
  per-tenant databases (named `tenant<id>`, e.g. `tenantacme`).
- Redis backs cache, queue, and session (`php artisan about --only=drivers` to confirm).

### Running the app (dev)
- API/web server: `php artisan serve --host=127.0.0.1 --port=8000`.
- Queues: `php artisan horizon` (dashboard at `/horizon`). Use Horizon, not
  `queue:work`, since the queue driver is Redis.
- Full dev stack (server + queue + logs + vite) is also wired via `composer run dev`.
- Frontend assets: `npm run dev` (Vite). Not required for API-only work.

### Multi-tenancy gotchas (non-obvious)
- **Subdomain identification matches the subdomain LABEL only.** Store the tenant
  domain as the label (e.g. `acme`), NOT the full host (`acme.localhost`). Storing
  the full host causes `TenantCouldNotBeIdentifiedOnDomainException`.
- Tenant routes in `routes/tenant.php` are registered without a domain constraint,
  so do NOT declare a central `/` web route there — it would shadow the central
  landing page in `routes/web.php`. Put tenant endpoints under `/api/*`.
- Central migrations live in `database/migrations/`; **tenant** migrations live in
  `database/migrations/tenant/` and run per-tenant. Run them with
  `php artisan tenants:migrate` (creating a tenant auto-migrates its DB via the
  `TenantCreated` job pipeline in `App\Providers\TenancyServiceProvider`).
- To run code in a tenant's context from tinker: `Tenant::find($id)->run(fn() => ...)`.
- Central registry tables (`tenants`, `super_admins`, `subscription_plans`,
  `tenant_subscriptions`, `invoices`) use `uuid` primary keys, so `domains.tenant_id`
  is also `uuid` (Postgres requires matching FK types). The `tenants` table is still
  managed by stancl's virtual-column model: business columns are declared in
  `App\Models\Tenant::getCustomColumns()` and a nullable `data` json column remains
  for overflow. Create tenants via `TenantService` (it generates the uuid id and the
  `database` name matching stancl's `tenancy_db_name`).
- `*.localhost` may not resolve automatically; for local curl use
  `--resolve acme.localhost:8000:127.0.0.1`.

### Models (central vs tenant)
- Tenant models extend `App\Models\TenantModel` (uuid PK via `HasUuids` + automatic
  `school_id` scoping/stamping via the `BelongsToSchool` trait). They use the default
  connection, which stancl swaps to the tenant DB in tenant context.
- Central models (`SuperAdmin`, `SubscriptionPlan`, `TenantSubscription`, `Invoice`)
  use stancl's `CentralConnection` trait so they always hit the central DB even during
  tenant context. `Tenant` extends stancl's base model.
- Auth: platform super admins authenticate via the `SuperAdmin` model (central,
  `super_admins` table) — `AuthService`/`/api/v1/auth/*`. Per-school users are the
  tenant `User` model. Both issue Sanctum tokens.
- Because authenticatables use uuid keys, `personal_access_tokens` uses `uuidMorphs`
  (not `morphs`). The `parent_student` pivot's uuid `id` has a DB default
  (`gen_random_uuid()`) and its `school_id` is set via `withPivotValue`, so
  `belongsToMany::attach()` works.

### Lint / test / build
- Lint: `./vendor/bin/pint` (auto-fix) or `./vendor/bin/pint --test` (check only).
- Tests: `php artisan test`. Test env (see `phpunit.xml`) uses array cache/session
  and sync queue; DB uses the `.env` pgsql connection, so PostgreSQL must be running.
- Auth is Sanctum (subdomain cookies + bearer tokens). Central API is under
  `/api/v1/*`; login at `POST /api/v1/auth/login`.

### Composer note
Composer 2.10+ blocks packages flagged by security advisories. This dev
environment sets `policy.advisories.block=false` globally so Laravel 11 installs.
