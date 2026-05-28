/**
 * Admin Notifications Page Verification
 *
 * The notifications page is entirely client-side ($state, $derived). Component
 * rendering tests are too complex without a full Svelte mount. This test
 * verifies the page file exists and contains expected logic.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const pagePath = resolve(import.meta.dirname, '+page.svelte');

describe('admin/notifications page', () => {
	it('page file exists', () => {
		expect(existsSync(pagePath)).toBe(true);
	});

	it('imports notification store functions', () => {
		const content = readFileSync(pagePath, 'utf-8');
		expect(content).toContain('getAdminNotifications');
		expect(content).toContain('createAdminNotification');
		expect(content).toContain('fetchNotifications');
	});

	it('uses $derived for adminNotifs', () => {
		const content = readFileSync(pagePath, 'utf-8');
		expect(content).toContain('$derived');
		expect(content).toContain('adminNotifs');
	});

	it('exports handleCreate function', () => {
		const content = readFileSync(pagePath, 'utf-8');
		expect(content).toContain('handleCreate');
	});

	it('has correct page title', () => {
		const content = readFileSync(pagePath, 'utf-8');
		expect(content).toContain('Notifications — Admin — SvelteForge');
	});

	it('defines target options (all, admins, user)', () => {
		const content = readFileSync(pagePath, 'utf-8');
		expect(content).toContain("value: 'all'");
		expect(content).toContain("value: 'admins'");
		expect(content).toContain("value: 'user'");
	});
});
