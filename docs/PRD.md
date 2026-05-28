# PRD — SvelteForge as sv Community Addon

## Summary

Refactor SvelteForge from a custom CLI (`cli.ts` + file copy lists) to a native **sv community addon** (`sv add @ludoloops/svelteforge`). This eliminates manual file tracking, leverages sv's dependency/file management, and enables future template modes.

## Problem

The current CLI (`create-svelteforge`) wraps `sv create` then copies template files via hardcoded file lists (`SHARED_FILES`, `FULLSTACK_FILES`, `ROUTE_FILES`). This approach is fragile:

- **Missing files bug**: `src/lib/stores/` was absent from `SHARED_FILES`, causing ENOENT on every generated project (#64).
- **Manual dependency management**: Merges `package.json` by hand instead of using sv's API.
- **No extensibility**: Adding a new template mode requires editing multiple arrays and copy logic.
- **Non-standard**: Users must learn a separate CLI instead of the standard `sv` flow.

## Solution

Publish SvelteForge as an **sv community addon** on npm. Users install it via the standard sv workflow:

```bash
sv create my-app --template minimal --types ts --add tailwindcss @ludoloops/svelteforge
# or
sv create my-app --template minimal
cd my-app
sv add @ludoloops/svelteforge
```

## Architecture

### Package structure

```
svelteforge/                  ← this repo (becomes the addon package)
├── src/
│   └── index.ts              ← defineAddon() entry point
├── templates/
│   ├── landing/              ← Landing mode files (UI only)
│   └── fullstack/            ← Fullstack mode files (UI + dashboard + auth)
├── tsdown.config.ts          ← bundler config
├── package.json              ← @ludoloops/svelteforge
├── AGENTS.md
└── README.md
```

### Addon definition

```typescript
import { defineAddon, defineAddonOptions } from 'sv';

export default defineAddon({
  id: 'svelteforge',
  alias: 'forge',
  shortDescription: 'SvelteForge — themed UI kit + layouts for SvelteKit',

  options: defineAddonOptions()
    .add('template', {
      question: 'Which SvelteForge template?',
      type: 'select',
      options: [
        { value: 'landing', label: 'Landing Page — UI only' },
        { value: 'fullstack', label: 'Full Stack — dashboard + auth + DB' }
      ]
    })
    .build(),

  setup: ({ dependsOn, unsupported, isKit }) => {
    if (!isKit) unsupported('SvelteForge requires SvelteKit');
    dependsOn('tailwindcss');
  },

  run: ({ sv, options, directory }) => {
    // 1. Dependencies
    sv.dependency('@skeletonlabs/skeleton-svelte', '^2.x');
    sv.dependency('@skeletonlabs/skeleton-cli-theme', '^0.x');
    // ... all SvelteForge deps

    // 2. Shared files (components, styles, utils, stores)
    // Copy via sv.file() for each template file

    // 3. Template-specific files (routes, layouts)
    // Based on options.template value

    // 4. Config modifications (vite.config, app.css, app.html)
  },

  nextSteps: ({ options }) => [
    `SvelteForge ${options.template} template applied!`,
    'Run `bun dev` to start developing.'
  ]
});
```

### Templates

| Template | UI Components | Dashboard | Auth + DB | Routes |
|----------|:---:|:---:|:---:|---|
| **Landing** | ✅ | ❌ | ❌ | Home, Legal |
| **Full Stack** | ✅ | ✅ | ✅ (via sv addons) | Home, Dashboard, Admin, Legal |
| **E-commerce** | 🔜 | 🔜 | 🔜 | Later |

### Key behaviors

- **`sv.file()` for every file** — no more directory copy with manual lists. Each file is explicit.
- **`sv.dependency()`** — sv handles the install. No more `package.json` merging.
- **`setup.dependsOn('tailwindcss')`** — enforces that Tailwind is present before SvelteForge runs.
- **`runsAfter('drizzle')` / `runsAfter('better-auth')`** — ensures sv's auth/DB addons run first for fullstack mode.
- **Bundled via tsdown** — all template files are bundled into a single `.mjs`. No `dependencies` field (sv requirement).

## Migration plan

### Phase 1 — Addon setup

1. Create `src/index.ts` with `defineAddon()` skeleton
2. Create `tsdown.config.ts` for bundling
3. Update `package.json`:
   - `name`: `@ludoloops/svelteforge`
   - `peerDependencies`: `sv: ^0.13.0`
   - `keywords`: `["sv-add", "svelte", "sveltekit"]`
   - `exports`: `{ ".": { "default": "./dist/index.mjs" } }`
4. Move template files from `template-fullstack/` and `template-landing/` into embeddable structure
5. Implement `run()` for Landing mode (simpler, no auth)

### Phase 2 — Fullstack mode

1. Add fullstack template files to the addon
2. Handle auth/DB dependency detection (check if `drizzle` and `better-auth` were installed)
3. Wire up the admin routes, dashboard, protected layouts

### Phase 3 — Publish & cleanup

1. Publish `@ludoloops/svelteforge` to npm
2. Remove old `cli.ts` and `create-svelteforge` package
3. Update README with new install flow
4. Close #64

### Phase 4 — E-commerce (later)

1. Add e-commerce template option
2. Product catalog, cart, checkout routes
3. Separate issue/PRD when specs are ready

## Constraints

- **No dependencies** in package.json — everything bundled (sv addon requirement)
- **sv as peerDependency** — not a regular dependency
- **Experimental API** — sv addon API may change between versions
- **File-by-file approach** — no bulk directory copy, each file must be declared via `sv.file()`

## Success criteria

- [ ] `sv create app && cd app && sv add @ludoloops/svelteforge` works without errors
- [ ] Both Landing and Fullstack modes produce working dev servers
- [ ] No ENOENT errors — all referenced files are present
- [ ] Dependencies installed automatically by sv
- [ ] Published on npm with `sv-add` keyword
