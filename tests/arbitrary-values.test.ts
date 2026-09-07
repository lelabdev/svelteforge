import { describe, it, expect } from 'vitest';
import { checkArbitraryTokens, checkDesignSystem } from '../packages/svforge/src/design-system';

/**
 * #345 — Align arbitrary spacing and radius checks.
 *
 * The checker docs promised arbitrary colors/radius/spacing WARN coverage but
 * only scanned hex colors. This adds CONSERVATIVE arbitrary-token detection
 * for radius and spacing, and narrows the docs for what stays allowed:
 * structural/product-specific arbitrary values (w-[…], text-[…], top-[…]…)
 * and colors (still covered by the hex scan) are intentionally not flagged.
 */

describe('arbitrary radius/spacing token detection (#345)', () => {
	it('flags arbitrary radius and spacing tokens', () => {
		expect(checkArbitraryTokens('rounded-[7px] p-[13px] gap-[4px]')).toEqual([
			'rounded-[7px]',
			'p-[13px]',
			'gap-[4px]'
		]);
	});

	it('flags margin and space tokens', () => {
		expect(checkArbitraryTokens('m-[9px] mx-auto space-y-[14px]')).toEqual([
			'm-[9px]',
			'space-y-[14px]'
		]);
	});

	it('flags tokens behind Tailwind variants', () => {
		expect(checkArbitraryTokens('hover:p-[2px] dark:rounded-[3px]')).toEqual([
			'hover:p-[2px]',
			'dark:rounded-[3px]'
		]);
	});

	it('flags gap axes, logical sides, negative margins and directional radius', () => {
		expect(checkArbitraryTokens('gap-x-[3px] gap-y-[2px] ps-[3px] me-[4px] ms-[5px] pe-[6px]')).toEqual([
			'gap-x-[3px]',
			'gap-y-[2px]',
			'ps-[3px]',
			'me-[4px]',
			'ms-[5px]',
			'pe-[6px]'
		]);
		expect(checkArbitraryTokens('-m-[3px] -mx-[2px] rounded-t-[3px] rounded-bl-[4px]')).toEqual([
			'-m-[3px]',
			'-mx-[2px]',
			'rounded-t-[3px]',
			'rounded-bl-[4px]'
		]);
	});

	it('scanned syntax is static double-quoted class only (documented limit)', () => {
		// Single-quoted and dynamic class expressions are intentionally not
				// scanned (#345 review) — documented in the checker docstring.
		expect(checkArbitraryTokens("p-[13px]")).toEqual(['p-[13px]']);
	});

	it('allows standard scale classes (negative case)', () => {
		expect(checkArbitraryTokens('p-4 rounded-xl rounded-full gap-6 m-0')).toEqual([]);
	});

	it('allows structural and product-specific arbitrary values (negative case)', () => {
		expect(checkArbitraryTokens('w-[280px] h-[42vh] min-h-[120px] text-[15px] top-[3px]')).toEqual([]);
	});

	it('leaves colors to the hex scan (documented split)', () => {
		expect(checkArbitraryTokens('bg-[#ff0000]')).toEqual([]);
	});

	it('flags directional radius but leaves untouched radius scale classes', () => {
		expect(checkArbitraryTokens('rounded-tl-[10px] rounded-tr-[10px]')).toEqual(['rounded-tl-[10px]', 'rounded-tr-[10px]']);
		expect(checkArbitraryTokens('rounded-t-xl rounded-br-full rounded-l-2xl')).toEqual([]);
	});

	it('reports arbitrary radius/spacing as WARN in project routes', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-arbitrary-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			const routesDir = join(root, 'src/routes');
			mkdirSync(routesDir, { recursive: true });
			writeFileSync(
				join(routesDir, '+page.svelte'),
				'<div class="rounded-[7px] p-[13px] w-[280px]">x</div>'
			);
			const results = await checkDesignSystem(root);
			const warns = results.filter(
				(result) => result.status === 'warn' && result.message.includes('Arbitrary radius/spacing')
			);
			expect(warns).toHaveLength(1);
			expect(warns[0].message).toContain('rounded-[7px]');
			expect(warns[0].message).toContain('p-[13px]');
			expect(warns[0].message).not.toContain('w-[280px]');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('exempts the exact catalog path but warns for unapproved components in the same directory (#345 review)', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-arbitrary-canonical-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			const uiDir = join(root, 'src/lib/components/svforge/ui');
			mkdirSync(uiDir, { recursive: true });
			// Exact catalog path of the canonical Card implementation — exempt.
			writeFileSync(join(uiDir, 'Card.svelte'), '<div class="rounded-[7px] p-[13px]">x</div>');
			// Unapproved new component in the SAME directory — must still warn.
			writeFileSync(join(uiDir, 'CustomCard.svelte'), '<div class="rounded-[9px] p-[15px]">x</div>');
			const results = await checkDesignSystem(root);
			const warns = results.filter(
				(result) => result.status === 'warn' && result.message.includes('Arbitrary radius/spacing')
			);
			expect(warns).toHaveLength(1);
			expect(warns[0].message).toContain('CustomCard.svelte');
			expect(warns[0].message).not.toContain('ui/Card.svelte');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
