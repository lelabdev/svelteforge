import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { readDirRecursively } from '../scripts/prebuild-utils';
import { discoverPrebuildPackages } from '../scripts/check-generated.mjs';

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
// Discovered from workspace manifests (#329): every package with a prebuild
// script is covered automatically — no manual list to forget on new modules.
const modulePackages = discoverPrebuildPackages(ROOT)
	.map((pkg) => pkg.directory.replace('packages/', ''))
	.filter((directory) => directory !== 'svforge');

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

	it('svforge: dashboardRootFiles matches templates/dashboard/root', async () => {
		const { dashboardRootFiles } = await import('../packages/svforge/src/templates');
		const onDisk = readDirRecursively(join(ROOT, 'packages/svforge/templates/dashboard/root'));
		expect(onDisk, STALE_MESSAGE).toEqual(dashboardRootFiles);
	});

	it('svforge: baseRootFiles matches templates/base/root + injected inventory (#239, #335)', async () => {
		const { baseRootFiles } = await import('../packages/svforge/src/templates');
		const { buildSkeletonInventory } = await import('../packages/svforge/scripts/generate-skeleton-inventory');
		const { ADDON_COMPONENTS } = await import('../packages/svforge/src/addon-components');
		const onDisk = readDirRecursively(join(ROOT, 'packages/svforge/templates/base/root'));
		// The prebuild injects the generated Skeleton inventory AND the approved
		// addon component paths into the scaffolded checker — reproduce both (#361).
		const checkerKey = '/svforge-check.mjs';
		onDisk[checkerKey] = onDisk[checkerKey]
			.replace(
				/\/\*__SKELETON_INVENTORY__\*\/.*/,
				`/*__SKELETON_INVENTORY__*/ ${JSON.stringify(buildSkeletonInventory(ROOT))}`
			)
			.replace(
				/\/\*__ADDON_COMPONENTS__\*\/.*/,
				`/*__ADDON_COMPONENTS__*/ ${JSON.stringify(ADDON_COMPONENTS)}`
			);
		expect(onDisk, STALE_MESSAGE).toEqual(baseRootFiles);
	});

	for (const pkg of modulePackages) {
		it(`${pkg}: files matches templates/src`, async () => {
			const { files } = await import(`../packages/${pkg}/src/templates.ts`);
			const onDisk = readDirRecursively(join(ROOT, `packages/${pkg}/templates/src`));
			expect(onDisk, STALE_MESSAGE).toEqual(files);
		});
	}
});

const STALE_MESSAGE =
	'src/templates.ts is stale: a template file changed without prebuild. ' +
	'Run: cd packages/svforge && bun run build   (or the module package prebuild) ' +
	'— never edit templates.ts by hand (AGENTS.md gotcha #1).';
