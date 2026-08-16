import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers';

/**
 * Tests for #231 — background jobs foundation. The business must not import
 * a queue provider; the backend is encapsulated with bounded retries.
 */
describe('jobs module (#231)', () => {
	const jobsDir = join(ROOT, 'packages/jobs/templates/src/lib/server/jobs');

	it('ships schema, API, runner', () => {
		expect(existsSync(join(jobsDir, 'schema.ts'))).toBe(true);
		expect(existsSync(join(jobsDir, 'index.ts'))).toBe(true);
		expect(existsSync(join(jobsDir, 'runner.ts'))).toBe(true);
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

	it('API is small and typed: define/enqueue/progress/get/processNextBatch', () => {
		const api = readFileSync(join(jobsDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/export function define/);
		expect(api).toMatch(/async enqueue/);
		expect(api).toMatch(/async progress/);
		expect(api).toMatch(/async get/);
		expect(api).toMatch(/processNextBatch/);
		expect(api).toMatch(/JobHandlerContext/);
	});

	it('bounded retries (maxAttempts, no infinite retry)', () => {
		const api = readFileSync(join(jobsDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/maxAttempts/);
		expect(api).toMatch(/attempts >= job\.maxAttempts/);
		// failed jobs get finishedAt; retryable stay queued
		expect(api).toMatch(/failed\s*\?\s*'failed'\s*:\s*'queued'/);
	});

	it('unknown handler → job fails cleanly', () => {
		const api = readFileSync(join(jobsDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/Unknown handler/);
		expect(api).toMatch(/status: 'failed'/);
	});

	it('runner polls with overlap guard and unref', () => {
		const runner = readFileSync(join(jobsDir, 'runner.ts'), 'utf-8');
		expect(runner).toMatch(/startJobRunner/);
		expect(runner).toMatch(/setInterval/);
		expect(runner).toMatch(/if \(running\) return/);
		expect(runner).toMatch(/unref/);
	});

	it('does not couple to a queue provider', () => {
		const index = readFileSync(join(ROOT, 'packages/jobs/src/index.ts'), 'utf-8');
		expect(index).not.toMatch(/bullmq|redis|nats/i);
		const readme = readFileSync(join(ROOT, 'packages/jobs/README.md'), 'utf-8');
		expect(readme).toMatch(/at-least-once/i);
		expect(readme).toMatch(/idempotent/);
	});

	it('module requires dashboard, auto-starts runner, enriches context', () => {
		const index = readFileSync(join(ROOT, 'packages/jobs/src/index.ts'), 'utf-8');
		expect(index).toMatch(/template:dashboard/);
		expect(index).toMatch(/startJobRunner/);
		expect(index).toMatch(/hooks\.server\.ts/);
		expect(index).toMatch(/enrichManifest/);
		expect(index).toMatch(/sv\.file\('\.svforge\.json'/);
		// #258: the module also merges its capability into llms.txt (manifest
		// alone is not enough — svforge is not installed in generated projects)
		expect(index).toMatch(/mergeLlmstxt/);
		expect(index).toMatch(/sv\.file\('llms\.txt'/);
		expect(index).toMatch(/background jobs/);
	});
});
