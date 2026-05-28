import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: { resolve: [] },
	// Bundle everything except sv (peerDependency)
	external: ['sv', '@sveltejs/sv-utils']
});
