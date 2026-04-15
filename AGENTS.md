# AGENTS.md — SvelteForge

AI agent instructions for the SvelteForge boilerplate generator.

## Repo Structure

```
svelteforge/                ← this repo
├── scaffold.ts             ← CLI generator (run this to create projects)
├── AGENTS.md               ← you are here
├── README.md
└── template/               ← files copied into generated projects
    ├── src/                ← SvelteKit app (Full Stack mode)
    ├── scripts/            ← setup.ts, db-init.ts, db-reset.ts
    ├── package.json        ← project template deps
    └── ...
```

**This repo is a generator, not an app.** Do not run `bun dev` here. Use the scaffold to create a project first.

## Commands

```bash
bun run scaffold.ts my-project            # Interactive (pick mode)
bun run scaffold.ts my-project --no-setup # Skip setup phase
```

## Scaffold Modes

| Mode | UI + Forms | Auth + DB |
|------|:----------:|:---------:|
| **Full Stack** (default) | ✓ | ✓ |
| **Landing Page** | ✓ | ✗ |

### Scaffold Flow

1. `sv create` — base SvelteKit + Tailwind + ESLint + Prettier + Vitest
2. `sv add drizzle` — Drizzle ORM (Full Stack only)
3. Copy SvelteForge template files (components, auth, schemas, etc.)
4. Install SvelteForge-only deps (Skeleton, BetterAuth, SuperForms, fonts, etc.)
5. Generate `vite.config.ts` based on mode
6. Optional: run `setup.ts` (creates .env, DB, admin user)

## Stack (Full Stack mode)

| Layer | Technology |
|-------|-----------|
| Runtime | **Bun** (`bun:sqlite`, `bun run`) |
| Framework | **SvelteKit 2** + **Svelte 5** (runes: `$state`, `$props`, `$derived`, `$effect`) |
| Styling | **Tailwind CSS v4** + **Skeleton UI v4** |
| Auth | **BetterAuth** (email/password, admin plugin) |
| Database | **SQLite** (`bun:sqlite`) + **Drizzle ORM** |
| Forms | **SuperForms** + **Zod v4** |
| Logging | **Pino** |
| Icons | **Lucide** (via local `Icon.svelte` wrapper) |

## Template Structure (inside `template/`)

```
src/
├── lib/
│   ├── auth.ts              # BetterAuth server config (lazy Proxy singleton)
│   ├── auth-client.ts       # BetterAuth client-side hook
│   ├── auth-context.ts      # AsyncLocalStorage for per-request context
│   ├── auth-utils.ts        # requireAuth(), requireAdmin()
│   ├── errors.ts            # AppError hierarchy
│   ├── logger.ts            # Pino logger + createChildLogger()
│   ├── types.ts             # Shared TypeScript interfaces
│   ├── components/
│   │   ├── ui/              # 18 Skeleton-based reusable components
│   │   │   ├── Avatar, Badge, Button, Card, ConfirmDialog
│   │   │   ├── DataTable, ErrorAlert, Loader, Menu, Modal
│   │   │   ├── Switch, Tabs, ThemeToggle, Toast
│   │   │   ├── SuccessAlert, AuthCard, NavigationLoader
│   │   │   └── form/ (Checkbox, FormField, Input, PasswordInput, Select, SubmitButton, TextArea)
│   │   ├── layout/          # Navbar, Footer, AuthButtons, MobileMenu
│   │   └── icons/           # Lucide wrapper (Icon.svelte) — new icons need import + iconMap entry
│   ├── db/
│   │   ├── connection.ts    # Lazy SQLite connection (bun:sqlite)
│   │   ├── config.ts        # getDatabaseConfig(), requireEnv()
│   │   └── schemas/         # Drizzle tables (user, session, account, verification)
│   ├── services/            # Service layer — ALL DB access goes here
│   │   └── account/         # core.ts, management.ts, roles.ts, updates.ts
│   ├── schemas/             # Zod v4 validation (signup, login, password, account, profile)
│   ├── middleware/           # rate-limit.ts
│   ├── styles/              # svelteForge.css, fonts.css
│   └── utils/               # cn.ts, form-errors.ts, formatters.ts, slugify.ts, focus-trap.ts, theme.svelte.ts
├── routes/
│   ├── (public)/            # /login, /signup, /forgot-password, /reset-password
│   ├── (protected)/         # /dashboard, /admin, /logout
│   ├── (legal)/             # /privacy, /legal
│   └── api/                 # /api/auth/[...all], /api/health
├── hooks.server.ts          # Auth session, rate limiting, CSP + security headers
├── app.html                 # HTML shell (data-theme="svelteForge")
├── app.css                  # Tailwind + Skeleton + theme + fonts
└── app.d.ts                 # TypeScript declarations
```

## Critical Rules

### Service Layer is Mandatory

Routes must **NEVER** import `db` directly. All DB access goes through `src/lib/services/`.

```typescript
// ❌ NEVER
import { db } from '$lib/db';

// ✅ ALWAYS
import { getUserById } from '$lib/services';
```

