import { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { apolloResolversTypes } from '@2ly/common';
import { gql } from '@apollo/client/core';
import { client } from '../../services/apollo.client';
import { Search } from 'lucide-react';
import CheckboxDropdown from '../ui/CheckboxDropdown';
import ToolTreeTable from './ToolTreeTable';

export interface ManageToolsHandle {
    applyTools: () => Promise<boolean>;
}

interface ManageToolsProps {
    agent: apolloResolversTypes.Runtime | null;
    onCanProceedChange: (canProceed: boolean) => void;
}

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
      mcpToolCapabilities { id name }
    }
  }
`;

const UNLINK_TOOL_FROM_RUNTIME = gql`
  mutation unlinkMCPToolFromRuntime($mcpToolId: ID!, $runtimeId: ID!) {
    unlinkMCPToolFromRuntime(mcpToolId: $mcpToolId, runtimeId: $runtimeId) {
      id
      name
      mcpToolCapabilities { id name }
    }
  }
`;

type ToolTypeFilter = 'mcp' | 'api' | 'composed';

interface GroupedMCPServer {
    id: string;
    name: string;
    description: string;
    tools: apolloResolversTypes.McpTool[];
}

const ManageTools = forwardRef<ManageToolsHandle, ManageToolsProps>(({ agent, onCanProceedChange }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<ToolTypeFilter, boolean>>({ mcp: true, api: false, composed: false });
    const [mcpServers, setMcpServers] = useState<GroupedMCPServer[]>([]);
    const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
    const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    const [baselineToolIds, setBaselineToolIds] = useState<Set<string>>(new Set());
    useEffect(() => {
        onCanProceedChange(true);
    }, [onCanProceedChange]);

    useEffect(() => {
        if (!agent) return;
        const ids = (agent.mcpToolCapabilities || []).map(tc => tc.id);
        setSelectedTools(new Set(ids));
        setBaselineToolIds(new Set(ids));
    }, [agent]);

    useEffect(() => {
        const loadMCPServers = async () => {
            setIsLoading(true);
            try {
                const result = await client.query({ query: QUERY_MCP_SERVERS });
                if (result.data?.mcpServers) {
                    const servers: GroupedMCPServer[] = result.data.mcpServers.map((server: apolloResolversTypes.McpServer) => ({
                        id: server.id,
                        name: server.name,
                        description: server.description,
                        tools: server.tools || [],
                    }));
                    setMcpServers(servers);
                }
            } catch (error) {
                console.error('Error loading MCP servers', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadMCPServers();
    }, []);

    const filteredServers = useMemo(() => {
        if (!activeFilters.mcp) return [] as GroupedMCPServer[];
        const term = searchTerm.toLowerCase();
        const filterByServers = selectedServerIds.length > 0 ? (s: GroupedMCPServer) => selectedServerIds.includes(s.id) : () => true;
        return mcpServers
            .filter(filterByServers)
            .map(server => ({
                ...server,
                tools: (server.tools || []).filter(tool =>
                    tool.name.toLowerCase().includes(term) || tool.description.toLowerCase().includes(term)
                ),
            }))
            .filter(s => s.tools.length > 0 || s.name.toLowerCase().includes(term) || s.description.toLowerCase().includes(term));
    }, [activeFilters.mcp, mcpServers, searchTerm, selectedServerIds]);

    const allVisibleToolIds = useMemo(() => {
        const ids: string[] = [];
        filteredServers.forEach(server => server.tools.forEach(tool => ids.push(tool.id)));
        return ids;
    }, [filteredServers]);

    const areAllVisibleSelected = allVisibleToolIds.length > 0 && allVisibleToolIds.every(id => selectedTools.has(id));
    const isSomeVisibleSelected = allVisibleToolIds.some(id => selectedTools.has(id));

    const toggleTool = (toolId: string) => {
        setSelectedTools(prev => {
            const next = new Set(prev);
            if (next.has(toolId)) next.delete(toolId); else next.add(toolId);
            return next;
        });
    };

    const toggleAllVisible = () => {
        setSelectedTools(prev => {
            const next = new Set(prev);
            if (areAllVisibleSelected) {
                allVisibleToolIds.forEach(id => next.delete(id));
            } else {
                allVisibleToolIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const handleApply = useCallback(async (): Promise<boolean> => {
        if (!agent) return false;
        try {
            const currentToolIds = baselineToolIds;
            const toolsToAdd = Array.from(selectedTools).filter(id => !currentToolIds.has(id));
            const toolsToRemove = Array.from(currentToolIds).filter(id => !selectedTools.has(id));

            for (const toolId of toolsToAdd) {
                await client.mutate({ mutation: LINK_TOOL_TO_RUNTIME, variables: { mcpToolId: toolId, runtimeId: agent.id } });
            }
            for (const toolId of toolsToRemove) {
                await client.mutate({ mutation: UNLINK_TOOL_FROM_RUNTIME, variables: { mcpToolId: toolId, runtimeId: agent.id } });
            }
            setBaselineToolIds(new Set(selectedTools));
            return true;
        } catch (error) {
            console.error('Error applying tools to agent', error);
            return false;
        }
    }, [agent, selectedTools, baselineToolIds]);

    useImperativeHandle(ref, () => ({
        applyTools: handleApply
    }), [handleApply]);

    return (
        <div className="flex flex-col h-full min-h-0 space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
                    Manage [{agent?.name ? <span className="text-gray-500">{agent.name}</span> : null}] tools
                </h2>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <CheckboxDropdown
                        label="Servers"
                        items={mcpServers.map(s => ({ id: s.id, label: s.name }))}
                        selectedIds={selectedServerIds}
                        onChange={setSelectedServerIds}
                    />
                    <CheckboxDropdown
                        label="Type"
                        items={[
                            { id: 'mcp', label: 'MCP' },
                            { id: 'api', label: 'API' },
                            { id: 'composed', label: 'Composed' },
                        ]}
                        selectedIds={Object.entries(activeFilters).filter(([, v]) => v).map(([k]) => k)}
                        onChange={(ids) => setActiveFilters({ mcp: ids.includes('mcp'), api: ids.includes('api'), composed: ids.includes('composed') })}
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading tools...</div>
                ) : filteredServers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">{searchTerm ? 'No tools found matching your search.' : 'No MCP tools available.'}</div>
                ) : (
                    <ToolTreeTable
                        servers={filteredServers}
                        selectedTools={selectedTools}
                        areAllVisibleSelected={areAllVisibleSelected}
                        isSomeVisibleSelected={isSomeVisibleSelected}
                        onToggleAllVisible={toggleAllVisible}
                        onToggleTool={toggleTool}
                        onToggleServerToolIds={(toolIds) => {
                            const allSelected = toolIds.every(id => selectedTools.has(id));
                            setSelectedTools(prev => {
                                const next = new Set(prev);
                                if (allSelected) toolIds.forEach(id => next.delete(id)); else toolIds.forEach(id => next.add(id));
                                return next;
                            });
                        }}
                    />
                )}
            </div>
        </div>
    );
});

ManageTools.displayName = 'ManageTools';

export default ManageTools;



