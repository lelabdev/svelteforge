# AGENTS.md — SvelteForge Development Guide

## Project Overview

SvelteForge is a `sv` community addon that scaffolds SvelteKit projects with a pre-built UI component library. It uses **Skeleton UI v4** as the design system and **Tailwind CSS v4** for styling.

## Architecture

```
templates/base/          → Base template (all UI components, layouts, theme)
templates/fullstack/     → Fullstack overlay (auth, admin, DB) — TODO: rebuild
src/modes/base.ts        → Applies base template files via sv.file()
src/modes/fullstack.ts   → Applies base + fullstack overlay
src/index.ts             → Addon entry point
scripts/prebuild.ts      → Generates src/templates.ts from template directories
```

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
- **Minimal variants** — Button keeps 6 variants × 6 colors, Card has 3, rest is flexible via `class`
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
