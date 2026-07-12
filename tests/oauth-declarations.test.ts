import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OAUTH_PKG = join(ROOT, 'packages/oauth');

/**
 * Regression tests for #174 — OAuth package must publish valid TypeScript
 * declarations with stable, non-hashed filenames.
 *
 * The package.json referenced dist/index-B9n1xibO.d.ts (a hashed name that
 * can change between builds). The exports.types path must point to a file
 * that reliably exists after building.
 */
describe('OAuth TypeScript declaration publishing (#174)', () => {
	const pkgJson = JSON.parse(readFileSync(join(OAUTH_PKG, 'package.json'), 'utf-8'));

	it('package.json types path does not contain a hash', () => {
		// The types field must not reference a hashed filename like index-AbCd1234.d.ts
		const typesPath = pkgJson.types || '';
		expect(typesPath).not.toMatch(/index-[A-Za-z0-9_-]{6,}\.d\.ts/);
	});

	it('package.json exports.types path does not contain a hash', () => {
		const typesExport = pkgJson.exports?.['.']?.types || '';
		expect(typesExport).not.toMatch(/index-[A-Za-z0-9_-]{6,}\.d\.ts/);
	});

	it('package.json references index.d.ts (stable name)', () => {
		expect(pkgJson.types).toBe('./dist/index.d.ts');
		expect(pkgJson.exports?.['.']?.types).toBe('./dist/index.d.ts');
	});

	it('build produces dist/index.d.ts (stable declaration file)', () => {
		// Build the package and verify the stable declaration file exists
		execSync('bun run build', { cwd: OAUTH_PKG, stdio: 'pipe', timeout: 60_000 });
		expect(existsSync(join(OAUTH_PKG, 'dist', 'index.d.ts'))).toBe(true);
	});

	it('dist/index.js exists after build', () => {
		expect(existsSync(join(OAUTH_PKG, 'dist', 'index.js'))).toBe(true);
	});
});
