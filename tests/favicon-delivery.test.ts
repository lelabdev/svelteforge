import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ROOT } from './helpers';
import { diskSv } from './helpers/fixtures';

/**
 * #325 — favicon and static asset delivery.
 *
 * prebuild embeds ONLY templates/base/src/** and templates/base/root/**
 * (repo AGENTS.md gotcha). templates/base/static/favicon.ico was referenced
 * by app.html but never embedded, so every scaffold served a 404 for
 * /favicon.ico. The fix: a prerendered src/routes/favicon.ico/+server.ts
 * (text through the normal src pipeline — binaries cannot survive the
 * string-based manifest) and a single-source robots.txt in base root files.
 */
describe('favicon delivery (#325)', () => {
	it('app.html references an embedded SVG icon with the .ico route as fallback', async () => {
		const { baseFiles, baseRootFiles } = await import('../packages/svforge/src/templates');
		const app = baseFiles['/app.html'];
		expect(app).toContain('href="%sveltekit.assets%/favicon.svg"');
		expect(app).toContain('type="image/svg+xml"');
		// Direct /favicon.ico requests (crawlers, legacy consumers) are answered
		// by the prerendered route — never a 404.
		expect(app).toContain('href="%sveltekit.assets%/favicon.ico"');
		// The primary icon asset ships through the root-files pipeline.
		expect(baseRootFiles['/static/favicon.svg']).toContain('<svg');
	});

	it('the referenced /favicon.ico is actually delivered — to both templates', async () => {
		const { baseFiles } = await import('../packages/svforge/src/templates');
		const { DASHBOARD_RECIPE } = await import('../packages/svforge/src/upgrade');
		const handler = '/routes/favicon.ico/+server.ts';
		// The base manifest delivers it to base scaffolds; the DASHBOARD_RECIPE
		// (base src + overlay, the set the dashboard mode actually writes)
		// proves it reaches dashboard scaffolds too.
		expect(baseFiles[handler], 'base manifest must embed the favicon route').toBeTruthy();
		expect(DASHBOARD_RECIPE.files[handler], 'dashboard delivery must include the favicon route').toBeTruthy();
	});

	it('the favicon route is prerendered and served as SVG', async () => {
		const { baseFiles } = await import('../packages/svforge/src/templates');
		const source = baseFiles['/routes/favicon.ico/+server.ts'];
		expect(source).toMatch(/prerender\s*=\s*true/);
		expect(source).toMatch(/image\/svg\+xml/);
		expect(source).toContain('<svg');
	});

	it('behavioral: base mode writes the favicon route under src/routes', async () => {
		const { applyBaseMode } = await import('../packages/svforge/src/modes/base');
		const { baseFiles } = await import('../packages/svforge/src/templates');
		const dir = mkdtempSync(join(tmpdir(), 'sf-favicon-'));
		try {
			writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', scripts: {} }));
			const sv = diskSv(dir);
			applyBaseMode(sv as never, {
				'/app.html': baseFiles['/app.html'],
				'/routes/favicon.ico/+server.ts': baseFiles['/routes/favicon.ico/+server.ts']
			});
			expect(existsSync(join(dir, 'src/routes/favicon.ico/+server.ts'))).toBe(true);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('no inert static/ leftovers in the base template', () => {
		// The old templates/base/static/ was never embedded — its presence was
		// the false promise. Everything it held must live in an embedded dir.
		expect(existsSync(join(ROOT, 'packages/svforge/templates/base/static'))).toBe(false);
	});

	it('robots.txt has ONE source: the base root files (dashboard inherits it)', async () => {
		const { baseRootFiles, dashboardRootFiles } = await import('../packages/svforge/src/templates');
		expect(baseRootFiles['/static/robots.txt']).toBeTruthy();
		expect(Object.keys(dashboardRootFiles)).not.toContain('/static/robots.txt');
		// The upgrade recipe delivers it to dashboard scaffolds through the
		// merged base root files.
		expect(baseRootFiles['/static/robots.txt']).toMatch(/User-agent/);
	});
});
