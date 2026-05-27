# SvelteForge

**sv community addon** — UI/UX layer on top of `sv create`. Adds 34 production-ready components, a 3-layer theme system, admin dashboard, notification system, and Zod schemas to SvelteKit projects. Auth (better-auth) and database (Drizzle + SQLite) come from `sv` add-ons.

## Install

```bash
# Full stack (UI + auth + DB)
sv create my-app --template minimal --types ts --add tailwindcss @lelabdev/svelteforge

# Or add to an existing project
cd my-app
sv add @lelabdev/svelteforge
```

The addon prompts for a template mode:

- **Landing Page** — UI components + theme + landing page (no auth/DB)
- **Full Stack** — UI + dashboard + auth + DB (via sv add-ons)

## Post-Install

```bash
cd my-app
bun dev   # → http://localhost:5173
```

`sv create` handles `.env` generation (auth secret, DB path). No extra setup step needed.

## What's Included

### Full Stack Mode

| Layer | Technology |
|-------|-----------|
| Framework | **SvelteKit 2** + **Svelte 5** (runes) |
| Styling | **Tailwind CSS v4** + **Skeleton UI v4** |
| Auth | via **sv add-on** (better-auth — email/password, admin plugin, sessions) |
| Database | via **sv add-on** (SQLite `libsql` + Drizzle ORM) |
| Forms | **SuperForms v2** + **Zod v4** |
| Rich Text | **Tiptap** — editor & preview |
| Icons | **Phosphor** (via Icon wrapper component) |
| Logging | **Pino** |
| Testing | **Vitest** + `@testing-library/svelte` |

### 34 UI Components

All theme-aware, built on Skeleton UI v4:

**Surfaces** — Card, AuthCard, Modal, Sheet, PopOver, Carousel
**Feedback** — Toast, ErrorAlert, SuccessAlert, Loader, Progress, SkeletonLoader, NavigationLoader
**Navigation** — Tabs, Breadcrumb, Stepper, Menu
**Data** — DataTable, EmptyState, NotificationBadge, Badge, Avatar
**Controls** — Button, Switch, Divider, Accordion, Tooltip, RadioGroup, SearchInput, ThemeToggle, ConfirmDialog
**Forms** — Input, PasswordInput (with strength meter), TextArea, Select, Checkbox, FormField, SubmitButton
**Rich Text** — RichTextEditor, RichTextPreview

### Admin Dashboard (Full Stack only)

Full admin area with collapsible sidebar:

- **User Management** — DataTable with search, role filter, pagination, role change
- **Settings** — Tabbed config (General, Auth, Notifications)
- **Notifications** — Create + manage notifications for users
- **Role Guard** — Admin-only access enforced at layout level

### Theme System

Three-layer theming — change the look without touching components:

| Layer | File | Purpose |
|-------|------|---------|
| Colors | `svelteForge.css` | 7 domains × 10 shades (oklch) |
| Spacing | `tokens.css` | 60+ semantic tokens (padding, radius, sizing, typography) |
| Fonts | `fonts.css` | Inter, Space Grotesk, Manrope, Fira Code |

**To create a theme:** copy `svelteForge.css` + `tokens.css`, change the `[data-theme]` name and values. Done. Every component adapts automatically.

### What SvelteForge Adds vs. `sv create`

| | `sv create` | + SvelteForge |
|--|:-----------:|:-------------:|
| SvelteKit + Tailwind + ESLint + Prettier | ✓ | ✓ |
| Auth (better-auth) | ✓ (add-on) | ✓ |
| Database (Drizzle + SQLite) | ✓ (add-on) | ✓ |
| 34 UI components | — | ✓ |
| 3-layer theme system | — | ✓ |
| Layout (Navbar, Footer, MobileMenu, AuthButtons) | — | ✓ |
| Admin dashboard (sidebar, users, settings, notifications) | — | ✓ |
| Zod validation schemas | — | ✓ |
| Utils (cn, formatters, theme store) | — | ✓ |
| Tests (Vitest + testing-library) | — | ✓ |

### Project Structure (Generated)

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # 34 components
│   │   ├── layout/          # Navbar, Footer, AuthButtons, MobileMenu, AdminSidebar
│   │   └── icons/           # Phosphor wrapper (Icon.svelte)
│   ├── schemas/             # Zod v4 validation
│   ├── stores/              # notification-store.svelte.ts
│   ├── styles/              # Theme + tokens + fonts
│   └── utils/               # cn, formatters, theme store
├── routes/
│   ├── (public)/            # login, signup
│   ├── (protected)/         # dashboard
│   │   └── admin/           # sidebar layout, users, settings, notifications
│   └── (legal)/             # privacy, legal
└── tests-setup.ts           # Vitest + jest-dom setup
```

Auth config, DB connection, Drizzle schemas, `hooks.server.ts`, and API routes are provided by `sv` — SvelteForge does not override them.

## Modes

| Mode | UI + Forms | Auth + DB |
|------|:----------:|:---------:|
| **Full Stack** (default) | ✓ | ✓ (via sv) |
| **Landing Page** | ✓ | ✗ |

## Architecture

SvelteForge is an **sv community addon**. It uses the `sv` addon API (`defineAddon`, `sv.dependency()`, `sv.file()`) to inject files and dependencies into the user's project.

```
svelteforge/                  ← this repo (addon package)
├── src/
│   ├── index.ts              ← defineAddon() entry point
│   ├── templates.ts          ← auto-generated (file contents as JSON)
│   └── modes/
│       ├── fullstack.ts      ← fullstack file injection logic
│       └── landing.ts        ← landing file injection + filtering
├── templates/
│   ├── fullstack/            ← fullstack mode source files
│   └── landing/              ← landing mode source files
├── scripts/
│   └── prebuild.ts           ← reads templates/ → generates src/templates.ts
├── tsdown.config.ts          ← bundler (bundles everything into dist/index.js)
├── package.json              ← @lelabdev/svelteforge
├── AGENTS.md
└── README.md
```

### Build pipeline

1. `bun run prebuild` — reads `templates/` directories, inlines all file contents into `src/templates.ts`
2. `tsdown` — bundles `src/index.ts` + modes + templates into a single `dist/index.js`
3. Published on npm as `@lelabdev/svelteforge`

## Development

```bash
# Build the addon
bun run build

# Test locally with bun link
bun link
mkdir /tmp/test-app && cd /tmp/test-app
sv create my-app --template minimal --types ts --add tailwindcss @lelabdev/svelteforge
cd my-app
bun dev
```

## Requirements

- [Bun](https://bun.sh) >= 1.0.0
- [sv](https://github.com/sveltejs/cli) >= 0.13.0

## License

MIT
