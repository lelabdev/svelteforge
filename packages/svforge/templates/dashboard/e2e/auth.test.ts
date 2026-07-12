import { test, expect } from '@playwright/test';

/**
 * E2E tests for authentication flows.
 * Playwright is opt-in — install separately: bun add -D @playwright/test
 */

test.describe('authentication', () => {
	test('redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
	});

	test('shows login form', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test('shows validation feedback on empty submit', async ({ page }) => {
		await page.goto('/login');
		await page.click('button[type="submit"]');
		// Browser-native validation or server-side error message
		await expect(page.locator('input:invalid, [role="alert"], .error')).toBeVisible({ timeout: 5000 });
	});

	test('logs in with valid credentials', async ({ page }) => {
		await page.goto('/login');
		await page.fill('input[type="email"]', 'admin@test.com');
		await page.fill('input[type="password"]', 'password123');
		await page.click('button[type="submit"]');
		// Should navigate away from /login after success
		await expect(page).not.toHaveURL(/\/login/);
	});
});
