import { test, expect } from '@2ly/common/test/fixtures/playwright';

/**
 * Clean Slate Strategy - Example Tests
 *
 * This file demonstrates the "Clean Slate" testing strategy for Playwright e2e tests.
 * Use this strategy when you need a completely fresh database state for each test.
 *
 * ⚠️ NOTE: Most backend API tests have been moved to packages/backend/tests/integration/
 * This file serves as an example of the clean slate pattern for future UI tests.
 *
 * Strategy: Clean Slate
 * - Database is reset before EACH test
 * - Tests DO NOT run in parallel (workers: 1)
 * - Complete test isolation
 * - Use for: Tests that modify data, require empty state, or test initial setup flows
 *
 * When to use this strategy:
 * - Testing onboarding/setup flows
 * - Testing data creation from empty state
 * - Tests that need predictable, isolated state
 * - Tests that would conflict with each other if run in parallel
 */

test.describe('Clean Slate Strategy Example', () => {
  // Reset database before each test to ensure clean state
  test.beforeEach(async ({ resetDatabase }) => {
    await resetDatabase();
  });

  test('example: should verify fresh database state', async ({ graphql }) => {
    const query = `
      query GetWorkspaces {
        workspace {
          id
          name
        }
      }
    `;

    const result = await graphql(query);

    // After reset, backend creates a default workspace during initialization
    expect(result.workspace).toHaveLength(1);
    expect(result.workspace[0].name).toBe('Default');
  });
});
