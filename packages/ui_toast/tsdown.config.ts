import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: true,

	// Stable filenames (no hash)
	entryNames: '[name]',
	hash: false
});
