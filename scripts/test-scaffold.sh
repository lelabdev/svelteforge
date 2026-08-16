#!/usr/bin/env bash
# Scaffold check (#191): validate that a REAL fresh project scaffolded with the
# LOCAL svforge addon builds. Runs in CI on every PR and gates npm publishes.
#
# Key points:
# - Uses `file:` so sv resolves the addon from ./packages/svforge (local build),
#   NOT the published npm package (which lacks local changes).
# - All addon options are passed explicitly (template + testing) so sv never prompts.
# - `bunx sv` resolves the workspace's pinned `sv` (^0.15.x from the lockfile);
#   the canary workflow (#205) is what tests against ecosystem `latest`.
# - The dashboard needs a .env at build time (auth/db modules are evaluated);
#   drizzle push is best-effort until drizzle.config.ts is delivered (#187).
set -euo pipefail

TEMPLATE="${1:-base}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d /tmp/sf-scaffold-$TEMPLATE-XXXXXX)"

echo "Testing svforge scaffold: template=$TEMPLATE (local addon)"

# Clean up on exit
trap "rm -rf $TMP_DIR" EXIT

# 0. Build the local addon (prebuild regenerates src/templates.ts + tsdown dist)
cd "$REPO_ROOT/packages/svforge"
bun run build

# 1. Create a fresh SvelteKit project (same baseline as end users)
cd "$TMP_DIR"
bunx sv create app --template minimal --types ts --no-install --no-add-ons --no-download-check
cd app

# 2. Add the LOCAL svforge addon with all options set (no prompts in CI)
if [ "$TEMPLATE" = "dashboard" ]; then
	ADD_SPEC="file:$REPO_ROOT/packages/svforge=template:dashboard+testing:vitest"
else
	ADD_SPEC="file:$REPO_ROOT/packages/svforge=template:base+testing:vitest"
fi
bunx sv add "$ADD_SPEC" --install bun --no-download-check

# 3. Dashboard: env vars required at build time (auth.ts / db/index.ts)
if [ "$TEMPLATE" = "dashboard" ]; then
	cat > .env <<'ENV'
DATABASE_URL="file:local.db"
ORIGIN=http://localhost:5173
BETTER_AUTH_SECRET=ci-test-secret-not-for-production-32ch
ENV
	# DB schema push is best-effort: drizzle.config.ts is not scaffolded yet (#187)
	bunx drizzle-kit generate >/dev/null 2>&1 || true
	bunx drizzle-kit push >/dev/null 2>&1 || true
fi

# 4. Build the scaffolded project — the actual assertion
bun run build

echo "✅ Scaffold test passed for template=$TEMPLATE"
