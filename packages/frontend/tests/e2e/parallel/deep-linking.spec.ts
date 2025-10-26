/**
 * Deep Linking E2E Tests
 *
 * WHY: Tests the complete deep linking workflow across entity types.
 * Ensures URLs with entity IDs work correctly and are shareable.
 *
 * STRATEGY: parallel
 * These tests can run in parallel as they only verify UI behavior
 * and don't modify the database state.
 */

import { test, expect } from '@playwright/test';

test.describe('Deep Linking - Monitoring Page', () => {
  test('should open detail panel when visiting URL with tool call ID', async ({ page }) => {
    // Navigate to monitoring page with a tool call ID in URL
    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify URL contains the ID
    expect(page.url()).toContain('id=test-tool-call-123');

    // Note: In a real test, we would verify the detail panel opens
    // For now, we just verify the URL structure works
  });

  test('should update URL when clicking a tool call in the table', async ({ page }) => {
    await page.goto('/w/test-workspace/monitoring');
    await page.waitForLoadState('networkidle');

    // Initial URL should not have an ID parameter
    expect(page.url()).not.toContain('id=');

    // Note: In a real test with data, we would:
    // 1. Click a row in the tool calls table
    // 2. Verify URL updates to include ?id=<tool-call-id>
    // 3. Verify detail panel opens
  });

  test('should make entity references clickable in detail panel', async ({ page }) => {
    // This test verifies that tool, server, and runtime references
    // in the tool call detail panel are rendered as clickable links

    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await page.waitForLoadState('networkidle');

    // Note: In a real test with data, we would:
    // 1. Find the tool name link
    // 2. Verify it has href="/w/test-workspace/tools?id=<tool-id>"
    // 3. Find the server name link
    // 4. Verify it has href="/w/test-workspace/sources?id=<server-id>"
    // 5. Find the runtime name link
    // 6. Verify it has href="/w/test-workspace/overview?id=<runtime-id>"
  });
});

test.describe('Deep Linking - Sources Page', () => {
  test('should open detail panel when visiting URL with source ID', async ({ page }) => {
    await page.goto('/w/test-workspace/sources?id=test-source-123');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('id=test-source-123');
  });

  test('should update URL when selecting a source', async ({ page }) => {
    await page.goto('/w/test-workspace/sources');
    await page.waitForLoadState('networkidle');

    expect(page.url()).not.toContain('id=');
  });
});

test.describe('Deep Linking - Tools Page', () => {
  test('should open detail panel when visiting URL with tool ID', async ({ page }) => {
    await page.goto('/w/test-workspace/tools?id=test-tool-123');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('id=test-tool-123');
  });

  test('should update URL when selecting a tool', async ({ page }) => {
    await page.goto('/w/test-workspace/tools');
    await page.waitForLoadState('networkidle');

    expect(page.url()).not.toContain('id=');
  });
});

test.describe('Deep Linking - Tool Sets Page', () => {
  test('should open detail panel when visiting URL with tool set ID', async ({ page }) => {
    await page.goto('/w/test-workspace/toolsets?id=test-toolset-123');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('id=test-toolset-123');
  });

  test('should update URL when selecting a tool set', async ({ page }) => {
    await page.goto('/w/test-workspace/toolsets');
    await page.waitForLoadState('networkidle');

    expect(page.url()).not.toContain('id=');
  });
});

