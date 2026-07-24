import { test, expect } from '@playwright/test';

/**
 * E2E tests for user CRUD flows and form feedback.
 * Playwright is opt-in — install separately: bun add -D @playwright/test
 */

test.describe('user management CRUD', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.fill('input[type="email"]', 'admin@test.com');
		await page.fill('input[type="password"]', 'password123');
		await page.click('button[type="submit"]');
		await page.goto('/admin/users');
	});

	test('displays user list table', async ({ page }) => {
		await expect(page.locator('table')).toBeVisible();
	});

	test('shows create user form feedback on validation error', async ({ page }) => {
		// Open create modal
		await page.click('button:has-text("Add"), button:has-text("Create")');
		// Submit empty form
		await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")');
		// Expect feedback message
		await expect(page.locator('[role="alert"], .error, .text-error')).toBeVisible({ timeout: 5000 });
	});

	test('can delete a user', async ({ page }) => {
		// Find a delete button (not the self-delete which is disabled)
		const deleteButtons = page.locator('button[aria-label="Delete user"]:not([disabled])');
		const count = await deleteButtons.count();
		if (count > 0) {
			await deleteButtons.first().click();
			// Confirm deletion
			await page.click('button:has-text("Delete"):not([aria-label])');
			await expect(page.locator('[role="alert"], .feedback, .text-success')).toBeVisible({ timeout: 5000 });
		}
	});

	test('prevents self-deletion', async ({ page }) => {
		// The current admin's delete button should be disabled
		await expect(page.locator('button[disabled][aria-label="Delete user"]')).toBeVisible();
	});
});
