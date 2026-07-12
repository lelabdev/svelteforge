import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * Tests for #175 — template manifest generation must be deterministic.
 * readdirSync returns entries in filesystem-dependent order; the generator
 * must sort entries so src/templates.ts is byte-identical across builds.
 */
describe('deterministic manifest generation (#175)', () => {
	const source = readFileSync(join(ROOT, 'scripts/prebuild-utils.ts'), 'utf-8');

	it('sorts directory entries before recursive traversal', () => {
		expect(source).toMatch(/\.sort\(\)/);
	});

	it('readDirRecursively is exported', () => {
		expect(source).toMatch(/export.*readDirRecursively/);
	});
});
