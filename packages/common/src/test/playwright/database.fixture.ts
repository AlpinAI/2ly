/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Playwright Database Fixtures
 *
 * Extends Playwright's test with custom database management fixtures.
 * These fixtures wrap the core database utilities with Playwright's fixture system
 * and provide comprehensive seeding capabilities for E2E tests.
 */

import { test as base, expect, type Page } from '@playwright/test';
import {
  graphql as coreGraphql,
  resetDatabase as coreResetDatabase,
  getDatabaseState as coreGetDatabaseState,
  seedDatabase as coreSeedDatabase
} from '../fixtures/core';
import type { SeedData, DatabaseState } from '../fixtures/seed-data.types';
import { startRuntime, stopRuntime } from '@2ly/common/test/test.containers';
import { seedPresets } from '../fixtures/seed-data.presets';

// Worker-scoped storage for runtime port
let currentRuntimePort: number | null = null;

/**
 * Playwright-specific database fixture interface
 */
export interface DatabaseFixture {
  /**
   * Reset the database to empty state
   * WARNING: This will delete ALL data!
   */
  resetDatabase: (shouldStartRuntime?: boolean) => Promise<void>;

  /**
   * Seed database with test data
   * Returns entity ID map for cross-referencing in tests
   */
  seedDatabase: (data: SeedData) => Promise<Record<string, string>>;

  /**
   * Execute a GraphQL query against the backend
   */
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>;

  /**
   * Get current database state for debugging/assertions
   */
  getDatabaseState: () => Promise<DatabaseState>;

  /**
   * Default workspace ID (available after resetDatabase)
   */
  workspaceId: string;

  /**
   * Runtime port (available after resetDatabase with shouldStartRuntime=true)
   */
  runtimePort: number | null;
}

/**
 * Extend Playwright test with database fixtures
 */
export const test = base.extend<DatabaseFixture>({
  /**
   * Reset database fixture
   * Drops all data and optionally starts a test runtime
   */
  // eslint-disable-next-line no-empty-pattern
  resetDatabase: async ({}, use) => {
    const reset = async (shouldStartRuntime = false) => {
      try {
        await stopRuntime();
      } catch (error) {
        throw new Error(`Failed to stop runtime: ${error instanceof Error ? error.message : String(error)}`);
      }
      await coreResetDatabase();
      if (shouldStartRuntime) {
        const port = await startRuntime();
        currentRuntimePort = port;
      } else {
        currentRuntimePort = null;
      }
    };
    await use(reset);
  },

  /**
   * Seed database fixture
   * Wraps the core seedDatabase function for use in Playwright tests
   */
  // eslint-disable-next-line no-empty-pattern
  seedDatabase: async ({ }, use) => {
    await use(coreSeedDatabase);
  },

  /**
   * Get database state fixture
   * Returns current database state for debugging/assertions
   */
  // eslint-disable-next-line no-empty-pattern
  getDatabaseState: async ({ }, use) => {
    await use(coreGetDatabaseState);
  },

  /**
   * GraphQL fixture
   * Execute GraphQL queries against the backend
   */
  // eslint-disable-next-line no-empty-pattern
  graphql: async ({ }, use) => {
    await use(coreGraphql);
  },

  /**
   * Workspace ID fixture
   * Makes default workspace ID available in tests
   */
  // eslint-disable-next-line no-empty-pattern
  workspaceId: async ({ }, use) => {
    const state = await coreGetDatabaseState();
    const workspaceId = state.workspaces[0]?.id;
    if (!workspaceId) {
      throw new Error('No workspace found. Did you call resetDatabase first?');
    }
    await use(workspaceId);
  },

  /**
   * Runtime port fixture
   * Makes runtime port available in tests after resetDatabase(true) is called
   */
  // eslint-disable-next-line no-empty-pattern
  runtimePort: async ({ }, use) => {
    await use(currentRuntimePort);
  },
});

/**
 * Helper function to perform login in tests
 */
export async function performLogin(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/w\/.+/, { timeout: 10000 });
}

/**
 * Re-export commonly used seed presets and Playwright expect
 */
export { seedPresets, expect };
