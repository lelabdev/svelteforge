import { describe, it, expect } from 'vitest';

const { assertNoDrift, discoverPrebuildPackages, FIX_COMMAND } = await import('../scripts/check-generated.mjs');

describe('generated-manifest freshness gate (#329)', () => {
	it('discovers every prebuild package, including the previously omitted modules', () => {
		const packages = discoverPrebuildPackages();
		const directories = packages.map((pkg) => pkg.directory);

		expect(directories).toHaveLength(14);
		for (const previouslyOmitted of ['realtime', 'audit', 'notifications', 'jobs', 'chat']) {
			expect(directories).toContain(`packages/${previouslyOmitted}`);
		}
	});

	it('passes on a clean tree', () => {
		const git = () => ({ status: 0, stdout: '', stderr: '' });

		expect(assertNoDrift(process.cwd(), git)).toEqual([]);
	});

	it('fails with the drift, the fix command, and a nonzero contract on stale files', () => {
		const git = () => ({
			status: 0,
			stdout: ' M packages/audit/src/templates.ts\n?? packages/svforge/src/generated-root-file.ts\n',
			stderr: ''
		});

		expect(() => assertNoDrift(process.cwd(), git)).toThrow(/Stale generated files committed/);
		expect(() => assertNoDrift(process.cwd(), git)).toThrow(/packages\/audit\/src\/templates\.ts/);
		expect(() => assertNoDrift(process.cwd(), git)).toThrow(new RegExp(FIX_COMMAND.replace(/[*.'()]/g, '\\$&')));
	});
});
