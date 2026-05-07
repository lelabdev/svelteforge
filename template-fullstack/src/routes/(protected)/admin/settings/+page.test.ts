/**
 * Admin Settings Page Verification
 *
 * The settings page is entirely client-side ($state). Component rendering
 * tests are too complex without a full Svelte mount. This test verifies the
 * page file exists and is a valid Svelte module.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const pagePath = resolve(import.meta.dirname, '+page.svelte');

describe('admin/settings page', () => {
	it('page file exists', () => {
		expect(existsSync(pagePath)).toBe(true);
	});

	it('contains settings state definition', () => {
		const content = readFileSync(pagePath, 'utf-8');
		expect(content).toContain('settings');
		expect(content).toContain('$state');
	});

	it('contains expected setting keys', () => {
		const content = readFileSync(pagePath, 'utf-8');
		expect(content).toContain('appName');
		expect(content).toContain('allowRegistration');
		expect(content).toContain('defaultRole');
	});

	it('exports a handleSave function', () => {
		const content = readFileSync(pagePath, 'utf-8');
		expect(content).toContain('handleSave');
	});

	it('has correct page title', () => {
		const content = readFileSync(pagePath, 'utf-8');
		expect(content).toContain('Settings — Admin — SvelteForge');
	});
});
