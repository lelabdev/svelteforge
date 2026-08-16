import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, baseTemplateFile } from './helpers';

const baseRoot = join(ROOT, 'packages/svforge/templates/base');

/**
 * Tests for #235 — the base template must ship with a runnable Vitest
 * baseline: vitest.config.ts actually delivered at the project root (prebuild
 * only embeds templates/base/src/**), an example test, and a working `test`
 * script. Option A of #235 (baseline in base) is the chosen decision.
 */
describe('base Vitest baseline (#235)', () => {
	describe('test infrastructure', () => {
		it('has a vitest config in the template source', () => {
			// The file lives under src/ so the prebuild embeds it; the mode
			// writes it at the PROJECT ROOT via ROOT_FILES.
			expect(existsSync(join(baseRoot, 'src', 'vitest.config.ts'))).toBe(true);
		});

		it('vitest config is embedded in the manifest', async () => {
			// Regression guard: vitest.config.ts must be part of the embedded
			// base manifest, otherwise it is never scaffolded (prebuild only
			// ships templates/base/src/**).
			const { baseFiles } = await import('../packages/svforge/src/templates');
			expect(Object.keys(baseFiles)).toContain('/vitest.config.ts');
		});

		it('base mode redirects vitest.config.ts to the project root', () => {
			const mode = readFileSync(join(ROOT, 'packages/svforge/src/modes/base.ts'), 'utf-8');
			expect(mode).toMatch(/ROOT_FILES\s*=\s*new Set\(\[['"]\/vitest\.config\.ts['"]\]\)/);
			expect(mode).toMatch(/path\.slice\(1\)/);
		});

		it('defines a runnable test script in the base package template', () => {
			const pkg = readFileSync(join(baseRoot, 'package.json'), 'utf-8');
			expect(pkg).toMatch(/"test":\s*"vitest run"/);
			expect(pkg).toMatch(/"vitest":/);
		});
	});

	describe('example test', () => {
		it('has an example test shipped with the template', () => {
			expect(existsSync(baseTemplateFile('lib', 'example.test.ts'))).toBe(true);
		});

		it('covers a real base utility (cn)', () => {
			const content = readFileSync(baseTemplateFile('lib', 'example.test.ts'), 'utf-8');
			expect(content).toMatch(/describe\('cn utility'/);
		});
	});

	describe('scaffold guard (#235)', () => {
		it('test-scaffold.sh asserts root config and runs the baseline on base', () => {
			const script = readFileSync(join(ROOT, 'scripts', 'test-scaffold.sh'), 'utf-8');
			expect(script).toMatch(/TEMPLATE.*=.*"base"/s);
			expect(script).toMatch(/vitest\.config\.ts missing at project root/);
			expect(script).toMatch(/baseline vitest failed on base scaffold/);
		});
	});
});
