import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { runBun } from './helpers/bun';

const root = process.cwd();

/**
 * Regression test for #171 — each addon package build must produce dist/index.js.
 * These four packages had invalid tsdown configs (missing comma) that broke the
 * build with a TypeScript parse error.
 */
describe('addon package builds produce dist/index.js (#171)', () => {
	const packages = ['dnd', 'ui_toast', 'tiptap', 'graph'];

	for (const pkg of packages) {
		it(`${pkg} builds and emits dist/index.js`, () => {
			const pkgDir = join(root, 'packages', pkg);
			runBun(['run', 'build'], pkgDir);
			expect(existsSync(join(pkgDir, 'dist', 'index.js'))).toBe(true);
		});
	}
});
