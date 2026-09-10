import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
	plugins: [svelte()],
	resolve: {
		alias: {
			// SvelteKit resolves $lib via its own plugin; in a bare vitest
			// environment we must declare it so route tests can import
			// $lib/server/* modules (#258).
			$lib: resolve('src/lib')
		}
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		// The dashboard baseline runs against ONE shared PostgreSQL database
		// (credential lifecycle + bootstrap suites). Parallel files would race
		// on each other's user rows — run test files sequentially (#318).
		fileParallelism: false
	}
});
