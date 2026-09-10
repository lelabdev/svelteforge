import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
	checkDesignSystem,
	checkLayoutCss,
	checkCssVariables,
	checkStyleBlockDrift,
	isSkeletonThemeCss
} from '../packages/svforge/src/design-system';

/**
 * CSS drift outside Skeleton (#314): `svforge check` must surface a parallel
 * design layer the moment an agent or a project recreates one around Skeleton
 * — layout.css overrides, Skeleton namespaces defined outside the theme,
 * parallel palettes in added CSS files, literal styling in wrapper <style>
 * blocks — while legitimate product abstractions keep passing.
 */

const CANONICAL_LAYOUT = `@import 'tailwindcss';
@import '@skeletonlabs/skeleton';
@import '@fontsource-variable/inter';
@import '../lib/styles/theme.css';
@plugin '@tailwindcss/forms';
@custom-variant dark (&:where([data-mode=dark], [data-mode=dark] *));
@theme {
	--font-mono: 'Fira Code Variable', monospace;
}
`;

const MINIMAL_THEME = `[data-theme='acme'] {
	--color-primary-500: oklch(60% 0.1 220);
	--color-surface-950: oklch(18% 0.04 263);
	--typo-base--font-family: 'Inter', sans-serif;
	--radius-base: 0.375rem;
	--radius-container: 0.75rem;
}`;

async function violationsFor(files: Record<string, string>, rule?: string) {
	const project = mkdtempSync(join(tmpdir(), 'sf-css-drift-'));
	writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'probe', dependencies: {} }));
	mkdirSync(join(project, 'src/lib/components/svforge/primitives'), { recursive: true });
	writeFileSync(join(project, 'src/lib/components/svforge/primitives/Button.svelte'), '<button>ok</button>');
	mkdirSync(join(project, 'src/lib/styles'), { recursive: true });
	writeFileSync(join(project, 'src/lib/styles/theme.css'), MINIMAL_THEME);
	mkdirSync(join(project, 'src/routes'), { recursive: true });
	writeFileSync(join(project, 'src/routes/layout.css'), CANONICAL_LAYOUT);
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(join(project, path, '..'), { recursive: true });
		writeFileSync(join(project, path), content);
	}
	try {
		const results = await checkDesignSystem(project);
		return rule ? results.filter((r) => r.message.includes(`[svforge/${rule}]`)) : results;
	} finally {
		rmSync(project, { recursive: true, force: true });
	}
}

describe('CSS drift outside Skeleton (#314)', () => {
	it('recognizes the theme by content, not filename (renamed theme)', () => {
		expect(isSkeletonThemeCss(MINIMAL_THEME.replace("acme", "acme"))).toBe(true);
		expect(isSkeletonThemeCss('--sidebar-width: 16rem;')).toBe(false);
	});

	it('accepts a canonical wiring-only layout.css', () => {
		expect(checkLayoutCss(CANONICAL_LAYOUT)).toEqual([]);
	});

	it('reports a global override in layout.css', () => {
		const findings = checkLayoutCss(`${CANONICAL_LAYOUT}\nbody {\n\tbackground: red;\n}\n`);
		expect(findings.some((f) => f.rule === 'layout-override' && f.message.includes('body'))).toBe(true);
		expect(findings.every((f) => f.severity === 'error')).toBe(true);
	});

	it('reports a Skeleton variable defined outside the theme as ERROR', async () => {
		const findings = await violationsFor(
			{ 'src/lib/styles/extra.css': ':root {\n\t--typo-base--font-family: "X", sans-serif;\n}' },
			'skeleton-namespace'
		);
		expect(findings.some((f) => f.status === 'error' && f.message.includes('--typo-base--font-family'))).toBe(true);
	});

	it('lets a product-specific dimension pass in an added CSS file', async () => {
		const findings = await violationsFor(
			{ 'src/lib/styles/product.css': ':root {\n\t--sidebar-width: 16rem;\n\t--z-header: 20;\n}' },
			'parallel-palette'
		);
		expect(findings).toEqual([]);
	});

	it('reports a parallel palette in an added CSS file as WARN', async () => {
		const findings = await violationsFor(
			{ 'src/lib/styles/tokens.css': ':root {\n\t--color-action: #07f;\n\t--color-panel: #fff;\n\t--radius-card: 1rem;\n}' },
			'parallel-palette'
		);
		expect(findings.length).toBeGreaterThanOrEqual(3);
		for (const finding of findings) expect(finding.status).toBe('warn');
	});

	it('lets a Skeleton preset pass inside a wrapper <style>-free component', () => {
		expect(checkStyleBlockDrift('<button class="btn preset-filled-primary-500">ok</button>')).toEqual([]);
	});

	it('reports a literal color in a wrapper <style> block as WARN', () => {
		const findings = checkStyleBlockDrift(
			'<style>\n\t.x {\n\t\tbackground: #ff0044;\n\t\tborder-radius: 12px;\n\t\topacity: 0.5;\n\t}\n</style>'
		);
		expect(findings.some((f) => f.rule === 'style-block-color' && f.message.includes('#ff0044'))).toBe(true);
		expect(findings.some((f) => f.rule === 'style-block-radius')).toBe(true);
		// structural declarations are never flagged
		expect(findings.every((f) => !f.message.includes('opacity'))).toBe(true);
	});

	it('accepts token-based values in a wrapper <style> block', () => {
		expect(
			checkStyleBlockDrift(
				'<style>\n\t.x {\n\t\tborder-color: var(--color-primary-500);\n\t\tbackground: oklch(from var(--color-primary-500) l c h / 0.05);\n\t}\n</style>'
			)
		).toEqual([]);
	});

	it('keeps the canonical scaffolds free of new css-drift diagnostics', async () => {
		// the real scaffold layout.css (wiring) + theme (recognized) produce nothing
		expect(checkLayoutCss(CANONICAL_LAYOUT)).toEqual([]);
		expect(checkCssVariables('src/lib/styles/theme.css', MINIMAL_THEME, isSkeletonThemeCss(MINIMAL_THEME))).toEqual([]);
		// and an end-to-end run on the canonical layout + theme reports nothing
		const findings = await violationsFor({});
		expect(findings.filter((r) => r.status !== 'ok')).toEqual([]);
	});
});
