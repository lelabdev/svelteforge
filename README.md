# SvelteForge

A `sv` community addon that scaffolds production-ready SvelteKit boilerplates powered by **Skeleton UI v5** and **Tailwind CSS v4**.

**Not a component library. Not a shadcn clone.** SvelteForge gives you the essentials — buttons, inputs, selects, cards, theme, SEO, layouts — so you start fast and own everything. Need richer components (dialogs, tabs, tooltips…)? Use the official `@skeletonlabs/skeleton-svelte` components directly. Need more? Pick 2–3 opt-in modules, not a framework.

## What SvelteForge adds to `sv create`

| | `sv create` (plain) | SvelteForge |
|---|---|---|
| SvelteKit + TypeScript + Vite | ✅ | ✅ |
| Theme (light/dark, oklch, fonts) | ❌ | ✅ |
| UI kit essentials (btn, input, card, badge, table, alert) | ❌ | ✅ |
| Layouts (navbar, footer, seo, sitemap) | ❌ | ✅ |
| Admin dashboard + auth + DB (dashboard template) | ❌ | ✅ |
| Test baseline (vitest / playwright) | ❌ | ✅ |
| i18n Paraglide FR/EN (compiler-first) | ❌ | ✅ |
| AI-ready AGENTS.md scaffolded | ❌ | ✅ |

## Screenshots

**Login** | **Dashboard admin**
:---:|:---:
![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png)

**User management**

![Users](docs/screenshots/users.png)

> Screenshots are generated from a fresh scaffold of the dashboard template.

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
| `base` | UI kit essentials + layouts + theme + SEO + dark mode |
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

<!-- MODULES-TABLE:START -->
| Package | What it adds | Requires | Optional integrations |
|---------|--------------|----------|----------------------|
| `@svforge/ui_toast` | Toast notifications (Skeleton Toast) | base | — |
| `@svforge/dnd` | Drag & drop sortable lists | base | — |
| `@svforge/tiptap` | Rich text editor (Tiptap, toolbar + preview) | base | — |
| `@svforge/graph` | Knowledge graph visualization (force-graph) | base | — |
| `@svforge/email` | Transactional emails (Resend) | base | — |
| `@svforge/oauth` | Social auth buttons (Google, GitHub) | **dashboard** | — |
| `@svforge/uploads` | File uploads (S3/R2, presigned, security test pack opt-in) | base | testpack |
| `@svforge/blog` | MDsveX blog (posts + list + detail) | base | — |
| `@svforge/realtime` | WebSocket transport (publish/subscribe, channels isolés) | base | — |
| `@svforge/audit` | Business action audit trail (append-only) | **dashboard** | — |
| `@svforge/notifications` | Persistent business notifications (read/unread) | **dashboard** | realtime, email |
| `@svforge/jobs` | Background job foundation (retry, progress, backend encapsulé) | **dashboard** | realtime, notifications, email |
| `@svforge/chat` | Composable app chat (conversations, messages, read-state) | **dashboard** | realtime, uploads, notifications |
<!-- MODULES-TABLE:END -->


Install modules into an existing project:

```bash
npx sv add @svforge/realtime
npx sv add @svforge/audit
npx sv add @svforge/notifications
npx sv add @svforge/jobs
npx sv add @svforge/chat
```

**Requires** is the template you must scaffold first (`base` or `dashboard`).
**Optional integrations** compose with other modules without re-implementing
infrastructure (e.g. `notifications` can push via `realtime`/`email`, `chat`
can attach files via `uploads`).

### Example composition — app chat with live updates

```bash
# dashboard (auth + admin + DB PostgreSQL) + chat + realtime + uploads + notifications
npx sv create my-app --template minimal --types ts \
  --add 'svforge=template:dashboard+testing:vitest' \
  --add '@svforge/chat @svforge/realtime @svforge/uploads @svforge/notifications' \
  --install bun --no-download-check
cd my-app && bash scripts/setup.sh && bun dev
```

- `/chat` — conversations, messages, read-state (membership-enforced server-side)
- `realtime` — live `message.created` pushes on `conversation:{id}`
- `uploads` — attachments via the existing presigned endpoint (no second upload system)
- `notifications` — alert non-active participants
- Works without realtime too (classic form/refetch)

