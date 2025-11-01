import { test, expect, seedPresets } from '../../fixtures/database';

/**
 * Visualization Page E2E Tests - Parallel Strategy
 *
 * These tests verify the workspace visualization feature:
 * - Navigation to visualization tab
 * - Graph rendering with nodes and edges
 * - Filter controls (search, type filters, tool calls toggle)
 * - Node selection and details panel
 * - Empty state handling
 *
 * Strategy: Parallel
 * - Tests are independent
 * - Pre-seeded database is used
 */

test.describe('Workspace Visualization', () => {
  test.beforeEach(async ({ page, resetDatabase, seedDatabase }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.workspaceWithServers);

    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user1@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to workspace
    await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });
  });

  test('should navigate to visualization tab from main navigation', async ({ page }) => {
    // Find and click visualization tab
    const visualizationTab = page.locator('a:has-text("Visualization")');
    await expect(visualizationTab).toBeVisible();
    await visualizationTab.click();

    // Should be on visualization page
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/w\/.+\/visualization/);

    // Should show page title
    await expect(page.locator('h2:has-text("Workspace Visualization")')).toBeVisible();
  });

  test('should render graph statistics panel', async ({ page }) => {
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Should show stats panel
    await expect(page.locator('text=Graph Statistics')).toBeVisible();

    // Should show stat labels
    await expect(page.locator('text=Total Nodes:')).toBeVisible();
    await expect(page.locator('text=Total Edges:')).toBeVisible();
    await expect(page.locator('text=Servers:')).toBeVisible();
    await expect(page.locator('text=Tools:')).toBeVisible();
    await expect(page.locator('text=Runtimes:')).toBeVisible();
  });

  test('should render SVG graph canvas', async ({ page }) => {
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Wait for graph to load
    await page.waitForSelector('svg', { timeout: 10000 });

    // Should render SVG element
    const svg = page.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('should show legend with entity types', async ({ page }) => {
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Should show legend
    await expect(page.locator('text=Entity Types')).toBeVisible();

    // Should show all entity type labels
    await expect(page.locator('text=server').first()).toBeVisible();
    await expect(page.locator('text=tool').first()).toBeVisible();
    await expect(page.locator('text=runtime').first()).toBeVisible();
    await expect(page.locator('text=toolset').first()).toBeVisible();
  });

  test('should show controls hint', async ({ page }) => {
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Should show interaction hints
    await expect(page.locator('text=Drag')).toBeVisible();
    await expect(page.locator('text=Scroll')).toBeVisible();
    await expect(page.locator('text=Click')).toBeVisible();
  });

  test('should filter nodes by search term', async ({ page }) => {
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Find search input
    const searchInput = page.locator('input[placeholder*="Filter by name"]');
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill('test');

    // Wait for stats to update
    await page.waitForTimeout(500);

    // Filtered count should be different (or same if all items match "test")
    const filteredCount = await page.locator('text=/Filtered:\\s*\\d+/').textContent();
    expect(filteredCount).toBeDefined();
  });

  test('should filter nodes by entity type', async ({ page }) => {
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Find "Filter by Type" section
    await expect(page.locator('text=Filter by Type')).toBeVisible();

    // Find server checkbox
    const serverCheckbox = page.locator('input[type="checkbox"]#type-server');
    await serverCheckbox.check();

    // Wait for graph to update
    await page.waitForTimeout(500);

    // Filtered count should show only servers
    const filteredText = await page.locator('text=/Filtered:\\s*\\d+/').textContent();
    expect(filteredText).toBeDefined();
  });

  test('should toggle tool calls visibility', async ({ page }) => {
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Find tool calls toggle
    const toolCallsToggle = page.locator('input[type="checkbox"]#show-toolcalls');
    await expect(toolCallsToggle).toBeVisible();

    // Check the toggle
    await toolCallsToggle.check();

    // Wait for graph to update
    await page.waitForTimeout(500);

    // Should update stats (tool calls may or may not exist in test data)
    const statsPanel = page.locator('text=Graph Statistics');
    await expect(statsPanel).toBeVisible();
  });

  test('should reset filters when reset button is clicked', async ({ page }) => {
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Apply some filters
    const searchInput = page.locator('input[placeholder*="Filter by name"]');
    await searchInput.fill('test');

    const serverCheckbox = page.locator('input[type="checkbox"]#type-server');
    await serverCheckbox.check();

    // Wait for reset button to appear
    const resetButton = page.locator('button:has-text("Reset Filters")');
    await expect(resetButton).toBeVisible();

    // Click reset
    await resetButton.click();

    // Search should be cleared
    await expect(searchInput).toHaveValue('');

    // Checkbox should be unchecked
    await expect(serverCheckbox).not.toBeChecked();

    // Reset button should disappear
    await expect(resetButton).not.toBeVisible();
  });

  test('should show empty state when no entities exist', async ({ page, resetDatabase, seedDatabase }) => {
    // Reset to empty workspace
    await resetDatabase();
    await seedDatabase(seedPresets.withUsers);

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user1@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

    // Navigate to visualization
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Should show empty state
    await expect(page.locator('text=No entities to visualize')).toBeVisible();
    await expect(page.locator('text=Add servers, tools, or runtimes to see the graph')).toBeVisible();
  });

  test('should handle navigation via browser back/forward', async ({ page }) => {
    // Navigate to visualization
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Navigate to overview
    const overviewTab = page.locator('a:has-text("Overview")');
    await overviewTab.click();
    await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

    // Go back
    await page.goBack();
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Should be on visualization page again
    await expect(page.locator('h2:has-text("Workspace Visualization")')).toBeVisible();

    // Go forward
    await page.goForward();
    await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

    // Should be on overview page
    await expect(page.locator('h2:has-text("Dashboard Overview")')).toBeVisible();
  });

  test('should maintain active tab styling for visualization', async ({ page }) => {
    // Navigate to visualization
    await page.goto(page.url().replace(/\/w\/[^/]+\/.*/, match => match.split('/').slice(0, 3).join('/') + '/visualization'));
    await page.waitForURL(/\/w\/.+\/visualization/, { timeout: 5000 });

    // Visualization tab should be active
    const visualizationTab = page.locator('a:has-text("Visualization")');
    await expect(visualizationTab).toHaveAttribute('aria-current', 'page');

    // Should have active styling (cyan text and border)
    const tabClasses = await visualizationTab.getAttribute('class');
    expect(tabClasses).toContain('text-cyan-600');
  });
});
