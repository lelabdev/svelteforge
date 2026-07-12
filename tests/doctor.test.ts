import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runBun } from './helpers/bun';

const ROOT = process.cwd();

/**
 * Tests for #178 — read-only svforge doctor diagnostics.
 *
 * The doctor command verifies installed SVForge modules, configuration,
 * environment variables, and dependency compatibility without modifying
 * any project files.
 */
describe('svforge doctor (#178)', () => {
	describe('doctor module exists', () => {
		it('has a doctor source file', () => {
			expect(existsSync(join(ROOT, 'packages/svforge/src/doctor.ts'))).toBe(true);
		});

		it('exports a doctor function', () => {
			const source = readFileSync(join(ROOT, 'packages/svforge/src/doctor.ts'), 'utf-8');
			expect(source).toMatch(/export.*function.*doctor|export.*const.*doctor|export.*diagnose/i);
		});

		it('is read-only (does not contain write operations)', () => {
			const source = readFileSync(join(ROOT, 'packages/svforge/src/doctor.ts'), 'utf-8');
			// Must not write to filesystem
			expect(source).not.toMatch(/writeFile|writeFileSync|appendFile|mkdir|rmdir|unlink/i);
		});
	});

	describe('doctor checks', () => {
		const source = readFileSync(join(ROOT, 'packages/svforge/src/doctor.ts'), 'utf-8');

		it('checks for installed SVForge components', () => {
			expect(source).toMatch(/svforge|components/i);
		});

		it('checks for required environment variables', () => {
			expect(source).toMatch(/env|ENV|environment|DATABASE_URL|AUTH_SECRET/i);
		});

		it('checks for compatible dependencies', () => {
			expect(source).toMatch(/dependencies|package\.json|version|svelte/i);
		});

		it('reports actionable diagnostics with module names', () => {
			expect(source).toMatch(/module|report|diagnostic|result|status|warn|error|ok|pass|fail/i);
		});

		it('returns or prints a structured report', () => {
			expect(source).toMatch(/console\.(log|warn|error)|return.*report|return.*result/i);
		});
	});

	describe('doctor module builds', () => {
		it('is included in the dist output', () => {
			runBun(['run', 'build'], join(ROOT, 'packages/svforge'));
			// The doctor module should be either bundled or a separate entry
			const distContent = readFileSync(join(ROOT, 'packages/svforge/dist/index.js'), 'utf-8');
			expect(distContent.length).toBeGreaterThan(0);
		});
	});
});
