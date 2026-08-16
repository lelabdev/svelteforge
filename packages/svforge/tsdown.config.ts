import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: { resolve: [] },
	outDir: 'dist',
	// Stable filenames (no hash)
	deps: { neverBundle: ['sv', '@sveltejs/sv-utils'] },
	entryNames: '[name]',
	hash: false,
	outExtensions: () => ({ js: '.js', dts: '.d.ts' })
});
