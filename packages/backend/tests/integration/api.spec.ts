import { describe, it, expect, beforeEach } from 'vitest';
import { graphql, resetDatabase, request } from '@2ly/common/test/fixtures';

/**
 * Backend API Integration Tests - Clean Slate Strategy
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

describe('Backend API Tests', () => {

  // Reset database before each test in this file
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('System Queries', () => {
    it('should query system and return uninitialized state', async () => {
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

    it('should handle GraphQL introspection query', async () => {
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

    it('should return default workspace after reset', async () => {
      const query = `
        query GetSystem {
          system {
            id
            defaultWorkspace {
              id
              name
            }
          }
        }
      `;

      const result = await graphql(query);

      // After reset, backend creates a default workspace during initialization
      expect(result.system).toBeDefined();
      expect(result.system.defaultWorkspace).toBeDefined();
      expect(result.system.defaultWorkspace.name).toBe('Default');
      expect(result.system.defaultWorkspace.id).toBeDefined();
    });
  });

  describe('Health Checks', () => {
    it('should respond to health check endpoint', async () => {
      const response = await request('/health');

      expect(response.ok).toBeTruthy();

      const body = await response.json();

      expect(body).toHaveProperty('status');
      expect(body.status).toBe('ok');
    });

    it('should have GraphQL endpoint available', async () => {
      // Simple ping query
      const query = `query { __typename }`;

      const result = await graphql(query);

      expect(result.__typename).toBe('Query');
    });
  });
});
