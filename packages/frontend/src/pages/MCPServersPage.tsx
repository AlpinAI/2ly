import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, Server, Wrench } from 'lucide-react';
import Button from '../components/ui/Button';
import MCPServerCard from '../components/dashboard/MCPServerCard';
import MCPServerFormDialog from '../components/dashboard/MCPServerFormDialog';
import MCPToolCard from '../components/dashboard/MCPToolCard';
import { useRuntimes } from '../hooks/useRuntimes';
import { apolloResolversTypes } from '@2ly/common';
import { observe, client } from '../services/apollo.client';
import {
  CREATE_MCP_SERVER_MUTATION,
  UPDATE_MCP_SERVER_MUTATION,
  LINK_MCP_SERVER_TO_RUNTIME_MUTATION,
  UNLINK_MCP_SERVER_FROM_RUNTIME_MUTATION,
  DELETE_MCP_SERVER_MUTATION,
  MCP_SERVERS_SUBSCRIPTION,
} from '../graphql';
import { useRequiredWorkspace } from '../contexts/useRequiredWorkspace';
import { useNavigate } from 'react-router-dom';
import { parseMcpServerConfig } from '../utils/mcpServerConfig';

interface GroupedTools {
  [mcpServerId: string]: {
    mcpServer: apolloResolversTypes.McpServer;
    tools: apolloResolversTypes.McpTool[];
  };
}

