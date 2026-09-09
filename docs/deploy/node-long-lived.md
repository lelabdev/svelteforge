# Profile: `node-long-lived` (default)

> **Long-lived Node server** — the scaffold default. Everything SVForge
> installs works here as-is: background timers and WebSocket servers live in
> the same process as the app.

## When to use

- You deploy on a VPS, a container (Docker/Compose, Coolify), or any host that
  keeps a Node process alive.
- You use `@sveltejs/adapter-node` (or any adapter that boots a real server).

## Environment

```env
DATABASE_URL="postgres://user:password@host:5432/dbname?sslmode=require"
# DATABASE_RUNTIME is UNSET on this profile: the default long-lived pool is
# what you want for an always-on process.
BETTER_AUTH_SECRET="openssl rand -base64 32"
ORIGIN="https://app.example.dev"
```

## Minimal example (Docker)

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile && bun run build

FROM oven/bun:1
WORKDIR /app
COPY --from=build /app .
EXPOSE 3000
# adapter-node entrypoint — one long-lived process serving HTTP (and the
# WebSocket hub when the realtime module is installed).
CMD ["bun", "./build/index.js"]
```

## Module compatibility

Everything is supported **in-process**, including the runtime modules:

- ✅ `jobs` — the runner starts in `hooks.server.ts` (default behavior).
- ✅ `realtime` — `realtime.attach(server)` on the adapter-node server.
- ✅ `audit` / `notifications` / `chat` — PostgreSQL via `postgres.js` (TCP).
- ✅ `uploads` / `email` / `oauth` / `ui_toast` / `dnd` / `tiptap` / `graph` /
  `blog` — no runtime constraint.

The declared profile in `.svforge.json` stays `node-long-lived`; validate any
host change with `npx svforge doctor`.
