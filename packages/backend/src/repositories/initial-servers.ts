import { mcpRegistry } from '@2ly/common';
type Server = mcpRegistry.components['schemas']['ServerJSON'];

/**
 * Initial featured MCP servers to be created when a workspace is initialized.
 * These servers are added to the "Private Registry" for each new workspace.
 */

export const INITIAL_FEATURED_SERVERS: Server[] = [
  {
    name: '@modelcontextprotocol/server-filesystem',
    description: 'Secure file operations with configurable access controls',
    version: '2025.8.21',
    repository: {
      url: 'https://github.com/modelcontextprotocol/servers',
      source: 'github',
      id: 'modelcontextprotocol/servers',
      subfolder: 'src/filesystem',
    },
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-filesystem',
        version: '2025.8.21',
        packageArguments: [
          {
            name: 'directory_path',
            description: 'The directory path to allow access to',
            format: 'string',
            type: 'positional',
            isRequired: false,
          },
        ],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-fetch',
    description: 'Web content fetching and conversion for efficient LLM usage',
    version: '0.6.2',
    repository: {
      url: 'https://github.com/modelcontextprotocol/servers',
      source: 'github',
      id: 'modelcontextprotocol/servers',
      subfolder: 'src/fetch',
    },
    packages: [
      {
        registryType: 'pypi',
        registryBaseUrl: 'https://pypi.org',
        identifier: 'mcp-server-fetch',
        version: '2025.4.7',
        runtimeHint: 'uvx',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-memory',
    description: 'Knowledge graph-based persistent memory system',
    version: '0.6.2',
    repository: {
      url: 'https://github.com/modelcontextprotocol/servers',
      source: 'github',
      id: 'modelcontextprotocol/servers',
      subfolder: 'src/memory',
    },
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-memory',
        version: '2025.9.25',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [
          {
            name: 'MEMORY_FILE_PATH',
            value: 'memory',
            isRequired: false,
          }
        ],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-time',
    description: 'Time and timezone conversion capabilities',
    version: '0.6.2',
    repository: {
      url: 'https://github.com/modelcontextprotocol/servers',
      source: 'github',
      id: 'modelcontextprotocol/servers',
      subfolder: 'src/time',
    },
    packages: [
      {
        registryType: 'pypi',
        registryBaseUrl: 'https://pypi.org',
        identifier: 'mcp-server-time',
        version: '2025.9.25',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
  {
    name: "io.github.brave/brave-search-mcp-server",
    description: "Brave Search MCP Server: web results, images, videos, rich results, AI summaries, and more.",
    version: "2.0.58",
    repository: {
      url: 'https://github.com/brave/brave-search-mcp-server',
      source: 'github',
    },
    packages: [
      {
        registryType: "npm",
        registryBaseUrl: "https://registry.npmjs.org",
        identifier: "@brave/brave-search-mcp-server",
        version: "2.0.58",
        transport: {
          type: "stdio"
        },
        environmentVariables: [
          {
            description: "Your API key for the service",
            isRequired: true,
            format: "string",
            isSecret: true,
            name: "BRAVE_API_KEY"
          }
        ]
      }
    ],
    remotes: null
  },
  {  
    name: "github/github-mcp-server",
    description: "Official GitHub MCP Server that connects AI tools directly to GitHub's platform. Enables AI agents to read repositories, manage issues and PRs, analyze code, and automate workflows through natural language interactions.",
    version: "0.13.0",
    repository: {
      url: 'https://github.com/github/github-mcp-server',
      source: 'github',
    },
    packages: null,
    remotes: [
      {
        type: 'http',
        url: 'https://api.githubcopilot.com/mcp/',
        headers: [
          {
            name: 'Authorization',
            value: 'Bearer {github_mcp_pat}',
            variables: {
              github_mcp_pat: {
                description: "GitHub Personal Access Token",
                isRequired: true,
                isSecret: true,
              }
            },
          },
        ],
      },
    ],
  },
  {  
    name: "supermemoryai/apple-mcp",
    description: "Your Mac can do more than just look pretty. Turn your Apple apps into AI superpowers!",
    version: "1.0.0",
    repository: {
      url: 'https://github.com/supermemoryai/apple-mcp',
      source: 'github',
    },
    packages: [
      {
        registryType: 'npm',
        identifier: 'apple-mcp',
        version: '1.0.0',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
  {  
    name: "crystaldba/postgres-mcp",
    description: "Postgres MCP Pro provides configurable read/write access and performance analysis for you and your AI agents.",
    version: "0.3.0",
    repository: {
      url: 'https://github.com/crystaldba/postgres-mcp',
      source: 'github',
    },
    packages: [
      {
        registryType: 'pypi',
        identifier: 'postgres-mcp',
        version: '0.3.0',
        packageArguments: [
          {
            name: 'access-mode',
            type: 'string',
            value: 'unrestricted',
          }
        ],
        runtimeArguments: [],
        environmentVariables: [
          {
            name: 'DATABASE_URI',
            isRequired: true,
            isSecret: true,
            format: 'string',
            description: 'The URI of the database to connect to, example: postgresql://user:password@host:port/database',
          }
        ],
      },
    ],
    remotes: null,
  },
];
