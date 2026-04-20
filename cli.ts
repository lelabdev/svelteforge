#!/usr/bin/env bun
/**
 * create-svelteforge
 *
 * Creates a new SvelteKit project using `sv create` for the base,
 * `sv add drizzle` for the DB, then layers SvelteForge on top.
 *
 * Usage:
 *   bunx create-svelteforge my-project
 *   bunx create-svelteforge my-project --no-setup
 *
 * Modes:
 *   1. Full Stack     — UI + Forms + Auth + DB
 *   2. Landing Page   — UI + Forms (frontend only)
 *
 * Requirements: bun, npx (or bunx)
 */

import { execSync } from 'child_process';
import {
	cpSync,
	mkdirSync,
	writeFileSync,
	readFileSync,
	existsSync,
	rmSync
} from 'fs';
import { resolve, join } from 'path';

// ============================================================================
// DEPENDENCIES — only what sv does NOT provide
// ============================================================================

const CORE_DEV_DEPS: string[] = [
	'@skeletonlabs/skeleton@latest',
	'@skeletonlabs/skeleton-svelte@latest'
];

const CORE_DEPS: string[] = [
	'@fontsource-variable/fira-code@latest',
	'@fontsource-variable/inter@latest',
	'@fontsource-variable/manrope@latest',
	'@fontsource-variable/space-grotesk@latest',
	'clsx@latest',
	'lucide-svelte@latest',
	'sveltekit-superforms@latest',
	'tailwind-merge@latest',
	'zod@latest'
];

const AUTH_DEPS: string[] = [
	'better-auth@latest',
	'@better-auth/drizzle-adapter@latest',
	'pino@latest',
	'pino-pretty@latest',
	'@types/better-sqlite3@latest',
	'@types/node@latest',
	'better-sqlite3@latest'
];

// ============================================================================
// FILE MANIFESTS
// ============================================================================

const CORE_FILES: string[] = [
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

const AUTH_FILES: string[] = [
	'src/lib/auth.ts',
	'src/lib/auth-client.ts',
	'src/lib/auth-context.ts',
	'src/lib/auth-utils.ts',
	'src/lib/db/',
	'src/lib/services/',
	'src/lib/middleware/',
	'src/lib/schemas/signup.ts',
	'src/lib/schemas/login.ts',
	'src/lib/schemas/password.ts',
	'src/lib/schemas/account.ts',
	'src/hooks.server.ts',
	'src/routes/(public)/',
	'src/routes/(protected)/',
	'src/routes/api/',
	'src/app.d.ts',
	'scripts/',
	'.env.example'
];

const ROUTE_FILES: string[] = [
	'src/routes/+error.svelte',
	'src/routes/+page.svelte',
	'src/routes/+page.server.ts',
	'src/routes/+layout.svelte',
	'src/routes/(legal)/'
];

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
		process.stdin.on('data', (chunk) => {
			chunks.push(chunk);
			const input = Buffer.concat(chunks).toString().trim();
			if (input.includes('\n') || chunk.includes(0x0a)) {
				process.stdin.removeAllListeners('data');
				resolve(input.replace(/\n.*$/, ''));
			}
		});
	});
}

