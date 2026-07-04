import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: { resolve: [] },
	external: ['sv', '@sveltejs/sv-utils'],
	entryNames: '[name]'
});
