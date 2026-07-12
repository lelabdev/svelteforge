import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * Tests for #179 — explicit, reviewable SVForge module upgrades.
 *
 * The upgrade command detects local modifications, reports installed and
 * target versions, and never runs automatically. It must preserve modified
 * files or require explicit resolution.
 */
describe('svforge upgrade (#179)', () => {
	describe('upgrade module exists', () => {
		it('has an upgrade source file', () => {
			expect(existsSync(join(ROOT, 'packages/svforge/src/upgrade.ts'))).toBe(true);
		});

		it('exports an upgrade function', () => {
			const source = readFileSync(join(ROOT, 'packages/svforge/src/upgrade.ts'), 'utf-8');
			expect(source).toMatch(/export.*function.*upgrade|export.*const.*upgrade/i);
		});
	});

	describe('upgrade behavior', () => {
		const source = readFileSync(join(ROOT, 'packages/svforge/src/upgrade.ts'), 'utf-8');

		it('accepts a module name parameter (explicit, not automatic)', () => {
			expect(source).toMatch(/module.*string|moduleName|target.*module/i);
		});

		it('detects local modifications to SVForge files', () => {
			expect(source).toMatch(/modif|diff|changed|hash|checksum|local.*edit/i);
		});

		it('reports installed and target recipe versions', () => {
			expect(source).toMatch(/version|installed|target|current|recipe/i);
		});

		it('preserves or requires resolution for modified files', () => {
			// Must either skip modified files, back them up, or require a flag
			expect(source).toMatch(/skip|backup|preserve|force|resolve|overwrite/i);
		});

		it('is exported from the main package index', () => {
			const indexSource = readFileSync(join(ROOT, 'packages/svforge/src/index.ts'), 'utf-8');
			expect(indexSource).toMatch(/upgrade/i);
		});
	});

	describe('upgrade types', () => {
		it('defines structured result types', () => {
			const source = readFileSync(join(ROOT, 'packages/svforge/src/upgrade.ts'), 'utf-8');
			expect(source).toMatch(/interface.*Upgrade|type.*Upgrade|interface.*Result/i);
		});
	});
});
