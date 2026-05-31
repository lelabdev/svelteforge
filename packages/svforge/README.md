# SVForge

**sv community addon** — SvelteKit starter templates built on Skeleton UI v4 and Tailwind CSS v4. Adds production-ready UI components, auth (Better Auth), database (Drizzle + SQLite), and admin dashboard to new SvelteKit projects.

## Install

```bash
# Base template
bunx sv create my-app --template minimal --types ts --add svforge --install bun
cd my-app && bun dev

# Fullstack template (auth + DB + admin)
bunx sv create my-app --template minimal --types ts --add 'svforge=template:dashboard' --install bun
cd my-app && cp .env.example .env && bunx drizzle-kit push && bun dev
```

Or step by step:
```bash
bunx sv create my-app --template minimal --types ts
cd my-app
bunx sv add svforge   # prompts: base or dashboard
```

## What you get — Base

- **15 UI components** — Button, Card, Badge, Avatar, Alert, Input, Select, Textarea, Checkbox, Toggle, Accordion, Tabs, Table, Breadcrumb, ThemeToggle
- **2 layout components** — Navbar (responsive), Footer
- **SVForge theme** — custom oklch color palette
- **Dark/light mode** — auto-detects system preference, manual toggle
- **Demo page** at `/demo-ui`

## What you get — Fullstack

Everything from Base, plus:

- **Better Auth** — email/password, sessions, protected routes
- **Drizzle + SQLite** — schema auto-generated
- **Admin dashboard** (`/admin`) — stats, user CRUD, settings
- **Setup page** (`/setup`) — dev-only, create first admin user

```bash
cp .env.example .env && bunx drizzle-kit push && bun dev
# Visit /setup to create your admin, then /login
```

## Usage

```svelte
<script>
  import { Button, Card, Badge, Alert } from '$lib/components/ui';
</script>

<Button variant="filled" color="primary" size="lg">Get Started</Button>
<Button variant="tonal" color="success">Tonal</Button>
<Button loading={saving}>Saving...</Button>
<Button href="/about">Link Button</Button>

<Badge variant="tonal" color="success">Active</Badge>

<Card variant="elevated">
  <h2>Hello World</h2>
</Card>

<Alert variant="success">Operation completed!</Alert>
```

### Button Props

| Prop | Values | Default |
|------|--------|---------|
| variant | `filled` `outlined` `tonal` `ghost` | `filled` |
| color | `primary` `secondary` `tertiary` `success` `warning` `error` `surface` | `primary` |
| size | `sm` `md` `lg` | `md` |
| loading | `boolean` | `false` |
| disabled | `boolean` | `false` |
| href | `string` | — (renders `<a>` tag) |

### Badge Props

| Prop | Values | Default |
|------|--------|---------|
| variant | `filled` `outlined` `tonal` | `filled` |
| color | `primary` `secondary` `tertiary` `success` `warning` `error` `surface` | `primary` |
| size | `sm` `md` `lg` | `md` |

### Card Props

| Prop | Values | Default |
|------|--------|---------|
| variant | `flat` `elevated` `outlined` | `flat` |

### Alert Props

| Prop | Values | Default |
|------|--------|---------|
| variant | `info` `success` `warning` `error` | `info` |

## Theming

```
src/lib/styles/
├── index.css              ← barrel
├── tokens.css             ← fonts, spacing, radius (@theme block)
└── svelteforge-theme.css  ← oklch colors ([data-theme='svelteForge'])
```

Custom Tailwind utilities: `p-section`, `rounded-card`, `max-w-container`, etc.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Styling | Tailwind CSS v4 + Skeleton UI v4 |
| Auth | Better Auth |
| Database | Drizzle ORM + libsql (SQLite) |
| Icons | Phosphor Icons |
| Build | Vite 8 |

## Development

```bash
bun run build
bun scripts/test-local.ts base /tmp/test
cd /tmp/test && bun install && bun dev
```

## Links

- [npm](https://www.npmjs.com/package/svforge)
- [GitHub](https://github.com/lelabdev/svforge)
- [Org](https://www.npmjs.com/org/svforge)

## License

MIT
