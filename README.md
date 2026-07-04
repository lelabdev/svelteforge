# SvelteForge

A `sv` community addon that provides production-ready SvelteKit boilerplate templates powered by **Skeleton UI v4** and **Tailwind CSS v4**.

## Quick Start

```bash
# Create a new project with SvelteForge
npx sv create my-project --template minimal --types ts --add 'svforge=template:base' --install bun --no-download-check
```

## Templates

| Template | Description |
|----------|-------------|
| `base` | UI kit + layouts + forms + theme (landing, portfolio, marketing) |
| `dashboard` | Base + admin dashboard + Better Auth + Drizzle ORM |

## Modules

| Package | What it adds |
|---------|-------------|
| `svforge` | Base: essential UI + SEO + layouts + theme |
| `@svforge/ui_toast` | Toast notifications (Skeleton Store) |
| `@svforge/dnd` | Drag & drop sortable lists (@thisux/sveltednd) |
| `@svforge/tiptap` | Rich text editor (Tiptap) |
| `@svforge/graph` | Knowledge graph visualization (force-graph) |

## Architecture

- **Model**: shadcn/ui style — source files are copied into the target project, not imported from node_modules
- **Monorepo**: Bun workspaces with separate packages per module
- **Build**: `tsdown` bundles each addon into a single ESM file
- **Templates**: Pre-built at build time via `prebuild.ts` scripts that embed template files as strings

## Development

```bash
bun install              # Install dependencies
bun run build            # Build all packages
bun run build:all        # Build every package individually
bun x vitest run         # Run tests
```

### Build a single module

```bash
cd packages/svforge && bun run build
cd packages/graph && bun run prebuild && bun x tsdown
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
