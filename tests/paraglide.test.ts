import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BASE_ROOT = join(ROOT, 'packages/svforge/templates/base/root');

/**
 * Tests for #239 — Paraglide FR/EN is a structural foundation of the base
 * template. Both catalogs must exist and stay in sync, and the files must be
 * embedded by the prebuild (delivered to the project root).
 */
describe('Paraglide FR/EN baseline (#239)', () => {
	describe('catalogs exist and are in sync', () => {
		const fr = JSON.parse(readFileSync(join(BASE_ROOT, 'messages/fr.json'), 'utf-8'));
		const en = JSON.parse(readFileSync(join(BASE_ROOT, 'messages/en.json'), 'utf-8'));

		it('has both fr and en catalogs', () => {
			expect(fr).toBeDefined();
			expect(en).toBeDefined();
		});

		it('every FR key has an EN counterpart (and vice versa)', () => {
			const frKeys = Object.keys(fr).filter((k) => !k.startsWith('$'));
			const enKeys = Object.keys(en).filter((k) => !k.startsWith('$'));
			expect(frKeys.sort()).toEqual(enKeys.sort());
		});

		it('uses semantic key names, not render-bound ones', () => {
			const frKeys = Object.keys(fr).filter((k) => !k.startsWith('$'));
			for (const key of frKeys) {
				expect(key).toMatch(/^[a-z]+_[a-z_]+$/); // common_save, nav_home…
				expect(key).not.toMatch(/button_text|_button$|big_title/);
			}
		});

		it('baseLocale is fr', () => {
			const settings = JSON.parse(
				readFileSync(join(BASE_ROOT, 'project.inlang/settings.json'), 'utf-8')
			);
			expect(settings.baseLocale).toBe('fr');
			expect(settings.locales).toEqual(['fr', 'en']);
		});
	});

	describe('delivery', () => {
		it('root files are embedded in the manifest (#239)', async () => {
			const { baseRootFiles } = await import('../packages/svforge/src/templates');
			expect(Object.keys(baseRootFiles)).toContain('/messages/fr.json');
			expect(Object.keys(baseRootFiles)).toContain('/messages/en.json');
			expect(Object.keys(baseRootFiles)).toContain('/project.inlang/settings.json');
		});

		it('base mode writes root files to the project root', () => {
			const mode = readFileSync(join(ROOT, 'packages/svforge/src/modes/base.ts'), 'utf-8');
			expect(mode).toMatch(/paraglideVitePlugin/);
			expect(mode).toMatch(/@inlang\/paraglide-js/);
			expect(mode).toMatch(/rootFiles/);
		});

		it('hooks + layout are wired for Paraglide', () => {
			const hooks = readFileSync(
				join(ROOT, 'packages/svforge/templates/base/src/hooks.server.ts'),
				'utf-8'
			);
			expect(hooks).toMatch(/paraglideMiddleware/);
			const layout = readFileSync(
				join(ROOT, 'packages/svforge/templates/base/src/routes/+layout.svelte'),
				'utf-8'
			);
			expect(layout).toMatch(/localizeHref/);
		});

		it('app.html uses paraglide lang placeholders', () => {
			const appHtml = readFileSync(
				join(ROOT, 'packages/svforge/templates/base/src/app.html'),
				'utf-8'
			);
			expect(appHtml).toMatch(/%paraglide\.lang%/);
			expect(appHtml).toMatch(/%paraglide\.dir%/);
		});

		it('dashboard composes paraglide + better-auth hooks', () => {
			const hooks = readFileSync(
				join(ROOT, 'packages/svforge/templates/dashboard/src/hooks.server.ts'),
				'utf-8'
			);
			expect(hooks).toMatch(/paraglideMiddleware/);
			expect(hooks).toMatch(/handleBetterAuth/);
		});

		it('scaffold guard asserts paraglide files on base scaffold', () => {
			const script = readFileSync(join(ROOT, 'scripts/test-scaffold.sh'), 'utf-8');
			expect(script).toMatch(/messages\/fr\.json/);
		});
	});
});
