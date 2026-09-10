#!/usr/bin/env bash
set -euo pipefail

echo "SvelteForge Dashboard Setup (PostgreSQL + Drizzle)"

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
echo "Pushing database schema..."
bunx drizzle-kit push --force 2>&1 || echo "Warning: drizzle-kit push failed (is PostgreSQL running? see .env.example for local/Docker/managed options)"

echo ""
echo "Done! Next steps:"
echo "  1. Create the first administrator (atomic, refuses if one exists):"
echo "       bun run admin:create -- --name 'Admin' --email admin@example.com --password '…'"
echo "     (dev alternative: http://localhost:5173/setup — dev-only route)"
echo "  2. bun dev"
echo "  3. Sign-up is CLOSED by default (SIGNUP_MODE in .env): closed | invite-only | self-service"
