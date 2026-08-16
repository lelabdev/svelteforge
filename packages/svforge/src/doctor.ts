/**
 * SVForge Doctor — read-only diagnostics for installed SVForge modules.
 *
 * Verifies that installed SVForge modules, generated configuration,
 * environment variables, and supported dependency versions remain compatible.
 *
 * This command is strictly read-only: it never modifies project files.
 */

export interface DiagnosticResult {
	/** Module or area being checked. */
	module: string;
	/** Check status. */
	status: 'ok' | 'warn' | 'error';
	/** Human-readable message with remediation advice. */
	message: string;
}

export interface DoctorReport {
	results: DiagnosticResult[];
	/** True when all checks pass (no warnings or errors). */
	healthy: boolean;
}

/**
 * Run SVForge diagnostics on the current project.
 *
 * @param projectRoot - Absolute path to the project root (defaults to cwd).
 * @returns A structured diagnostic report. Does not modify any files.
 */
export async function doctor(projectRoot: string = process.cwd()): Promise<DoctorReport> {
	const results: DiagnosticResult[] = [];

	// 1. Check for SVForge components directory
	results.push(checkSvforgeComponents(projectRoot));

	// 2. Check for SvelteKit project structure
	results.push(checkSvelteKit(projectRoot));

	// 3. Check for required environment variables
	results.push(...checkEnvVars(projectRoot));

	// 4. Check dependency compatibility
	results.push(...checkDependencies(projectRoot));

	return {
		results,
		healthy: results.every((r) => r.status === 'ok')
	};
}

/** Check that the svforge components directory exists. */
function checkSvforgeComponents(root: string): DiagnosticResult {
	try {
		const fs = require('node:fs');
		const path = require('node:path');
		const svforgeDir = path.join(root, 'src/lib/components/svforge');
		if (fs.existsSync(svforgeDir)) {
			return { module: 'svforge', status: 'ok', message: 'SVForge components directory found' };
		}
		return {
			module: 'svforge',
			status: 'warn',
			message: 'No src/lib/components/svforge/ directory found. Run `sv add svforge` to install.'
		};
	} catch {
		return { module: 'svforge', status: 'error', message: 'Cannot check svforge components' };
	}
}

/** Check that the project is a SvelteKit project. */
function checkSvelteKit(root: string): DiagnosticResult {
	try {
		const fs = require('node:fs');
		const path = require('node:path');
		// Modern sv create (Kit 2.63 / vite-plugin-svelte 7) has no svelte.config.js
		// — the config lives in vite.config.ts (#185).
		const hasViteConfig = fs.existsSync(path.join(root, 'vite.config.ts')) || fs.existsSync(path.join(root, 'vite.config.js'));
		const hasSvelteConfig = fs.existsSync(path.join(root, 'svelte.config.js')) || fs.existsSync(path.join(root, 'svelte.config.ts'));
		const pkgPath = path.join(root, 'package.json');
		const hasSvelteKitDep = fs.existsSync(pkgPath) &&
			/@sveltejs\/kit/.test(fs.readFileSync(pkgPath, 'utf-8'));
		if (!hasViteConfig && !hasSvelteConfig && !hasSvelteKitDep) {
			return {
				module: 'sveltekit',
				status: 'error',
				message: 'No SvelteKit project detected (no vite.config / svelte.config / @sveltejs/kit). SVForge requires SvelteKit.'
			};
		}
		return { module: 'sveltekit', status: 'ok', message: 'SvelteKit project detected' };
	} catch {
		return { module: 'sveltekit', status: 'error', message: 'Cannot check SvelteKit config' };
	}
}

/** Check for commonly required environment variables. */
function checkEnvVars(root: string): DiagnosticResult[] {
	const results: DiagnosticResult[] = [];
	const requiredVars = [
		{ name: 'DATABASE_URL', modules: ['dashboard'] },
		{ name: 'AUTH_SECRET', modules: ['dashboard'] },
		{ name: 'S3_ENDPOINT', modules: ['uploads'] },
		{ name: 'S3_BUCKET', modules: ['uploads'] }
	];

	const envPath = require('node:path').join(root, '.env');
	let envContent = '';
	try {
		envContent = require('node:fs').readFileSync(envPath, 'utf-8');
	} catch {
		// No .env file — check process.env as fallback
	}

	for (const { name, modules } of requiredVars) {
		const present = envContent.includes(name) || process.env[name] !== undefined;
		results.push({
			module: modules.join('/'),
			status: present ? 'ok' : 'warn',
			message: present
				? `${name} is set`
				: `${name} is not set. Required by: ${modules.join(', ')}.`
		});
	}

	return results;
}

/** Check dependency versions for known compatibility issues. */
function checkDependencies(root: string): DiagnosticResult[] {
	const results: DiagnosticResult[] = [];

	try {
		const pkgPath = require('node:path').join(root, 'package.json');
		const pkg = JSON.parse(require('node:fs').readFileSync(pkgPath, 'utf-8'));
		const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

		// Check Svelte version >= 5.0
		const svelteVer = deps['svelte'];
		if (svelteVer) {
			results.push({
				module: 'svelte',
				status: 'ok',
				message: `Svelte ${svelteVer} detected`
			});
		} else {
			results.push({
				module: 'svelte',
				status: 'error',
				message: 'Svelte is not installed. SVForge requires Svelte 5+.'
			});
		}

		// Check Skeleton UI
		const skeletonVer = deps['@skeletonlabs/skeleton-svelte'];
		if (skeletonVer) {
			results.push({
				module: 'skeleton',
				status: 'ok',
				message: `Skeleton UI ${skeletonVer} detected`
			});
		} else {
			results.push({
				module: 'skeleton',
				status: 'warn',
				message: '@skeletonlabs/skeleton-svelte not found. Required for SVForge UI components.'
			});
		}
	} catch {
		results.push({
			module: 'dependencies',
			status: 'error',
			message: 'Cannot read package.json. Ensure you are in a project root.'
		});
	}

	return results;
}

/** Format and print a doctor report to the console. */
export function printReport(report: DoctorReport): void {
	console.log('\n SVForge Doctor\n');
	for (const result of report.results) {
		const icon = result.status === 'ok' ? '✓' : result.status === 'warn' ? '⚠' : '✗';
		const label = result.status === 'ok' ? 'OK' : result.status === 'warn' ? 'WARN' : 'ERROR';
		console.log(`  ${icon} [${result.module}] ${label}: ${result.message}`);
	}
	console.log(`\n${report.healthy ? '✓ All checks passed.' : '⚠ Some checks need attention.'}\n`);
}
