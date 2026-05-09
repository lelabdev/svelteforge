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

const landingFiles = readDirRecursively(join(__dirname, '../templates/landing/src'));
const fullstackFiles = readDirRecursively(join(__dirname, '../templates/fullstack/src'));

const landingPackageJson = JSON.parse(readFileSync(join(__dirname, '../templates/landing/package.json'), 'utf-8'));
const fullstackPackageJson = JSON.parse(readFileSync(join(__dirname, '../templates/fullstack/package.json'), 'utf-8'));

const landingViteConfig = readFileSync(join(__dirname, '../templates/landing/vite.config.ts'), 'utf-8');
const fullstackViteConfig = readFileSync(join(__dirname, '../templates/fullstack/vite.config.ts'), 'utf-8');

// Write to a TypeScript file that exports everything
const output = `// AUTO-GENERATED - DO NOT EDIT
// Run \`bun run prebuild\` to regenerate

export const landingFiles = ${JSON.stringify(landingFiles, null, 2)};

export const fullstackFiles = ${JSON.stringify(fullstackFiles, null, 2)};

export const landingPackageJson = ${JSON.stringify(landingPackageJson, null, 2)};

export const fullstackPackageJson = ${JSON.stringify(fullstackPackageJson, null, 2)};

export const landingViteConfig = ${JSON.stringify(landingViteConfig, null, 2)};

export const fullstackViteConfig = ${JSON.stringify(fullstackViteConfig, null, 2)};
`;

writeFileSync(join(__dirname, '../src/templates.ts'), output);

console.log('✅ Generated src/templates.ts');
console.log(`   ${Object.keys(landingFiles).length} landing files`);
console.log(`   ${Object.keys(fullstackFiles).length} fullstack files`);
