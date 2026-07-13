#!/usr/bin/env bash
set -euo pipefail

TEMPLATE="${1:-base}"
TMP_DIR="/tmp/sf-scaffold-$TEMPLATE-$$"

echo "Testing svforge scaffold: template=$TEMPLATE"

# Clean up on exit
trap "rm -rf $TMP_DIR" EXIT

# 1. Create minimal SvelteKit project
bunx sv create "$TMP_DIR" --template minimal --types ts --no-install --no-add-ons --no-download-check 2>&1

cd "$TMP_DIR"

# 2. Add svforge with specified template
bunx sv add "svforge=template:$TEMPLATE" --install bun --no-download-check 2>&1

# 3. For dashboard: ensure all deps are installed before building
if [ "$TEMPLATE" = "dashboard" ]; then
	# The dashboard template imports drizzle-orm, better-auth etc.
	# Make sure they are installed.
	bun install 2>&1

	echo "DATABASE_URL=\"file:local.db\"" > .env
	echo "ORIGIN=http://localhost:5173" >> .env
	echo "BETTER_AUTH_SECRET=test-secret-not-for-production" >> .env

	# Generate and push DB schema
	bunx drizzle-kit generate 2>&1 || true
	bunx drizzle-kit push 2>&1 || true
fi

# 4. Build the project to validate it compiles
bun run build 2>&1

echo "✅ Scaffold test passed for template=$TEMPLATE"
