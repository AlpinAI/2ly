/**
 * Comprehensive Seed Data for E2E Tests
 *
 * This file contains realistic, comprehensive fixture data for E2E testing:
 * - Multiple MCP servers with different transports (STDIO, SSE, STREAM)
 * - Realistic tools with proper schemas and descriptions
 * - Tool sets (agent-capable runtimes) with various tool combinations
 * - Tool call history with different states (success, error, pending)
 *
 * WHY: Enables thorough UI and navigation testing without requiring live MCP server integrations.
 * All data is deterministic and designed for fast, reliable test execution (<30s).
 */

import type { SeedData } from '../fixtures/database';

// ============================================================================
// Realistic Input Schemas for Tools
// ============================================================================

const FILE_READ_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to the file to read',
    },
  },
  required: ['path'],
});

const FILE_WRITE_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to the file to write',
    },
    content: {
      type: 'string',
      description: 'Content to write to the file',
    },
  },
  required: ['path', 'content'],
});

const DIRECTORY_LIST_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Path to the directory to list',
    },
  },
  required: ['path'],
});

const FILE_SEARCH_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Directory path to search in',
    },
    pattern: {
      type: 'string',
      description: 'Search pattern (glob or regex)',
    },
  },
  required: ['path', 'pattern'],
});

const HTTP_GET_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'URL to fetch',
    },
    headers: {
      type: 'object',
      description: 'Optional HTTP headers',
    },
  },
  required: ['url'],
});

const HTTP_POST_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'URL to post to',
    },
    body: {
      type: 'object',
      description: 'Request body',
    },
    headers: {
      type: 'object',
      description: 'Optional HTTP headers',
    },
  },
  required: ['url', 'body'],
});

const DATABASE_QUERY_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'SQL query to execute',
    },
    parameters: {
      type: 'array',
      description: 'Query parameters',
    },
  },
  required: ['query'],
});

const PROCESS_EXECUTE_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    command: {
      type: 'string',
      description: 'Command to execute',
    },
    args: {
      type: 'array',
      items: { type: 'string' },
      description: 'Command arguments',
    },
    cwd: {
      type: 'string',
      description: 'Working directory',
    },
  },
  required: ['command'],
});

const GIT_STATUS_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    repositoryPath: {
      type: 'string',
      description: 'Path to git repository',
    },
  },
  required: ['repositoryPath'],
});

const GIT_COMMIT_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    repositoryPath: {
      type: 'string',
      description: 'Path to git repository',
    },
    message: {
      type: 'string',
      description: 'Commit message',
    },
  },
  required: ['repositoryPath', 'message'],
});

// ============================================================================
// Comprehensive Seed Data Preset
// ============================================================================

/**
 * Comprehensive seed data with realistic MCP servers, tools, agents, and tool calls.
 *
 * Structure:
 * - 1 workspace
 * - 1 user
 * - 4 MCP servers (different transports)
 * - 3 registry servers
 * - 23 tools across servers
 * - 3 runtimes (2 agent-capable, 1 edge)
 * - 15 tool calls (various states)
 */
