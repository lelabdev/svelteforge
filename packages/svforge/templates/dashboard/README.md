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

### Database
- **Drizzle ORM** with SQLite (libsql)
- **Schema**: user, session, account, verification tables
- **Auth schema** at `src/lib/server/db/auth.schema.ts`

### Admin Dashboard
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

## Environment Variables

- `DATABASE_URL` — SQLite path (e.g. `file:local.db`)
- `ORIGIN` — app URL (e.g. `http://localhost:5173`)
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`

## Next Steps

- **Run migrations**: `bunx drizzle-kit push --force`
- **Create first admin**: Go to `/setup` in dev mode
- **Add a protected route**: Create file in `src/routes/(app)/your-route/+page.svelte`
- **Modify admin pattern**: Edit `src/lib/server/admin.ts` to add role-based checks
- **Delete order**: Always `session` → `account` → `user` (FK constraints)
