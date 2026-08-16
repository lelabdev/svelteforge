import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TEMPLATES = join(ROOT, 'packages/svforge/templates');

/**
 * Regression guard for #195 — Skeleton v5 classes that DO NOT EXIST.
 *
 * Skeleton v5 utilities are exclusively preset-filled / preset-tonal /
 * preset-outlined (+ color suffixes). `preset-ghost`, `variant-*` and
 * `alert alert-*` are shadcn/Bootstrap leftovers that render unstyled
 * buttons/alerts. The scaffold CI only checks compilation, so CSS-class
 * drift is invisible to the build — this guard scans all template sources.
 */
function allTemplateFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			out.push(...allTemplateFiles(full));
		} else if (/(\.svelte|\.ts|\.css|\.html)$/.test(entry)) {
			out.push(full);
		}
	}
	return out;
}

const GHOST_PATTERNS: Array<[RegExp, string]> = [
	[/preset-ghost/, 'preset-ghost does not exist in Skeleton v5 (use preset-tonal-* / preset-outlined-*)'],
	[/variant-(primary|secondary|tertiary|surface|error|success|warning|info)\b/, 'variant-* does not exist in Skeleton v5 (renamed preset-* in v3)'],
	[/alert\s+alert-(error|warning|success|info)/, 'alert alert-* is a Bootstrap class, not Skeleton (use the Alert/Feedback component)']
];

describe('no ghost Skeleton classes in templates (#195)', () => {
	const files = allTemplateFiles(TEMPLATES);

	for (const [pattern, message] of GHOST_PATTERNS) {
		it(`no ${pattern}`, () => {
			const offenders = files.filter((f) => pattern.test(readFileSync(f, 'utf-8')));
			expect(offenders, `${message}. Found in: ${offenders.join(', ')}`).toEqual([]);
		});
	}
});
