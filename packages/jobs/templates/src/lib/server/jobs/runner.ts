import { jobsApi } from './index';

/**
 * Job runner (#231) — processes queued jobs on an interval.
 *
 * v1 guarantees: at-least-once (handlers must be idempotent), bounded retries,
 * single-process polling. For multi-process deployments, only one instance
 * should run the runner (e.g. a dedicated worker), or extend with a row lock.
 */

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

/** Start the background runner (idempotent). */
export function startJobRunner(intervalMs = 5000, batchSize = 10): void {
	if (timer) return;
	timer = setInterval(async () => {
		if (running) return; // no overlapping batches
		running = true;
		try {
			await jobsApi.processNextBatch(batchSize);
		} catch {
			// keep the loop alive; next tick retries
		} finally {
			running = false;
		}
	}, intervalMs);
	// Don't keep the process alive just for the runner — SvelteKit SSR owns it.
	if (timer.unref) timer.unref();
}

/** Stop the runner. */
export function stopJobRunner(): void {
	if (timer) clearInterval(timer);
	timer = null;
}
