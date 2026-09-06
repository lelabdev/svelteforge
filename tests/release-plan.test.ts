import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const {
	buildReleasePlan,
	checkPublishAccess,
	checkRegistry,
	compareVersions,
	orderPackages,
	preflightPackage,
	publishPlan,
	parseVersion
} = await import('../scripts/release-plan.mjs');

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

	it('compares full SemVer prerelease identifiers and accepts build metadata', () => {
		expect(compareVersions('1.0.0-beta.10', '1.0.0-beta.2')).toBeGreaterThan(0);
		expect(compareVersions('1.0.0-beta.2', '1.0.0-beta')).toBeGreaterThan(0);
		expect(compareVersions('1.0.0+build.10', '1.0.0+build.2')).toBe(0);
		expect(parseVersion('1.2.3+build.7').build).toEqual(['build', '7']);
		expect(() => parseVersion('1.0.0-01')).toThrow(/Unsupported package version/);
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

	it('uses pinned actions and serializes all publish runs globally', () => {
		const workflow = readFileSync(join(ROOT, '.github/workflows/publish.yml'), 'utf8');

		expect(workflow).toContain('group: publish');
		expect(workflow).not.toContain('group: publish-${{ github.ref }}');
		expect(workflow).toContain('cancel-in-progress: false');
		expect(workflow).toContain('actions/checkout@11d5960a326750d5838078e36cf38b85af677262');
		expect(workflow).toContain('oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6');
		expect(workflow).toContain('actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020');
		expect(workflow).not.toContain('id-token: write');
		expect(workflow).toContain('--check-access');
		expect(workflow).toContain('npm-consumer-smoke.mjs');
	});

	it('checks registry state and skips already-published versions', () => {
		const calls = [];
		const plan = {
			packages: [
				{ name: '@svforge/old', version: '1.0.0', directory: 'packages/old', localDependencies: [] },
				{ name: '@svforge/new', version: '1.0.0', directory: 'packages/new', localDependencies: [] }
			]
		};
		const npm = (args) => {
			calls.push(args);
			return { status: 0, stdout: args[1] === '@svforge/old' ? '["1.0.0"]' : '["0.9.0"]', stderr: '' };
		};

		const checked = checkRegistry(plan, ROOT, npm);
		expect(checked.packages[0].registry.published).toBe(true);
		expect(checked.packages[1].registry.published).toBe(false);
		expect(calls).toHaveLength(2);
	});

	it('fails access preflight when any package is not writable', () => {
		const plan = { packages: [{ name: 'svforge' }, { name: '@svforge/audit' }] };
		const npm = () => ({ status: 0, stdout: JSON.stringify({ svforge: 'read-write' }), stderr: '' });

		expect(() => checkPublishAccess(plan, ROOT, npm)).toThrow(/@svforge\/audit/);
	});

	it('runs tarball preflight and reports missing required files', () => {
		const pkg = { name: 'svforge', version: '1.2.0', directory: 'packages/svforge' };
		const files = ['README.md', 'package.json', 'LICENSE', 'dist/index.js', 'dist/index.d.ts', 'bin/svforge.mjs'];
		const npm = () => ({ status: 0, stdout: JSON.stringify([{ files: files.map((path) => ({ path })) }]), stderr: '' });
		expect(preflightPackage(pkg, ROOT, npm).fileCount).toBe(files.length);

		const broken = () => ({ status: 0, stdout: JSON.stringify([{ files: files.filter((path) => path !== 'dist/index.d.ts').map((path) => ({ path })) }]), stderr: '' });
		expect(() => preflightPackage(pkg, ROOT, broken)).toThrow(/dist\/index\.d\.ts/);
	});

	it('resumes a partial release without republishing immutable versions', () => {
		const plan = {
			packages: [
				{ name: '@svforge/already', version: '1.0.0', directory: 'packages/already', registry: { published: true } },
				{ name: '@svforge/first', version: '1.0.0', directory: 'packages/first', registry: { published: false } },
				{ name: '@svforge/second', version: '1.0.0', directory: 'packages/second', registry: { published: false } }
			]
		};
		const firstCalls = [];
		const failingNpm = (args, cwd) => {
			if (args[0] === 'publish') firstCalls.push(cwd);
			return { status: firstCalls.length === 2 ? 1 : 0, stdout: '', stderr: '' };
		};
		expect(() => publishPlan(plan, ROOT, failingNpm)).toThrow(/publish failed/);
		expect(firstCalls).toEqual([join(ROOT, 'packages/first'), join(ROOT, 'packages/second')]);

		const resumed = { ...plan, packages: plan.packages.map((pkg) => pkg.name === '@svforge/first' ? { ...pkg, registry: { published: true } } : pkg) };
		const resumedCalls = [];
		publishPlan(resumed, ROOT, (args, cwd) => {
			if (args[0] === 'publish') resumedCalls.push(cwd);
			return { status: 0, stdout: '', stderr: '' };
		});
		expect(resumedCalls).toEqual([join(ROOT, 'packages/second')]);
	});
});
