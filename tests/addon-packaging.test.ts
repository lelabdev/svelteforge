import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runBun } from './helpers/bun';

const root = process.cwd();

/**
 * Packaging contract for the @svforge/* addon packages (#323/#324 remediation
 * round — Finding 1: runtime dependency on @svforge/addon-kit).
 *
 * The `sv add` engine REJECTS community addons that declare `dependencies`
 * ("Community add-ons should not have any 'dependencies'. Use
 * 'peerDependencies' for 'sv' and bundle everything else") — verified against
 * sv 0.15. Therefore the shared addon runtime must NEVER become a runtime
 * dependency: its code is BUNDLED into each addon's dist (tsdown inlines
 * non-dependency imports), keeping every dist self-contained.
 *
 * These tests pin both halves of that decision:
 * 1. no @svforge/* manifest declares a runtime `dependencies` block;
 * 2. every built dist is self-contained — no runtime import of
 *    `@svforge/addon-kit` (the import would break module resolution for npm
 *    consumers of the addon alone).
 */
describe('addon packaging: bundled addon-kit, dependency-free manifests', () => {
	const packageDirs = readdirSync(join(root, 'packages'), { withFileTypes: true })
		.filter((e) => e.isDirectory() && existsSync(join(root, 'packages', e.name, 'package.json')))
		.map((e) => e.name);

	it('no @svforge/* package declares runtime dependencies (sv add contract)', () => {
		for (const dir of packageDirs) {
			const pkg = JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8')) as {
				name: string;
				dependencies?: Record<string, string>;
				devDependencies?: Record<string, string>;
			};
			expect(pkg.dependencies ?? {}, `${pkg.name} must not declare dependencies (sv add rejects them)`).toEqual({});
			if (dir === 'addon-kit') continue; // the shared runtime itself has no reason to depend on itself
			// The shared runtime stays a devDependency: it is needed at BUILD time
			// (types + source resolution) and tsdown's alwaysBundle inlines it
			// into the dist from there.
			expect(pkg.devDependencies?.['@svforge/addon-kit'], `${pkg.name} must keep addon-kit as a build-time devDependency`).toBeDefined();
		}
	});

	it('a freshly built addon dist is self-contained (no runtime import of @svforge/addon-kit)', () => {
		// audit is the heaviest consumer (gate + catalog merges + AI context).
		runBun(['run', 'build'], join(root, 'packages', 'audit'));
		const dist = readFileSync(join(root, 'packages/audit/dist/index.js'), 'utf8');
		expect(dist).not.toMatch(/from\s+["']@svforge\/addon-kit["']/);
		expect(dist).not.toMatch(/require\(["']@svforge\/addon-kit["']\)/);
		// The bundled runtime is actually IN there (its capability registry ships).
		expect(dist).toContain('ui.skeleton');
	});

	it('every already-built dist is self-contained (CI builds all packages before tests)', () => {
		for (const dir of packageDirs) {
			const distPath = join(root, 'packages', dir, 'dist', 'index.js');
			if (!existsSync(distPath)) continue; // unbuilt locally; the audit test above covers a fresh build
			const dist = readFileSync(distPath, 'utf8');
			expect(dist, `${dir}/dist must not import @svforge/addon-kit at runtime`).not.toMatch(
				/from\s+["']@svforge\/addon-kit["']/
			);
		}
	});
});
