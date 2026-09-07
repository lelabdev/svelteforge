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

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DiagnosticResult } from './doctor';
import {
	SKELETON_PRIMITIVES as GENERATED_SKELETON_PRIMITIVES,
	SKELETON_UTILITIES,
	SKELETON_UTILITY_PREFIXES
} from './skeleton-inventory';
import { ADDON_COMPONENTS } from './addon-components';

export type Severity = 'ok' | 'warn' | 'error';

/**
 * One conservative avoid matcher, co-located with the catalog entry it
 * belongs to (#342 review). `component` is derived from the catalog key —
 * there is no second hand-maintained list to drift away from the catalog.
 */
export interface AvoidPatternSpec {
	/** Native element the heuristic targets. */
	element: string;
	/** Class prefixes that count as hand-styling. */
	styleTokens: string[];
	/** Class prefixes marking a legitimate Skeleton/SVForge usage. */
	legitTokens: string[];
	/** How styleTokens combine: any (one suffices) or all (all required). */
	match: 'any' | 'all';
	/** Optional source-level signal required alongside class tokens (for example an accessible control label). */
	attributePattern?: string;
	/** Human-readable reason shown in the diagnostic. */
	reason: string;
}

export interface CatalogEntry {
	path: string;
	category: 'primitives' | 'ui' | 'layout';
	useFor: string[];
	avoid?: string[];
	/**
	 * Machine-readable subset of the `avoid` contract (#342 review): only the
	 * reliably detectable cases. Every entry that declares these MUST also
	 * document the human-readable `avoid` list (validated by
	 * `deriveAvoidPatterns`).
	 */
	avoidPatterns?: AvoidPatternSpec[];
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
		avoid: ['raw <button class="...">', 'reinventing variants'],
		avoidPatterns: [
			{
				element: 'button',
				// No bare 'bg-': structural buttons (modal overlays, icon toggles)
				// legitimately use bg utilities — #342 gate caught AdminLayout.
				styleTokens: ['preset-filled-', 'preset-tonal-', 'preset-outlined-', 'shadow-'],
				legitTokens: ['btn'],
				match: 'any',
				reason: 'hand-styled <button>: use the SVForge Button component (or the Skeleton btn class)'
			}
		]
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
		avoid: ['raw <input>'],
		avoidPatterns: [
			{
				element: 'input',
				styleTokens: ['border-', 'shadow-', 'bg-', 'rounded-'],
				legitTokens: ['input'],
				match: 'any',
				reason: 'hand-styled <input>: use the SVForge Input component (or the Skeleton input class)'
			}
		]
	},
	Select: {
		path: 'primitives/Select.svelte',
		category: 'primitives',
		useFor: ['dropdown selection'],
		avoid: ['raw <select>'],
		avoidPatterns: [
			{
				element: 'select',
				styleTokens: ['border-', 'shadow-', 'bg-', 'rounded-'],
				legitTokens: ['select'],
				match: 'any',
				reason: 'hand-styled <select>: use the SVForge Select component (or the Skeleton select class)'
			}
		]
	},
	Textarea: {
		path: 'primitives/Textarea.svelte',
		category: 'primitives',
		useFor: ['multi-line text'],
		avoid: ['raw <textarea>'],
		avoidPatterns: [
			{
				element: 'textarea',
				styleTokens: ['border-', 'shadow-', 'bg-', 'rounded-'],
				legitTokens: ['textarea'],
				match: 'any',
				reason: 'hand-styled <textarea>: use the SVForge Textarea component (or the Skeleton textarea class)'
			}
		]
	},

	// ── ui (composed) ─────────────────────────────────────────────
	Card: {
		path: 'ui/Card.svelte',
		category: 'ui',
		useFor: ['content blocks', 'elevated surfaces', 'stat cards'],
		avoid: ['custom div + border + shadow'],
		avoidPatterns: [
			{
				element: 'div',
				styleTokens: ['border-', 'shadow-', 'rounded-'],
				legitTokens: ['card'],
				match: 'all',
				reason: 'card-like <div> (border + shadow + radius): use the SVForge Card component'
			}
		]
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
		avoid: ['raw <table> with ad-hoc classes'],
		avoidPatterns: [
			{
				element: 'table',
				styleTokens: [],
				legitTokens: [],
				match: 'any',
				reason: 'raw <table>: the SVForge Table component is the canonical data table (columns, slots, styling)'
			}
		]
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
		useFor: ['application dark/light switching'],
		avoid: ['local button that changes the application theme'],
		avoidPatterns: [
			{
				element: 'button',
				styleTokens: ['btn'],
				legitTokens: [],
				match: 'all',
				attributePattern: "aria-label\\s*=\\s*['\"][^'\"]*(?:theme|dark mode|light mode)[^'\"]*['\"]",
				reason: 'ad-hoc application theme control: reuse the SVForge ThemeToggle component'
			}
		]
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
 *
 * GENERATED (#335) from the installed @skeletonlabs/skeleton-svelte package:
 * a newly exported primitive is protected automatically, without editing a
 * blacklist. See src/skeleton-inventory.ts.
 */
export const SKELETON_PRIMITIVES: string[] = GENERATED_SKELETON_PRIMITIVES;

/**
 * Former scaffold aliases (#335): generic spacing/typography names removed
 * from the scaffold because they recreated a parallel token layer. Using one
 * is an ERROR unless the project explicitly re-defines it with @utility.
 */
export const REMOVED_SCAFFOLD_ALIASES = [
	'p-element',
	'gap-group',
	'space-y-section',
	'py-section',
	'max-w-modal',
	'max-w-container',
	'font-heading',
	'font-code'
];

/** Token namespaces that look like Skeleton utilities. */
const SKELETON_LOOKING = ['btn-icon', 'btn', 'badge', 'chip', 'card', 'label', 'input', 'select', 'textarea', 'preset-'];
/**
 * Tailwind utilities that share a Skeleton namespace stay Tailwind
 * (select-none, select-text, …). Anything else on a Skeleton namespace that
 * is not in the inventory is an invented utility (#335).
 */
const SKELETON_TAILWIND_EXCEPTIONS: Record<string, string[]> = {
	select: ['none', 'text', 'all', 'auto']
};
/** Valid Tailwind rounded-* suffixes; anything else is an invented shape. */
const TAILWIND_RADIUS = /^(none|sm|md|lg|xl|2xl|3xl|full|(t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee)(-(none|sm|md|lg|xl|2xl|3xl|full))?|start|end)$/;

/** Tailwind namespaces that can never be Skeleton primitives (last segment). */
const TAILWIND_NAMESPACES = [
	'w-', 'min-w-', 'max-w-', 'h-', 'min-h-', 'max-h-', 'size-', 'p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-',
	'm-', 'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-', 'gap-', 'space-x-', 'space-y-', 'inset-', 'top-', 'right-',
	'bottom-', 'left-', 'basis-', 'flex-', 'grid-', 'col-', 'row-', 'auto-cols-', 'auto-rows-', 'items-',
	'justify-', 'content-', 'self-', 'place-', 'order-', 'text-', 'font-', 'tracking-', 'leading-', 'list-',
	'whitespace-', 'break-', 'bg-', 'from-', 'via-', 'to-', 'border-', 'divide-', 'ring-', 'rounded-', 'shadow-',
	'opacity-', 'blur-', 'brightness-', 'contrast-', 'grayscale-', 'saturate-', 'hue-rotate-', 'backdrop-',
	'transition-', 'duration-', 'ease-', 'delay-', 'scale-', 'rotate-', 'translate-', 'skew-', 'origin-',
	'aspect-', 'object-', 'overflow-', 'overscroll-', 'z-', 'cursor-', 'select-', 'touch-', 'columns-',
	'outline-', 'decoration-', 'underline-', 'accent-', 'caret-', 'scroll-', 'snap-', 'fill-', 'stroke-',
	'indent-', 'align-', 'appearance-', 'resize-', 'will-change-', 'motion-', 'sr-only'
];
const TAILWIND_EXACT = new Set([
	'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'hidden', 'table', 'contents', 'flow-root',
	'static', 'fixed', 'absolute', 'relative', 'sticky', 'isolate', 'container', 'transform', 'animate-spin',
	'animate-ping', 'animate-pulse', 'animate-bounce', 'grayscale', 'invert', 'sepia', 'transition', 'resize',
	'rounded', 'border', 'outline', 'underline', 'sr-only', 'not-sr-only', 'group', 'peer', 'antialiased',
	'italic', 'not-italic', 'uppercase', 'lowercase', 'capitalize', 'normal-case', 'truncate', 'underline-offset-auto',
	'prose', 'avatar-group', 'sr', 'grow', 'grow-0', 'shrink', 'shrink-0'
]);
const TAILWIND_VARIANTS = new Set(['sm', 'md', 'lg', 'xl', '2xl', 'hover', 'focus', 'focus-within', 'focus-visible', 'active', 'visited', 'target', 'first', 'last', 'only', 'odd', 'even', 'first-of-type', 'last-of-type', 'empty', 'disabled', 'enabled', 'checked', 'indeterminate', 'default', 'required', 'valid', 'invalid', 'in-range', 'out-of-range', 'placeholder-shown', 'details-content', 'autofill', 'read-only', 'before', 'after', 'marker', 'file', 'backdrop', 'selection', 'first-line', 'first-letter', 'file-input', 'dark', 'motion-safe', 'motion-reduce', 'motion-secure', 'contrast-more', 'contrast-less', 'forced-colors', 'print', 'rtl', 'ltr', 'open', 'inert', 'group-hover', 'group-focus', 'peer-hover', 'peer-focus', 'peer-checked', 'peer-disabled', 'aria-checked', 'aria-disabled', 'aria-expanded', 'aria-hidden', 'aria-pressed', 'aria-readonly', 'supports-', 'data-', 'has-', 'not-', 'in-', 'min-', 'max-', 'start', 'end']);

function isTailwind(token: string): boolean {
	// Arbitrary values are Tailwind by definition: w-[42px], bg-[#abc], grid-cols-[1fr_2fr].
	if (token.includes('[') && token.includes(']')) return true;
	let segment = token;
	// Strip leading variants: md:hover:bg-... — analyze the last segment.
	while (true) {
		const index = segment.indexOf(':');
		if (index === -1) break;
		const variant = segment.slice(0, index);
		if (!TAILWIND_VARIANTS.has(variant) && !variant.startsWith('group-') && !variant.startsWith('peer-')) return false;
		segment = segment.slice(index + 1);
	}
	if (TAILWIND_EXACT.has(segment)) return true;
	if (TAILWIND_NAMESPACES.some((namespace) => segment.startsWith(namespace))) return true;
	// Bare tailwind scale values attached to a namespace we already matched.
	return false;
}

function isSkeletonUtility(token: string, ctx: { utilities: string[]; prefixes: string[] }): boolean {
	return ctx.utilities.includes(token) || ctx.prefixes.some((prefix) => token.startsWith(prefix));
}

export interface MarkupViolation {
	token: string;
	severity: 'error' | 'warn';
	message: string;
}

export interface MarkupContext {
	utilities: string[];
	prefixes: string[];
	/** @utility names redefined by the project's own CSS files. */
	projectUtilities?: string[];
}

/**
 * Deterministic Skeleton markup rules (#335).
 *
 * ERROR = certain Skeleton violation / low false-positive risk.
 * WARN  = suspicious composition requiring human review.
 */
export function checkClassString(classString: string, ctx: MarkupContext): MarkupViolation[] {
	const violations: MarkupViolation[] = [];
	const tokens = classString.split(/\s+/).map((token) => token.trim()).filter(Boolean);
	const skeletonTokens = tokens.filter((token) => isSkeletonUtility(token, ctx));

	// ── Incompatible primitives on the same element ──────────────
	const hasBtn = skeletonTokens.includes('btn');
	const hasBtnIcon = skeletonTokens.includes('btn-icon');
	const hasCard = skeletonTokens.includes('card');
	const rounded = tokens.filter((token) => token.startsWith('rounded-') || token === 'rounded');
	if (hasBtn && hasBtnIcon) {
		violations.push({
			token: 'btn + btn-icon',
			severity: 'error',
			message: 'btn and btn-icon are mutually exclusive primitives: render one or the other, never both.'
		});
	}
	for (const token of rounded) {
		if (hasBtn || hasBtnIcon) {
			violations.push({
				token,
				severity: 'error',
				message: `btn already owns its radius/shape — do not reapply ${token}. Remove it or use the Skeleton size primitive.`
			});
		}
		if (hasCard) {
			violations.push({
				token,
				severity: 'error',
				message: `card already owns its radius/shape — do not reapply ${token}.`
			});
		}
	}

	for (const token of tokens) {
		// Strip any variant prefix for classification.
		const segment = token.includes(':') ? token.slice(token.lastIndexOf(':') + 1) : token;
		// ── Former scaffold aliases ───────────────────────────────
		if (REMOVED_SCAFFOLD_ALIASES.includes(segment) && !(ctx.projectUtilities ?? []).includes(segment)) {
			violations.push({
				token,
				severity: 'error',
				message: `${segment} is a removed scaffold alias: it recreates a parallel token layer. Use Tailwind spacing/typography utilities or theme tokens.`
			});
			continue;
		}
		if (isSkeletonUtility(segment, ctx)) continue;
		// ── Skeleton-looking utility that does not exist ──────────
		// Checked BEFORE Tailwind namespaces: Skeleton owns these namespaces,
		// except for the whitelisted Tailwind colliders (select-none, …).
		if (SKELETON_LOOKING.some((namespace) => segment.startsWith(namespace)) && !segment.includes('[')) {
			const root = segment.replace(/-.*$/, '');
			const exception = SKELETON_TAILWIND_EXCEPTIONS[root]?.includes(segment.slice(root.length + 1));
			if (!exception) {
				violations.push({
					token,
					severity: 'error',
					message: `${segment} does not exist in the installed Skeleton version. Check the class name or use a preset-* / size utility that exists.`
				});
				continue;
			}
		}
		if (isTailwind(token)) continue;
		// Unknown non-Skeleton tokens are #314 territory (CSS drift), not flagged here.
	}
	return violations;
}

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
 *  - hex colors used outside theme files (covered by the dedicated hex scan)
 *  - arbitrary radius/spacing classes (#345): rounded-[…], rounded-{t,r,b,l,
 *    tl,tr,bl,br}-[…], p/m/gap/space namespaces with any direction or logical
 *    side (px, pt, ps, pe, mx, ms, me, gap-x, gap-y, …), including negative
 *    values (-m-[…]). Scanned syntax: static double-quoted class="…"
 *    attributes only — dynamic class={…} and single-quoted attributes are
 *    intentionally NOT scanned. Structural/product-specific values (w-[…],
 *    h-[…], text-[…], position offsets) stay allowed, and arbitrary colors
 *    remain under the hex scan rather than the class scan.
 *  - component files outside the canonical svforge structure
 */
/**
 * Arbitrary radius/spacing detection (#345). Returns the offending class
 * tokens (Tailwind variants preserved) of a class string. Conservative:
 * only radius and spacing namespaces are reported — width/height/font-size/
 * offsets stay allowed as structural or product-specific values, and colors
 * remain under the dedicated hex scan.
 */
const ARBITRARY_SPACING_NAMESPACES = [
	'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'ps', 'pe',
	'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'ms', 'me',
	'gap', 'gap-x', 'gap-y', 'space-x', 'space-y'
] as const;

const DIRECTIONAL_RADIUS = /^rounded-(?:t|r|b|l|tl|tr|bl|br)$/;

export function checkArbitraryTokens(classString: string): string[] {
	const offenders: string[] = [];
	for (const token of classString.split(/\s+/).filter(Boolean)) {
		const segment = token.includes(':') ? token.slice(token.lastIndexOf(':') + 1) : token;
		// Negative margins: -m-[3px] — the leading dash is not part of the ns.
		const body = segment.startsWith('-') ? segment.slice(1) : segment;
		const bracket = body.indexOf('-[');
		if (bracket === -1) continue;
		const ns = body.slice(0, bracket);
		const isRadius = ns === 'rounded' || DIRECTIONAL_RADIUS.test(ns);
		const isSpacing = (ARBITRARY_SPACING_NAMESPACES as readonly string[]).includes(ns);
		if (isRadius || isSpacing) offenders.push(token);
	}
	return offenders;
}

export async function checkDesignSystem(projectRoot: string): Promise<DiagnosticResult[]> {
	const results: DiagnosticResult[] = [];

	const srcDir = path.join(projectRoot, 'src');
	const componentsDir = path.join(srcDir, 'lib/components/svforge');
	const pkgPath = path.join(projectRoot, 'package.json');

	// ── 1. Forbidden UI kits (ERROR) ──────────────────────────────
	let pkg: Record<string, Record<string, string>>;
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
		// Only exact approved catalog paths are exempt (#361): a new local
		// component under components/svforge/ matching a Skeleton primitive is
		// still an error. Components delivered by an installed addon (uploads,
		// dnd, …) are approved while that addon is installed.
		const catalogPaths = new Set(Object.values(SVFORGE_CATALOG).map((entry) => entry.path));
		const installedModules = readManifestModules(fs, path, projectRoot);
		for (const file of svelteFiles) {
			const base = path.basename(file, '.svelte');
			if (!(SKELETON_PRIMITIVES as readonly string[]).includes(base)) continue;
			// POSIX-normalized: catalog/generated paths always use forward slashes.
			const relFromComponents = path.relative(componentsDir, file).split(path.sep).join('/');
			// Approved by exact path only: catalog components + the precise
			// component paths of an INSTALLED addon — never a whole dir.
			if (catalogPaths.has(relFromComponents)) continue;
			if (isApprovedAddonComponent(relFromComponents, installedModules)) continue;
			results.push({
				module: 'ds',
				status: 'error',
				message: `Duplicated Skeleton primitive "${base}" at ${path.relative(projectRoot, file)}. Use ${base} from @skeletonlabs/skeleton-svelte or the svforge catalog instead.`
			});
		}
	}

	// ── 3. Arbitrary hex colors outside theme (WARN) ──────────────

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
		// Arbitrary radius/spacing (#345, WARN). Exact-path exemption only
		// (#345 review, mirroring #361): the canonical implementation at its
		// exact catalog path (plus precise installed-addon component paths) is
		// exempt — an unapproved new component in the same directory warns.
		const relPosix = path.relative(componentsDir, file).split(path.sep).join('/');
		const approvedPaths = new Set(Object.values(SVFORGE_CATALOG).map((entry) => entry.path));
		const installedModules = readManifestModules(fs, path, projectRoot);
		const isCanonicalImplementation =
			approvedPaths.has(relPosix) || isApprovedAddonComponent(relPosix, installedModules);
		if (!isCanonicalImplementation) {
			const offenders = new Set<string>();
			for (const match of content.matchAll(/class="([^"]*)"/g)) {
				for (const token of checkArbitraryTokens(match[1])) offenders.add(token);
			}
			if (offenders.size > 0) {
				results.push({
					module: 'ds',
					status: 'warn',
					message: `Arbitrary radius/spacing in ${rel}: ${[...offenders].join(', ')}. Use the Tailwind scale or theme tokens instead.`
				});
			}
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

	// ── 5. Skeleton markup composition (#335, ERROR) ───────────────
	if (fs.existsSync(srcDir)) {
		const approvedPaths = new Set(Object.values(SVFORGE_CATALOG).map((entry) => entry.path));
		const installedModules = readManifestModules(fs, path, projectRoot);
		const markupCtx: MarkupContext = {
			utilities: SKELETON_UTILITIES,
			prefixes: SKELETON_UTILITY_PREFIXES,
			projectUtilities: collectProjectUtilities(fs, path, srcDir)
		};
		const collectMarkup = (dir: string, out: string[] = []): string[] => {
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) collectMarkup(full, out);
				else if (entry.name.endsWith('.svelte') || entry.name.endsWith('.html')) out.push(full);
			}
			return out;
		};
		for (const file of collectMarkup(srcDir)) {
			const source = fs.readFileSync(file, 'utf-8');
			const rel = path.relative(projectRoot, file);
			// Catalog avoid patterns (#342, WARN). Exact-path exemption only
			// (#342 review, mirroring #361): the canonical implementation at its
			// exact catalog path (plus precise installed-addon component paths)
			// never warns about its own markup — an unapproved new component in
			// the same directory still does.
			// Catalog paths and addon mappings are relative to componentsDir.
			const relPosix = path.relative(componentsDir, file).split(path.sep).join('/');
			const isCanonicalImplementation =
				approvedPaths.has(relPosix) || isApprovedAddonComponent(relPosix, installedModules);
			if (!isCanonicalImplementation) {
				for (const { component, reason } of checkAvoidPatterns(source)) {
					results.push({
						module: 'ds',
						status: 'warn',
						message: `${rel}: ${reason} — consider ${component}`
					});
				}
			}
			for (const { className, violations } of checkSvelteMarkup(source, markupCtx)) {
				for (const violation of violations) {
					results.push({
						module: 'ds',
						status: violation.severity,
						message: `${rel}: "${className}" — ${violation.message}`
					});
				}
			}
		}
	}

	return results;
}

