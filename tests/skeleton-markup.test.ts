import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	buildSkeletonInventory
} from '../packages/svforge/scripts/generate-skeleton-inventory';

const ROOT = process.cwd();
const {
	checkClassString,
	checkDesignSystem,
	checkSvelteMarkup,
	REMOVED_SCAFFOLD_ALIASES
} = await import('../packages/svforge/src/design-system');
const { SKELETON_UTILITIES, SKELETON_UTILITY_PREFIXES, SKELETON_VERSIONS } = await import(
	'../packages/svforge/src/skeleton-inventory'
);

const CTX = { utilities: SKELETON_UTILITIES, prefixes: SKELETON_UTILITY_PREFIXES };
const tokens = (result: ReturnType<typeof checkClassString>) => result.map((violation) => violation.token);
const severities = (result: ReturnType<typeof checkClassString>) => result.map((violation) => violation.severity);

describe('skeleton inventory (#335)', () => {
	it('is generated from the installed @skeletonlabs packages', () => {
		const inventory = buildSkeletonInventory(ROOT);
		expect(SKELETON_VERSIONS).toEqual(inventory.versions);
		expect(SKELETON_UTILITIES).toEqual(inventory.utilities);
		expect(SKELETON_UTILITY_PREFIXES).toEqual(inventory.utilityPrefixes);
	});

	it('protects newly exported primitives without editing a blacklist', () => {
		// Marquee/Switch/TreeView were absent from the old hard-coded list (#335).
		const committed = JSON.parse(
			readFileSync(join(ROOT, 'packages/svforge/src/skeleton-inventory.ts'), 'utf-8')
				.replace(/^[\s\S]*?SKELETON_PRIMITIVES: string\[\] = /, '')
				.replace(/;[\s\S]*$/, '')
		) as string[];
		for (const primitive of ['Marquee', 'Switch', 'TreeView', 'FileUpload']) {
			expect(committed).toContain(primitive);
		}
	});
});

describe('skeleton markup rules (#335) — must pass', () => {
	it('accepts valid Skeleton primitives alone or combined', () => {
		expect(checkClassString('btn', CTX)).toEqual([]);
		expect(checkClassString('btn-icon', CTX)).toEqual([]);
		expect(checkClassString('btn preset-filled-primary-500', CTX)).toEqual([]);
		expect(checkClassString('btn-icon preset-tonal-surface', CTX)).toEqual([]);
		expect(checkClassString('card preset-filled-primary-500', CTX)).toEqual([]);
		expect(checkClassString('btn-lg', CTX)).toEqual([]);
		expect(checkClassString('badge', CTX)).toEqual([]);
	});

	it('accepts Tailwind layout and composition classes', () => {
		expect(checkClassString('w-full min-h-11', CTX)).toEqual([]);
		expect(checkClassString('flex gap-4 p-6 max-w-7xl mx-auto', CTX)).toEqual([]);
		expect(checkClassString('md:flex-row hover:bg-primary-500 sm:px-6', CTX)).toEqual([]);
		expect(checkClassString('overflow-hidden p-0', CTX)).toEqual([]);
		expect(checkClassString('grid grid-cols-[1fr_2fr] items-center', CTX)).toEqual([]);
	});

	it('accepts an alias explicitly redefined by the project with @utility', () => {
		expect(checkClassString('p-element', { ...CTX, projectUtilities: ['p-element'] })).toEqual([]);
	});
});

describe('skeleton markup rules (#335) — must fail', () => {
	it('rejects incompatible primitives on the same element', () => {
		expect(tokens(checkClassString('btn btn-icon', CTX))).toContain('btn + btn-icon');
		expect(severities(checkClassString('btn btn-icon', CTX))).toContain('error');
	});

	it('rejects radius overrides on primitives that own their shape', () => {
		expect(tokens(checkClassString('card rounded-container', CTX))).toContain('rounded-container');
		expect(tokens(checkClassString('btn rounded-base', CTX))).toContain('rounded-base');
		expect(tokens(checkClassString('btn-icon rounded-full', CTX))).toContain('rounded-full');
	});

	it('rejects Skeleton primitives injected into SVForge wrappers through class', () => {
		const violations = checkSvelteMarkup('<Button class="btn-icon w-full">Save</Button>', CTX);
		expect(violations.length).toBeGreaterThan(0);
		expect(violations[0].violations.some((violation) => violation.message.includes('wrapper'))).toBe(true);

		const cardViolations = checkSvelteMarkup('<Card class="rounded-container overflow-hidden">x</Card>', CTX);
		expect(cardViolations.length).toBeGreaterThan(0);
	});

	it('rejects invented Skeleton-looking utilities', () => {
		for (const invented of ['btn-md', 'badge-sm', 'badge-md', 'badge-lg', 'preset-tonal-info', 'input-error', 'select-error', 'textarea-error']) {
			const violations = checkClassString(invented, CTX);
			expect(tokens(violations), invented).toContain(invented);
			expect(severities(violations), invented).toContain('error');
		}
	});

	it('reports removed generic scaffold aliases', () => {
		for (const alias of REMOVED_SCAFFOLD_ALIASES) {
			const violations = checkClassString(alias, CTX);
			expect(tokens(violations), alias).toContain(alias);
			expect(severities(violations), alias).toContain('error');
		}
	});
});

