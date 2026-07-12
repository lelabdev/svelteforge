import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: true,
	clean: true,

	// Stable filenames (no hash)
	entryNames: '[name]'
});
