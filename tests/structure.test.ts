import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

describe('monorepo structure', () => {
	const packages = ['svforge', 'ui_toast', 'dnd', 'tiptap', 'graph'];

	it.each(packages)('packages/%s has package.json', (pkg) => {
		expect(existsSync(join(ROOT, 'packages', pkg, 'package.json'))).toBe(true);
	});

	it.each(packages.filter((p) => p !== 'svforge'))('packages/%s has defineAddon in dist', (pkg) => {
		expect(existsSync(join(ROOT, 'packages', pkg, 'dist/index.js'))).toBe(true);
	});

	it('base template has the canonical primitives/ui/layout structure (#242)', () => {
		const componentsDir = join(ROOT, 'packages/svforge/templates/base/src/lib/components/svforge');
		const primitives = readdirSync(join(componentsDir, 'primitives'));
		const ui = readdirSync(join(componentsDir, 'ui'));
		const layout = readdirSync(join(componentsDir, 'layout'));

		// primitives: small generic bricks
		const primitiveNames = primitives.filter((f) => f.endsWith('.svelte')).sort();
		expect(primitiveNames).toContain('Button.svelte');
		expect(primitiveNames).toContain('Input.svelte');
		expect(primitiveNames).toContain('Select.svelte');
		expect(primitiveNames).toContain('Badge.svelte');
		expect(primitiveNames).toContain('Toggle.svelte');

		// ui: composed, reusable components
		const uiNames = ui.filter((f) => f.endsWith('.svelte') || f.endsWith('.ts')).sort();
		expect(uiNames).toContain('Card.svelte');
		expect(uiNames).toContain('Alert.svelte');
		expect(uiNames).toContain('Table.svelte');
		expect(uiNames).toContain('Logo.svelte');
		expect(uiNames).toContain('ThemeToggle.svelte');

		// layout: page-structuring components
		const layoutNames = layout.filter((f) => f.endsWith('.svelte')).sort();
		expect(layoutNames).toContain('Navbar.svelte');
		expect(layoutNames).toContain('Footer.svelte');

		// No primitives may leak into ui/ (kept in sync with the split)
		const primitiveSet = new Set(primitiveNames);
		for (const name of ['Button.svelte', 'Input.svelte', 'Select.svelte', 'Badge.svelte']) {
			expect(uiNames, `${name} should live in primitives/`).not.toContain(name);
		}
	});

	it('dashboard template has auth files', () => {
		const authDir = join(ROOT, 'packages/svforge/templates/dashboard/src/lib/server');
		expect(existsSync(join(authDir, 'auth.ts'))).toBe(true);
		expect(existsSync(join(authDir, 'db/index.ts'))).toBe(true);
	});
});
