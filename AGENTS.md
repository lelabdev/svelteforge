# AGENTS.md — SvelteForge

AI agent instructions for the SvelteForge boilerplate generator.

## Architecture

**SvelteForge is a UI/UX layer on top of `sv create`.** Auth (better-auth) and database (Drizzle + SQLite) are handled entirely by `sv` add-ons. SvelteForge provides:

- 34 theme-aware UI components (Skeleton UI v4)
- 3-layer theme system (colors, spacing, fonts)
- Layout primitives (Navbar, Footer, MobileMenu, AuthButtons)
- Zod v4 validation schemas
- Utils (cn, formatters, theme store, focus-trap)

SvelteForge does **NOT** provide: auth config, DB connection, Drizzle schemas, service layer, middleware, or setup scripts. Those come from `sv`.

## Repo Structure

```
svelteforge/                ← this repo
├── cli.ts                  ← CLI generator (run this to create projects)
├── package.json            ← create-svelteforge package config
├── AGENTS.md               ← you are here
├── README.md
├── template-fullstack/     ← Full Stack mode files (UI + routes + schemas)
│   ├── package.json        ← all deps pre-listed (one-shot bun install)
│   ├── vite.config.ts      ← SSR config
│   └── src/                ← SvelteKit app (components, layout, schemas, styles, utils)
└── template-landing/       ← Landing Page mode files (UI only)
    ├── package.json        ← frontend-only deps
    ├── vite.config.ts      ← minimal config
    └── src/                ← simplified navbar, layout, page
```

**This repo is a generator, not an app.** Do not run `bun dev` here. Use the CLI to create a project first.

## Commands

```bash
# From cloned repo
bun run cli.ts my-project --fullstack       # Full Stack mode
bun run cli.ts my-project --landing         # Landing Page mode
bun run cli.ts my-project                   # Interactive (pick mode)
bun run cli.ts /home/dev/my-app --fullstack # Absolute path
bun run cli.ts --help                       # Show help

# Once published on npm:
bunx create-svelteforge my-project
```

### CLI Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--fullstack` | `-f` | Full Stack mode (skip interactive prompt) |
| `--landing` | `-l` | Landing Page mode (skip interactive prompt) |
| `--help` | `-h` | Show help |

## Scaffold Modes

| Mode | UI + Forms | Auth + DB |
|------|:----------:|:---------:|
| **Full Stack** (default) | ✓ | ✓ (via sv add-ons) |
| **Landing Page** | ✓ | ✗ |

### Scaffold Flow

1. `sv create` — base SvelteKit + Tailwind + ESLint + Prettier + Vitest (+ better-auth + Drizzle if Full Stack)
2. Clean sv defaults (routes, app.css, etc.)
3. Copy SvelteForge template files from `template-fullstack/` or `template-landing/`
4. Copy `package.json` (deps pre-listed) + `vite.config.ts` from the right template
5. One-shot `bun install`
6. Merge scripts + project name in `package.json`
7. Done — `sv` has already generated `.env` and DB config

## Stack (Full Stack mode)

| Layer | Technology |
|-------|-----------|
| Runtime | **Bun** (`bun:sqlite`, `bun run`) |
| Framework | **SvelteKit 2** + **Svelte 5** (runes: `$state`, `$props`, `$derived`, `$effect`) |
| Styling | **Tailwind CSS v4** + **Skeleton UI v4** |
| Auth | via **sv add-on** (better-auth — email/password, admin plugin) |
| Database | via **sv add-on** (SQLite `bun:sqlite` + Drizzle ORM) |
| Forms | **SuperForms** + **Zod v4** |
| Rich Text | **Tiptap** (`@tiptap/core`, `starter-kit`, `underline`) |
| Logging | **Pino** |
| Icons | **Lucide** (via local `Icon.svelte` wrapper) |

## Template Structure (SvelteForge adds)

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # 34 theme-swappable components
│   │   │   ├── Surfaces: Card, AuthCard, Modal, Sheet, PopOver, Carousel
│   │   │   ├── Feedback: Toast, ErrorAlert, SuccessAlert, Loader, Progress,
│   │   │   │          SkeletonLoader, NavigationLoader
│   │   │   ├── Navigation: Tabs, Breadcrumb, Stepper, Menu
│   │   │   ├── Data: DataTable, EmptyState, NotificationBadge, Badge, Avatar
│   │   │   ├── Controls: Button, Switch, Divider, Accordion, Tooltip,
│   │   │   │           RadioGroup, SearchInput, ThemeToggle, ConfirmDialog
│   │   │   ├── Rich Text: RichTextEditor, RichTextPreview (Tiptap)
│   │   │   └── form/ (Input, PasswordInput, TextArea, Select, Checkbox,
│   │   │                RadioGroup, FormField, SubmitButton, SearchInput)
│   │   ├── layout/          # Navbar, Footer, AuthButtons, MobileMenu, NavLinks
│   │   └── icons/           # Lucide wrapper (Icon.svelte) — new icons need import + iconMap entry
│   ├── schemas/             # Zod v4 validation (signup, login, password, account, profile)
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
├── hooks.server.ts          # Auth session, CSP + security headers
├── app.html                 # HTML shell (data-theme="svelteForge")
├── app.css                  # Tailwind + Skeleton + theme + tokens + fonts
└── app.d.ts                 # TypeScript declarations
```

Auth config (`auth.ts`, `auth-client.ts`), DB connection (`db/`), and Drizzle schemas are provided by `sv` and live in their standard locations. SvelteForge does not override them.

## Critical Rules

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

## SuperForms Gotchas

1. `request.formData()` can only be called once — pass already-parsed FormData to `superValidate()`
2. Initialize `superForm()` BEFORE any `$derived` that reads `$form`
3. Use `message()` for business errors, `fail()` for validation errors

## Rich Text Components

Based on **Tiptap**. Two components: editor + preview.

### RichTextEditor

```svelte
<script lang="ts">
  import { RichTextEditor } from '$lib/components/ui';
  import type { JSONContent } from '@tiptap/core';

  let content = $state<JSONContent>({ type: 'doc', content: [{ type: 'paragraph' }] });
</script>

<RichTextEditor
  content={content}
  onUpdate={(json) => { content = json; }}
  placeholder="Describe your product..."
/>
```

**Props:** `content`, `onUpdate`, `onFocus`, `onBlur`, `editable` (default: true), `placeholder`, `class`

**Features:** Bold, italic, underline, strikethrough, headings (H1-H3), bullet/ordered lists, blockquote, code block, horizontal rule, undo/redo.

### RichTextPreview

Lightweight JSON→HTML renderer. **No Editor instance loaded** — zero runtime cost.

```svelte
<script lang="ts">
  import { RichTextPreview } from '$lib/components/ui';
  import type { JSONContent } from '@tiptap/core';
</script>

<RichTextPreview content={data.description} />
```

**Store content as JSON** in your database (SQLite `text` column with `JSON.stringify`/`JSON.parse`).

## Adding to the Template

- **New page:** route in `routes/` → use Skeleton components → use SvelteForge schemas
- **New UI component:** in `components/ui/` → wrap Skeleton → use tokens → export from `index.ts`
- **New theme:** copy `svelteForge.css` + `tokens.css` → change `[data-theme]` name and values
- **New DB table / auth config:** handled by `sv` add-ons, not SvelteForge
