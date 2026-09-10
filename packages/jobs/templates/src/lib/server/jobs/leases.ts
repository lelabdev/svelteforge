/**
 * Pure lease/backoff decision helpers (#328) — kept free of any import so the
 * claim rules are unit-testable without a database and reusable by both the
 * API and the tests.
 *
 * A job is claimable when:
 * - `queued` and its backoff (`runAfter`) has elapsed — fresh jobs have no
 *   `runAfter` and are immediately claimable;
 * - `running` but its lease (`leaseUntil`) has EXPIRED — the claiming worker
 *   crashed before completing, the job must be recoverable (at-least-once);
 * - anything else (completed/failed) is terminal and never claimable.
 */

/** Default claim lease. Long handlers must heartbeat (see ctx.heartbeat). */
export const DEFAULT_LEASE_MS = 60_000;

/** Retry backoff cap. */
export const MAX_BACKOFF_MS = 60_000;
/** Retry backoff base (first retry waits 1s, then 2s, 4s, …). */
export const BASE_BACKOFF_MS = 1_000;

/** Exponential backoff for the Nth attempt (1-based), capped. */
export function computeBackoffMs(attempt: number): number {
	const safeAttempt = Number.isFinite(attempt) && attempt >= 1 ? Math.floor(attempt) : 1;
	return Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** (safeAttempt - 1));
}

export interface ClaimableJob {
	status: string;
	runAfter: Date | null;
	leaseUntil: Date | null;
}

/** Can this row be claimed at `now`? Mirrors the SQL claim predicate. */
export function isClaimable(job: ClaimableJob, now: Date): boolean {
	if (job.status === 'queued') {
		return job.runAfter === null || job.runAfter.getTime() <= now.getTime();
	}
	if (job.status === 'running') {
		return job.leaseUntil !== null && job.leaseUntil.getTime() < now.getTime();
	}
	return false;
}
