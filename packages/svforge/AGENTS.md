# AGENTS.md — SvelteForge Development Guide

## Project Overview

SvelteForge is a `sv` community addon that scaffolds SvelteKit projects with a pre-built UI component library. It uses **Skeleton UI v4** as the design system and **Tailwind CSS v4** for styling.

## Architecture

```
templates/base/          → Base template (essential UI components, layouts, theme)
templates/dashboard/     → Fullstack overlay (auth, admin, DB)
src/modes/base.ts        → Applies base template files via sv.file()
src/modes/dashboard.ts   → Applies base + fullstack overlay
src/index.ts             → Addon entry point
scripts/prebuild.ts      → Generates src/templates.ts from template directories
```

## File Structure (generated project)

```
src/lib/components/
├── svforge/                ← all SVForge modules (namespaced)
│   ├── ui/                ← UI components, flat (no subfolders)
│   │   ├── Button.svelte  ← comes with base
│   │   ├── Card.svelte
│   │   ├── Badge.svelte
│   │   ├── Toast.svelte   ← added by @svforge/ui_toast
│   │   ├── Modal.svelte   ← added by @svforge/ui_modal
│   │   └── ...            ← each atomic component = separate npm package
│   ├── tiptap/            ← added by @svforge/tiptap
│   ├── charts/            ← added by @svforge/charts
│   └── ...
└── ...                    ← user's own components (safe to modify)
```

- `svforge/` = installed modules. Modules import from here.
- `ui/` is flat. Each atomic component installed separately.
- Complex modules (tiptap, charts) get their own folder.
- User can modify colors/presets in svforge/ files, but structure stays intact.
- If something breaks after modifying svforge/, user knows why.

## Module Architecture

Each module is an npm package installable via `sv add`. Files are copied into the project (shadcn model).

| Package | What it adds |
|---------|-------------|
| `svforge` | Base: essential UI + SEO + layouts + theme |
| `@svforge/ui_toast` | Toast.svelte (atomic) |
| `@svforge/ui_toast` | Toast.svelte (atomic) |
| `@svforge/tiptap` | Rich text editor |
| `@svforge/dnd` | Drag & drop |
| `@svforge/graph` | Knowledge graph visualization |

## Commands

```bash
bun run build          # prebuild + tsdown → dist/index.js
bun run prebuild       # regenerate src/templates.ts only
bun publish            # publish to npm
```

### Test locally (no npm publish needed)

```bash
bun run build
bun scripts/test-local.ts base /tmp/sf-test
cd /tmp/sf-test && bun install && bun dev
```

## Component Conventions

- **Every component** wraps Skeleton UI classes/presets — not raw CSS
- **`cn()` + `class` prop** on every component for class merging/override
- **`HTMLAttributes<T>`** from `svelte/elements` for extending native HTML attributes
- **`$bindable()`** for two-way binding (value, checked) — must be declared in the Props interface
- **Minimal variants** — Button has 4 variants (filled, outlined, tonal, ghost) × 7 colors, Card has 3, rest is flexible via `class`
- **Phosphor icons** — import from `phosphor-svelte/lib/IconName` (no `.svelte` extension)

## Theme

- Colors: oklch variables in `[data-theme='svelteForge']` block in `layout.css`
- Custom Tailwind utilities via `@theme` block: spacing, radius, widths
- Fonts: Inter (body), Space Grotesk (headings), Fira Code (code)

## Pitfalls

- `sv create` requires explicit syntax for plugins: `'tailwindcss=plugins:typography,forms'`
- `HTMLDivAttributes` / `HTMLSpanAttributes` don't exist in Svelte 5.56 — use `HTMLAttributes<HTMLDivElement>`
- `HTMLAttributes<HTMLImageElement>` doesn't include `src`/`alt` — define them explicitly in Props
- `$bindable()` props MUST be declared in the interface, not just destructured
- Phosphor imports: `phosphor-svelte/lib/Sun` (not `phosphor-svelte/lib/icons/Sun`)
- Skeleton classes: `btn`, `input`, `select`, `textarea`, `checkbox`, `toggle`, `badge`, `card`, `alert-*`, `preset-*`, `variant-*`

## Full Framework Documentation

- `docs/llms-svelte.txt` — Svelte 5 + SvelteKit reference (802 KB)
- `docs/llms-skeleton.txt` — Skeleton UI v4 reference (695 KB)
