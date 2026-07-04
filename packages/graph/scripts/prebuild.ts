import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readDirRecursively(dir: string, baseDir: string = dir): Record<string, string> {
const files: Record<string, string> = {};
for (const entry of readdirSync(dir)) {
const fullPath = join(dir, entry);
if (statSync(fullPath).isDirectory()) {
Object.assign(files, readDirRecursively(fullPath, baseDir));
} else {
files[fullPath.slice(baseDir.length)] = readFileSync(fullPath, 'utf-8');
}
}
return files;
}

const files = readDirRecursively(join(__dirname, '../templates/src'));
writeFileSync(join(__dirname, '../src/templates.ts'), `// AUTO-GENERATED\nexport const files = ${JSON.stringify(files, null, 2)};\n`);
console.log(`\u2705 ${Object.keys(files).length} files`);
