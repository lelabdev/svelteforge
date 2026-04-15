# AGENTS.md — SvelteForge Boilerplate

Complete instruction file for AI agents working on this project.

## Commands

```bash
bun dev                  # Start dev server (--host enabled)
bun check                # TypeScript check (svelte-check)
bun run build            # Production build
bun run setup            # Interactive setup (creates .env, DB, admin user)
bun run test             # Run tests (vitest)
bun run db:push          # Push schema changes to SQLite
bun run db:generate      # Generate migration SQL
bun run db:migrate       # Run migrations
bun run db:studio        # Drizzle Studio (DB browser)
bun run db:init          # Initialize database
bun run format           # Prettier formatting
bun run lint             # ESLint + Prettier check
```

## Scaffold (creating new projects)

This boilerplate uses `sv create` + `sv add` for base setup, then layers SvelteForge on top:

```bash
# From the SvelteForge repo root:
bun run scaffold my-project            # Interactive (pick modules)
bun run scaffold my-project --no-setup # Skip setup phase
```

### Available modes

| Mode | Modules |
|------|---------|
| **Full Stack** | UI + Forms + Auth + DB |
| **Frontend Only** | UI + Forms (no auth, no DB) |
| **UI + DB** | UI + Forms + Database (no auth) |

### What `sv` handles

The scaffold uses `sv` CLI in two steps:

1. **`sv create`** — base project:
   - `--template minimal --types ts`
   - `--add tailwindcss="plugins:typography,forms" prettier eslint vitest`
   - `--install bun`

2. **`sv add drizzle`** — only when DB/Auth is selected:
   - Configures Drizzle ORM with the right driver
   - SvelteForge then copies its own schemas, services, and config on top

SvelteForge only installs what `sv` does not provide (Skeleton UI, BetterAuth, SuperForms, fonts, etc.).

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | **Bun** (`bun:sqlite`, `bun run`) |
| Framework | **SvelteKit 2** + **Svelte 5** (runes: `$state`, `$props`, `$derived`, `$effect`) |
| Styling | **Tailwind CSS v4** + **Skeleton UI v4** |
| Auth | **BetterAuth** (email/password, admin plugin) — optional module |
| Database | **SQLite** (`bun:sqlite`) + **Drizzle ORM** — optional module |
| Forms | **SuperForms** + **Zod v4** |
| Logging | **Pino** |
| Icons | **Lucide** (via local `Icon.svelte` wrapper) |

## Project Structure

```
src/
├── lib/
│   ├── auth.ts              # BetterAuth server config (lazy Proxy singleton)
│   ├── auth-client.ts       # BetterAuth client-side hook
│   ├── auth-context.ts      # AsyncLocalStorage for per-request context
│   ├── auth-utils.ts        # requireAuth(), requireAdmin()
│   ├── errors.ts            # AppError hierarchy (NotFound, Conflict, Internal, Validation)
│   ├── logger.ts            # Pino logger + createChildLogger()
│   ├── types.ts             # Shared TypeScript interfaces (UserQueryOptions, PaginatedResult, etc.)
│   ├── components/
│   │   ├── ui/              # 18 Skeleton-based reusable components
│   │   │   ├── Avatar, Badge, Button, Card
│   │   │   ├── ConfirmDialog, DataTable, ErrorAlert, Loader
│   │   │   ├── Menu, Modal, ModalCard, Switch, Tabs
│   │   │   ├── ThemeToggle, Toast (+ toast-state.svelte.ts)
│   │   │   ├── SuccessAlert, AuthCard, NavigationLoader
│   │   │   └── form/ (Checkbox, FormField, Input, PasswordInput, Select, SubmitButton, TextArea)
│   │   ├── layout/          # AppBar (Navbar), Footer, AuthButtons, MobileMenu, NavLinks
│   │   └── icons/           # Lucide icon wrapper (Icon.svelte) — new icons need import + iconMap entry
│   ├── db/
│   │   ├── connection.ts    # Lazy SQLite connection (bun:sqlite) — initDb() at startup
│   │   ├── config.ts        # getDatabaseConfig(), requireEnv()
│   │   ├── schemas/         # Drizzle table definitions (auth-schema.ts: user, session, account, verification)
│   │   └── index.ts         # Proxy singleton export
│   ├── services/            # Service layer — ALL DB access goes here
│   │   ├── account/         # core.ts, management.ts, roles.ts, updates.ts
│   │   └── index.ts         # Barrel exports
│   ├── schemas/             # Zod v4 validation schemas (signup, login, password, account, profile)
│   ├── middleware/           # rate-limit.ts (auth + API)
│   └── utils/               # cn.ts, form-errors.ts, formatters.ts, slugify.ts, focus-trap.ts, theme.svelte.ts
├── routes/
│   ├── (public)/            # /login, /signup, /forgot-password, /reset-password
│   ├── (protected)/         # /dashboard, /admin, /logout (auth required)
│   ├── (legal)/             # /privacy, /legal
│   └── api/                 # /api/auth/[...all], /api/health
├── hooks.server.ts          # Auth session, rate limiting, CSP + security headers
├── app.html                 # HTML shell (data-theme="svelteForge")
├── app.css                  # Tailwind + Skeleton + svelteForge theme + fonts
└── app.d.ts                 # TypeScript ambient declarations (Locals, Session)
```