/**
 * Extract markup violations from a Svelte/HTML source (#335).
 *
 * Two families:
 * - class="..." attributes on plain elements → primitive conflicts, invented
 *   Skeleton-looking utilities, removed scaffold aliases;
 * - class="..." on an SVForge wrapper component (Button, Card, …) containing
 *   a Skeleton primitive → the wrapper already owns its primitive; the class
 *   contract is "props = Skeleton choice, class = local Tailwind".
 */
export function checkSvelteMarkup(source: string, ctx: MarkupContext): { className: string; violations: MarkupViolation[] }[] {
	const out: { className: string; violations: MarkupViolation[] }[] = [];
	const wrapperNames = Object.keys(SVFORGE_CATALOG).join('|');
	// class="..." (plain or on components). Single quotes and curly expressions
	// are intentionally not parsed: deterministic rules only.
	const classAttrPattern = new RegExp(
		`<(?:${wrapperNames})\\b[^>]*?class="([^"]*)"|class="([^"]*)"`,
		'g'
	);
	for (const match of source.matchAll(classAttrPattern)) {
		const className = match[1] ?? match[2];
		if (!className) continue;
		const violations = checkClassString(className, ctx);
		if (match[1] !== undefined) {
			// SVForge wrapper: any Skeleton primitive inside class is an error.
			const tokens = className.split(/\s+/).filter(Boolean);
			for (const token of tokens) {
				const segment = token.includes(':') ? token.slice(token.lastIndexOf(':') + 1) : token;
				if (isSkeletonUtility(segment, ctx)) {
					violations.push({
						token,
						severity: 'error',
						message: `The SVForge wrapper already renders its Skeleton primitive: select the visual through its props (variant, size, …) — not through class ("${token}").`
					});
				} else if (segment.startsWith('rounded-') && !TAILWIND_RADIUS.test(segment.slice('rounded-'.length))) {
					violations.push({
						token,
						severity: 'error',
						message: `${segment} is not a Tailwind default radius and the wrapper already owns its shape: select the shape through props (or corner-shape-*).`
					});
				}
			}
		}
		if (violations.length) out.push({ className, violations });
	}
	return out;
}

