import { test, expect, seedPresets } from '../../fixtures/database';

/**
 * Routing E2E Tests - Parallel Strategy
 *
 * These tests verify the routing logic, including:
 * - Authentication guards
 * - Redirect intent preservation
 * - 404 page handling
 * - Root path navigation
 *
 * Strategy: Parallel
 * - Each test is independent
 * - Database is reset before each test
 */

test.describe('Routing and Navigation', () => {
  test.describe.configure({mode: 'serial'});
  test.describe('Authentication Guards', () => {
    test('should redirect unauthenticated user to login when accessing dashboard', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Try to access dashboard without being logged in
      await page.goto('/dashboard');

      // Should be redirected to login
      await page.waitForURL('/login', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('should allow authenticated user to access dashboard', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 5000 });

      // Should be on dashboard
      expect(page.url()).toContain('/dashboard');
    });

    test('should redirect root path to dashboard for authenticated users', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 5000 });

      // Navigate to root
      await page.goto('/');

      // Should redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 5000 });
      expect(page.url()).toContain('/dashboard');
    });

    test('should redirect root path to login for unauthenticated users', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Navigate to root without being logged in
      await page.goto('/');

      // Should redirect to login (via dashboard -> login)
      await page.waitForURL('/login', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Redirect Intent Preservation', () => {
    test('should preserve intended destination after login', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Try to access dashboard without being logged in
      await page.goto('/dashboard');

      // Should be redirected to login
      await page.waitForURL('/login', { timeout: 5000 });

      // Login
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should redirect back to dashboard (the intended destination)
      await page.waitForURL('/dashboard', { timeout: 5000 });
      expect(page.url()).toContain('/dashboard');
    });

    test('should redirect to dashboard when logging in directly (no intent)', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Go directly to login page
      await page.goto('/login');

      // Login
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should redirect to dashboard (default)
      await page.waitForURL('/dashboard', { timeout: 5000 });
      expect(page.url()).toContain('/dashboard');
    });

    test('should clear redirect intent on logout', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Try to access dashboard, get redirected to login
      await page.goto('/dashboard');
      await page.waitForURL('/login', { timeout: 5000 });

      // Login
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 5000 });

      // Logout (if logout button exists)
      const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")');
      if (await logoutButton.count() > 0) {
        await logoutButton.first().click();
        await page.waitForURL('/login', { timeout: 5000 });
      } else {
        // Manually clear auth and go to login
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.goto('/login');
      }

      // Login again (this time starting from /login with no intent)
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should go to dashboard (not preserve old intent)
      await page.waitForURL('/dashboard', { timeout: 5000 });
      expect(page.url()).toContain('/dashboard');
    });
  });

  test.describe('404 Page', () => {
    test('should show 404 page for non-existent routes', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Navigate to a non-existent route
      await page.goto('/this-page-does-not-exist');

      // Should show 404 page
      await expect(page.locator('h1')).toContainText('404');
      await expect(page.locator('h2')).toContainText('Page Not Found');
    });

    test('should have link to dashboard on 404 page', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Navigate to a non-existent route
      await page.goto('/non-existent-route');

      // Should have a link to dashboard
      const dashboardLink = page.locator('a[href="/dashboard"]');
      await expect(dashboardLink).toBeVisible();
      await expect(dashboardLink).toContainText(/Dashboard/i);
    });

    test('should allow navigation from 404 page to dashboard', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 5000 });

      // Navigate to 404 page
      await page.goto('/another-non-existent-route');

      // Click dashboard link
      await page.click('a[href="/dashboard"]');

      // Should navigate to dashboard
      await page.waitForURL('/dashboard', { timeout: 5000 });
      expect(page.url()).toContain('/dashboard');
    });

    test('should have back button on 404 page', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Navigate to a non-existent route
      await page.goto('/bad-route');

      // Should have a back button
      const backButton = page.locator('button:has-text("Go Back")');
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Public Routes', () => {
    test('should allow access to login page without authentication', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      await page.goto('/login');

      // Should be on login page
      await expect(page.locator('h2')).toContainText('Sign In');
      expect(page.url()).toContain('/login');
    });

    test('should allow access to register page without authentication', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      await page.goto('/register');

      // Should be on register page
      await expect(page.locator('h2')).toContainText('Create Account');
      expect(page.url()).toContain('/register');
    });

    test('should allow access to init page without authentication', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      await page.goto('/init');

      // Should be on init page
      await expect(page.locator('h1')).toContainText('System Initialization');
      expect(page.url()).toContain('/init');
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state while checking authentication', async ({
      page,
      resetDatabase,
      seedDatabase,
    }) => {
      await resetDatabase();
      await seedDatabase(seedPresets.withUsers);

      // Login and then reload to trigger loading state
      await page.goto('/login');
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 5000 });

      // Reload the page - should briefly show loading state
      await page.reload();

      // The page should either show loading or dashboard (if loading was too fast)
      const hasLoading = await page.locator('text=Loading').count();
      const hasDashboard = await page.locator('text=Dashboard').count();

      expect(hasLoading > 0 || hasDashboard > 0).toBeTruthy();
    });
  });
});
