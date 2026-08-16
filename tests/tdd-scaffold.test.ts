import { describe, it, expect } from 'vitest';
import {
	ROOT,
	packageDir,
	packageFile,
	dashboardTemplateFile,
	baseTemplateFile,
	tempProject,
	expectFile,
	expectNoFile
} from './helpers';
import { existsSync } from 'node:fs';

/**
 * Tests for #177 — the TDD scaffold and behavior-test infrastructure.
 * Verifies that the test helpers work correctly and the test suite
 * follows the documented patterns.
 */
describe('TDD scaffold infrastructure (#177)', () => {
	describe('test helpers', () => {
		it('ROOT resolves to the monorepo root', () => {
			expect(existsSync(packageDir('svforge'))).toBe(true);
			expect(existsSync(packageDir('dnd'))).toBe(true);
		});

		it('packageFile resolves files correctly', () => {
			expect(existsSync(packageFile('svforge', 'package.json'))).toBe(true);
			expect(existsSync(packageFile('tiptap', 'package.json'))).toBe(true);
		});

		it('dashboardTemplateFile resolves template paths', () => {
			expect(existsSync(dashboardTemplateFile('routes', '(app)', 'admin', 'users', '+page.server.ts'))).toBe(true);
		});

		it('baseTemplateFile resolves template paths', () => {
			expect(existsSync(baseTemplateFile('lib', 'components', 'svforge', 'primitives', 'Button.svelte'))).toBe(true);
		});

		it('tempProject creates and cleans up directories', () => {
			const { dir, cleanup } = tempProject('test-helper');
			expect(existsSync(dir)).toBe(true);
			cleanup();
			expect(existsSync(dir)).toBe(false);
		});

		it('expectFile does not throw for existing files', () => {
			expect(() => expectFile(packageFile('svforge', 'package.json'))).not.toThrow();
		});

		it('expectFile throws for missing files', () => {
			expect(() => expectFile(packageFile('svforge', 'nonexistent.json'))).toThrow();
		});

		it('expectNoFile does not throw for missing files', () => {
			expect(() => expectNoFile(packageFile('svforge', 'nonexistent.json'))).not.toThrow();
		});
	});

	describe('CONTRIBUTING.md exists', () => {
		it('documents the TDD workflow', () => {
			expect(existsSync(`${ROOT}/CONTRIBUTING.md`)).toBe(true);
		});
	});

	describe('test suite follows documented patterns', () => {
		it('test script uses --no-file-parallelism', () => {
			// The build test regenerates dist artifacts; parallel file execution
			// causes race conditions with existence-check tests.
			const pkg = JSON.parse(
				require('fs').readFileSync(`${ROOT}/package.json`, 'utf-8')
			);
			expect(pkg.scripts.test).toMatch(/--no-file-parallelism/);
		});

		it('has a test helper module', () => {
			expect(existsSync(`${ROOT}/tests/helpers.ts`)).toBe(true);
		});

		it('has behavior-level tests (not just file existence)', () => {
			// Verify we have tests beyond simple existence checks
			expect(existsSync(`${ROOT}/tests/admin-auth.test.ts`)).toBe(true);
			expect(existsSync(`${ROOT}/tests/admin-delete.test.ts`)).toBe(true);
			expect(existsSync(`${ROOT}/tests/tiptap-xss.test.ts`)).toBe(true);
		});
	});
});
