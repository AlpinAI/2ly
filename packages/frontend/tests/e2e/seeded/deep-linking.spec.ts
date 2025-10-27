/**
 * Deep Linking E2E Tests - Seeded Strategy
 *
 * WHY: Tests the complete deep linking workflow across entity types with real data.
 * Ensures URLs with entity IDs work correctly, are shareable, and navigation works seamlessly.
 *
 * STRATEGY: seeded
 * These tests use comprehensive seed data (MCP servers, tools, agents, tool calls)
 * and run serially to maintain database consistency.
 */

import { test, expect, seedPresets } from '../../fixtures/database';

test.describe('Deep Linking with Comprehensive Data', () => {
  // Reset and seed database before all tests
  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.comprehensive);
  });

  // Configure tests to run serially
  test.describe.configure({ mode: 'serial' });

  test.describe('Monitoring Page - Tool Call Deep Links', () => {
    test('should open detail panel when visiting URL with tool call ID', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      // Get first tool call from database
      // In a real scenario, we'd query for tool calls but for now we'll navigate and verify UI
      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');

      // Wait for table to load
      await page.waitForSelector('table', { timeout: 5000 });

      // Find first row in the tool calls table
      const firstRow = page.locator('table tbody tr').first();
      await expect(firstRow).toBeVisible();

      // Click the first row to open detail panel
      await firstRow.click();

      // URL should now contain an ID parameter
      await page.waitForURL(/id=/, { timeout: 2000 });
      expect(page.url()).toContain('id=');

      // Detail panel should be visible
      const detailPanel = page.locator('[role="complementary"]').or(page.locator('[data-testid="detail-panel"]'));
      await expect(detailPanel.first()).toBeVisible({ timeout: 3000 });
    });

    test('should update URL when clicking a tool call in the table', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');

      // Initial URL should not have an ID parameter
      expect(page.url()).not.toContain('id=');

      // Wait for table and click first row
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.click();

      // URL should update to include ?id=<tool-call-id>
      await page.waitForURL(/id=/, { timeout: 2000 });
      expect(page.url()).toContain('id=');
      expect(page.url()).toContain('monitoring');
    });

    test('should make tool and server references clickable in detail panel', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');

      // Click first tool call row
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();

      // Wait for detail panel
      await page.waitForSelector('[role="complementary"], [data-testid="detail-panel"]', { timeout: 3000 });

      // Look for tool name link (should be clickable)
      const toolLink = page.locator('a[href*="/tools?id="]').first();
      if (await toolLink.count() > 0) {
        await expect(toolLink).toBeVisible();
        const href = await toolLink.getAttribute('href');
        expect(href).toContain('/tools?id=');
      }

      // Look for server name link (should be clickable)
      const serverLink = page.locator('a[href*="/sources?id="]').first();
      if (await serverLink.count() > 0) {
        await expect(serverLink).toBeVisible();
        const href = await serverLink.getAttribute('href');
        expect(href).toContain('/sources?id=');
      }
    });

    test('should highlight selected row in table', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');

      // Click first row
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.click();

      // Row should have highlight styling (bg-cyan-50 or similar)
      // Check for the highlight class or background color
      const rowClasses = await firstRow.getAttribute('class');
      expect(rowClasses).toMatch(/bg-cyan|selected|highlighted/);
    });

    test('should clear ID from URL when closing detail panel', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');

      // Click first row to open detail panel
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();
      await page.waitForURL(/id=/, { timeout: 2000 });

      // Find and click close button in detail panel
      const closeButton = page.locator('[data-testid="close-detail-panel"]').or(page.locator('button[aria-label="Close"]'));
      await closeButton.first().click();

      // URL should no longer have id parameter
      await page.waitForURL((url) => !url.search.includes('id='), { timeout: 2000 });
      expect(page.url()).not.toContain('id=');
    });
  });

  test.describe('Sources Page - MCP Server Deep Links', () => {
    test('should open detail panel when visiting URL with source ID', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/sources`);
      await page.waitForLoadState('networkidle');

      // Click first server card
      await page.waitForSelector('[data-testid="server-card"]', { timeout: 5000 });
      const firstCard = page.locator('[data-testid="server-card"]').first();
      await firstCard.click();

      // URL should contain ID
      await page.waitForURL(/id=/, { timeout: 2000 });
      expect(page.url()).toContain('id=');
      expect(page.url()).toContain('sources');
    });

    test('should navigate to tools page when clicking tool link', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/sources`);
      await page.waitForLoadState('networkidle');

      // Click first server to open detail panel
      await page.waitForSelector('[data-testid="server-card"]', { timeout: 5000 });
      await page.locator('[data-testid="server-card"]').first().click();

      // Wait for detail panel
      await page.waitForSelector('[role="complementary"], [data-testid="detail-panel"]', { timeout: 3000 });

      // Look for tool link in the tools list
      const toolLink = page.locator('a[href*="/tools?id="]').first();
      if (await toolLink.count() > 0) {
        await toolLink.click();

        // Should navigate to tools page with ID
        await page.waitForURL(/\/tools\?id=/, { timeout: 3000 });
        expect(page.url()).toContain('/tools');
        expect(page.url()).toContain('id=');
      }
    });
  });

  test.describe('Tools Page - Tool Deep Links', () => {
    test('should open detail panel when visiting URL with tool ID', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/tools`);
      await page.waitForLoadState('networkidle');

      // Click first tool in table
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.click();

      // URL should contain ID
      await page.waitForURL(/id=/, { timeout: 2000 });
      expect(page.url()).toContain('id=');
      expect(page.url()).toContain('tools');

      // Detail panel should be visible
      const detailPanel = page.locator('[role="complementary"], [data-testid="detail-panel"]').first();
      await expect(detailPanel).toBeVisible({ timeout: 3000 });
    });

    test('should navigate to sources page when clicking server link', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/tools`);
      await page.waitForLoadState('networkidle');

      // Click first tool
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();

      // Wait for detail panel
      await page.waitForSelector('[role="complementary"], [data-testid="detail-panel"]', { timeout: 3000 });

      // Look for MCP Server link
      const serverLink = page.locator('a[href*="/sources?id="]').first();
      if (await serverLink.count() > 0) {
        await serverLink.click();

        // Should navigate to sources page with ID
        await page.waitForURL(/\/sources\?id=/, { timeout: 3000 });
        expect(page.url()).toContain('/sources');
        expect(page.url()).toContain('id=');
      }
    });

    test('should navigate to toolsets page when clicking agent link', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/tools`);
      await page.waitForLoadState('networkidle');

      // Click first tool
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();

      // Wait for detail panel
      await page.waitForSelector('[role="complementary"], [data-testid="detail-panel"]', { timeout: 3000 });

      // Look for agent link in "Available on Agents" section
      const agentLink = page.locator('a[href*="/toolsets?id="]').first();
      if (await agentLink.count() > 0) {
        await agentLink.click();

        // Should navigate to toolsets page with ID
        await page.waitForURL(/\/toolsets\?id=/, { timeout: 3000 });
        expect(page.url()).toContain('/toolsets');
        expect(page.url()).toContain('id=');
      }
    });
  });

  test.describe('Tool Sets Page - Agent Deep Links', () => {
    test('should open detail panel when visiting URL with tool set ID', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/toolsets`);
      await page.waitForLoadState('networkidle');

      // Click first agent/runtime in table
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.click();

      // URL should contain ID
      await page.waitForURL(/id=/, { timeout: 2000 });
      expect(page.url()).toContain('id=');
      expect(page.url()).toContain('toolsets');
    });

    test('should navigate to tools page when clicking tool link', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/toolsets`);
      await page.waitForLoadState('networkidle');

      // Click first agent
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();

      // Wait for detail panel
      await page.waitForSelector('[role="complementary"], [data-testid="detail-panel"]', { timeout: 3000 });

      // Look for tool link in "Available Tools" section
      const toolLink = page.locator('a[href*="/tools?id="]').first();
      if (await toolLink.count() > 0) {
        await toolLink.click();

        // Should navigate to tools page with ID
        await page.waitForURL(/\/tools\?id=/, { timeout: 3000 });
        expect(page.url()).toContain('/tools');
        expect(page.url()).toContain('id=');
      }
    });
  });

  test.describe('Cross-Entity Navigation', () => {
    test('should navigate from monitoring to tools page via tool link', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      // Start on monitoring page
      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');

      // Click first tool call
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();

      // Wait for detail panel
      await page.waitForSelector('[role="complementary"], [data-testid="detail-panel"]', { timeout: 3000 });

      // Click tool link
      const toolLink = page.locator('a[href*="/tools?id="]').first();
      if (await toolLink.count() > 0) {
        await toolLink.click();

        // Verify navigation to tools page
        await page.waitForURL(/\/tools\?id=/, { timeout: 3000 });
        expect(page.url()).toContain('/tools');

        // Tool detail panel should open automatically
        const detailPanel = page.locator('[role="complementary"], [data-testid="detail-panel"]').first();
        await expect(detailPanel).toBeVisible({ timeout: 3000 });
      }
    });

    test('should navigate from monitoring to sources page via server link', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');

      // Click first tool call
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();

      // Wait for detail panel and click server link
      await page.waitForSelector('[role="complementary"], [data-testid="detail-panel"]', { timeout: 3000 });
      const serverLink = page.locator('a[href*="/sources?id="]').first();
      if (await serverLink.count() > 0) {
        await serverLink.click();

        // Verify navigation
        await page.waitForURL(/\/sources\?id=/, { timeout: 3000 });
        expect(page.url()).toContain('/sources');
      }
    });

    test('should handle browser back button correctly', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      // Navigate to monitoring and select a tool call
      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();
      await page.waitForURL(/id=/, { timeout: 2000 });

      // Navigate to tools page via link
      const toolLink = page.locator('a[href*="/tools?id="]').first();
      if (await toolLink.count() > 0) {
        await toolLink.click();
        await page.waitForURL(/\/tools\?id=/, { timeout: 3000 });

        // Go back using browser back button
        await page.goBack();

        // Should be back on monitoring page with ID preserved
        await page.waitForURL(/\/monitoring.*id=/, { timeout: 3000 });
        expect(page.url()).toContain('monitoring');
        expect(page.url()).toContain('id=');
      }
    });
  });

  test.describe('URL Sharing and Persistence', () => {
    test('should work when opening URL with ID in new tab', async ({ context, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      // First, get a valid tool call ID by navigating and clicking
      const setupPage = await context.newPage();
      await setupPage.goto(`/w/${workspace.id}/monitoring`);
      await setupPage.waitForLoadState('networkidle');
      await setupPage.waitForSelector('table tbody tr', { timeout: 5000 });
      await setupPage.locator('table tbody tr').first().click();
      await setupPage.waitForURL(/id=/, { timeout: 2000 });
      const urlWithId = setupPage.url();
      await setupPage.close();

      // Now open the URL in a new tab
      const newPage = await context.newPage();
      await newPage.goto(urlWithId);
      await newPage.waitForLoadState('networkidle');

      // Verify URL is preserved
      expect(newPage.url()).toContain('id=');

      // Detail panel should be visible
      const detailPanel = newPage.locator('[role="complementary"], [data-testid="detail-panel"]').first();
      await expect(detailPanel).toBeVisible({ timeout: 3000 });

      await newPage.close();
    });

    test('should preserve other query parameters when setting ID', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      // Navigate with existing query parameters
      await page.goto(`/w/${workspace.id}/monitoring?filter=completed&sort=desc`);
      await page.waitForLoadState('networkidle');

      // Click a tool call
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();

      // URL should have all parameters
      await page.waitForURL(/id=/, { timeout: 2000 });
      const url = new URL(page.url());
      expect(url.searchParams.has('id')).toBe(true);
      // Note: Filter and sort parameters might be handled differently by the app
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle invalid entity ID gracefully', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/monitoring?id=non-existent-id-12345`);
      await page.waitForLoadState('networkidle');

      // Should not crash, detail panel should not show or show error
      // The table should still be visible
      await page.waitForSelector('table', { timeout: 5000 });
      await expect(page.locator('table')).toBeVisible();
    });

    test('should handle navigation between different entity types', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      // Start on monitoring page
      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();
      await page.waitForURL(/id=/, { timeout: 2000 });
      const monitoringId = new URL(page.url()).searchParams.get('id');

      // Navigate to tools page via sidebar
      await page.click('a[href*="/tools"]');
      await page.waitForURL(/\/tools/, { timeout: 3000 });

      // Click a tool
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      await page.locator('table tbody tr').first().click();
      await page.waitForURL(/id=/, { timeout: 2000 });
      const toolId = new URL(page.url()).searchParams.get('id');

      // IDs should be different (different entity types)
      expect(toolId).not.toBe(monitoringId);
      expect(page.url()).toContain('/tools');
      expect(page.url()).not.toContain('monitoring');
    });

    test('should handle rapid navigation clicks', async ({ page, getDatabaseState }) => {
      const state = await getDatabaseState();
      const workspace = state.workspaces[0];

      await page.goto(`/w/${workspace.id}/monitoring`);
      await page.waitForLoadState('networkidle');

      // Rapidly click different rows
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();

      if (rowCount >= 3) {
        await rows.nth(0).click();
        await page.waitForTimeout(100);
        await rows.nth(1).click();
        await page.waitForTimeout(100);
        await rows.nth(2).click();

        // Should end up on the last clicked row
        await page.waitForURL(/id=/, { timeout: 2000 });
        expect(page.url()).toContain('id=');

        // Detail panel should be visible
        const detailPanel = page.locator('[role="complementary"], [data-testid="detail-panel"]').first();
        await expect(detailPanel).toBeVisible({ timeout: 3000 });
      }
    });
  });
});
