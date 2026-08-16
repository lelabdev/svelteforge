import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PACKAGES = readdirSync(join(ROOT, 'packages'), { withFileTypes: true })
	.filter((d) => d.isDirectory() && existsSync(join(ROOT, 'packages', d.name, 'package.json')))
	.map((d) => d.name);

/**
 * Build config guards (#272). tsdown 0.12 injected an empty `define: {}`
 * into the rolldown input options, which rolldown >= 1.1 rejects with
 * "Invalid input options ... define". The fix: tsdown ^0.22 (no define
 * injection) + `deps.neverBundle` (replaces deprecated `external`) +
 * `outExtensions` to keep the publishable dist/index.js + dist/index.d.ts
 * filenames stable (#256). These guards keep the 14 packages from drifting
 * back to the warning-emitting configuration.
 */
describe('build config (#272)', () => {
	it('every package pins tsdown ^0.22 (define injection fixed upstream)', () => {
		for (const pkg of PACKAGES) {
			const p = JSON.parse(
				readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf-8')
			);
			expect(p.devDependencies?.['tsdown'], pkg).toMatch(/^\^0\.22\./);
		}
	});

	it('no package uses the deprecated `external` option or the define workaround', () => {
		for (const pkg of PACKAGES) {
			const cfg = readFileSync(join(ROOT, 'packages', pkg, 'tsdown.config.ts'), 'utf-8');
			expect(cfg, pkg).not.toMatch(/^\s*external:/m);
			expect(cfg, pkg).not.toMatch(/inputOptions/);
			expect(cfg, pkg).not.toMatch(/^\s*define:/m);
		}
	});

	it('every config keeps stable filenames via outExtensions (.js + .d.ts)', () => {
		for (const pkg of PACKAGES) {
			const cfg = readFileSync(join(ROOT, 'packages', pkg, 'tsdown.config.ts'), 'utf-8');
			expect(cfg, pkg).toMatch(/deps: \{ neverBundle:/);
			expect(cfg, pkg).toMatch(/outExtensions: \(\) => \(\{ js: '\.js', dts: '\.d\.ts' \}\)/);
			expect(cfg, pkg).toMatch(/hash: false/);
		}
	});

	it('manifest freshness dynamic import carries a static extension (no Vite warning)', () => {
		const test = readFileSync(join(ROOT, 'tests/manifest-freshness.test.ts'), 'utf-8');
		expect(test).toMatch(/import\(`\.\.\/packages\/\$\{pkg\}\/src\/templates\.ts`\)/);
		expect(test).not.toMatch(/import\(`\.\.\/packages\/\$\{pkg\}\/src\/templates`\)/);
	});
});
