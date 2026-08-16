import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the SVForge dashboard.
 *
 * This is an opt-in testing profile — install Playwright separately:
 *   bun add -D @playwright/test
 *   bunx playwright install
 *
 * Then run: bunx playwright test
 */
export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		// Dashboard UI copy is i18n via Paraglide; the E2E selectors target the
		// English strings, so pin the browser locale (#267).
		locale: 'en-US'
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }
	],
	webServer: {
		command: 'bun run build && bun run preview',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI
	}
});
