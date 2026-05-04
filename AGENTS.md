     1|# AGENTS.md — SvelteForge
     2|
     3|AI agent instructions for the SvelteForge boilerplate generator.
     4|
     5|## Architecture
     6|
     7|**SvelteForge is a UI/UX layer on top of `sv create`.** Auth (better-auth) and database (Drizzle + SQLite) are handled entirely by `sv` add-ons. SvelteForge provides:
     8|
     9|- 34 theme-aware UI components (Skeleton UI v4)
    10|- 3-layer theme system (colors, spacing, fonts)
    11|- Layout primitives (Navbar, Footer, MobileMenu, AuthButtons)
    12|- Zod v4 validation schemas
    13|- Utils (cn, formatters, theme store, focus-trap)
    14|
    15|SvelteForge does **NOT** provide: auth config, DB connection, Drizzle schemas, service layer, middleware, or setup scripts. Those come from `sv`.
    16|
    17|## Repo Structure
    18|
    19|```
    20|svelteforge/                ← this repo
    21|├── cli.ts                  ← CLI generator (run this to create projects)
    22|├── package.json            ← create-svelteforge package config
    23|├── AGENTS.md               ← you are here
    24|├── README.md
    25|├── template-fullstack/     ← Full Stack mode files (UI + routes + schemas)
    26|│   ├── package.json        ← all deps pre-listed (one-shot pnpm install)
    27|│   ├── vite.config.ts      ← SSR config
    28|│   └── src/                ← SvelteKit app (components, layout, schemas, styles, utils)
    29|└── template-landing/       ← Landing Page mode files (UI only)
    30|    ├── package.json        ← frontend-only deps
    31|    ├── vite.config.ts      ← minimal config
    32|    └── src/                ← simplified navbar, layout, page
    33|```
    34|
    35|**This repo is a generator, not an app.** Do not run `pnpm dev` here. Use the CLI to create a project first.
    36|
    37|## Commands
    38|
    39|```bash
    40|# From cloned repo
    41|pnpm dlx create-svelteforge my-project --fullstack       # Full Stack mode
    42|pnpm dlx create-svelteforge my-project --landing         # Landing Page mode
    43|pnpm dlx create-svelteforge my-project                   # Interactive (pick mode)
    44|pnpm dlx create-svelteforge /home/dev/my-app --fullstack # Absolute path
    45|pnpm dlx create-svelteforge --help                       # Show help
    46|
    47|# Once published on npm:
    48|pnpm dlx create-svelteforge my-project
    49|```
    50|
    51|### CLI Flags
    52|
    53|| Flag | Short | Description |
    54||------|-------|-------------|
    55|| `--fullstack` | `-f` | Full Stack mode (skip interactive prompt) |
    56|| `--landing` | `-l` | Landing Page mode (skip interactive prompt) |
    57|| `--help` | `-h` | Show help |
    58|
    59|## Scaffold Modes
    60|
    61|| Mode | UI + Forms | Auth + DB |
    62||------|:----------:|:---------:|
    63|| **Full Stack** (default) | ✓ | ✓ (via sv add-ons) |
    64|| **Landing Page** | ✓ | ✗ |
    65|
    66|### Scaffold Flow
    67|
    68|1. `sv create` — base SvelteKit + Tailwind + ESLint + Prettier + Vitest (+ better-auth + Drizzle if Full Stack)
    69|2. Clean sv defaults (routes, app.css, etc.)
    70|3. Copy SvelteForge template files from `template-fullstack/` or `template-landing/`
    71|4. Copy `package.json` (deps pre-listed) + `vite.config.ts` from the right template
    72|5. One-shot `pnpm install`
    73|6. Merge scripts + project name in `package.json`
    74|7. Done — `sv` has already generated `.env` and DB config
    75|
    76|## Stack (Full Stack mode)
    77|
    78|| Layer | Technology |
    79||-------|-----------|
    80|| Runtime | **Node** + **pnpm** |
    81|| Framework | **SvelteKit 2** + **Svelte 5** (runes: `$state`, `$props`, `$derived`, `$effect`) |
    82|| Styling | **Tailwind CSS v4** + **Skeleton UI v4** |
    83|| Auth | via **sv add-on** (better-auth — email/password, admin plugin) |
    84|| Database | via **sv add-on** (SQLite `better-sqlite3` + Drizzle ORM) |
    85|| Forms | **SuperForms** + **Zod v4** |
    86|| Rich Text | **Tiptap** (`@tiptap/core`, `starter-kit`, `underline`) |
    87|| Logging | **Pino** |
    88|| Icons | **Lucide** (via local `Icon.svelte` wrapper) |
    89|
    90|## Template Structure (SvelteForge adds)
    91|
    92|```
    93|src/
    94|├── lib/
    95|│   ├── components/
    96|│   │   ├── ui/              # 34 theme-swappable components
    97|│   │   │   ├── Surfaces: Card, AuthCard, Modal, Sheet, PopOver, Carousel
    98|│   │   │   ├── Feedback: Toast, ErrorAlert, SuccessAlert, Loader, Progress,
    99|│   │   │   │          SkeletonLoader, NavigationLoader
   100|│   │   │   ├── Navigation: Tabs, Breadcrumb, Stepper, Menu
   101|│   │   │   ├── Data: DataTable, EmptyState, NotificationBadge, Badge, Avatar
   102|│   │   │   ├── Controls: Button, Switch, Divider, Accordion, Tooltip,
   103|│   │   │   │           RadioGroup, SearchInput, ThemeToggle, ConfirmDialog
   104|│   │   │   ├── Rich Text: RichTextEditor, RichTextPreview (Tiptap)
   105|│   │   │   └── form/ (Input, PasswordInput, TextArea, Select, Checkbox,
   106|│   │   │                RadioGroup, FormField, SubmitButton, SearchInput)
   107|│   │   ├── layout/          # Navbar, Footer, AuthButtons, MobileMenu, NavLinks
   108|│   │   └── icons/           # Lucide wrapper (Icon.svelte) — new icons need import + iconMap entry
   109|│   ├── schemas/             # Zod v4 validation (signup, login, password, account, profile)
   110|│   ├── styles/
   111|│   │   ├── svelteForge.css  # Skeleton theme colors (oklch, 7 domains × 10 shades)
   112|│   │   ├── tokens.css       # Design tokens (60+ semantic CSS custom properties)
   113|│   │   └── fonts.css        # Fontsource declarations
   114|│   └── utils/               # cn.ts, form-errors.ts, formatters.ts, slugify.ts, focus-trap.ts, theme.svelte.ts
   115|├── routes/
   116|│   ├── (public)/            # /login, /signup, /forgot-password, /reset-password
   117|│   ├── (protected)/         # /dashboard, /admin, /logout (/admin hides navbar/footer)
   118|│   ├── (legal)/             # /privacy, /legal
   119|│   └── api/                 # /api/auth/[...all], /api/health
   120|├── hooks.server.ts          # Auth session, CSP + security headers
   121|├── app.html                 # HTML shell (data-theme="svelteForge")
   122|├── app.css                  # Tailwind + Skeleton + theme + tokens + fonts
   123|└── app.d.ts                 # TypeScript declarations
   124|```
   125|
   126|Auth config (`auth.ts`, `auth-client.ts`), DB connection (`db/`), and Drizzle schemas are provided by `sv` and live in their standard locations. SvelteForge does not override them.
   127|
   128|## Critical Rules
   129|
   130|### Zod v4, Not v3
   131|
   132|```typescript
   133|import { z } from 'zod/v4';                                // ✅
   134|import { z } from 'zod';                                    // ❌
   135|import { zod4 } from 'sveltekit-superforms/adapters';       // ✅ server
   136|import { zod4Client } from 'sveltekit-superforms/adapters'; // ✅ client
   137|```
   138|
   139|## Svelte 5 Conventions
   140|
   141|- **Children**: `{@render children()}` — NOT `<slot>`
   142|- **Events**: `onclick={handler}` — NOT `on:click={handler}`
   143|- **State**: `$state`, `$props`, `$derived`, `$effect` runes
   144|
   145|## UI Conventions
   146|
   147|### Skeleton UI — Always Use Native
   148|
   149|Components wrap Skeleton classes or `<Component>` from `@skeletonlabs/skeleton-svelte`. **Never write raw HTML/CSS for things Skeleton provides.**
   150|
   151|### Theme System
   152|
   153|Three-layer theming, all overridable per theme:
   154|
   155|| File | Purpose |
   156||------|---------|
   157|| `svelteForge.css` | Skeleton color tokens (7 domains × 10 shades in oklch), fonts, borders |
   158|| `tokens.css` | 60+ semantic tokens (padding, radius, font-size, sizing, gap, spacing) |
   159|| `fonts.css` | Fontsource declarations (Inter, Space Grotesk, Manrope, Fira Code) |
   160|
   161|**To create a new theme:** copy `svelteForge.css` + `tokens.css`, change the `[data-theme]` name and values. Components adapt automatically — zero component changes needed.
   162|
   163|- Theme attribute: `data-theme="svelteForge"` on `<html>` (set in `app.html`)
   164|- Dark mode: `data-mode="dark"` toggled by `themeStore` from `$lib/utils/theme.svelte`
   165|
   166|### Design Tokens Rule
   167|
   168|Components use `var(--token)` via inline `style` for all spacing, radius, font-size, and sizing. **Never hardcode these values in Tailwind classes.**
   169|
   170|```svelte
   171|<!-- ❌ HARDcoded -->
   172|<div class="p-4 rounded-xl text-sm">
   173|
   174|<!-- ✅ Tokenized -->
   175|<div style="padding: var(--card-p); border-radius: var(--radius-card); font-size: var(--text-body)">
   176|```
   177|
   178|Color pairings and Skeleton utility classes (`card`, `btn`, `preset-*`) remain as Tailwind classes — only spacing/radius/font tokens move to CSS custom properties.
   179|
   180|### Color Pairings (MANDATORY)
   181|
   182|**NEVER** use `dark:` for light/dark color variants. Always use Skeleton color pairings instead.
   183|
   184|Pairings combine light and dark mode shades in one class: `{property}-{color}-{lightShade}-{darkShade}`
   185|
   186|Valid shade pairings (inverted between light and dark):
   187|
   188|| Light | Dark | Usage |
   189||-------|------|-------|
   190|| `50` | `950` | Backgrounds / body text |
   191|| `100` | `900` | Cards / subtle text |
   192|| `200` | `800` | Borders / hover states |
   193|| `300` | `700` | Borders / dividers |
   194|| `400` | `600` | Muted elements |
   195|| `500` | `500` | Static (branding, accent) |
   196|
   197|```html
   198|<!-- ❌ NEVER -->
   199|<div class="bg-surface-50 dark:bg-surface-950">
   200|<p class="text-surface-600 dark:text-surface-400">
   201|
   202|<!-- ✅ ALWAYS -->
   203|<div class="bg-surface-50-950">
   204|<p class="text-surface-600-400">
   205|```
   206|
   207|Also applies to presets: `preset-filled-primary-50-950`, `preset-outlined-surface-200-800`, etc.
   208|
   209|### Raw Colors (FORBIDDEN)
   210|
   211|- ❌ `text-neutral-*`, `bg-white`, `border-gray-*`, `text-red-*`
   212|- ✅ `text-surface-*`, `bg-surface-50`, `border-surface-*`, `text-error-*`
   213|
   214|All colors MUST use Skeleton theme tokens (`primary`, `secondary`, `tertiary`, `success`, `warning`, `error`, `surface`).
   215|
   216|### Icons
   217|
   218|Always use local wrapper, **NEVER** import from `lucide-svelte` directly:
   219|
   220|```svelte
   221|<Icon name="alertCircle" size={20} class="text-error-500" />
   222|```
   223|
   224|New icons need both an import AND an entry in `iconMap` in `Icon.svelte`.
   225|
   226|### Language
   227|
   228|All UI text in **English**.
   229|
   230|## SuperForms Gotchas
   231|
   232|1. `request.formData()` can only be called once — pass already-parsed FormData to `superValidate()`
   233|2. Initialize `superForm()` BEFORE any `$derived` that reads `$form`
   234|3. Use `message()` for business errors, `fail()` for validation errors
   235|
   236|## Rich Text Components
   237|
   238|Based on **Tiptap**. Two components: editor + preview.
   239|
   240|### RichTextEditor
   241|
   242|```svelte
   243|<script lang="ts">
   244|  import { RichTextEditor } from '$lib/components/ui';
   245|  import type { JSONContent } from '@tiptap/core';
   246|
   247|  let content = $state<JSONContent>({ type: 'doc', content: [{ type: 'paragraph' }] });
   248|</script>
   249|
   250|<RichTextEditor
   251|  content={content}
   252|  onUpdate={(json) => { content = json; }}
   253|  placeholder="Describe your product..."
   254|/>
   255|```
   256|
   257|**Props:** `content`, `onUpdate`, `onFocus`, `onBlur`, `editable` (default: true), `placeholder`, `class`
   258|
   259|**Features:** Bold, italic, underline, strikethrough, headings (H1-H3), bullet/ordered lists, blockquote, code block, horizontal rule, undo/redo.
   260|
   261|### RichTextPreview
   262|
   263|Lightweight JSON→HTML renderer. **No Editor instance loaded** — zero runtime cost.
   264|
   265|```svelte
   266|<script lang="ts">
   267|  import { RichTextPreview } from '$lib/components/ui';
   268|  import type { JSONContent } from '@tiptap/core';
   269|</script>
   270|
   271|<RichTextPreview content={data.description} />
   272|```
   273|
   274|**Store content as JSON** in your database (SQLite `text` column with `JSON.stringify`/`JSON.parse`).
   275|
   276|## Adding to the Template
   277|
   278|- **New page:** route in `routes/` → use Skeleton components → use SvelteForge schemas
   279|- **New UI component:** in `components/ui/` → wrap Skeleton → use tokens → export from `index.ts`
   280|- **New theme:** copy `svelteForge.css` + `tokens.css` → change `[data-theme]` name and values
   281|- **New DB table / auth config:** handled by `sv` add-ons, not SvelteForge
   282|