describe('checkDesignSystem integration (#335)', () => {
	it('flags a page using invented and conflicting Skeleton classes', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-ds-markup-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			mkdirSync(join(root, 'src/routes'), { recursive: true });
			writeFileSync(
				join(root, 'src/routes/+page.svelte'),
				'<button class="btn btn-md p-element">Save</button>\n<Button class="btn-icon w-full">Go</Button>\n'
			);
			const results = await checkDesignSystem(root);
			const errors = results.filter((result) => result.status === 'error');
			expect(errors.some((result) => result.message.includes('btn-md'))).toBe(true);
			expect(errors.some((result) => result.message.includes('p-element'))).toBe(true);
			expect(errors.some((result) => result.message.includes('wrapper'))).toBe(true);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('keeps a clean page clean', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-ds-clean-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			mkdirSync(join(root, 'src/routes'), { recursive: true });
			writeFileSync(
				join(root, 'src/routes/+page.svelte'),
				'<button class="btn preset-filled-primary-500 w-full">Save</button>\n<Button class="w-full min-h-11">Go</Button>\n'
			);
			const results = await checkDesignSystem(root);
			expect(results.filter((result) => result.status === 'error')).toEqual([]);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});

describe('svforge directory exemption (#361 review)', () => {
	it('rejects a NEW local component under components/svforge/ui matching a Skeleton primitive', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-ds-exempt-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			const uiDir = join(root, 'src/lib/components/svforge/ui');
			mkdirSync(uiDir, { recursive: true });
			// Catalog-approved component passes; a new local Marquee is rejected.
			const primitivesDir = join(root, 'src/lib/components/svforge/primitives');
			mkdirSync(primitivesDir, { recursive: true });
			writeFileSync(join(primitivesDir, 'Button.svelte'), '<button class="btn" />');
			writeFileSync(join(uiDir, 'Marquee.svelte'), '<div class="marquee">x</div>');
			const results = await checkDesignSystem(root);
			const errors = results.filter((result) => result.status === 'error');
			expect(errors.some((result) => result.message.includes('Marquee'))).toBe(true);
			expect(errors.some((result) => result.message.includes('primitives/Button.svelte'))).toBe(false);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('scaffolded checker derives consumer primitives and detects a new local duplicate (#361)', async () => {
		const { execFileSync } = await import('node:child_process');
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-consumer-inv-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			writeFileSync(join(root, 'svforge-catalog.json'), '{}');
			// Consumer installs a NEWER skeleton-svelte exporting a primitive the
			// shipped inventory does not know.
			const ultraDir = join(root, 'node_modules/@skeletonlabs/skeleton-svelte/dist/components/ultra-widget');
			mkdirSync(ultraDir, { recursive: true });
			writeFileSync(join(ultraDir, 'index.js'), "export { UltraWidget } from './modules/anatomy.js';\n");
			const uiDir = join(root, 'src/lib/components/svforge/ui');
			mkdirSync(uiDir, { recursive: true });
			writeFileSync(join(uiDir, 'UltraWidget.svelte'), '<div>ultra</div>');

			const checker = join(ROOT, 'packages/svforge/templates/base/root/svforge-check.mjs');
			copyFileSync(checker, join(root, 'svforge-check.mjs'));

			let caught = false;
			try {
				execFileSync('node', ['svforge-check.mjs'], { cwd: root, stdio: 'pipe' });
			} catch (error) {
				caught = true;
				const stdout = (error as { stdout?: string | Buffer }).stdout;
				expect(String(stdout ?? '')).toContain('UltraWidget');
			}
			expect(caught, 'new consumer primitive duplicate must fail the checker').toBe(true);

			// Without the consumer package, the shipped inventory has no
			// UltraWidget: no duplication is reported for it (independent fallback).
			rmSync(join(root, 'node_modules'), { recursive: true, force: true });
			execFileSync('node', ['svforge-check.mjs'], { cwd: root, stdio: 'pipe' });
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});

describe('addon component exemptions are module-gated (#361 review)', () => {
	it('rejects uploads/FileUpload.svelte without the uploads module installed', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-addon-gate-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			writeFileSync(join(root, '.svforge.json'), JSON.stringify({ template: 'base', modules: [] }));
			const uploadsDir = join(root, 'src/lib/components/svforge/uploads');
			mkdirSync(uploadsDir, { recursive: true });
			writeFileSync(join(uploadsDir, 'FileUpload.svelte'), '<div>upload</div>');
			const results = await checkDesignSystem(root);
			expect(
				results.some((result) => result.status === 'error' && result.message.includes('FileUpload'))
			).toBe(true);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('accepts uploads/FileUpload.svelte when the uploads module IS installed', async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');
		const root = mkdtempSync(join(tmpdir(), 'svforge-addon-gate-'));
		try {
			writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: {} }));
			writeFileSync(join(root, '.svforge.json'), JSON.stringify({ template: 'base', modules: ['uploads'] }));
			const uploadsDir = join(root, 'src/lib/components/svforge/uploads');
			mkdirSync(uploadsDir, { recursive: true });
			writeFileSync(join(uploadsDir, 'FileUpload.svelte'), '<div>upload</div>');
			const results = await checkDesignSystem(root);
			expect(
				results.filter((result) => result.status === 'error' && result.message.includes('FileUpload'))
			).toEqual([]);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
