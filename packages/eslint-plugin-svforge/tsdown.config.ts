import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: true,
	deps: { neverBundle: ['svforge'] },
	entryNames: '[name]',
	hash: false,
	outExtensions: () => ({ js: '.js', dts: '.d.ts' })
});
