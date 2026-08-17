import { readDirRecursively } from '../../../scripts/prebuild-utils';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Canonical recipe version (#283): derived from the package.json of the
// addon itself, so the version announced by `svforge upgrade` cannot drift
// from the actually shipped package.
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const baseFiles = readDirRecursively(join(__dirname, '../templates/base/src'));
const dashboardOverlay = readDirRecursively(join(__dirname, '../templates/dashboard/src'));
// Dashboard = base + overlay (dashboard files override base if same path)
const dashboardFiles = dashboardOverlay;
// Root-level files (drizzle.config.ts, .env.example, scripts/setup.sh, static/robots.txt)
// are embedded here and written at the PROJECT ROOT by the dashboard mode (#187).
const dashboardRootFiles = readDirRecursively(join(__dirname, '../templates/dashboard/root'));
// Base root-level files (Paraglide: messages/, project.inlang/) written at the
// PROJECT ROOT by the base mode (#239) — same delivery model as dashboard root.
const baseRootFiles = readDirRecursively(join(__dirname, '../templates/base/root'));

const output = `// AUTO-GENERATED - DO NOT EDIT
// Run bun run prebuild to regenerate

export const baseFiles = ${JSON.stringify(baseFiles, null, 2)};

export const dashboardFiles = ${JSON.stringify(dashboardFiles, null, 2)};

export const dashboardRootFiles = ${JSON.stringify(dashboardRootFiles, null, 2)};

export const baseRootFiles = ${JSON.stringify(baseRootFiles, null, 2)};
`;

writeFileSync(join(__dirname, '../src/templates.ts'), output);

// Generated version module — single canonical source for the recipe version.
writeFileSync(
	join(__dirname, '../src/recipe-version.ts'),
	`// AUTO-GENERATED - DO NOT EDIT\n// Run bun run prebuild to regenerate (canonical version = package.json)\n\nexport const SDFORGE_RECIPE_VERSION = ${JSON.stringify(pkg.version)};\n`
);

console.log('✅ Generated src/templates.ts + src/recipe-version.ts');
console.log(`   ${Object.keys(baseFiles).length} base files`);
console.log(`   ${Object.keys(dashboardFiles).length} dashboard files`);
console.log(`   ${Object.keys(dashboardRootFiles).length} dashboard root files`);
console.log(`   ${Object.keys(baseRootFiles).length} base root files`);
