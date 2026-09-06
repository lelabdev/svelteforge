#!/usr/bin/env node
/**
 * SVForge design-system check (#240, #335).
 *
 * Self-contained (no runtime deps): scans the project for design-system
 * violations and exits non-zero on ERROR. Delivered by the SvelteForge base
 * template — run `node svforge-check.mjs` (or `bun svforge-check.mjs`) after
 * composing a page.
 *
 * ERROR — second UI kit, duplicated Skeleton primitive, incompatible Skeleton
 *         primitives on one element, Skeleton primitive injected through
 *         `class` into an SVForge wrapper, invented Skeleton-looking utility,
 *         removed scaffold alias, hex outside theme
 * WARN  — component outside canonical structure
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const ROOT = process.cwd();
const results = [];

// Skeleton inventory injected at scaffold time from the actually shipped
// @skeletonlabs packages (#335). Fallback: derive from the project's own
// node_modules below when available.
const SKELETON_INVENTORY = /*__SKELETON_INVENTORY__*/ {"versions":{},"primitives":[],"utilities":[],"utilityPrefixes":[]};
const FORBIDDEN_KITS = [
	'@shadcn/svelte', 'shadcn-svelte', 'bits-ui', '@melt-ui/svelte',
	'flowbite-svelte', 'svelteui', '@svelteuidev/core'
];
const THEME_FILES = new Set([
	'src/lib/styles/svelteforge-theme.css',
	'src/lib/styles/tokens.css',
	'src/lib/styles/index.css'
]);
const REMOVED_ALIASES = new Set([
	'p-element', 'gap-group', 'space-y-section', 'py-section',
	'max-w-modal', 'max-w-container', 'font-heading', 'font-code'
]);
const SKELETON_LOOKING = ['btn-icon', 'btn', 'badge', 'chip', 'card', 'label', 'input', 'select', 'textarea', 'preset-'];
const TAILWIND_NS = [
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
	'italic', 'not-italic', 'uppercase', 'lowercase', 'capitalize', 'normal-case', 'truncate', 'prose',
	'grow', 'grow-0', 'shrink', 'shrink-0'
]);
const VARIANTS = new Set([
	'sm', 'md', 'lg', 'xl', '2xl', 'hover', 'focus', 'focus-within', 'focus-visible', 'active', 'visited',
	'target', 'first', 'last', 'only', 'odd', 'even', 'empty', 'disabled', 'enabled', 'checked', 'indeterminate',
	'default', 'required', 'valid', 'invalid', 'placeholder-shown', 'autofill', 'read-only', 'before', 'after',
	'marker', 'file', 'backdrop', 'selection', 'dark', 'motion-safe', 'motion-reduce', 'contrast-more',
	'contrast-less', 'forced-colors', 'print', 'rtl', 'ltr', 'open', 'inert', 'group-hover', 'group-focus',
	'peer-hover', 'peer-focus', 'peer-checked', 'peer-disabled', 'start', 'end'
]);

function walk(dir, exts, out = []) {
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, exts, out);
		else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
	}
	return out;
}

function lastSegment(token) {
	return token.includes(':') ? token.slice(token.lastIndexOf(':') + 1) : token;
}

function isSkeletonUtility(token, inventory) {
	return inventory.utilities.includes(token) || inventory.utilityPrefixes.some((p) => token.startsWith(p));
}

function isTailwind(token) {
	if (token.includes('[') && token.includes(']')) return true;
	let segment = token;
	while (segment.includes(':')) {
		const variant = segment.slice(0, segment.indexOf(':'));
		if (!VARIANTS.has(variant) && !variant.startsWith('group-') && !variant.startsWith('peer-')) return false;
		segment = segment.slice(segment.indexOf(':') + 1);
	}
	if (TAILWIND_EXACT.has(segment)) return true;
	return TAILWIND_NS.some((ns) => segment.startsWith(ns));
}

// Prefer the project's own installed Skeleton when it can be derived.
function deriveInventoryFromNodeModules() {
	const utilitiesDir = join(ROOT, 'node_modules', '@skeletonlabs', 'skeleton', 'src', 'utilities');
	if (!existsSync(utilitiesDir)) return null;
	const inventory = { versions: {}, primitives: [...SKELETON_INVENTORY.primitives], utilities: [], utilityPrefixes: [] };
	for (const file of walk(utilitiesDir, ['.css'])) {
		const source = readFileSync(file, 'utf-8');
		for (const match of source.matchAll(/@utility\s+([a-zA-Z0-9-]+)/g)) {
			if (match[1].endsWith('-')) inventory.utilityPrefixes.push(match[1]);
			else inventory.utilities.push(match[1]);
		}
	}
	return inventory;
}

const INVENTORY = deriveInventoryFromNodeModules() ?? SKELETON_INVENTORY;

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
const componentsDir = join(ROOT, 'src', 'lib', 'components', 'svforge');
for (const file of walk(join(ROOT, 'src'), ['.svelte'])) {
	const base = basename(file, '.svelte');
	if (file.startsWith(componentsDir)) continue;
	if (INVENTORY.primitives.includes(base)) {
		results.push({ status: 'error', msg: `Duplicated Skeleton primitive "${base}" at ${relative(ROOT, file)}. Use it from @skeletonlabs/skeleton-svelte or the svforge catalog instead.` });
	}
}

