import { test, expect } from '@playwright/test';

/**
 * E2E tests for dashboard navigation and protected routes.
 * Playwright is opt-in — install separately: bun add -D @playwright/test
 */

test.describe('protected routes', () => {
	test('admin page requires authentication', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/login/);
	});

	test('settings page requires authentication', async ({ page }) => {
		await page.goto('/admin/settings');
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe('dashboard navigation (authenticated)', () => {
	test.beforeEach(async ({ page }) => {
		// Login first
		await page.goto('/login');
		await page.fill('input[type="email"]', 'admin@test.com');
		await page.fill('input[type="password"]', 'password123');
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/dashboard|\/admin/);
	});

	test('can navigate to user management', async ({ page }) => {
		await page.goto('/admin/users');
		await expect(page.locator('table, [data-testid="user-list"]')).toBeVisible();
	});

	test('can navigate to settings', async ({ page }) => {
		await page.goto('/admin/settings');
		await expect(page.locator('h2, h3')).toContainText(/settings/i);
	});
});
