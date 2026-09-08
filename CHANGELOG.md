# Changelog

Every release is recorded as a package-scoped entry. The HTML comment immediately
before each entry is the machine-readable contract used by release validation
and `svforge upgrade`.

- `package`: exact npm package name
- `version`: exact immutable npm version
- `date`: UTC release date (`YYYY-MM-DD`)
- `Breaking changes`, `Migrations`, `Fixes`, and `Deprecations`: explicit sections;
  use `None.` when a section has no items

<!-- svforge-release package="svforge" version="1.2.0" date="2026-09-06" -->
## svforge@1.2.0 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the SvelteForge base and dashboard add-on.

### Deprecations
- `enrichManifest(content, moduleId)` (previously exported by `svforge`'s ai-context) is deprecated: it is kept as a compatibility alias delegating to the non-destructive planning core (`planManifestEnrich` in `@svforge/addon-kit`) and emits a one-time warning. It no longer resets an invalid manifest to an empty base — an invalid input throws the diagnosable `JsonGuardError`. Use `planManifestEnrich(rootDir, enrichment)` (plan-then-write) instead.

<!-- svforge-release package="@svforge/audit" version="0.0.1" date="2026-09-06" -->
## @svforge/audit@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the audit module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/blog" version="0.0.1" date="2026-09-06" -->
## @svforge/blog@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the blog module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/chat" version="0.0.1" date="2026-09-06" -->
## @svforge/chat@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the chat module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/dnd" version="0.0.2" date="2026-09-06" -->
## @svforge/dnd@0.0.2 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the drag-and-drop module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/email" version="0.0.1" date="2026-09-06" -->
## @svforge/email@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the email module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/graph" version="0.0.1" date="2026-09-06" -->
## @svforge/graph@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the graph module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/jobs" version="0.0.1" date="2026-09-06" -->
## @svforge/jobs@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the jobs module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/notifications" version="0.0.1" date="2026-09-06" -->
## @svforge/notifications@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the notifications module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/oauth" version="0.0.1" date="2026-09-06" -->
## @svforge/oauth@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the OAuth module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/realtime" version="0.0.1" date="2026-09-06" -->
## @svforge/realtime@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the realtime module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/tiptap" version="0.0.2" date="2026-09-06" -->
## @svforge/tiptap@0.0.2 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the Tiptap module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/ui_toast" version="0.0.2" date="2026-09-06" -->
## @svforge/ui_toast@0.0.2 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the toast UI module.

### Deprecations
- None.

<!-- svforge-release package="@svforge/uploads" version="0.0.1" date="2026-09-06" -->
## @svforge/uploads@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial documented release baseline for the uploads module.

### Deprecations
- None.


<!-- svforge-release package="@svforge/addon-kit" version="0.0.1" date="2026-09-06" -->
## @svforge/addon-kit@0.0.1 — 2026-09-06

### Breaking changes
- None.

### Migrations
- None.

### Fixes
- Initial release of the shared addon runtime: capability contract + install gate (#323) and safe JSON merge planning (#324) for all @svforge modules.
- Remediation round: non-SVForge-origin projects are validated STRUCTURALLY (auth wiring in hooks.server.ts, drizzle config + postgres client) — capabilities with indirect evidence only are surfaced as clear warnings instead of silently pretending support; strict `moduleCapabilities` schema validation (arrays of strings, no empty `{}` block, no raw TypeError); file reads treat only ENOENT as "absent" — other errors surface with their path; `@svforge/addon-kit` code is BUNDLED into every addon's build output (self-contained dists — the `sv add` engine rejects community addons declaring runtime `dependencies`), so the addon packages stay dependency-free at runtime.

### Deprecations
- None.
