import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { generateSitemap } from '../packages/svforge/templates/base/src/lib/components/svforge/ui/Sitemap';
import { normalizeInternalCallback, resolveAbsoluteUrl } from '../packages/svforge/templates/base/src/lib/utils/web';
import { followSystemTheme } from '../packages/svforge/templates/base/src/lib/utils/theme';

describe('web helper hardening (#333)', () => {
	it('only preserves normalized internal login callbacks', () => {
		expect(normalizeInternalCallback('/admin/users?tab=active')).toBe('/admin/users?tab=active');
		for (const callback of [
			'https://attacker.example',
			'//attacker.example',
			'javascript:alert(1)',
			'/%2f%2fattacker.example',
			'/\\attacker.example'
		]) {
			expect(normalizeInternalCallback(callback), callback).toBeNull();
		}
	});

	it('escapes sitemap text and excludes invalid bounded fields', () => {
		const xml = generateSitemap('https://example.test?brand=a&b', [
			{
				path: '/products?name=<forge>',
				lastmod: '2025-01-01&x',
				changefreq: 'always<script>',
				priority: 4
			}
		]);

		expect(xml).toContain('https://example.test?brand=a&amp;b/products?name=&lt;forge&gt;');
		expect(xml).toContain('<lastmod>2025-01-01&amp;x</lastmod>');
		expect(xml).not.toContain('<changefreq>');
		expect(xml).not.toContain('<priority>');
	});

	it('normalizes canonical and social URLs against the current origin', () => {
		expect(resolveAbsoluteUrl('/preview.png', 'https://example.test/docs/page')).toBe('https://example.test/preview.png');
		expect(resolveAbsoluteUrl(undefined, 'https://example.test/docs/page')).toBe('https://example.test/docs/page');
	});

	it('follows system changes only without a stored preference', () => {
		const listeners = new Set<(event: { matches: boolean }) => void>();
		const media = {
			matches: false,
			addEventListener: (_: 'change', listener: (event: { matches: boolean }) => void) => listeners.add(listener),
			removeEventListener: (_: 'change', listener: (event: { matches: boolean }) => void) => listeners.delete(listener)
		};
		const changes: boolean[] = [];
		const cleanup = followSystemTheme(null, media, (dark) => changes.push(dark));
		for (const listener of listeners) listener({ matches: true });
		cleanup();
		expect(changes).toEqual([true]);
		expect(listeners).toHaveLength(0);
		expect(followSystemTheme('light', media, (dark) => changes.push(dark))).toBeUndefined();
	});

	it('applies the stored mode before hydration without requiring inline CSP allowances', () => {
		const script = readFileSync(
			join(process.cwd(), 'packages/svforge/templates/base/root/static/theme-init.js'),
			'utf8'
		);
		const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
			url: 'https://example.test',
			runScripts: 'dangerously'
		});
		Object.defineProperty(dom.window, 'matchMedia', {
			value: () => ({ matches: false })
		});
		dom.window.localStorage.setItem('theme-mode', 'dark');
		dom.window.eval(script);

		expect(dom.window.document.documentElement.dataset.mode).toBe('dark');
		expect(dom.window.document.documentElement.style.colorScheme).toBe('dark');
	});
});
