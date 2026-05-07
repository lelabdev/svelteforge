# SvelteForge

UI/UX layer on top of `sv create`. SvelteForge adds 34 production-ready components, a three-layer theme system, layout primitives, admin dashboard, and Zod schemas — while `sv` handles SvelteKit, Tailwind, auth (better-auth), and database (Drizzle + SQLite).

## Quick Start

```bash
# Clone and scaffold
git clone https://github.com/lelabdev/svelteforge
cd svelteforge
bunx create-svelteforge my-project --fullstack

# Or once published on npm:
bunx create-svelteforge my-project
```

## Post-Install

```bash
cd my-project
bun dev                # → http://localhost:5173
```

`sv create` handles `.env` generation (auth secret, DB path). No extra setup step needed.

## CLI Options

```bash
bunx create-svelteforge <project-name-or-path> [options]

Options:
  --fullstack, -f   Full Stack mode (UI + Auth + DB via sv)
  --landing, -l     Landing Page mode (UI only, no auth/DB)
  --help, -h        Show help

Examples:
  bunx create-svelteforge my-app --fullstack      # Full Stack
  bunx create-svelteforge my-app --landing        # Landing Page
  bunx create-svelteforge my-app                  # Interactive mode
```

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

### Admin Dashboard

Full admin area with collapsible sidebar:

- **User Management** — DataTable with search, role filter, pagination, role change
- **Settings** — Tabbed config (General, Auth, Notifications)
- **Notifications** — Create + manage notifications for users
- **Role Guard** — Admin-only access enforced at layout level

### Notification System

- Admin creates notifications (target: all users, admins, or specific user)
- Users see unread count badge in navbar
- Notification panel (Sheet) with mark as read, mark all, dismiss

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

Auth config, DB connection, Drizzle schemas, `hooks.server.ts`, and API routes are provided by `sv` — SvelteForge doesn't override them.

## Modes

| Mode | UI + Forms | Auth + DB |
|------|:----------:|:---------:|
| **Full Stack** (default) | ✓ | ✓ (via sv) |
| **Landing Page** | ✓ | ✗ |

## Scaffold Flow

1. `sv create` — base SvelteKit + Tailwind + ESLint + Prettier (+ better-auth + Drizzle if Full Stack)
2. SvelteForge copies template — components, layouts, schemas, theme, routes
3. `bun install` — all dependencies
4. Done — `bun dev` to start

## Development

```bash
# Test the CLI locally
bunx create-svelteforge test-project --fullstack

# Interactive mode
bunx create-svelteforge test-project
```

## Requirements

- [Bun](https://bun.sh) >= 1.0.0

## License

MIT