/**
 * Machine-readable avoid patterns derived from the catalog's `avoid` lists
 * (#342). Conservative markup heuristics only — each entry targets a native
 * element and names the catalog component that should be used instead.
 * Findings are WARN: the heuristic can legitimately miss hand-styled markup
 * through dynamic classes, and that is fine for a warning.
 *
 * This array is JSON-serializable: the prebuild injects it into the
 * scaffolded checker (svforge-check.mjs) so project-side checks apply the
 * same rules.
 */
export interface AvoidPattern extends AvoidPatternSpec {
	/** Catalog component recommended instead (the catalog key). */
	component: string;
}

/**
 * Derive the flat matcher list from the catalog (#342 review): the catalog
 * entry IS the single source. An entry declaring `avoidPatterns` must also
 * document its human-readable `avoid` contract — a mismatch throws so the
 * two can never drift silently.
 */
export function deriveAvoidPatterns(
	catalog: Record<string, CatalogEntry> = SVFORGE_CATALOG
): AvoidPattern[] {
	const patterns: AvoidPattern[] = [];
	for (const [component, entry] of Object.entries(catalog)) {
		if (!entry.avoidPatterns) continue;
		if (!entry.avoid || entry.avoid.length === 0) {
			throw new Error(
				`Catalog entry ${component} declares avoidPatterns but has an empty avoid contract (#342).`
			);
		}
		for (const spec of entry.avoidPatterns) patterns.push({ ...spec, component });
	}
	return patterns;
}

