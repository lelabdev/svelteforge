import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts', 'templates/index.ts'],
	format: 'esm',
	dts: true,
	// Bundle everything except sv (peerDependency)
	// templates/ is included in the bundle
	external: ['sv', '@sveltejs/sv-utils']
});
