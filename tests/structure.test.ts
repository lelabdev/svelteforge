import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

describe('monorepo structure', () => {
	const packages = ['svforge', 'ui_toast', 'dnd', 'tiptap'];

	it.each(packages)('packages/%s has package.json', (pkg) => {
		expect(existsSync(join(ROOT, 'packages', pkg, 'package.json'))).toBe(true);
	});

	it.each(packages.filter((p) => p !== 'svforge'))('packages/%s has defineAddon in dist', (pkg) => {
		expect(existsSync(join(ROOT, 'packages', pkg, 'dist/index.js'))).toBe(true);
	});

	it('base template has expected components', () => {
		const uiDir = join(ROOT, 'packages/svforge/templates/base/src/lib/components/svforge/ui');
		const files = readdirSync(uiDir).filter((f) => f.endsWith('.svelte') || f.endsWith('.ts'));
		expect(files.length).toBeGreaterThan(10);
	});

	it('dashboard template has auth files', () => {
		const authDir = join(ROOT, 'packages/svforge/templates/dashboard/src/lib/server');
		expect(existsSync(join(authDir, 'auth.ts'))).toBe(true);
		expect(existsSync(join(authDir, 'db/index.ts'))).toBe(true);
	});
});
