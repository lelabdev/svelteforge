# npm release process

Publishing is driven by `.github/workflows/publish.yml`. Releases use npm token
authentication through `secrets.NPM_TOKEN`; OIDC provenance is not enabled. The
workflow has read-only repository permissions because npm publication does not
need GitHub write access.

## Independent versioning

Every workspace owns its version in `packages/*/package.json`. There is no
monorepo-wide version bump: a package is released only when its own manifest
version is not already present in the registry.

The release planner enforces this policy and rejects invalid SemVer or a local
version that is older than the latest published version. SemVer comparison
follows the core and prerelease precedence rules and accepts build metadata.
Its machine-readable output follows [`release-plan.schema.json`](./release-plan.schema.json)
and contains:

- the schema version and `independent` versioning policy;
- the exact commit being released;
- every package name, version, manifest path and workspace directory;
- local package dependencies and their publication order;
- registry versions and whether the exact local version is already published.

This format is intentionally suitable for `svforge upgrade` and automated
release tooling to identify the package versions belonging to one release.

Generate the plan locally without contacting npm:

```bash
bun run release:plan
```

Query npm and save the registry-aware plan:

```bash
node scripts/release-plan.mjs \
  --check-registry \
  --output /tmp/svforge-release-plan.json
```

The planner orders local dependencies before their dependents. Independent
packages with no relationship are ordered deterministically, with scoped
`@svforge/*` packages before the unscoped `svforge` package.

## Workflow gates

Before the first publication, the workflow:

1. installs the pinned Bun and Node versions;
2. builds all 14 packages and runs the repository tests;
3. runs the base, dashboard, foundation and integration scaffold gates;
4. verifies npm authentication with `npm whoami`;
5. generates and prints the complete commit/version/registry plan;
6. verifies read-only npm package access for every planned package, including
   the unscoped `svforge` package and the `@svforge` packages;
7. runs `npm pack --dry-run --json --ignore-scripts` for every package and
   verifies exports, JavaScript, declarations, README, LICENSE and packaged
   paths;
8. publishes the plan in dependency order;
9. installs every exact published version in a clean consumer and verifies its
   declared TypeScript entry point.

The workflow uses a repository-global concurrency group so a production push
and a manual dispatch cannot publish simultaneously, even from different refs.
All third-party actions are pinned to commit SHAs.

## Resuming a failed release

The publish step reads the registry state captured by the plan. It skips an
exact package version that already exists and publishes the remaining versions.
A rerun therefore resumes after an intermediate failure instead of attempting
to republish an immutable npm version. The plan must be regenerated on each
run so it reflects the current registry state.

An unchanged version produces no `npm publish` call.

## Authentication and permissions

The npm account behind `NPM_TOKEN` must be allowed to publish every scoped
`@svforge/*` package and the unscoped `svforge` package. `npm whoami` verifies
that the token is present and valid. The release plan then runs
`npm access list packages --json` and rejects any package that is absent or not
reported as writable. npm remains the authority for package-level permissions.

Do not print, commit or include npm tokens in release output. Never run the
publish command locally or trigger the production workflow without explicit
maintainer authorization.

## Local preflight

Build first, then inspect all package tarballs without publishing:

```bash
bun run build:all
node scripts/release-plan.mjs --preflight
```

The preflight requires each package to contain `README.md`, `package.json`,
`LICENSE`, `dist/index.js`, `dist/index.d.ts`, and every declared export or
binary entry point.

The post-publication consumer smoke test is also available locally with a
registry-aware plan:

```bash
node scripts/npm-consumer-smoke.mjs --plan /tmp/svforge-release-plan.json
```

It installs exact package versions with scripts disabled and checks that each
package's declared `types` export resolves to an installed declaration file.
The smoke test is intentionally run only after publication; unpublished local
versions cannot be tested from npm.
