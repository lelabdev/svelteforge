import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CAPABILITIES, MODULES, PRESETS, expandPreset, validateComposition } from '../packages/svforge/src/module-composition';
import { ROOT } from './helpers';

/**
 * Tests for #236 — module composition contract and presets (meta-packages).
 * Presets must compose existing modules, never duplicate their code.
 * Updated by #323: prerequisites are capability-based (requires/provides/
 * optional), not template names; the shared contract lives in
 * @svforge/addon-kit (MODULE_CONTRACTS) and MODULES mirrors it.
 */
describe('module composition & presets (#236)', () => {
	it('every module declares id, template, capability contract and files', () => {
		for (const [id, meta] of Object.entries(MODULES)) {
			expect(meta.id).toBe(id);
			expect(['base', 'dashboard']).toContain(meta.template);
			for (const token of meta.requires) expect(CAPABILITIES[token], `${id}: unknown capability ${token}`).toBeDefined();
			for (const token of meta.provides) expect(CAPABILITIES[token], `${id}: unknown capability ${token}`).toBeDefined();
			for (const token of meta.optional) expect(CAPABILITIES[token], `${id}: unknown capability ${token}`).toBeDefined();
			for (const mod of meta.optionalModules) expect(MODULES[mod], `${id}: unknown module ${mod}`).toBeDefined();
			expect(meta.files.length).toBeGreaterThan(0);
		}
	});

	it('oauth/dashboard modules anchor on the dashboard template, the rest on base', () => {
		for (const id of ['oauth', 'audit', 'notifications', 'jobs', 'chat']) {
			expect(MODULES[id].template).toBe('dashboard');
		}
		for (const id of ['email', 'uploads', 'blog', 'tiptap', 'dnd', 'graph', 'ui_toast', 'realtime']) {
			expect(MODULES[id].template).toBe('base');
		}
	});

	it('validateComposition accepts dashboard + oauth (auth.currentUser granted)', () => {
		expect(() => validateComposition('dashboard', ['oauth', 'email'])).not.toThrow();
	});

	it('validateComposition rejects oauth on base (missing auth.currentUser)', () => {
		expect(() => validateComposition('base', ['oauth'])).toThrow(/auth\.currentUser/);
	});

	it('validateComposition rejects unknown modules', () => {
		expect(() => validateComposition('base', ['nope'])).toThrow(/Unknown module/);
	});

	it('expandPreset("saas") composes dashboard + email + uploads', () => {
		const specs = expandPreset('saas');
		expect(specs[0]).toMatch(/template:dashboard/);
		expect(specs).toContain('@svforge/email');
		expect(specs).toContain('@svforge/uploads');
		expect(specs).not.toContain('@svforge/oauth'); // optional, not auto
	});

	it('expandPreset("community") composes base + blog + ui_toast', () => {
		const specs = expandPreset('community');
		expect(specs[0]).toMatch(/template:base/);
		expect(specs).toContain('@svforge/blog');
		expect(specs).toContain('@svforge/ui_toast');
	});

	it('every preset references only existing modules (no code duplication)', () => {
		for (const [presetId, preset] of Object.entries(PRESETS)) {
			expect(expandPreset(presetId).length).toBe(1 + preset.modules.length);
			for (const mod of [...preset.modules, ...preset.optional]) {
				expect(MODULES[mod], `${presetId} references unknown module ${mod}`).toBeDefined();
			}
			// Preset modules must be compatible with the preset's template
			expect(() =>
				validateComposition(preset.requires === 'dashboard' ? 'dashboard' : 'base', preset.modules)
			).not.toThrow();
		}
	});

	it('svforge-modules.json is delivered and matches the TS contract', async () => {
		const { baseRootFiles } = await import('../packages/svforge/src/templates');
		expect(Object.keys(baseRootFiles)).toContain('/svforge-modules.json');
		const delivered = JSON.parse(
			readFileSync(join(ROOT, 'packages/svforge/templates/base/root/svforge-modules.json'), 'utf-8')
		);
		const tsModules = new Set(Object.keys(MODULES));
		expect(Object.keys(delivered.modules).sort()).toEqual([...tsModules].sort());
	});

	it('module files listed in metadata exist in the packages', () => {
		for (const [id, meta] of Object.entries(MODULES)) {
			if (id === 'svforge') continue;
			const pkg = join(ROOT, 'packages', id, 'templates');
			for (const file of meta.files) {
				const full = join(pkg, file);
				expect(existsSync(full), `${id}: ${file} missing`).toBe(true);
			}
		}
	});
});
