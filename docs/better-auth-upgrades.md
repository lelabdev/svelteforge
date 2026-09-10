# Better Auth upgrades — policy & automation (#319)

The dashboard scaffold ships a **pinned** Better Auth stack. The pin lives in
`packages/svforge/src/modes/dashboard.ts` and is mirrored in
`packages/svforge/templates/dashboard/package.json`; a drift guard
(`tests/better-auth-upgrade.test.ts`) keeps every carrier in lockstep. The
scaffold NEVER floats (`latest`, `*`) — a generated project must be
reproducible (#197).

The live pin is whatever `packages/svforge/src/modes/dashboard.ts` declares — print it at
any time with `node scripts/better-auth-upgrade.mjs pin`. The value is parsed from the source
at runtime, so it never goes stale after an upgrade PR merges (#319 review). Historical: #319
migrated the pin from ~1.4.21 to the 1.6.x/1.7.x fix stream to cover GHSA-g38m-r43w-p2q7 —
OAuth auto-link account takeover, fixed in 1.6.11.

## Upgrade policy

| Change type                                              | Automation                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| **Blocking security patch** (critical/high advisory on the pin, fixed by latest) | Auto-PR **immediately** — daily escalation check |
| **Minor / patch**, gate-green                            | Auto-PR **weekly** (Monday 07:00 UTC)                             |
| **Major**                                                | Explicit migration issue — **never a PR**                          |
| **Prerelease** (`-beta`, `-rc`, …)                       | Never upgraded automatically                                       |

Automation lives in
[.github/workflows/better-auth-upgrade.yml](../.github/workflows/better-auth-upgrade.yml)
(`workflow_dispatch` with an optional `version` input for manual runs).

## The gate — "tested" is part of the policy

An upgrade PR opens **only after** the full gate is green on the bumped tree:

1. **Repository tests** (`bun x vitest run`) — including the pin-coherence
   drift guards and the upgrade-policy unit tests.
2. **`bash scripts/test-scaffold.sh dashboard`** — a real scaffold against
   real PostgreSQL:
   - production build + `svelte-check` (0 errors),
   - template vitest baseline — the credential-lifecycle suite proves the
     contract end-to-end against the installed Better Auth version: admin A
     creates B without losing their session, **B signs in through the real
     `auth.handler`**, wrong passwords are rejected, duplicate/atomicity
     guarantees hold;
   - schema drift gate — the committed `auth.schema.ts` must match the schema
     **derived from the installed better-auth runtime** (`getSchema()` from the
     project's own node_modules). The comparison covers column names, types,
     nullability, defaults, uniques/indexes and foreign keys — the lagging
     `@better-auth/cli` output is NOT the reference (see below); the bunx CLI
     generate step remains as a smoke test of the shipped `auth:schema` path;
   - HTTP smoke — `vite dev` + real requests: `/setup` (first admin) → login →
     admin CRUD (create user B, admin session survives) → B signs in.
3. **Better Auth stack audit** — `scripts/better-auth-audit.mjs` queries
   OSV.dev for better-auth, `@better-auth/*` and their **full resolved
   dependency closure**: regular + optional dependencies and required peer
   dependencies, resolved to the shallowest (hoisted) lockfile entry. This
   includes hoisted transitive packages (e.g. `jose`), which a lockfile-key
   scope filter silently misses (#319 review). It **fails on critical/high**
   advisories; moderate/low findings are reported without blocking.

   Documented reachability exceptions use the existing
   [`docs/audit-baseline.json`](audit-baseline.json) mechanism (#351): a
   scoped `{ package, version, advisory, path, reason }` entry with a written
   justification. If the gate fails, no PR opens — a GitHub issue is filed
   instead ("only tested versions auto-PR").

## The CLI (`@better-auth/cli`) is NOT a scaffold dependency

The CLI versions independently of `better-auth` and lags it (latest stable
1.4.x while the runtime is 1.7.x). Its own dependency tree pins
`@better-auth/core@1.4.x`, and bun hoists that copy over the runtime's
`@better-auth/core@1.7.x` — which breaks the SSR build with
`SyntaxError: The requested module '@better-auth/core/error' does not provide
an export named 'APIError'`.

Therefore:

- the generator runs via the SELECTED package manager's on-demand runner
  (`bunx` for bun scaffolds, `npx --yes` for npm, `pnpm dlx` for pnpm —
  #325): the dlx cache is isolated from the project's `node_modules`,
- the CLI version is pinned in the scaffold gate and in the template's
  `auth:schema` source,
- **do not add `@better-auth/cli` to the scaffold's dependencies** until its
  bundled core matches the runtime major,
- the schema drift gate in the scaffold gate is the drift detector: the
  committed `auth.schema.ts` is diffed against the schema derived from the
  installed RUNTIME (`getSchema()`), so a newer runtime that changes names,
  types, nullability, defaults, indexes or FKs tells you to review and
  re-commit — even while the CLI's bundled knowledge still lags behind.
  The `bunx @better-auth/cli generate` step in the gate stays as a smoke
  test of the shipped `auth:schema` regeneration path.

Gotchas encoded in the gate (verified against the CLI): the `--output` path
must **not already exist** (existing files are overwritten to 0 bytes) and
must be **relative**. #325 additionally ships the scaffold's `auth:schema`
as a REVIEW copy (`--output auth-schema.review.ts`): regenerating directly
over `src/lib/server/db/auth.schema.ts` wipes runtime-only columns
(`user.role`, `user.disabled`) and breaks the build until hand-merged. The
committed schema stays the runtime-gated source of truth.

## 1.7.x migration notes (applied in #319)

- `drizzleAdapter(db, { provider: 'pg' })` must now pass the model mapping
  explicitly: `drizzleAdapter(db, { provider: 'pg', schema: { user, session,
  account, verification } })`. The old introspection of the drizzle instance
  is gone — without the mapping every write fails with
  `Cannot convert undefined or null to object`. The scaffold gate catches
  this class of regression via the HTTP smoke.
- The credential contract is unchanged (verified against the 1.7.3 sources):
  emails are stored lowercased, credential accounts keep
  `providerId: 'credential'` with `accountId = user.id`, and
  `better-auth/crypto` still exports `hashPassword`/`verifyPassword`. The
  isolated `createCredentialUser` helper stays — the official admin plugin's
  `createUser` is session-safe but drags in the plugin's own role/ban schema
  fields and permission model, which duplicates the template's explicit
  persisted `user.role` column (#318: `admin` granted only by the atomic
  first-admin bootstrap) + `disabled` lifecycle. Adopting the plugin is a
  product decision, not a dependency upgrade.
- The daily security escalation and the weekly pass share the same gate; the
  only difference is cadence.

## Known follow-ups

- **E2E OAuth coverage**: the runtime smoke covers email/password (setup,
  login, admin CRUD, created-user sign-in). A full OAuth E2E flow (Google/
  GitHub against the `oauth` module) needs provider stubs or test tenants and
  is tracked as a follow-up — the `oauth` module carries its own test pack
  meanwhile.
- **`@better-auth/cli` 1.7.x**: when the CLI catches up with the runtime
  major (its bundled `@better-auth/core` no older than the runtime), it can be
  considered again as a regular devDependency. Until then it stays bunx-only.

## Manual run

```bash
# Print the LIVE pin (parsed from packages/svforge/src/modes/dashboard.ts)
node scripts/better-auth-upgrade.mjs pin

# Detect what would happen (pin, latest, mode)
node scripts/better-auth-upgrade.mjs apply --root /somewhere --better-auth X.Y.Z  # dry: apply to a copy

# Full upgrade locally
node scripts/better-auth-upgrade.mjs apply --better-auth <version>
bun run --filter '*' build && bun run test
bash scripts/test-scaffold.sh dashboard   # needs PostgreSQL
```

Or trigger the automation: `gh workflow run better-auth-upgrade.yml -f version=X.Y.Z`.
