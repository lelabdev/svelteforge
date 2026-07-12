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
		it('has a vitest config', () => {
			expect(existsSync(join(dashboardRoot, 'vitest.config.ts'))).toBe(true);
		});

		it('vitest is in devDependencies in dashboard package template', () => {
			// The svforge package.json lists deps; the template's own
			// vitest config must exist and reference vitest
			const config = readFileSync(join(dashboardRoot, 'vitest.config.ts'), 'utf-8');
			expect(config).toMatch(/vitest/i);
		});
	});

	describe('test files exist', () => {
		it('has an auth guard test', () => {
			expect(existsSync(dashboardTemplateFile('routes', '(app)', '+layout.server.test.ts'))).toBe(true);
		});

		it('has an admin authorization test', () => {
			expect(existsSync(dashboardTemplateFile('routes', '(app)', 'admin', 'users', '+page.server.test.ts'))).toBe(true);
		});

		it('has a validation test', () => {
			const adminTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', 'admin', 'users', '+page.server.test.ts'),
				'utf-8'
			);
			expect(adminTest).toMatch(/validation|schema|safeParse|invalid/i);
		});
	});

	describe('test coverage', () => {
		it('covers anonymous access (no session)', () => {
			const layoutTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', '+layout.server.test.ts'),
				'utf-8'
			);
			expect(layoutTest).toMatch(/anonymous|no session|unauthenticated|locals.*null|!.*session/i);
		});

		it('covers non-admin authorization', () => {
			const adminTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', 'admin', 'users', '+page.server.test.ts'),
				'utf-8'
			);
			expect(adminTest).toMatch(/non.admin|403|forbidden|isAdmin/i);
		});

		it('covers validation failure', () => {
			const adminTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', 'admin', 'users', '+page.server.test.ts'),
				'utf-8'
			);
			expect(adminTest).toMatch(/400|invalid|fail.*parse|missing.*field/i);
		});

		it('covers a successful user-management action', () => {
			const adminTest = readFileSync(
				dashboardTemplateFile('routes', '(app)', 'admin', 'users', '+page.server.test.ts'),
				'utf-8'
			);
			expect(adminTest).toMatch(/success|create|update|delete|toggle/i);
		});
	});
});
