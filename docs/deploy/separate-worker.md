# Profile: `separate-worker`

> **Serverless app + long-lived worker** — the web app runs serverless while
> everything long-lived (background jobs, WebSocket hub) runs on ONE dedicated
> long-lived Node deployment — the "worker". One codebase, two deployments.

## When to use

- You want the serverless app (Vercel/Lambda…) **and** you need `jobs` or
  `realtime`.

## Declare the profile

```json
// .svforge.json
{
  "deployment": { "profile": "separate-worker" }
}
```

## Environment

Web app (serverless):

```env
DATABASE_URL="postgres://user:password@host/db?sslmode=require"
DATABASE_RUNTIME="serverless"
JOBS_WORKER="web"          # the runner NEVER starts here
BETTER_AUTH_SECRET="..."
ORIGIN="https://app.example.dev"
```

Worker (one long-lived Node container):

```env
DATABASE_URL="postgres://user:password@host/db?sslmode=require"
# DATABASE_RUNTIME unset: the worker is long-lived, use the default pool.
JOBS_WORKER="worker"       # the runner starts here — exactly one worker
# Optional (realtime as a separate WS server):
# REALTIME_PORT="3001"
```

## Minimal example (Vercel web + Fly.io/Railway worker)

```bash
# 1. Web: deploy to Vercel with the env above (JOBS_WORKER=web).
# 2. Worker: same repo, same build, deployed as an always-on container that
#    boots the adapter-node server with JOBS_WORKER=worker. Scale = 1.
# 3. Realtime (optional): on the worker, start the standalone WS server —
#    realtime.listen(process.env.REALTIME_PORT). Point the client at
#    wss://ws.example.dev/api/realtime and put a reverse proxy in front that
#    forwards the Upgrade header.
# 4. Validate:
npx svforge doctor   # deployment check: OK (jobs/realtime run on the worker)
```

## Module compatibility

- ✅ `jobs` — handlers execute ONLY on the worker; web replicas enqueue.
- ✅ `realtime` — WS server on the worker (`listen()`), or in-process if the
  worker also serves HTTP.
- ✅ `audit` / `notifications` / `chat` — set `DATABASE_RUNTIME=serverless` in
  the web app; the worker keeps the default long-lived pool.
- ✅ Everything else — no constraint.

Exactly one worker polls the queue in v1 (single-process polling). Scale the
worker vertically, not horizontally.
