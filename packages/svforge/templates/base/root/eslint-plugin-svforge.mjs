/**
 * Standalone ESLint plugin delivered by the SvelteForge base template (#346).
 *
 * Copy-not-import (shadcn model, like svforge-check.mjs): the scaffolded
 * project must not depend on an unpublished npm package. The canonical
 * design-system authority remains `svforge-check.mjs` / `bun run check` —
 * this plugin surfaces the same deterministic violations as editor/lint DX.
 *
 * Self-contained on purpose: primitives are derived from the project's own
 * installed @skeletonlabs/skeleton-svelte and catalog exemptions are read
 * from svforge-catalog.json at lint time, mirroring the checker's runtime
 * derivation.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const FORBIDDEN_UI_KITS = [
	'@shadcn/svelte',
	'shadcn-svelte',
	'bits-ui',
	'@melt-ui/svelte',
	'flowbite-svelte',
	'svelteui',
	'@svelteuidev/core'
];

const DESIGN_RULE_IDS = {
	forbiddenUiKit: 'forbiddenUiKit',
	duplicatedSkeletonPrimitive: 'duplicatedSkeletonPrimitive'
};

const DESIGN_MESSAGES = {
	forbiddenUiKit: (kit) =>
		`Second UI kit detected: ${kit}. SvelteForge uses Skeleton as the single UI source. Remove it.`,
	duplicatedSkeletonPrimitive: (name, file) =>
		`Duplicated Skeleton primitive "${name}" at ${file}. Use ${name} from @skeletonlabs/skeleton-svelte or the svforge catalog instead.`
};

function isForbiddenUiKit(packageName) {
	return FORBIDDEN_UI_KITS.some((kit) => packageName === kit || packageName.startsWith(`${kit}/`));
}

// Derive the installed Skeleton primitive names the same way svforge-check.mjs
// does when the shipped inventory is unavailable: scan
// @skeletonlabs/skeleton-svelte dist components for anatomy re-exports.
const primitivesCache = new Map();
function deriveSkeletonPrimitives(projectRoot) {
	if (primitivesCache.has(projectRoot)) return primitivesCache.get(projectRoot);
	const primitives = new Set();
	const componentsDir = path.join(projectRoot, 'node_modules', '@skeletonlabs', 'skeleton-svelte', 'dist', 'components');
	if (existsSync(componentsDir)) {
		for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const indexPath = path.join(componentsDir, entry.name, 'index.js');
			if (!existsSync(indexPath)) continue;
			const source = readFileSync(indexPath, 'utf-8');
			for (const match of source.matchAll(/export \{ ([A-Za-z0-9]+) \} from '\.\/modules\/anatomy\.js'/g)) {
				primitives.add(match[1]);
			}
		}
	}
	primitivesCache.set(projectRoot, primitives);
	return primitives;
}

// Exact approved catalog component paths, read from the shipped manifest.
const catalogCache = new Map();
function catalogExemptPaths(projectRoot) {
	if (catalogCache.has(projectRoot)) return catalogCache.get(projectRoot);
	const paths = new Set();
	const catalogPath = path.join(projectRoot, 'svforge-catalog.json');
	if (existsSync(catalogPath)) {
		try {
			const collect = (node) => {
				if (!node || typeof node !== 'object' || Array.isArray(node)) return;
				for (const value of Object.values(node)) {
					if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
					if (typeof value.path === 'string') paths.add(value.path);
					collect(value);
				}
			};
			collect(JSON.parse(readFileSync(catalogPath, 'utf-8')));
		} catch {
			// unreadable catalog: nothing is exempt
		}
	}
	catalogCache.set(projectRoot, paths);
	return paths;
}

function duplicatedSkeletonPrimitiveName(filename, projectRoot) {
	const name = path.basename(filename, '.svelte');
	const primitives = deriveSkeletonPrimitives(projectRoot);
	if (!primitives.has(name)) return null;
	const componentsDir = path.join(projectRoot, 'src', 'lib', 'components', 'svforge');
	const rel = path.relative(componentsDir, filename).split(path.sep).join('/');
	return catalogExemptPaths(projectRoot).has(rel) ? null : name;
}

const rule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'report deterministic SvelteForge design-system violations'
		},
		messages: {
			[DESIGN_RULE_IDS.forbiddenUiKit]: DESIGN_MESSAGES.forbiddenUiKit('{{kit}}'),
			[DESIGN_RULE_IDS.duplicatedSkeletonPrimitive]: DESIGN_MESSAGES.duplicatedSkeletonPrimitive('{{name}}', '{{file}}')
		},
		schema: []
	},
	create(context) {
		return {
			ImportDeclaration(node) {
				if (typeof node.source.value !== 'string' || !isForbiddenUiKit(node.source.value)) return;
				context.report({
					node,
					messageId: DESIGN_RULE_IDS.forbiddenUiKit,
					data: { kit: node.source.value }
				});
			},
			Program(node) {
				const filename = context.filename;
				if (!filename.endsWith('.svelte')) return;
				const primitive = duplicatedSkeletonPrimitiveName(filename, context.cwd);
				if (!primitive) return;
				context.report({
					node,
					messageId: DESIGN_RULE_IDS.duplicatedSkeletonPrimitive,
					data: { name: primitive, file: path.relative(context.cwd, filename) }
				});
			}
		};
	}
};

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
	meta: { name: 'eslint-plugin-svforge' },
	rules: { 'no-design-violations': rule }
};

export default plugin;