/** Flat matchers used by the checks; injected into the scaffolded checker. */
export const AVOID_PATTERNS: AvoidPattern[] = deriveAvoidPatterns();

/** Extract the class attribute value of an element match (static classes only). */
function extractClassAttr(attrs: string): string {
	const match = attrs.match(/class=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/);
	return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();
}

/**
 * Detect avoid-pattern violations in a .svelte source (#342). Conservative:
 * dynamic class expressions are ignored (no tokens → no finding), and
 * legitimate Skeleton class usage never warns.
 */
export function checkAvoidPatterns(source: string): { component: string; reason: string }[] {
	const findings: { component: string; reason: string }[] = [];
	for (const pattern of AVOID_PATTERNS) {
		const elementRegex = // Case-sensitive: native HTML elements are lowercase — a PascalCase Svelte
			// component (<Table …>) must not match the raw-element heuristic.
			new RegExp(`<${pattern.element}(\\s[^>]*)?>`, 'g');
		for (const match of source.matchAll(elementRegex)) {
			const attrs = match[1] ?? '';
			const tokens = extractClassAttr(attrs).split(/\s+/).filter(Boolean);
			if (pattern.attributePattern && !new RegExp(pattern.attributePattern, 'i').test(attrs)) continue;
			if (pattern.legitTokens.some((prefix) => tokens.some((token) => token.startsWith(prefix)))) continue;
			if (pattern.styleTokens.length === 0) {
				findings.push({ component: pattern.component, reason: pattern.reason });
				continue;
			}
			const has = (prefix: string) => tokens.some((token) => token.startsWith(prefix));
			const styled =
				pattern.match === 'all' ? pattern.styleTokens.every(has) : pattern.styleTokens.some(has);
			if (styled) findings.push({ component: pattern.component, reason: pattern.reason });
		}
	}
	return findings;
}