export const comprehensiveSeededData: SeedData = {
  users: [
    {
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User',
    },
  ],
  workspaces: [
    {
      name: 'Test Workspace',
      description: 'Test workspace with comprehensive data',
    },
  ],
  // Note: Registry servers need to be created first, then MCP servers reference them
  // We'll use placeholder IDs that will be resolved during seeding
  registryServers: [
    {
      name: 'filesystem',
      description: 'File system operations',
      title: 'Filesystem MCP Server',
      repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
      version: '0.6.2',
      packages: JSON.stringify([
        {
          identifier: '@modelcontextprotocol/server-filesystem',
          packageArguments: ['/tmp'],
          runtimeArguments: ['-y'],
        },
      ]),
      workspaceId: '', // Will be set during seeding
    },
    {
      name: 'web-fetch',
      description: 'HTTP request capabilities',
      title: 'Web Fetch MCP Server',
      repositoryUrl: 'https://github.com/example/web-fetch-mcp',
      version: '1.0.0',
      packages: JSON.stringify([]),
      remotes: JSON.stringify([
        {
          type: 'sse',
          url: 'http://localhost:8080/sse',
        },
      ]),
      workspaceId: '', // Will be set during seeding
    },
    {
      name: 'development-tools',
      description: 'Development and git operations',
      title: 'Development Tools MCP Server',
      repositoryUrl: 'https://github.com/example/dev-tools-mcp',
      version: '2.1.0',
      packages: JSON.stringify([]),
      remotes: JSON.stringify([
        {
          type: 'streamableHttp',
          url: 'http://localhost:9090/stream',
        },
      ]),
      workspaceId: '', // Will be set during seeding
    },
  ],
  mcpServers: [
    {
      name: 'Filesystem Server',
      transport: 'STDIO' as const,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    },
    {
      name: 'Web Fetch Server',
      transport: 'SSE' as const,
    },
    {
      name: 'Development Tools',
      transport: 'STREAM' as const,
    },
    {
      name: 'Database Server',
      transport: 'STDIO' as const,
      command: 'npx',
      args: ['-y', '@example/database-mcp-server'],
    },
  ],
  tools: [
    // Filesystem Server Tools (7 tools)
    {
      name: 'read_file',
      description: 'Read the complete contents of a file from the file system',
      inputSchema: FILE_READ_SCHEMA,
      annotations: JSON.stringify({ category: 'filesystem', complexity: 'low' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'filesystem-server', // Placeholder, resolved during seeding
    },
    {
      name: 'write_file',
      description: 'Create a new file or completely overwrite an existing file with new content',
      inputSchema: FILE_WRITE_SCHEMA,
      annotations: JSON.stringify({ category: 'filesystem', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'filesystem-server',
    },
    {
      name: 'list_directory',
      description: 'Get a detailed listing of all files and directories in a specified path',
      inputSchema: DIRECTORY_LIST_SCHEMA,
      annotations: JSON.stringify({ category: 'filesystem', complexity: 'low' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'filesystem-server',
    },
    {
      name: 'search_files',
      description: 'Recursively search for files matching a pattern',
      inputSchema: FILE_SEARCH_SCHEMA,
      annotations: JSON.stringify({ category: 'filesystem', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'filesystem-server',
    },
    {
      name: 'move_file',
      description: 'Move or rename files and directories',
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Source path' },
          destination: { type: 'string', description: 'Destination path' },
        },
        required: ['source', 'destination'],
      }),
      annotations: JSON.stringify({ category: 'filesystem', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'filesystem-server',
    },
    {
      name: 'delete_file',
      description: 'Delete a file or directory',
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to delete' },
        },
        required: ['path'],
      }),
      annotations: JSON.stringify({ category: 'filesystem', complexity: 'high', dangerous: true }),
      status: 'ACTIVE' as const,
      mcpServerId: 'filesystem-server',
    },
    {
      name: 'get_file_info',
      description: 'Get detailed metadata about a file or directory',
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to inspect' },
        },
        required: ['path'],
      }),
      annotations: JSON.stringify({ category: 'filesystem', complexity: 'low' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'filesystem-server',
    },

    // Web Fetch Server Tools (5 tools)
    {
      name: 'http_get',
      description: 'Make an HTTP GET request to a specified URL',
      inputSchema: HTTP_GET_SCHEMA,
      annotations: JSON.stringify({ category: 'http', complexity: 'low' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'web-fetch-server',
    },
    {
      name: 'http_post',
      description: 'Make an HTTP POST request with a JSON body',
      inputSchema: HTTP_POST_SCHEMA,
      annotations: JSON.stringify({ category: 'http', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'web-fetch-server',
    },
    {
      name: 'http_put',
      description: 'Make an HTTP PUT request to update a resource',
      inputSchema: HTTP_POST_SCHEMA,
      annotations: JSON.stringify({ category: 'http', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'web-fetch-server',
    },
    {
      name: 'http_delete',
      description: 'Make an HTTP DELETE request to remove a resource',
      inputSchema: HTTP_GET_SCHEMA,
      annotations: JSON.stringify({ category: 'http', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'web-fetch-server',
    },
    {
      name: 'fetch_json',
      description: 'Fetch and parse JSON from a URL',
      inputSchema: HTTP_GET_SCHEMA,
      annotations: JSON.stringify({ category: 'http', complexity: 'low' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'web-fetch-server',
    },

    // Development Tools Server (6 tools)
    {
      name: 'execute_command',
      description: 'Execute a shell command',
      inputSchema: PROCESS_EXECUTE_SCHEMA,
      annotations: JSON.stringify({ category: 'process', complexity: 'high', dangerous: true }),
      status: 'ACTIVE' as const,
      mcpServerId: 'development-tools',
    },
    {
      name: 'git_status',
      description: 'Get the current git repository status',
      inputSchema: GIT_STATUS_SCHEMA,
      annotations: JSON.stringify({ category: 'git', complexity: 'low' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'development-tools',
    },
    {
      name: 'git_commit',
      description: 'Create a git commit with the specified message',
      inputSchema: GIT_COMMIT_SCHEMA,
      annotations: JSON.stringify({ category: 'git', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'development-tools',
    },
    {
      name: 'git_diff',
      description: 'Show git diff for staged or unstaged changes',
      inputSchema: GIT_STATUS_SCHEMA,
      annotations: JSON.stringify({ category: 'git', complexity: 'low' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'development-tools',
    },
    {
      name: 'git_log',
      description: 'Show git commit history',
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          repositoryPath: { type: 'string' },
          limit: { type: 'number', description: 'Number of commits to show' },
        },
        required: ['repositoryPath'],
      }),
      annotations: JSON.stringify({ category: 'git', complexity: 'low' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'development-tools',
    },
    {
      name: 'npm_install',
      description: 'Install npm dependencies in a project',
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          projectPath: { type: 'string', description: 'Path to project' },
        },
        required: ['projectPath'],
      }),
      annotations: JSON.stringify({ category: 'npm', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'development-tools',
    },

    // Database Server Tools (5 tools)
    {
      name: 'db_query',
      description: 'Execute a SQL query against the database',
      inputSchema: DATABASE_QUERY_SCHEMA,
      annotations: JSON.stringify({ category: 'database', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'database-server',
    },
    {
      name: 'db_insert',
      description: 'Insert records into a database table',
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          table: { type: 'string' },
          data: { type: 'object' },
        },
        required: ['table', 'data'],
      }),
      annotations: JSON.stringify({ category: 'database', complexity: 'medium' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'database-server',
    },
    {
      name: 'db_update',
      description: 'Update records in a database table',
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          table: { type: 'string' },
          data: { type: 'object' },
          where: { type: 'object' },
        },
        required: ['table', 'data', 'where'],
      }),
      annotations: JSON.stringify({ category: 'database', complexity: 'high' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'database-server',
    },
    {
      name: 'db_delete',
      description: 'Delete records from a database table',
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          table: { type: 'string' },
          where: { type: 'object' },
        },
        required: ['table', 'where'],
      }),
      annotations: JSON.stringify({ category: 'database', complexity: 'high', dangerous: true }),
      status: 'ACTIVE' as const,
      mcpServerId: 'database-server',
    },
    {
      name: 'db_schema',
      description: 'Get database schema information',
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name (optional)' },
        },
      }),
      annotations: JSON.stringify({ category: 'database', complexity: 'low' }),
      status: 'ACTIVE' as const,
      mcpServerId: 'database-server',
    },
  ],
  runtimes: [
    {
      name: 'Claude Desktop Agent',
      description: 'Primary agent runtime for Claude Desktop application',
      status: 'ACTIVE' as const,
      capabilities: ['agent', 'mcp-client'],
      workspaceId: '', // Will be set during seeding
    },
    {
      name: 'Web Assistant Agent',
      description: 'Web-based assistant with limited tool access',
      status: 'ACTIVE' as const,
      capabilities: ['agent', 'mcp-client', 'web'],
      workspaceId: '', // Will be set during seeding
    },
    {
      name: 'Edge Runtime',
      description: 'Edge runtime for processing tool calls',
      status: 'ACTIVE' as const,
      capabilities: ['mcp-client', 'edge'],
      workspaceId: '', // Will be set during seeding
    },
  ],
  toolCalls: [
    // Successful tool calls
    {
      toolInput: JSON.stringify({ path: '/tmp/test.txt' }),
      calledAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      completedAt: new Date(Date.now() - 3599000).toISOString(),
      status: 'COMPLETED' as const,
      toolOutput: JSON.stringify({ content: 'File contents here', size: 1024 }),
      mcpToolId: 'read_file',
      calledById: 'claude-desktop-agent',
      executedById: 'edge-runtime',
    },
    {
      toolInput: JSON.stringify({ url: 'https://api.example.com/data' }),
      calledAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      completedAt: new Date(Date.now() - 7198000).toISOString(),
      status: 'COMPLETED' as const,
      toolOutput: JSON.stringify({ status: 200, data: { message: 'Success' } }),
      mcpToolId: 'http_get',
      calledById: 'web-assistant-agent',
      executedById: 'edge-runtime',
    },
    {
      toolInput: JSON.stringify({ repositoryPath: '/home/user/project' }),
      calledAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      completedAt: new Date(Date.now() - 1799000).toISOString(),
      status: 'COMPLETED' as const,
      toolOutput: JSON.stringify({ branch: 'main', modified: [], untracked: [] }),
      mcpToolId: 'git_status',
      calledById: 'claude-desktop-agent',
      executedById: 'edge-runtime',
    },
    {
      toolInput: JSON.stringify({ path: '/tmp/data', pattern: '*.json' }),
      calledAt: new Date(Date.now() - 900000).toISOString(), // 15 min ago
      completedAt: new Date(Date.now() - 899000).toISOString(),
      status: 'COMPLETED' as const,
      toolOutput: JSON.stringify({ files: ['data1.json', 'data2.json', 'config.json'] }),
      mcpToolId: 'search_files',
      calledById: 'claude-desktop-agent',
      executedById: 'edge-runtime',
    },
    {
      toolInput: JSON.stringify({ query: 'SELECT * FROM users LIMIT 10' }),
      calledAt: new Date(Date.now() - 600000).toISOString(), // 10 min ago
      completedAt: new Date(Date.now() - 599500).toISOString(),
      status: 'COMPLETED' as const,
      toolOutput: JSON.stringify({ rows: 10, data: [] }),
      mcpToolId: 'db_query',
      calledById: 'web-assistant-agent',
      executedById: 'edge-runtime',
    },

    // Failed tool calls
    {
      toolInput: JSON.stringify({ path: '/nonexistent/file.txt' }),
      calledAt: new Date(Date.now() - 5400000).toISOString(), // 90 min ago
      completedAt: new Date(Date.now() - 5399000).toISOString(),
      status: 'FAILED' as const,
      error: 'ENOENT: no such file or directory',
      mcpToolId: 'read_file',
      calledById: 'claude-desktop-agent',
    },
    {
      toolInput: JSON.stringify({ url: 'https://invalid.example.com/404' }),
      calledAt: new Date(Date.now() - 4500000).toISOString(), // 75 min ago
      completedAt: new Date(Date.now() - 4499000).toISOString(),
      status: 'FAILED' as const,
      error: 'HTTP 404: Not Found',
      mcpToolId: 'http_get',
      calledById: 'web-assistant-agent',
    },
    {
      toolInput: JSON.stringify({ command: 'invalid-command', args: [] }),
      calledAt: new Date(Date.now() - 2700000).toISOString(), // 45 min ago
      completedAt: new Date(Date.now() - 2699000).toISOString(),
      status: 'FAILED' as const,
      error: 'Command not found: invalid-command',
      mcpToolId: 'execute_command',
      calledById: 'claude-desktop-agent',
    },
    {
      toolInput: JSON.stringify({ query: 'INVALID SQL QUERY' }),
      calledAt: new Date(Date.now() - 1200000).toISOString(), // 20 min ago
      completedAt: new Date(Date.now() - 1199000).toISOString(),
      status: 'FAILED' as const,
      error: 'Syntax error in SQL query',
      mcpToolId: 'db_query',
      calledById: 'web-assistant-agent',
    },

    // Pending tool calls
    {
      toolInput: JSON.stringify({ path: '/tmp/large-file.dat' }),
      calledAt: new Date(Date.now() - 300000).toISOString(), // 5 min ago
      status: 'PENDING' as const,
      mcpToolId: 'read_file',
      calledById: 'claude-desktop-agent',
    },
    {
      toolInput: JSON.stringify({ url: 'https://api.slow-server.com/data' }),
      calledAt: new Date(Date.now() - 180000).toISOString(), // 3 min ago
      status: 'PENDING' as const,
      mcpToolId: 'http_get',
      calledById: 'web-assistant-agent',
    },
    {
      toolInput: JSON.stringify({ repositoryPath: '/home/user/large-repo' }),
      calledAt: new Date(Date.now() - 120000).toISOString(), // 2 min ago
      status: 'PENDING' as const,
      mcpToolId: 'git_log',
      calledById: 'claude-desktop-agent',
    },
    {
      toolInput: JSON.stringify({ projectPath: '/home/user/node-project' }),
      calledAt: new Date(Date.now() - 60000).toISOString(), // 1 min ago
      status: 'PENDING' as const,
      mcpToolId: 'npm_install',
      calledById: 'claude-desktop-agent',
    },
    {
      toolInput: JSON.stringify({ path: '/tmp/output.txt', content: 'Hello World' }),
      calledAt: new Date(Date.now() - 30000).toISOString(), // 30 sec ago
      status: 'PENDING' as const,
      mcpToolId: 'write_file',
      calledById: 'web-assistant-agent',
    },
    {
      toolInput: JSON.stringify({ url: 'https://api.example.com/create', body: { name: 'test' } }),
      calledAt: new Date(Date.now() - 10000).toISOString(), // 10 sec ago
      status: 'PENDING' as const,
      mcpToolId: 'http_post',
      calledById: 'claude-desktop-agent',
    },
  ],
};
