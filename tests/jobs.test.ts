import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers';

/**
 * Tests for #231 — background jobs foundation, hardened by #328: the runner is
 * NEVER auto-started in the web runtime, claims are atomic (FOR UPDATE SKIP
 * LOCKED), claimed work is lease-guarded so crashed workers recover, and a
 * dedicated worker entrypoint is the documented deployment mode.
 */
describe('jobs module (#231, #328)', () => {
	const jobsDir = join(ROOT, 'packages/jobs/templates/src/lib/server/jobs');
	const addonIndex = () => readFileSync(join(ROOT, 'packages/jobs/src/index.ts'), 'utf-8');

	it('ships schema, API, runner, worker entrypoint, lease helpers', () => {
		expect(existsSync(join(jobsDir, 'schema.ts'))).toBe(true);
		expect(existsSync(join(jobsDir, 'index.ts'))).toBe(true);
		expect(existsSync(join(jobsDir, 'runner.ts'))).toBe(true);
		// #328: dedicated worker entrypoint — the documented deployment mode.
		expect(existsSync(join(jobsDir, 'worker.ts'))).toBe(true);
		expect(existsSync(join(jobsDir, 'leases.ts'))).toBe(true);
	});

	it('states: queued → running → completed|failed with attempts/progress', () => {
		const schema = readFileSync(join(jobsDir, 'schema.ts'), 'utf-8');
		expect(schema).toMatch(/queued/);
		expect(schema).toMatch(/running/);
		expect(schema).toMatch(/completed/);
		expect(schema).toMatch(/failed/);
		expect(schema).toMatch(/attempts/);
		expect(schema).toMatch(/progress/);
		expect(schema).toMatch(/maxAttempts/);
	});

	it('schema carries the lease columns (#328): lockedAt, leaseUntil, runAfter', () => {
		const schema = readFileSync(join(jobsDir, 'schema.ts'), 'utf-8');
		expect(schema).toMatch(/lockedAt/);
		expect(schema).toMatch(/leaseUntil/);
		expect(schema).toMatch(/runAfter/);
	});

	it('API is small and typed: define/enqueue/progress/get/processNextBatch', () => {
		const api = readFileSync(join(jobsDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/export function define/);
		expect(api).toMatch(/async enqueue/);
		expect(api).toMatch(/async progress/);
		expect(api).toMatch(/async get/);
		expect(api).toMatch(/processNextBatch/);
		expect(api).toMatch(/JobHandlerContext/);
	});

	it('claims are atomic: FOR UPDATE SKIP LOCKED inside a transaction (#328)', () => {
		const api = readFileSync(join(jobsDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/db\.transaction/);
		expect(api).toMatch(/for\('update',\s*\{\s*skipLocked: true\s*\}\)/);
		// the claim reserves the job: running + lockedAt + leaseUntil, in ONE write
		expect(api).toMatch(/leaseUntil/);
	});

	it('lease expiry + backoff decide claimability through pure helpers (#328)', () => {
		const leases = readFileSync(join(jobsDir, 'leases.ts'), 'utf-8');
		expect(leases).toMatch(/isClaimable/);
		expect(leases).toMatch(/computeBackoffMs/);
	});

	it('non-retryable errors fail the job immediately (#328)', () => {
		const api = readFileSync(join(jobsDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/NonRetryableJobError/);
	});

	it('runner: heartbeat context, graceful drain, opt-in only (#328)', () => {
		const runner = readFileSync(join(jobsDir, 'runner.ts'), 'utf-8');
		expect(runner).toMatch(/startJobRunner/);
		expect(runner).toMatch(/stopJobRunner/);
		// graceful shutdown: stop resolves after the in-flight batch
		expect(runner).toMatch(/Promise/);
		// overlap guard stays (per-process: no overlapping batches)
		expect(runner).toMatch(/if \(inFlight\) return/);
		expect(runner).toMatch(/unref/);
	});

	it('bounded retries (maxAttempts, no infinite retry)', () => {
		const api = readFileSync(join(jobsDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/maxAttempts/);
		// failed jobs get finishedAt; retryable stay queued with a backoff
		expect(api).toMatch(/'failed'\s*:\s*'queued'/);
	});

	it('unknown handler → job fails cleanly', () => {
		const api = readFileSync(join(jobsDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/Unknown handler/);
		expect(api).toMatch(/status: 'failed'/);
	});

	it('does not couple to a queue provider', () => {
		const index = addonIndex();
		expect(index).not.toMatch(/bullmq|redis|nats/i);
		const readme = readFileSync(join(ROOT, 'packages/jobs/README.md'), 'utf-8');
		expect(readme).toMatch(/at-least-once/i);
		expect(readme).toMatch(/idempotent/);
	});

	it('module requires DB capability and never auto-starts the runner (#328)', () => {
		const index = addonIndex();
		// #323: the gate is capability-based (structural check), not template-name based
		expect(index).toMatch(/checkModuleCapabilities\(cwd, 'jobs'\)/);
		// #324/#258: AI-context merge is planned through the shared kit
		expect(index).toMatch(/planAddonContext/);
		expect(index).toMatch(/background jobs/);
		// #328: installation must NOT silently add a background process to the
		// web runtime — hooks.server.ts is left untouched.
		expect(index).not.toMatch(/hooks\.server\.ts/);
		expect(index).not.toMatch(/startJobRunner/);
		// #328: the explicit worker entrypoint IS wired instead
		expect(index).toMatch(/jobs:worker/);
	});

	it('documents the deployment modes: worker command, serverless warning (#328)', () => {
		const readme = readFileSync(join(ROOT, 'packages/jobs/README.md'), 'utf-8');
		expect(readme).toMatch(/jobs:worker/);
		expect(readme).toMatch(/separate-worker/);
		expect(readme).toMatch(/serverless/i);
	});
});
