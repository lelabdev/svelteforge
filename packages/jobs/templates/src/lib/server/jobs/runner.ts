import { jobsApi } from './index';
import { DEFAULT_LEASE_MS } from './leases';

/**
 * Job runner (#231, #328) — processes queued jobs on an interval.
 *
 * OPT-IN ONLY (#328): installing the module never starts a poller inside the
 * web runtime. Either call `startJobRunner()` explicitly in a single-instance
 * long-lived deployment, or run the dedicated worker process
 * (`bun src/lib/server/jobs/worker.ts`, npm script `jobs:worker`) — the
 * documented production mode. Claims are atomic and lease-guarded, so many
 * runners can poll the same queue concurrently.
 *
 * Guarantees: at-least-once (handlers must be idempotent), bounded retries
 * with backoff, no overlapping batches inside THIS process. `stopJobRunner()`
 * drains gracefully: it resolves once the in-flight batch has completed.
 */

let timer: ReturnType<typeof setInterval> | null = null;
let inFlight: Promise<unknown> | null = null;

/** Start the background runner (idempotent). Never called automatically. */
export function startJobRunner(intervalMs = 5000, batchSize = 10, options: { leaseMs?: number } = {}): void {
	if (timer) return;
	const leaseMs = options.leaseMs ?? DEFAULT_LEASE_MS;
	timer = setInterval(() => {
		if (inFlight) return; // no overlapping batches in this process
		inFlight = jobsApi
			.processNextBatch(batchSize, leaseMs)
			.catch(() => {
				// keep the loop alive; next tick retries
			})
			.finally(() => {
				inFlight = null;
			});
	}, intervalMs);
	// Don't keep the process alive just for the runner — the host owns it.
	if (timer.unref) timer.unref();
}

/**
 * Stop polling and drain gracefully (#328): resolves once the in-flight batch
 * has completed (or immediately when idle). Safe to call repeatedly.
 */
export async function stopJobRunner(): Promise<void> {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
	if (inFlight) await inFlight;
	inFlight = null;
}

/** Runner state (diagnostics/tests): is the loop accepting ticks? */
export function runnerState(): { active: boolean } {
	return { active: timer !== null };
}
