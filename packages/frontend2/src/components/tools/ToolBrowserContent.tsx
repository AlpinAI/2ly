/**
 * ToolBrowserContent Component
 *
 * WHY: Displays searchable, filterable list of MCP registry servers.
 * Shows mock data for demonstration purposes.
 *
 * ARCHITECTURE:
 * - Search bar for filtering tools
 * - Filter chips for categories
 * - Responsive grid of server cards
 * - Mock MCPRegistryServer data
 */

import { useState } from 'react';
import { Search } from '@/components/ui/search';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink, Database, Cloud, FileText, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock MCPRegistryServer data
interface MockMCPRegistryServer {
  name: string;
  description: string;
  repositoryUrl: string;
  transport: string;
  category: string;
  icon: string;
}

const MOCK_SERVERS: MockMCPRegistryServer[] = [
  {
    name: 'postgres-mcp',
    description: 'PostgreSQL database integration with full SQL query support and schema introspection',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    transport: 'STDIO',
    category: 'Database',
    icon: 'database',
  },
  {
    name: 'filesystem',
    description: 'Read and write files on your local filesystem with path traversal protection',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    transport: 'STDIO',
    category: 'File System',
    icon: 'file',
  },
  {
    name: 'github',
    description: 'GitHub integration for repository management, issues, pull requests, and workflows',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    transport: 'SSE',
    category: 'API',
    icon: 'cloud',
  },
  {
    name: 'slack',
    description: 'Send messages and interact with Slack workspaces, channels, and users',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    transport: 'SSE',
    category: 'API',
    icon: 'cloud',
  },
  {
    name: 'sqlite',
    description: 'SQLite database operations with query execution and schema management',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
    transport: 'STDIO',
    category: 'Database',
    icon: 'database',
  },
  {
    name: 'git',
    description: 'Git version control operations including commits, branches, and diffs',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
    transport: 'STDIO',
    category: 'Developer Tools',
    icon: 'code',
  },
  {
    name: 'puppeteer',
    description: 'Browser automation and web scraping with headless Chrome',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    transport: 'STREAM',
    category: 'Developer Tools',
    icon: 'code',
  },
  {
    name: 'brave-search',
    description: 'Web search powered by Brave Search API with privacy-focused results',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    transport: 'SSE',
    category: 'API',
    icon: 'cloud',
  },
  {
    name: 'memory',
    description: 'Persistent key-value storage for maintaining context across sessions',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    transport: 'STDIO',
    category: 'Storage',
    icon: 'database',
  },
];

const CATEGORIES = ['All', 'Database', 'API', 'File System', 'Developer Tools', 'Storage'];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'database':
      return Database;
    case 'cloud':
      return Cloud;
    case 'file':
      return FileText;
    case 'code':
      return Code;
    default:
      return Code;
  }
};

export function ToolBrowserContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter servers based on search and category
  const filteredServers = MOCK_SERVERS.filter((server) => {
    const matchesSearch =
      searchQuery === '' ||
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || server.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="px-6 py-6">
      {/* Search Bar */}
      <div className="mb-6">
        <Search
          placeholder="Search tools by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-2xl"
        />
      </div>

      {/* Category Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'rounded-full transition-all',
              selectedCategory === category && 'shadow-sm'
            )}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {filteredServers.length} {filteredServers.length === 1 ? 'tool' : 'tools'} available
      </p>

      {/* Server Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServers.map((server) => {
          const IconComponent = getIconComponent(server.icon);
          return (
            <div
              key={server.name}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <IconComponent className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {server.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                      {server.transport}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {server.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {server.description}
              </p>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-2">
                <a
                  href={server.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Repo
                </a>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Tool
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredServers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-2">No tools found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
