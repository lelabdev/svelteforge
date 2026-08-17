import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
	buildManifest,
	renderLlmstxt,
	mergeManifest,
	regenerateLlmstxt,
	MODULE_CAPABILITIES
} from '../packages/svforge/src/ai-context';
import { ROOT } from './helpers';

/**
 * Tests for #234 — generated AI context (llms.txt + .svforge.json manifest).
 * Content must derive from the real scaffold state, never generic docs.
 */
describe('AI context generation (#234)', () => {
	it('base manifest has base capabilities, no auth/orm', () => {
		const m = buildManifest('base', []);
		expect(m.template).toBe('base');
		expect(m.stack.auth).toBeUndefined();
		expect(m.capabilities).toContain('skeleton-ui');
		expect(m.capabilities).toContain('paraglide-fr-en');
		expect(m.capabilities).not.toContain('auth');
	});

	it('dashboard manifest adds auth/db/admin', () => {
		const m = buildManifest('dashboard', []);
		expect(m.stack.auth).toBe('better-auth');
		expect(m.stack.orm).toBe('drizzle');
		expect(m.stack.database).toBe('postgresql');
		expect(m.capabilities).toContain('auth');
		expect(m.capabilities).toContain('db');
		expect(m.capabilities).toContain('admin');
		expect(m.patterns['Auth guard']).toMatch(/admin/);
	});

	it('module installation adds its capability (no ghost when absent)', () => {
		const base = buildManifest('base', []);
		expect(base.capabilities).not.toContain('email (Resend)');
		const withEmail = mergeManifest(base, 'base', ['email']);
		expect(withEmail.modules).toEqual(['email']);
		expect(withEmail.capabilities).toContain('email (Resend)');
		expect(withEmail.patterns['email (Resend)']).toMatch(/src\/lib\/server\/email/);
	});

	it('mergeManifest is idempotent', () => {
		const m1 = mergeManifest(buildManifest('base', []), 'base', ['uploads']);
		const m2 = mergeManifest(m1, 'base', ['uploads']);
		expect(m2.modules).toEqual(['uploads']);
		expect(m2.capabilities.filter((c) => c === 'uploads (S3/R2 presigned)').length).toBe(1);
	});

	it('every module has a capability contribution', () => {
		// All 8 modules must declare a capability fragment (#234)
		const expected = ['email', 'uploads', 'oauth', 'ui_toast', 'dnd', 'tiptap', 'graph', 'blog'];
		for (const mod of expected) {
			expect(MODULE_CAPABILITIES[mod], `${mod} missing capability`).toBeDefined();
		}
	});

	it('llms.txt renders the manifest deterministically', () => {
		const m = buildManifest('dashboard', ['email']);
		const txt = renderLlmstxt(m);
		expect(txt).toContain('Template: dashboard');
		expect(txt).toContain('email (Resend)');
		expect(txt).toContain('MUST NOT');
		expect(txt).toContain('- install a second ORM, auth provider or UI kit');
		// deterministic: same input → same output
		expect(renderLlmstxt(m)).toBe(txt);
	});

	it('regenerateLlmstxt rebuilds from template+modules', () => {
		const manifest = JSON.stringify(buildManifest('dashboard', ['email']));
		const txt = regenerateLlmstxt(manifest);
		expect(txt).toContain('email (Resend)');
		expect(txt).toContain('Template: dashboard');
	});

	it('base/dashboard modes write the context', () => {
		const baseMode = readFileSync(join(ROOT, 'packages/svforge/src/modes/base.ts'), 'utf-8');
		expect(baseMode).toMatch(/\.svforge\.json/);
		expect(baseMode).toMatch(/llms\.txt/);
		const dashMode = readFileSync(join(ROOT, 'packages/svforge/src/modes/dashboard.ts'), 'utf-8');
		expect(dashMode).toMatch(/buildManifest\('dashboard'/);
	});

	it('modules enrich .svforge.json (inline helper)', () => {
		for (const mod of ['email', 'uploads', 'oauth', 'ui_toast', 'dnd', 'tiptap', 'graph', 'blog']) {
			const src = readFileSync(join(ROOT, 'packages', mod, 'src/index.ts'), 'utf-8');
			expect(src, `${mod} missing enrichManifest`).toMatch(/enrichManifest/);
			expect(src, `${mod} missing sv.file('.svforge.json')`).toMatch(/sv\.file\('\.svforge\.json'/);
		}
	});

	it('svforge context command exists in the bin', () => {
		const bin = readFileSync(join(ROOT, 'packages/svforge/bin/svforge.mjs'), 'utf-8');
		expect(bin).toMatch(/command === 'context'/);
		expect(bin).toMatch(/regenerateLlmstxt/);
	});

	describe('AI manifest completeness & non-destructive merges (#296)', () => {
		const MODULES = Object.keys(MODULE_CAPABILITIES);

		it('every MODULE_CAPABILITIES module enriches .svforge.json with the SAME capability/pattern as llms.txt', () => {
			for (const mod of MODULES) {
				const src = readFileSync(join(ROOT, 'packages', mod, 'src/index.ts'), 'utf-8');
				const meta = MODULE_CAPABILITIES[mod];
				// The manifest enrichment call must carry the same data as the
				// llms.txt merge — .svforge.json is complete right after sv add.
				const re = new RegExp(
					`enrichManifest\\(content, '${mod}', '${meta.capability.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}', '${meta.pattern?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\)`
				);
				expect(src, `${mod}: manifest enrich call must match MODULE_CAPABILITIES`).toMatch(re);
				// llms.txt merge present for every module (#296 — blog was missing)
				expect(src, `${mod}: llms.txt merge missing`).toMatch(/sv\.file\('llms\.txt'/);
			}
		});

		it('mergeMessages never overwrites an existing key (non-destructive merge)', () => {
			for (const mod of ['audit', 'chat', 'notifications', 'tiptap', 'uploads']) {
				const src = readFileSync(join(ROOT, 'packages', mod, 'src/index.ts'), 'utf-8');
				const helper = src.match(/function mergeMessages[\s\S]*?\n}/)?.[0] ?? '';
				expect(helper, `${mod}: mergeMessages must guard existing keys`).toMatch(/!\(key in catalog\)/);
				expect(helper, `${mod}: mergeMessages must not blindly assign`).not.toMatch(/^\s*catalog\[key\] = value;$/m);
			}
		});

		it('the inline enrich helpers merge capabilities without duplicates (idempotent)', () => {
			for (const mod of MODULES) {
				const src = readFileSync(join(ROOT, 'packages', mod, 'src/index.ts'), 'utf-8');
				expect(src, `${mod}: manifest modules guard`).toMatch(/if \(!manifest\.modules\.includes\(moduleId\)\)/);
				expect(src, `${mod}: manifest capabilities guard`).toMatch(/if \(!manifest\.capabilities\.includes\(capability\)\)/);
			}
		});
	});
});
