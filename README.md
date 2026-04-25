# SvelteForge

Production-ready SvelteKit boilerplate generator with BetterAuth, Drizzle ORM, and Skeleton UI.

## Quick Start

```bash
# Clone and scaffold (recommended while not on npm)
git clone https://github.com/lelabdev/svelteforge && cd svelteforge
bun run cli.ts my-project --full-stack --yes

# Or use the CLI directly
bun run cli.ts <project-name-or-path> [options]
```

## CLI Options

```
bun run cli.ts <project-name-or-path> [options]

Options:
  --full-stack    Full Stack mode (UI + Auth + DB)
  --landing       Landing Page mode (UI only)
  --yes, -y       Accept setup automatically
  --no-setup      Skip setup entirely
  --help, -h      Show help

Examples:
  bun run cli.ts my-app --full-stack --yes           # Full Stack, auto setup
  bun run cli.ts /home/dev/project --landing         # Landing Page, custom path
  bun run cli.ts my-app --no-setup                   # Skip .env/DB setup
  bun run cli.ts my-app                               # Interactive mode
```

> **Note:** While SvelteForge is not yet published on npm, clone the repo and use `bun run cli.ts` instead of `bunx create-svelteforge`.

## Modes

| Mode | UI + Forms | Auth + DB |
|------|:----------:|:---------:|
| **Full Stack** (default) | ✓ | ✓ |
| **Landing Page** | ✓ | ✗ |

## Stack

- **SvelteKit 2** + **Svelte 5** (runes)
- **Tailwind CSS v4** + **Skeleton UI v4**
- **BetterAuth** — email/password, admin plugin
- **SQLite** (`bun:sqlite`) + **Drizzle ORM**
- **SuperForms** + **Zod v4**
- **Tiptap** — rich text editor & preview
- **Pino** logging
- **Lucide** icons

## Structure

```
svelteforge/            ← this repo
├── cli.ts              ← CLI generator
├── package.json        ← create-svelteforge package
├── AGENTS.md           ← AI agent instructions
├── template/           ← files copied to new projects
│   ├── src/
│   ├── scripts/
│   └── ...
└── .gitignore
```

## Scaffold Flow

1. `sv create` → base SvelteKit + Tailwind + ESLint + Prettier
2. `sv add vitest` → testing framework
3. `bun add drizzle-orm` → DB deps (Full Stack only)
4. SvelteForge → Skeleton UI, components, forms, auth layer, etc.

## Development

```bash
# Test locally
bun run cli.ts test-project --full-stack --yes

# Interactive mode
bun run cli.ts test-project
```

## License

MIT
