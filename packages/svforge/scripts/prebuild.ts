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

const baseFiles = readDirRecursively(join(__dirname, '../templates/base/src'));
const dashboardOverlay = readDirRecursively(join(__dirname, '../templates/dashboard/src'));
// Dashboard = base + overlay (dashboard files override base if same path)
const dashboardFiles = dashboardOverlay;

const output = `// AUTO-GENERATED - DO NOT EDIT
// Run \`bun run prebuild\` to regenerate

export const baseFiles = ${JSON.stringify(baseFiles, null, 2)};

export const dashboardFiles = ${JSON.stringify(dashboardFiles, null, 2)};

writeFileSync(join(__dirname, '../src/templates.ts'), output);

console.log('✅ Generated src/templates.ts');
console.log(`   ${Object.keys(baseFiles).length} base files`);
console.log(`   ${Object.keys(dashboardFiles).length} dashboard files`);
