# AGENTS.md — SvelteForge

AI agent instructions for the SvelteForge sv community addon.

## Architecture

**SvelteForge is an sv community addon** — a plugin for the official `sv` CLI. It uses `defineAddon()` from `sv` to declare files and dependencies. Auth (better-auth) and database (Drizzle + SQLite) are handled entirely by `sv`'s own add-ons. SvelteForge provides:

- 34 theme-aware UI components (Skeleton UI v4)
- 3-layer theme system (colors, spacing, fonts)
- Layout primitives (Navbar, Footer, MobileMenu, AuthButtons)
- Zod v4 validation schemas
- Utils (cn, formatters, theme store, focus-trap)

SvelteForge does **NOT** provide: auth config, DB connection, Drizzle schemas, service layer, middleware, or setup scripts. Those come from `sv`.

## Repo Structure

```
svelteforge/                ← this repo (the addon package)
├── src/
│   ├── index.ts            ← defineAddon() entry — options, deps, file injection
│   ├── templates.ts        ← AUTO-GENERATED — all template file contents as JSON strings
│   └── modes/
│       ├── fullstack.ts    ← writes all fullstack template files via sv.file()
│       └── landing.ts      ← filters fullstack files + applies landing overrides
├── templates/
│   ├── fullstack/          ← fullstack mode source (SvelteKit app with UI + dashboard + routes)
│   │   ├── src/            ← components, routes, schemas, styles, utils, stores
│   │   ├── package.json    ← deps list (used by prebuild, NOT copied directly)
│   │   └── vite.config.ts  ← SSR config for better-auth
│   └── landing/            ← landing mode overrides
│       ├── src/            ← sections, landing navbar, logo, animations
│       ├── package.json
│       └── vite.config.ts
├── scripts/
│   └── prebuild.ts         ← reads templates/ → generates src/templates.ts
├── dist/                   ← build output (single index.js + .d.ts)
├── tsdown.config.ts        ← bundler config
├── package.json            ← @lelabdev/svelteforge
├── AGENTS.md               ← you are here
├── README.md
└── llms.txt
```

**This repo is an addon, not an app.** Do not run `bun dev` here. Use `bun run build` to build the addon, then test via `sv add`.

## Commands

```bash
# Build the addon (prebuild + tsdown)
bun run build

# Test locally
bun link
# Then in a separate directory:
sv create test-app --template minimal --types ts --add tailwindcss @lelabdev/svelteforge
cd test-app
bun dev

# Regenerate templates.ts only
bun run prebuild
```

### Build Pipeline

1. `bun run prebuild` — reads all files from `templates/fullstack/src/` and `templates/landing/src/`, inlines them as JSON strings into `src/templates.ts`
2. `tsdown` — bundles `src/index.ts` + modes + templates into a single `dist/index.js`
3. `dist/index.js` is what gets published to npm and loaded by `sv`

### How the Addon Works

```typescript
// src/index.ts
export default defineAddon({
  id: 'svelteforge',
  alias: 'forge',

  options: defineAddonOptions()
    .add('template', { type: 'select', options: ['landing', 'fullstack'] })
    .build(),

  run: ({ sv, options }) => {
    // Declare deps — sv handles the install
    sv.dependency('phosphor-svelte', '^3.1.0');
    sv.devDependency('@skeletonlabs/skeleton', 'latest');
    // ...

    // Write files — sv handles the filesystem
    for (const [path, content] of Object.entries(files)) {
      sv.file(`src${path}`, () => content);
    }
  }
});
```

## Modes

| Mode | UI + Forms | Auth + DB |
|------|:----------:|:---------:|
| **Full Stack** (default) | ✓ | ✓ (via sv add-ons) |
| **Landing Page** | ✓ | ✗ |

### Landing mode logic

Landing mode **reuses fullstack components** but filters out admin/auth-specific ones:

- Skips: AuthCard, DataTable, NavigationLoader, NotificationBadge, SearchInput, auth-buttons, AdminSidebar
- Skips: test files, export/slugify/form-errors utils
- Adds landing-specific overrides: sections (Hero, Stats, Why, Stack, etc.), landing navbar, logo, animations

## Stack (Full Stack mode)

| Layer | Technology |
|-------|-----------|
| Runtime | **Bun** (`bun install`) + **Node** (`vite dev/build`) |
| Framework | **SvelteKit 2** + **Svelte 5** (runes: `$state`, `$props`, `$derived`, `$effect`) |
| Styling | **Tailwind CSS v4** + **Skeleton UI v4** |
| Auth | via **sv add-on** (better-auth — email/password, admin plugin) |
| Database | via **sv add-on** (SQLite `libsql` + Drizzle ORM) |
| Forms | **SuperForms** + **Zod v4** |
| Rich Text | **Tiptap** (`@tiptap/core`, `starter-kit`, `underline`) |
| Logging | **Pino** |
| Icons | **Phosphor** (via local `Icon.svelte` wrapper, `phosphor-svelte`) |
| Testing | **Vitest** + `@testing-library/svelte` |

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
│   │   └── icons/           # Phosphor wrapper (Icon.svelte) — new icons need import + iconMap entry
│   ├── schemas/             # Zod v4 validation (signup, login, password, account, profile)
│   ├── styles/
│   │   ├── svelteForge.css  # Skeleton theme colors (oklch, 7 domains × 10 shades)
│   │   ├── tokens.css       # Design tokens (60+ semantic CSS custom properties)
│   │   └── fonts.css        # Fontsource declarations
│   ├── stores/              # notification-store.svelte.ts (Svelte 5 runes)
│   └── utils/               # cn.ts, form-errors.ts, formatters.ts, slugify.ts, focus-trap.ts, theme.svelte.ts
├── routes/
│   ├── (public)/            # /login, /signup
│   ├── (protected)/         # /dashboard
│   │   └── admin/           # /admin (sidebar layout), /admin/users, /admin/settings, /admin/notifications
│   └── (legal)/             # /privacy, /legal
├── app.html                 # HTML shell (data-theme="svelteForge")
├── app.css                  # Tailwind + Skeleton + theme + tokens + fonts
└── app.d.ts                 # TypeScript declarations
```

Auth config (`auth.ts`, `auth-client.ts`), DB connection (`db/`), Drizzle schemas, `hooks.server.ts`, and API routes (`/api/auth/[...all]`, `/api/health`) are provided by `sv` and live in their standard locations. SvelteForge does not override them.

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

Always use local wrapper, **NEVER** import from `phosphor-svelte` directly:

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

## Build & Release

```bash
bun run build          # prebuild + tsdown → dist/index.js
bun publish            # publish to npm
```

`src/templates.ts` is auto-generated by `prebuild.ts`. Never edit it directly. Edit template files in `templates/`, then rebuild.
