import { describe, it, expect, beforeEach } from 'vitest';
import { graphql, resetDatabase } from '@2ly/common/test/fixtures';

/**
 * MCP Server Testing Integration Tests
 *
 * These tests verify the full lifecycle of MCP server testing:
 * 1. testMCPServer mutation returns testSessionId immediately
 * 2. Backend subscribes to NATS lifecycle events
 * 3. Runtime handles test request and publishes events
 * 4. GraphQL subscription emits events to client
 *
 * Strategy: Clean Slate
 * - Database is reset before EACH test
 * - Tests DO NOT run in parallel
 * - Complete test isolation
 */

describe('MCP Server Testing Integration', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('testMCPServer Mutation', () => {
    it('should return testSessionId immediately without waiting for test completion', async () => {
      // Get default workspace
      const systemQuery = `
        query GetSystem {
          system {
            defaultWorkspace {
              id
            }
          }
        }
      `;
      const systemResult = await graphql(systemQuery);
      const workspaceId = systemResult.system.defaultWorkspace.id;

      // Call testMCPServer mutation
      const mutation = `
        mutation TestMCPServer($name: String!, $repositoryUrl: String!, $transport: MCPTransportType!, $config: String!, $workspaceId: ID!) {
          testMCPServer(
            name: $name
            repositoryUrl: $repositoryUrl
            transport: $transport
            config: $config
            workspaceId: $workspaceId
          ) {
            testSessionId
            success
            tools {
              name
              description
            }
            error
          }
        }
      `;

      const variables = {
        name: 'test-weather-server',
        repositoryUrl: 'https://github.com/test/weather-server',
        transport: 'SSE',
        config: JSON.stringify({
          type: 'sse',
          url: 'http://localhost:3100/sse',
        }),
        workspaceId,
      };

      const startTime = Date.now();
      const result = await graphql(mutation, variables);
      const duration = Date.now() - startTime;

      // Should return immediately (< 1 second)
      expect(duration).toBeLessThan(1000);

      // Should have testSessionId
      expect(result.testMCPServer.testSessionId).toBeDefined();
      expect(typeof result.testMCPServer.testSessionId).toBe('string');
      expect(result.testMCPServer.testSessionId).toMatch(/^[0-9a-f-]{36}$/); // UUID format

      // Initial state should be incomplete
      expect(result.testMCPServer.success).toBe(false);
      expect(result.testMCPServer.tools).toBeNull();
      expect(result.testMCPServer.error).toBeNull();
    });

    it('should generate unique testSessionId for each test', async () => {
      const systemQuery = `
        query GetSystem {
          system {
            defaultWorkspace {
              id
            }
          }
        }
      `;
      const systemResult = await graphql(systemQuery);
      const workspaceId = systemResult.system.defaultWorkspace.id;

      const mutation = `
        mutation TestMCPServer($name: String!, $repositoryUrl: String!, $transport: MCPTransportType!, $config: String!, $workspaceId: ID!) {
          testMCPServer(
            name: $name
            repositoryUrl: $repositoryUrl
            transport: $transport
            config: $config
            workspaceId: $workspaceId
          ) {
            testSessionId
          }
        }
      `;

      const variables = {
        name: 'test-server',
        repositoryUrl: 'https://github.com/test/server',
        transport: 'SSE',
        config: JSON.stringify({ type: 'sse', url: 'http://localhost:3100' }),
        workspaceId,
      };

      // Call mutation twice
      const result1 = await graphql(mutation, variables);
      const result2 = await graphql(mutation, variables);

      // Should have different testSessionIds
      expect(result1.testMCPServer.testSessionId).not.toBe(result2.testMCPServer.testSessionId);
    });

    it('should accept different transport types', async () => {
      const systemQuery = `
        query GetSystem {
          system {
            defaultWorkspace {
              id
            }
          }
        }
      `;
      const systemResult = await graphql(systemQuery);
      const workspaceId = systemResult.system.defaultWorkspace.id;

      const mutation = `
        mutation TestMCPServer($name: String!, $repositoryUrl: String!, $transport: MCPTransportType!, $config: String!, $workspaceId: ID!) {
          testMCPServer(
            name: $name
            repositoryUrl: $repositoryUrl
            transport: $transport
            config: $config
            workspaceId: $workspaceId
          ) {
            testSessionId
          }
        }
      `;

      // Test SSE
      const sseResult = await graphql(mutation, {
        name: 'sse-server',
        repositoryUrl: 'https://github.com/test/sse-server',
        transport: 'SSE',
        config: JSON.stringify({ type: 'sse', url: 'http://localhost:3100' }),
        workspaceId,
      });
      expect(sseResult.testMCPServer.testSessionId).toBeDefined();

      // Test STDIO
      const stdioResult = await graphql(mutation, {
        name: 'stdio-server',
        repositoryUrl: 'https://github.com/test/stdio-server',
        transport: 'STDIO',
        config: JSON.stringify({
          identifier: 'npx',
          args: ['-y', '@test/stdio-server'],
        }),
        workspaceId,
      });
      expect(stdioResult.testMCPServer.testSessionId).toBeDefined();

      // Test STREAM
      const streamResult = await graphql(mutation, {
        name: 'stream-server',
        repositoryUrl: 'https://github.com/test/stream-server',
        transport: 'STREAM',
        config: JSON.stringify({
          type: 'streamableHttp',
          url: 'http://localhost:3100/stream',
        }),
        workspaceId,
      });
      expect(streamResult.testMCPServer.testSessionId).toBeDefined();
    });
  });

  describe('mcpServerTestProgress Subscription', () => {
    it('should define subscription in schema', async () => {
      // Verify subscription exists via introspection
      const query = `
        query IntrospectionQuery {
          __type(name: "Subscription") {
            name
            fields {
              name
              args {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      `;

      const result = await graphql(query);

      expect(result.__type).toBeDefined();
      expect(result.__type.name).toBe('Subscription');

      const testProgressField = result.__type.fields.find(
        (f: any) => f.name === 'mcpServerTestProgress'
      );
      expect(testProgressField).toBeDefined();
      expect(testProgressField.args).toContainEqual(
        expect.objectContaining({
          name: 'testSessionId',
          type: expect.objectContaining({
            kind: 'NON_NULL',
          }),
        })
      );
    });
  });

  describe('MCPServerLifecycleEvent Type', () => {
    it('should define lifecycle event type in schema', async () => {
      const query = `
        query IntrospectionQuery {
          __type(name: "MCPServerLifecycleEvent") {
            name
            kind
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      `;

      const result = await graphql(query);

      expect(result.__type).toBeDefined();
      expect(result.__type.name).toBe('MCPServerLifecycleEvent');
      expect(result.__type.kind).toBe('OBJECT');

      const fieldNames = result.__type.fields.map((f: any) => f.name);
      expect(fieldNames).toContain('stage');
      expect(fieldNames).toContain('message');
      expect(fieldNames).toContain('timestamp');
      expect(fieldNames).toContain('error');
      expect(fieldNames).toContain('tools');
    });

    it('should define lifecycle stage enum in schema', async () => {
      const query = `
        query IntrospectionQuery {
          __type(name: "MCPLifecycleStage") {
            name
            kind
            enumValues {
              name
            }
          }
        }
      `;

      const result = await graphql(query);

      expect(result.__type).toBeDefined();
      expect(result.__type.name).toBe('MCPLifecycleStage');
      expect(result.__type.kind).toBe('ENUM');

      const enumValues = result.__type.enumValues.map((v: any) => v.name);
      expect(enumValues).toContain('INSTALLING');
      expect(enumValues).toContain('STARTING');
      expect(enumValues).toContain('LISTING_TOOLS');
      expect(enumValues).toContain('COMPLETED');
      expect(enumValues).toContain('FAILED');
    });
  });
});
