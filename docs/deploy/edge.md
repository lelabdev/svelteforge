# Profile: `edge`

> **Edge runtime** — edge isolates (Cloudflare Workers, Deno Deploy, Vercel
> Edge): no long-lived process, no WebSocket server, and no raw TCP sockets.

## When to use

- Maximum latency wins and the app is mostly static/UI.
- You accept the database constraint below **or** you bring an HTTP-driver
  implementation for PostgreSQL.

## Hard constraints (#332)

- `postgres.js` opens **raw TCP sockets** — edge isolates do not allow them.
  Every module requiring `database.drizzle.postgres` is unsupported here until
  the DB driver is replaced (e.g. an HTTP-based Postgres proxy/driver). SVForge
  does not provide that replacement.
- No WebSocket server, no long-lived process — `jobs` and `realtime` need the
  **separate-worker** profile.

## Declare the profile

```json
// .svforge.json
{
  "deployment": { "profile": "edge" }
}
```

## Environment

```env
# Only if your app still accesses Postgres OUTSIDE edge (e.g. prerender):
DATABASE_URL="postgres://user:password@host/db?sslmode=require"
BETTER_AUTH_SECRET="openssl rand -base64 32"
ORIGIN="https://app.example.dev"
```

## Minimal example (Cloudflare Pages)

```bash
# 1. Static/UI-first SVForge base project.
# 2. Declare the profile in .svforge.json (above) and commit.
# 3. Keep DB-backed routes on a Node deployment or behind an API you own.
npx svforge doctor   # lists the edge constraints explicitly
```

## Module compatibility

- ✅ `ui_toast` / `dnd` / `tiptap` / `graph` / `blog` / `email` / `oauth` /
  `uploads` — no runtime coupling.
- ❌ `audit` / `notifications` / `chat` — raw TCP (`postgres.js`) is not
  available on edge.
- ❌ `jobs` / `realtime` — use the **separate-worker** profile.
