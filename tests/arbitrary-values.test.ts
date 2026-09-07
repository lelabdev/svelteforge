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

	it('allows standard scale classes (negative case)', () => {
		expect(checkArbitraryTokens('p-4 rounded-xl rounded-full gap-6 m-0')).toEqual([]);
	});

	it('allows structural and product-specific arbitrary values (negative case)', () => {
		expect(checkArbitraryTokens('w-[280px] h-[42vh] min-h-[120px] text-[15px] top-[3px]')).toEqual([]);
	});

	it('leaves colors to the hex scan (documented split)', () => {
		expect(checkArbitraryTokens('bg-[#ff0000]')).toEqual([]);
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

	it('does not warn for canonical implementations under components/svforge/', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-arbitrary-canonical-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			const cardDir = join(root, 'src/lib/components/svforge/ui');
			mkdirSync(cardDir, { recursive: true });
			writeFileSync(join(cardDir, 'Card.svelte'), '<div class="rounded-[7px] p-[13px]">x</div>');
			const results = await checkDesignSystem(root);
			expect(
				results.filter(
					(result) => result.status === 'warn' && result.message.includes('Arbitrary radius/spacing')
				)
			).toEqual([]);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
