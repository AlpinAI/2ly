/**
 * Link Tool Dialog Component
 *
 * WHY: Dialog for linking tools to agents with search functionality.
 * Replaces the dropdown menu for better UX with long agent lists.
 *
 * FEATURES:
 * - Search input to filter agents in real-time
 * - Visual status indicators for agents (ACTIVE/INACTIVE)
 * - Loading states during link operations
 * - "Create New Agent" functionality
 * - Keyboard navigation support
 * - Auto-links tool to newly created agent
 */

import { useState, useMemo, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, Search, Bot, Plus, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useNotification } from '@/contexts/NotificationContext';
import { useCreateToolSetDialog } from '@/stores/uiStore';
import { LinkMcpToolToRuntimeDocument } from '@/graphql/generated/graphql';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';

type McpTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

export interface LinkToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: McpTool;
}

export function LinkToolDialog({ open, onOpenChange, tool }: LinkToolDialogProps) {
  const { runtimes } = useRuntimeData();
  const { toast } = useNotification();
  const { openDialog: openCreateToolSetDialog } = useCreateToolSetDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLinking, setIsLinking] = useState<string | null>(null);

  const [linkTool] = useMutation(LinkMcpToolToRuntimeDocument);

  // Get available agents (runtimes with 'agent' capability)
  const availableAgents = useMemo(() => {
    return runtimes.filter((runtime) => runtime.capabilities?.includes('agent'));
  }, [runtimes]);

  // Get agents not yet linked to this tool
  const unlinkedAgents = useMemo(() => {
    const linkedAgentIds = new Set(tool.runtimes?.map((r) => r.id) || []);
    return availableAgents.filter((agent) => !linkedAgentIds.has(agent.id));
  }, [availableAgents, tool.runtimes]);

  // Filter agents based on search term
  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) return unlinkedAgents;
    
    const query = searchTerm.toLowerCase();
    return unlinkedAgents.filter((agent) =>
      agent.name.toLowerCase().includes(query) ||
      (agent.description && agent.description.toLowerCase().includes(query))
    );
  }, [unlinkedAgents, searchTerm]);

  // Handle linking tool to agent
  const handleLinkTool = useCallback(async (agentId: string) => {
    setIsLinking(agentId);
    
    try {
      await linkTool({
        variables: {
          mcpToolId: tool.id,
          runtimeId: agentId,
        },
        refetchQueries: ['GetMCPTools'], // Force refresh tools query
      });
      
      toast({
        title: 'Tool linked successfully',
        description: 'Tool has been linked to the agent.',
        variant: 'success',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error linking tool:', error);
      toast({
        title: 'Failed to link tool',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error',
      });
    } finally {
      setIsLinking(null);
    }
  }, [linkTool, tool.id, toast, onOpenChange]);

  // Handle clicking "+Agent" button
  const handleCreateAgent = useCallback(() => {
    // Open the shared CreateToolSetDialog with callback to auto-link
    openCreateToolSetDialog(async (agentId: string) => {
      setSearchTerm('');
      await handleLinkTool(agentId);
    });
  }, [openCreateToolSetDialog, handleLinkTool]);

  // Reset state when dialog closes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setSearchTerm('');
      setIsLinking(null);
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                Link Tool to Agent
              </Dialog.Title>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {tool.name}
              </p>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search Input and Create Agent Button */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleCreateAgent}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agent
              </Button>
            </div>

            {/* Agent List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => handleLinkTool(agent.id)}
                  >
                    <Bot className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {agent.name}
                      </p>
                      {agent.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {agent.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          agent.status === 'ACTIVE'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {agent.status}
                      </span>
                      {isLinking === agent.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? (
                    <>
                      <p className="text-sm">No agents found matching "{searchTerm}"</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">No available agents</p>
                      <p className="text-xs mt-1">Create a new agent to get started</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