function hasPackage(pkgDir: string, name: string): boolean {
	try {
		const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8'));
		return name in { ...pkg.dependencies, ...pkg.devDependencies };
	} catch {
		return false;
	}
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

function install(dir: string, pkgs: string[], dev = false) {
	if (!pkgs.length) return;
	run(`bun add ${dev ? '-D' : ''} ${pkgs.join(' ')}`, dir, true);
}

function sv(cmd: string, cwd?: string): boolean {
	return run(`npx sv ${cmd}`, cwd) || run(`bunx sv ${cmd}`, cwd);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
	const projectName = process.argv[2];
	if (!projectName) {
		error('Usage: bunx create-svelteforge <project-name> [--no-setup]');
		process.exit(1);
	}
	if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
		error('Project name must contain only letters, numbers, hyphens, and underscores.');
		process.exit(1);
	}

	const skipSetup = process.argv.includes('--no-setup');
	const templateDir = resolve(import.meta.dir, 'template');
	const targetDir = resolve(process.cwd(), projectName);

	log('\n🔨 SvelteForge Scaffold\n');

	if (!existsSync(templateDir)) {
		error(`Template not found: ${templateDir}`);
		process.exit(1);
	}
	if (existsSync(targetDir)) {
		error(`"${projectName}" already exists.`);
		process.exit(1);
	}

	// ── 1. Select mode ──
	log('📦 Select mode:\n');
	log('  1. Full Stack     — UI + Forms + Auth + DB');
	log('  2. Landing Page   — UI + Forms (frontend only)\n');

	const mode = await question('  Choice [1-2]: ');
	const fullStack = mode === '1' || mode === '';

	log(`\n  → Mode: ${fullStack ? 'Full Stack' : 'Landing Page'}\n`);

	// ── 2. sv create ──
	log('📦 Step 1: sv create (base project)...\n');

	const createOk = sv(
		`create --template minimal --types ts ` +
		`--add tailwindcss="plugins:typography,forms" prettier eslint ` +
		`--install bun ${projectName}`
	);

	if (!createOk) {
		error('sv create failed.');
		process.exit(1);
	}
	success('Base project created');

	// ── 2b. sv add vitest ──
	log('\n📦 Step 1b: sv add vitest...');
	sv('add vitest="usages:unit,component" --install bun', targetDir);
	success('Vitest added');

	// ── 3. DB deps (Full Stack only) ──
	if (fullStack) {
		log('\n📦 Step 2: Installing DB dependencies...');
		install(targetDir, ['drizzle-orm@latest'], false);
		install(targetDir, ['drizzle-kit@latest', '@types/node@latest'], true);
		success('DB dependencies installed');
	} else {
		log('\n📦 Step 2: Skipping (Landing Page mode)\n');
	}

	// ── 4. Clean sv defaults ──
	log('\n🧹 Step 3: Cleaning defaults...');
	for (const f of FILES_TO_REMOVE) {
		const p = join(targetDir, f);
		if (existsSync(p)) rmSync(p, { recursive: true, force: true });
	}
	const routesDir = join(targetDir, 'src/routes');
	if (existsSync(routesDir)) rmSync(routesDir, { recursive: true, force: true });
	success('Cleaned');

	// ── 5. Copy SvelteForge files ──
	log('\n📋 Step 4: Copying SvelteForge files...');

	copyFiles(templateDir, targetDir, CORE_FILES);
	copyFiles(templateDir, targetDir, ROUTE_FILES);

	if (fullStack) {
		copyFiles(templateDir, targetDir, AUTH_FILES);
		copyFiles(templateDir, targetDir, ['drizzle.config.ts']);
	}

	if (!fullStack) {
		// ── Simple Navbar (no auth imports) ──
		writeFileSync(join(targetDir, 'src/lib/components/layout/navbar.svelte'),
			`<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import { themeStore } from '$lib/utils/theme.svelte';
	import { onMount, onDestroy } from 'svelte';

	let mobileMenuOpen = $state(false);

	onMount(() => { themeStore.init(); });
	onDestroy(() => { themeStore.destroy(); });
</script>

{#if mobileMenuOpen}
	<div
		class="md:hidden fixed inset-0 top-16 bg-surface-50-900 z-40"
		onclick={() => (mobileMenuOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="flex flex-col p-6">
			<button
				type="button"
				onclick={() => { themeStore.toggle(); mobileMenuOpen = false; }}
				class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-200-800 text-sm"
			>
				{themeStore.isDark ? 'Light Mode' : 'Dark Mode'}
			</button>
		</div>
	</div>
{/if}

<AppBar>
	<AppBar.Toolbar class="grid-cols-[1fr_auto_1fr]">
		<AppBar.Lead>
			<a href="/" class="text-xl font-bold text-white hover:text-primary-200 transition-colors">
				SvelteForge
			</a>
		</AppBar.Lead>

		<AppBar.Headline />

		<AppBar.Trail>
			<div class="hidden md:flex items-center gap-2">
				<ThemeToggle />
			</div>

			<button
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="md:hidden btn-icon text-white"
				aria-label="Menu"
			>
				{#if mobileMenuOpen}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				{:else}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 12h18M3 6h18M3 18h18" />
					</svg>
				{/if}
			</button>
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>
`
		);

		// Remove auth-dependent layout files
		for (const f of ['auth-buttons.svelte', 'mobile-menu.svelte']) {
			const p = join(targetDir, 'src/lib/components/layout', f);
			if (existsSync(p)) rmSync(p, { force: true });
		}

		// ── Simplified layout ──
		writeFileSync(join(targetDir, 'src/routes/+layout.svelte'),
			`<script lang="ts">
	import { onMount } from 'svelte';
	import { Footer, Navbar } from '$lib/components';
	import { themeStore } from '$lib/utils/theme.svelte';
	import '../app.css';
	let { children } = $props();
	onMount(() => { themeStore.init(); });
</script>

<div class="flex flex-col min-h-screen">
	<Navbar />
	<main class="flex-1 pt-16">{@render children()}</main>
	<Footer />
</div>
`
		);

		// ── Simple home page ──
		writeFileSync(join(targetDir, 'src/routes/+page.svelte'),
			`<svelte:head>
	<title>Welcome</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-surface-50-950">
	<div class="max-w-lg mx-auto px-4 text-center space-y-8">
		<h1 class="text-4xl sm:text-5xl font-black uppercase tracking-tight">Welcome</h1>
		<p class="text-lg text-muted-foreground mt-4">Your SvelteKit project is ready.</p>
	</div>
</main>
`
		);

		// ── Minimal app.d.ts ──
		writeFileSync(join(targetDir, 'src/app.d.ts'),
			`declare global {
	namespace App {
		interface Locals {}
	}
}
export {};
`
		);
	}

	success('Files copied');

	// ── 6. Install deps ──
	log('\n📦 Step 5: Installing SvelteForge dependencies...');

	install(targetDir, CORE_DEV_DEPS, true);
	install(targetDir, CORE_DEPS, false);

	if (fullStack) {
		install(targetDir, AUTH_DEPS, false);
		if (!hasPackage(targetDir, 'drizzle-kit')) {
			install(targetDir, ['drizzle-kit@latest'], true);
		}
	}

	if (!hasPackage(targetDir, 'pino')) {
		install(targetDir, ['pino@latest'], false);
	}

	success('Dependencies installed');

	// ── 7. Configure vite.config.ts ──
	log('\n⚙️  Step 6: Configuring vite.config.ts...');

	const vite = fullStack
		? `import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: { exclude: ['better-auth'] },
	ssr: { noExternal: ['better-auth'], external: ['bun:sqlite'] },
	resolve: { conditions: ['browser'] },
	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,svelte}']
	}
});
`
		: `import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: { conditions: ['browser'] },
	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,svelte}']
	}
});
`;
	writeFileSync(join(targetDir, 'vite.config.ts'), vite);
	success('vite.config.ts configured');

	// ── 8. Data dir (Full Stack only) ──
	if (fullStack) {
		mkdirSync(join(targetDir, 'data'), { recursive: true });
		success('data/ created');
	}

	// ── 9. Update scripts ──
	log('\n📝 Step 7: Updating scripts...');
	try {
		const pkgPath = join(targetDir, 'package.json');
		const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

		pkg.type = 'module';
		pkg.scripts = {
			...pkg.scripts,
			dev: 'bun --bun vite dev --host',
			build: 'bun --bun vite build',
			preview: 'bun --bun vite preview'
		};

		if (fullStack) {
			Object.assign(pkg.scripts, {
				'db:push': 'drizzle-kit push',
				'db:generate': 'drizzle-kit generate',
				'db:migrate': 'drizzle-kit migrate',
				'db:studio': 'drizzle-kit studio',
				'db:init': 'bun run scripts/db-init.ts'
			});
		}

		writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
		success('Scripts updated');
	} catch (e) {
		warn(`package.json: ${(e as Error).message}`);
	}

	// ── 10. Generate .env ──
	if (fullStack) {
		log('\n🛠️  Step 8: Generating .env...\n');
		const { randomBytes } = await import('crypto');
		const authSecret = randomBytes(32).toString('hex');
		const envContent = [
			`# Auto-generated by create-svelteforge`,
			`BETTER_AUTH_SECRET="${authSecret}"`,
			`# BETTER_AUTH_URL="http://localhost:5173"`,
			``,
		].join('\n');
		writeFileSync(join(targetDir, '.env'), envContent);
		writeFileSync(join(targetDir, '.env.example'), envContent.replace(authSecret, 'your-secret-here'));
		success('.env generated');

		log('\n  📝 First user to sign up becomes admin automatically.');
		log('  Run: bun run db:push && bun dev\n');
	}

	// ── Done ──
	log('\n' + '═'.repeat(50));
	log(`  ✨ ${projectName} ready! (${fullStack ? 'Full Stack' : 'Landing Page'})`);
	log('═'.repeat(50));
	log(`\n  cd ${projectName}`);
	log('  bun dev\n');
}

main().catch((e) => {
	error(`Scaffold failed: ${e.message}`);
	process.exit(1);
});
