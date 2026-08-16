import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers';

const dashboardRoot = join(ROOT, 'packages/svforge/templates/dashboard');

/**
 * Tests for #181 — opt-in Playwright browser testing profile for the dashboard.
 *
 * Playwright is not installed by default. The profile must be optional and
 * cover login, protected routes, navigation, forms, feedback, and user CRUD.
 */
describe('dashboard Playwright profile (#181)', () => {
	describe('config files exist', () => {
		it('has a playwright config in the template source', () => {
			expect(existsSync(join(dashboardRoot, 'src', 'playwright.config.ts'))).toBe(true);
		});

		it('has e2e test files', () => {
			expect(existsSync(join(dashboardRoot, 'src', 'e2e'))).toBe(true);
		});

		it('playwright config is embedded in the manifest (#186)', async () => {
			const { dashboardFiles } = await import('../packages/svforge/src/templates');
			const keys = Object.keys(dashboardFiles);
			expect(keys).toContain('/playwright.config.ts');
			expect(keys).toContain('/e2e/auth.test.ts');
			expect(keys).toContain('/e2e/navigation.test.ts');
			expect(keys).toContain('/e2e/user-crud.test.ts');
		});
	});

	describe('playwright config content', () => {
		const config = readFileSync(join(dashboardRoot, 'src', 'playwright.config.ts'), 'utf-8');

		it('uses @playwright/test', () => {
			expect(config).toMatch(/@playwright\/test/);
		});

		it('defines a webServer config', () => {
			expect(config).toMatch(/webServer|dev.*server|preview/i);
		});

		it('targets localhost', () => {
			expect(config).toMatch(/localhost|127\.0\.0\.1/);
		});
	});

	describe('e2e test coverage', () => {
		const e2eDir = join(dashboardRoot, 'src', 'e2e');
		const files: string[] = [];
		function scanDir(dir: string) {
			const entries = require('node:fs').readdirSync(dir, { withFileTypes: true });
			for (const entry of entries) {
				const full = join(dir, entry.name);
				if (entry.isDirectory()) scanDir(full);
				else if (entry.name.endsWith('.test.ts')) files.push(readFileSync(full, 'utf-8'));
			}
		}
		if (existsSync(e2eDir)) scanDir(e2eDir);
		const allTests = files.join('\n');

		it('covers authentication / login flow', () => {
			expect(allTests).toMatch(/login|auth|sign.?in/i);
		});

		it('covers protected route access', () => {
			expect(allTests).toMatch(/redirect|protected|unauthorized|\/login/i);
		});

		it('covers dashboard navigation', () => {
			expect(allTests).toMatch(/nav|dashboard|navigate|goto/i);
		});

		it('covers form feedback', () => {
			expect(allTests).toMatch(/form|feedback|submit|validation/i);
		});

		it('covers user CRUD operations', () => {
			expect(allTests).toMatch(/user|create|delete|edit|admin/i);
		});
	});

	describe('not installed by default', () => {
		it('is filtered unless the playwright profile is selected', () => {
			const mode = readFileSync(join(ROOT, 'packages/svforge/src/modes/dashboard.ts'), 'utf-8');
			expect(mode).toMatch(/testing === 'playwright'/);
			expect(mode).toMatch(/isPlaywrightFile.*testing !== 'playwright'/s);
		});

		it('adds Playwright dependency and script only for the profile', () => {
			const mode = readFileSync(join(ROOT, 'packages/svforge/src/modes/dashboard.ts'), 'utf-8');
			expect(mode).toMatch(/@playwright\/test/);
			expect(mode).toMatch(/test:e2e.*playwright test/);
		});
	});
});
