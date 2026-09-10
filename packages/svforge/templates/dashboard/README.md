# SvelteForge Dashboard Template

Base template + admin dashboard with Better Auth, Drizzle ORM, and user management.

## What You Get (in addition to Base)

### Auth System
- **Better Auth** with email/password — **sign-up CLOSED by default** (`SIGNUP_MODE`, #318)
- **Sign-up modes** (server-enforced, `.env`): `closed` (default — admins create users from `/admin/users`), `invite-only` (pre-approved emails invited from `/admin/users`), `self-service` (public registration; admins can never result from it)
- **Session management** via `hooks.server.ts`
- **First-admin bootstrap**: `<pm> run admin:create -- --name … --email … --password …` — atomic (advisory lock + no-admin verification); `/setup` is a dev-only convenience sharing the same code path
- **Login page** at `/login`
- **Auth guard** on `(app)/` route group with callbackURL redirect
- **Pattern**: explicit persisted `role` column (`admin` | `user`, see `$lib/server/admin.ts`) — granted ONLY by the bootstrap, never by sign-up or row ordering

### Validation
- **Zod schemas** — type-safe validation on all server actions (login, settings, users CRUD, setup)
- Schemas at `src/lib/server/schemas.ts`

### Database
- **Drizzle ORM** with **PostgreSQL** (`drizzle-orm/pg-core` + `postgres` driver)
- **Schema**: user, session, account, verification tables (Better Auth) + app tables
- **Auth schema** at `src/lib/server/db/auth.schema.ts`
- **Conventions**: uuid ids (`defaultRandom()`), `timestamp withTimezone` + `defaultNow()`, `jsonb` for structured data, explicit FK/cascade, composite PKs on join tables

### Database lifecycle (#332)

The generated `src/lib/server/db/index.ts` exports `createDb(url, options)` as
well as the backwards-compatible `db` singleton. Reuse one pool for a
long-lived Node process. In a serverless handler, create a client with
`maxConnections: 1` and always `await close()` in `finally`; do not rely on a
module-level pool surviving between invocations.

### Admin Dashboard — golden references (#267)

The admin screens are **canonical examples agents should imitate** when
building new UI in this dashboard or in SvelteForge projects:

- `/admin/users` — CRUD data table (SvelteForge `Table` primitive with the
  `children` cell slot), search filter, create/edit modal, delete
  confirmation, `Feedback`, empty state.
- `/admin` — stats cards + recent list with `Badge` status.
- `/admin/settings` — form with client-side validation + `Feedback`.
- `AdminLayout` — responsive sidebar/drawer, `aria-expanded`/`aria-current`,
  labelled navigation.

All user-visible copy is i18n via Paraglide (`m.key()` from
`$lib/paraglide/messages.js`), keys in every catalog under `messages/`
(scaffolded with `fr.json` + `en.json` — keep strict parity across every
locale configured in `project.inlang/settings.json`; see `tests/paraglide.test.ts`).

- **Dashboard** at `/admin` — stats (total users, active sessions, new this week)
- **User management** at `/admin/users` — CRUD, email verification toggle, search
- **Settings** at `/admin/settings` — change password
- **AdminLayout** — responsive sidebar nav, collapsible, mobile drawer

### Routes Structure
- `/` — redirects to `/login` or `/admin` based on session
- `/login` — public
- `/setup` — dev-only, atomic first-admin bootstrap (production uses `<pm> run admin:create`)
- `/(app)/admin` — protected, requires session
- `/(app)/admin/users` — protected, requires admin (also creates invitations for `invite-only`)
- `/(app)/admin/settings` — protected

### Pre-configured Files
- `drizzle.config.ts` — ready for `drizzle-kit push` (npm run db:push)
- `.env.example` — copy to `.env` and fill in
- `scripts/setup.sh` — run after install (generates secret, inits DB)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (local, Docker or managed — see `.env.example` for ready-to-use examples)
- `ORIGIN` — app URL (e.g. `http://localhost:5173`)
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`
- `SIGNUP_MODE` — public sign-up policy: `closed` (default) | `invite-only` | `self-service`. Unknown values fail closed to `closed`. Change requires a restart.
- `TEST_DATABASE_URL` — **dedicated test database** for the integration suites. The database name must contain a `test` segment (`myapp_test`); anything else is REFUSED before a single row is read, and the suites never touch `DATABASE_URL` (#312).

## Running Tests Safely (#312)

The shipped integration suites (auth lifecycle, first-admin bootstrap, jobs) mutate real data — so they only ever run against the database pointed to by `TEST_DATABASE_URL`:

```sh
# 1. Create a dedicated test database (NOT your development database)
createdb myapp_test
# or: docker run --name sf-test-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=myapp_test -p 5433:5432 -d postgres:17

# 2. Point TEST_DATABASE_URL at it (see .env.example)
export TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/myapp_test"

# 3. Push the schema there, then run the suites
DATABASE_URL="$TEST_DATABASE_URL" bunx drizzle-kit push --force
bun run test
```

Guarantees:

- the application database (`.env` `DATABASE_URL`) is never read, written or deleted by the suites;
- every identity a suite creates is namespaced with a per-run `@sf-test.example` marker and ONLY those rows are ever deleted;
- parallel test runs don't collide (per-run identifiers), and no test data survives a completed run.

## Next Steps

- **Start PostgreSQL** (local / Docker / managed — see `.env.example`)
- **Run migrations**: `<pm> run db:push` (drizzle-kit push)
- **Create first admin** (atomic — refuses if an admin already exists):
  `<pm> run admin:create -- --name "Admin" --email admin@example.com --password '…'`
- **Open sign-up (optional)**: set `SIGNUP_MODE=invite-only` (pre-approve emails from `/admin/users`) or `SIGNUP_MODE=self-service` — self-registered users are ALWAYS `role = user`, the admin role can only be granted by the bootstrap
- **Add a protected route**: Create file in `src/routes/(app)/your-route/+page.svelte`
- **Modify authorization**: roles live on the `user.role` column, checked in `src/lib/server/admin.ts`
- **Delete order**: Always `session` → `account` → `user` (FK constraints)
