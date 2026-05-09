import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	dts: true,
	// Bundle everything — sv addon requirement: no dependencies
	// sv itself is a peerDependency, so we externalize it
	external: ['sv', '@sveltejs/sv-utils']
});
