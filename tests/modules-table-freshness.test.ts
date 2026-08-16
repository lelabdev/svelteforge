import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * Freshness guard for the generated modules/presets tables (#257).
 *
 * The READMEs' modules/presets tables are generated from the machine-readable
 * contract (svforge-modules.json, #236) by scripts/gen-modules-table.mjs —
 * the contract is the single source of truth. If a module is added/removed
 * in the contract without regenerating the docs, this test fails.
 */
describe('README modules table freshness (#257)', () => {
	it('root README modules/presets tables match svforge-modules.json', () => {
		const generated = execSync('node scripts/gen-modules-table.mjs', { cwd: ROOT, encoding: 'utf-8' });
		const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8');

		const block = generated.slice(
			generated.indexOf('<!-- MODULES-TABLE:START -->'),
			generated.indexOf('<!-- MODULES-TABLE:END -->') + '<!-- MODULES-TABLE:END -->'.length
		);
		expect(readme).toContain(block);

		const presets = generated.slice(
			generated.indexOf('<!-- PRESETS-TABLE:START -->'),
			generated.indexOf('<!-- PRESETS-TABLE:END -->') + '<!-- PRESETS-TABLE:END -->'.length
		);
		expect(readme).toContain(presets);
	});

	it('packages/svforge README tables match svforge-modules.json', () => {
		const generated = execSync('node scripts/gen-modules-table.mjs', { cwd: ROOT, encoding: 'utf-8' });
		const readme = readFileSync(join(ROOT, 'packages/svforge/README.md'), 'utf-8');

		const block = generated.slice(
			generated.indexOf('<!-- MODULES-TABLE:START -->'),
			generated.indexOf('<!-- MODULES-TABLE:END -->') + '<!-- MODULES-TABLE:END -->'.length
		);
		expect(readme).toContain(block);
	});

	it('mentions every current module and no obsolete DB tech', () => {
		const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8');
		const manifest = JSON.parse(
			readFileSync(join(ROOT, 'packages/svforge/templates/base/root/svforge-modules.json'), 'utf-8')
		);
		for (const id of Object.keys(manifest.modules)) {
			expect(readme).toContain(`@svforge/${id}`);
		}
		// PostgreSQL is canonical since #255 — no obsolete SQLite/libsql wording
		expect(readme).not.toMatch(/SQLite|libsql/);
		expect(readme).toMatch(/PostgreSQL/);
	});
});
