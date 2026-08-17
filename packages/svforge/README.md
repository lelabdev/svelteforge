# SVForge

**sv community addon** — SvelteKit starter boilerplate built on Skeleton UI v5 and Tailwind CSS v4. Ships with a clean UI kit, layouts, theme, and optional admin dashboard with Better Auth + Drizzle ORM.

**Not a component library. Not a shadcn clone.** SvelteForge gives you the essentials — buttons, inputs, selects, cards, badges, theme, SEO, layouts — so you start fast and own everything. For richer components (dialog, tabs, tooltip, date-picker…), use the official [`@skeletonlabs/skeleton-svelte`](https://skeleton.dev) components directly.

## Install

```bash
# Base template (UI kit + layouts + theme)
npx sv create my-app --template minimal --types ts --add svforge --install bun --no-download-check
cd my-app && bun dev

# Dashboard template (base + auth + DB + admin)
npx sv create my-app --template minimal --types ts --add 'svforge=template:dashboard' --install bun --no-download-check
cd my-app && bash scripts/setup.sh && bun dev

# Dashboard with the opt-in Playwright browser profile
npx sv create my-app --template minimal --types ts --add 'svforge=template:dashboard+testing:playwright' --install bun --no-download-check
cd my-app && npx playwright install && bun run test:e2e
```

Or add to an existing project:
```bash
npx sv add svforge   # prompts: base or dashboard
```

Dashboard projects include the Vitest baseline by default (`bun run test`).
The Playwright profile is opt-in with `testing:playwright`; it adds
`@playwright/test`, the `test:e2e` script, browser configuration, and E2E tests.

## What you get

### Base Template

- **UI kit** — Button, Card, Badge, Alert, Input, Select, Textarea, Checkbox, Toggle, Table
- **Layout** — Navbar, Footer, ThemeToggle
- **Utils** — Logo, Seo, generateSitemap(), cn()
- **SVForge theme** — custom oklch color palette with 7 color families (Skeleton v5 format)
- **Dark/light mode** — auto-detects system preference, manual toggle
- **Demo page** at `/demo-ui`

### Dashboard Template

Everything in Base, plus:

- **Better Auth** — email/password, session management
- **Drizzle ORM + PostgreSQL** (`pg-core` + `postgres` driver) — user/session/account/verification schema + app tables
- **Admin dashboard** — stats, user management (CRUD), settings
- **Zod validation** — type-safe schemas on all server actions
- **Setup script** — `bash scripts/setup.sh` (generates secret, inits DB)
- **Pre-configured** — drizzle.config.ts, .env.example, tsconfig

## Module Addons

Composable opt-in modules — pick 2–3 as needed. **Requires** = template to scaffold first (`base` or `dashboard`); **Optional integrations** compose with other modules:

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

Presets are composition recipes (`npx svforge preset <name>`):

<!-- PRESETS-TABLE:START -->
| Preset | Description | Requires | Composition |
|--------|-------------|----------|-------------|
| `saas` | Dashboard SaaS de départ : auth + admin + email + uploads | **dashboard** | email + uploads (optional: tiptap, oauth, dnd) |
| `community` | Site communautaire : base + blog + toast | base | blog + ui_toast (optional: tiptap, graph) |
<!-- PRESETS-TABLE:END -->

```bash
npx sv add @svforge/ui_toast
npx sv add @svforge/uploads
npx sv add @svforge/chat
npx sv add @svforge/jobs
```

The machine-readable contract (`svforge-modules.json`) is the single source of truth — this table is generated, see `scripts/gen-modules-table.mjs`.

## AI-ready workflow

Every scaffold is agent-ready: `AGENTS.md` (conventions), `.svforge.json`
(machine-readable manifest: template, stack, modules, capabilities, patterns),
`llms.txt` (LLM summary), `svforge-catalog.json` + `svforge-check.mjs`
(design-system harness). Modules merge their capability into the manifest and
`llms.txt` at install time.

## Upgrade

`svforge upgrade <base|dashboard>` updates the recipe files (`src/**`) of an
installed project and records per-file checksums in `.svforge-versions.json`.

**First upgrade (no baseline yet):** any existing file that diverges from the
template is treated as a *potential local modification* and is **skipped** —
never overwritten. Only files that are absent are created automatically.

**Later upgrades:** a file that exactly matches what svforge last installed is
updated silently (that's a template evolution, not a user edit); a file whose
content differs from the recorded baseline is **skipped** with a clear message.

In every case, pass `--force` to overwrite — a `.svforge-backup` copy is
created before any overwrite. The recipe version announced by the command is
derived from the shipped package version (single canonical source, no drift).

## License

MIT
