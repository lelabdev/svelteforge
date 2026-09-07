import { describe, it, expect } from 'vitest';
import {
	AVOID_PATTERNS,
	checkAvoidPatterns,
	checkDesignSystem
} from '../packages/svforge/src/design-system';

/**
 * #342 — Use catalog avoid patterns in checks.
 *
 * The SVFORGE_CATALOG documents an `avoid` list per component; the reliable
 * cases become machine-readable matchers. Findings are WARN (conservative —
 * limited false positives) and each diagnostic names the recommended
 * catalog component. Canonical implementations under
 * src/lib/components/svforge/ never warn about their own markup.
 */

const COMPONENTS = new Set(AVOID_PATTERNS.map((pattern) => pattern.component));

describe('avoid pattern matchers (#342)', () => {
	it('exposes matchers only for catalog components that document avoid', () => {
		for (const pattern of AVOID_PATTERNS) {
			expect(COMPONENTS.has(pattern.component)).toBe(true);
			expect(pattern.reason.length).toBeGreaterThan(0);
		}
	});

	it('flags a raw <table> and recommends Table', () => {
		const findings = checkAvoidPatterns('<table class="w-full"><tr><td>x</td></tr></table>');
		expect(findings).toHaveLength(1);
		expect(findings[0].component).toBe('Table');
	});

	it('flags a hand-styled <button> and recommends Button', () => {
		const findings = checkAvoidPatterns('<button class="bg-primary-500 rounded px-4">Go</button>');
		expect(findings.map((finding) => finding.component)).toContain('Button');
	});

	it('flags hand-styled <input>, <select> and <textarea>', () => {
		const findings = checkAvoidPatterns(
			'<input class="border-2 rounded p-2" /><select class="bg-white shadow"></select><textarea class="border-2"></textarea>'
		);
		expect(findings.map((finding) => finding.component)).toEqual(
			expect.arrayContaining(['Input', 'Select', 'Textarea'])
		);
	});

	it('flags a card-like <div> (border + shadow + radius) and recommends Card', () => {
		const findings = checkAvoidPatterns('<div class="border border-surface-200 rounded-xl shadow-lg">x</div>');
		expect(findings.map((finding) => finding.component)).toContain('Card');
	});

	it('does not flag legitimate Skeleton class usage', () => {
		const findings = checkAvoidPatterns(
			[
				'<button class="btn preset-tonal-surface p-2">ok</button>',
				'<input class="input" />',
				'<select class="select"></select>',
				'<textarea class="textarea"></textarea>',
				'<div class="card p-4">ok</div>'
			].join('\n')
		);
		expect(findings).toEqual([]);
	});

	it('does not flag plain unstyled elements (conservative)', () => {
		const findings = checkAvoidPatterns(
			[
				'<button type="submit" class="inline-flex" aria-label="x"><Icon /></button>',
				'<input type="hidden" name="id" />',
				'<div class="flex gap-2">x</div>'
			].join('\n')
		);
		expect(findings).toEqual([]);
	});

	it('requires ALL card ingredients for the div heuristic', () => {
		const findings = checkAvoidPatterns(
			'<div class="border rounded-xl">x</div><div class="rounded-xl shadow-lg">x</div><div class="border shadow-lg">x</div>'
		);
		expect(findings).toEqual([]);
	});

	it('does not match PascalCase Svelte components (<Table …>)', () => {
		const findings = checkAvoidPatterns('<Table columns={cols} data={rows} />');
		expect(findings).toEqual([]);
	});

	it('serializes to stable JSON (checker injection contract)', () => {
		expect(JSON.parse(JSON.stringify(AVOID_PATTERNS))).toEqual(AVOID_PATTERNS);
	});
});

describe('avoid patterns skip canonical implementations (#342)', () => {
	it('does not warn inside src/lib/components/svforge/ but warns in routes', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-avoid-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			const tableDir = join(root, 'src/lib/components/svforge/ui');
			mkdirSync(tableDir, { recursive: true });
			writeFileSync(
				join(tableDir, 'Table.svelte'),
				'<table class="w-full"><thead></thead></table>'
			);
			const routesDir = join(root, 'src/routes');
			mkdirSync(routesDir, { recursive: true });
			writeFileSync(join(routesDir, '+page.svelte'), '<table class="w-full"></table>');
			const results = await checkDesignSystem(root);
			const warns = results.filter(
				(result) => result.status === 'warn' && result.message.includes('Table')
			);
			expect(warns).toHaveLength(1);
			expect(warns[0].message).toContain('+page.svelte');
			expect(warns[0].message).not.toContain('Table.svelte');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
