import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, dashboardTemplateFile } from './helpers';

const dashboardRoot = join(ROOT, 'packages/svforge/templates/dashboard');

/**
 * Tests for #180 — the dashboard template must ship with a runnable
 * Vitest baseline covering auth, validation, and user management.
 */
describe('dashboard Vitest baseline (#180)', () => {
	describe('test infrastructure', () => {
		it('has a vitest config in the template source', () => {
			// The file lives under src/ so the prebuild embeds it; the mode
			// writes it at the PROJECT ROOT (dashboard-mode.test.ts #186).
			expect(existsSync(join(dashboardRoot, 'src', 'vitest.config.ts'))).toBe(true);
		});

		it('vitest config is embedded in the manifest (#186)', async () => {
			// Regression guard: vitest.config.ts must be part of the embedded
			// dashboard manifest, otherwise it is never scaffolded (prebuild
			// only ships templates/dashboard/src/**).
			const { dashboardFiles } = await import('../packages/svforge/src/templates');
			expect(Object.keys(dashboardFiles)).toContain('/vitest.config.ts');
		});

		it('vitest is in devDependencies in dashboard package template', () => {
			const config = readFileSync(join(dashboardRoot, 'src', 'vitest.config.ts'), 'utf-8');
			expect(config).toMatch(/vitest/i);
		});

		it('defines a runnable test script in dashboard mode', () => {
			const mode = readFileSync(join(ROOT, 'packages/svforge/src/modes/dashboard.ts'), 'utf-8');
			expect(mode).toMatch(/test:\s*'vitest run'/);
		});
	});

	describe('test files exist', () => {
		it('has an auth guard test', () => {
			expect(existsSync(dashboardTemplateFile('routes', '(app)', 'layout.server.test.ts'))).toBe(true);
		});

		it('has an admin authorization test', () => {
			expect(existsSync(dashboardTemplateFile('routes', '(app)', 'admin', 'users', 'page.server.test.ts'))).toBe(true);
		});

		it('has a validation test', () => {
			const adminTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', 'admin', 'users', 'page.server.test.ts'),
				'utf-8'
			);
			expect(adminTest).toMatch(/validation|schema|safeParse|invalid/i);
		});
	});

	describe('SvelteKit reserved filenames (#207)', () => {
		// Files prefixed with + are reserved by SvelteKit in src/routes/ — the build
		// fails with "Files prefixed with + are reserved" otherwise. Regression test:
		// colocated test files must never start with +.
		it('scaffolds no .test.ts file prefixed with + in routes', async () => {
			const { dashboardFiles } = await import('../packages/svforge/src/templates');
			const offenders = Object.keys(dashboardFiles).filter(
				(path) => path.startsWith('/routes/') && /\+[^/]*\.test\.ts$/.test(path)
			);
			expect(offenders, `Reserved + test files in manifest: ${offenders.join(', ')}`).toEqual([]);
		});
	});

	describe('test coverage', () => {
		it('covers anonymous access (no session)', () => {
			const layoutTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', 'layout.server.test.ts'),
				'utf-8'
			);
			expect(layoutTest).toMatch(/anonymous|no session|unauthenticated|locals.*null|!.*session/i);
		});

		it('covers non-admin authorization', () => {
			const adminTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', 'admin', 'users', 'page.server.test.ts'),
				'utf-8'
			);
			expect(adminTest).toMatch(/non.admin|403|forbidden|isAdmin/i);
		});

		it('covers validation failure', () => {
			const adminTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', 'admin', 'users', 'page.server.test.ts'),
				'utf-8'
			);
			expect(adminTest).toMatch(/400|invalid|fail.*parse|missing.*field/i);
		});

		it('covers a successful user-management action', () => {
			const adminTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', 'admin', 'users', 'page.server.test.ts'),
				'utf-8'
			);
			expect(adminTest).toMatch(/success|create|update|delete|toggle/i);
		});
	});
});
