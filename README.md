# SvelteForge

**sv community addon** — SvelteKit starter templates built on Skeleton UI v4 and Tailwind CSS v4. Adds production-ready UI components, auth (Better Auth), database (Drizzle + SQLite), and admin dashboard to new SvelteKit projects.

## Install

SvelteForge is an **sv addon** — it adds UI components and templates to a SvelteKit project.

### New project

```bash
# 1. Scaffold a SvelteKit project
npx sv create my-app --template minimal --types ts
cd my-app

# 2. Add SvelteForge
npx sv add @ludoloops/svelteforge

# 3. Install dependencies and start
npm install
npm run dev
```

### Existing project

```bash
cd my-existing-app
npx sv add @ludoloops/svelteforge
```

The addon prompts for a template:

- **Base** — UI components + theme + layouts (no auth/DB)
- **Fullstack** — Base + Better Auth + Drizzle SQLite + admin dashboard

## Quick Start — Base

After install, you get:

- **15 UI components** — Button, Card, Badge, Avatar, Alert, Input, Select, Textarea, Checkbox, Toggle, Accordion, Tabs, Table, Breadcrumb, ThemeToggle
- **3 layout components** — Navbar (responsive), Footer, AdminLayout (sidebar)
- **SvelteForge theme** — custom oklch color palette (steel blue, burnt orange, soft teal)
- **Demo page** at `/demo-ui` showcasing all components

## Quick Start — Fullstack

Everything from Base, plus:

- **Better Auth** — email/password login, session management, protected routes
- **Drizzle + SQLite** — schema auto-generated, `drizzle-kit push` to create tables
- **Admin dashboard** (`/admin`) — stats cards, user CRUD, settings
- **Auth guard** — redirects to `/login` if no session

### Fullstack setup

```bash
cp .env.example .env    # DATABASE_URL, ORIGIN, BETTER_AUTH_SECRET
npx drizzle-kit push    # Create database tables
npm run dev             # Start dev server
# Visit /login and sign up — first user is admin
```

## Usage

All components use `cn()` (clsx + tailwind-merge) and accept a `class` prop:

```svelte
<script>
  import { Button, Card } from '$lib/components/ui';
</script>

<Button variant="filled" color="primary" size="lg">
  Get Started
</Button>

<Card variant="elevated">
  <h2>Hello World</h2>
</Card>
```

### Button Variants

`filled` · `outlined` · `tonal` · `ghost` · `glass` · `elevated`
Colors: `primary` · `secondary` · `tertiary` · `success` · `warning` · `error`

### Card Variants

`flat` · `elevated` · `outlined`

## Theming

Colors defined as oklch CSS variables in `[data-theme='svelteForge']`. Edit `src/routes/layout.css` to change the palette.

Custom Tailwind utilities via `@theme`:

```css
@theme {
  --font-sans: 'Inter Variable', sans-serif;
  --font-heading: 'Space Grotesk Variable', sans-serif;
  --spacing-section: 2rem;
  --radius-card: 0.75rem;
  --width-container: 80rem;
}
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Styling | Tailwind CSS v4 + Skeleton UI v4 |
| Auth | Better Auth |
| Database | Drizzle ORM + libsql (SQLite) |
| Icons | Phosphor Icons |
| Build | Vite 8 |

## Architecture

```
templates/
├── base/              # UI components + theme + layouts
│   └── src/
│       ├── lib/components/ui/      # 15 components
│       ├── lib/components/layout/  # Navbar, Footer, AdminLayout
│       └── routes/layout.css       # Theme + Tailwind config
└── fullstack/         # Base + auth + DB + admin
    └── src/
        ├── lib/server/auth.ts      # Better Auth config
        ├── lib/server/db/          # Drizzle schema
        ├── routes/login/           # Login page
        └── routes/(app)/admin/     # Dashboard, Users, Settings
```

## Development

```bash
bun install
bun run build                              # prebuild + tsdown
bun scripts/test-local.ts fullstack /tmp/test  # local test
cd /tmp/test && bun install && bun dev
```

## Links

- [npm](https://www.npmjs.com/package/@ludoloops/svelteforge)
- [GitHub](https://github.com/ludoloops/svelteforge)

## License

MIT
