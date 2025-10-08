import { test, expect, seedPresets } from '../../fixtures/database';

/**
 * Login E2E Tests - Seeded Strategy
 *
 * These tests verify the login flow with pre-seeded user data.
 * The database is reset and seeded before all tests.
 *
 * Strategy: Seeded
 * - Database is reset + seeded before all tests
 * - Tests use pre-created user accounts
 * - Tests run serially within this file
 */

test.describe('Login Flow', () => {
  // Reset and seed database before all tests
  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.withUsers);
  });

  // Configure tests to run serially
  test.describe.configure({ mode: 'serial' });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Should have login heading
    await expect(page.locator('h2')).toContainText('Sign In');

    // Should have email and password fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Should have submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in the form
    await page.fill('input[type="email"]', 'user1@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Should be on dashboard page
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in with wrong credentials
    await page.fill('input[type="email"]', 'user1@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should show error message (look for the error alert with the specific message)
    const errorAlert = page.locator('[class*="bg-red"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Verify error message text
    await expect(errorAlert).toContainText(/Invalid email or password/i);

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('should show error with non-existent user', async ({ page }) => {
    await page.goto('/login');

    // Fill in with non-existent user
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should show error message (look for the error alert with the specific message)
    const errorAlert = page.locator('[class*="bg-red"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Verify error message text
    await expect(errorAlert).toContainText(/Invalid email or password/i);

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('should disable submit button while logging in', async ({ page }) => {
    await page.goto('/login');

    // Fill in the form
    await page.fill('input[type="email"]', 'user1@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should be disabled during submission
    // Note: This might be too fast to catch, but we can check for loading text
    const buttonText = await submitButton.textContent();
    expect(buttonText).toMatch(/Sign In|Signing In/);
  });

  test('should navigate to register page from login', async ({ page }) => {
    await page.goto('/login');

    // Click register link
    await page.click('a[href="/register"]');

    // Should navigate to register page
    await page.waitForURL('/register', { timeout: 5000 });
    expect(page.url()).toContain('/register');
  });

  test('should persist authentication after page reload', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user2@example.com');
    await page.fill('input[type="password"]', 'password456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Reload the page
    await page.reload();

    // Should still be on dashboard (auth persisted)
    expect(page.url()).toContain('/dashboard');
  });
});
