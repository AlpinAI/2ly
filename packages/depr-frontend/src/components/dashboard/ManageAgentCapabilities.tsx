import React, { useState, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
// Remove Agent import as we'll use the agent structure directly
import { apolloResolversTypes } from '@2ly/common';
import { client } from '../../services/apollo.client';
import { gql } from '@apollo/client/core';

const QUERY_MCP_SERVERS = gql`
  query getMCPServers {
    mcpServers {
      id
      name
      description
      tools {
        id
        name
        description
        status
        inputSchema
        annotations
      }
    }
  }
`;

const LINK_TOOL_TO_RUNTIME = gql`
  mutation linkMCPToolToRuntime($mcpToolId: ID!, $runtimeId: ID!) {
    linkMCPToolToRuntime(mcpToolId: $mcpToolId, runtimeId: $runtimeId) {
      id
      name
      mcpToolCapabilities {
        id
        name
      }
    }
  }
`;

const UNLINK_TOOL_FROM_RUNTIME = gql`
  mutation unlinkMCPToolFromRuntime($mcpToolId: ID!, $runtimeId: ID!) {
    unlinkMCPToolFromRuntime(mcpToolId: $mcpToolId, runtimeId: $runtimeId) {
      id
      name
      mcpToolCapabilities {
        id
        name
      }
    }
  }
`;

interface ManageAgentCapabilitiesProps {
    agent: apolloResolversTypes.Runtime;
    isOpen: boolean;
    onClose: () => void;
}

interface GroupedMCPServer {
    id: string;
    name: string;
    description: string;
    tools: apolloResolversTypes.McpTool[];
}

const ManageAgentCapabilities: React.FC<ManageAgentCapabilitiesProps> = ({
    agent,
    isOpen,
    onClose,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({
        mcp: true,
        api: false,
        composed: false,
    });
    const [mcpServers, setMcpServers] = useState<GroupedMCPServer[]>([]);
    const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [collapsedServers, setCollapsedServers] = useState<Set<string>>(new Set());

    // Load MCP tools data
    useEffect(() => {
        if (!isOpen) return;

        const loadMCPTools = async () => {
            setIsLoading(true);
            try {
                const result = await client.query({
                    query: QUERY_MCP_SERVERS,
                });

                if (result.data?.mcpServers) {
                    const servers = result.data.mcpServers.map((server: apolloResolversTypes.McpServer) => ({
                        id: server.id,
                        name: server.name,
                        description: server.description,
                        tools: server.tools || [],
                    }));
                    setMcpServers(servers);

                    // Initialize selected tools with current agent tools
                    const currentTools = new Set((agent.mcpToolCapabilities || []).map(tool => tool.id));
                    setSelectedTools(currentTools);
                }
            } catch (error) {
                console.error('Error loading MCP tools:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMCPTools();
    }, [isOpen, agent.mcpToolCapabilities]);

    // Filter tools based on search term and active filters
    const filteredServers = mcpServers.filter(server => {
        if (!activeFilters.mcp) return false;

        const hasMatchingTools = server.tools.some(tool =>
            tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return hasMatchingTools || server.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleToolToggle = (toolId: string) => {
        setSelectedTools(prev => {
            const newSet = new Set(prev);
            if (newSet.has(toolId)) {
                newSet.delete(toolId);
            } else {
                newSet.add(toolId);
            }
            return newSet;
        });
    };

    const handleServerToggle = (server: GroupedMCPServer) => {
        const serverToolIds = server.tools.map(tool => tool.id);
        const allServerToolsSelected = serverToolIds.every(id => selectedTools.has(id));

        setSelectedTools(prev => {
            const newSet = new Set(prev);
            if (allServerToolsSelected) {
                // Unselect all tools from this server
                serverToolIds.forEach(id => newSet.delete(id));
            } else {
                // Select all tools from this server
                serverToolIds.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

    const handleApply = async () => {
        setIsSubmitting(true);
        try {
            const currentToolIds = new Set((agent.mcpToolCapabilities || []).map(tool => tool.id));
            const toolsToAdd = Array.from(selectedTools).filter(id => !currentToolIds.has(id));
            const toolsToRemove = Array.from(currentToolIds).filter(id => !selectedTools.has(id));

            // Add new tools
            for (const toolId of toolsToAdd) {
                await client.mutate({
                    mutation: LINK_TOOL_TO_RUNTIME,
                    variables: { mcpToolId: toolId, runtimeId: agent.id },
                });
            }

            // Remove tools
            for (const toolId of toolsToRemove) {
                await client.mutate({
                    mutation: UNLINK_TOOL_FROM_RUNTIME,
                    variables: { mcpToolId: toolId, runtimeId: agent.id },
                });
            }

            onClose();
        } catch (error) {
            console.error('Error updating agent capabilities:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFilterToggle = (filter: keyof typeof activeFilters) => {
        setActiveFilters(prev => ({
            ...prev,
            [filter]: !prev[filter],
        }));
    };

    const handleServerToggleCollapse = (serverId: string) => {
        setCollapsedServers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serverId)) {
                newSet.delete(serverId);
            } else {
                newSet.add(serverId);
            }
            return newSet;
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Manage {agent.name} capabilities
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-6">
                    {/* Search and Filters */}
                    <div className="mb-6 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tools..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <Button
                                variant={activeFilters.mcp ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => handleFilterToggle('mcp')}
                            >
                                MCP
                            </Button>
                            <Button
                                variant={activeFilters.api ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => handleFilterToggle('api')}
                                disabled
                            >
                                API
                            </Button>
                            <Button
                                variant={activeFilters.composed ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => handleFilterToggle('composed')}
                                disabled
                            >
                                Composed
                            </Button>
                        </div>
                    </div>

                    {/* Tools List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading tools...</div>
                        ) : filteredServers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {searchTerm ? 'No tools found matching your search.' : 'No MCP tools available.'}
                            </div>
                        ) : (
                            filteredServers.map((server) => {
                                const serverToolIds = server.tools.map(tool => tool.id);
                                const allServerToolsSelected = serverToolIds.every(id => selectedTools.has(id));
                                const someServerToolsSelected = serverToolIds.some(id => selectedTools.has(id));

                                return (
                                    <Card key={server.id} className="border border-gray-200">
                                        <CardContent className="p-0">
                                            {/* Server Header */}
                                            <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                                                <button
                                                    onClick={() => handleServerToggleCollapse(server.id)}
                                                    className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600"
                                                >
                                                    {collapsedServers.has(server.id) ? (
                                                        <ChevronRight className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3" />
                                                    )}
                                                </button>
                                                <input
                                                    type="checkbox"
                                                    checked={allServerToolsSelected}
                                                    ref={(input) => {
                                                        if (input) input.indeterminate = someServerToolsSelected && !allServerToolsSelected;
                                                    }}
                                                    onChange={() => handleServerToggle(server)}
                                                    className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate">{server.name}</h3>
                                                    <p className="text-xs text-gray-500 truncate">{server.description}</p>
                                                </div>
                                            </div>

                                            {/* Server Tools */}
                                            {!collapsedServers.has(server.id) && (
                                                <div className="p-3 pt-1">
                                                    <div className="space-y-1">
                                                        {server.tools.map((tool) => (
                                                            <div key={tool.id} className="flex items-center gap-2 pl-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedTools.has(tool.id)}
                                                                    onChange={() => handleToolToggle(tool.id)}
                                                                    className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                                                                    <div className="text-xs text-gray-500 truncate">{tool.description}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <CardFooter className="border-t border-gray-200 p-6">
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleApply}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Applying...' : 'Apply'}
                        </Button>
                    </div>
                </CardFooter>
            </div>
        </div>
    );
};

export default ManageAgentCapabilities;
