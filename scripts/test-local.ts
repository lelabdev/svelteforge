/**
 * Test script: simulates sv add by running the addon logic and writing files to a directory.
 * Usage: bun scripts/test-local.ts [mode] [output-dir]
 *   mode: base (default) or fullstack
 *   output-dir: target directory (default: /tmp/sf-test)
 */
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';

const mode = process.argv[2] || 'base';
const output = process.argv[3] || '/tmp/sf-test';
const templatesDir = join(import.meta.dirname, '..', 'templates', mode);

console.log(`🧪 SvelteForge test — mode: ${mode}, output: ${output}`);

// Clean output
if (existsSync(output)) rmSync(output, { recursive: true });
mkdirSync(output, { recursive: true });

// Read templates directory recursively
function copyDir(src: string, dest: string) {
	const items = execSync(`find "${src}" -type f`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
	let count = 0;
	for (const item of items) {
		const relative = item.slice(src.length + 1);
		const target = join(dest, relative);
		mkdirSync(dirname(target), { recursive: true });

		// Read file content
		const content = execSync(`cat "${item}"`, { encoding: 'utf-8' });
		writeFileSync(target, content);
		count++;
	}
	return count;
}

const count = copyDir(templatesDir, output);

console.log(`\n✅ ${count} files written to ${output}`);
console.log(`\nNext steps:`);
console.log(`  cd ${output}`);
console.log(`  bun install`);
console.log(`  bun dev`);
