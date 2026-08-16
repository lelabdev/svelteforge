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
#    SV_CMD controls the CLI version: pinned workspace sv (PR CI, deterministic,
#    #191) vs ecosystem `bunx sv` (canary, latest, #205).
if [ -z "${SV_CMD:-}" ]; then
	SV_CMD="$REPO_ROOT/node_modules/.bin/sv"
fi
cd "$TMP_DIR"
$SV_CMD create app --template minimal --types ts --no-install --no-add-ons --no-download-check
cd app

# 2. Add the LOCAL svforge addon with all options set (no prompts in CI)
#    Profile variants: base, dashboard (vitest), dashboard-playwright, base-blog
#    base-modules adds svforge itself at the right point (#190 bare-project refusal).
if [ "$TEMPLATE" = "dashboard-playwright" ]; then
	ADD_SPEC="file:$REPO_ROOT/packages/svforge=template:dashboard+testing:playwright"
elif [ "$TEMPLATE" = "dashboard" ]; then
	ADD_SPEC="file:$REPO_ROOT/packages/svforge=template:dashboard+testing:vitest"
fi
if [ "$TEMPLATE" != "base-modules" ]; then
	ADD_SPEC="${ADD_SPEC:-file:$REPO_ROOT/packages/svforge=template:base+testing:vitest}"
	$SV_CMD add "$ADD_SPEC" --install bun --no-download-check
fi

# Blog module on top of base (#185): mdsvex must integrate via vite.config.ts
# (no svelte.config.js in modern sv create) and the scaffold must build.
if [ "$TEMPLATE" = "base-blog" ]; then
	$SV_CMD add "file:$REPO_ROOT/packages/blog" --install bun --no-download-check
	# mdsvex wired in vite.config.ts?
	grep -q "mdsvex" vite.config.ts || { echo "❌ mdsvex missing in vite.config.ts (#185)"; exit 1; }
	grep -q "extensions: \['.svelte', '.md'\]" vite.config.ts || { echo "❌ .md extension missing (#185)"; exit 1; }
	# welcome.md post delivered and compiled by mdsvex
	test -f src/posts/welcome.md || { echo "❌ src/posts/welcome.md missing"; exit 1; }
fi

# Module composition guards (#190): graph/ui_toast on base, oauth on dashboard.
# A bare project must REFUSE oauth/graph with a clear unsupported message.
if [ "$TEMPLATE" = "base-modules" ]; then
	# 1. graph on bare project → refused
	if $SV_CMD add "file:$REPO_ROOT/packages/graph" --install bun --no-download-check 2>&1 | grep -q "requires the svforge base template"; then
		echo "✅ graph refused on bare project (#190)"
	else
		echo "❌ graph was not refused on bare project (#190)"; exit 1
	fi
	# 2. ui_toast on bare project → installs and declares skeleton-svelte
	$SV_CMD add "file:$REPO_ROOT/packages/ui_toast" --install bun --no-download-check
	grep -q "skeleton-svelte" package.json || { echo "❌ skeleton-svelte not declared (#190)"; exit 1; }
	# 3. graph on svforge base → works
	$SV_CMD add "file:$REPO_ROOT/packages/svforge=template:base+testing:vitest" --install bun --no-download-check
	$SV_CMD add "file:$REPO_ROOT/packages/graph" --install bun --no-download-check
	test -f src/lib/components/svforge/graph/KnowledgeGraph.svelte || { echo "❌ graph files missing on base (#190)"; exit 1; }
fi

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

# Baseline Vitest (#235): vitest.config.ts must land at the PROJECT ROOT on
# base too (prebuild only embeds templates/base/src/**), and the baseline
# test must actually run.
if [ "$TEMPLATE" = "base" ]; then
	test -f vitest.config.ts || { echo "❌ vitest.config.ts missing at project root (#235)"; exit 1; }
	bun run test || { echo "❌ baseline vitest failed on base scaffold (#235)"; exit 1; }
fi

# Blog: assert the welcome.md post is actually compiled by mdsvex (not parsed
# as raw Svelte — the #185 regression) by checking the build output.
if [ "$TEMPLATE" = "base-blog" ]; then
	grep -rl "Welcome to your blog" .svelte-kit/output/server/ >/dev/null \
		|| { echo "❌ welcome.md not compiled by mdsvex (#185)"; exit 1; }
fi

# 5. Assert testing-profile files land at the project ROOT, not src/ (#186)
if [ "$TEMPLATE" = "dashboard" ] || [ "$TEMPLATE" = "dashboard-playwright" ]; then
	test -f vitest.config.ts || { echo "❌ vitest.config.ts missing at project root"; exit 1; }
fi
if [ "$TEMPLATE" = "dashboard-playwright" ]; then
	test -f playwright.config.ts || { echo "❌ playwright.config.ts missing at project root"; exit 1; }
	test -f e2e/auth.test.ts || { echo "❌ e2e/auth.test.ts missing at project root"; exit 1; }
fi

# 5b. Canonical component structure primitives/ui/layout (#242)
if [ "$TEMPLATE" = "base" ] || [ "$TEMPLATE" = "dashboard" ] || [ "$TEMPLATE" = "dashboard-playwright" ]; then
	test -f src/lib/components/svforge/primitives/Button.svelte || { echo "❌ primitives/Button.svelte missing (#242)"; exit 1; }
	test -f src/lib/components/svforge/primitives/index.ts || { echo "❌ primitives/index.ts missing (#242)"; exit 1; }
	test -f src/lib/components/svforge/ui/Card.svelte || { echo "❌ ui/Card.svelte missing (#242)"; exit 1; }
	test -f src/lib/components/svforge/layout/Navbar.svelte || { echo "❌ layout/Navbar.svelte missing (#242)"; exit 1; }
	# No primitive may leak back into ui/ (separation is canonical)
	if [ -f src/lib/components/svforge/ui/Button.svelte ]; then
		echo "❌ Button.svelte must live in primitives/, not ui/ (#242)"; exit 1
	fi
fi

# 5c. Paraglide FR/EN baseline delivered (#239)
if [ "$TEMPLATE" = "base" ] || [ "$TEMPLATE" = "dashboard" ] || [ "$TEMPLATE" = "dashboard-playwright" ]; then
	test -f messages/fr.json || { echo "❌ messages/fr.json missing (#239)"; exit 1; }
	test -f messages/en.json || { echo "❌ messages/en.json missing (#239)"; exit 1; }
	test -f project.inlang/settings.json || { echo "❌ project.inlang/settings.json missing (#239)"; exit 1; }
	test -f src/hooks.server.ts || { echo "❌ hooks.server.ts missing (#239)"; exit 1; }
	grep -q "paraglideVitePlugin" vite.config.ts || { echo "❌ paraglide plugin missing in vite.config.ts (#239)"; exit 1; }
fi

# 6. AI-ready: AGENTS.md scaffolded at the project root (#203)
test -f AGENTS.md || { echo "❌ AGENTS.md missing at project root (#203)"; exit 1; }
grep -q "preset-tonal" AGENTS.md || { echo "❌ AGENTS.md lacks Skeleton v5 class guidance (#203)"; exit 1; }
if [ "$TEMPLATE" = "dashboard" ] || [ "$TEMPLATE" = "dashboard-playwright" ]; then
	grep -q "result.data" AGENTS.md || { echo "❌ dashboard AGENTS.md lacks action-response pattern (#203)"; exit 1; }
fi

echo "✅ Scaffold test passed for template=$TEMPLATE"
