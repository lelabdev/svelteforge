# AGENTS.md — SvelteForge

AI agent instructions for the SvelteForge boilerplate generator.

## Repo Structure

```
svelteforge/                ← this repo
├── cli.ts                  ← CLI generator (run this to create projects)
├── package.json            ← create-svelteforge package config
├── AGENTS.md               ← you are here
├── README.md
└── template/               ← files copied into generated projects
    ├── src/                ← SvelteKit app (Full Stack mode)
    ├── scripts/            ← setup.ts, db-init.ts, db-reset.ts
    └── ...
```

**This repo is a generator, not an app.** Do not run `bun dev` here. Use the CLI to create a project first.

## Commands

```bash
bunx create-svelteforge my-project            # Interactive (pick mode)
bunx create-svelteforge my-project --no-setup # Skip setup phase

# Or locally:
bun run cli.ts my-project                     # Interactive (pick mode)
```

## Scaffold Modes

| Mode | UI + Forms | Auth + DB |
|------|:----------:|:---------:|
| **Full Stack** (default) | ✓ | ✓ |
| **Landing Page** | ✓ | ✗ |

### Scaffold Flow

1. `sv create` — base SvelteKit + Tailwind + ESLint + Prettier
2. `sv add vitest` — testing (unit + component)
3. `bun add drizzle-orm` — DB deps (Full Stack only)
4. Copy SvelteForge template files (components, auth, schemas, etc.)
5. Install SvelteForge-only deps (Skeleton, BetterAuth, SuperForms, fonts, etc.)
6. Generate `vite.config.ts` based on mode
7. Optional: run `setup.ts` (creates .env, DB, admin user)

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
│   │   ├── ui/              # 32 theme-swapable components
│   │   │   ├── Surfaces: Card, AuthCard, Modal, Sheet, PopOver, Carousel
│   │   │   ├── Feedback: Toast, ErrorAlert, SuccessAlert, Loader, Progress,
│   │   │   │          SkeletonLoader, NavigationLoader
│   │   │   ├── Navigation: Tabs, Breadcrumb, Stepper, Menu
│   │   │   ├── Data: DataTable, EmptyState, NotificationBadge, Badge, Avatar
│   │   │   ├── Controls: Button, Switch, Divider, Accordion, Tooltip,
│   │   │   │           RadioGroup, SearchInput, ThemeToggle, ConfirmDialog
│   │   │   └── form/ (Input, PasswordInput, TextArea, Select, Checkbox,
│   │   │                RadioGroup, FormField, SubmitButton, SearchInput)
│   │   ├── layout/          # Navbar, Footer, AuthButtons, MobileMenu, NavLinks
│   │   └── icons/           # Lucide wrapper (Icon.svelte) — new icons need import + iconMap entry
│   ├── db/
│   │   ├── connection.ts    # Lazy SQLite connection (bun:sqlite)
│   │   ├── config.ts        # getDatabaseConfig(), requireEnv()
│   │   └── schemas/         # Drizzle tables (user, session, account, verification)
│   ├── services/            # Service layer — ALL DB access goes here
│   │   └── account/         # core.ts (withUser helper), management.ts, roles.ts, updates.ts
│   ├── schemas/             # Zod v4 validation (signup, login, password, account, profile)
│   ├── middleware/           # rate-limit.ts
│   ├── styles/
│   │   ├── svelteForge.css  # Skeleton theme colors (oklch, 7 domains × 10 shades)
│   │   ├── tokens.css       # Design tokens (60+ semantic CSS custom properties)
│   │   └── fonts.css        # Fontsource declarations
│   └── utils/               # cn.ts, form-errors.ts, formatters.ts, slugify.ts, focus-trap.ts, theme.svelte.ts
├── routes/
│   ├── (public)/            # /login, /signup, /forgot-password, /reset-password
│   ├── (protected)/         # /dashboard, /admin, /logout (/admin hides navbar/footer)
│   ├── (legal)/             # /privacy, /legal
│   └── api/                 # /api/auth/[...all], /api/health
├── hooks.server.ts          # Auth session, rate limiting, CSP + security headers
├── app.html                 # HTML shell (data-theme="svelteForge")
├── app.css                  # Tailwind + Skeleton + theme + tokens + fonts
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

Use `withUser(userId, context, fn)` from `core.ts` for operations that fetch a user then act on it. It handles NotFoundError + try/catch + logging automatically.

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

### Theme System

Three-layer theming, all overridable per theme:

| File | Purpose |
|------|---------|
| `svelteForge.css` | Skeleton color tokens (7 domains × 10 shades in oklch), fonts, borders |
| `tokens.css` | 60+ semantic tokens (padding, radius, font-size, sizing, gap, spacing) |
| `fonts.css` | Fontsource declarations (Inter, Space Grotesk, Manrope, Fira Code) |

**To create a new theme:** copy `svelteForge.css` + `tokens.css`, change the `[data-theme]` name and values. Components adapt automatically — zero component changes needed.

- Theme attribute: `data-theme="svelteForge"` on `<html>` (set in `app.html`)
- Dark mode: `data-mode="dark"` toggled by `themeStore` from `$lib/utils/theme.svelte`

### Design Tokens Rule

Components use `var(--token)` via inline `style` for all spacing, radius, font-size, and sizing. **Never hardcode these values in Tailwind classes.**

```svelte
<!-- ❌ HARDcoded -->
<div class="p-4 rounded-xl text-sm">

<!-- ✅ Tokenized -->
<div style="padding: var(--card-p); border-radius: var(--radius-card); font-size: var(--text-body)">
```

Color pairings and Skeleton utility classes (`card`, `btn`, `preset-*`) remain as Tailwind classes — only spacing/radius/font tokens move to CSS custom properties.

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
<!-- ❌ NEVER -->
<div class="bg-surface-50 dark:bg-surface-950">
<p class="text-surface-600 dark:text-surface-400">

<!-- ✅ ALWAYS -->
<div class="bg-surface-50-950">
<p class="text-surface-600-400">
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

## Superforms Gotchas

1. `request.formData()` can only be called once — pass already-parsed FormData to `superValidate()`
2. Initialize `superForm()` BEFORE any `$derived` that reads `$form`
3. Use `message()` for business errors, `fail()` for validation errors

## Adding to the Template

- **New DB table:** schema in `db/schemas/` → service in `services/` → `bun run db:push` in generated project
- **New page:** route in `routes/` → use service layer → use Skeleton components
- **New UI component:** in `components/ui/` → wrap Skeleton → use tokens → export from `index.ts`
- **New theme:** copy `svelteForge.css` + `tokens.css` → change `[data-theme]` name and values
- **OAuth provider:** add `socialProviders` block in `auth.ts`

## Environment Variables (Full Stack mode)

```bash
DATABASE_URL="data/sqlite.db"           # SQLite database path
BETTER_AUTH_SECRET="..."                # Auth secret (auto-generated by setup)
BASE_URL="http://localhost:5173"        # Public URL
```
