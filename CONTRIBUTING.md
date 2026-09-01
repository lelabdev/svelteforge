# Contributing to SVForge

## Development Setup

```bash
bun install
bun run build:all    # build all packages
bun run test         # run the full test suite
```

## Issue and Branch Naming

### Issue titles

- Write titles in English.
- Keep titles descriptive and at most 50 characters, including spaces.
- Start with an action verb and describe the intended outcome.
- Do not add type or scope prefixes such as `fix:`, `security(auth):`, or
  `docs(ops):`.
- Use GitHub labels for categories, areas, and priorities instead of encoding
  them in the title.

Example: `Enforce upload size limits`.

### Branch names

Create branches from the issue title using this format:

```text
issue/<number>-<title-slug>
```

Convert the title to lowercase kebab-case and remove punctuation. For example,
issue `#338` becomes `issue/338-enforce-upload-size-limits`.

## TDD Workflow — Red → Green → Refactor

Every bug fix and feature must follow strict TDD:

### 1. Red — Write a failing test first

Write one focused behavior-level test that describes the intended behavior.
Run it and confirm it fails for the **right reason** (missing behavior, not a
syntax error or missing import).

```bash
bun run test -- tests/your-issue.test.ts
```

### 2. Green — Implement the smallest change

Make the test pass with the minimal production code change. Do not add extra
features or refactors at this stage.

### 3. Refactor — Clean up while tests stay green

Improve code quality, naming, and structure. Run the test after each change
to ensure it stays green.

## Test Categories

| Category | What it proves | Location |
|----------|---------------|----------|
| **Build** | Package builds produce `dist/index.js` | `tests/build.test.ts` |
| **Security** | Auth guards, input validation, XSS prevention | `tests/*-security.test.ts`, `tests/admin-auth.test.ts` |
| **Scaffold** | Addons install at documented paths | `tests/scaffold-paths.test.ts` |
| **Behavior** | Template logic works as intended | `tests/blog-mdsvex.test.ts`, `tests/admin-delete.test.ts` |
| **Quality** | A11y, reactivity, declaration publishing | `tests/a11y-reactivity.test.ts`, `tests/oauth-declarations.test.ts` |

## Test Helpers

Shared utilities are in `tests/helpers.ts`:

- `packageDir(pkg)` / `packageFile(pkg, ...segments)` — resolve package paths
- `dashboardTemplateFile(...)` / `baseTemplateFile(...)` — resolve template paths
- `tempProject(prefix)` — create isolated temp directories for scaffold tests
- `expectFile(path)` / `expectNoFile(path)` — assertion helpers

## What to Avoid

- **Do not** write tests that only check committed `dist/` files (dist is gitignored)
- **Do not** hand-edit generated `src/templates.ts` files
- **Do not** use array index as `{#each}` key — use stable identities
- **Do not** assign to `$state` from `$effect` — use `$derived` instead

## Running Tests

```bash
bun run test                    # full suite (sequential, no file parallelism)
bun run test -- tests/foo.test.ts  # single file
bun run test:watch              # watch mode (parallel OK for development)
```

Tests run sequentially (`--no-file-parallelism`) because build tests regenerate
`dist/` artifacts that other tests check. Watch mode uses parallelism for speed.

## Building

```bash
bun run build         # build svforge only
bun run build:all     # build all 9 packages
```

Each package runs `prebuild` (regenerates `src/templates.ts` from template dirs)
then `tsdown` (compiles to `dist/`).
