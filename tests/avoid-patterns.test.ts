import { describe, it, expect } from 'vitest';
import {
	AVOID_PATTERNS,
	checkAvoidPatterns,
	checkDesignSystem,
	SVFORGE_CATALOG
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

describe('avoid patterns: exact-path canonical exemption (#342 review)', () => {
	it('exempts the exact catalog path but warns for unapproved components in the same directory', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-avoid-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			const uiDir = join(root, 'src/lib/components/svforge/ui');
			mkdirSync(uiDir, { recursive: true });
			// Exact catalog path of the canonical Table implementation.
			writeFileSync(join(uiDir, 'Table.svelte'), '<table class="w-full"><thead></thead></table>');
			// Unapproved new component in the SAME directory — must still warn.
			writeFileSync(join(uiDir, 'CustomTable.svelte'), '<table class="w-full"></table>');
			// Routes markup keeps warning too.
			const routesDir = join(root, 'src/routes');
			mkdirSync(routesDir, { recursive: true });
			writeFileSync(join(routesDir, '+page.svelte'), '<table class="w-full"></table>');
			const results = await checkDesignSystem(root);
			// Only avoid-pattern warns end with '— consider Table'; the minimal
			// tmp project also triggers the duplication ERROR for Table.svelte
			// (no svforge-catalog.json), which is unrelated to this check.
			const warns = results.filter(
				(result) => result.status === 'warn' && result.message.includes('consider Table')
			);
			expect(warns).toHaveLength(2);
			expect(warns.map((warn) => warn.message)).toEqual(
				expect.arrayContaining([
					expect.stringContaining('CustomTable.svelte'),
					expect.stringContaining('+page.svelte')
				])
			);
			expect(warns.some((warn) => warn.message.includes('ui/Table.svelte'))).toBe(false);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('matches matchers to the catalog: no drift possible without failing', () => {
		// AVOID_PATTERNS must be DERIVED from SVFORGE_CATALOG.avoidPatterns:
		// every matcher targets an existing catalog entry whose avoid contract
		// is documented and non-empty, and every documented detectable entry
		// ships at least one matcher.
		for (const pattern of AVOID_PATTERNS) {
			const entry = SVFORGE_CATALOG[pattern.component];
			expect(entry, `${pattern.component} must be a catalog entry`).toBeDefined();
			expect(entry.avoid?.length, `${pattern.component}.avoid must be non-empty`).toBeGreaterThan(0);
			expect(entry.avoidPatterns?.length, `${pattern.component} must co-locate its matcher`).toBeGreaterThan(0);
		}
		for (const [name, entry] of Object.entries(SVFORGE_CATALOG)) {
			if (entry.avoidPatterns?.length) {
				expect(entry.avoid?.length, `${name}: avoid contract required with avoidPatterns`).toBeGreaterThan(0);
			}
		}
		// The detectable set is exactly these six components.
		expect(AVOID_PATTERNS.map((pattern) => pattern.component).sort()).toEqual(
			['Button', 'Card', 'Input', 'Select', 'Table', 'Textarea'].sort()
		);
	});

	it('deriveAvoidPatterns rejects an empty avoid contract (drift guard)', async () => {
		const { deriveAvoidPatterns } = await import('../packages/svforge/src/design-system');
		expect(() =>
			deriveAvoidPatterns({
				Foo: {
					path: 'ui/Foo.svelte',
					category: 'ui',
					useFor: ['x'],
					avoid: [],
					avoidPatterns: [{ element: 'div', styleTokens: [], legitTokens: [], match: 'any', reason: 'r' }]
				}
			})
		).toThrow(/empty avoid contract/);
	});
});
