#!/usr/bin/env bash
set -euo pipefail

TEMPLATE="${1:-base}"
TMP_DIR="/tmp/sf-scaffold-$TEMPLATE-$$"

# Resolve the repo root (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Testing svforge scaffold: template=$TEMPLATE"

# Clean up on exit
trap "rm -rf $TMP_DIR" EXIT

# 1. Build svforge and create a local tarball
echo "Building svforge package..."
cd "$REPO_ROOT/packages/svforge"
bun run build >/dev/null 2>&1
TARBALL=$(bun pm pack --destination /tmp 2>&1 | grep -oP '/tmp/svforge-[0-9.]+\.tgz')
echo "Tarball: $TARBALL"

# 2. Create minimal SvelteKit project
bunx sv create "$TMP_DIR" --template minimal --types ts --no-install --no-add-ons --no-download-check 2>&1

cd "$TMP_DIR"

# 3. Add svforge from local tarball with specified template
bunx sv add "$TARBALL=template:$TEMPLATE" --install bun --no-download-check 2>&1

# 4. For dashboard: set up minimal env and DB before building
if [ "$TEMPLATE" = "dashboard" ]; then
	echo "DATABASE_URL=\"file:local.db\"" > .env
	echo "ORIGIN=http://localhost:5173" >> .env
	echo "BETTER_AUTH_SECRET=test-secret-not-for-production" >> .env

	# Generate auth schema and push DB schema
	bunx drizzle-kit generate 2>&1 || true
	bunx drizzle-kit push 2>&1 || true
fi

# 5. Build the project to validate it compiles
bun run build 2>&1

echo "✅ Scaffold test passed for template=$TEMPLATE"
