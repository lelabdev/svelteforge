/**
 * Test helpers for SVForge addon scaffold and behavior tests.
 *
 * These utilities support the TDD workflow documented in CONTRIBUTING.md:
 * Red (write failing test) → Green (implement) → Refactor (clean up).
 */
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/** Root of the monorepo. */
export const ROOT = process.cwd();

/** Path to a package directory. */
export function packageDir(pkg: string): string {
	return join(ROOT, 'packages', pkg);
}

/** Path to a file inside a package. */
export function packageFile(pkg: string, ...segments: string[]): string {
	return join(packageDir(pkg), ...segments);
}

/** Path to a template file inside the svforge dashboard template. */
export function dashboardTemplateFile(...segments: string[]): string {
	return packageFile(
		'svforge',
		'templates',
		'dashboard',
		'src',
		...segments
	);
}

/** Path to a template file inside the svforge base template. */
export function baseTemplateFile(...segments: string[]): string {
	return packageFile('svforge', 'templates', 'base', 'src', ...segments);
}

/**
 * Create an isolated temporary directory for scaffold tests.
 * Returns the path and a cleanup function.
 */
export function tempProject(prefix = 'sf-test'): { dir: string; cleanup: () => void } {
	const dir = mkdtempSync(join(tmpdir(), `${prefix}-`));
	return {
		dir,
		cleanup: () => {
			rmSync(dir, { recursive: true, force: true });
		}
	};
}

/**
 * Assert that a file exists, with a descriptive error message.
 */
export function expectFile(path: string, message?: string): void {
	if (!existsSync(path)) {
		throw new Error(message || `Expected file to exist: ${path}`);
	}
}

/**
 * Assert that a file does NOT exist.
 */
export function expectNoFile(path: string, message?: string): void {
	if (existsSync(path)) {
		throw new Error(message || `Expected file NOT to exist: ${path}`);
	}
}