// ── 3. Skeleton markup composition (#335, ERROR) ─────────────────
const projectUtilities = [];
for (const file of walk(join(ROOT, 'src'), ['.css'])) {
	const source = readFileSync(file, 'utf-8');
	for (const match of source.matchAll(/@utility\s+([a-zA-Z0-9-]+)/g)) projectUtilities.push(match[1]);
}

let catalogWrappers = [];
const catalogPath = join(ROOT, 'svforge-catalog.json');
if (existsSync(catalogPath)) {
	try {
		catalogWrappers = Object.keys(JSON.parse(readFileSync(catalogPath, 'utf-8')));
	} catch {
		// unreadable catalog: wrapper rule skipped, deterministic rules stay on
	}
}

function classViolations(classString) {
	const violations = [];
	const tokens = classString.split(/\s+/).filter(Boolean);
	const skeletonTokens = tokens.filter((token) => isSkeletonUtility(token, INVENTORY));
	const hasBtn = skeletonTokens.includes('btn');
	const hasBtnIcon = skeletonTokens.includes('btn-icon');
	const hasCard = skeletonTokens.includes('card');

	if (hasBtn && hasBtnIcon) {
		violations.push('btn and btn-icon are mutually exclusive primitives: render one or the other, never both.');
	}
	for (const token of tokens) {
		if ((token.startsWith('rounded-') || token === 'rounded') && (hasBtn || hasBtnIcon)) {
			violations.push(`btn already owns its radius/shape — do not reapply ${token}.`);
		}
		if ((token.startsWith('rounded-') || token === 'rounded') && hasCard) {
			violations.push(`card already owns its radius/shape — do not reapply ${token}.`);
		}
	}

	for (const token of tokens) {
		const segment = lastSegment(token);
		if (REMOVED_ALIASES.has(segment) && !projectUtilities.includes(segment)) {
			violations.push(`${segment} is a removed scaffold alias: it recreates a parallel token layer. Use Tailwind utilities or theme tokens.`);
			continue;
		}
		if (isSkeletonUtility(segment, INVENTORY)) continue;
		if (isTailwind(token)) continue;
		if (SKELETON_LOOKING.some((ns) => segment.startsWith(ns)) && !segment.includes('[')) {
			violations.push(`${segment} does not exist in the installed Skeleton version. Check the class name.`);
		}
	}
	return violations;
}

for (const file of walk(join(ROOT, 'src'), ['.svelte', '.html'])) {
	const source = readFileSync(file, 'utf-8');
	const rel = relative(ROOT, file);
	const wrapperPattern = catalogWrappers.length
		? new RegExp(`<(?:${catalogWrappers.join('|')})\\b[^>]*?class="([^"]*)"|class="([^"]*)"`, 'g')
		: /class="([^"]*)"/g;
	for (const match of source.matchAll(wrapperPattern)) {
		const className = match[1] ?? match[2];
		if (!className) continue;
		const violations = classViolations(className);
		if (match[1] !== undefined) {
			for (const token of className.split(/\s+/).filter(Boolean)) {
				if (isSkeletonUtility(lastSegment(token), INVENTORY)) {
					violations.push(`The SVForge wrapper already renders its Skeleton primitive: select the visual through props — not class ("${token}").`);
				}
			}
		}
		for (const violation of violations) {
			results.push({ status: 'error', msg: `${rel}: "${className}" — ${violation}` });
		}
	}
}

// ── 4. Hex colors outside theme (WARN) ───────────────────────────
for (const file of walk(join(ROOT, 'src'), ['.svelte'])) {
	if (THEME_FILES.has(relative(ROOT, file))) continue;
	const content = readFileSync(file, 'utf-8');
	const hexes = content.match(/#[0-9a-fA-F]{6}\b/g) || [];
	const meaningful = hexes.filter((h) => !content.match(new RegExp(`(path|fill|stroke)[^\\n]*${h.replace('#', '\\#')}`)));
	if (meaningful.length > 0) {
		results.push({ status: 'warn', msg: `Arbitrary hex colors in ${relative(ROOT, file)}: ${[...new Set(meaningful)].join(', ')}. Use theme tokens instead.` });
	}
}

// ── 5. Components outside the canonical structure (WARN) ─────────
const allowedDirs = new Set(['primitives', 'ui', 'layout', 'dnd', 'graph', 'tiptap', 'uploads']);
for (const file of walk(componentsDir, ['.svelte'])) {
	const rel = relative(componentsDir, file);
	const top = rel.split(join.sep)[0];
	if (!allowedDirs.has(top)) {
		results.push({ status: 'warn', msg: `Component ${rel} lives outside the canonical structure. Move it.` });
	}
}

// ── Report ───────────────────────────────────────────────────────
if (results.length === 0) {
	console.log('✓ [ds] no design-system violations found.');
	process.exit(0);
}
for (const result of results) {
	console.log(`${result.status === 'error' ? '✗' : '⚠'} [ds] ${result.status.toUpperCase()}: ${result.msg}`);
}
process.exit(results.some((result) => result.status === 'error') ? 1 : 0);
