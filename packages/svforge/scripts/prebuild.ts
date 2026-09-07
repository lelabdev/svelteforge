import { readDirRecursively } from '../../../scripts/prebuild-utils';
import { AVOID_PATTERNS } from '../src/design-system';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseChangelog, readChangelog } from '../../../scripts/changelog.mjs';
import { buildAddonComponents, buildSkeletonInventory } from './generate-skeleton-inventory';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Canonical recipe version (#283): derived from the package.json of the
// addon itself, so the version announced by `svforge upgrade` cannot drift
// from the actually shipped package.
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const baseFiles = readDirRecursively(join(__dirname, '../templates/base/src'));
const dashboardOverlay = readDirRecursively(join(__dirname, '../templates/dashboard/src'));
// Dashboard = base + overlay (dashboard files override base if same path)
const dashboardFiles = dashboardOverlay;
// Skeleton inventory (#335): generated from the installed @skeletonlabs
// packages. The scaffolded checker (svforge-check.mjs) receives it injected
// so its Skeleton knowledge can never drift from the shipped version.
const skeletonInventory = buildSkeletonInventory(join(__dirname, '../../..'));

// Approved addon component paths (#335): the EXACT .svelte paths the addons
// deliver under src/lib/components/svforge/. Exemption is per precise path —
// never per addon directory — so a new local component matching a Skeleton
// primitive is still rejected. Generated with SORTED enumeration (#361):
// unsorted readdir made both artifacts drift on CI clean checkouts.
const addonComponents = buildAddonComponents(join(__dirname, '../../..'));
const baseRootFilesRaw = readDirRecursively(join(__dirname, '../templates/base/root'));
const skeletonCheckerPath = '/svforge-check.mjs';
if (!baseRootFilesRaw[skeletonCheckerPath]) {
	throw new Error('svforge-check.mjs missing from base root template — inventory cannot be injected.');
}
if (!baseRootFilesRaw[skeletonCheckerPath].includes('/*__SKELETON_INVENTORY__*/')) {
	throw new Error('svforge-check.mjs is missing the /*__SKELETON_INVENTORY__*/ placeholder.');
}
baseRootFilesRaw[skeletonCheckerPath] = baseRootFilesRaw[skeletonCheckerPath].replace(
	/\/\*__SKELETON_INVENTORY__\*\/.*/,
	`/*__SKELETON_INVENTORY__*/ ${JSON.stringify(skeletonInventory)}`
);
baseRootFilesRaw[skeletonCheckerPath] = baseRootFilesRaw[skeletonCheckerPath]
	.replace(
		/\/\*__ADDON_COMPONENTS__\*\/.*/,
		`/*__ADDON_COMPONENTS__*/ ${JSON.stringify(addonComponents)}`
	)
	.replace(
		/\/\*__AVOID_PATTERNS__\*\/.*/,
		`/*__AVOID_PATTERNS__*/ ${JSON.stringify(AVOID_PATTERNS)}`
	);
const baseRootFiles = baseRootFilesRaw;
// Root-level files (drizzle.config.ts, .env.example, scripts/setup.sh, static/robots.txt)
// are embedded here and written at the PROJECT ROOT by the dashboard mode (#187).
const dashboardRootFiles = readDirRecursively(join(__dirname, '../templates/dashboard/root'));
// Base root-level files (Paraglide: messages/, project.inlang/) written at the
// PROJECT ROOT by the base mode (#239) — same delivery model as dashboard root.
// (baseRootFiles with the injected inventory is built above.)
void baseRootFiles;

const output = `// AUTO-GENERATED - DO NOT EDIT
// Run bun run prebuild to regenerate

export const baseFiles = ${JSON.stringify(baseFiles, null, 2)};

export const dashboardFiles = ${JSON.stringify(dashboardFiles, null, 2)};

export const dashboardRootFiles = ${JSON.stringify(dashboardRootFiles, null, 2)};

export const baseRootFiles = ${JSON.stringify(baseRootFiles, null, 2)};
`;

writeFileSync(join(__dirname, '../src/templates.ts'), output);

// Generated Skeleton inventory (#335) — single canonical source for primitive
// protection and markup checks. Committed; the freshness gate (#329) fails if
// it no longer matches the installed @skeletonlabs packages.
writeFileSync(
	join(__dirname, '../src/skeleton-inventory.ts'),
	`// AUTO-GENERATED - DO NOT EDIT\n// Generated from installed @skeletonlabs packages (css ${skeletonInventory.versions.css}, svelte ${skeletonInventory.versions.svelte}).\n// Run bun run prebuild to regenerate.\n\nexport const SKELETON_VERSIONS = ${JSON.stringify(skeletonInventory.versions)};\n\nexport const SKELETON_PRIMITIVES: string[] = ${JSON.stringify(skeletonInventory.primitives)};\n\nexport const SKELETON_UTILITIES: string[] = ${JSON.stringify(skeletonInventory.utilities)};\n\nexport const SKELETON_UTILITY_PREFIXES: string[] = ${JSON.stringify(skeletonInventory.utilityPrefixes)};\n`
);

// Generated version module — single canonical source for the recipe version.
writeFileSync(
	join(__dirname, '../src/recipe-version.ts'),
	`// AUTO-GENERATED - DO NOT EDIT\n// Run bun run prebuild to regenerate (canonical version = package.json)\n\nexport const SDFORGE_RECIPE_VERSION = ${JSON.stringify(pkg.version)};\n`
);

writeFileSync(
	join(__dirname, '../src/addon-components.ts'),
	`// AUTO-GENERATED - DO NOT EDIT\n// Exact component paths each SVForge addon delivers under src/lib/components/svforge/,\n// keyed by addon id. An addon's paths are only exemptions while that addon is\n// installed (.svforge.json modules). Run bun run prebuild to regenerate.\n\nexport const ADDON_COMPONENTS: Record<string, string[]> = ${JSON.stringify(addonComponents)};\n`
);

const changelogEntries = parseChangelog(readChangelog(join(__dirname, '../../..')));
writeFileSync(
	join(__dirname, '../src/changelog.ts'),
	`// AUTO-GENERATED - DO NOT EDIT\n// Run bun run prebuild to regenerate from CHANGELOG.md\n\nexport interface ChangelogEntry {\n\tpackage: string;\n\tversion: string;\n\tdate: string;\n\tbody: string;\n}\n\nexport const RELEASE_NOTES: ChangelogEntry[] = ${JSON.stringify(changelogEntries, null, 2)};

function compareVersions(left: string, right: string): number {
\tconst parse = (version: string) => version.split(/[.-]/).map((part) => (/^\\d+$/.test(part) ? Number(part) : part));
\tconst a = parse(left);
\tconst b = parse(right);
\tfor (let index = 0; index < 3; index++) {
\t\tif (a[index] !== b[index]) return (a[index] as number) - (b[index] as number);
\t}
\treturn 0;
}

export function entriesBetween(entries: ChangelogEntry[], packageName: string, fromVersion: string | null, toVersion: string): ChangelogEntry[] {
\treturn entries
\t\t.filter((entry) => entry.package === packageName)
\t\t.filter((entry) => (!fromVersion || compareVersions(entry.version, fromVersion) > 0) && compareVersions(entry.version, toVersion) <= 0)
\t\t.sort((left, right) => compareVersions(left.version, right.version));
}
`
);

console.log('✅ Generated src/templates.ts + src/recipe-version.ts + src/changelog.ts + src/skeleton-inventory.ts');
console.log(`   approved addon components: ${Object.keys(addonComponents).length} addons`);
console.log(`   ${Object.keys(baseFiles).length} base files`);
console.log(`   ${Object.keys(dashboardFiles).length} dashboard files`);
console.log(`   ${Object.keys(dashboardRootFiles).length} dashboard root files`);
console.log(`   ${Object.keys(baseRootFiles).length} base root files`);
console.log(`   skeleton inventory: ${skeletonInventory.primitives.length} primitives, ${skeletonInventory.utilities.length} utilities (${skeletonInventory.versions.css})`);
