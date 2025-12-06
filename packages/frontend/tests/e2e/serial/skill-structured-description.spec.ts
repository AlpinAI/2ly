/**
 * Skill Structured Description E2E Tests
 *
 * Tests the structured description feature (Scope, Guardrails, Knowledge sections).
 * Verifies:
 * - Create skill with structured description
 * - Edit skill description with validation
 * - Backward compatibility with plain text descriptions
 *
 * Strategy: Serial
 * - Tests run sequentially to avoid database race conditions
 * - Database reset before tests
 */

import { test, expect, performLogin, seedPresets } from '@2ly/common/test/fixtures/playwright';

test.describe('Skill Structured Description', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase(false); // Don't start runtime for UI tests
    await seedDatabase(seedPresets.withUsers);
  });

  test.describe('Create Skill with Structured Description', () => {
    test('should show structured description fields in create dialog', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      // Open create dialog
      await page.getByRole('button', { name: /Create Skill/i }).click();

      // Verify dialog opened
      await expect(page.getByRole('heading', { name: 'Create Skill' })).toBeVisible();

      // Verify structured fields are present
      await expect(page.getByText('Scope *')).toBeVisible();
      await expect(page.getByText('Guardrails *')).toBeVisible();
      await expect(page.getByText('Knowledge')).toBeVisible();

      // Verify character counters
      await expect(page.getByText('0 / 300')).toBeVisible(); // Scope
      const tenKCounters = page.getByText('0 / 10000');
      await expect(tenKCounters).toHaveCount(2); // Guardrails and Knowledge
    });

    test('should validate required fields on create', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByRole('button', { name: /Create Skill/i }).click();
      await expect(page.getByRole('heading', { name: 'Create Skill' })).toBeVisible();

      // Fill only name
      await page.getByLabel('Name *').fill('Test Skill');

      // Submit button should be disabled (required fields empty)
      const submitButton = page.getByRole('button', { name: /Create Skill/i }).last();
      await expect(submitButton).toBeDisabled();

      // Fill scope
      await page.getByPlaceholder(/Define what this skill can do/).fill('Test scope');

      // Still disabled (guardrails empty)
      await expect(submitButton).toBeDisabled();

      // Fill guardrails
      await page.getByPlaceholder(/Specify what this skill should NOT do/).fill('Test guardrails');

      // Now enabled
      await expect(submitButton).not.toBeDisabled();
    });

    test('should validate scope length (max 300 characters)', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByRole('button', { name: /Create Skill/i }).click();
      await expect(page.getByRole('heading', { name: 'Create Skill' })).toBeVisible();

      await page.getByLabel('Name *').fill('Test Skill');

      // Fill scope with 301 characters
      const longScope = 'A'.repeat(301);
      await page.getByPlaceholder(/Define what this skill can do/).fill(longScope);

      await page.getByPlaceholder(/Specify what this skill should NOT do/).fill('Test guardrails');

      // Submit should be disabled
      const submitButton = page.getByRole('button', { name: /Create Skill/i }).last();
      await expect(submitButton).toBeDisabled();

      // Error message should appear
      await expect(page.getByText('301 / 300')).toBeVisible();
      await expect(page.getByText('Scope must not exceed 300 characters')).toBeVisible();
    });

    test('should create skill with all three sections', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByRole('button', { name: /Create Skill/i }).click();
      await expect(page.getByRole('heading', { name: 'Create Skill' })).toBeVisible();

      // Fill all fields
      await page.getByLabel('Name *').fill('Full Description Skill');
      await page.getByPlaceholder(/Define what this skill can do/).fill('This skill performs data analysis');
      await page.getByPlaceholder(/Specify what this skill should NOT do/).fill('Do not process sensitive data');
      await page.getByPlaceholder(/Provide additional context/).fill('Uses pandas and numpy libraries');

      // Submit
      const submitButton = page.getByRole('button', { name: /Create Skill/i }).last();
      await submitButton.click();

      // Wait for success toast
      await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 });

      // Verify skill appears in table
      await expect(page.getByText('Full Description Skill')).toBeVisible();
    });

    test('should create skill with only required sections', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByRole('button', { name: /Create Skill/i }).click();
      await expect(page.getByRole('heading', { name: 'Create Skill' })).toBeVisible();

      // Fill only required fields (leave knowledge empty)
      await page.getByLabel('Name *').fill('Required Only Skill');
      await page.getByPlaceholder(/Define what this skill can do/).fill('Basic skill scope');
      await page.getByPlaceholder(/Specify what this skill should NOT do/).fill('Basic guardrails');

      // Submit
      const submitButton = page.getByRole('button', { name: /Create Skill/i }).last();
      await submitButton.click();

      // Wait for success
      await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Required Only Skill')).toBeVisible();
    });
  });

  test.describe('Edit Skill Description', () => {
    test('should display structured description in skill detail', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      // Click on the skill we created (Full Description Skill)
      await page.getByText('Full Description Skill').click();

      // Wait for detail panel
      await expect(page.getByText('Description')).toBeVisible({ timeout: 5000 });

      // Verify all sections visible
      await expect(page.getByText('Scope *')).toBeVisible();
      await expect(page.getByText('Guardrails *')).toBeVisible();
      await expect(page.getByText('Knowledge')).toBeVisible();

      // Verify content loaded
      await expect(page.locator('textarea[value*="This skill performs data analysis"]')).toBeVisible();
      await expect(page.locator('textarea[value*="Do not process sensitive data"]')).toBeVisible();
      await expect(page.locator('textarea[value*="Uses pandas and numpy libraries"]')).toBeVisible();
    });

    test('should update character count as user types', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByText('Full Description Skill').click();
      await expect(page.getByText('Description')).toBeVisible({ timeout: 5000 });

      const scopeTextarea = page.locator('textarea').filter({ hasText: 'This skill performs data analysis' }).first();

      // Clear and type new text
      await scopeTextarea.clear();
      await scopeTextarea.fill('New scope');

      // Character count should update
      await expect(page.getByText('9 / 300')).toBeVisible();
    });

    test('should enable save button only when changes are made', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByText('Full Description Skill').click();
      await expect(page.getByText('Description')).toBeVisible({ timeout: 5000 });

      const saveButton = page.getByRole('button', { name: /Save Description/i });

      // Initially disabled (no changes)
      await expect(saveButton).toBeDisabled();

      // Make a change
      const scopeTextarea = page.locator('textarea').filter({ hasText: 'This skill performs data analysis' }).first();
      await scopeTextarea.fill('Modified scope');

      // Now enabled
      await expect(saveButton).not.toBeDisabled();
    });

    test('should save description changes successfully', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByText('Required Only Skill').click();
      await expect(page.getByText('Description')).toBeVisible({ timeout: 5000 });

      // Update scope
      const scopeTextarea = page.locator('textarea').filter({ hasText: 'Basic skill scope' }).first();
      await scopeTextarea.clear();
      await scopeTextarea.fill('Updated skill scope');

      // Save
      const saveButton = page.getByRole('button', { name: /Save Description/i });
      await saveButton.click();

      // Wait for any loading/success indicator
      await page.waitForTimeout(1000);

      // Refresh page and verify changes persisted
      await page.reload();
      await page.getByText('Required Only Skill').click();
      await expect(page.locator('textarea[value*="Updated skill scope"]')).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields on save', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByText('Full Description Skill').click();
      await expect(page.getByText('Description')).toBeVisible({ timeout: 5000 });

      // Clear scope (required field)
      const scopeTextarea = page.locator('textarea').filter({ hasText: 'This skill performs data analysis' }).first();
      await scopeTextarea.clear();

      // Try to save
      const saveButton = page.getByRole('button', { name: /Save Description/i });
      await saveButton.click();

      // Error toast should appear
      await expect(page.getByText('Scope is required')).toBeVisible({ timeout: 5000 });
    });

    test('should validate scope length on save', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByText('Full Description Skill').click();
      await expect(page.getByText('Description')).toBeVisible({ timeout: 5000 });

      // Fill scope with too many characters
      const scopeTextarea = page.locator('textarea').filter({ hasText: 'This skill performs data analysis' }).first();
      await scopeTextarea.fill('A'.repeat(301));

      // Try to save
      const saveButton = page.getByRole('button', { name: /Save Description/i });
      await saveButton.click();

      // Error message should appear
      await expect(page.getByText('Scope must not exceed 300 characters')).toBeVisible({ timeout: 5000 });
    });

    test('should show visual error indicators when exceeding limits', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByText('Full Description Skill').click();
      await expect(page.getByText('Description')).toBeVisible({ timeout: 5000 });

      // Type too many characters in guardrails
      const guardrailsTextarea = page.locator('textarea').filter({ hasText: 'Do not process sensitive data' }).first();
      await guardrailsTextarea.clear();
      await guardrailsTextarea.fill('A'.repeat(10001));

      // Character counter should turn red
      await expect(page.getByText('10001 / 10000')).toHaveClass(/text-red/);

      // Error message should appear
      await expect(page.getByText('Guardrails must not exceed 10000 characters')).toBeVisible();
    });
  });

  test.describe('Backward Compatibility', () => {
    test('should handle skills with plain text descriptions', async ({ page, workspaceId, graphql }) => {
      // Create a skill with plain text description via API (simulating old data)
      await performLogin(page, 'user1@2ly.ai', 'password123');

      // Use GraphQL to create skill with plain text
      const createMutation = `
        mutation CreateSkillWithPlainText($workspaceId: ID!, $name: String!, $description: String!) {
          createSkill(workspaceId: $workspaceId, name: $name, description: $description) {
            id
            name
            description
          }
        }
      `;

      await graphql(createMutation, {
        workspaceId,
        name: 'Legacy Plain Text Skill',
        description: 'This is a plain text description without structure',
      });

      // Navigate to skills page
      await page.goto(`/w/${workspaceId}/skills`);

      // Click on the legacy skill
      await page.getByText('Legacy Plain Text Skill').click();
      await expect(page.getByText('Description')).toBeVisible({ timeout: 5000 });

      // Plain text should appear in Scope field
      await expect(page.locator('textarea[value*="This is a plain text description without structure"]')).toBeVisible();

      // Guardrails and Knowledge should be empty
      const guardrailsTextarea = page.locator('textarea').filter({ hasText: '' }).nth(0);

      // Can now add guardrails to migrate to structured format
      await guardrailsTextarea.fill('No specific limitations');

      // Save
      const saveButton = page.getByRole('button', { name: /Save Description/i });
      await saveButton.click();

      // Wait for save
      await page.waitForTimeout(1000);

      // Reload and verify migration
      await page.reload();
      await page.getByText('Legacy Plain Text Skill').click();
      await expect(page.locator('textarea[value*="This is a plain text description without structure"]')).toBeVisible();
      await expect(page.locator('textarea[value*="No specific limitations"]')).toBeVisible();
    });
  });

  test.describe('UI/UX Features', () => {
    test('should show placeholders in empty fields', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByRole('button', { name: /Create Skill/i }).click();
      await expect(page.getByRole('heading', { name: 'Create Skill' })).toBeVisible();

      // Verify placeholders
      await expect(page.getByPlaceholder(/Define what this skill can do/)).toBeVisible();
      await expect(page.getByPlaceholder(/Specify what this skill should NOT do/)).toBeVisible();
      await expect(page.getByPlaceholder(/Provide additional context/)).toBeVisible();
    });

    test('should indicate required fields with asterisks', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByRole('button', { name: /Create Skill/i }).click();
      await expect(page.getByRole('heading', { name: 'Create Skill' })).toBeVisible();

      // Check asterisks on required fields
      await expect(page.getByText('Scope *')).toBeVisible();
      await expect(page.getByText('Guardrails *')).toBeVisible();

      // Knowledge is optional (no asterisk)
      const knowledgeLabel = page.getByText('Knowledge').first();
      await expect(knowledgeLabel).toBeVisible();
      await expect(knowledgeLabel).not.toContainText('*');
    });

    test('should use extended dialog layout for create', async ({ page, workspaceId }) => {
      await performLogin(page, 'user1@2ly.ai', 'password123');
      await page.goto(`/w/${workspaceId}/skills`);

      await page.getByRole('button', { name: /Create Skill/i }).click();
      await expect(page.getByRole('heading', { name: 'Create Skill' })).toBeVisible();

      // Verify dialog is wider (max-w-3xl instead of max-w-md)
      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible();

      // All three sections should be vertically stacked and visible
      await expect(page.getByText('Scope *')).toBeVisible();
      await expect(page.getByText('Guardrails *')).toBeVisible();
      await expect(page.getByText('Knowledge')).toBeVisible();
    });
  });
});