## Critical Rules

### Service Layer is Mandatory

Routes and components must **NEVER** import `db` or schemas directly. All DB access goes through `src/lib/services/`. Routes handle HTTP only.

```typescript
// ❌ NEVER in a route file
import { db } from '$lib/db';

// ✅ ALWAYS use services
import { getUserById } from '$lib/services';
```

### DB & Auth are Lazy-Loaded Proxies

`db` (from `$lib/db`) and `auth` (from `$lib/auth`) are lazy-loaded via Proxy. They initialize on first access at runtime, not during build. **Do not restructure this.**

`QueryRunner = any` in `src/lib/db/types.ts` is intentional. Drizzle's transaction types cannot be extracted cleanly from the lazy-loaded proxy.

### SQLite, NOT PostgreSQL

- ❌ `ILIKE` → use `LIKE` (case-insensitive for ASCII)
- ❌ `::int` cast → use Drizzle's `count()` helper
- ❌ `sql.raw(userInput)` for sort → use Drizzle column whitelist

### SQLite Timestamps Trap

Using `.defaultNow()` causes the **year 58226 bug** with `bun:sqlite`.

```typescript
// ❌ WRONG — will produce year 58226
createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow()

// ✅ CORRECT — always pass new Date() explicitly
.insert({ createdAt: new Date(), updatedAt: new Date() });
```

**Rule**: For ALL timestamp columns, ALWAYS pass `new Date()` in `insert` and `update`. Never rely on `.defaultNow()` or SQL-level defaults.

### Zod v4, Not v3

```typescript
import { z } from 'zod/v4';                        // ✅ Zod 4
import { z } from 'zod';                            // ❌ Zod 3

// Server adapter
import { zod4 } from 'sveltekit-superforms/adapters';

// Client adapter
import { zod4Client } from 'sveltekit-superforms/adapters';
```

Mixing Zod 3 imports with Zod 4 adapters causes silent empty validation errors.

## Svelte 5 Conventions

- **Children**: `{@render children()}` — NOT `<slot>` (deprecated)
- **Events**: `onclick={handler}` — NOT `on:click={handler}` (deprecated)
- **State**: `$state`, `$props`, `$derived`, `$effect` runes
- **Forms**: `use:enhance` with SuperForms, not bare `<form>`

## UI Conventions

### Skeleton UI — Always Use Native

Every component in `src/lib/components/ui/` wraps Skeleton classes or `<Component>` from `@skeletonlabs/skeleton-svelte`. **Never write raw HTML/CSS for things Skeleton provides.**

### Available Components

