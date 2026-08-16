import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: { resolve: [] },
	outDir: 'dist',
	deps: { neverBundle: ['sv', '@sveltejs/sv-utils'] },
	entryNames: '[name]',
	hash: false,
	outExtensions: () => ({ js: '.js', dts: '.d.ts' })
});
