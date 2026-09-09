# @svforge/jobs

Background job foundation for SvelteForge **dashboard** projects — run async
work without blocking a request and without coupling the business to a queue
provider (BullMQ/Redis/NATS).

## Install

```bash
npx sv add @svforge/jobs
```

Requires the **dashboard** template (auth + Drizzle). The runner starts
automatically in `hooks.server.ts` (see the deployment profiles below for
multi-process setups).

## Deployment profiles (#332)

| Profile | Jobs | Setup |
|---|---|---|
| `node-long-lived` (default) | ✅ in-process | nothing to do — the runner starts in `hooks.server.ts` |
| `separate-worker` | ✅ on the worker only | same codebase deployed twice (recipe below) |
| `serverless` | ❌ | functions are killed between requests — use `separate-worker` |
| `edge` | ❌ | no long-lived process, no raw TCP — use `separate-worker` |

### The separate-worker recipe (#328)

One codebase, two deployments, one Postgres:

1. **Worker deployment** (long-lived Node container, adapter-node):
   `JOBS_WORKER=worker` — starts the runner; only here are handlers executed.
2. **Web replicas** (however many, even serverless): `JOBS_WORKER=web` — the
   runner never starts; requests just `enqueue` and return.
3. Point both at the same `DATABASE_URL`. The queue IS the database table —
   no extra broker needed.

Exactly one worker polls the queue in v1 (single-process polling, no row
locking): scale the worker vertically or shard by job type, not by replicas.

## Define a handler

```ts
import { define } from '$lib/server/jobs';

define('payroll.export', async (payload, ctx) => {
	await ctx.progress(10);
	// long work: generate CSV/PDF, sync API, batch email…
	await ctx.progress(100);
	return { fileId: 'f_123' };
});
```

## Enqueue

```ts
import { jobsApi } from '$lib/server/jobs';

const job = await jobsApi.enqueue('payroll.export', {
	organizationId,
	period: '2026-07'
});
// HTTP response returns immediately
```

## States

`queued → running → completed | failed` — with `attempts`, `progress`,
`result`, `error`, timestamps.

## Guarantees (v1) — read before relying on it

- **At-least-once**: a crashed handler may re-run → handlers must be
  **idempotent** (guard by payload key/entity id).
- **Bounded retries**: `maxAttempts` (default 3), never infinite.
- **Single-process polling** (default 5s, `startJobRunner(intervalMs)`). For
  multi-instance deployments, run the runner on ONE instance (a dedicated
  worker) — no row locking in v1.
- Failures are persisted (sanitized `error`) and diagnosable via `jobsApi.get`.

## Optional composition

- **realtime (#229)**: publish `job.progress` / `job.completed` on a channel so
  the UI updates live (optional — never required).
- **notifications (#230)**: at completion/failure, create a notification for
  the requesting user (optional).
- **email**: usable from inside a handler (optional).

## What's included

- `$lib/server/jobs/schema.ts` — Drizzle schema (`jobs`)
- `$lib/server/jobs/index.ts` — `define`, `enqueue`, `progress`, `get`, `processNextBatch`
- `$lib/server/jobs/runner.ts` — interval runner (`startJobRunner` / `stopJobRunner`)
- Schema auto-registered; runner auto-started in `hooks.server.ts`

## License

MIT
