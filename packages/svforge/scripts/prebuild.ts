import { readDirRecursively } from '../../../scripts/prebuild-utils';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const baseFiles = readDirRecursively(join(__dirname, '../templates/base/src'));
const dashboardOverlay = readDirRecursively(join(__dirname, '../templates/dashboard/src'));
// Dashboard = base + overlay (dashboard files override base if same path)
const dashboardFiles = dashboardOverlay;
// Root-level files (drizzle.config.ts, .env.example, scripts/setup.sh, static/robots.txt)
// are embedded here and written at the PROJECT ROOT by the dashboard mode (#187).
const dashboardRootFiles = readDirRecursively(join(__dirname, '../templates/dashboard/root'));

const output = `// AUTO-GENERATED - DO NOT EDIT
// Run bun run prebuild to regenerate

export const baseFiles = ${JSON.stringify(baseFiles, null, 2)};

export const dashboardFiles = ${JSON.stringify(dashboardFiles, null, 2)};

export const dashboardRootFiles = ${JSON.stringify(dashboardRootFiles, null, 2)};
`;

writeFileSync(join(__dirname, '../src/templates.ts'), output);

console.log('✅ Generated src/templates.ts');
console.log(`   ${Object.keys(baseFiles).length} base files`);
console.log(`   ${Object.keys(dashboardFiles).length} dashboard files`);
console.log(`   ${Object.keys(dashboardRootFiles).length} dashboard root files`);
