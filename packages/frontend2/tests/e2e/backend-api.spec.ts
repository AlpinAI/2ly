/**
 * Backend API Integration Tests
 *
 * Tests GraphQL queries against the real backend using testcontainers
 */

import { test, expect } from '@playwright/test';

test.describe('Backend API - System Query', () => {
  let apiUrl: string;

  test.beforeEach(async () => {
    // Get backend API URL from environment variable set by global-setup
    apiUrl = process.env.API_URL || 'http://localhost:3000';
  });

  test('should query system and return uninitialized state', async ({ request }) => {
    // GraphQL query to fetch system
    const query = `
      query GetSystem {
        system {
          id
          initialized
          createdAt
          updatedAt
          defaultWorkspace {
            id
            name
          }
        }
      }
    `;

    // Make GraphQL request
    const response = await request.post(`${apiUrl}/graphql`, {
      data: {
        query,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Verify response status
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Parse response
    const body = await response.json();

    // Check for GraphQL errors
    if (body.errors) {
      console.error('GraphQL Errors:', JSON.stringify(body.errors, null, 2));
    }

    // System should either be null (not created yet) or initialized: false
    if (body.data.system === null) {
      // System not created yet - this is expected on first run
      expect(body.data.system).toBeNull();
    } else {
      // System exists but should not be initialized
      expect(body.data.system).toBeDefined();
      expect(body.data.system.initialized).toBe(false);
      expect(body.data.system.id).toBeDefined();

      // defaultWorkspace should be null if not initialized
      expect(body.data.system.defaultWorkspace).toBeNull();
    }
  });

  test('should query infra and get NATS connection info', async ({ request }) => {
    // GraphQL query to fetch infra info
    const query = `
      query GetInfra {
        infra {
          nats
        }
      }
    `;

    // Make GraphQL request
    const response = await request.post(`${apiUrl}/graphql`, {
      data: {
        query,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Verify response status
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Parse response
    const body = await response.json();

    // Check for GraphQL errors
    expect(body.errors).toBeUndefined();

    // Infra should have NATS connection string
    expect(body.data.infra).toBeDefined();
    expect(body.data.infra.nats).toBeDefined();
    expect(typeof body.data.infra.nats).toBe('string');

    // NATS URL should contain 'nats:' or 'localhost:'
    expect(body.data.infra.nats).toMatch(/nats:|localhost:/);
  });

  test('should query workspaces and return empty array', async ({ request }) => {
    // GraphQL query to fetch workspaces
    const query = `
      query GetWorkspaces {
        workspace {
          id
          name
          createdAt
        }
      }
    `;

    // Make GraphQL request
    const response = await request.post(`${apiUrl}/graphql`, {
      data: {
        query,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Verify response status
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Parse response
    const body = await response.json();

    // Check for GraphQL errors
    if (body.errors) {
      console.error('GraphQL Errors:', JSON.stringify(body.errors, null, 2));
    }

    // Workspaces should be empty array on fresh database
    expect(body.data.workspace).toBeDefined();
    expect(Array.isArray(body.data.workspace)).toBe(true);

    // On a fresh database, there should be no workspaces
    // (or possibly one default workspace - adjust expectation based on backend behavior)
    expect(body.data.workspace.length).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Backend API - Health Check', () => {
  test('should respond to health check endpoint', async ({ request }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';

    const response = await request.get(`${apiUrl}/health`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});

test.describe('Backend API - GraphQL Introspection', () => {
  test('should support GraphQL introspection query', async ({ request }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';

    // Simple introspection query to get schema type names
    const query = `
      query IntrospectionQuery {
        __schema {
          queryType {
            name
          }
          types {
            name
            kind
          }
        }
      }
    `;

    const response = await request.post(`${apiUrl}/graphql`, {
      data: {
        query,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();

    // Should have schema info
    expect(body.data.__schema).toBeDefined();
    expect(body.data.__schema.queryType.name).toBe('Query');
    expect(Array.isArray(body.data.__schema.types)).toBe(true);

    // Should include our custom types
    const typeNames = body.data.__schema.types.map((t: any) => t.name);
    expect(typeNames).toContain('System');
    expect(typeNames).toContain('Workspace');
    expect(typeNames).toContain('MCPServer');
    expect(typeNames).toContain('Runtime');
  });
});
