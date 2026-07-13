# SvelteForge

A `sv` community addon that provides production-ready SvelteKit starter templates powered by **Skeleton UI v4** and **Tailwind CSS v4**.

## Quick Start

```bash
# Base template — UI kit, layouts, theme, forms
npx sv create my-project --template minimal --types ts --add svforge --install bun --no-download-check

# Dashboard template — base + auth + admin + DB
npx sv create my-project --template minimal --types ts --add 'svforge=template:dashboard' --install bun --no-download-check
```

Then:

```bash
cd my-project
bun dev
```

## Templates

| Template | Description |
|----------|-------------|
| `base` | 15+ UI components, layouts, theme, SEO, dark mode |
| `dashboard` | Base + admin dashboard + Better Auth + Drizzle ORM + user management |

### Dashboard testing profiles

The dashboard template includes a **Vitest baseline** by default (`bun run test`).
An opt-in **Playwright** profile adds full browser E2E tests:

```bash
# Dashboard with Playwright E2E profile
npx sv create my-project --template minimal --types ts --add 'svforge=template:dashboard+testing:playwright' --install bun --no-download-check
cd my-project && npx playwright install && bun run test:e2e
```

## Modules

| Package | What it adds |
|---------|-------------|
| `@svforge/ui_toast` | Toast notifications (Skeleton Store) |
| `@svforge/dnd` | Drag & drop sortable lists (@thisux/sveltednd) |
| `@svforge/tiptap` | Rich text editor (Tiptap) |
| `@svforge/graph` | Knowledge graph visualization (force-graph) |
| `@svforge/email` | Transactional emails (Resend) |
| `@svforge/oauth` | Social auth (Google, GitHub) |
| `@svforge/uploads` | File uploads (S3/R2) |
| `@svforge/blog` | Blog/CMS (MDsveX) |

Install modules into an existing project:

```bash
npx sv add @svforge/ui_toast
npx sv add @svforge/tiptap
```

## Architecture

- **Model**: shadcn/ui style — source files are copied into the target project, not imported from `node_modules`
- **Monorepo**: Bun workspaces with separate packages per module
- **Build**: `tsdown` bundles each addon into a single ESM file
- **Templates**: Pre-built at build time via `prebuild.ts` scripts that embed template files as strings

## Development

```bash
bun install              # Install dependencies
bun run build            # Build svforge
bun run build:all        # Build every package
bun run test             # Run tests (sequential — no file parallelism)
```

### Test locally

```bash
cd packages/svforge && bun run build && bun scripts/test-local.ts base /tmp/sf-test
cd /tmp/sf-test && bun install && bun dev
```

## Tech Stack

- **Svelte 5** (runes mode)
- **SvelteKit**
- **Skeleton UI v4** (design system)
- **Tailwind CSS v4**
- **TypeScript**
- **Bun** (runtime + package manager)
- **Better Auth** (dashboard template)
- **Drizzle ORM** (dashboard template)

## License

MIT
