import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const SVFORGE = join(ROOT, 'packages/svforge');

describe('svforge build', () => {
	it('generates dist/index.js', () => {
		expect(existsSync(join(SVFORGE, 'dist/index.js'))).toBe(true);
	});

	it('generates templates.ts', () => {
		expect(existsSync(join(SVFORGE, 'src/templates.ts'))).toBe(true);
	});
});
