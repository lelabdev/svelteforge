import { readDirRecursively } from '../../../scripts/prebuild-utils';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const baseFiles = readDirRecursively(join(__dirname, '../templates/base/src'));
const dashboardOverlay = readDirRecursively(join(__dirname, '../templates/dashboard/src'));
// Dashboard = base + overlay (dashboard files override base if same path)
const dashboardFiles = dashboardOverlay;

const output = `// AUTO-GENERATED - DO NOT EDIT
// Run bun run prebuild to regenerate

export const baseFiles = ${JSON.stringify(baseFiles, null, 2)};

export const dashboardFiles = ${JSON.stringify(dashboardFiles, null, 2)};
`;

writeFileSync(join(__dirname, '../src/templates.ts'), output);

console.log('✅ Generated src/templates.ts');
console.log(`   ${Object.keys(baseFiles).length} base files`);
console.log(`   ${Object.keys(dashboardFiles).length} dashboard files`);
