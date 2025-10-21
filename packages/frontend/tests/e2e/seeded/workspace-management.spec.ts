import { test, expect, seedPresets } from '../../fixtures/database';

/**
 * Workspace Management Tests - Seeded Strategy
 *
 * These tests verify workspace querying and filtering with pre-populated data.
 * The database is reset and seeded before each describe block.
 *
 * Strategy: Seeded
 * - Database is reset + seeded before each describe
 * - Tests are READ-ONLY (no modifications within describe)
 * - Tests run sequentially within file (workers: 1)
 * - Tests run serially within each describe block
 */

test.describe.skip('Workspace Management - Seeded Data', () => {
  // Reset and seed database before this describe block
  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.multipleWorkspaces);
  });

  // Configure tests to run serially within this describe
  test.describe.configure({ mode: 'serial' });

  test('should display all seeded workspaces', async ({ graphql }) => {
    const query = `
      query GetWorkspaces {
        workspace: queryWorkspace {
          id
          name
          description
        }
      }
    `;

    const result = await graphql<{
      workspace: Array<{ id: string; name: string; description: string }>;
    }>(query);

    // We seeded 3 workspaces
    expect(result.workspace).toHaveLength(3);

    const workspaceNames = result.workspace.map((w) => w.name).sort();
    expect(workspaceNames).toEqual(['Development', 'Production', 'Testing']);
  });

  test('should query workspace by name filter', async ({ graphql }) => {
    const query = `
      query GetWorkspaces($filter: WorkspaceFilter) {
        workspace: queryWorkspace(filter: $filter) {
          id
          name
          description
        }
      }
    `;

    const result = await graphql<{
      workspace: Array<{ id: string; name: string; description: string }>;
    }>(query, {
      filter: {
        name: { eq: 'Development' },
      },
    });

    expect(result.workspace).toHaveLength(1);
    expect(result.workspace[0].name).toBe('Development');
    expect(result.workspace[0].description).toBe('Development environment');
  });

  test('should get workspace count', async ({ graphql }) => {
    const query = `
      query GetWorkspaceCount {
        aggregateWorkspace {
          count
        }
      }
    `;

    const result = await graphql<{
      aggregateWorkspace: { count: number };
    }>(query);

    expect(result.aggregateWorkspace.count).toBe(3);
  });

  test('should query workspaces with pagination', async ({ graphql }) => {
    const query = `
      query GetWorkspaces($first: Int, $offset: Int) {
        workspace: queryWorkspace(first: $first, offset: $offset, order: { asc: name }) {
          id
          name
        }
      }
    `;

    // Get first 2 workspaces
    const page1 = await graphql<{
      workspace: Array<{ id: string; name: string }>;
    }>(query, { first: 2, offset: 0 });

    expect(page1.workspace).toHaveLength(2);
    expect(page1.workspace[0].name).toBe('Development');
    expect(page1.workspace[1].name).toBe('Production');

    // Get next workspace
    const page2 = await graphql<{
      workspace: Array<{ id: string; name: string }>;
    }>(query, { first: 2, offset: 2 });

    expect(page2.workspace).toHaveLength(1);
    expect(page2.workspace[0].name).toBe('Testing');
  });

  test('should order workspaces by name', async ({ graphql }) => {
    const query = `
      query GetWorkspaces {
        ascending: queryWorkspace(order: { asc: name }) {
          name
        }
        descending: queryWorkspace(order: { desc: name }) {
          name
        }
      }
    `;

    const result = await graphql<{
      ascending: Array<{ name: string }>;
      descending: Array<{ name: string }>;
    }>(query);

    expect(result.ascending.map((w) => w.name)).toEqual([
      'Development',
      'Production',
      'Testing',
    ]);

    expect(result.descending.map((w) => w.name)).toEqual([
      'Testing',
      'Production',
      'Development',
    ]);
  });
});

test.describe.skip('Workspace Queries - Edge Cases', () => {
  // Reset and seed database before this describe block
  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.multipleWorkspaces);
  });

  // Configure tests to run serially within this describe
  test.describe.configure({ mode: 'serial' });

  test('should handle non-existent workspace ID gracefully', async ({ graphql }) => {
    const query = `
      query GetWorkspace($id: ID!) {
        getWorkspace(id: $id) {
          id
          name
        }
      }
    `;

    const result = await graphql<{
      getWorkspace: { id: string; name: string } | null;
    }>(query, { id: '0x999999' });

    // Non-existent ID should return null
    expect(result.getWorkspace).toBeNull();
  });

  test('should return empty array for non-matching filter', async ({ graphql }) => {
    const query = `
      query GetWorkspaces($filter: WorkspaceFilter) {
        workspace: queryWorkspace(filter: $filter) {
          id
          name
        }
      }
    `;

    const result = await graphql<{
      workspace: Array<{ id: string; name: string }>;
    }>(query, {
      filter: {
        name: { eq: 'NonExistentWorkspace' },
      },
    });

    expect(result.workspace).toHaveLength(0);
  });
});
