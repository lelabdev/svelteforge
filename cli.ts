#!/usr/bin/env bun
/**
 * create-svelteforge
 *
 * Creates a new SvelteKit project using `sv create` for the base,
 * then layers SvelteForge components, theme, and layout on top.
 *
 * Usage:
 *   pnpm dlx create-svelteforge my-project
 *   pnpm dlx create-svelteforge my-project --fullstack
 *   pnpm dlx create-svelteforge my-project --landing
 *
 * Modes:
 *   1. Full Stack     — UI + Forms + Auth + DB
 *   2. Landing Page   — UI + Forms (frontend only)
 *
 * Requirements: pnpm
 */

import { execSync } from 'child_process';
import {
	cpSync,
	writeFileSync,
	readFileSync,
	existsSync,
	rmSync
} from 'fs';
import { resolve, join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// TEMPLATE DIRS
// ============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const fullstackDir = resolve(__dirname, 'template-fullstack');
const landingDir = resolve(__dirname, 'template-landing');

// ============================================================================
// FILES TO COPY — per mode
// ============================================================================

// Shared: always copied from fullstack template (components, styles, utils)
const SHARED_FILES: string[] = [
	'src/lib/components/',
	'src/lib/styles/',
	'src/lib/utils/',
	'src/lib/errors.ts',
	'src/lib/logger.ts',
	'src/lib/types.ts',
	'src/lib/index.ts',
	'src/lib/schemas/profile.ts',
	'src/lib/schemas/index.ts',
	'src/app.css',
	'src/app.html'
];

// Full Stack only (auth/DB handled by sv create add-ons)
const FULLSTACK_FILES: string[] = [
	'src/app.d.ts'
];

// Routes: always copied from fullstack template
const ROUTE_FILES: string[] = [
	'src/routes/+error.svelte',
	'src/routes/+page.svelte',
	'src/routes/+page.server.ts',
	'src/routes/+layout.svelte',
	'src/routes/(legal)/'
];

// Landing-only overrides (from template-landing)
const LANDING_OVERRIDE_FILES: string[] = [
	'src/lib/components/layout/navbar.svelte',
	'src/routes/+layout.svelte',
	'src/routes/+page.svelte',
	'src/app.d.ts'
];

// sv files we replace with our own versions
const FILES_TO_REMOVE: string[] = [
	'src/routes/+page.svelte',
	'src/routes/+page.server.ts',
	'src/routes/+layout.svelte',
	'src/routes/+error.svelte',
	'src/app.css',
	'src/app.html',
	'src/app.d.ts'
];

// ============================================================================
// HELPERS
// ============================================================================

const bunBinDir = resolve(process.execPath, '..');
if (process.env.PATH && !process.env.PATH.includes(bunBinDir)) {
	process.env.PATH = `${bunBinDir}:${process.env.PATH}`;
}

function run(cmd: string, cwd?: string, silent = false): boolean {
	try {
		execSync(cmd, { cwd, stdio: silent ? 'pipe' : 'inherit', env: { ...process.env } });
		return true;
	} catch {
		return false;
	}
}

function log(msg: string) {
	console.log(msg);
}
function success(msg: string) {
	console.log(`\x1b[32m✅ ${msg}\x1b[0m`);
}
function warn(msg: string) {
	console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`);
}
function error(msg: string) {
	console.log(`\x1b[31m❌ ${msg}\x1b[0m`);
}

function question(prompt: string): Promise<string> {
	return new Promise((resolve) => {
		process.stdout.write(prompt);
		const chunks: Buffer[] = [];
		const onData = (chunk: Buffer) => {
			chunks.push(chunk);
			const input = Buffer.concat(chunks).toString().trim();
			if (input.includes('\n') || chunk.includes(0x0a)) {
				process.stdin.removeListener('data', onData);
				process.stdin.removeListener('end', onEnd);
				resolve(input.replace(/\n.*$/, ''));
			}
		};
		const onEnd = () => {
			process.stdin.removeListener('data', onData);
			resolve('');
		};
		process.stdin.on('data', onData);
		process.stdin.on('end', onEnd);
	});
}

function copyFiles(src: string, dest: string, files: string[]) {
	for (const rel of files) {
		const from = join(src, rel);
		const to = join(dest, rel);
		if (!existsSync(from)) {
			warn(`  Skip: ${rel}`);
			continue;
		}
		try {
			cpSync(from, to, { recursive: true });
		} catch (e) {
			warn(`  Failed: ${rel} — ${(e as Error).message}`);
		}
	}
}

function sv(cmd: string, cwd?: string): boolean {
	return run(`bunx sv ${cmd}`, cwd) || run(`npx sv ${cmd}`, cwd);
}

function replaceInFile(filePath: string, search: string, replace: string) {
	if (!existsSync(filePath)) return;
	const content = readFileSync(filePath, 'utf-8');
	writeFileSync(filePath, content.replace(search, replace));
}

// ============================================================================
// CLI ARGUMENTS
// ============================================================================

function showHelp() {
	log(`
Usage:
  pnpm dlx create-svelteforge <project-name> [options]

Options:
  --fullstack, -f  Full Stack mode (UI + Auth + DB via sv add-ons)
  --landing, -l    Landing Page mode (UI only)
  --help, -h       Show help

Examples:
  pnpm dlx create-svelteforge my-app -f       # Full Stack
  pnpm dlx create-svelteforge my-app --landing # Landing Page
  pnpm dlx create-svelteforge my-app          # interactive
`);
	process.exit(0);
}

function parseArgs(argv: string[]): {
	projectInput: string | null;
	fullStackFlag: boolean;
	landingFlag: boolean;
} {
	const args = argv.slice(2);

	if (args.includes('--help') || args.includes('-h')) {
		showHelp();
	}

	let projectInput: string | null = null;
	let fullStackFlag = false;
	let landingFlag = false;

	for (const arg of args) {
		switch (arg) {
			case '--full-stack':
			case '-f':
			case '--fullstack':
				fullStackFlag = true;
				break;
			case '--landing':
			case '-l':
				landingFlag = true;
				break;
			default:
				if (!arg.startsWith('-')) {
					projectInput = arg;
				}
				break;
		}
	}

	return { projectInput, fullStackFlag, landingFlag };
}

// ============================================================================
// CLEANUP ON FAILURE
// ============================================================================

let createdTargetDir: string | null = null;

function cleanup() {
	if (createdTargetDir && existsSync(createdTargetDir)) {
		warn(`Cleaning up: ${createdTargetDir}`);
		rmSync(createdTargetDir, { recursive: true, force: true });
	}
}

process.on('SIGINT', () => {
	cleanup();
	process.exit(130);
});

// ============================================================================
// MAIN
// ============================================================================

async function main() {
	const { projectInput, fullStackFlag, landingFlag } = parseArgs(process.argv);

	if (!projectInput) {
		error('Usage: pnpm dlx create-svelteforge <project-name> [options]');
		log('Use --help for more information.');
		process.exit(1);
	}

	const projectName = basename(resolve(projectInput));
	const targetDir = resolve(process.cwd(), projectInput);
	createdTargetDir = targetDir;

	log('\n🔨 SvelteForge Scaffold\n');

	// ── 1. Select mode ──
	let fullStack: boolean;

	if (fullStackFlag) {
		fullStack = true;
	} else if (landingFlag) {
		fullStack = false;
	} else {
		log('📦 Select mode:\n');
		log('  1. Full Stack     — UI + Forms + Auth + DB');
		log('  2. Landing Page   — UI + Forms (frontend only)\n');

		const mode = await question('  Choice [1-2]: ');
		fullStack = mode === '1' || mode === '';
	}

	const templateDir = fullStack ? fullstackDir : landingDir;

	log(`\n  → Mode: ${fullStack ? 'Full Stack' : 'Landing Page'}\n`);

	if (!existsSync(fullstackDir)) {
		error(`Full Stack template not found: ${fullstackDir}`);
		process.exit(1);
	}

	if (existsSync(targetDir)) {
		error(`"${projectInput}" already exists.`);
		process.exit(1);
	}

	try {
		// ── 2. sv create ──
		log('📦 Step 1: sv create (base project)...\n');

		let svAddons = `tailwindcss="plugins:typography,forms" prettier eslint vitest="usages:unit,component"`;

		if (fullStack) {
			svAddons += ` drizzle="database:sqlite+client:libsql" better-auth="demo:password"`;
		}

		const createOk = sv(
			`create --template minimal --types ts ` +
			`--add ${svAddons} ` +
			`--install bun ${projectName}`
		);

		if (!createOk) {
			error('sv create failed.');
			cleanup();
			process.exit(1);
		}
		success('Base project created');

		// ── 3. Clean sv defaults ──
		log('\n🧹 Step 2: Cleaning defaults...');
		for (const f of FILES_TO_REMOVE) {
			const p = join(targetDir, f);
			if (existsSync(p)) rmSync(p, { recursive: true, force: true });
		}
		success('Cleaned');

		// ── 4. Copy SvelteForge files ──
		log('\n📋 Step 3: Copying SvelteForge files...');

		// Shared components, styles, utils — always from fullstack template
		copyFiles(fullstackDir, targetDir, SHARED_FILES);

		if (fullStack) {
			// Full Stack: copy everything from fullstack template
			copyFiles(fullstackDir, targetDir, FULLSTACK_FILES);
			copyFiles(fullstackDir, targetDir, ROUTE_FILES);
		} else {
			// Landing: copy landing-specific overrides
			copyFiles(fullstackDir, targetDir, ROUTE_FILES);
			copyFiles(landingDir, targetDir, LANDING_OVERRIDE_FILES);
		}

		success('Files copied');

		// ── 5. Merge deps + copy vite.config.ts ──
		log('\n📦 Step 4: Installing SvelteForge dependencies...');

		// Read the package.json that sv created
		const pkgPath = join(targetDir, 'package.json');
		const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

		// Read our template package.json for the extra deps
		const templatePkg = JSON.parse(readFileSync(join(templateDir, 'package.json'), 'utf-8'));

		// Merge dependencies (sv + SvelteForge)
		pkg.dependencies = { ...pkg.dependencies, ...templatePkg.dependencies };
		pkg.devDependencies = { ...pkg.devDependencies, ...templatePkg.devDependencies };

		// Merge scripts (setup, db:* from template)
		pkg.scripts = { ...pkg.scripts, ...templatePkg.scripts };

		writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');

		// Copy the right vite.config.ts
		copyFiles(templateDir, targetDir, ['vite.config.ts']);

		// One-shot install
		const installOk = run('bun install', targetDir);
		if (!installOk) {
			warn('bun install failed — you may need to run it manually.');
		}

		success('Dependencies installed');

		// ── 6. Post-processing ──
		log('\n⚙️  Step 5: Finalizing...');

		// Replace __PROJECT_NAME__ in landing navbar
		if (!fullStack) {
			replaceInFile(
				join(targetDir, 'src/lib/components/layout/navbar.svelte'),
				'__PROJECT_NAME__',
				projectName
			);
		}

		// Update package.json scripts
		try {
			const pkgPath = join(targetDir, 'package.json');
			const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

			pkg.name = projectName;
			pkg.type = 'module';
			pkg.scripts = {
				...pkg.scripts,
				dev: 'vite dev --host',
				build: 'vite build',
				preview: 'vite preview'
			};

			writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
		} catch (e) {
			warn(`package.json: ${(e as Error).message}`);
		}

		success('Finalized');

		// Mark as successful — don't cleanup
		createdTargetDir = null;

		// ── Done ──
		log('\n' + '═'.repeat(50));
		log(`  ✨ ${projectName} ready! (${fullStack ? 'Full Stack' : 'Landing Page'})`);
		log('═'.repeat(50));
		log(`\n  cd ${projectInput}`);
		log('  bun dev\n');

	} catch (e) {
		error(`Scaffold failed: ${(e as Error).message}`);
		cleanup();
		process.exit(1);
	}
}

main().catch((e) => {
	error(`Scaffold failed: ${e.message}`);
	cleanup();
	process.exit(1);
});
