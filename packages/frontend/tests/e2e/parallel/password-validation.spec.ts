import { test, expect } from '@playwright/test';

/**
 * Password Validation Feedback Component Tests - Parallel Strategy
 *
 * These tests verify the PasswordValidationFeedback component in isolation.
 * Tests can run in parallel since they don't depend on database state.
 *
 * Strategy: Parallel
 * - Tests can run independently and in parallel
 * - No database dependencies
 * - Component-level testing
 */

test.describe('PasswordValidationFeedback Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should not display feedback when password is empty', async ({ page }) => {
    // Password field should be empty initially
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toHaveValue('');

    // Feedback should not be visible
    await expect(page.locator('[data-testid="password-validation-feedback"]')).not.toBeVisible();
  });

  test('should display feedback when password is entered', async ({ page }) => {
    // Type something in password field
    await page.fill('input#password', 'a');

    // Feedback should be visible
    await expect(page.locator('[data-testid="password-validation-feedback"]')).toBeVisible();
  });

  test('should show minimum length requirement as not met for short passwords', async ({ page }) => {
    await page.fill('input#password', 'abc');

    const minLengthValidation = page.locator('[data-testid="validation-min-length"]');
    await expect(minLengthValidation).toBeVisible();
    await expect(minLengthValidation).toHaveAttribute('data-valid', 'false');
  });

  test('should show minimum length requirement as met for 8+ character passwords', async ({ page }) => {
    await page.fill('input#password', 'abcdefgh');

    const minLengthValidation = page.locator('[data-testid="validation-min-length"]');
    await expect(minLengthValidation).toBeVisible();
    await expect(minLengthValidation).toHaveAttribute('data-valid', 'true');
  });

  test('should show letter requirement as not met for numeric-only passwords', async ({ page }) => {
    await page.fill('input#password', '12345678');

    const hasLetterValidation = page.locator('[data-testid="validation-has-letter"]');
    await expect(hasLetterValidation).toBeVisible();
    await expect(hasLetterValidation).toHaveAttribute('data-valid', 'false');
  });

  test('should show letter requirement as met for passwords with letters', async ({ page }) => {
    await page.fill('input#password', 'abc12345');

    const hasLetterValidation = page.locator('[data-testid="validation-has-letter"]');
    await expect(hasLetterValidation).toBeVisible();
    await expect(hasLetterValidation).toHaveAttribute('data-valid', 'true');
  });

  test('should show number requirement as not met for letter-only passwords', async ({ page }) => {
    await page.fill('input#password', 'abcdefgh');

    const hasNumberValidation = page.locator('[data-testid="validation-has-number"]');
    await expect(hasNumberValidation).toBeVisible();
    await expect(hasNumberValidation).toHaveAttribute('data-valid', 'false');
  });

  test('should show number requirement as met for passwords with numbers', async ({ page }) => {
    await page.fill('input#password', 'password1');

    const hasNumberValidation = page.locator('[data-testid="validation-has-number"]');
    await expect(hasNumberValidation).toBeVisible();
    await expect(hasNumberValidation).toHaveAttribute('data-valid', 'true');
  });

  test('should show all requirements as met for valid password', async ({ page }) => {
    await page.fill('input#password', 'password123');

    // All validations should be met
    await expect(page.locator('[data-testid="validation-min-length"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-letter"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-number"]')).toHaveAttribute('data-valid', 'true');
  });

  test('should update feedback in real-time as user types', async ({ page }) => {
    const passwordInput = page.locator('input#password');
    const minLengthValidation = page.locator('[data-testid="validation-min-length"]');
    const hasLetterValidation = page.locator('[data-testid="validation-has-letter"]');
    const hasNumberValidation = page.locator('[data-testid="validation-has-number"]');

    // Start with just letters
    await passwordInput.fill('abc');
    await expect(minLengthValidation).toHaveAttribute('data-valid', 'false');
    await expect(hasLetterValidation).toHaveAttribute('data-valid', 'true');
    await expect(hasNumberValidation).toHaveAttribute('data-valid', 'false');

    // Add more letters to meet length requirement
    await passwordInput.fill('abcdefgh');
    await expect(minLengthValidation).toHaveAttribute('data-valid', 'true');
    await expect(hasLetterValidation).toHaveAttribute('data-valid', 'true');
    await expect(hasNumberValidation).toHaveAttribute('data-valid', 'false');

    // Add a number to meet all requirements
    await passwordInput.fill('abcdefgh1');
    await expect(minLengthValidation).toHaveAttribute('data-valid', 'true');
    await expect(hasLetterValidation).toHaveAttribute('data-valid', 'true');
    await expect(hasNumberValidation).toHaveAttribute('data-valid', 'true');
  });

  test('should accept passwords with uppercase letters', async ({ page }) => {
    await page.fill('input#password', 'PASSWORD123');

    await expect(page.locator('[data-testid="validation-min-length"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-letter"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-number"]')).toHaveAttribute('data-valid', 'true');
  });

  test('should accept passwords with mixed case letters', async ({ page }) => {
    await page.fill('input#password', 'PaSsWoRd123');

    await expect(page.locator('[data-testid="validation-min-length"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-letter"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-number"]')).toHaveAttribute('data-valid', 'true');
  });

  test('should accept passwords with special characters', async ({ page }) => {
    await page.fill('input#password', 'P@ssw0rd!');

    await expect(page.locator('[data-testid="validation-min-length"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-letter"]')).toHaveAttribute('data-valid', 'true');
    await expect(page.locator('[data-testid="validation-has-number"]')).toHaveAttribute('data-valid', 'true');
  });

  test('should display validation text', async ({ page }) => {
    await page.fill('input#password', 'test');

    // Check that validation text is visible
    await expect(page.locator('text=At least 8 characters')).toBeVisible();
    await expect(page.locator('text=At least one letter')).toBeVisible();
    await expect(page.locator('text=At least one number')).toBeVisible();
  });

  test('should clear feedback when password is cleared', async ({ page }) => {
    // Type a password
    await page.fill('input#password', 'test123');
    await expect(page.locator('[data-testid="password-validation-feedback"]')).toBeVisible();

    // Clear the password
    await page.fill('input#password', '');
    await expect(page.locator('[data-testid="password-validation-feedback"]')).not.toBeVisible();
  });
});
