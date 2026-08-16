import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: { resolve: [] },
	deps: { neverBundle: ['sv', '@sveltejs/sv-utils'] },
	entryNames: '[name]',
	hash: false,
	// Stable publishable filenames dist/index.js + dist/index.d.ts (#256),
	// preserved across the tsdown 0.12 → 0.22 update (#272).
	outExtensions: () => ({ js: '.js', dts: '.d.ts' })
});
