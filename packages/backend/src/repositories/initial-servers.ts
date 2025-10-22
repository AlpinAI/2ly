/**
 * Initial featured MCP servers to be created when a workspace is initialized.
 * These servers are added to the "Private Registry" for each new workspace.
 */

interface ServerPackage {
  registryType: string;
  identifier: string;
  transport: string;
  version: string;
  packageArguments: string[];
  runtimeArguments: string[];
  environmentVariables: Array<{ key: string; value: string }>;
}

interface InitialServer {
  name: string;
  description: string;
  title: string;
  version: string;
  repositoryUrl: string;
  packages: ServerPackage[];
  remotes: null;
}

export const INITIAL_FEATURED_SERVERS: InitialServer[] = [
  {
    name: '@modelcontextprotocol/server-filesystem',
    description: 'Secure file operations with configurable access controls',
    title: 'Filesystem',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-filesystem',
        transport: 'stdio',
        version: '0.6.2',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-fetch',
    description: 'Web content fetching and conversion for efficient LLM usage',
    title: 'Fetch',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-fetch',
        transport: 'stdio',
        version: '0.6.2',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-git',
    description: 'Tools to read, search, and manipulate Git repositories',
    title: 'Git',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-git',
        transport: 'stdio',
        version: '0.6.2',
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
    title: 'Memory',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-memory',
        transport: 'stdio',
        version: '0.6.2',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-time',
    description: 'Time and timezone conversion capabilities',
    title: 'Time',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-time',
        transport: 'stdio',
        version: '0.6.2',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-brave-search',
    description: 'Web search using Brave Search API',
    title: 'Brave Search',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-brave-search',
        transport: 'stdio',
        version: '0.6.2',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [
          {
            key: 'BRAVE_API_KEY',
            value: '',
          },
        ],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-github',
    description: 'GitHub API integration for repository operations',
    title: 'GitHub',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-github',
        transport: 'stdio',
        version: '0.6.2',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [
          {
            key: 'GITHUB_PERSONAL_ACCESS_TOKEN',
            value: '',
          },
        ],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-postgres',
    description: 'PostgreSQL database operations and queries',
    title: 'PostgreSQL',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-postgres',
        transport: 'stdio',
        version: '0.6.2',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [
          {
            key: 'POSTGRES_CONNECTION_STRING',
            value: '',
          },
        ],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-sqlite',
    description: 'SQLite database operations and queries',
    title: 'SQLite',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-sqlite',
        transport: 'stdio',
        version: '0.6.2',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
  {
    name: '@modelcontextprotocol/server-puppeteer',
    description: 'Browser automation for web scraping and testing',
    title: 'Puppeteer',
    version: '0.6.2',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    packages: [
      {
        registryType: 'npm',
        identifier: '@modelcontextprotocol/server-puppeteer',
        transport: 'stdio',
        version: '0.6.2',
        packageArguments: [],
        runtimeArguments: [],
        environmentVariables: [],
      },
    ],
    remotes: null,
  },
];
