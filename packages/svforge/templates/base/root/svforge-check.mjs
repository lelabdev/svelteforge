#!/usr/bin/env node
/**
 * SVForge design-system check (#240).
 *
 * Self-contained (no runtime deps): scans the project for design-system
 * violations and exits non-zero on ERROR. Delivered by the SvelteForge base
 * template — run `node svforge-check.mjs` (or `bun svforge-check.mjs`) after
 * composing a page.
 *
 * ERROR — second UI kit, duplicated Skeleton primitive, hex outside theme
 * WARN  — component outside canonical structure
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const ROOT = process.cwd();
const results = [];

const SKELETON_PRIMITIVES = new Set([
	'Accordion', 'AppBar', 'Avatar', 'Badge', 'Breadcrumb', 'Button', 'Card',
	'Checkbox', 'Combobox', 'DatePicker', 'Dialog', 'Drawer', 'DropdownMenu',
	'Field', 'Input', 'Listbox', 'Menu', 'Popover', 'Progress', 'RadioGroup',
	'Select', 'Slider', 'SegmentedControl', 'Stepper', 'Tab', 'Table',
	'Textarea', 'Toast', 'Toggle', 'Tooltip'
]);
const FORBIDDEN_KITS = [
	'@shadcn/svelte', 'shadcn-svelte', 'bits-ui', '@melt-ui/svelte',
	'flowbite-svelte', 'svelteui', '@svelteuidev/core'
];
const THEME_FILES = new Set([
	'src/lib/styles/svelteforge-theme.css',
	'src/lib/styles/tokens.css',
	'src/lib/styles/index.css'
]);

function walk(dir, out = []) {
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.name.endsWith('.svelte')) out.push(full);
	}
	return out;
}

// ── 1. Forbidden UI kits (ERROR) ─────────────────────────────────
const pkgPath = join(ROOT, 'package.json');
if (!existsSync(pkgPath)) {
	console.log('✗ [ds] ERROR: no package.json — run from the project root.');
	process.exit(1);
}
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
for (const kit of FORBIDDEN_KITS) {
	if (allDeps[kit]) {
		results.push({ status: 'error', msg: `Second UI kit detected: ${kit}. Use Skeleton as the single UI source.` });
	}
}

// ── 2. Duplicated Skeleton primitives (ERROR) ────────────────────
const srcDir = join(ROOT, 'src');
const svforgeDir = join(srcDir, 'lib/components/svforge');
for (const file of walk(srcDir)) {
	if (file.startsWith(svforgeDir)) continue; // ours by construction
	const base = basename(file, '.svelte');
	if (SKELETON_PRIMITIVES.has(base)) {
		results.push({
			status: 'error',
			msg: `Duplicated Skeleton primitive "${base}" at ${relative(ROOT, file)}. Use ${base} from @skeletonlabs/skeleton-svelte or the svforge catalog.`
		});
	}
}

// ── 3. Hex colors outside theme files (WARN) ─────────────────────
for (const file of walk(srcDir)) {
	const rel = relative(ROOT, file).replace(/\\/g, '/');
	if (THEME_FILES.has(rel)) continue;
	const content = readFileSync(file, 'utf-8');
	const hexes = [...new Set(content.match(/#[0-9a-fA-F]{6}\b/g) || [])];
	const meaningful = hexes.filter((h) => !content.includes(`path d=`));
	if (meaningful.length) {
		results.push({
			status: 'warn',
			msg: `Arbitrary hex colors in ${rel}: ${meaningful.join(', ')}. Use theme tokens.`
		});
	}
}

// ── 4. Components outside canonical structure (WARN) ─────────────
if (existsSync(svforgeDir)) {
	const allowed = new Set(['primitives', 'ui', 'layout', 'dnd', 'graph', 'tiptap', 'uploads']);
	for (const file of walk(svforgeDir)) {
		const top = relative(svforgeDir, file).split(/\//)[0];
		if (!allowed.has(top)) {
			results.push({
				status: 'warn',
				msg: `Component ${relative(svforgeDir, file)} is outside the canonical structure (${[...allowed].join(', ')}).`
			});
		}
	}
}

const errors = results.filter((r) => r.status === 'error');
const warnings = results.filter((r) => r.status === 'warn');

console.log('\n SVForge check (design system)');
for (const r of results) {
	const icon = r.status === 'error' ? '✗' : '⚠';
	console.log(`  ${icon} ${r.status.toUpperCase()}: ${r.msg}`);
}
if (errors.length) {
	console.log(`\n✗ ${errors.length} design-system violation(s). Fix them before proceeding.\n`);
	process.exit(1);
} else if (warnings.length) {
	console.log(`\n⚠ ${warnings.length} warning(s) — review, not blocking.\n`);
} else {
	console.log('\n✓ Design system is clean.\n');
}
