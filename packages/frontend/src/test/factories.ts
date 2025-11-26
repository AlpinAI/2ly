/**
 * Test Mock Factories
 *
 * WHY: Reduce boilerplate in test files by providing reusable factory functions
 * for creating mock GraphQL objects with sensible defaults and easy overrides.
 */

import type { McpServer, Workspace, McpRegistryServer } from '@/graphql/generated/graphql';
import { McpTransportType, McpServerRunOn } from '@/graphql/generated/graphql';

/**
 * Creates a mock Workspace object with sensible defaults.
 * All nullable relation fields default to null.
 */
export const createMockWorkspace = (overrides: Partial<Workspace> = {}): Workspace => ({
  __typename: 'Workspace',
  id: 'workspace-1',
  name: 'Test Workspace',
  createdAt: new Date(),
  globalRuntime: null,
  mcpServers: null,
  mcpTools: null,
  onboardingSteps: null,
  registryServers: null,
  runtimes: null,
  toolSets: null,
  llmApiKeys: null,
  ...overrides,
});

/**
 * Creates a mock MCPRegistryServer object with sensible defaults.
 * Includes a nested workspace by default.
 */
export const createMockRegistryServer = (
  overrides: Partial<McpRegistryServer> = {}
): McpRegistryServer => ({
  __typename: 'MCPRegistryServer',
  id: 'reg-1',
  _meta: null,
  configurations: null,
  name: 'Registry Server',
  title: 'Registry Server Title',
  repositoryUrl: '',
  description: '',
  packages: null,
  remotes: null,
  version: '1.0.0',
  createdAt: new Date(),
  lastSeenAt: new Date(),
  workspace: createMockWorkspace(),
  ...overrides,
});

/**
 * Creates a full mock McpServer object with all nested objects.
 * Use this for tests that need complete server objects with registryServer and workspace.
 */
export const createMockMcpServer = (overrides: Partial<McpServer> = {}): McpServer => ({
  __typename: 'MCPServer',
  id: 'server-1',
  name: 'Test Server',
  description: 'A test server',
  transport: McpTransportType.Stream,
  runOn: McpServerRunOn.Global,
  config: '{}',
  repositoryUrl: '',
  registryServer: createMockRegistryServer(),
  runtime: null,
  tools: null,
  workspace: createMockWorkspace(),
  ...overrides,
});

/**
 * Creates a lightweight mock McpServer for use as nested references.
 * Does not include registryServer or workspace to avoid circular references.
 * Use this when you need an McpServer reference inside other objects (e.g., MCPTool.mcpServer).
 */
export const createMockMcpServerRef = (overrides: Partial<McpServer> = {}): McpServer => ({
  __typename: 'MCPServer',
  id: 'server-1',
  name: 'Test Server',
  description: '',
  transport: McpTransportType.Stdio,
  runOn: null,
  config: '{}',
  repositoryUrl: '',
  registryServer: null as never,
  workspace: null as never,
  runtime: null,
  tools: null,
  ...overrides,
});
