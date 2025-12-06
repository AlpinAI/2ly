/**
 * Test Mock Factories
 *
 * WHY: Reduce boilerplate in test files by providing reusable factory functions
 * for creating mock GraphQL objects with sensible defaults and easy overrides.
 */

import type {
  McpServer,
  McpTool,
  Runtime,
  ToolCall,
  Skill,
  Workspace,
  McpRegistryServer,
} from '@/graphql/generated/graphql';
import {
  McpTransportType,
  ExecutionTarget,
  ToolCallStatus,
  ActiveStatus,
  RuntimeType,
} from '@/graphql/generated/graphql';

/**
 * Creates a mock Workspace object with sensible defaults.
 * All nullable relation fields default to null.
 */
export const createMockWorkspace = (overrides: Partial<Workspace> = {}): Workspace => ({
  __typename: 'Workspace',
  id: 'workspace-1',
  name: 'Test Workspace',
  createdAt: new Date(),
  mcpServers: null,
  mcpTools: null,
  onboardingSteps: null,
  registryServers: null,
  runtimes: null,
  aiProviders: null,
  defaultAIModel: null,
  skills: null,
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
  executionTarget: ExecutionTarget.Edge,
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
  executionTarget: null,
  config: '{}',
  repositoryUrl: '',
  registryServer: null as never,
  workspace: null as never,
  runtime: null,
  tools: null,
  ...overrides,
});

/**
 * Creates a lightweight mock McpTool for use in ToolCall references.
 * Includes a nested mcpServer ref.
 */
export const createMockMcpToolRef = (overrides: Partial<McpTool> = {}): McpTool => ({
  __typename: 'MCPTool',
  id: 'tool-1',
  name: 'test-tool',
  description: 'Test tool description',
  inputSchema: '{}',
  annotations: '{}',
  status: ActiveStatus.Active,
  createdAt: new Date(),
  lastSeenAt: new Date(),
  mcpServer: createMockMcpServerRef(),
  skills: null,
  workspace: null as never,
  ...overrides,
});

/**
 * Creates a lightweight mock Skill for use as calledBy references in ToolCall.
 */
export const createMockSkillRef = (overrides: Partial<Skill> = {}): Skill => ({
  __typename: 'Skill',
  id: 'skill-1',
  name: 'Test Agent',
  description: null,
  createdAt: new Date(),
  updatedAt: null,
  mcpTools: null,
  toolCalls: null,
  skillToolCalls: null,
  workspace: null as never,
  mode: null,
  model: null,
  temperature: null,
  maxTokens: null,
  systemPrompt: null,
  executionTarget: null,
  runtime: null,
  ...overrides,
});

/**
 * Creates a lightweight mock Runtime for use as executedBy references in ToolCall.
 */
export const createMockRuntimeRef = (overrides: Partial<Runtime> = {}): Runtime => ({
  __typename: 'Runtime',
  id: 'runtime-1',
  name: 'Test Runtime',
  hostname: 'test-host',
  status: ActiveStatus.Active,
  type: RuntimeType.Edge,
  description: null,
  hostIP: null,
  mcpClientName: null,
  roots: null,
  lastSeenAt: null,
  createdAt: new Date(),
  mcpServers: null,
  skills: null,
  toolResponses: null,
  workspace: null as never,
  system: null as never,
  ...overrides,
});

/**
 * Creates a mock ToolCall object with sensible defaults.
 * Includes nested mcpTool reference. calledBy and executedBy default to null.
 */
export const createMockToolCall = (overrides: Partial<ToolCall> = {}): ToolCall => ({
  __typename: 'ToolCall',
  id: 'tc-1',
  status: ToolCallStatus.Completed,
  isTest: false,
  calledAt: new Date('2025-01-15T10:30:00Z'),
  completedAt: new Date('2025-01-15T10:30:05Z'),
  toolInput: '{"query":"test"}',
  toolOutput: 'result',
  executedByAgent: false,
  error: null,
  mcpTool: createMockMcpToolRef(),
  skill: null,
  calledBy: null,
  executedBy: null,
  ...overrides,
});
