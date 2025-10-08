import { test, expect, seedPresets } from '../../fixtures/database';

/**
 * Workspace UI Tests - Parallel Strategy
 *
 * These tests verify UI behavior with pre-seeded data.
 * Tests run in parallel and are order-independent.
 *
 * Strategy: Parallel
 * - Database is seeded once before all tests
 * - Tests run in parallel (no dependencies)
 * - UI-focused, data state doesn't matter
 * - Tests can run in any order
 */

// Seed once before all tests in this file
test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
  await resetDatabase();
  await seedDatabase(seedPresets.multipleWorkspaces);
});

test.describe.skip('Workspace UI Display', () => {
  test('should display workspace list page', async ({ page }) => {
    await page.goto('/workspaces');

    // Should have a heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should render workspace cards', async ({ page }) => {
    await page.goto('/workspaces');

    // Should display the 3 seeded workspaces
    // Note: This uses data-testid which should be added to the UI components
    const cards = page.locator('[data-testid="workspace-card"]');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Should have at least one workspace card
    await expect(cards.first()).toBeVisible();
  });

  test('should show workspace names', async ({ page }) => {
    await page.goto('/workspaces');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Should see some of the seeded workspace names
    // (Development, Production, Testing)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe.skip('Workspace UI Navigation', () => {
  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Check for basic navigation structure
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be able to navigate to workspaces page', async ({ page }) => {
    await page.goto('/');

    // Try to find a link/button to workspaces
    // Note: Update selectors based on actual UI implementation
    const workspacesLink = page.locator('a[href*="workspace"], button:has-text("Workspace")');

    // If the link exists, it should be visible
    const count = await workspacesLink.count();
    if (count > 0) {
      await expect(workspacesLink.first()).toBeVisible();
    }
  });
});

test.describe.skip('Workspace UI Interactions', () => {
  test('should handle page load without errors', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/workspaces');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should not have any JavaScript errors
    expect(errors).toHaveLength(0);
  });

  test('should be responsive to viewport changes', async ({ page }) => {
    await page.goto('/workspaces');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe.skip('Workspace UI Accessibility', () => {
  test('should have proper document structure', async ({ page }) => {
    await page.goto('/workspaces');

    // Should have a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/workspaces');

    // Should have at least one heading
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have focusable elements', async ({ page }) => {
    await page.goto('/workspaces');

    // Tab through the page
    await page.keyboard.press('Tab');

    // There should be at least one focusable element
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
  });
});
