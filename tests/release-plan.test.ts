import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const { buildReleasePlan, orderPackages } = await import('../scripts/release-plan.mjs');

describe('independent release plan (#330)', () => {
	it('describes every workspace with an explicit package version', () => {
		const plan = buildReleasePlan(ROOT, 'test-commit');

		expect(plan.schemaVersion).toBe(1);
		expect(plan.versionPolicy).toBe('independent');
		expect(plan.commit).toBe('test-commit');
		expect(plan.packages).toHaveLength(14);
		expect(plan.packages.every((pkg) => pkg.name && pkg.version && pkg.manifestPath)).toBe(true);
		expect(new Set(plan.packages.map((pkg) => pkg.name)).size).toBe(14);
	});

	it('publishes local dependencies before their dependents', () => {
		const ordered = orderPackages([
			{ name: '@svforge/feature', localDependencies: ['@svforge/core'] },
			{ name: '@svforge/core', localDependencies: [] }
		]);

		expect(ordered.map((pkg) => pkg.name)).toEqual(['@svforge/core', '@svforge/feature']);
	});

	it('does not allow OAuth build failures to be swallowed', () => {
		const oauth = JSON.parse(readFileSync(join(ROOT, 'packages/oauth/package.json'), 'utf8')) as {
			scripts: { build: string };
		};

		expect(oauth.scripts.build).not.toContain('|| true');
	});

	it('uses pinned actions and serializes publish runs', () => {
		const workflow = readFileSync(join(ROOT, '.github/workflows/publish.yml'), 'utf8');

		expect(workflow).toContain('group: publish-${{ github.ref }}');
		expect(workflow).toContain('cancel-in-progress: false');
		expect(workflow).toContain('actions/checkout@11d5960a326750d5838078e36cf38b85af677262');
		expect(workflow).toContain('oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6');
		expect(workflow).toContain('actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020');
		expect(workflow).not.toContain('id-token: write');
	});
});
