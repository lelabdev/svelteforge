import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: true,
	clean: true,
	// Stable filenames (no hash)
	deps: { neverBundle: ['sv', '@sveltejs/sv-utils'] },
	entryNames: '[name]',
	hash: false,
	outExtensions: () => ({ js: '.js', dts: '.d.ts' })
});
