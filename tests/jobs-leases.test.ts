import { describe, it, expect } from 'vitest';
import { computeBackoffMs, isClaimable } from '../packages/jobs/templates/src/lib/server/jobs/leases';

/**
 * #328 — lease/backoff decisions are pure so they can be tested without a
 * database. The SQL claim (FOR UPDATE SKIP LOCKED) is covered behaviorally by
 * the PostgreSQL test shipped with the jobs template (dashboard-foundations).
 */
describe('jobs leases helpers (#328)', () => {
	const BASE = Date.UTC(2025, 0, 1, 12, 0, 0);
	const row = (over: Partial<{ status: string; runAfter: Date | null; leaseUntil: Date | null }> = {}) => ({
		status: 'queued',
		runAfter: null as Date | null,
		leaseUntil: null as Date | null,
		...over
	});

	it('a fresh queued job is claimable', () => {
		expect(isClaimable(row(), new Date(BASE))).toBe(true);
	});

	it('a queued job with a future runAfter (backoff) is NOT claimable', () => {
		expect(isClaimable(row({ runAfter: new Date(BASE + 5_000) }), new Date(BASE))).toBe(false);
	});

	it('a queued job becomes claimable once its backoff has elapsed', () => {
		expect(isClaimable(row({ runAfter: new Date(BASE + 5_000) }), new Date(BASE + 5_000))).toBe(true);
	});

	it('a running job with a live lease is NOT claimable (no duplicate execution)', () => {
		expect(isClaimable(row({ status: 'running', leaseUntil: new Date(BASE + 60_000) }), new Date(BASE))).toBe(false);
	});

	it('a running job whose lease EXPIRED is claimable again (crash recovery)', () => {
		expect(isClaimable(row({ status: 'running', leaseUntil: new Date(BASE - 1) }), new Date(BASE))).toBe(true);
	});

	it('completed and failed jobs are never claimable', () => {
		expect(isClaimable(row({ status: 'completed' }), new Date(BASE))).toBe(false);
		expect(isClaimable(row({ status: 'failed' }), new Date(BASE))).toBe(false);
	});

	it('backoff grows exponentially and is capped', () => {
		expect(computeBackoffMs(1)).toBe(1_000);
		expect(computeBackoffMs(2)).toBe(2_000);
		expect(computeBackoffMs(3)).toBe(4_000);
		expect(computeBackoffMs(10)).toBe(60_000); // cap
		expect(computeBackoffMs(0)).toBe(1_000); // floor
	});
});
