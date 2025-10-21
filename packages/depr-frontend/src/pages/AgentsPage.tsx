import React, { useState } from 'react';
import { Search, Plus, Filter, Grid, List } from 'lucide-react';
import Button from '../components/ui/Button';
import AgentCard from '../components/dashboard/AgentCard';
import { apolloResolversTypes } from '@2ly/common';
import { client } from '../services/apollo.client';
import { Tool } from '../types';
import { useRequiredWorkspace } from '../contexts/useRequiredWorkspace';
import { useRuntimes } from '../hooks/useRuntimes';
import { useNavigate } from 'react-router-dom';
import { DELETE_RUNTIME } from '../graphql/mutations';


// Helper function to convert tool capabilities to Tool objects
const mapToolCapabilitiesToTools = (toolCapabilities: apolloResolversTypes.McpTool[]): Tool[] => {
  return toolCapabilities.map((tc) => ({
    id: tc.id,
    name: tc.name,
    description: tc.description ?? '',
    type: 'mcp' as const, // Default to MCP type since these are from MCP servers
    status: tc.status.toLowerCase() as 'active' | 'inactive',
    configuration: {},
    agentIds: [],
    usage: 0,
    createdAt: new Date().toISOString(),
    lastUsed: undefined,
  }));
};


const AgentsPage: React.FC = () => {
  const { currentWorkspace } = useRequiredWorkspace();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const runtimes = useRuntimes(currentWorkspace.id, ['agent']);
  const navigate = useNavigate();

  const handleDeleteAgent = async (runtime: apolloResolversTypes.Runtime) => {
    try {
      await client.mutate({
        mutation: DELETE_RUNTIME,
        variables: {
          id: runtime.id,
        },
      });
    } catch (error) {
      console.error('Error deleting agent:', error);
      // You might want to show a toast notification here
    }
  };

  const filteredRuntimes = runtimes.filter(
    (runtime) =>
      runtime.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (runtime.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-gray-500">Manage and monitor your AI agents.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/agents/new')}>
          Agent
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />} style={{ display: 'none' }}>
            Filter
          </Button>
          <div className="flex rounded-md border border-gray-300 bg-white">
            <button
              className={`flex h-10 w-10 items-center justify-center rounded-l-md ${view === 'grid' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-800'
                }`}
              onClick={() => setView('grid')}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              className={`flex h-10 w-10 items-center justify-center rounded-r-md ${view === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-800'
                }`}
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredRuntimes.length > 0 ? (
        <div className={view === 'grid' ? 'grid gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3' : 'space-y-4'}>
          {filteredRuntimes.map((runtime) => {
            const tools = runtime.mcpToolCapabilities
              ? mapToolCapabilitiesToTools(runtime.mcpToolCapabilities)
              : [];

            return (
              <AgentCard
                key={runtime.id}
                agent={runtime}
                tools={tools}
                className={view === 'list' ? 'max-w-none' : ''}
                onDelete={handleDeleteAgent}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="mb-2 text-lg font-medium">No agents found</p>
          <p className="mb-4 text-gray-500">Try adjusting your search or filters.</p>
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/agents/new')}>
            Create New Agent
          </Button>
        </div>
      )}

      {/* Add Agent Dialog replaced by full-screen workflow at /agents/new */}
    </div>
  );
};

export default AgentsPage;
