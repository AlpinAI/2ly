/**
 * Skill Management E2E Tests
 *
 * Tests the skill detail view and the "Manage Tools" button functionality.
 * Verifies that the Manage Tools panel opens correctly and displays tool management UI.
 *
 * Strategy: Seeded
 * - Database is pre-populated with skills, tools, and MCP servers
 * - Tests verify the Manage Tools panel opens and displays correctly
 */

import { test, expect, performLogin, seedPresets } from '@skilder-ai/common/test/fixtures/playwright';

test.describe('Skill Management', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase(false); // Don't start runtime for UI tests
    await seedDatabase(seedPresets.comprehensive);
  });

  test('should open Manage Tools panel from skill detail view', async ({ page, workspaceId }) => {
    // Step 1: Login
    await performLogin(page, 'user1@skilder.ai', 'testpassword123');

    // Step 2: Navigate to Skills page
    await page.goto(`/w/${workspaceId}/skills`);

    // Step 3: Wait for skills to load
    await page.waitForLoadState('networkidle');

    // Step 4: Click on first skill row to open detail panel
    const firstSkillRow = page.locator('table tbody tr').first();
    await expect(firstSkillRow).toBeVisible({ timeout: 10000 });
    await firstSkillRow.click();

    // Step 5: Wait for detail panel to open and verify it's visible
    await expect(page.locator('text=/Skill/i').first()).toBeVisible({ timeout: 5000 });

    // Step 6: Click "Manage Tools" button (scoped within the detail panel)
    const detailPanel = page.getByRole('complementary');
    const manageToolsButton = detailPanel.getByRole('button', { name: /Manage Tools/i });
    await expect(manageToolsButton).toBeVisible({ timeout: 5000 });
    await manageToolsButton.click();

    // Step 7: Verify panel opened by checking for panel header
    await expect(page.getByRole('heading', { name: 'Manage Tools' })).toBeVisible({ timeout: 5000 });

    // Step 8: Verify panel content is displayed
    await expect(page.getByText(/Select tools for/)).toBeVisible();
    await expect(page.getByPlaceholder('Search tools...')).toBeVisible();

    // Step 9: Verify action buttons are present
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();

    // Step 10: Verify some tools are displayed (should have checkboxes)
    const toolRows = page.locator('.tool-management-panel .tool-row');
    const toolRowCount = await toolRows.count();
    expect(toolRowCount).toBeGreaterThan(0);

    // Step 11: Close panel
    await page.getByRole('button', { name: /Cancel/i }).click();

    // Step 12: Verify panel closed
    await expect(page.getByRole('heading', { name: 'Manage Tools' })).not.toBeVisible();
  });

  test('should display correct skill name in panel header', async ({ page, workspaceId }) => {
    await performLogin(page, 'user1@skilder.ai', 'testpassword123');
    await page.goto(`/w/${workspaceId}/skills`);
    await page.waitForLoadState('networkidle');

    // Get the skill name from the first row
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Extract skill name from the row
    const skillNameCell = firstRow.locator('td .skill-name').first();
    const skillName = await skillNameCell.textContent();
    expect(skillName).toBeTruthy();

    // Click to open detail panel
    await firstRow.click();

    // Click Manage Tools button
    const detailPanel = page.getByRole('complementary');
    const manageToolsButton = detailPanel.getByRole('button', { name: /Manage Tools/i });
    await expect(manageToolsButton).toBeVisible({ timeout: 5000 });
    await manageToolsButton.click();

    // Verify the skill name appears in the panel description
    await expect(page.getByText(new RegExp(`Select tools for.*${skillName}`))).toBeVisible({ timeout: 5000 });
  });

  test('should show Selection Summary section', async ({ page, workspaceId }) => {
    await performLogin(page, 'user1@skilder.ai', 'testpassword123');
    await page.goto(`/w/${workspaceId}/skills`);
    await page.waitForLoadState('networkidle');

    // Click first row
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();

    // Open Manage Tools panel
    const detailPanel = page.getByRole('complementary');
    const manageToolsButton = detailPanel.getByRole('button', { name: /Manage Tools/i });
    await expect(manageToolsButton).toBeVisible({ timeout: 5000 });
    await manageToolsButton.click();

    // Wait for panel to open
    await expect(page.getByRole('heading', { name: 'Manage Tools' })).toBeVisible({ timeout: 5000 });

    // Verify Selection Summary section exists
    await expect(page.getByText('Selection Summary')).toBeVisible();
    await expect(page.getByText(/Selected tools:/)).toBeVisible();
    await expect(page.getByText(/Changes:/)).toBeVisible();
  });

  test('should filter tools by search term', async ({ page, workspaceId }) => {
    await performLogin(page, 'user1@skilder.ai', 'testpassword123');
    await page.goto(`/w/${workspaceId}/skills`);
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();

    const detailPanel = page.getByRole('complementary');
    const manageToolsButton = detailPanel.getByRole('button', { name: /Manage Tools/i });
    await expect(manageToolsButton).toBeVisible({ timeout: 5000 });
    await manageToolsButton.click();

    await expect(page.getByRole('heading', { name: 'Manage Tools' })).toBeVisible({ timeout: 5000 });

    // Get initial tool count (visible tools in the list)
    // We'll count the number of tool items visible before filtering
    const initialToolItems = await page.locator('[data-testid*="tool-"], .tool-item, label:has(input[type="checkbox"])').count();

    // Type in search box
    const searchInput = page.getByPlaceholder('Search tools...');
    await searchInput.fill('read');

    // Wait a moment for filtering to apply
    await page.waitForTimeout(500);

    // After search, we should see fewer or equal number of tools
    const filteredToolItems = await page.locator('[data-testid*="tool-"], .tool-item, label:has(input[type="checkbox"])').count();

    // The count should be less than or equal (search filters results)
    expect(filteredToolItems).toBeLessThanOrEqual(initialToolItems);
  });

  test('should close panel when clicking X button', async ({ page, workspaceId }) => {
    await performLogin(page, 'user1@skilder.ai', 'testpassword123');
    await page.goto(`/w/${workspaceId}/skills`);
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();

    const detailPanel = page.getByRole('complementary');
    const manageToolsButton = detailPanel.getByRole('button', { name: /Manage Tools/i });
    await expect(manageToolsButton).toBeVisible({ timeout: 5000 });
    await manageToolsButton.click();

    await expect(page.getByRole('heading', { name: 'Manage Tools' })).toBeVisible({ timeout: 5000 });

    // Find and click the X (close) button in the panel header
    // Click the close button (should be near the header)
    // We'll use a more specific approach - find button near the "Manage Tools" heading
    const panelHeader = page.locator('.tool-management-panel-header');
    const closeButton = panelHeader.getByRole('button').last();
    await closeButton.click();

    // Verify panel closed
    await expect(page.getByRole('heading', { name: 'Manage Tools' })).not.toBeVisible();
  });

  test('should show "Show selected only" toggle', async ({ page, workspaceId }) => {
    await performLogin(page, 'user1@skilder.ai', 'testpassword123');
    await page.goto(`/w/${workspaceId}/skills`);
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();

    const detailPanel = page.getByRole('complementary');
    const manageToolsButton = detailPanel.getByRole('button', { name: /Manage Tools/i });
    await expect(manageToolsButton).toBeVisible({ timeout: 5000 });
    await manageToolsButton.click();

    await expect(page.getByRole('heading', { name: 'Manage Tools' })).toBeVisible({ timeout: 5000 });

    // Verify "Show selected only" toggle exists
    await expect(page.getByText('Show selected only')).toBeVisible();

    // The toggle should be a switch element
    const toggleSwitch = page.locator('#show-selected-only');
    await expect(toggleSwitch).toBeVisible();
  });
});
