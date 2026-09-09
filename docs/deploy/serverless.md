# Profile: `serverless`

> **Serverless functions** — request-scoped and short-lived by design: no
> background timer, no WebSocket server, and connections must be pooled
> carefully.

## When to use

- Vercel / Netlify functions, AWS Lambda.
- No self-managed process. You accept the constraints below.

## Declare the profile

```json
// .svforge.json
{
  "deployment": { "profile": "serverless" }
}
```

Then re-run `npx svforge context`. `npx svforge doctor` now WARNS if an
installed module cannot run here (e.g. `jobs` or `realtime`).

## Environment

```env
DATABASE_URL="postgres://user:password@host/db?sslmode=require"
# REQUIRED on this profile (#332): one recycled connection per invocation,
# prepared statements off (pooler-safe).
DATABASE_RUNTIME="serverless"
BETTER_AUTH_SECRET="openssl rand -base64 32"
ORIGIN="https://app.example.dev"
```

Use a pooler in front of PostgreSQL (Neon, Supabase pooler, PgBouncer in
transaction mode) — N concurrent invocations must not open N persistent
Postgres connections.

## Minimal example (Vercel + Neon)

```bash
# 1. Create the project with an SVForge template, then push to Git.
#    Vercel builds it with @sveltejs/adapter-auto — no custom server.
# 2. Postgres: create a Neon project, copy the pooled connection string.
# 3. Set the env vars above in the Vercel dashboard (DATABASE_RUNTIME=serverless).
# 4. Declare the profile in .svforge.json and commit.
npx svforge doctor   # must list the deployment check as OK
```

## Module compatibility

- ✅ `audit` / `notifications` / `chat` — with `DATABASE_RUNTIME=serverless`.
- ✅ `uploads` / `email` / `oauth` / `ui_toast` / `dnd` / `tiptap` / `graph` /
  `blog` — request-scoped, no constraint.
- ❌ `jobs` — the in-process runner is killed between requests. Use the
  **separate-worker** profile (a dedicated worker polls the queue).
- ❌ `realtime` — function instances cannot hold WebSocket servers. Use the
  **separate-worker** profile with the separate-WS-server option.

These constraints are derived from the module ⇄ profile matrix in
`@svforge/addon-kit` — `.svforge.json` (`moduleCapabilities.*.profiles`) and
`llms.txt` ("## Deployment") always reflect them.
