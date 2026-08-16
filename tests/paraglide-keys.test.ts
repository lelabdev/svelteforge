import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * Paraglide key freshness (#271). svelte-check fails when a template calls
 * `m.some_key()` that no catalog declares. Templates are static (keys are
 * literal), so a regex scan is reliable — the guard runs on the base and
 * dashboard template sources whenever the detection is unambiguous.
 */

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else if (full.endsWith('.svelte') || full.endsWith('.ts')) out.push(full);
	}
	return out;
}

const TEMPLATE_ROOTS = [
	'packages/svforge/templates/base/src',
	'packages/svforge/templates/dashboard/src'
];

function usedKeys(): Set<string> {
	const keys = new Set<string>();
	for (const root of TEMPLATE_ROOTS) {
		if (!existsSync(join(ROOT, root))) continue;
		for (const file of walk(join(ROOT, root))) {
			const src = readFileSync(file, 'utf-8');
			// Literal m.<key>() / m.<key> usages in templates (static).
			for (const match of src.matchAll(/\bm\.([a-z][a-z0-9_]*)\b/g)) {
				keys.add(match[1]);
			}
		}
	}
	return keys;
}

describe('Paraglide key freshness (#271)', () => {
	it('every m.*() key used by base+dashboard templates exists in fr.json', () => {
		const catalog = JSON.parse(
			readFileSync(join(ROOT, 'packages/svforge/templates/base/root/messages/fr.json'), 'utf-8')
		);
		const missing = [...usedKeys()].filter((k) => !(k in catalog));
		expect(missing).toEqual([]);
	});

	it('every m.*() key used by base+dashboard templates exists in en.json', () => {
		const catalog = JSON.parse(
			readFileSync(join(ROOT, 'packages/svforge/templates/base/root/messages/en.json'), 'utf-8')
		);
		const missing = [...usedKeys()].filter((k) => !(k in catalog));
		expect(missing).toEqual([]);
	});

	it('FR and EN catalogs expose the same key set (parity)', () => {
		const fr = JSON.parse(
			readFileSync(join(ROOT, 'packages/svforge/templates/base/root/messages/fr.json'), 'utf-8')
		);
		const en = JSON.parse(
			readFileSync(join(ROOT, 'packages/svforge/templates/base/root/messages/en.json'), 'utf-8')
		);
		const frKeys = new Set(Object.keys(fr).filter((k) => k !== '$schema'));
		const enKeys = new Set(Object.keys(en).filter((k) => k !== '$schema'));
		expect([...frKeys].filter((k) => !enKeys.has(k))).toEqual([]);
		expect([...enKeys].filter((k) => !frKeys.has(k))).toEqual([]);
	});
});
