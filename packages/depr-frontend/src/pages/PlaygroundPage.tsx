import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../contexts/useWorkspace';
import { useMCPTools } from '../hooks/useMCPTools';
import { ToolListPanel } from '../components/playground/ToolListPanel';
import { ToolTestingPanel } from '../components/playground/ToolTestingPanel';
import { client } from '../services/apollo.client';
import { CALL_MCP_TOOL_MUTATION } from '../graphql';

interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

/**
 * Playground page for testing MCP tools
 * Features a split-pane layout with tool selection on the left and testing panel on the right
 */
const PlaygroundPage: React.FC = () => {
  const { runtimes } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
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
  } = useMCPTools(runtimes);

  // Initialize filters from URL parameters on mount
  useEffect(() => {
    const agentIds = searchParams.get('agentIds');
    const serverIds = searchParams.get('serverIds');
    const search = searchParams.get('search');

    if (agentIds) {
      setSelectedAgentIds(agentIds.split(','));
    }
    if (serverIds) {
      setSelectedServerIds(serverIds.split(','));
    }
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams, setSearchTerm, setSelectedAgentIds, setSelectedServerIds]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedAgentIds.length > 0) {
      params.set('agentIds', selectedAgentIds.join(','));
    }
    if (selectedServerIds.length > 0) {
      params.set('serverIds', selectedServerIds.join(','));
    }
    if (searchTerm) {
      params.set('search', searchTerm);
    }

    // Only update if params changed to avoid unnecessary history entries
    const newSearch = params.toString();
    if (newSearch !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedAgentIds, selectedServerIds, searchTerm, setSearchParams, searchParams]);

  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Find the selected tool and its server
  const selectedToolData = useMemo(() => {
    if (!selectedToolId) return null;
    return allTools.find((item) => item.tool.id === selectedToolId) || null;
  }, [selectedToolId, allTools]);

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId);
    setExecutionResult(null); // Clear previous result when selecting a new tool
  };

  const handleCallTool = async (toolId: string, input: Record<string, unknown>) => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await client.mutate({
        mutation: CALL_MCP_TOOL_MUTATION,
        variables: {
          toolId,
          input: JSON.stringify(input),
        },
      });

      if (response.data?.callMCPTool) {
        const { success, result, error } = response.data.callMCPTool;

        if (success) {
          // Parse the result if it's a JSON string
          let parsedResult = result;
          if (typeof result === 'string') {
            try {
              parsedResult = JSON.parse(result);
            } catch {
              // Keep as string if not valid JSON
              parsedResult = result;
            }
          }

          setExecutionResult({
            success: true,
            result: parsedResult,
          });
        } else {
          setExecutionResult({
            success: false,
            error: error || 'Tool execution failed',
          });
        }
      }
    } catch (error) {
      console.error('Error calling MCP tool:', error);
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tool Playground</h1>
          <p className="text-gray-500">Test and experiment with your MCP tools</p>
        </div>
      </div>

      {/* Split Pane Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden">
        {/* Left Panel - Tool List (40% width on large screens) */}
        <div className="lg:col-span-2 overflow-hidden">
          <div className="h-full bg-white rounded-lg border border-gray-200 p-4">
            <ToolListPanel
              tools={filteredTools}
              selectedToolId={selectedToolId}
              onSelectTool={handleSelectTool}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              servers={mcpServers}
              selectedServerIds={selectedServerIds}
              onServerFilterChange={setSelectedServerIds}
              agents={runtimes}
              selectedAgentIds={selectedAgentIds}
              onAgentFilterChange={setSelectedAgentIds}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Panel - Tool Testing (60% width on large screens) */}
        <div className="lg:col-span-3 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
            <ToolTestingPanel
              tool={selectedToolData?.tool || null}
              server={selectedToolData?.server || null}
              onCallTool={handleCallTool}
              isExecuting={isExecuting}
              executionResult={executionResult}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage;