# SVForge

**sv community addon** — SvelteKit starter boilerplate built on Skeleton UI v4 and Tailwind CSS v4. Ships with a clean UI kit, layouts, theme, and optional admin dashboard with Better Auth + Drizzle ORM.

## Install

```bash
# Base template (UI kit + layouts + theme)
bunx sv create my-app --template minimal --types ts --add svforge --install bun --no-download-check
cd my-app && bun dev

# Dashboard template (base + auth + DB + admin)
bunx sv create my-app --template minimal --types ts --add 'svforge=template:dashboard' --install bun --no-download-check
cd my-app && bash scripts/setup.sh && bun dev
```

Or add to an existing project:
```bash
bunx sv add svforge   # prompts: base or dashboard
```

## What you get

### Base Template

- **15+ UI components** — Button, Card, Badge, Avatar, Alert, Input, Select, Textarea, Checkbox, Toggle, Accordion, Tabs, Table, Breadcrumb
- **3 layout components** — Navbar, Footer, ThemeToggle
- **3 utilities** — Logo, Seo, generateSitemap()
- **SVForge theme** — custom oklch color palette with 7 color families
- **Dark/light mode** — auto-detects system preference, manual toggle
- **Demo page** at `/demo-ui`

### Dashboard Template

Everything in Base, plus:

- **Better Auth** — email/password, session management
- **Drizzle ORM** — SQLite with user/session/account/verification schema
- **Admin dashboard** — stats, user management (CRUD), settings
- **Zod validation** — type-safe schemas on all server actions
- **Setup script** — `bash scripts/setup.sh` (generates secret, inits DB)
- **Pre-configured** — drizzle.config.ts, .env.example, tsconfig

## Module Addons

| Package | What it adds |
|---------|-------------|
| `@svforge/ui_toast` | Toast notifications |
| `@svforge/dnd` | Drag & drop sortable lists |
| `@svforge/tiptap` | Rich text editor |
| `@svforge/graph` | Knowledge graph visualization |

## License

MIT
