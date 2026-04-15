# SvelteForge

Production-ready SvelteKit boilerplate generator with BetterAuth, Drizzle ORM, and Skeleton UI.

## Quick Start

```bash
bun run scaffold.ts my-project
```

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
- **Pino** logging
- **Lucide** icons

## Structure

```
svelteforge/            ← this repo
├── scaffold.ts         ← CLI generator
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
# Test the scaffold
bun run scaffold.ts test-project

# With specific mode (interactive prompt)
bun run scaffold.ts test-project --no-setup
```

## License

MIT
