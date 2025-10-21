import { useState, useEffect, useMemo } from 'react';
import { apolloResolversTypes } from '@2ly/common';
import { gql } from '@apollo/client/core';
import { client } from '../services/apollo.client';

const QUERY_MCP_SERVERS = gql`
  query getMCPServers {
    mcpServers {
      id
      name
      description
      runOn
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

export interface GroupedMCPServer {
  id: string;
  name: string;
  description: string;
  runOn?: 'GLOBAL' | 'AGENT' | 'EDGE' | null;
  tools: apolloResolversTypes.McpTool[];
}

export interface UseMCPToolsResult {
  mcpServers: GroupedMCPServer[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedServerIds: string[];
  setSelectedServerIds: (ids: string[]) => void;
  selectedAgentIds: string[];
  setSelectedAgentIds: (ids: string[]) => void;
  filteredTools: Array<{
    tool: apolloResolversTypes.McpTool;
    server: GroupedMCPServer;
  }>;
  allTools: Array<{
    tool: apolloResolversTypes.McpTool;
    server: GroupedMCPServer;
  }>;
}

/**
 * Custom hook for fetching and filtering MCP servers and tools
 * Provides search and filtering capabilities across servers and their tools
 */
export function useMCPTools(
  runtimes: apolloResolversTypes.Runtime[]
): UseMCPToolsResult {
  const [mcpServers, setMCPServers] = useState<GroupedMCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load MCP servers and tools
        const serversResult = await client.query({ query: QUERY_MCP_SERVERS });
        if (serversResult.data?.mcpServers) {
          const servers: GroupedMCPServer[] = serversResult.data.mcpServers.map(
            (server: apolloResolversTypes.McpServer) => ({
              id: server.id,
              name: server.name,
              description: server.description,
              runOn: server.runOn,
              tools: server.tools || [],
            })
          );
          setMCPServers(servers);
        }
      } catch (error) {
        console.error('Error loading MCP servers and tools:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Flatten all tools with their server information
  const allTools = useMemo(() => {
    const tools: Array<{
      tool: apolloResolversTypes.McpTool;
      server: GroupedMCPServer;
    }> = [];

    mcpServers.forEach((server) => {
      if (server.tools) {
        server.tools.forEach((tool) => {
          tools.push({ tool, server });
        });
      }
    });

    return tools;
  }, [mcpServers]);

  // Build a map of tool IDs to agent IDs for agent filtering
  const toolToAgentsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    runtimes.forEach((runtime) => {
      runtime.mcpToolCapabilities?.forEach((tool) => {
        if (!map.has(tool.id)) {
          map.set(tool.id, new Set());
        }
        map.get(tool.id)!.add(runtime.id);
      });
    });
    return map;
  }, [runtimes]);

  // Apply all filters to get the final filtered list
  const filteredTools = useMemo(() => {
    let filtered = allTools;

    // Filter by agent selection
    if (selectedAgentIds.length > 0) {
      filtered = filtered.filter((item) => {
        const agentIds = toolToAgentsMap.get(item.tool.id);
        return agentIds && selectedAgentIds.some(id => agentIds.has(id));
      });
    }

    // Filter by server selection
    if (selectedServerIds.length > 0) {
      filtered = filtered.filter((item) => selectedServerIds.includes(item.server.id));
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.tool.name.toLowerCase().includes(searchLower) ||
          item.tool.description.toLowerCase().includes(searchLower) ||
          item.server.name.toLowerCase().includes(searchLower) ||
          item.server.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allTools, selectedAgentIds, selectedServerIds, searchTerm, toolToAgentsMap]);

  return {
    mcpServers,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedServerIds,
    setSelectedServerIds,
    selectedAgentIds,
    setSelectedAgentIds,
    filteredTools,
    allTools,
  };
}