/**
 * AI Tool Suggester Dialog Component
 *
 * WHY: Use AI to suggest relevant tools for a tool set based on natural language description.
 * Provides an intelligent way to discover and add tools without manual searching.
 *
 * FEATURES:
 * - Natural language input for goal description
 * - AI-powered tool suggestions with confidence scores
 * - External MCP server suggestions when no internal tools match
 * - Select/deselect individual suggestions
 * - Bulk add selected tools to tool set
 * - Loading and error states
 */

import { useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertCircle, Info, ExternalLink, CheckCircle2, X, Package, Plus } from 'lucide-react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useAddServerWorkflow } from '@/stores/uiStore';
import {
  SuggestToolsForToolSetDocument,
  LinkMcpToolToRuntimeDocument,
  type AiToolSuggestion,
} from '@/graphql/generated/graphql';

interface AIToolSuggesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolSetId: string;
  toolSetName: string;
}

export function AIToolSuggesterDialog({ open, onOpenChange, toolSetId, toolSetName }: AIToolSuggesterDialogProps) {
  const workspaceId = useWorkspaceId();
  const { setOpen: setAddServerWorkflowOpen, setInitialStep } = useAddServerWorkflow();

  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState<AiToolSuggestion[]>([]);
  const [externalSuggestions, setExternalSuggestions] = useState<string[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // Query for suggestions
  const [getSuggestions, { loading: suggestLoading, error: suggestError }] = useLazyQuery(
    SuggestToolsForToolSetDocument,
  );

  // Mutation to add tools
  const [linkTool, { loading: addLoading }] = useMutation(LinkMcpToolToRuntimeDocument);

  const handleGetSuggestions = async () => {
    if (!description.trim() || !workspaceId) return;

    setHasSearched(false);
    setSuggestions([]);
    setExternalSuggestions([]);
    setSelectedToolIds(new Set());

    try {
      const result = await getSuggestions({
        variables: {
          workspaceId,
          description: description.trim(),
        },
      });

      if (result.data) {
        setSuggestions(result.data.suggestToolsForToolSet.suggestions);
        setExternalSuggestions(result.data.suggestToolsForToolSet.externalSuggestions);
        setSelectedToolIds(new Set(result.data.suggestToolsForToolSet.suggestions.map((s) => s.toolId)));
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setHasSearched(true);
    }
  };

  const handleToggleTool = (toolId: string) => {
    setSelectedToolIds((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    const toolsToAdd = Array.from(selectedToolIds);

    try {
      for (const toolId of toolsToAdd) {
        await linkTool({
          variables: {
            mcpToolId: toolId,
            runtimeId: toolSetId,
          },
        });
      }

      // Close dialog on success
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Failed to add tools:', error);
    }
  };

  const resetState = () => {
    setDescription('');
    setSuggestions([]);
    setExternalSuggestions([]);
    setSelectedToolIds(new Set());
    setHasSearched(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const handleViewRepository = (serverName: string) => {
    // Open MCP registry page for this server
    const registryUrl = `https://github.com/modelcontextprotocol/servers/tree/main/src/${serverName}`;
    window.open(registryUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddServer = () => {
    // Close this dialog and open the add server workflow
    onOpenChange(false);
    resetState();

    // Open add server workflow with upstream step (to search for the server)
    setInitialStep('upstream');
    setAddServerWorkflowOpen(true);

    // Note: We can't pre-populate the search, but the user can search for the server name
    // This is a limitation of the current workflow - could be enhanced in the future
  };

  const canSearch = description.trim().length > 0 && !suggestLoading;
  const canAdd = selectedToolIds.size > 0 && !addLoading;
  const hasInternalSuggestions = suggestions.length > 0;
  const hasExternalSuggestions = externalSuggestions.length > 0;
  const noSuggestions = hasSearched && !hasInternalSuggestions && !hasExternalSuggestions && !suggestError;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-w-3xl max-h-[80vh] w-full -translate-x-1/2 -translate-y-1/2 gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg flex flex-col">
          <div className="flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              AI Tool Suggester
            </Dialog.Title>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-gray-800 dark:data-[state=open]:bg-gray-800">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">
            Describe what you want to accomplish, and AI will suggest relevant tools for{' '}
            <span className="font-medium">{toolSetName}</span>.
          </Dialog.Description>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Description Input */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              What do you want to do?
            </label>
            <Textarea
              id="description"
              placeholder="E.g., I want to send email, analyze data, search the web..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              disabled={suggestLoading}
            />
            <Button onClick={handleGetSuggestions} disabled={!canSearch} className="gap-2">
              {suggestLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Sparkles className="h-4 w-4" />
              Get AI Suggestions
            </Button>
          </div>

          {/* Error Message */}
          {suggestError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{suggestError.message}</AlertDescription>
            </Alert>
          )}

          {/* No AI Config Warning */}
          {suggestError?.message.includes('AI configuration not found') && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please configure your AI settings in the Settings page before using this feature.
              </AlertDescription>
            </Alert>
          )}

          {/* No Suggestions */}
          {noSuggestions && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No tool suggestions found. Try rephrasing your description or check if you have tools available in your
                workspace.
              </AlertDescription>
            </Alert>
          )}

          {/* Internal Tool Suggestions */}
          {hasInternalSuggestions && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Suggested Tools</h3>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <label
                    key={suggestion.toolId}
                    className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedToolIds.has(suggestion.toolId)}
                      onCheckedChange={() => handleToggleTool(suggestion.toolId)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{suggestion.toolName}</span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                          {Math.round(suggestion.confidence * 100)}% match
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.reason}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* External MCP Server Suggestions */}
          {hasExternalSuggestions && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">External MCP Servers</h3>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  AI suggests these MCP servers from the registry. Add them to your workspace to use their tools.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                {externalSuggestions.map((serverName) => (
                  <div
                    key={serverName}
                    className="flex items-center justify-between gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white truncate">{serverName}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRepository(serverName)}
                        className="gap-1.5"
                        title="View repository"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddServer}
                        className="gap-1.5"
                        title="Add to workspace"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedToolIds.size > 0 && (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  {selectedToolIds.size} tool{selectedToolIds.size !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClose} disabled={addLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddSelected} disabled={!canAdd} className="gap-2">
                {addLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Selected Tools
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
