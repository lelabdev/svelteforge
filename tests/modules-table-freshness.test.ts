import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * Freshness guards for public/module documentation (#257).
 *
 * packages/svforge/README.md keeps the generated machine-derived tables.
 * The root README is intentionally editorial: it presents SVForge by capability
 * instead of mirroring the manifest as a large table. We still verify that it
 * mentions every current module and preset so it cannot silently drift.
 */
describe('README module metadata freshness (#257)', () => {
	it('packages/svforge README tables match svforge-modules.json', () => {
		const generated = execSync('node scripts/gen-modules-table.mjs', { cwd: ROOT, encoding: 'utf-8' });
		const readme = readFileSync(join(ROOT, 'packages/svforge/README.md'), 'utf-8');

		const block = generated.slice(
			generated.indexOf('<!-- MODULES-TABLE:START -->'),
			generated.indexOf('<!-- MODULES-TABLE:END -->') + '<!-- MODULES-TABLE:END -->'.length
		);
		expect(readme).toContain(block);
	});

	it('root README mentions every current module and preset without generated tables', () => {
		const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8');
		const manifest = JSON.parse(
			readFileSync(join(ROOT, 'packages/svforge/templates/base/root/svforge-modules.json'), 'utf-8')
		);

		for (const id of Object.keys(manifest.modules)) {
			expect(readme).toContain(`@svforge/${id}`);
		}
		for (const id of Object.keys(manifest.presets)) {
			expect(readme).toContain(`svforge preset ${id}`);
		}

		// The public README is deliberately editorial rather than a generated table.
		expect(readme).not.toContain('<!-- MODULES-TABLE:START -->');
		expect(readme).not.toContain('<!-- PRESETS-TABLE:START -->');

		// PostgreSQL is canonical since #255 — no obsolete SQLite/libsql wording.
		expect(readme).not.toMatch(/SQLite|libsql/);
		expect(readme).toMatch(/PostgreSQL/);
	});
});
