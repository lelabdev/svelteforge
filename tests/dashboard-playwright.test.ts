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
		it('has a playwright config', () => {
			expect(existsSync(join(dashboardRoot, 'playwright.config.ts'))).toBe(true);
		});

		it('has e2e test files', () => {
			expect(existsSync(join(dashboardRoot, 'e2e'))).toBe(true);
		});
	});

	describe('playwright config content', () => {
		const config = readFileSync(join(dashboardRoot, 'playwright.config.ts'), 'utf-8');

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
		const e2eDir = join(dashboardRoot, 'e2e');
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
		it('playwright config is separate from vitest (opt-in)', () => {
			const vitestConfig = readFileSync(join(dashboardRoot, 'vitest.config.ts'), 'utf-8');
			expect(vitestConfig).not.toMatch(/playwright/);
		});
	});
});
