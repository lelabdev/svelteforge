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
#    Profile variants: base, dashboard (vitest), dashboard-playwright
if [ "$TEMPLATE" = "dashboard-playwright" ]; then
	ADD_SPEC="file:$REPO_ROOT/packages/svforge=template:dashboard+testing:playwright"
elif [ "$TEMPLATE" = "dashboard" ]; then
	ADD_SPEC="file:$REPO_ROOT/packages/svforge=template:dashboard+testing:vitest"
else
	ADD_SPEC="file:$REPO_ROOT/packages/svforge=template:base+testing:vitest"
fi
bunx sv add "$ADD_SPEC" --install bun --no-download-check

# 3. Dashboard: env vars required at build time (auth.ts / db/index.ts)
#    Now that drizzle.config.ts + .env.example + setup.sh are scaffolded (#187),
#    run the REAL setup script instead of hand-writing .env.
if [ "$TEMPLATE" = "dashboard" ] || [ "$TEMPLATE" = "dashboard-playwright" ]; then
	# Verify the previously-missing root files were delivered (#187)
	test -f drizzle.config.ts || { echo "❌ drizzle.config.ts missing at project root (#187)"; exit 1; }
	test -f .env.example || { echo "❌ .env.example missing at project root (#187)"; exit 1; }
	test -f scripts/setup.sh || { echo "❌ scripts/setup.sh missing at project root (#187)"; exit 1; }
	test -f static/robots.txt || { echo "❌ static/robots.txt missing at project root (#187)"; exit 1; }
	bash scripts/setup.sh >/dev/null 2>&1 || { echo "❌ setup.sh failed"; exit 1; }
	test -f .env || { echo "❌ setup.sh did not create .env"; exit 1; }
fi

# 4. Build the scaffolded project — the actual assertion
bun run build

# 5. Assert testing-profile files land at the project ROOT, not src/ (#186)
if [ "$TEMPLATE" = "dashboard" ] || [ "$TEMPLATE" = "dashboard-playwright" ]; then
	test -f vitest.config.ts || { echo "❌ vitest.config.ts missing at project root"; exit 1; }
fi
if [ "$TEMPLATE" = "dashboard-playwright" ]; then
	test -f playwright.config.ts || { echo "❌ playwright.config.ts missing at project root"; exit 1; }
	test -f e2e/auth.test.ts || { echo "❌ e2e/auth.test.ts missing at project root"; exit 1; }
fi

echo "✅ Scaffold test passed for template=$TEMPLATE"
