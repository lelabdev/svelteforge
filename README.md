# SvelteForge

**sv community addon** — SvelteKit starter templates built on Skeleton UI v4 and Tailwind CSS v4. Adds production-ready UI components, auth (Better Auth), database (Drizzle + SQLite), and admin dashboard to new SvelteKit projects.

## Install

```bash
# One-liner
npx sv create my-app --template minimal --types ts --add '@ludoloops/svelteforge=template:base' --install bun
cd my-app && bun dev
```

Or step by step:
```bash
npx sv create my-app --template minimal --types ts
cd my-app
npx sv add @ludoloops/svelteforge   # prompts: base or fullstack
```

## What you get — Base

- **15 UI components** — Button, Card, Badge, Avatar, Alert, Input, Select, Textarea, Checkbox, Toggle, Accordion, Tabs, Table, Breadcrumb, ThemeToggle
- **2 layout components** — Navbar (responsive), Footer
- **SvelteForge theme** — custom oklch color palette
- **Demo page** at `/demo-ui`

## What you get — Fullstack

Everything from Base, plus:

- **Better Auth** — email/password, sessions, protected routes
- **Drizzle + SQLite** — schema auto-generated
- **Admin dashboard** (`/admin`) — stats, user CRUD, settings

```bash
cp .env.example .env && npx drizzle-kit push && bun dev
# Visit /login — first user is admin
```

## Usage

```svelte
<script>
  import { Button, Card, Badge, Alert } from '$lib/components/ui';
</script>

<Button variant="filled" color="primary" size="lg">Get Started</Button>
<Button variant="gradient" color="primary">Gradient</Button>
<Button variant="glass" color="secondary">Glass</Button>
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
| variant | `filled` `outlined` `tonal` `ghost` `glass` `elevated` `gradient` | `filled` |
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

- [npm](https://www.npmjs.com/package/@ludoloops/svelteforge)
- [GitHub](https://github.com/ludoloops/svelteforge)

## License

MIT
