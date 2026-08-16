import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const THEME = join(ROOT, 'packages/svforge/templates/base/src/lib/styles/svelteforge-theme.css');

/**
 * Regression guard for #194 — the custom theme must be in Skeleton v5 format.
 *
 * Skeleton v5 consumes --typo-*, --color-root-bg-*, --corner-shape-* and
 * --default-border-width. Pre-v5 vars (--base-font-family, --anchor-font-color,
 * --body-background-color) are dead: the v5 globals.css uses light-dark() on
 * --color-root-bg-light/dark with no fallback, so a missing var leaves the
 * body background undefined.
 */
describe('theme Skeleton v5 format (#194)', () => {
	const css = readFileSync(THEME, 'utf-8');

	it('defines v5 typography vars (--typo-*)', () => {
		expect(css).toMatch(/--typo-base--font-family/);
		expect(css).toMatch(/--typo-heading--font-family/);
		expect(css).toMatch(/--typo-anchor--color-light/);
	});

	it('defines v5 root background vars (--color-root-bg-*)', () => {
		expect(css).toMatch(/--color-root-bg-light/);
		expect(css).toMatch(/--color-root-bg-dark/);
	});

	it('defines v5 shape vars (corner-shape, default-border-width)', () => {
		expect(css).toMatch(/--corner-shape-base/);
		expect(css).toMatch(/--corner-shape-container/);
		expect(css).toMatch(/--default-border-width/);
	});

	it('removes pre-v5 dead vars', () => {
		// Strip comments — they legitimately mention the old var names.
		const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
		expect(code).not.toMatch(/--base-font-family/);
		expect(code).not.toMatch(/--body-background-color/);
		expect(code).not.toMatch(/--anchor-font-color:/);
		expect(code).not.toMatch(/--heading-font-family:/);
	});

	it('keeps the color palettes (custom Steel blue / Burnt orange / teal)', () => {
		expect(css).toMatch(/--color-primary-500: oklch/);
		expect(css).toMatch(/--color-secondary-500: oklch/);
		expect(css).toMatch(/--color-tertiary-500: oklch/);
		expect(css).toMatch(/--color-surface-500: oklch/);
	});
});
