import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { doctor } from '../packages/svforge/src';

/**
 * Tests for #332 — the doctor surfaces deployment-profile compatibility.
 *
 * The doctor warns ONLY when an installed module is incompatible with the
 * DECLARED deployment profile (.svforge.json deployment.profile). Without a
 * declaration there is nothing to warn about: it reports the assumption
 * (node-long-lived) and how to make it explicit.
 */

function makeProject(files: Record<string, unknown>, dirs: string[] = []): string {
	const dir = mkdtempSync(join(tmpdir(), 'sf-doc-deploy-'));
	for (const d of dirs) mkdirSync(join(dir, d), { recursive: true });
	for (const [path, content] of Object.entries(files)) {
		writeFileSync(join(dir, path), typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
	}
	return dir;
}

const BASE_DEPS = {
	devDependencies: {
		svelte: '^5.0.0',
		'@skeletonlabs/skeleton-svelte': '^5.0.0',
		'@sveltejs/kit': '^2.0.0'
	}
};

function manifest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		schema: 1,
		template: 'dashboard',
		modules: [] as string[],
		capabilities: [],
		patterns: {},
		generatedBy: 'svforge test',
		...overrides
	};
}

function project(overrides: Record<string, unknown> = {}): string {
	return makeProject(
		{
			'vite.config.ts': 'export default {};',
			'package.json': BASE_DEPS,
			'.svforge.json': manifest(overrides)
		},
		['src/lib/components/svforge']
	);
}

const deploymentResult = (results: Awaited<ReturnType<typeof doctor>>['results'], module: string) =>
	results.find((r) => r.module === module);

/** Dashboard-template manifests make the doctor check the dashboard env vars — provide real values. */
const DASHBOARD_VARS = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'ORIGIN'];
let savedEnv: Map<string, string | undefined>;
afterEach(() => {
	for (const [name, value] of savedEnv ?? []) {
		if (value === undefined) delete process.env[name];
		else process.env[name] = value;
	}
});
function withDashboardEnv(): void {
	savedEnv = new Map();
	for (const name of DASHBOARD_VARS) {
		savedEnv.set(name, process.env[name]);
		process.env[name] = 'postgres://test.local/test';
	}
	process.env['BETTER_AUTH_SECRET'] = 'a-real-looking-secret-value-for-tests';
}

describe('#332 — doctor deployment-profile compatibility', () => {
	it('warns when an installed module cannot run on the declared profile', async () => {
		const dir = project({
			modules: ['jobs'],
			deployment: { profile: 'serverless' }
		});
		try {
			const report = await doctor(dir);
			const deployment = deploymentResult(report.results, 'deployment');
			expect(deployment?.status).toBe('warn');
			expect(deployment?.message).toContain('jobs');
			expect(deployment?.message).toMatch(/separate-worker|worker|long-lived/i);
			expect(report.healthy).toBe(false);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('reports every conflicting module (edge vs DB modules + realtime)', async () => {
		const dir = project({
			modules: ['audit', 'realtime'],
			deployment: { profile: 'edge' }
		});
		try {
			const report = await doctor(dir);
			const deployment = deploymentResult(report.results, 'deployment');
			expect(deployment?.status).toBe('warn');
			expect(deployment?.message).toContain('audit');
			expect(deployment?.message).toContain('realtime');
			expect(deployment?.message).toMatch(/TCP|WebSocket/i);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('is green when the installed modules match the declared profile', async () => {
		const dir = project({
			modules: ['jobs', 'realtime'],
			deployment: { profile: 'node-long-lived' }
		});
		withDashboardEnv();
		try {
			const report = await doctor(dir);
			const deployment = deploymentResult(report.results, 'deployment');
			expect(deployment?.status).toBe('ok');
			expect(deployment?.message).toMatch(/node-long-lived/);
			expect(report.healthy).toBe(true);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('the separate-worker profile supports jobs and realtime (via the worker)', async () => {
		const dir = project({
			modules: ['jobs', 'realtime'],
			deployment: { profile: 'separate-worker' }
		});
		withDashboardEnv();
		try {
			const report = await doctor(dir);
			const deployment = deploymentResult(report.results, 'deployment');
			expect(deployment?.status).toBe('ok');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('without a declaration it reports the assumption and the remedy — no warning', async () => {
		const dir = project({ modules: ['jobs'] });
		try {
			const report = await doctor(dir);
			const deployment = deploymentResult(report.results, 'deployment');
			expect(deployment?.status).toBe('ok');
			expect(deployment?.message).toMatch(/node-long-lived/);
			expect(deployment?.message).toMatch(/deployment/i);
		expect(deployment?.message).toMatch(/profile/);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('an unknown declared profile is reported as a warning naming the valid values', async () => {
		const dir = project({ deployment: { profile: 'quantum' } });
		try {
			const report = await doctor(dir);
			const deployment = deploymentResult(report.results, 'deployment');
			expect(deployment?.status).toBe('warn');
			expect(deployment?.message).toContain('quantum');
			expect(deployment?.message).toContain('node-long-lived');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('an ephemeral profile with the dashboard DB reminds about DATABASE_RUNTIME (ok, not a warning)', async () => {
		const dir = project({ deployment: { profile: 'serverless' } });
		withDashboardEnv();
		try {
			const report = await doctor(dir);
			const db = deploymentResult(report.results, 'database-runtime');
			expect(db?.status).toBe('ok');
			expect(db?.message).toMatch(/DATABASE_RUNTIME=serverless/);
			// And the profile check itself stays green (no modules conflict).
			expect(deploymentResult(report.results, 'deployment')?.status).toBe('ok');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