const MCPServersPage: React.FC = () => {
  const { currentWorkspace } = useRequiredWorkspace();
  const navigate = useNavigate();
  const [view, setView] = useState<'servers' | 'tools'>('servers');
  const [searchTerm, setSearchTerm] = useState('');
  const [mcpServers, setMCPServers] = useState<apolloResolversTypes.McpServer[]>([]);

  const runtimes = useRuntimes(currentWorkspace.id, ['tool']);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingServer, setEditingServer] = useState<apolloResolversTypes.McpServer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize the initial data for the edit dialog to prevent unnecessary re-renders
  const editDialogInitialData = useMemo(() => {
    if (!editingServer) return undefined;

    return {
      name: editingServer.name,
      description: editingServer.description,
      repositoryUrl: editingServer.repositoryUrl,
      transport: editingServer.transport,
      command: editingServer.command,
      args: editingServer.args,
      ENV: editingServer.ENV,
      serverUrl: editingServer.serverUrl,
    };
  }, [editingServer]);

  useEffect(() => {
    const subscription = observe<{ mcpServers: apolloResolversTypes.McpServer[] }>({
      query: MCP_SERVERS_SUBSCRIPTION,
      variables: { workspaceId: currentWorkspace.id },
    });

    const subscription$ = subscription.subscribe({
      next: (data) => {
        if (data.mcpServers) {
          setMCPServers(data.mcpServers);

        }
      },
      error: (error) => {
        console.error('MCP servers subscription error:', error);
      },
    });

    return () => {
      subscription$.unsubscribe();
    };
  }, [currentWorkspace.id]);

  // Tool runtimes are provided by useRuntimes hook

  const filteredServers = mcpServers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.transport.toLowerCase().includes(searchTerm.toLowerCase()),
  );



  // Group tools by MCP Server
  // Since tools are nested within servers, we need to create a map of server ID to tools
  const groupedTools: GroupedTools = {};

  // Iterate through servers and group their tools
  mcpServers.forEach(server => {
    if (server.tools && server.tools.length > 0) {
      const serverTools = server.tools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (serverTools.length > 0) {
        groupedTools[server.id] = {
          mcpServer: server,
          tools: serverTools,
        };
      }
    }
  });

  const handleRuntimeChange = async (serverId: string, runtimeId: string | null) => {
    try {
      if (runtimeId) {
        await client.mutate({
          mutation: LINK_MCP_SERVER_TO_RUNTIME_MUTATION,
          variables: {
            mcpServerId: serverId,
            runtimeId: runtimeId,
          },
        });
      } else {
        await client.mutate({
          mutation: UNLINK_MCP_SERVER_FROM_RUNTIME_MUTATION,
          variables: {
            mcpServerId: serverId,
          },
        });
      }
    } catch (error) {
      console.error('Error updating MCP server tool runtime:', error);
    }
  };



  const handleEditMCPServer = async (
    formData: Omit<apolloResolversTypes.MutationCreateMcpServerArgs, 'workspaceId'>,
  ) => {
    if (!editingServer) return;

    setIsSubmitting(true);

    try {
      await client.mutate({
        mutation: UPDATE_MCP_SERVER_MUTATION,
        variables: {
          id: editingServer.id,
          ...formData,
        },
      });

      setShowEditDialog(false);
      setEditingServer(null);
    } catch (error) {
      console.error('Error updating MCP server:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (server: apolloResolversTypes.McpServer) => {
    setEditingServer(server);
    setShowEditDialog(true);
  };

  const handleDeleteMCPServer = async (server: apolloResolversTypes.McpServer) => {
    try {
      await client.mutate({
        mutation: DELETE_MCP_SERVER_MUTATION,
        variables: {
          id: server.id,
        },
      });
    } catch (error) {
      console.error('Error deleting MCP server:', error);
    }
  };

  const handleDuplicateMCPServer = async (server: apolloResolversTypes.McpServer) => {
    try {
      await client.mutate({
        mutation: CREATE_MCP_SERVER_MUTATION,
        variables: {
          name: `${server.name} (Copy)`,
          description: server.description,
          repositoryUrl: server.repositoryUrl,
          transport: server.transport,
          config: server.config, // Use the config field directly
          workspaceId: currentWorkspace.id,
        },
      });
    } catch (error) {
      console.error('Error duplicating MCP server:', error);
    }
  };

  const renderMCPServersView = () => (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
      {filteredServers.map((server) => (
        <MCPServerCard
          key={server.id}
          server={server}
          runtimes={runtimes}
          onRuntimeChange={handleRuntimeChange}
          onEdit={handleEditClick}
          onDelete={handleDeleteMCPServer}
          onDuplicate={handleDuplicateMCPServer}
        />
      ))}
    </div>
  );

  const renderMCPToolsView = () => (
    <div className="space-y-8">
      {Object.values(groupedTools).map(({ mcpServer, tools }) => (
        <div key={mcpServer.id} className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-lg font-semibold text-gray-900">{mcpServer.name}</h2>
            <p className="text-sm text-gray-500">{mcpServer.description}</p>
          </div>

          <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
            {tools.map((tool) => (
              <MCPToolCard
                key={tool.id}
                tool={tool}
                mcpServer={mcpServer}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tools Registry</h1>
            <p className="text-gray-500">Manage and configure my tools.</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/mcp-servers/new')}>
            Tools
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={view === 'servers' ? "Search MCP servers..." : "Search MCP tools..."}
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
                className={`flex h-10 items-center gap-2 px-4 rounded-l-md transition-colors ${view === 'servers'
                  ? 'bg-gray-100 text-gray-800'
                  : 'text-gray-400 hover:text-gray-800'
                  }`}
                onClick={() => setView('servers')}
              >
                <Server className="h-4 w-4" />
                <span className="text-sm font-medium">Servers</span>
              </button>
              <button
                className={`flex h-10 items-center gap-2 px-4 rounded-r-md transition-colors ${view === 'tools'
                  ? 'bg-gray-100 text-gray-800'
                  : 'text-gray-400 hover:text-gray-800'
                  }`}
                onClick={() => setView('tools')}
              >
                <Wrench className="h-4 w-4" />
                <span className="text-sm font-medium">Tools</span>
              </button>
            </div>
          </div>
        </div>

        {view === 'servers' ? (
          filteredServers.length > 0 ? (
            renderMCPServersView()
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="mb-2 text-lg font-medium">No server found</p>
              <p className="mb-4 text-gray-500">Try adjusting your search or filters.</p>
              <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/mcp-servers/new')}>
                Add Tools
              </Button>
            </div>
          )
        ) : (
          Object.keys(groupedTools).length > 0 ? (
            renderMCPToolsView()
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="mb-2 text-lg font-medium">No tool found</p>
              <p className="mb-4 text-gray-500">Try adjusting your search or filters.</p>
            </div>
          )
        )}
      </div>

      {/* Edit MCP Server Dialog */}
      <MCPServerFormDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingServer(null);
        }}
        onSubmit={handleEditMCPServer}
        initialData={editDialogInitialData}
        title="Edit MCP Server"
        submitButtonText="Save Changes"
        isSubmitting={isSubmitting}
        isEditing={true}
      />
    </>
  );
};

export default MCPServersPage;