For anything else, reach for [`@skeletonlabs/skeleton-svelte`](https://skeleton.dev) — 30+ production components (accordion, tabs, dialog, date-picker…) that pair naturally with the base kit.

## Presets (#236)

Presets are **composition recipes** (meta-packages) — they never duplicate module code. Get the recipe with `svforge preset <name>`, then run it with `sv add`:

<!-- PRESETS-TABLE:START -->
| Preset | Description | Requires | Composition |
|--------|-------------|----------|-------------|
| `saas` | Dashboard SaaS de départ : auth + admin + email + uploads | **dashboard** | email + uploads (optional: tiptap, oauth, dnd) |
| `community` | Site communautaire : base + blog + toast | base | blog + ui_toast (optional: tiptap, graph) |
<!-- PRESETS-TABLE:END -->
```bash
npx svforge preset saas
# → sv add svforge=template:dashboard+testing:vitest @svforge/email @svforge/uploads
```

## Architecture

- **Model**: shadcn/ui style — source files are copied into the target project, not imported from node_modules. You own the code.
- **Monorepo**: Bun workspaces, one package per module
- **Build**: `tsdown` bundles each addon into a single ESM file; `prebuild` embeds template files as strings
- **Base is intentionally small**: essentials only — richer components come from Skeleton
- **Design-system harness (#240)**: every scaffold ships `svforge-catalog.json` (machine-readable catalog) + `svforge-check.mjs` (`node svforge-check.mjs` — flags second UI kits and duplicated Skeleton primitives as ERROR)

## Development

```bash
bun install              # Install dependencies
bun run build            # Build svforge (prebuild + tsdown)
bun run build:all        # Build every package
bun run test             # Run the test suite
```

### Build a single module

```bash
cd packages/graph && bun run build
```

### Test locally (no npm publish)

```bash
cd packages/svforge && bun run build && bun scripts/test-local.ts base /tmp/sf-test
cd /tmp/sf-test && bun install && bun dev
```

### Full scaffold check

```bash
bash scripts/test-scaffold.sh base        # real sv create + sv add + build
bash scripts/test-scaffold.sh dashboard
```

See `CONTRIBUTING.md` for the TDD workflow (Red → Green → Refactor) and `AGENTS.md` for repo conventions.

## Tech Stack

- **Svelte 5** (runes) + **SvelteKit 2**
- **Skeleton UI v5** (design system) — see [skeleton.dev](https://skeleton.dev)
- **Tailwind CSS v4**
- **TypeScript**, **Bun**
- **Better Auth** + **Drizzle ORM** (**PostgreSQL** — dashboard template, `pg-core` + `postgres` driver)

## AI-ready workflow

Every scaffold is **agent-ready by default** — a second developer, human or AI, can
start contributing without reverse-engineering the stack:

- **`AGENTS.md`** — scaffolded at the project root: conventions, component search
  order (primitives → ui → layout → Skeleton → create), auth/admin guards, DB rules
- **`.svforge.json`** — machine-readable manifest: template, stack (framework, UI,
  i18n, test, auth, ORM, database), installed modules, capabilities, canonical
  patterns (written by the dashboard/base mode and enriched by every module)
- **`llms.txt`** — LLM-friendly summary generated from the manifest (regenerate
  anytime with `svforge context` in the monorepo; modules merge their capability
  inline in generated projects)
- **`svforge-catalog.json`** + **`svforge-check.mjs`** — machine-readable component
  catalog + design-system check (`node svforge-check.mjs`; ERROR on second UI kits,
  WARN on non-canonical placement)

The docs in this README (modules/presets tables) are **generated from
`svforge-modules.json`** — the machine-readable contract is the single source of
truth, the tables cannot drift (`scripts/gen-modules-table.mjs --write`).

## Release

La publication npm (13 modules scoped + `svforge`) est documentée dans
[`docs/RELEASE.md`](docs/RELEASE.md) : modèle (push `prod` /
`workflow_dispatch`), ordre scoped → unscoped, exigences token, et état
vérifié des packages.

## License

MIT

## Links

- **Source & docs**: [github.com/lelabdev/svelteforge](https://github.com/lelabdev/svelteforge)
- **Skeleton UI**: [skeleton.dev](https://skeleton.dev)
- **Svelte**: [svelte.dev](https://svelte.dev)
