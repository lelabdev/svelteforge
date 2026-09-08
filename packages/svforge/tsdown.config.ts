import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: { resolve: [] },
	outDir: 'dist',
	// Stable filenames (no hash)
	// alwaysBundle: the sv add engine rejects community addons declaring
	// runtime dependencies, so addon-kit is bundled INTO the dist (#323/#324).
	deps: { neverBundle: ['sv', '@sveltejs/sv-utils'], alwaysBundle: (id) => id.includes('addon-kit') },
	entryNames: '[name]',
	hash: false,
	outExtensions: () => ({ js: '.js', dts: '.d.ts' })
});
