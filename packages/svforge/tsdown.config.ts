import { defineConfig } from 'tsdown';

export default defineConfig({
entry: ['src/index.ts'],
format: 'esm',
dts: { resolve: [] },
// Bundle everything except sv (peerDependency)
external: ['sv', '@sveltejs/sv-utils'],
// Stable filenames (no hash) so package.json types field doesn't break
entryNames: '[name]',
hash: false,
outDir: 'dist'
});
