import { test, expect, seedPresets } from '@2ly/common/test/fixtures/playwright';

/**
 * Routing E2E Tests - Parallel Strategy
 *
 * These tests verify the routing logic, including:
 * - Authentication guards
 * - Redirect intent preservation
 * - 404 page handling
 * - Root path navigation
 *
 */

test.describe('Routing and Navigation', () => {
  
  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.withUsers);
  });

  test.describe('Authentication Guards', () => {
    test('should redirect unauthenticated user to login when accessing protected route', async ({ page }) => {
      // Try to access root without being logged in (root is protected and redirects to workspace)
      await page.goto('/');

      // Should be redirected to login
      await page.waitForURL('/login', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('should allow authenticated user to access workspace', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should redirect to workspace (wait for URL pattern /w/:id/overview)
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

      // Should be on workspace overview page
      expect(page.url()).toMatch(/\/w\/.+\/overview/);
    });

    test('should redirect root path to workspace for authenticated users', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

      // Navigate to root
      await page.goto('/');

      // Should redirect to workspace
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/w\/.+\/overview/);
    });

    test('should redirect root path to login for unauthenticated users', async ({ page }) => {
      // Navigate to root without being logged in
      await page.goto('/');

      // Should redirect to login (via dashboard -> login)
      await page.waitForURL('/login', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Redirect Intent Preservation', () => {
    test('should preserve intended destination after login', async ({ page }) => {
      // Try to access root without being logged in
      await page.goto('/');

      // Should be redirected to login
      await page.waitForURL('/login', { timeout: 5000 });

      // Login
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should redirect to workspace (the intended destination)
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/w\/.+\/overview/);
    });

    test('should redirect to workspace when logging in directly (no intent)', async ({ page }) => {
      // Go directly to login page
      await page.goto('/login');

      // Login
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should redirect to workspace (default)
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/w\/.+\/overview/);
    });

    test('should clear redirect intent on logout', async ({ page }) => {
      // Try to access root, get redirected to login
      await page.goto('/');
      await page.waitForURL('/login', { timeout: 5000 });

      // Login
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

      // Logout (if logout button exists)
      const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")');
      if ((await logoutButton.count()) > 0) {
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

      // Should go to workspace (not preserve old intent)
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/w\/.+\/overview/);
    });
  });

  test.describe('404 Page', () => {
    test('should show 404 page for non-existent routes', async ({ page }) => {
      // Navigate to a non-existent route
      await page.goto('/this-page-does-not-exist');

      // Should show 404 page
      await expect(page.locator('h1')).toContainText('404');
      await expect(page.locator('h2')).toContainText('Page Not Found');
    });

    test('should have link to home on 404 page', async ({ page }) => {
      // Navigate to a non-existent route
      await page.goto('/non-existent-route');

      // Should have a link to home
      const homeLink = page.locator('a[href="/"]');
      await expect(homeLink).toBeVisible();
      await expect(homeLink).toContainText(/Home/i);
    });

    test('should allow navigation from 404 page to workspace', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

      // Navigate to 404 page
      await page.goto('/another-non-existent-route');

      // Click home link
      await page.click('a[href="/"]');

      // Should navigate to workspace
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/w\/.+\/overview/);
    });

    test('should have back button on 404 page', async ({ page }) => {
      // Navigate to a non-existent route
      await page.goto('/bad-route');

      // Should have a back button
      const backButton = page.locator('button:has-text("Go Back")');
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Public Routes', () => {
    test('should allow access to login page without authentication', async ({ page }) => {
      await page.goto('/login');

      // Should be on login page
      await expect(page.locator('h2')).toContainText('Sign In');
      expect(page.url()).toContain('/login');
    });

    test('should allow access to register page without authentication', async ({ page }) => {
      await page.goto('/register');

      // Should be on register page
      await expect(page.locator('h2')).toContainText('Create Account');
      expect(page.url()).toContain('/register');
    });

    test('should not allow access to init page without authentication', async ({ page }) => {
      await page.goto('/init');

      // Should be on init page
      await expect(page.locator('h2')).toContainText('Sign In');
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state while checking authentication', async ({ page }) => {
      // Set up interceptor BEFORE any navigation to delay refresh token mutation
      await page.route('**/graphql', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        // Check if this is a refreshToken mutation
        if (postData?.operationName === 'RefreshToken' || postData?.query?.includes('refreshToken')) {
          // Delay the refresh token response by 500ms
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        await route.continue();
      });

      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'user1@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

      // Manipulate the stored JWT token to be expired
      await page.evaluate(() => {
        const tokensJson = localStorage.getItem('2ly_auth_tokens');
        if (tokensJson) {
          const tokens = JSON.parse(tokensJson);

          // Decode the access token payload
          const parts = tokens.accessToken.split('.');
          if (parts.length === 3) {
            // Decode payload
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

            // Set expiry to 5 seconds ago
            payload.exp = Math.floor(Date.now() / 1000) - 5;

            // Re-encode the payload
            const newPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            // Reconstruct the token (signature will be invalid but we're only checking expiry)
            tokens.accessToken = `${parts[0]}.${newPayload}.${parts[2]}`;

            // Save back to localStorage
            localStorage.setItem('2ly_auth_tokens', JSON.stringify(tokens));
          }
        }
      });

      const loading = page.locator('p:has-text("Loading...")');

      // Reload and immediately check for loading state
      const reloadPromise = page.reload();

      // The loading should appear (because token is expired and refresh is delayed)
      await expect(loading).toBeVisible({ timeout: 1000 });

      // Wait for reload to complete
      await reloadPromise;

      // Loading should eventually disappear
      await expect(loading).not.toBeVisible({ timeout: 5000 });
    });
  });
});
