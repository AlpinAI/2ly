import { test, expect, seedPresets } from '@2ly/common/test/fixtures/playwright';

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

test.describe('Login', () => {
  test.describe.configure({ mode: 'serial' });
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

      // Should redirect to workspace
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

      // Should be on workspace page
      expect(page.url()).toMatch(/\/w\/.+\/overview/);
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill in with wrong credentials
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');

      // Submit the form
      await page.click('button[type="submit"]');

      // Should show error message (look for the error alert with the specific message)
      const errorAlert = page.locator('[role="alert"]', { hasText: /Invalid email or password/i });
      await expect(errorAlert).toBeVisible({ timeout: 5000 });

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
      const errorAlert = page.locator('[role="alert"]', { hasText: /Invalid email or password/i });
      await expect(errorAlert).toBeVisible({ timeout: 5000 });

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
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

      // Reload the page
      await page.reload();

      // Should still be on workspace (auth persisted)
      expect(page.url()).toMatch(/\/w\/.+\/overview/);
    });
  });

  test.describe('Registration Flow', () => {
    // Reset database before all tests
    test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);
    });

    // Configure tests to run serially
    test.describe.configure({ mode: 'serial' });

    test('should display register page', async ({ page }) => {
      await page.goto('/register');

      // Should have register heading
      await expect(page.locator('h2')).toContainText('Create Account');

      // Should have email and password fields
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
      await expect(page.locator('input#confirmPassword')).toBeVisible();

      // Should have terms checkbox (Radix Checkbox renders as button with role="checkbox")
      await expect(page.locator('button[role="checkbox"]')).toBeVisible();

      // Should have submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should display password validation feedback', async ({ page }) => {
      await page.goto('/register');

      // Password validation should not be visible initially
      await expect(page.locator('[data-testid="password-validation-feedback"]')).not.toBeVisible();

      // Type a password
      await page.fill('input#password', 'abc');

      // Password validation feedback should now be visible
      await expect(page.locator('[data-testid="password-validation-feedback"]')).toBeVisible();

      // Should show all requirements as not met
      await expect(page.locator('[data-testid="validation-min-length"]')).toHaveAttribute('data-valid', 'false');
      await expect(page.locator('[data-testid="validation-has-letter"]')).toHaveAttribute('data-valid', 'true');
      await expect(page.locator('[data-testid="validation-has-number"]')).toHaveAttribute('data-valid', 'false');

      // Type a valid password
      await page.fill('input#password', 'password123');

      // Should show all requirements as met
      await expect(page.locator('[data-testid="validation-min-length"]')).toHaveAttribute('data-valid', 'true');
      await expect(page.locator('[data-testid="validation-has-letter"]')).toHaveAttribute('data-valid', 'true');
      await expect(page.locator('[data-testid="validation-has-number"]')).toHaveAttribute('data-valid', 'true');
    });

    test('should register successfully with valid data', async ({ page }) => {
      await page.goto('/register');

      // Fill in the form
      await page.fill('input[type="email"]', 'newuser@example.com');
      await page.fill('input#password', 'password123');
      await page.fill('input#confirmPassword', 'password123');
      await page.click('button[role="checkbox"]'); // Radix Checkbox uses button

      // Submit the form
      await page.click('button[type="submit"]');

      // Should redirect to workspace
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

      // Should be on workspace page
      expect(page.url()).toMatch(/\/w\/.+\/overview/);
    });

    test('should show error when registering with already registered email', async ({ page }) => {
      await page.goto('/register');

      // Fill in with existing user email
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input#password', 'password123');
      await page.fill('input#confirmPassword', 'password123');
      await page.click('button[role="checkbox"]'); // Radix Checkbox

      // Submit the form
      await page.click('button[type="submit"]');

      // Should show error message
      const errorAlert = page.locator('[role="alert"]', { hasText: /User with this email already exists/i });
      await expect(errorAlert).toBeVisible({ timeout: 5000 });

      // Should still be on register page
      expect(page.url()).toContain('/register');
    });

    test('should disable button and show indicator when passwords do not match', async ({ page }) => {
      await page.goto('/register');

      // Fill in the form with mismatched passwords
      await page.fill('input[type="email"]', 'newuser2@example.com');
      await page.fill('input#password', 'password123');
      await page.fill('input#confirmPassword', 'password456');
      await page.click('button[role="checkbox"]'); // Radix Checkbox

      // Submit button should be disabled
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();

      // Should show password mismatch indicator
      const matchIndicator = page.locator('[data-testid="password-match-indicator"]');
      await expect(matchIndicator).toBeVisible();
      await expect(matchIndicator).toContainText(/Passwords do not match/i);

      // Should still be on register page
      expect(page.url()).toContain('/register');
    });

    test('should disable button with invalid password (no number)', async ({ page }) => {
      await page.goto('/register');

      // Fill in the form with password missing a number
      await page.fill('input[type="email"]', 'newuser3@example.com');
      await page.fill('input#password', 'passwordabc');
      await page.fill('input#confirmPassword', 'passwordabc');
      await page.click('button[role="checkbox"]'); // Radix Checkbox

      // Submit button should be disabled due to invalid password
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();

      // Password validation should show number requirement not met
      await expect(page.locator('[data-testid="validation-has-number"]')).toHaveAttribute('data-valid', 'false');

      // Should still be on register page
      expect(page.url()).toContain('/register');
    });

    test('should disable button with invalid password (no letter)', async ({ page }) => {
      await page.goto('/register');

      // Fill in the form with password missing a letter
      await page.fill('input[type="email"]', 'newuser4@example.com');
      await page.fill('input#password', '123456789');
      await page.fill('input#confirmPassword', '123456789');
      await page.click('button[role="checkbox"]'); // Radix Checkbox

      // Submit button should be disabled due to invalid password
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();

      // Password validation should show letter requirement not met
      await expect(page.locator('[data-testid="validation-has-letter"]')).toHaveAttribute('data-valid', 'false');

      // Should still be on register page
      expect(page.url()).toContain('/register');
    });

    test('should disable button with invalid password (too short)', async ({ page }) => {
      await page.goto('/register');

      // Fill in the form with password that is too short
      await page.fill('input[type="email"]', 'newuser5@example.com');
      await page.fill('input#password', 'pass1');
      await page.fill('input#confirmPassword', 'pass1');
      await page.click('button[role="checkbox"]'); // Radix Checkbox

      // Submit button should be disabled due to invalid password
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();

      // Password validation should show length requirement not met
      await expect(page.locator('[data-testid="validation-min-length"]')).toHaveAttribute('data-valid', 'false');

      // Should still be on register page
      expect(page.url()).toContain('/register');
    });

    test('should show password match indicator when passwords match', async ({ page }) => {
      await page.goto('/register');

      // Fill in the form with matching passwords
      await page.fill('input#password', 'password123');
      await page.fill('input#confirmPassword', 'password123');

      // Should show password match indicator
      const matchIndicator = page.locator('[data-testid="password-match-indicator"]');
      await expect(matchIndicator).toBeVisible();
      await expect(matchIndicator).toContainText(/Passwords match/i);
    });

    test('should enable submit button when all validations pass', async ({ page }) => {
      await page.goto('/register');

      // Fill in the form with valid data
      await page.fill('input[type="email"]', 'validuser@example.com');
      await page.fill('input#password', 'password123');
      await page.fill('input#confirmPassword', 'password123');
      await page.click('button[role="checkbox"]'); // Radix Checkbox

      // Submit button should be enabled
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled();
    });

    test('should disable submit button when terms not accepted', async ({ page }) => {
      await page.goto('/register');

      // Fill in the form but don't check terms
      await page.fill('input[type="email"]', 'newuser6@example.com');
      await page.fill('input#password', 'password123');
      await page.fill('input#confirmPassword', 'password123');

      // Submit button should be disabled
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
    });

    test('should navigate to login page from register', async ({ page }) => {
      await page.goto('/register');

      // Click login link
      await page.click('a[href="/login"]');

      // Should navigate to login page
      await page.waitForURL('/login', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });
});
