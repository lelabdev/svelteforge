import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: { exclude: ['better-auth'] },
	ssr: { noExternal: ['better-auth'], external: ['bun:sqlite'] },
	resolve: { conditions: ['browser'] },
	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,svelte}']
	}
});
