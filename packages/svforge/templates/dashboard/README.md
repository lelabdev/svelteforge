# SvelteForge Dashboard Template

Base template + admin dashboard with Better Auth, Drizzle ORM, and user management.

## What You Get (in addition to Base)

### Auth System
- **Better Auth** with email/password
- **Session management** via `hooks.server.ts`
- **Setup page** at `/setup` (dev-only, creates first admin)
- **Login page** at `/login`
- **Auth guard** on `(app)/` route group with callbackURL redirect
- **Pattern**: First registered user is admin (see `$lib/server/admin.ts`)

### Validation
- **Zod schemas** — type-safe validation on all server actions (login, settings, users CRUD, setup)
- Schemas at `src/lib/server/schemas.ts`

### Database
- **Drizzle ORM** with **PostgreSQL** (`drizzle-orm/pg-core` + `postgres` driver)
- **Schema**: user, session, account, verification tables (Better Auth) + app tables
- **Auth schema** at `src/lib/server/db/auth.schema.ts`
- **Conventions**: uuid ids (`defaultRandom()`), `timestamp withTimezone` + `defaultNow()`, `jsonb` for structured data, explicit FK/cascade, composite PKs on join tables

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
`$lib/paraglide/messages.js`), keys in `messages/fr.json` + `messages/en.json`
(strict parity — see `tests/paraglide-keys.test.ts`).

- **Dashboard** at `/admin` — stats (total users, active sessions, new this week)
- **User management** at `/admin/users` — CRUD, email verification toggle, search
- **Settings** at `/admin/settings` — change password
- **AdminLayout** — responsive sidebar nav, collapsible, mobile drawer

### Routes Structure
- `/` — redirects to `/login` or `/admin` based on session
- `/login` — public
- `/setup` — dev-only, first admin creation
- `/(app)/admin` — protected, requires session
- `/(app)/admin/users` — protected, requires admin
- `/(app)/admin/settings` — protected

### Pre-configured Files
- `drizzle.config.ts` — ready for `bunx drizzle-kit push`
- `.env.example` — copy to `.env` and fill in
- `scripts/setup.sh` — run after install (generates secret, inits DB)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (local, Docker or managed — see `.env.example` for ready-to-use examples)
- `ORIGIN` — app URL (e.g. `http://localhost:5173`)
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`

## Next Steps

- **Start PostgreSQL** (local / Docker / managed — see `.env.example`)
- **Run migrations**: `bunx drizzle-kit push --force`
- **Create first admin**: Go to `/setup` in dev mode
- **Add a protected route**: Create file in `src/routes/(app)/your-route/+page.svelte`
- **Modify admin pattern**: Edit `src/lib/server/admin.ts` to add role-based checks
- **Delete order**: Always `session` → `account` → `user` (FK constraints)
