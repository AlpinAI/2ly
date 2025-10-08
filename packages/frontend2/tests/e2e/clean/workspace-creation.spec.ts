import { test, expect } from '../../fixtures/database';

/**
 * Workspace Creation Tests - Clean Slate Strategy
 *
 * These tests verify workspace creation functionality with a fresh database.
 * Each test starts with a completely empty database.
 *
 * Strategy: Clean Slate
 * - Database is reset before EACH test
 * - Tests DO NOT run in parallel
 * - Complete test isolation
 */

test.describe.skip('Workspace', () => {
  test.beforeEach(async ({ resetDatabase }) => {
    // Reset database before each test
    await resetDatabase();
  });

  test.describe('Creation', () => {

    test('should create a workspace successfully', async ({ graphql, getDatabaseState }) => {
      // Verify database is empty
      const initialState = await getDatabaseState();
      expect(initialState.workspaces).toHaveLength(0);

      // Create a workspace
      const mutation = `
        mutation CreateWorkspace($name: String!, $description: String) {
          addWorkspace(input: {
            name: $name
            description: $description
          }) {
            workspace {
              id
              name
              description
            }
          }
        }
      `;

      const result = await graphql<{
        addWorkspace: {
          workspace: Array<{ id: string; name: string; description: string }>;
        };
      }>(mutation, {
        name: 'Test Workspace',
        description: 'A workspace created during testing',
      });

      expect(result.addWorkspace.workspace).toHaveLength(1);
      expect(result.addWorkspace.workspace[0].name).toBe('Test Workspace');
      expect(result.addWorkspace.workspace[0].description).toBe('A workspace created during testing');
      expect(result.addWorkspace.workspace[0].id).toBeDefined();

      // Verify workspace exists in database
      const finalState = await getDatabaseState();
      expect(finalState.workspaces).toHaveLength(1);
      expect(finalState.workspaces[0].name).toBe('Test Workspace');
    });

    test('should create multiple workspaces', async ({ graphql, getDatabaseState }) => {
      // Create first workspace
      const mutation = `
        mutation CreateWorkspace($name: String!, $description: String) {
          addWorkspace(input: {
            name: $name
            description: $description
          }) {
            workspace {
              id
              name
            }
          }
        }
      `;

      await graphql(mutation, {
        name: 'Workspace 1',
        description: 'First workspace',
      });

      await graphql(mutation, {
        name: 'Workspace 2',
        description: 'Second workspace',
      });

      await graphql(mutation, {
        name: 'Workspace 3',
        description: 'Third workspace',
      });

      // Verify all workspaces exist
      const state = await getDatabaseState();
      expect(state.workspaces).toHaveLength(3);

      const workspaceNames = state.workspaces.map((w) => w.name).sort();
      expect(workspaceNames).toEqual(['Workspace 1', 'Workspace 2', 'Workspace 3']);
    });

    test('should query created workspace by ID', async ({ graphql }) => {
      // Create a workspace
      const createMutation = `
        mutation CreateWorkspace($name: String!) {
          addWorkspace(input: { name: $name }) {
            workspace {
              id
              name
            }
          }
        }
      `;

      const createResult = await graphql<{
        addWorkspace: {
          workspace: Array<{ id: string; name: string }>;
        };
      }>(createMutation, { name: 'Queryable Workspace' });

      const workspaceId = createResult.addWorkspace.workspace[0].id;

      // Query workspace by ID
      const getQuery = `
        query GetWorkspace($id: ID!) {
          getWorkspace(id: $id) {
            id
            name
          }
        }
      `;

      const getResult = await graphql<{
        getWorkspace: { id: string; name: string };
      }>(getQuery, { id: workspaceId });

      expect(getResult.getWorkspace.id).toBe(workspaceId);
      expect(getResult.getWorkspace.name).toBe('Queryable Workspace');
    });
  });

  test.describe('Validation', () => {

    test('should require workspace name', async ({ graphql }) => {
      const mutation = `
        mutation CreateWorkspace($name: String!) {
          addWorkspace(input: { name: $name }) {
            workspace {
              id
              name
            }
          }
        }
      `;

      // Attempt to create workspace with empty name
      await expect(async () => {
        await graphql(mutation, { name: '' });
      }).rejects.toThrow();
    });
  });

});


