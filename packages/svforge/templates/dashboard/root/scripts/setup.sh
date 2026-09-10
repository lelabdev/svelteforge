#!/usr/bin/env bash
set -euo pipefail

echo "SvelteForge Dashboard Setup (PostgreSQL + Drizzle)"

# Package-manager agnostic (#325): the scaffold may be installed with npm,
# bun, pnpm or yarn. Detect the PM from the lockfile instead of assuming bun
# — the recommended commands below always match the project.
detect_pm() {
	if [ -f bun.lock ] || [ -f bun.lockb ]; then
		echo bun
	elif [ -f pnpm-lock.yaml ]; then
		echo pnpm
	elif [ -f yarn.lock ]; then
		echo yarn
	else
		echo npm
	fi
}
PM="$(detect_pm)"

# 1. Copy .env.example if .env doesn't exist
if [ ! -f .env ]; then
	cp .env.example .env 2>/dev/null || cat > .env << 'ENV'
DATABASE_URL="postgres://postgres:postgres@localhost:5432/sf_dashboard"
ORIGIN=http://localhost:5173
BETTER_AUTH_SECRET=
SIGNUP_MODE=closed
ENV
	echo "Created .env"
else
	echo ".env already exists"
fi

# 2. Generate BETTER_AUTH_SECRET if empty
if grep -q 'BETTER_AUTH_SECRET=$' .env 2>/dev/null || grep -q 'BETTER_AUTH_SECRET=changeme' .env 2>/dev/null; then
	SECRET=$(openssl rand -base64 32)
	sed -i.bak "s|BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$SECRET|" .env && rm -f .env.bak
	echo "Generated BETTER_AUTH_SECRET"
fi

# 3. Push DB schema (PostgreSQL). Needs a reachable DATABASE_URL — see .env.example
# The PROJECT'S OWN drizzle-kit (node_modules/.bin) works identically for
# npm, bun, pnpm and yarn installs — no on-demand fetch, no PM assumption (#325).
DRIZZLE_BIN="node_modules/.bin/drizzle-kit"
if [ -x "$DRIZZLE_BIN" ]; then
	echo "Pushing database schema..."
	"$DRIZZLE_BIN" push --force 2>&1 || echo "Warning: drizzle-kit push failed (is PostgreSQL running? see .env.example for local/Docker/managed options)"
else
	echo "Warning: drizzle-kit not found in node_modules/.bin — install dependencies first (${PM} install), then re-run this script."
fi

echo ""
echo "Done! Next steps:"
echo "  1. Create the first administrator (atomic, refuses if one exists):"
echo "       ${PM} run admin:create -- --name 'Admin' --email admin@example.com --password '…'"
echo "     (dev alternative: http://localhost:5173/setup — dev-only route)"
echo "  2. ${PM} run dev"
echo "  3. Sign-up is CLOSED by default (SIGNUP_MODE in .env): closed | invite-only | self-service"
