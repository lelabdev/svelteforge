import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	resolve: {
		conditions: ['module', 'browser', 'development|production'],
		alias: {
			// Templates import Paraglide messages via `$lib/paraglide/messages.js`.
			// In repo-root tests we stub that module (tests/stubs/lib/...) instead
			// of requiring a full scaffolded Paraglide build.
			$lib: fileURLToPath(new URL('./tests/stubs/lib', import.meta.url))
		}
	},
	test: {
		include: ['tests/**/*.test.ts']
	}
});
