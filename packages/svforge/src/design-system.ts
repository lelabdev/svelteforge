/**
 * SVForge design-system harness (#240).
 *
 * Combines a machine-readable catalog of available components/patterns with
 * automatic checks (`svforge check`) that make design-system violations
 * visible and blocking. The goal: an agent composing a page reuses Skeleton +
 * SvelteForge building blocks instead of inventing a new UI each time.
 *
 * Severity levels:
 *   ERROR — second UI kit, duplicated forbidden primitive, clear DS violation
 *   WARN  — arbitrary visual value, likely-duplicative local component
 *
 * This module is read-only: it never modifies project files.
 */

import type { DiagnosticResult } from './doctor';

export type Severity = 'ok' | 'warn' | 'error';

export interface CatalogEntry {
	path: string;
	category: 'primitives' | 'ui' | 'layout';
	useFor: string[];
	avoid?: string[];
}

/**
 * Machine-readable catalog of the SvelteForge design system.
 *
 * The catalog mirrors the canonical filesystem structure (#242):
 * primitives/ (small generic bricks), ui/ (composed reusable), layout/ (page
 * structure). Paths are relative to src/lib/components/svforge/.
 */
export const SVFORGE_CATALOG: Record<string, CatalogEntry> = {
	// ── primitives ────────────────────────────────────────────────
	Button: {
		path: 'primitives/Button.svelte',
		category: 'primitives',
		useFor: ['primary/secondary actions', 'form submits', 'links as buttons'],
		avoid: ['raw <button class="...">', 'reinventing variants']
	},
	Badge: {
		path: 'primitives/Badge.svelte',
		category: 'primitives',
		useFor: ['status labels', 'counts', 'tags'],
		avoid: ['custom span + colored classes']
	},
	Toggle: {
		path: 'primitives/Toggle.svelte',
		category: 'primitives',
		useFor: ['boolean switches'],
		avoid: ['custom checkbox-as-toggle']
	},
	Checkbox: {
		path: 'primitives/Checkbox.svelte',
		category: 'primitives',
		useFor: ['multi-select booleans'],
		avoid: ['raw <input type=checkbox> without styling']
	},
	Input: {
		path: 'primitives/Input.svelte',
		category: 'primitives',
		useFor: ['text inputs'],
		avoid: ['raw <input>']
	},
	Select: {
		path: 'primitives/Select.svelte',
		category: 'primitives',
		useFor: ['dropdown selection'],
		avoid: ['raw <select>']
	},
	Textarea: {
		path: 'primitives/Textarea.svelte',
		category: 'primitives',
		useFor: ['multi-line text'],
		avoid: ['raw <textarea>']
	},

	// ── ui (composed) ─────────────────────────────────────────────
	Card: {
		path: 'ui/Card.svelte',
		category: 'ui',
		useFor: ['content blocks', 'elevated surfaces', 'stat cards'],
		avoid: ['custom div + border + shadow']
	},
	Alert: {
		path: 'ui/Alert.svelte',
		category: 'ui',
		useFor: ['info/success/warning/error notices'],
		avoid: ['alert alert-* bootstrap classes', 'custom colored div']
	},
	Table: {
		path: 'ui/Table.svelte',
		category: 'ui',
		useFor: ['data tables', 'CRUD lists'],
		avoid: ['raw <table> with ad-hoc classes']
	},
	Logo: {
		path: 'ui/Logo.svelte',
		category: 'ui',
		useFor: ['brand mark in navbar/footer'],
		avoid: ['inline svg brand per page']
	},
	Seo: {
		path: 'ui/Seo.svelte',
		category: 'ui',
		useFor: ['meta tags / SEO head'],
		avoid: ['hand-written <svelte:head> meta spam']
	},
	ThemeToggle: {
		path: 'ui/ThemeToggle.svelte',
		category: 'ui',
		useFor: ['dark/light switch'],
		avoid: ['custom theme switcher']
	},

	// ── layout ────────────────────────────────────────────────────
	Navbar: {
		path: 'layout/Navbar.svelte',
		category: 'layout',
		useFor: ['top navigation'],
		avoid: ['custom header + nav per page']
	},
	Footer: {
		path: 'layout/Footer.svelte',
		category: 'layout',
		useFor: ['page footer'],
		avoid: ['custom footer per page']
	}
};

/**
 * Skeleton is the single source of UI primitives. These names must NOT be
 * recreated as project-local components (ERROR) — Skeleton already provides
 * them via @skeletonlabs/skeleton-svelte.
 */
export const SKELETON_PRIMITIVES = [
	'Accordion',
	'AppBar',
	'Avatar',
	'Badge',
	'Breadcrumb',
	'Button',
	'Card',
	'Checkbox',
	'Combobox',
	'DatePicker',
	'Dialog',
	'Drawer',
	'DropdownMenu',
	'Field',
	'Input',
	'Listbox',
	'Menu',
	'Popover',
	'Progress',
	'RadioGroup',
	'Select',
	'Slider',
	'SegmentedControl',
	'Stepper',
	'Tab',
	'Table',
	'Textarea',
	'Toast',
	'Toggle',
	'Tooltip'
] as const;