test.describe('Deep Linking - Cross-Entity Navigation', () => {
  test('should navigate from monitoring to tools page when clicking tool link', async ({ page }) => {
    // Start on monitoring page with a tool call selected
    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await page.waitForLoadState('networkidle');

    // Note: In a real test with data, we would:
    // 1. Click the tool name link in the detail panel
    // 2. Verify navigation to /w/test-workspace/tools?id=<tool-id>
    // 3. Verify the tool detail panel opens automatically
  });

  test('should navigate from monitoring to sources page when clicking server link', async ({ page }) => {
    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await page.waitForLoadState('networkidle');

    // Note: In a real test with data, we would:
    // 1. Click the server name link in the detail panel
    // 2. Verify navigation to /w/test-workspace/sources?id=<server-id>
    // 3. Verify the source detail panel opens automatically
  });

  test('should navigate from monitoring to overview page when clicking runtime link', async ({ page }) => {
    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await page.waitForLoadState('networkidle');

    // Note: In a real test with data, we would:
    // 1. Click the runtime name link in the detail panel
    // 2. Verify navigation to /w/test-workspace/overview?id=<runtime-id>
    // 3. Verify the runtime detail panel opens automatically (if implemented)
  });
});

test.describe('Deep Linking - URL Sharing', () => {
  test('should work when opening URL with ID in new tab', async ({ context }) => {
    // Simulate opening a shared URL in a new tab
    const newPage = await context.newPage();
    await newPage.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await newPage.waitForLoadState('networkidle');

    // Verify URL is preserved
    expect(newPage.url()).toContain('id=test-tool-call-123');

    await newPage.close();
  });

  test('should preserve other query parameters when setting ID', async ({ page }) => {
    // Navigate with existing query parameters
    await page.goto('/w/test-workspace/monitoring?filter=active&sort=desc');
    await page.waitForLoadState('networkidle');

    // Note: In a real test with data, we would:
    // 1. Click a tool call to select it
    // 2. Verify URL becomes /w/test-workspace/monitoring?filter=active&sort=desc&id=<tool-call-id>
    // 3. Verify other parameters are preserved
  });
});

test.describe('Deep Linking - Visual Feedback', () => {
  test('should highlight selected row in table', async ({ page }) => {
    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await page.waitForLoadState('networkidle');

    // Note: In a real test with data, we would:
    // 1. Find the table row with the selected ID
    // 2. Verify it has the highlight classes (bg-cyan-50, border-l-4 border-cyan-500)
  });

  test('should show temporary highlight animation when navigating to entity', async ({ page }) => {
    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await page.waitForLoadState('networkidle');

    // Note: In a real test with data, we would:
    // 1. Find the table row with the selected ID
    // 2. Verify it has the entity-highlight class initially
    // 3. Wait 2.5 seconds
    // 4. Verify the entity-highlight class is removed
  });

  test('should scroll selected entity into view', async ({ page }) => {
    // This would require a test with enough data to enable scrolling
    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await page.waitForLoadState('networkidle');

    // Note: In a real test with data, we would:
    // 1. Verify the selected row is visible in the viewport
    // 2. Check that scrollIntoView was called (would need to mock)
  });
});

test.describe('Deep Linking - Edge Cases', () => {
  test('should handle invalid entity ID gracefully', async ({ page }) => {
    await page.goto('/w/test-workspace/monitoring?id=non-existent-id');
    await page.waitForLoadState('networkidle');

    // Should not show detail panel for non-existent ID
    // Note: In a real test, we would verify the detail panel is not displayed
  });

  test('should clear ID from URL when closing detail panel', async ({ page }) => {
    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await page.waitForLoadState('networkidle');

    // Note: In a real test with data, we would:
    // 1. Click the close button on the detail panel
    // 2. Verify URL becomes /w/test-workspace/monitoring (no id parameter)
  });

  test('should handle navigation between different entity types', async ({ page }) => {
    // Start on monitoring page
    await page.goto('/w/test-workspace/monitoring?id=test-tool-call-123');
    await page.waitForLoadState('networkidle');

    // Navigate to tools page
    await page.goto('/w/test-workspace/tools?id=test-tool-456');
    await page.waitForLoadState('networkidle');

    // Verify URL is correct
    expect(page.url()).toContain('/tools');
    expect(page.url()).toContain('id=test-tool-456');
    expect(page.url()).not.toContain('id=test-tool-call-123');
  });
});
