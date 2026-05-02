# SvelteForge

A production-ready SvelteKit boilerplate with BetterAuth, Drizzle ORM, and Skeleton UI. Everything you need to build a SaaS — auth, database, forms, security — out of the box.

## Quick Start

### Scaffold a new project (recommended)

Uses `sv create` for the latest SvelteKit, then layers SvelteForge on top:

```bash
# Clone the SvelteForge repo
git clone https://github.com/your-org/svelteforge.git
cd svelteforge

# Scaffold a new project (interactive)
bun run scaffold my-project

# Or skip the setup phase
bun run scaffold my-project --no-setup
```

The scaffold asks you which modules to include:

| Mode | What you get |
|------|-------------|
| **Full Stack** | UI + Forms + Auth (BetterAuth) + DB (Drizzle) |
| **Frontend Only** | UI + Forms (no auth, no database) |
| **UI + DB** | UI + Forms + Database (no auth) |

### Use as a GitHub template

```bash
npx degit your-org/svelteforge my-project
cd my-project
bun install
bun run setup
bun dev
```

## What the Scaffold Does

1. **`sv create`** — Fresh SvelteKit project with Tailwind CSS (typography + forms), ESLint, Prettier, Vitest
2. **`sv add drizzle`** — Adds Drizzle ORM only if DB/Auth module is selected
3. **Copies** SvelteForge template files (components, forms, auth, DB layer) based on modules
4. **Installs** only what `sv` doesn't provide (Skeleton UI, BetterAuth, SuperForms, Zod v4, fonts, etc.)
5. **Configures** vite.config.ts, package.json scripts
6. **Setup** (optional) — Creates .env, initializes database, seeds admin user

## Modules

### UI + Forms (always included)

- **18+ Skeleton-based components**: Button, Card, Modal, Toast, DataTable, Tabs, etc.
- **Form components**: FormField, PasswordInput, SubmitButton, Checkbox, Select, TextArea
- **Layout**: AppBar (Navbar), Footer, MobileMenu, ThemeToggle
- **Theme**: Custom `svelteForge` theme with dark mode
- **Fonts**: Inter, Space Grotesk, Manrope, Fira Code via Fontsource
- **Utils**: `cn()`, form error helpers, theme store, slugify
- **Icon wrapper**: Lucide icons via local `<Icon>` component
- **SuperForms + Zod v4**: Validation schemas and form handling

### Auth (optional, requires DB)

- **BetterAuth**: Email/password login & signup
- **Password flow**: Forgot password / reset password
- **Session management** with cookies
- **Admin role system**: First user = admin
- **Rate limiting**: Auth + API endpoints
- **Security headers**: CSP, X-Frame-Options, HSTS, etc.
- **CSRF protection** (SvelteKit built-in)

### Database (optional)

- **SQLite** via `bun:sqlite` (zero-config)
- **Drizzle ORM** with type-safe queries
- **Service layer**: Routes never touch DB directly
- **Lazy-loaded connection**: Runtime-only initialization
- **Easy migration**: Swap to PostgreSQL/Turso (change 2 files)

## Project Structure (Full Stack)

```
src/
├── lib/
│   ├── auth.ts              # BetterAuth server config
│   ├── auth-client.ts       # Client-side auth instance
│   ├── auth-utils.ts        # requireAuth(), requireAdmin()
│   ├── errors.ts            # Error classes
│   ├── logger.ts            # Pino logger
│   ├── components/
│   │   ├── ui/              # 18 reusable Skeleton-based components
│   │   ├── layout/          # AppBar, Footer, navigation
│   │   └── icons/           # Lucide icon wrapper
│   ├── db/
│   │   ├── connection.ts    # SQLite connection
│   │   ├── schemas/         # Drizzle table definitions
│   │   └── index.ts         # DB singleton
│   ├── services/            # Business logic layer
│   ├── schemas/             # Zod validation schemas
│   ├── middleware/           # Rate limiting
│   └── utils/               # cn(), form helpers, theme
├── routes/
│   ├── (public)/            # Login, signup, password reset
│   ├── (protected)/         # Dashboard, admin
│   ├── (legal)/             # Privacy, legal
│   └── api/                 # Auth handler, health check
└── hooks.server.ts          # Auth, security, rate limiting
```

## Adding Features

### New database table

1. Create schema in `src/lib/db/schemas/`
2. Export from `src/lib/db/schemas/index.ts`
3. Create service in `src/lib/services/`
4. Run `bun run db:push`

### New page

1. Create route in `src/routes/`
2. Use service layer for data
3. Use Skeleton components for UI

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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Framework | SvelteKit 2 + Svelte 5 |
| Styling | Tailwind CSS v4 |
| Components | Skeleton UI v4 |
| Auth | BetterAuth (optional) |
| Database | SQLite + Drizzle ORM (optional) |
| Forms | SuperForms + Zod v4 |
| Logging | Pino |
| Icons | Lucide |

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server |
| `bun run build` | Production build |
| `bun check` | TypeScript check |
| `bun run scaffold <name>` | Create new project from template |
| `bun run setup` | Interactive project setup (auth only) |
| `bun run db:push` | Push schema to DB |
| `bun run db:generate` | Generate migration SQL |
| `bun run format` | Format with Prettier |
| `bun run lint` | Lint with ESLint |

## Environment Variables

```bash
DATABASE_URL="data/sqlite.db"           # SQLite database path
BETTER_AUTH_SECRET="..."                # Auth secret (auto-generated by setup)
BASE_URL="http://localhost:5173"        # Public URL
```

## License

MIT