/** Other UI kits that are forbidden in SvelteForge projects (ERROR). */
export const FORBIDDEN_UI_KITS = [
	'@shadcn/svelte',
	'shadcn-svelte',
	'bits-ui',
	'@melt-ui/svelte',
	'flowbite-svelte',
	'skeletonlabs/skeleton-v2',
	'svelteui',
	'@svelteuidev/core'
];

/**
 * Check a SvelteForge project against the design-system harness.
 *
 * Rules (all read-only, tested against real scaffolds):
 *  ERROR
 *  - another UI kit installed
 *  - a Skeleton-provided primitive duplicated as a project-local component
 *  - hex colors used outside theme files when tokens exist
 *  WARN
 *  - arbitrary colors/radius/spacing not using tokens
 *  - component files outside the canonical svforge structure
 */
export async function checkDesignSystem(projectRoot: string): Promise<DiagnosticResult[]> {
	const fs = require('node:fs') as typeof import('node:fs');
	const path = require('node:path') as typeof import('node:path');
	const results: DiagnosticResult[] = [];

	const srcDir = path.join(projectRoot, 'src');
	const componentsDir = path.join(srcDir, 'lib/components/svforge');
	const pkgPath = path.join(projectRoot, 'package.json');

	// ── 1. Forbidden UI kits (ERROR) ──────────────────────────────
	let pkg: Record<string, Record<string, string>> = {};
	try {
		pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
	} catch {
		results.push({
			module: 'ds',
			status: 'error',
			message: 'Cannot read package.json — run svforge check from the project root.'
		});
		return results;
	}
	const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
	const installedKits = Object.keys(allDeps).filter((d) =>
		FORBIDDEN_UI_KITS.some((kit) => d === kit || d.startsWith(`${kit}/`))
	);
	for (const kit of installedKits) {
		results.push({
			module: 'ds',
			status: 'error',
			message: `Second UI kit detected: ${kit}. SvelteForge uses Skeleton as the single UI source. Remove it.`
		});
	}

	// ── 2. Duplicated Skeleton primitives (ERROR) ─────────────────
	if (fs.existsSync(srcDir)) {
		const walk = (dir: string, out: string[] = []): string[] => {
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) walk(full, out);
				else if (entry.name.endsWith('.svelte')) out.push(full);
			}
			return out;
		};
		const svelteFiles = walk(srcDir);
		for (const file of svelteFiles) {
			const base = path.basename(file, '.svelte');
			// Only flag components OUTSIDE the canonical svforge dir (a component
			// inside svforge/ is ours by construction).
			if (file.startsWith(componentsDir)) continue;
			if ((SKELETON_PRIMITIVES as readonly string[]).includes(base)) {
				results.push({
					module: 'ds',
					status: 'error',
					message: `Duplicated Skeleton primitive "${base}" at ${path.relative(projectRoot, file)}. Use ${base} from @skeletonlabs/skeleton-svelte or the svforge catalog instead.`
				});
			}
		}
	}

	// ── 3. Arbitrary hex colors outside theme (WARN) ──────────────
	const themeFiles = ['src/lib/styles/svelteforge-theme.css', 'src/lib/styles/tokens.css', 'src/lib/styles/index.css'];
	const nonThemeSvelte = fs.existsSync(srcDir)
		? (() => {
				const out: string[] = [];
				const walk = (dir: string) => {
					for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
						const full = path.join(dir, entry.name);
						if (entry.isDirectory()) walk(full);
						else if (entry.name.endsWith('.svelte')) out.push(full);
					}
				};
				walk(srcDir);
				return out;
			})()
		: [];
	for (const file of nonThemeSvelte) {
		const rel = path.relative(projectRoot, file);
		const content = fs.readFileSync(file, 'utf-8');
		// Ignore inline SVG path fills and explicit brand colors.
		const hexes = content.match(/#[0-9a-fA-F]{6}\b/g) || [];
		const meaningful = hexes.filter(
			(h) => !content.match(new RegExp(`(path|fill|stroke)[^\\n]*${h.replace('#', '\\#')}`))
		);
		if (meaningful.length > 0) {
			results.push({
				module: 'ds',
				status: 'warn',
				message: `Arbitrary hex colors in ${rel}: ${[...new Set(meaningful)].join(', ')}. Use theme tokens instead.`
			});
		}
	}

	// ── 4. Components outside the canonical svforge structure (WARN) ──
	if (fs.existsSync(componentsDir)) {
		const walk = (dir: string, out: string[] = []): string[] => {
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) walk(full, out);
				else if (entry.name.endsWith('.svelte')) out.push(full);
			}
			return out;
		};
		const svforgeFiles = walk(componentsDir);
		const allowedDirs = new Set(['primitives', 'ui', 'layout', 'dnd', 'graph', 'tiptap', 'uploads']);
		for (const file of svforgeFiles) {
			const rel = path.relative(componentsDir, file);
			const top = rel.split(path.sep)[0];
			if (!allowedDirs.has(top)) {
				results.push({
					module: 'ds',
					status: 'warn',
					message: `Component ${rel} lives outside the canonical structure (${[...allowedDirs].join(', ')}). Move it.`
				});
			}
		}
	}

	return results;
}
