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
 * WARN  — hex outside theme, arbitrary radius/spacing classes (#345),
 *         catalog avoid patterns (#342), component outside canonical structure
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename, sep } from 'node:path';

const ROOT = process.cwd();
const results = [];

// Skeleton inventory injected at scaffold time from the actually shipped
// @skeletonlabs packages (#335). Fallback: derive from the project's own
// node_modules below when available.
const SKELETON_INVENTORY = /*__SKELETON_INVENTORY__*/ {"versions":{},"primitives":[],"utilities":[],"utilityPrefixes":[]};
// Exact addon-delivered component paths, approved per precise path (#361).
const ADDON_COMPONENTS = /*__ADDON_COMPONENTS__*/ {};
// Catalog avoid patterns (#342): conservative markup heuristics, WARN only.
const AVOID_PATTERNS = /*__AVOID_PATTERNS__*/ [];
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
// Primitives and utilities are derived independently: a consumer can install a
// newer skeleton-svelte (new primitives) or skeleton (new utilities), and each
// side falls back to the shipped inventory when its package is missing (#361).
function deriveInventoryFromNodeModules() {
	const inventory = {
		versions: { ...SKELETON_INVENTORY.versions },
		primitives: [...SKELETON_INVENTORY.primitives],
		utilities: [...SKELETON_INVENTORY.utilities],
		utilityPrefixes: [...SKELETON_INVENTORY.utilityPrefixes]
	};
	const svelteComponentsDir = join(ROOT, 'node_modules', '@skeletonlabs', 'skeleton-svelte', 'dist', 'components');
	if (existsSync(svelteComponentsDir)) {
		const derived = new Set();
		for (const entry of readdirSync(svelteComponentsDir, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const indexPath = join(svelteComponentsDir, entry.name, 'index.js');
			if (!existsSync(indexPath)) continue;
			const source = readFileSync(indexPath, 'utf-8');
			for (const match of source.matchAll(/export \{ ([A-Za-z0-9]+) \} from '\.\/modules\/anatomy\.js'/g)) {
				derived.add(match[1]);
			}
		}
		if (derived.size) inventory.primitives = [...derived].sort();
	}
	const utilitiesDir = join(ROOT, 'node_modules', '@skeletonlabs', 'skeleton', 'src', 'utilities');
	if (existsSync(utilitiesDir)) {
		const utilities = new Set();
		const utilityPrefixes = new Set();
		for (const file of walk(utilitiesDir, ['.css'])) {
			const source = readFileSync(file, 'utf-8');
			for (const match of source.matchAll(/@utility\s+([a-zA-Z0-9-]+)/g)) {
				if (match[1].endsWith('-')) utilityPrefixes.add(match[1]);
				else utilities.add(match[1]);
			}
		}
		if (utilities.size) inventory.utilities = [...utilities].sort();
		if (utilityPrefixes.size) inventory.utilityPrefixes = [...utilityPrefixes].sort();
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
// Only exact approved catalog paths are exempt. A new local component under
// components/svforge/ (e.g. ui/Marquee.svelte) is still rejected when its name
// matches a primitive of the installed Skeleton inventory (#361).
const catalogPath = join(ROOT, 'svforge-catalog.json');
// The project catalog is NESTED (designSystem.primitives/ui/layout) — collect
// component entries recursively, not just the first level.
const catalogPaths = new Set();
const catalogWrappers = [];
const collectCatalogEntries = (node) => {
	if (!node || typeof node !== 'object' || Array.isArray(node)) return;
	for (const [key, value] of Object.entries(node)) {
		if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
		if (typeof value.path === 'string') {
			catalogPaths.add(value.path);
			catalogWrappers.push(key); // the entry name IS the component name
		}
		collectCatalogEntries(value);
	}
};
if (existsSync(catalogPath)) {
	try {
		collectCatalogEntries(JSON.parse(readFileSync(catalogPath, 'utf-8')));
	} catch {
		// unreadable catalog: nothing is exempt except installed addon paths
	}
}
// .svforge.json modules gate the addon-path exemptions (#361): the exact
// path must belong to an INSTALLED addon.
const manifestPath = join(ROOT, '.svforge.json');
const installedModules = [];
if (existsSync(manifestPath)) {
	try {
		const modules = JSON.parse(readFileSync(manifestPath, 'utf-8')).modules;
		if (Array.isArray(modules)) installedModules.push(...modules);
	} catch {
		// unreadable manifest: addon paths are not exempt
	}
}
for (const file of walk(join(ROOT, 'src'), ['.svelte'])) {
	const base = basename(file, '.svelte');
	if (!INVENTORY.primitives.includes(base)) continue;
	// POSIX-normalized: catalog/generated paths always use forward slashes.
	const relFromComponents = relative(componentsDir, file).split(sep).join('/');
	if (catalogPaths.has(relFromComponents)) continue; // approved catalog component
	// The addon id is the mapping KEY — it may differ from the path's first
	// segment (notifications → ui/NotificationsBell.svelte, ui_toast → ui/Toaster.svelte).
	const owningAddon = installedModules.find(
		(moduleId) => (ADDON_COMPONENTS[moduleId] ?? []).includes(relFromComponents)
	);
	if (owningAddon !== undefined) continue; // exact component of an installed addon
	results.push({ status: 'error', msg: `Duplicated Skeleton primitive "${base}" at ${relative(ROOT, file)}. Use it from @skeletonlabs/skeleton-svelte or the svforge catalog instead.` });
}

// ── 3. Skeleton markup composition (#335, ERROR) ─────────────────
const projectUtilities = [];
for (const file of walk(join(ROOT, 'src'), ['.css'])) {
	const source = readFileSync(file, 'utf-8');
	for (const match of source.matchAll(/@utility\s+([a-zA-Z0-9-]+)/g)) projectUtilities.push(match[1]);
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

// ── 4b. Catalog avoid patterns (WARN) (#342) ─────────────────────
// Conservative markup heuristics derived from the catalog avoid lists.
// Canonical implementations under components/svforge/ are excluded.
{
	const detectAvoid = (source) => {
		const findings = [];
		for (const pattern of AVOID_PATTERNS) {
			const elementRegex = // Case-sensitive: native HTML elements are lowercase — a PascalCase Svelte
			// component (<Table …>) must not match the raw-element heuristic.
			new RegExp(`<${pattern.element}(\\s[^>]*)?>`, 'g');
			for (const match of source.matchAll(elementRegex)) {
				const classMatch = (match[1] ?? '').match(/class=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/);
				const tokens = (classMatch?.[1] ?? classMatch?.[2] ?? classMatch?.[3] ?? '').trim().split(/\s+/).filter(Boolean);
				if (pattern.legitTokens.some((prefix) => tokens.some((token) => token.startsWith(prefix)))) continue;
				const has = (prefix) => tokens.some((token) => token.startsWith(prefix));
				const styled = pattern.styleTokens.length === 0 || (pattern.match === 'all' ? pattern.styleTokens.every(has) : pattern.styleTokens.some(has));
				if (styled) findings.push({ component: pattern.component, reason: pattern.reason });
			}
		}
		return findings;
	};
	for (const file of walk(join(ROOT, 'src'), ['.svelte'])) {
		// Exact-path exemption only (#342 review, mirroring #361): the canonical
		// implementation at its exact catalog path (plus precise installed-addon
		// component paths) is exempt — an unapproved new component in the same
		// directory still warns.
		const relFromComponents = relative(componentsDir, file).split(sep).join('/');
		const isCanonicalImplementation =
			catalogPaths.has(relFromComponents) ||
			installedModules.some((moduleId) => (ADDON_COMPONENTS[moduleId] ?? []).includes(relFromComponents));
		if (isCanonicalImplementation) continue;
		const findings = detectAvoid(readFileSync(file, 'utf-8'));
		for (const { component, reason } of findings) {
			results.push({ status: 'warn', msg: `${relative(ROOT, file)}: ${reason} — consider ${component}` });
		}
	}
}

// ── 4c. Arbitrary radius/spacing (WARN) (#345) ───────────────────
// Conservative: only radius and spacing namespaces. Structural or
// product-specific arbitrary values (w-[…], h-[…], text-[…], offsets) and
// colors (hex scan above) stay allowed. Scanned syntax: static double-quoted
// class="…" attributes only — dynamic class={…} and single-quoted attributes
// are intentionally NOT scanned. Canonical implementations are exempt per
// exact path only (#361 model), same as the avoid patterns above.
{
	const ARBITRARY_SPACING_NAMESPACES = [
		'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'ps', 'pe',
		'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'ms', 'me',
		'gap', 'gap-x', 'gap-y', 'space-x', 'space-y'
	];
	const DIRECTIONAL_RADIUS = /^rounded-(?:t|r|b|l|tl|tr|bl|br)$/;
	const checkArbitraryTokens = (classString) => {
		const offenders = [];
		for (const token of classString.split(/\s+/).filter(Boolean)) {
			const segment = token.includes(':') ? token.slice(token.lastIndexOf(':') + 1) : token;
			// Negative margins: -m-[3px] — the leading dash is not part of the ns.
			const body = segment.startsWith('-') ? segment.slice(1) : segment;
			const bracket = body.indexOf('-[');
			if (bracket === -1) continue;
			const ns = body.slice(0, bracket);
			const isRadius = ns === 'rounded' || DIRECTIONAL_RADIUS.test(ns);
			const isSpacing = ARBITRARY_SPACING_NAMESPACES.includes(ns);
			if (isRadius || isSpacing) offenders.push(token);
		}
		return offenders;
	};
	for (const file of walk(join(ROOT, 'src'), ['.svelte'])) {
		const relFromComponents = relative(componentsDir, file).split(sep).join('/');
		const isCanonicalImplementation =
			catalogPaths.has(relFromComponents) ||
			installedModules.some((moduleId) => (ADDON_COMPONENTS[moduleId] ?? []).includes(relFromComponents));
		if (isCanonicalImplementation) continue;
		const source = readFileSync(file, 'utf-8');
		const offenders = new Set();
		for (const match of source.matchAll(/class="([^"]*)"/g)) {
			for (const token of checkArbitraryTokens(match[1])) offenders.add(token);
		}
		if (offenders.size > 0) {
			results.push({ status: 'warn', msg: `Arbitrary radius/spacing in ${relative(ROOT, file)}: ${[...offenders].join(', ')}. Use the Tailwind scale or theme tokens instead.` });
		}
	}
}

// ── 5. Components outside the canonical structure (WARN) ─────────
const allowedDirs = new Set(['primitives', 'ui', 'layout', 'dnd', 'graph', 'tiptap', 'uploads']);
for (const file of walk(componentsDir, ['.svelte'])) {
	const rel = relative(componentsDir, file);
	const top = rel.split(sep)[0];
	if (!allowedDirs.has(top)) {
		results.push({ status: 'warn', msg: `Component ${rel} lives outside the canonical structure. Move it.` });
	}
}

// ── Stale instruction bridges (WARN) (#347) ──────────────────────
// The Copilot/Cursor instruction files are materialized copies of AGENTS.md.
// When AGENTS.md is edited later they go stale; svforge context re-syncs them.
{
	const canonicalPath = join(ROOT, 'AGENTS.md');
	if (existsSync(canonicalPath)) {
		const canonical = readFileSync(canonicalPath, 'utf-8');
		for (const bridge of ['.github/copilot-instructions.md', '.cursor/rules/svforge.mdc']) {
			const bridgePath = join(ROOT, bridge);
			if (!existsSync(bridgePath)) continue;
			// EXACT comparison (#347 review): a copy that still contains the
			// canonical content but drifted elsewhere is stale all the same.
			const current = readFileSync(bridgePath, 'utf-8');
			const prefixMatch = bridge.endsWith('.mdc')
				? current.match(/^-{3}\n[\s\S]*?\n-{3}\n\n/)
				: current.match(/^<!--[\s\S]*?-->\n\n/);
			const expected = prefixMatch ? prefixMatch[0] + canonical + (bridge.endsWith('.mdc') ? '\n' : '') : undefined;
			if (expected === undefined || current !== expected) {
				results.push({ status: 'warn', msg: `${bridge} is stale: it does not match the current AGENTS.md exactly. Run \`npx svforge context\` to re-sync.` });
			}
		}
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
