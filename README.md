<div align="center">

# SVForge

**Production-ready foundations for SvelteKit projects.**

Start with SvelteKit. Add a solid project structure, a design system, auth/data foundations, optional modules, and context that helps coding agents reuse what is already there.

[Getting started](#getting-started) · [Templates](#templates) · [Modules](#modules) · [AI-ready](#ai-ready) · [Contributing](CONTRIBUTING.md)

</div>

---

## What SVForge is

SVForge is a collection of [`sv`](https://github.com/sveltejs/cli) community addons for building SvelteKit applications without rebuilding the same foundations on every project.

It **does not replace SvelteKit** and it is not a framework on top of it. Your project stays a normal SvelteKit app.

SVForge adds the pieces around it:

- a coherent application structure and design-system conventions;
- Skeleton UI + Tailwind foundations;
- Paraglide FR/EN from day one;
- Vitest and quality gates;
- a dashboard starter with Better Auth, Drizzle and PostgreSQL;
- composable modules for common application capabilities;
- machine-readable project context for coding agents.

The generated source belongs to your project. There is no opaque application runtime to depend on after scaffolding.

## Getting started

Create a SvelteKit project, then apply an SVForge template:

```bash
npx sv create my-app
cd my-app

# Lightweight application foundation
npx sv add svforge=template:base+testing:vitest

# Or a full application/dashboard foundation
npx sv add svforge=template:dashboard+testing:vitest
```

For the dashboard template, configure PostgreSQL and the generated environment:

```bash
bash scripts/setup.sh
bun run dev
```

The dashboard uses a standard `DATABASE_URL`, so local PostgreSQL, a server you manage, or a managed PostgreSQL provider all fit the same project structure.

## Templates

SVForge intentionally keeps the template surface small.

### `base`

A clean starting point for SvelteKit applications:

- Svelte 5 + TypeScript
- Skeleton UI + Tailwind CSS
- canonical `primitives / ui / layout` component structure
- complete Skeleton v5 theme and dark mode foundations
- one global CSS entrypoint (`src/routes/layout.css`)
- Paraglide with FR + EN catalogs
- SEO + sitemap helpers
- Vitest baseline
- generated agent/project context

The CSS surface is deliberately small: `src/routes/layout.css` only wires Tailwind, Skeleton, fonts and plugins, while `src/lib/styles/svelteforge-theme.css` is the visual source of truth. SVForge does not scaffold a generic `tokens.css` or style barrel by default; local layout and whitespace use normal Tailwind utilities. Project-specific token/effect layers can be introduced later when a concrete repeated need justifies them.

Use `base` when the application does not need the full authenticated dashboard foundation.

### `dashboard`

Everything in `base`, plus the standard full-stack foundation:

- Better Auth
- Drizzle ORM
- PostgreSQL
- authenticated app layout
- admin dashboard and user management
- Zod validation patterns
- database setup scripts
- real scaffold checks against PostgreSQL

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="SVForge dashboard" width="760" />
</p>

## Compose only what the project needs

Modules are normal `sv` addons. Add them when the product needs them:

```bash
npx sv add @svforge/realtime
npx sv add @svforge/uploads
npx sv add @svforge/notifications
```

Or compose several capabilities into the same project:

```bash
npx sv add \
  @svforge/chat \
  @svforge/realtime \
  @svforge/uploads \
  @svforge/notifications
```

Modules copy their implementation into the application and integrate with the existing SVForge conventions instead of creating a parallel architecture.

## Modules

### Foundations

- **`@svforge/realtime`** — WebSocket transport, channels, authorization, reconnect and subscriptions.
- **`@svforge/audit`** — append-only business audit trail with admin history.
- **`@svforge/jobs`** — small PostgreSQL-backed background job runner with retries and progress.
- **`@svforge/email`** — transactional email through Resend.
- **`@svforge/uploads`** — S3/R2 presigned uploads with server-side validation.
- **`@svforge/oauth`** — Google/GitHub social authentication for dashboard projects.

### Application features

- **`@svforge/notifications`** — persistent in-app notifications with read/unread state.
- **`@svforge/chat`** — conversations, participants, messages and per-user read state.
- **`@svforge/blog`** — MDsveX blog foundation.

### UI and editing

- **`@svforge/ui_toast`** — Skeleton-based toast feedback.
- **`@svforge/dnd`** — sortable drag-and-drop UI.
- **`@svforge/tiptap`** — rich-text editor, toolbar and sanitized preview.
- **`@svforge/graph`** — interactive knowledge-graph visualization.

The goal is not to ship mini SaaS products inside the boilerplate. Modules cover the reusable first part of a capability and leave product-specific behavior in the application.

## Presets are recipes, not more templates

Presets bundle a useful composition without duplicating module code or multiplying the template matrix.

```bash
# Dashboard + common SaaS foundations
npx svforge preset saas

# Base + community/content foundations
npx svforge preset community
```

A preset only gives you the composition to apply. The actual project is still built from the same `base` / `dashboard` templates and the same standalone modules.

## A design system that agents can follow

Canonical shared components live under:

```text
src/lib/components/svforge/
├── primitives/
├── ui/
└── layout/
```

The reuse order is explicit:

1. SVForge primitives
2. SVForge UI components
3. SVForge layouts
4. Skeleton UI
5. create something new only when no existing component fits

For global visual decisions, the same rule applies: use the Skeleton theme and presets first. Do not create a parallel palette/token layer simply to restyle the scaffold.

`svforge check` enforces the important rails: no second UI kit, no duplicated canonical primitives, no arbitrary theme drift, and no accidental structure divergence.

## AI-ready

SVForge projects carry their own implementation context so an agent can inspect the project before inventing architecture.

A scaffold includes:

- **`AGENTS.md`** — project conventions and implementation rules;
- **`.svforge.json`** — machine-readable template/modules/capabilities state;
- **`llms.txt`** — concise context generated from the project state;
- **`svforge-catalog.json`** — reusable component catalog;
- **`svforge-modules.json`** — module metadata and composition information.

Typical workflow:

```text
PRD / feature request
        ↓
read AGENTS.md + llms.txt + .svforge.json
        ↓
reuse existing components and modules
        ↓
implement product-specific code
        ↓
svforge check + svelte-check + tests + build
```

Useful commands:

```bash
# Validate SVForge design-system/project rails
svforge check

# Regenerate llms.txt from the project manifest
svforge context

# Explicit, reviewable template upgrade
svforge upgrade base
svforge upgrade dashboard
```

Upgrades are intentionally conservative: generated files are owned by the consumer project, and locally modified files are not silently overwritten.

## Boring by design

SVForge favors standard pieces that can survive the lifetime of an application:

- SvelteKit stays the application framework.
- PostgreSQL stays a normal PostgreSQL database.
- Drizzle stays behind application/domain code rather than becoming the architecture.
- Better Auth handles authentication instead of a custom auth layer.
- Skeleton provides the UI foundation instead of introducing another component system.
- Modules are optional and composable; templates do not multiply for every feature combination.

This keeps generated projects understandable by a developer who knows the underlying tools, even without knowing SVForge first.

## Quality gates

The repository tests both source-level contracts and **real generated consumer projects**.

Permanent scaffold profiles cover the base/dashboard templates, Playwright, Blog, the newer dashboard foundations, historical UI modules, and dashboard integrations. PostgreSQL-backed profiles run against a real database in CI, and an ecosystem canary regularly exercises the addons against current upstream tooling.

The publish workflow uses the same scaffold gates before package publication.

## Repository

```text
packages/
├── svforge/          # base + dashboard templates and CLI helpers
├── realtime/
├── audit/
├── notifications/
├── jobs/
├── chat/
├── email/
├── uploads/
├── oauth/
├── blog/
├── tiptap/
├── dnd/
├── graph/
└── ui_toast/
```

Each module is independently packaged and owns the source it adds to a consumer project.

## Development

```bash
bun install
bun test
bun run --filter '*' build

# Test an actual generated project
bash scripts/test-scaffold.sh base
bash scripts/test-scaffold.sh dashboard
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository conventions and [docs/RELEASE.md](docs/RELEASE.md) for the release process.

## License

MIT
