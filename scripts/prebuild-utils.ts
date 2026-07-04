import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function readDirRecursively(dir: string, baseDir: string = dir): Record<string, string> {
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

export function generateTemplatesFile(
templateDir: string,
outputFile: string,
exportName: string = 'files'
): void {
const files = readDirRecursively(templateDir);
const content = `// AUTO-GENERATED - DO NOT EDIT\nexport const ${exportName} = ${JSON.stringify(files, null, 2)};\n`;
writeFileSync(outputFile, content);
console.log(`\u2705 ${Object.keys(files).length} files \u2192 ${outputFile}`);
}

export function generateMultiTemplateFile(
pairs: { dir: string; exportName: string }[],
outputFile: string
): void {
let content = '// AUTO-GENERATED - DO NOT EDIT\n';
for (const { dir, exportName } of pairs) {
const files = readDirRecursively(dir);
content += `\nexport const ${exportName} = ${JSON.stringify(files, null, 2)};\n`;
console.log(`\u2705 ${Object.keys(files).length} files \u2192 ${exportName}`);
}
writeFileSync(outputFile, content);
console.log(`Written to ${outputFile}`);
}

export { __dirname };
