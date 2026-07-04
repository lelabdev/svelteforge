import { readDirRecursively } from '../../../scripts/prebuild-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const baseFiles = readDirRecursively(join(__dirname, '../templates/base/src'));
const dashboardOverlay = readDirRecursively(join(__dirname, '../templates/dashboard/src'));
const dashboardFiles = dashboardOverlay;

const output = ;

writeFileSync(join(__dirname, '../src/templates.ts'), output);

console.log('\u2705 Generated src/templates.ts');
console.log();
console.log();
