// Test script: simulates landing mode by running the addon logic and writing files
import { fullstackFiles, landingFiles } from '../src/templates.ts';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

// Replicate the landing mode filter logic
const UI_SKIP = ['AuthCard', 'DataTable', 'NavigationLoader', 'NotificationBadge', 'SearchInput', '.test.ts'];
const LAYOUT_SKIP = ['auth-buttons', 'AdminSidebar'];
const shouldSkipUi = (n: string) => UI_SKIP.some(s => n.startsWith(s) || n.endsWith(s));
const shouldSkipLayout = (n: string) => LAYOUT_SKIP.some(s => n.startsWith(s));

const OUT = process.argv[2] || '/tmp/sf-landing-test';

let fileCount = 0;

function writeFile(relPath: string, content: string) {
	const fullPath = join(OUT, 'src', relPath);
	const dir = dirname(fullPath);
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	writeFileSync(fullPath, content);
	fileCount++;
}

// Filter fullstack files
for (const [path, content] of Object.entries(fullstackFiles)) {
	if (path.startsWith('/lib/components/ui/')) {
		const name = path.split('/').pop() || '';
		if (shouldSkipUi(name)) continue;
		// Skip barrel files — we'll regenerate
		if (path === '/lib/components/ui/index.ts' || path === '/lib/components/ui/form/index.ts') continue;
		writeFile(path, content);
		continue;
	}
	if (path.startsWith('/lib/components/layout/')) {
		const name = path.split('/').pop() || '';
		if (shouldSkipLayout(name)) continue;
		if (path === '/lib/components/layout/index.ts') continue;
		writeFile(path, content);
		continue;
	}
	if (path === '/lib/components/index.ts') continue;

	if (path.startsWith('/lib/components/icons/')) { writeFile(path, content); continue; }
	if (path.startsWith('/lib/styles/')) { writeFile(path, content); continue; }
	if (path.startsWith('/lib/utils/')) {
		const name = path.split('/').pop() || '';
		if (name.endsWith('.test.ts')) continue;
		if (['export.ts', 'slugify.ts', 'form-errors.ts'].includes(name)) continue;
		writeFile(path, content); continue;
	}
	if (['/lib/errors.ts', '/lib/logger.ts', '/lib/types.ts', '/lib/index.ts'].includes(path)) {
		writeFile(path, content); continue;
	}
	if (path.startsWith('/lib/schemas/')) { writeFile(path, content); continue; }
	if (['/app.css', '/app.html'].includes(path)) { writeFile(path, content); continue; }
	if (path.startsWith('/routes/(legal)/')) { writeFile(path, content); continue; }
	if (path === '/routes/+error.svelte') { writeFile(path, content); continue; }
}

// Write landing overrides
for (const [path, content] of Object.entries(landingFiles)) {
	writeFile(path, content.replace(/__PROJECT_NAME__/g, 'TestApp'));
}

console.log(`✅ Wrote ${fileCount} files to ${OUT}/src/`);
console.log('Now run: bun run build in', OUT);
