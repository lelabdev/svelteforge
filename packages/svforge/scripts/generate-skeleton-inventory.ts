/**
 * Generated Skeleton inventory (#335).
 *
 * Reads the actually installed @skeletonlabs packages (devDependencies of the
 * monorepo) and produces a deterministic artifact consumed by:
 *   - checkDesignSystem (markup rules, primitive protection)
 *   - the self-contained scaffolded checker (injected by the prebuild)
 *   - generated agent guidance
 *
 * Committed to src/skeleton-inventory.ts, so the freshness gate (#329) fails
 * whenever the inventory no longer matches the installed Skeleton version.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { readDirRecursively } from '../../../scripts/prebuild-utils';
import { join } from 'node:path';

export interface SkeletonInventory {
	/** Resolved versions of both packages, for traceability. */
	versions: { css: string; svelte: string };
	/** Exported components of @skeletonlabs/skeleton-svelte (PascalCase). */
	primitives: string[];
	/** Static @utility names of @skeletonlabs/skeleton (e.g. `btn`, `preset-filled-primary-500`). */
	utilities: string[];
	/** Functional @utility prefixes (trailing dash, e.g. `corner-shape-`). */
	utilityPrefixes: string[];
}

function kebabDirToExports(dir: string): string[] {
	const indexPath = join(dir, 'index.js');
	if (!existsSync(indexPath)) return [];
	const source = readFileSync(indexPath, 'utf-8');
	// Components are exported as `export { Accordion } from './modules/anatomy.js';`
	const matches = [...source.matchAll(/export \{ ([A-Za-z0-9]+) \} from '\.\/modules\/anatomy\.js'/g)].map(
		(match) => match[1]
	);
	return [...new Set(matches)];
}

export function buildSkeletonInventory(monorepoRoot: string): SkeletonInventory {
	const skeletonPkg = join(monorepoRoot, 'node_modules', '@skeletonlabs', 'skeleton');
	const sveltePkg = join(monorepoRoot, 'node_modules', '@skeletonlabs', 'skeleton-svelte');

	if (!existsSync(skeletonPkg) || !existsSync(sveltePkg)) {
		throw new Error(
			'Skeleton inventory requires @skeletonlabs/skeleton and @skeletonlabs/skeleton-svelte in node_modules. Run: bun install'
		);
	}

	const versions = {
		css: JSON.parse(readFileSync(join(skeletonPkg, 'package.json'), 'utf-8')).version as string,
		svelte: JSON.parse(readFileSync(join(sveltePkg, 'package.json'), 'utf-8')).version as string
	};

	const componentsDir = join(sveltePkg, 'dist', 'components');
	const primitives = readdirSync(componentsDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.flatMap((entry) => kebabDirToExports(join(componentsDir, entry.name)))
		.sort();

	const utilitiesDir = join(skeletonPkg, 'src', 'utilities');
	const utilities = new Set<string>();
	const utilityPrefixes = new Set<string>();
	for (const entry of readdirSync(utilitiesDir)) {
		if (!entry.endsWith('.css')) continue;
		const source = readFileSync(join(utilitiesDir, entry), 'utf-8');
		for (const match of source.matchAll(/@utility\s+([a-zA-Z0-9-]+)/g)) {
			const name = match[1];
			// Functional utilities end with a dash: they combine with suffixes.
			if (name.endsWith('-')) utilityPrefixes.add(name);
			else utilities.add(name);
		}
	}

	return {
		versions,
		primitives,
		utilities: [...utilities].sort(),
		utilityPrefixes: [...utilityPrefixes].sort()
	};
}


/**
 * Exact component paths each SVForge addon delivers under
 * src/lib/components/svforge/, keyed by addon id (#335).
 *
 * Enumeration is SORTED: property insertion order flows into the generated
 * artifact and the embedded checker, so unsorted readdir made both files
 * drift on CI clean checkouts (#361 review).
 */
export function buildAddonComponents(monorepoRoot: string): Record<string, string[]> {
	const packagesDir = join(monorepoRoot, 'packages');
	const addonComponents: Record<string, string[]> = {};
	const packageEntries = readdirSync(packagesDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && entry.name !== 'svforge')
		.sort((left, right) => left.name.localeCompare(right.name));
	for (const entry of packageEntries) {
		const templatesDir = join(packagesDir, entry.name, 'templates');
		if (!existsSync(templatesDir)) continue;
		const paths = new Set<string>();
		for (const [filePath] of Object.entries(
			readDirRecursively(templatesDir)
		)) {
			const marker = 'components/svforge/';
			const index = filePath.indexOf(marker);
			if (filePath.endsWith('.svelte') && index !== -1) {
				paths.add(filePath.slice(index + marker.length).split('\\').join('/'));
			}
		}
		if (paths.size) addonComponents[entry.name] = [...paths].sort();
	}
	return addonComponents;
}


