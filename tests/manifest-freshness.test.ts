import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { readDirRecursively } from '../scripts/prebuild-utils';

const ROOT = process.cwd();

/**
 * Manifest freshness guard (#206 handover readiness).
 *
 * `packages/<name>/src/templates.ts` is AUTO-GENERATED from `packages/<name>/templates/src/**`
 * by each package's prebuild script. The #1 repo gotcha (AGENTS.md): editing a
 * template file WITHOUT regenerating the manifest means the scaffold silently
 * ships the stale embedded version — CI stays green.
 *
 * These behavioral tests compare the committed manifests against the actual
 * template directories, so a forgotten prebuild fails immediately with the
 * exact command to run.
 */
const modulePackages = [
	'blog',
	'dnd',
	'email',
	'graph',
	'oauth',
	'tiptap',
	'ui_toast',
	'uploads'
] as const;

describe('manifest freshness — templates.ts matches templates/ (#206)', () => {
	it('svforge: baseFiles matches templates/base/src', async () => {
		const { baseFiles } = await import('../packages/svforge/src/templates');
		const onDisk = readDirRecursively(join(ROOT, 'packages/svforge/templates/base/src'));
		expect(onDisk, STALE_MESSAGE).toEqual(baseFiles);
	});

	it('svforge: dashboardFiles matches templates/dashboard/src', async () => {
		const { dashboardFiles } = await import('../packages/svforge/src/templates');
		const onDisk = readDirRecursively(join(ROOT, 'packages/svforge/templates/dashboard/src'));
		expect(onDisk, STALE_MESSAGE).toEqual(dashboardFiles);
	});

	for (const pkg of modulePackages) {
		it(`${pkg}: files matches templates/src`, async () => {
			const { files } = await import(`../packages/${pkg}/src/templates`);
			const onDisk = readDirRecursively(join(ROOT, `packages/${pkg}/templates/src`));
			expect(onDisk, STALE_MESSAGE).toEqual(files);
		});
	}
});

const STALE_MESSAGE =
	'src/templates.ts is stale: a template file changed without prebuild. ' +
	'Run: cd packages/svforge && bun run build   (or the module package prebuild) ' +
	'— never edit templates.ts by hand (AGENTS.md gotcha #1).';
