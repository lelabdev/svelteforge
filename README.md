# SvelteForge

Production-ready SvelteKit boilerplate generator. Auth, DB, UI — everything wired up, ready to deploy.

## Quick Start

```bash
# Clone and scaffold
git clone https://github.com/lelabdev/svelteforge
cd svelteforge
bun run cli.ts my-project --full-stack --yes

# Or once published on npm:
bunx create-svelteforge my-project
```

That's it. You get a running SvelteKit app with auth, database, 34 UI components, and a theme system.

## Post-Install

```bash
cd my-project
bun run setup          # Creates .env (auth secret, DB path), initializes SQLite
bun dev                # Start dev server → http://localhost:5173
```

**First user to sign up becomes admin automatically.**

## CLI Options

```bash
bun run cli.ts <project-name-or-path> [options]

Options:
  --full-stack    Full Stack mode (UI + Auth + DB)
  --landing       Landing Page mode (UI only, no auth/DB)
  --yes, -y       Accept setup automatically
  --no-setup      Skip setup entirely
  --help, -h      Show help

Examples:
  bun run cli.ts my-app --full-stack --yes     # Full Stack, auto setup
  bun run cli.ts my-app --landing --no-setup   # Landing Page, skip setup
  bun run cli.ts my-app                        # Interactive mode
```

## What's Included

### Full Stack Mode

| Layer | Technology |
|-------|-----------|
| Framework | **SvelteKit 2** + **Svelte 5** (runes) |
| Styling | **Tailwind CSS v4** + **Skeleton UI v4** |
| Auth | **BetterAuth** — email/password, admin plugin, session management |
| Database | **SQLite** (`bun:sqlite`) + **Drizzle ORM** |
| Forms | **SuperForms v2** + **Zod v4** |
| Rich Text | **Tiptap** — editor & preview |
| Icons | **Lucide** (via Icon wrapper component) |
| Logging | **Pino** |
| Testing | **Vitest** (configured, ready to write tests) |

### 34 UI Components

All theme-aware, built on Skeleton UI v4:

**Surfaces** — Card, AuthCard, Modal, Sheet, PopOver, Carousel
**Feedback** — Toast, ErrorAlert, SuccessAlert, Loader, Progress, SkeletonLoader, NavigationLoader
**Navigation** — Tabs, Breadcrumb, Stepper, Menu
**Data** — DataTable, EmptyState, NotificationBadge, Badge, Avatar
**Controls** — Button, Switch, Divider, Accordion, Tooltip, RadioGroup, SearchInput, ThemeToggle, ConfirmDialog
**Forms** — Input, PasswordInput (with strength meter), TextArea, Select, Checkbox, FormField, SubmitButton
**Rich Text** — RichTextEditor, RichTextPreview

### Theme System

Three-layer theming — change the look without touching components:

| Layer | File | Purpose |
|-------|------|---------|
| Colors | `svelteForge.css` | 7 domains × 10 shades (oklch) |
| Spacing | `tokens.css` | 60+ semantic tokens (padding, radius, sizing, typography) |
| Fonts | `fonts.css` | Inter, Space Grotesk, Manrope, Fira Code |

**To create a theme:** copy `svelteForge.css` + `tokens.css`, change the `[data-theme]` name and values. Done. Every component adapts automatically.

### Auth Routes

Ready to go:

- `/login` — email/password with SuperForms validation
- `/signup` — with password strength meter
- `/forgot-password` — reset request
- `/reset-password` — token-based reset
- `/logout` — POST endpoint
- `/dashboard` — protected, shows user info
- `/admin` — admin-only, separate layout without navbar/footer

### Project Structure (Generated)

```
src/
├── lib/
│   ├── auth.ts              # BetterAuth server (lazy Proxy singleton)
│   ├── auth-client.ts       # Client-side auth hook
│   ├── components/
│   │   ├── ui/              # 34 components
│   │   ├── layout/          # Navbar, Footer, AuthButtons, MobileMenu
│   │   └── icons/           # Lucide wrapper
│   ├── db/                  # SQLite + Drizzle schemas
│   ├── services/            # Business logic (routes NEVER access DB directly)
│   ├── schemas/             # Zod v4 validation
│   ├── styles/              # Theme + tokens + fonts
│   └── utils/               # cn, formatters, theme store
├── routes/
│   ├── (public)/            # login, signup, forgot/reset-password
│   ├── (protected)/         # dashboard, admin
│   └── api/                 # auth, health
└── hooks.server.ts          # Auth session, rate limiting, CSP
```

## Modes

| Mode | UI + Forms | Auth + DB |
|------|:----------:|:---------:|
| **Full Stack** (default) | ✓ | ✓ |
| **Landing Page** | ✓ | ✗ |

## Scaffold Flow

1. `sv create` — base SvelteKit + Tailwind + ESLint + Prettier
2. `sv add vitest` — testing framework
3. SvelteForge copies template — components, auth, schemas, services, theme
4. `bun install` — all dependencies
5. Optional `setup.ts` — generates `.env`, creates DB

## Development

```bash
# Test the CLI locally
bun run cli.ts test-project --full-stack --yes

# Interactive mode
bun run cli.ts test-project
```

## Requirements

- [Bun](https://bun.sh) >= 1.0.0

## License

MIT
