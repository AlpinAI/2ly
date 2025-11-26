/**
 * E2E Test: LLM API Keys Management
 *
 * Tests the complete BYOL (Bring Your Own License) workflow for LLM API keys.
 * This test is serial because it modifies workspace settings and relies on database state.
 *
 * Test Coverage:
 * - Navigation to LLM API Keys settings
 * - Adding API keys for different providers (OpenAI, Anthropic, Google)
 * - Key validation feedback
 * - Setting active keys
 * - Editing existing keys
 * - Deleting keys
 * - Provider-specific UI elements
 */

import { test, expect } from '@2ly/common/test/fixtures/playwright';

test.describe('LLM API Keys Management', () => {
  test.beforeAll(async ({ resetDatabase }) => {
    await resetDatabase();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the application and login
    await page.goto('/');

    // Wait for initialization or login if needed
    // This assumes you have an initialization flow or test user
    await page.waitForLoadState('networkidle');

    // Navigate to settings
    await page.click('text=Settings');
    await page.waitForURL('**/settings');

    // Click on LLM API Keys tab
    await page.click('text=LLM API Keys');
    await expect(page.locator('h3:text("LLM API Keys")')).toBeVisible();
  });

  test('should display empty state for each provider', async ({ page }) => {
    // OpenAI tab (default)
    await expect(page.locator('text=No OpenAI Keys')).toBeVisible();
    await expect(page.locator('button:text("Add OpenAI Key")')).toBeVisible();

    // Anthropic tab
    await page.click('[role="tab"]:text("Anthropic")');
    await expect(page.locator('text=No Anthropic Keys')).toBeVisible();

    // Google tab
    await page.click('[role="tab"]:text("Google")');
    await expect(page.locator('text=No Google Keys')).toBeVisible();
  });

  test('should show provider-specific information', async ({ page }) => {
    // OpenAI info
    await expect(page.locator('text=About OpenAI API Keys')).toBeVisible();
    await expect(page.locator('a[href*="platform.openai.com"]')).toBeVisible();

    // Anthropic info
    await page.click('[role="tab"]:text("Anthropic")');
    await expect(page.locator('text=About Anthropic API Keys')).toBeVisible();
    await expect(page.locator('a[href*="console.anthropic.com"]')).toBeVisible();

    // Google info
    await page.click('[role="tab"]:text("Google")');
    await expect(page.locator('text=About Google API Keys')).toBeVisible();
    await expect(page.locator('a[href*="aistudio.google.com"]')).toBeVisible();
  });

  test('should open add key dialog', async ({ page }) => {
    await page.click('button:text("Add Key")');

    await expect(page.locator('text=Add OpenAI API Key')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:text("Cancel")')).toBeVisible();
    await expect(page.locator('button:text("Add Key")')).toBeVisible();
  });

  test('should validate required fields in add dialog', async ({ page }) => {
    await page.click('button:text("Add Key")');

    // Try to add without entering a key
    const addButton = page.locator('dialog button:text("Add Key")');
    await expect(addButton).toBeDisabled();

    // Enter a key
    await page.fill('input[type="password"]', 'sk-test1234567890');
    await expect(addButton).toBeEnabled();
  });

  test('should cancel add key dialog', async ({ page }) => {
    await page.click('button:text("Add Key")');
    await page.fill('input[type="password"]', 'sk-test1234567890');

    await page.click('button:text("Cancel")');

    // Dialog should be closed
    await expect(page.locator('text=Add OpenAI API Key')).not.toBeVisible();
  });

  test('should show validation error for invalid key', async ({ page }) => {
    // Mock the API to return validation error
    await page.route('**/graphql', async (route) => {
      const postData = route.request().postDataJSON();

      if (postData.operationName === 'CreateLLMAPIKey') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [
              {
                message: 'API key validation failed: Invalid API key',
                extensions: { code: 'BAD_USER_INPUT' },
              },
            ],
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.click('button:text("Add Key")');
    await page.fill('input[type="password"]', 'sk-invalid');
    await page.click('dialog button:text("Add Key")');

    // Should show error notification
    await expect(page.locator('text=API key validation failed')).toBeVisible();
  });

  test('should successfully add a valid key', async ({ page }) => {
    // Mock successful API responses
    await page.route('**/graphql', async (route) => {
      const postData = route.request().postDataJSON();

      if (postData.operationName === 'CreateLLMAPIKey') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              createLLMAPIKey: {
                id: 'key-1',
                provider: 'OPENAI',
                maskedKey: 'sk-...1234',
                isActive: true,
                createdAt: new Date().toISOString(),
                lastValidatedAt: new Date().toISOString(),
              },
            },
          }),
        });
        return;
      }

      if (postData.operationName === 'GetLLMAPIKeys') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              llmApiKeys: [
                {
                  id: 'key-1',
                  provider: 'OPENAI',
                  maskedKey: 'sk-...1234',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  lastValidatedAt: new Date().toISOString(),
                },
              ],
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.click('button:text("Add Key")');
    await page.fill('input[type="password"]', 'sk-valid1234567890');
    await page.click('dialog button:text("Add Key")');

    // Should show success notification
    await expect(page.locator('text=API key added and validated successfully')).toBeVisible();

    // Should display the key in the table
    await expect(page.locator('text=sk-...1234')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
  });

  test('should display multiple keys with correct status', async ({ page }) => {
    // Mock API with multiple keys
    await page.route('**/graphql', async (route) => {
      const postData = route.request().postDataJSON();

      if (postData.operationName === 'GetLLMAPIKeys') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              llmApiKeys: [
                {
                  id: 'key-1',
                  provider: 'OPENAI',
                  maskedKey: 'sk-...1111',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  lastValidatedAt: new Date().toISOString(),
                },
                {
                  id: 'key-2',
                  provider: 'OPENAI',
                  maskedKey: 'sk-...2222',
                  isActive: false,
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                  lastValidatedAt: new Date(Date.now() - 86400000).toISOString(),
                },
              ],
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.reload();
    await page.click('text=LLM API Keys');

    // Should show both keys
    await expect(page.locator('text=sk-...1111')).toBeVisible();
    await expect(page.locator('text=sk-...2222')).toBeVisible();

    // First key should be active
    const activeRow = page.locator('tr:has-text("sk-...1111")');
    await expect(activeRow.locator('text=Active')).toBeVisible();

    // Second key should be inactive with "Set Active" button
    const inactiveRow = page.locator('tr:has-text("sk-...2222")');
    await expect(inactiveRow.locator('text=Inactive')).toBeVisible();
    await expect(inactiveRow.locator('button:text("Set Active")')).toBeVisible();
  });

  test('should allow editing a key', async ({ page }) => {
    // Mock API with existing key
    await page.route('**/graphql', async (route) => {
      const postData = route.request().postDataJSON();

      if (postData.operationName === 'GetLLMAPIKeys') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              llmApiKeys: [
                {
                  id: 'key-1',
                  provider: 'OPENAI',
                  maskedKey: 'sk-...1234',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  lastValidatedAt: new Date().toISOString(),
                },
              ],
            },
          }),
        });
        return;
      }

      if (postData.operationName === 'UpdateLLMAPIKey') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              updateLLMAPIKey: {
                id: 'key-1',
                provider: 'OPENAI',
                maskedKey: 'sk-...5678',
                isActive: true,
                updatedAt: new Date().toISOString(),
                lastValidatedAt: new Date().toISOString(),
              },
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.reload();
    await page.click('text=LLM API Keys');

    // Click edit button
    await page.click('button:text("Edit")');

    // Should show edit dialog
    await expect(page.locator('text=Update OpenAI API Key')).toBeVisible();

    // Enter new key
    await page.fill('input[type="password"]', 'sk-new5678901234');
    await page.click('dialog button:text("Update Key")');

    // Should show success notification
    await expect(page.locator('text=API key updated and validated successfully')).toBeVisible();
  });

  test('should allow deleting a key with confirmation', async ({ page }) => {
    // Mock API with existing key
    await page.route('**/graphql', async (route) => {
      const postData = route.request().postDataJSON();

      if (postData.operationName === 'GetLLMAPIKeys') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              llmApiKeys: [
                {
                  id: 'key-1',
                  provider: 'OPENAI',
                  maskedKey: 'sk-...1234',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  lastValidatedAt: new Date().toISOString(),
                },
              ],
            },
          }),
        });
        return;
      }

      if (postData.operationName === 'DeleteLLMAPIKey') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              deleteLLMAPIKey: {
                id: 'key-1',
              },
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.reload();
    await page.click('text=LLM API Keys');

    // Setup dialog handler
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('Are you sure');
      dialog.accept();
    });

    // Click delete button
    await page.locator('button:has-text("Trash2")').first().click();

    // Should show success notification
    await expect(page.locator('text=API key deleted successfully')).toBeVisible();
  });

  test('should allow setting a key as active', async ({ page }) => {
    // Mock API with multiple keys
    await page.route('**/graphql', async (route) => {
      const postData = route.request().postDataJSON();

      if (postData.operationName === 'GetLLMAPIKeys') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              llmApiKeys: [
                {
                  id: 'key-1',
                  provider: 'OPENAI',
                  maskedKey: 'sk-...1111',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  lastValidatedAt: new Date().toISOString(),
                },
                {
                  id: 'key-2',
                  provider: 'OPENAI',
                  maskedKey: 'sk-...2222',
                  isActive: false,
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                  lastValidatedAt: new Date(Date.now() - 86400000).toISOString(),
                },
              ],
            },
          }),
        });
        return;
      }

      if (postData.operationName === 'SetActiveLLMAPIKey') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              setActiveLLMAPIKey: {
                id: 'key-2',
                isActive: true,
              },
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.reload();
    await page.click('text=LLM API Keys');

    // Click "Set Active" on the inactive key
    const inactiveRow = page.locator('tr:has-text("sk-...2222")');
    await inactiveRow.locator('button:text("Set Active")').click();

    // Should show success notification
    await expect(page.locator('text=Active API key updated')).toBeVisible();
  });

  test('should switch between provider tabs correctly', async ({ page }) => {
    // Mock API with keys for multiple providers
    await page.route('**/graphql', async (route) => {
      const postData = route.request().postDataJSON();

      if (postData.operationName === 'GetLLMAPIKeys') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              llmApiKeys: [
                {
                  id: 'key-1',
                  provider: 'OPENAI',
                  maskedKey: 'sk-...1111',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  lastValidatedAt: new Date().toISOString(),
                },
                {
                  id: 'key-2',
                  provider: 'ANTHROPIC',
                  maskedKey: 'sk-ant-...2222',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  lastValidatedAt: new Date().toISOString(),
                },
                {
                  id: 'key-3',
                  provider: 'GOOGLE',
                  maskedKey: '***...3333',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  lastValidatedAt: new Date().toISOString(),
                },
              ],
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.reload();
    await page.click('text=LLM API Keys');

    // OpenAI tab (default)
    await expect(page.locator('text=sk-...1111')).toBeVisible();
    await expect(page.locator('text=sk-ant-...2222')).not.toBeVisible();

    // Switch to Anthropic
    await page.click('[role="tab"]:text("Anthropic")');
    await expect(page.locator('text=sk-ant-...2222')).toBeVisible();
    await expect(page.locator('text=sk-...1111')).not.toBeVisible();

    // Switch to Google
    await page.click('[role="tab"]:text("Google")');
    await expect(page.locator('text=***...3333')).toBeVisible();
    await expect(page.locator('text=sk-ant-...2222')).not.toBeVisible();
  });

  test('should show loading state', async ({ page }) => {
    // Mock API with delay
    await page.route('**/graphql', async (route) => {
      const postData = route.request().postDataJSON();

      if (postData.operationName === 'GetLLMAPIKeys') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              llmApiKeys: [],
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.reload();
    await page.click('text=LLM API Keys');

    // Should show loading state
    await expect(page.locator('text=Loading keys...')).toBeVisible();
  });
});
