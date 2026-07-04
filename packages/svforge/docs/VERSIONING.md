# Versioning Strategy

## Packages

| Package | Current | Strategy |
|---------|---------|----------|
| `svforge` | 1.x | Semver — base addon is stable |
| `@svforge/*` modules | 0.x | Semver — pre-1.0, breaking changes allowed in minor |

## Rules

- **`svforge` (base)**: Follows semver strictly. Breaking changes = major bump.
- **Modules (`@svforge/*`)**: Pre-1.0. Minor bumps can include breaking changes. Patch = bugfix only.
- **Publishing**: Only via CI/CD pipelines (`main` → `dev` tag, `prod` → `latest` tag).
- **Never publish manually** without explicit approval.

## CI/CD Channels

| Branch | NPM Tag | Purpose |
|--------|---------|---------|
| `main` | `dev` | Development preview — latest commits |
| `prod` | `latest` | Stable release |

## Release Process

1. Bump version in `package.json` (manual commit)
2. Merge to `prod` branch
3. CI auto-publishes with `latest` tag

## Install

```bash
# Stable
npx sv add svforge

# Dev preview
npx sv add svforge@dev
```