/**
 * Whether a POSIX component path is an approved component of an INSTALLED
 * addon (#361). The addon id is the mapping KEY — it may differ from the
 * path's first segment (notifications → ui/NotificationsBell.svelte,
 * ui_toast → ui/Toaster.svelte).
 */
export function isApprovedAddonComponent(
	relPosixPath: string,
	installedModules: readonly string[]
): boolean {
	return installedModules.some((moduleId) => (ADDON_COMPONENTS[moduleId] ?? []).includes(relPosixPath));
}

/** Read the installed addon module ids from the project manifest (.svforge.json). */
function readManifestModules(fs: typeof import('node:fs'), path: typeof import('node:path'), projectRoot: string): string[] {
	const manifestPath = path.join(projectRoot, '.svforge.json');
	if (!fs.existsSync(manifestPath)) return [];
	try {
		const modules = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')).modules;
		return Array.isArray(modules) ? modules.filter((module): module is string => typeof module === 'string') : [];
	} catch {
		return [];
	}
}

/** Collect @utility names redefined by the project's own CSS files. */
function collectProjectUtilities(fs: typeof import('node:fs'), path: typeof import('node:path'), srcDir: string): string[] {
	const names: string[] = [];
	const walk = (dir: string) => {
		if (!fs.existsSync(dir)) return;
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.name.endsWith('.css')) {
				const source = fs.readFileSync(full, 'utf-8');
				for (const match of source.matchAll(/@utility\s+([a-zA-Z0-9-]+)/g)) names.push(match[1]);
			}
		}
	};
	walk(srcDir);
	return names;
}
