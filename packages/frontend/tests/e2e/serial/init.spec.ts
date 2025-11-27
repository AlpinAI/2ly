import { test, expect } from '@2ly/common/test/fixtures/playwright';

/**
 * System Initialization E2E Tests - Clean Strategy
 *
 * These tests verify the system initialization flow:
 * - First-time setup with admin account creation
 * - Auto-login after initialization
 * - Redirect to dashboard if already initialized
 *
 * Strategy: Clean
 * - Database is reset before each test (no seeded data)
 * - Tests run independently
 */

test.describe('System Initialization', () => {
  test.beforeAll(async ({ resetDatabase }) => {
    await resetDatabase();
  });

  test('should display init form when system is not initialized', async ({ page }) => {
    // Navigate to init page
    await page.goto('/init');

    // Should show initialization form
    await expect(page.locator('h2')).toContainText('System Initialization');
    await expect(page.locator('label[for="email"]')).toContainText('Administrator Email');

    // Should have email, password, and confirm password fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();

    // Should have submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Initialize System');
  });

  test('should show password validation feedback', async ({ page }) => {
    await page.goto('/init');

    // Password validation should not be visible initially
    await expect(page.locator('[data-testid="password-validation-feedback"]')).not.toBeVisible();

    // Type a weak password
    await page.fill('input#password', 'abc');

    // Password validation feedback should now be visible
    await expect(page.locator('[data-testid="password-validation-feedback"]')).toBeVisible();

    // Should show requirements not met
    await expect(page.locator('[data-testid="validation-min-length"]')).toHaveAttribute('data-valid', 'false');
    await expect(page.locator('[data-testid="validation-has-number"]')).toHaveAttribute('data-valid', 'false');

    // Type a valid password
    await page.fill('input#password', 'admin123');

    // Should show all requirements as met
    await expect(page.locator('[data-testid="validation-min-length"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-letter"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-number"]')).toHaveAttribute('data-valid', 'true');
  });

  test('should show password match indicator', async ({ page }) => {
    await page.goto('/init');

    // Fill password
    await page.fill('input#password', 'admin123');

    // Fill mismatched confirm password
    await page.fill('input#confirmPassword', 'admin456');

    // Should show password mismatch
    const matchIndicator = page.locator('[data-testid="password-match-indicator"]');
    await expect(matchIndicator).toBeVisible();
    await expect(matchIndicator).toContainText(/do not match/i);

    // Fix the confirm password
    await page.fill('input#confirmPassword', 'admin123');

    // Should show passwords match
    await expect(matchIndicator).toContainText(/match/i);
    await expect(matchIndicator).not.toContainText(/do not match/i);
  });

  test('should disable submit button when validation fails', async ({ page }) => {
    await page.goto('/init');

    const submitButton = page.locator('button[type="submit"]');

    // Button should be disabled initially (empty form)
    await expect(submitButton).toBeDisabled();

    // Fill email only
    await page.fill('input[type="email"]', 'user1@2ly.ai');
    await expect(submitButton).toBeDisabled();

    // Add password
    await page.fill('input#password', 'admin123');
    await expect(submitButton).toBeDisabled();

    // Add matching confirm password
    await page.fill('input#confirmPassword', 'admin123');

    // Button should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('should initialize system and auto-login user', async ({ page }) => {
    // Navigate to init page
    await page.goto('/init');

    // Fill in the form
    await page.fill('input[type="email"]', 'user1@2ly.ai');
    await page.fill('input#password', 'admin123');
    await page.fill('input#confirmPassword', 'admin123');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should auto-login and redirect to workspace
    // Note: Success alert may not be visible due to fast redirect
    await page.waitForURL(/\/w\/.+\/overview/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/w\/.+\/overview/);

    // User should be logged in (workspace should be accessible)
    // Not redirected back to login
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/\/w\/.+\/overview/);
  });

  test('should redirect to root if system already initialized', async ({ page }) => {

    // Try to navigate to init page
    await page.goto('/init');

    // Should be redirected to root (which redirects to login since not authenticated)
    await page.waitForURL('/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('should redirect to login when accessing init page without auth after system initialized', async ({
    page }) => {
    // Try to access init page (will redirect to root)
    await page.goto('/init');

    // Will redirect to root, then to login (not authenticated)
    await page.waitForURL('/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
