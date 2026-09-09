import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers';

/**
 * Tests for #332/#328 — the jobs module connects to the `separate-worker`
 * deployment profile. One codebase, two deployments: web replicas never run
 * the runner (JOBS_WORKER=web), the dedicated worker does (JOBS_WORKER=worker
 * or unset for the default single-node setup).
 */
describe('#332/#328 — jobs × separate-worker profile', () => {
	it('the hooks guard keeps the default behavior and honors JOBS_WORKER=web', () => {
		const index = readFileSync(join(ROOT, 'packages/jobs/src/index.ts'), 'utf-8');
		// The guard is injected with the runner call into hooks.server.ts.
		expect(index).toMatch(/JOBS_WORKER/);
		expect(index).toMatch(/startJobRunner/);
		// env import injected so the guard can read the variable.
		expect(index).toMatch(/\$env\/dynamic\/private/);
	});

	it('the injected guard: runner starts by default, JOBS_WORKER=web opts out', () => {
		const index = readFileSync(join(ROOT, 'packages/jobs/src/index.ts'), 'utf-8');
		expect(index).toMatch(/!== 'web'/);
		// Documented comment referencing the profile (#332/#328).
		expect(index).toMatch(/#328|#332|separate-worker/);
	});

	it('the runner documents the multi-process contract via the profile', () => {
		const runner = readFileSync(join(ROOT, 'packages/jobs/templates/src/lib/server/jobs/runner.ts'), 'utf-8');
		expect(runner).toMatch(/JOBS_WORKER/);
		expect(runner).toMatch(/separate-worker/);
	});

	it('the README documents the separate-worker deployment recipe', () => {
		const readme = readFileSync(join(ROOT, 'packages/jobs/README.md'), 'utf-8');
		expect(readme).toMatch(/separate-worker/i);
		expect(readme).toMatch(/JOBS_WORKER=web/);
		expect(readme).toMatch(/JOBS_WORKER=worker/);
		// The recipe is explicit about the single-runner guarantee.
		expect(readme).toMatch(/only one|exactly one|ONE instance|only the worker/i);
	});

	it('the module declares the deployment constraint in nextSteps', () => {
		const index = readFileSync(join(ROOT, 'packages/jobs/src/index.ts'), 'utf-8');
		expect(index).toMatch(/separate-worker|serverless/i);
	});
});
