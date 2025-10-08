import { test, expect } from '../../fixtures/database';

/**
 * Backend API Tests - Clean Slate Strategy
 *
 * These tests verify basic backend API functionality with a fresh database.
 * Each test in this file runs with a completely empty database.
 *
 * Strategy: Clean Slate
 * - Database is reset before EACH test
 * - Tests DO NOT run in parallel
 * - Complete test isolation
 */

const apiUrl = process.env.API_URL || 'http://localhost:3000';

test.describe('Backend API Tests', () => {
  // Reset database before each test in this file
  test.beforeEach(async ({ resetDatabase }) => {
    await resetDatabase();
  });

  test.describe('System Queries', () => {
    test('should query system and return uninitialized state', async ({ graphql }) => {
      const query = `
        query GetSystem {
          system {
            id
            initialized
            createdAt
            updatedAt
          }
        }
      `;

      const result = await graphql(query);
      // System might not exist yet (null) or exist but be uninitialized
      if (result.system === null) {
        expect(result.system).toBeNull();
      } else {
        expect(result.system.initialized).toBe(false);
        expect(result.system.id).toBeDefined();
      }
    });

    test('should handle GraphQL introspection query', async ({ graphql }) => {
      const query = `
        query IntrospectionQuery {
          __schema {
            queryType {
              name
            }
            mutationType {
              name
            }
          }
        }
      `;

      const result = await graphql(query);

      expect(result.__schema.queryType.name).toBe('Query');
      expect(result.__schema.mutationType.name).toBe('Mutation');
    });

    test('should return default workspace after reset', async ({
      graphql,
    }) => {
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
      expect(result.workspace[0].id).toBeDefined();
    });
  });

  test.describe('Health Checks', () => {
    test('should respond to health check endpoint', async ({ request }) => {
      const response = await request.get(`${apiUrl}/health`);

      expect(response.ok()).toBeTruthy();

      const body = await response.json();

      expect(body).toHaveProperty('status');
      expect(body.status).toBe('ok');
    });

    test('should have GraphQL endpoint available', async ({ graphql }) => {
      // Simple ping query
      const query = `query { __typename }`;

      const result = await graphql(query);

      expect(result.__typename).toBe('Query');
    });
  });
});
