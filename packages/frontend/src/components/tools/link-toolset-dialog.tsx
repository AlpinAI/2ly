/**
 * Link ToolSet Dialog Component
 *
 * WHY: Dialog for linking tools to toolsets with search functionality.
 * Replaces the dropdown menu for better UX with long toolset lists.
 *
 * FEATURES:
 * - Search input to filter toolsets in real-time
 * - Loading states during link operations
 * - "Create New ToolSet" functionality
 * - Keyboard navigation support
 * - Auto-links tool to newly created toolset
 */

import { useState, useMemo, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useParams } from 'react-router-dom';
import { X, Search, Settings, Plus, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToolSets } from '@/hooks/useToolSets';
import { useNotification } from '@/contexts/NotificationContext';
import { useCreateToolsetDialog } from '@/stores/uiStore';
import { AddMcpToolToToolSetDocument } from '@/graphql/generated/graphql';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';

type McpTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

export interface LinkToolSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: McpTool;
}

export function LinkToolSetDialog({ open, onOpenChange, tool }: LinkToolSetDialogProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { toolSets } = useToolSets(workspaceId!);
  const { toast } = useNotification();
  const { openDialog: openCreateToolsetDialog } = useCreateToolsetDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLinking, setIsLinking] = useState<string | null>(null);

  const [linkTool] = useMutation(AddMcpToolToToolSetDocument);

  // Get toolsets not yet linked to this tool
  const unlinkedToolSets = useMemo(() => {
    const linkedToolSetIds = new Set(tool.toolSets?.map((ts) => ts.id) || []);
    return toolSets.filter((toolSet) => !linkedToolSetIds.has(toolSet.id));
  }, [toolSets, tool.toolSets]);

  // Filter toolsets based on search term
  const filteredToolSets = useMemo(() => {
    if (!searchTerm.trim()) return unlinkedToolSets;

    const query = searchTerm.toLowerCase();
    return unlinkedToolSets.filter((toolSet) =>
      toolSet.name.toLowerCase().includes(query) ||
      (toolSet.description && toolSet.description.toLowerCase().includes(query))
    );
  }, [unlinkedToolSets, searchTerm]);

  // Handle linking tool to toolset
  const handleLinkTool = useCallback(async (toolSetId: string) => {
    setIsLinking(toolSetId);

    try {
      await linkTool({
        variables: {
          mcpToolId: tool.id,
          toolSetId: toolSetId,
        },
      });

      toast({
        title: 'Tool linked successfully',
        description: 'Tool has been linked to the tool set.',
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

  // Handle clicking "+Tool Set" button
  const handleCreateToolSet = useCallback(() => {
    // Open the shared CreateToolsetDialog with callback to auto-link
    openCreateToolsetDialog(async (toolSetId: string) => {
      setSearchTerm('');
      await handleLinkTool(toolSetId);
    });
  }, [openCreateToolsetDialog, handleLinkTool]);

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
                Link Tool to Tool Set
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
            {/* Search Input and Create Tool Set Button */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tool sets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleCreateToolSet}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Tool Set
              </Button>
            </div>

            {/* ToolSet List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredToolSets.length > 0 ? (
                filteredToolSets.map((toolSet) => (
                  <div
                    key={toolSet.id}
                    className="flex items-center gap-3 p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => handleLinkTool(toolSet.id)}
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {toolSet.name}
                      </p>
                      {toolSet.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {toolSet.description}
                        </p>
                      )}
                    </div>
                    {isLinking === toolSet.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? (
                    <>
                      <p className="text-sm">No tool sets found matching "{searchTerm}"</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">No available tool sets</p>
                      <p className="text-xs mt-1">Create a new tool set to get started</p>
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
