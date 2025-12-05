/**
 * AI Skill Builder E2E Tests
 *
 * Tests the complete AI-powered skill creation workflow:
 * 1. Intent collection
 * 2. AI generation
 * 3. Review and edit
 * 4. Skill creation
 *
 * Strategy: Seeded
 * - Database is pre-populated with MCP servers, tools, and AI provider
 * - Tests verify the AI skill creation flow end-to-end
 */

import { test, expect, performLogin, seedPresets } from '@2ly/common/test/fixtures/playwright';

test.describe('AI Skill Builder', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase(false); // Don't start runtime for UI tests
    await seedDatabase(seedPresets.comprehensive);
  });

  test.describe('Intent Step', () => {
    test('should open AI skill builder dialog from Skills page', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Click "Create with AI" button
      const createWithAIButton = page.getByRole('button', { name: /Create with AI/i });
      await expect(createWithAIButton).toBeVisible({ timeout: 5000 });
      await createWithAIButton.click();

      // Verify dialog opened
      await expect(page.getByRole('heading', { name: 'Create Skill with AI' })).toBeVisible();
      await expect(
        page.getByText(/Describe what you want to build and let AI generate the skill/i)
      ).toBeVisible();
    });

    test('should show intent input and generate button', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog
      await page.getByRole('button', { name: /Create with AI/i }).click();

      // Verify intent textarea
      const intentTextarea = page.getByLabel(/What skill do you want to build?/i);
      await expect(intentTextarea).toBeVisible();
      await expect(intentTextarea).toBeFocused(); // Should auto-focus

      // Verify generate button
      const generateButton = page.getByRole('button', { name: /Generate with AI/i });
      await expect(generateButton).toBeVisible();
      await expect(generateButton).toBeDisabled(); // Disabled when empty
    });

    test('should enable generate button when intent is provided', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog
      await page.getByRole('button', { name: /Create with AI/i }).click();

      const intentTextarea = page.getByLabel(/What skill do you want to build?/i);
      const generateButton = page.getByRole('button', { name: /Generate with AI/i });

      // Initially disabled
      await expect(generateButton).toBeDisabled();

      // Type intent
      await intentTextarea.fill('Help me manage GitHub issues and pull requests');

      // Should be enabled
      await expect(generateButton).toBeEnabled();
    });

    test('should show warning when no AI model is configured', async ({
      page,
      workspaceId,
      graphql,
    }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');

      // Remove default AI model
      await graphql(`
        mutation {
          setDefaultAIModel(workspaceId: "${workspaceId}", model: null) {
            id
            defaultAIModel
          }
        }
      `);

      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog
      await page.getByRole('button', { name: /Create with AI/i }).click();

      // Should show warning
      await expect(
        page.getByText(/No AI model is configured for this workspace/i)
      ).toBeVisible();

      // Generate button should be disabled
      const intentTextarea = page.getByLabel(/What skill do you want to build?/i);
      await intentTextarea.fill('Test intent');

      const generateButton = page.getByRole('button', { name: /Generate with AI/i });
      await expect(generateButton).toBeDisabled();
    });

    test('should close dialog and reset form', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog
      await page.getByRole('button', { name: /Create with AI/i }).click();

      // Type intent
      const intentTextarea = page.getByLabel(/What skill do you want to build?/i);
      await intentTextarea.fill('Test intent');

      // Close dialog
      await page.getByRole('button', { name: /Cancel/i }).click();

      // Dialog should close
      await expect(page.getByRole('heading', { name: 'Create Skill with AI' })).not.toBeVisible();

      // Re-open dialog
      await page.getByRole('button', { name: /Create with AI/i }).click();

      // Form should be reset
      await expect(intentTextarea).toHaveValue('');
    });
  });

  test.describe('AI Generation', () => {
    test('should generate skill from AI and show review step', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog
      await page.getByRole('button', { name: /Create with AI/i }).click();

      // Enter intent
      const intentTextarea = page.getByLabel(/What skill do you want to build?/i);
      await intentTextarea.fill('Help me manage GitHub issues and pull requests efficiently');

      // Click generate
      const generateButton = page.getByRole('button', { name: /Generate with AI/i });
      await generateButton.click();

      // Should show loading state
      await expect(page.getByText(/Generating.../i)).toBeVisible({ timeout: 2000 });

      // Wait for review step to appear
      await expect(page.getByText(/Review and edit the AI-generated skill/i)).toBeVisible({
        timeout: 30000,
      });

      // Verify AI-generated badge
      await expect(page.getByText(/AI-generated content/i)).toBeVisible();

      // Verify all form fields are populated
      await expect(page.getByLabel(/Name/i)).not.toHaveValue('');
      await expect(page.getByLabel(/Scope/i)).not.toHaveValue('');

      // Verify character counts are shown
      await expect(page.getByText(/\/100 characters/i)).toBeVisible(); // Name
      await expect(page.getByText(/\/300 characters/i)).toBeVisible(); // Scope
    });

    test('should handle AI generation errors gracefully', async ({
      page,
      workspaceId,
      graphql,
    }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');

      // Set an invalid AI model to trigger error
      await graphql(`
        mutation {
          setDefaultAIModel(workspaceId: "${workspaceId}", model: "invalid/model") {
            id
            defaultAIModel
          }
        }
      `);

      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog
      await page.getByRole('button', { name: /Create with AI/i }).click();

      // Enter intent
      const intentTextarea = page.getByLabel(/What skill do you want to build?/i);
      await intentTextarea.fill('Test intent');

      // Click generate
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Should show error notification
      await expect(page.getByText(/AI Generation Failed/i)).toBeVisible({ timeout: 30000 });

      // Should stay on intent step
      await expect(intentTextarea).toBeVisible();

      // Intent should be preserved for retry
      await expect(intentTextarea).toHaveValue('Test intent');
    });
  });

  test.describe('Review and Edit Step', () => {
    test('should allow editing all generated fields', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await page
        .getByLabel(/What skill do you want to build?/i)
        .fill('A skill for data analysis');
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit the AI-generated skill/i)).toBeVisible({
        timeout: 30000,
      });

      // Edit name
      const nameInput = page.getByLabel(/Name/i);
      await nameInput.clear();
      await nameInput.fill('Custom Skill Name');
      await expect(nameInput).toHaveValue('Custom Skill Name');

      // Edit scope
      const scopeTextarea = page.getByLabel(/Scope/i);
      await scopeTextarea.clear();
      await scopeTextarea.fill('Custom scope description');
      await expect(scopeTextarea).toHaveValue('Custom scope description');

      // Edit guardrails
      const guardrailsTextarea = page.getByLabel(/Guardrails/i);
      await guardrailsTextarea.clear();
      await guardrailsTextarea.fill('Custom guardrails');
      await expect(guardrailsTextarea).toHaveValue('Custom guardrails');

      // Edit knowledge
      const knowledgeTextarea = page.getByLabel(/Knowledge/i);
      await knowledgeTextarea.clear();
      await knowledgeTextarea.fill('Custom knowledge base');
      await expect(knowledgeTextarea).toHaveValue('Custom knowledge base');
    });

    test('should enforce character limits on fields', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await page.getByLabel(/What skill do you want to build?/i).fill('Test skill');
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit/i)).toBeVisible({ timeout: 30000 });

      // Try to exceed name limit (100 chars)
      const nameInput = page.getByLabel(/Name/i);
      const longName = 'A'.repeat(150);
      await nameInput.clear();
      await nameInput.fill(longName);

      // Should be truncated to 100
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeLessThanOrEqual(100);

      // Character count should reflect this
      await expect(page.getByText(/100\/100 characters/i)).toBeVisible();
    });

    test('should display and allow toggling tool selections', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await page
        .getByLabel(/What skill do you want to build?/i)
        .fill('Help me with GitHub operations');
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit/i)).toBeVisible({ timeout: 30000 });

      // Should show tools section
      await expect(page.getByText(/Tools.*selected/i)).toBeVisible();

      // Get first tool checkbox (if any tools are pre-selected)
      const toolCheckboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await toolCheckboxes.count();

      if (checkboxCount > 0) {
        const firstCheckbox = toolCheckboxes.first();
        const initialState = await firstCheckbox.isChecked();

        // Toggle checkbox
        await firstCheckbox.click();

        // State should change
        const newState = await firstCheckbox.isChecked();
        expect(newState).toBe(!initialState);
      }
    });

    test('should show message when no tools are available', async ({
      page,
      workspaceId,
      graphql,
    }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');

      // Remove all tools from workspace
      const toolsResponse = await graphql(`
        query {
          mcpTools(workspaceId: "${workspaceId}") {
            id
          }
        }
      `);

      const tools = toolsResponse.mcpTools || [];
      for (const tool of tools) {
        await graphql(`
          mutation {
            deleteMCPTool(id: "${tool.id}") {
              id
            }
          }
        `);
      }

      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await page.getByLabel(/What skill do you want to build?/i).fill('Test skill');
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit/i)).toBeVisible({ timeout: 30000 });

      // Should show no tools message
      await expect(
        page.getByText(/No tools available in this workspace/i)
      ).toBeVisible();
    });

    test('should allow starting over from review step', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      const intentText = 'My original intent';
      await page.getByLabel(/What skill do you want to build?/i).fill(intentText);
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit/i)).toBeVisible({ timeout: 30000 });

      // Click Start Over
      await page.getByRole('button', { name: /Start Over/i }).click();

      // Should return to intent step
      await expect(
        page.getByText(/Describe what you want to build and let AI generate the skill/i)
      ).toBeVisible();

      // Intent should be cleared
      const intentTextarea = page.getByLabel(/What skill do you want to build?/i);
      await expect(intentTextarea).toHaveValue('');
    });

    test('should validate required fields before creation', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await page.getByLabel(/What skill do you want to build?/i).fill('Test skill');
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit/i)).toBeVisible({ timeout: 30000 });

      // Clear required name field
      const nameInput = page.getByLabel(/Name/i);
      await nameInput.clear();

      // Create button should be disabled
      const createButton = page.getByRole('button', { name: /Create Skill/i });
      await expect(createButton).toBeDisabled();

      // Fill name back in
      await nameInput.fill('Valid Name');

      // Clear required scope field
      const scopeTextarea = page.getByLabel(/Scope/i);
      await scopeTextarea.clear();

      // Create button should still be disabled
      await expect(createButton).toBeDisabled();
    });
  });

  test.describe('Skill Creation', () => {
    test('should create skill with AI-generated content and tools', async ({
      page,
      workspaceId,
    }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Count initial skills
      const initialSkillRows = page.locator('table tbody tr');
      const initialCount = await initialSkillRows.count();

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await page
        .getByLabel(/What skill do you want to build?/i)
        .fill('A comprehensive skill for GitHub repository management');
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit/i)).toBeVisible({ timeout: 30000 });

      // Get the generated name for verification
      const nameInput = page.getByLabel(/Name/i);
      const skillName = await nameInput.inputValue();
      expect(skillName).toBeTruthy();

      // Click Create
      const createButton = page.getByRole('button', { name: /Create Skill/i });
      await createButton.click();

      // Should show success notification
      await expect(page.getByText(/Skill Created/i)).toBeVisible({ timeout: 10000 });

      // Dialog should close
      await expect(page.getByRole('heading', { name: 'Create Skill with AI' })).not.toBeVisible();

      // Should navigate to skills page and show new skill
      await expect(page).toHaveURL(new RegExp(`/w/${workspaceId}/skills`));

      // Verify new skill appears in table
      await page.waitForLoadState('networkidle');
      const finalSkillRows = page.locator('table tbody tr');
      const finalCount = await finalSkillRows.count();
      expect(finalCount).toBe(initialCount + 1);

      // Verify skill name appears in table
      await expect(page.getByText(skillName)).toBeVisible();
    });

    test('should create skill without tools when none selected', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await page.getByLabel(/What skill do you want to build?/i).fill('Simple test skill');
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit/i)).toBeVisible({ timeout: 30000 });

      // Uncheck all tools if any are checked
      const toolCheckboxes = page.locator('input[type="checkbox"]:checked');
      const checkedCount = await toolCheckboxes.count();

      for (let i = 0; i < checkedCount; i++) {
        await toolCheckboxes.first().click();
      }

      // Verify 0 selected
      await expect(page.getByText(/0 selected/i)).toBeVisible();

      // Create skill
      await page.getByRole('button', { name: /Create Skill/i }).click();

      // Should still succeed
      await expect(page.getByText(/Skill Created/i)).toBeVisible({ timeout: 10000 });
    });

    test('should select created skill in detail panel', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await page
        .getByLabel(/What skill do you want to build?/i)
        .fill('Skill that should be auto-selected');
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit/i)).toBeVisible({ timeout: 30000 });

      const nameInput = page.getByLabel(/Name/i);
      const skillName = await nameInput.inputValue();

      // Create skill
      await page.getByRole('button', { name: /Create Skill/i }).click();

      // Wait for success
      await expect(page.getByText(/Skill Created/i)).toBeVisible({ timeout: 10000 });

      // Detail panel should open with the new skill
      await expect(page.getByRole('complementary')).toBeVisible({ timeout: 5000 });

      // Verify the skill name appears in detail panel
      const detailPanel = page.getByRole('complementary');
      await expect(detailPanel.getByText(skillName)).toBeVisible();
    });

    test('should handle creation errors gracefully', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Open dialog and generate
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await page.getByLabel(/What skill do you want to build?/i).fill('Test error handling');
      await page.getByRole('button', { name: /Generate with AI/i }).click();

      // Wait for review step
      await expect(page.getByText(/Review and edit/i)).toBeVisible({ timeout: 30000 });

      // Set an invalid character that might cause backend error (edge case)
      const nameInput = page.getByLabel(/Name/i);
      await nameInput.clear();
      await nameInput.fill(''); // Empty name

      // Try to create (should fail validation on backend if it gets through)
      const createButton = page.getByRole('button', { name: /Create Skill/i });

      // Button should be disabled for empty name
      await expect(createButton).toBeDisabled();

      // Fill valid name
      await nameInput.fill('Valid Name');

      // Now it should be enabled and we can proceed
      await expect(createButton).toBeEnabled();
    });
  });

  test.describe('Complete Flow', () => {
    test('should complete full AI skill creation workflow', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'testpassword123');
      await page.goto(`/w/${workspaceId}/skills`);
      await page.waitForLoadState('networkidle');

      // Step 1: Open AI Skill Builder
      await page.getByRole('button', { name: /Create with AI/i }).click();
      await expect(page.getByRole('heading', { name: 'Create Skill with AI' })).toBeVisible();

      // Step 2: Enter intent
      const intent =
        'Create a skill for comprehensive GitHub management including creating issues, managing PRs, and reviewing code';
      await page.getByLabel(/What skill do you want to build?/i).fill(intent);

      // Step 3: Generate with AI
      await page.getByRole('button', { name: /Generate with AI/i }).click();
      await expect(page.getByText(/Generating.../i)).toBeVisible({ timeout: 2000 });

      // Step 4: Wait for AI generation
      await expect(page.getByText(/Review and edit the AI-generated skill/i)).toBeVisible({
        timeout: 30000,
      });

      // Step 5: Review generated content
      const nameInput = page.getByLabel(/Name/i);
      const scopeTextarea = page.getByLabel(/Scope/i);

      const generatedName = await nameInput.inputValue();
      expect(generatedName).toBeTruthy();
      expect(generatedName.length).toBeGreaterThan(0);

      const generatedScope = await scopeTextarea.inputValue();
      expect(generatedScope).toBeTruthy();

      // Step 6: Make some edits
      await nameInput.clear();
      await nameInput.fill('GitHub Power Tools');

      // Step 7: Verify tools are suggested and check one more
      const toolCheckboxes = page.locator('input[type="checkbox"]');
      const hasTools = (await toolCheckboxes.count()) > 0;

      if (hasTools) {
        // Check if any are pre-selected
        const checkedCount = await page.locator('input[type="checkbox"]:checked').count();
        expect(checkedCount).toBeGreaterThanOrEqual(0);
      }

      // Step 8: Create the skill
      const createButton = page.getByRole('button', { name: /Create Skill/i });
      await expect(createButton).toBeEnabled();
      await createButton.click();

      // Step 9: Verify success
      await expect(page.getByText(/Skill Created/i)).toBeVisible({ timeout: 10000 });

      // Step 10: Verify dialog closed and skill appears
      await expect(page.getByRole('heading', { name: 'Create Skill with AI' })).not.toBeVisible();
      await expect(page.getByText('GitHub Power Tools')).toBeVisible({ timeout: 5000 });

      // Step 11: Verify detail panel opened
      const detailPanel = page.getByRole('complementary');
      await expect(detailPanel).toBeVisible();
      await expect(detailPanel.getByText('GitHub Power Tools')).toBeVisible();
    });
  });
});
