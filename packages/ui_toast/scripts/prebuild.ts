import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readDirRecursively(dir: string, baseDir: string = dir): Record<string, string> {
	const files: Record<string, string> = {};
	const entries = readdirSync(dir);

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			Object.assign(files, readDirRecursively(fullPath, baseDir));
		} else if (stat.isFile()) {
			const content = readFileSync(fullPath, 'utf-8');
			const relativePath = fullPath.slice(baseDir.length);
			files[relativePath] = content;
		}
	}

	return files;
}

const files = readDirRecursively(join(__dirname, '../templates/src'));

const output = `// AUTO-GENERATED - DO NOT EDIT
export const files = ${JSON.stringify(files, null, 2)};
`;

writeFileSync(join(__dirname, '../src/templates.ts'), output);

console.log('✅ Generated src/templates.ts');
console.log(`   ${Object.keys(files).length} files`);