| Component | Base Skeleton | Import |
|-----------|--------------|--------|
| Button | `btn` + `preset-filled-*` | `import { Button } from '$lib/components/ui'` |
| Card | `card` class | `import { Card } from '$lib/components/ui'` |
| Avatar | Skeleton tokens | `import { Avatar } from '$lib/components/ui'` |
| Badge | `preset-tonal-*` | `import { Badge } from '$lib/components/ui'` |
| Modal | `<Dialog>` | `import { Modal } from '$lib/components/ui'` |
| ConfirmDialog | `<Dialog>` | `import { ConfirmDialog } from '$lib/components/ui'` |
| Toast | `preset-tonal-*` | `import { Toast, addToast, removeToast } from '$lib/components/ui'` |
| Menu | `<Menu>` | `import { Menu } from '$lib/components/ui'` |
| Tabs | `<Tabs>` | `import { Tabs } from '$lib/components/ui'` |
| Switch | `<Switch>` | `import { Switch } from '$lib/components/ui'` |
| DataTable | Tailwind table | `import { DataTable } from '$lib/components/ui'` |
| FormField | `input-group` | `import { FormField } from '$lib/components/ui'` |

### Theme

- Theme: `data-theme="svelteForge"` (custom, in `src/lib/styles/svelteForge.css`)
- Dark mode: `data-mode="dark"` on `<html>` (Skeleton native system)
- Toggle: `themeStore` from `$lib/utils/theme.svelte`
- Fonts: Inter (body), Space Grotesk (headings), Manrope, Fira Code via Fontsource

### Semantic Colors

Use Skeleton theme tokens, NOT raw Tailwind colors:

- ✅ `text-error-500`, `bg-success-500/10`, `text-primary-500`, `preset-tonal-*`
- ❌ `text-red-500`, `bg-green-100`, `border-gray-200`

### Icons

Always use the local wrapper — **NEVER** import from `lucide-svelte` directly:

```svelte
<Icon name="alertCircle" size={20} class="text-error-500" />
```

File: `src/lib/components/icons/Icon.svelte`. New icons need both an import AND an entry in `iconMap`.

### Language

All UI text in **English**. Route names in English: `/dashboard`, `/login`, `/admin`, `/privacy`, `/legal`.

### Admin Pages

`/admin` routes hide navbar/footer automatically via pathname check in root layout. Admin access requires `user.role === 'admin'` (checked via `requireAdmin()` in `+page.server.ts`).

## Superforms Gotchas

1. `request.formData()` can only be called once — pass already-parsed FormData to `superValidate()`
2. Initialize `superForm()` BEFORE any `$derived` that reads `$form`
3. Use `message()` for business errors, `fail()` for validation errors

## Adding New Features

### New database table

1. Create schema in `src/lib/db/schemas/` (export from `index.ts`)
2. Create service in `src/lib/services/` (export from `index.ts`)
3. Run `bun run db:push`

### New page

1. Create route in `src/routes/`
2. Use service layer for data
3. Use Skeleton components for UI

### New UI component

1. Create in `src/lib/components/ui/`
2. Must wrap Skeleton classes or `<Component>` — no raw CSS
3. Export from `src/lib/components/ui/index.ts`

### OAuth provider

Add to `src/lib/auth.ts`:
```typescript
socialProviders: {
    github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET
    }
}
```

### Switch to PostgreSQL

1. Replace `drizzle-orm/bun-sqlite` with `drizzle-orm/node-postgres`
2. Update `src/lib/db/connection.ts` driver
3. Update `drizzle.config.ts` dialect
4. Change `DATABASE_URL` in `.env`

## Environment Variables

```bash
DATABASE_URL="data/sqlite.db"           # SQLite database path
BETTER_AUTH_SECRET="..."                # Auth secret (auto-generated by setup)
BASE_URL="http://localhost:5173"        # Public URL
```

## Git Workflow

1. Always branch from main: `git checkout -b feature/description`
2. Commit with conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`
3. PR via `gh pr create`, then squash-merge