### DB & Auth are Lazy-Loaded Proxies

`db` and `auth` are lazy-loaded via Proxy. They initialize on first access at runtime. **Do not restructure.**

`QueryRunner = any` in `src/lib/db/types.ts` is intentional.

### SQLite, NOT PostgreSQL

- ❌ `ILIKE` → use `LIKE`
- ❌ `::int` cast → use Drizzle's `count()`
- ❌ `sql.raw(userInput)` for sort → use column whitelist

### SQLite Timestamps Trap

`.defaultNow()` causes the **year 58226 bug** with `bun:sqlite`.

```typescript
// ❌ WRONG
createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow()

// ✅ CORRECT — always pass new Date() explicitly
.insert({ createdAt: new Date(), updatedAt: new Date() });
```

### Zod v4, Not v3

```typescript
import { z } from 'zod/v4';                                // ✅
import { z } from 'zod';                                    // ❌
import { zod4 } from 'sveltekit-superforms/adapters';       // ✅ server
import { zod4Client } from 'sveltekit-superforms/adapters'; // ✅ client
```

## Svelte 5 Conventions

- **Children**: `{@render children()}` — NOT `<slot>`
- **Events**: `onclick={handler}` — NOT `on:click={handler}`
- **State**: `$state`, `$props`, `$derived`, `$effect` runes

## UI Conventions

### Skeleton UI — Always Use Native

Components wrap Skeleton classes or `<Component>` from `@skeletonlabs/skeleton-svelte`. **Never write raw HTML/CSS for things Skeleton provides.**

### Theme

- `data-theme="svelteForge"` (custom, in `src/lib/styles/svelteForge.css`)
- Dark mode: `data-mode="dark"` on `<html>`
- Toggle: `themeStore` from `$lib/utils/theme.svelte`
- Fonts: Inter, Space Grotesk, Manrope, Fira Code via Fontsource

### Color Pairings (MANDATORY)

**NEVER** use `dark:` for light/dark color variants. Always use Skeleton color pairings instead.

Pairings combine light and dark mode shades in one class: `{property}-{color}-{lightShade}-{darkShade}`

Valid shade pairings (inverted between light and dark):

| Light | Dark | Usage |
|-------|------|-------|
| `50` | `950` | Backgrounds / body text |
| `100` | `900` | Cards / subtle text |
| `200` | `800` | Borders / hover states |
| `300` | `700` | Borders / dividers |
| `400` | `600` | Muted elements |
| `500` | `500` | Static (branding, accent) |

```html
<!-- ❌ NEVER use dark: for color variants -->
<div class="bg-surface-50 dark:bg-surface-950">
<p class="text-surface-600 dark:text-surface-400">
<button class="hover:bg-surface-200 dark:hover:bg-surface-700">

<!-- ✅ ALWAYS use pairings -->
<div class="bg-surface-50-950">
<p class="text-surface-600-400">
<button class="hover:bg-surface-200-800">
```

Also applies to presets: `preset-filled-primary-50-950`, `preset-outlined-surface-200-800`, etc.

### Raw Colors (FORBIDDEN)

- ❌ `text-neutral-*`, `bg-white`, `border-gray-*`, `text-red-*`
- ✅ `text-surface-*`, `bg-surface-50`, `border-surface-*`, `text-error-*`

All colors MUST use Skeleton theme tokens (`primary`, `secondary`, `tertiary`, `success`, `warning`, `error`, `surface`).

### Icons

Always use local wrapper, **NEVER** import from `lucide-svelte` directly:

```svelte
<Icon name="alertCircle" size={20} class="text-error-500" />
```

New icons need both an import AND an entry in `iconMap` in `Icon.svelte`.

### Language

All UI text in **English**.

### Admin Pages

`/admin` routes hide navbar/footer via pathname check in root layout. Requires `user.role === 'admin'`.

## Superforms Gotchas

1. `request.formData()` can only be called once — pass already-parsed FormData to `superValidate()`
2. Initialize `superForm()` BEFORE any `$derived` that reads `$form`
3. Use `message()` for business errors, `fail()` for validation errors

## Adding New Features to the Template

### New database table

1. Create schema in `template/src/lib/db/schemas/`
2. Create service in `template/src/lib/services/`
3. Run `bun run db:push` in the generated project

### New page

1. Create route in `template/src/routes/`
2. Use service layer for data
3. Use Skeleton components for UI

### New UI component

1. Create in `template/src/lib/components/ui/`
2. Must wrap Skeleton classes or `<Component>`
3. Export from `template/src/lib/components/ui/index.ts`

### OAuth provider

Add to `template/src/lib/auth.ts`:

```typescript
socialProviders: {
    github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET
    }
}
```

## Environment Variables (Full Stack mode)

```bash
DATABASE_URL="data/sqlite.db"           # SQLite database path
BETTER_AUTH_SECRET="..."                # Auth secret (auto-generated by setup)
BASE_URL="http://localhost:5173"        # Public URL
```

## Git Workflow

1. Branch from main: `git checkout -b feature/description`
2. Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`
3. PR via `gh pr create`, then squash-merge
