/**
 * Create Toolset Dialog Component
 *
 * WHY: App-wide conversational dialog for creating new toolsets with AI assistance.
 * Accessible from ToolsetsPage, Command Palette, and other components.
 *
 * NEW CONVERSATIONAL WORKFLOW:
 * 1. User describes their goal in natural language
 * 2. AI suggests: name (max 6 words), description (max 60 words), and relevant tools
 * 3. User can edit all suggestions before creating
 * 4. Toolset is created with metadata and selected tools in one step
 *
 * FEATURES:
 * - Natural language goal input with AI-powered suggestions
 * - Editable AI-suggested name and description
 * - Tool selection with confidence scores
 * - External MCP server suggestions when no internal tools match
 * - Browse all tools capability with search
 * - Form validation and loading states
 * - Success callback for custom post-creation behavior
 *
 * ARCHITECTURE:
 * - Rendered in AppLayout for app-wide availability
 * - State managed in UIStore with callback registration pattern
 * - Creates ToolSet and links suggested tools
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { Plus, Sparkles, AlertCircle, Info, CheckCircle2, Edit2, Package, ExternalLink, Search } from 'lucide-react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateToolsetDialog, useAddServerWorkflow } from '@/stores/uiStore';
import { useParams } from 'react-router-dom';
import { useNotification } from '@/contexts/NotificationContext';
import { useMCPTools } from '@/hooks/useMCPTools';
import {
  CreateToolSetDocument,
  SuggestToolSetMetadataDocument,
  AddMcpToolToToolSetDocument,
  type ToolSetMetadataSuggestion,
} from '@/graphql/generated/graphql';

type WorkflowStep = 'goal' | 'review';

export function CreateToolsetDialog() {
  const { open, callback, close } = useCreateToolsetDialog();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { toast } = useNotification();
  const { setOpen: setAddServerWorkflowOpen, setInitialStep } = useAddServerWorkflow();
  const { filteredTools: allTools } = useMCPTools();

  // Workflow state
  const [step, setStep] = useState<WorkflowStep>('goal');
  const [userGoal, setUserGoal] = useState('');

  // AI suggestions state
  const [aiSuggestion, setAiSuggestion] = useState<ToolSetMetadataSuggestion | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Browse all tools state
  const [showAllTools, setShowAllTools] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');

  // GraphQL operations
  const [getSuggestions, { loading: suggestLoading, error: suggestError }] = useLazyQuery(
    SuggestToolSetMetadataDocument,
  );

  const [createToolSet, { loading: createLoading }] = useMutation(CreateToolSetDocument, {
    refetchQueries: ['SubscribeToolSets'],
  });

  const [addToolToToolSet] = useMutation(AddMcpToolToToolSetDocument);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('goal');
      setUserGoal('');
      setAiSuggestion(null);
      setName('');
      setDescription('');
      setSelectedToolIds(new Set());
      setIsEditingName(false);
      setIsEditingDescription(false);
      setShowAllTools(false);
      setToolSearchQuery('');
    }
  }, [open]);

  // Filter tools for browsing
  const browsableTools = useMemo(() => {
    if (!showAllTools) return [];

    const suggestedIds = new Set(aiSuggestion?.suggestions.map((s) => s.toolId) || []);

    return allTools
      .filter((tool) => {
        // Filter by search query
        if (toolSearchQuery) {
          const query = toolSearchQuery.toLowerCase();
          return (
            tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query) ||
            tool.mcpServer.name.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .map((tool) => ({
        ...tool,
        isSuggested: suggestedIds.has(tool.id),
      }));
  }, [showAllTools, allTools, toolSearchQuery, aiSuggestion]);

  // Handle AI suggestions
  const handleGetSuggestions = useCallback(async () => {
    if (!userGoal.trim() || !workspaceId) return;

    try {
      const result = await getSuggestions({
        variables: {
          workspaceId,
          userGoal: userGoal.trim(),
        },
      });

      if (result.data?.suggestToolSetMetadata) {
        const suggestion = result.data.suggestToolSetMetadata;
        setAiSuggestion(suggestion);
        setName(suggestion.name);
        setDescription(suggestion.description);
        setSelectedToolIds(new Set(suggestion.suggestions.map((s) => s.toolId)));
        setStep('review');
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      toast({
        title: 'AI Suggestion Failed',
        description: error instanceof Error ? error.message : 'Failed to get suggestions',
        variant: 'error',
      });
    }
  }, [userGoal, workspaceId, getSuggestions, toast]);

  // Handle tool selection toggle
  const handleToggleTool = useCallback((toolId: string) => {
    setSelectedToolIds((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  }, []);

  // Handle creation
  const handleCreate = useCallback(async () => {
    if (!name.trim() || !workspaceId) return;

    try {
      // Create the toolset
      const toolSetResult = await createToolSet({
        variables: {
          workspaceId,
          name: name.trim(),
          description: description.trim(),
        },
      });

      const toolSetId = toolSetResult.data?.createToolSet.id;
      if (!toolSetId) throw new Error('Failed to create toolset');

      // Link selected tools
      const toolsToLink = Array.from(selectedToolIds);
      for (const toolId of toolsToLink) {
        await addToolToToolSet({
          variables: {
            mcpToolId: toolId,
            toolSetId,
          },
        });
      }

      toast({
        title: 'Toolset Created',
        description: `"${name}" has been created with ${toolsToLink.length} tool${toolsToLink.length !== 1 ? 's' : ''}`,
        variant: 'success',
      });

      // Call the success callback if provided
      if (callback) {
        callback(toolSetId);
      }

      close();
    } catch (error) {
      console.error('Error creating toolset:', error);
      toast({
        title: 'Error Creating Toolset',
        description: error instanceof Error ? error.message : 'Failed to create toolset',
        variant: 'error',
      });
    }
  }, [name, description, workspaceId, selectedToolIds, createToolSet, addToolToToolSet, callback, close, toast]);

  // Handle external server navigation
  const handleAddServer = useCallback(() => {
    close();
    setInitialStep('upstream');
    setAddServerWorkflowOpen(true);
  }, [close, setInitialStep, setAddServerWorkflowOpen]);

  const handleViewRepository = useCallback((serverName: string) => {
    const registryUrl = `https://github.com/modelcontextprotocol/servers/tree/main/src/${serverName}`;
    window.open(registryUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const canGetSuggestions = userGoal.trim().length > 0 && !suggestLoading;
  const canCreate = name.trim().length > 0 && !createLoading;
  const hasInternalSuggestions = aiSuggestion && aiSuggestion.suggestions.length > 0;
  const hasExternalSuggestions = aiSuggestion && aiSuggestion.externalSuggestions.length > 0;

  return (
    <FormDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          close();
        }
      }}
      title={step === 'goal' ? 'Create Toolset with AI' : 'Review & Create Toolset'}
      subtitle={
        step === 'goal'
          ? 'Describe what you want to accomplish, and AI will suggest everything you need'
          : 'Review and edit AI suggestions before creating'
      }
      submitLabel={step === 'goal' ? 'Get AI Suggestions' : 'Create Toolset'}
      submitIcon={step === 'goal' ? <Sparkles className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      onSubmit={step === 'goal' ? handleGetSuggestions : handleCreate}
      isSubmitting={step === 'goal' ? suggestLoading : createLoading}
      submitDisabled={step === 'goal' ? !canGetSuggestions : !canCreate}
      showCancel={step === 'review'}
      onCancel={step === 'review' ? () => setStep('goal') : undefined}
      cancelLabel="Back"
      size={step === 'review' ? '2xl' : 'md'}
    >
      {step === 'goal' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-goal">What do you want to accomplish?</Label>
            <Textarea
              id="user-goal"
              placeholder="E.g., I want to manage my GitHub repositories and send emails to my team"
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              className="mt-1.5 min-h-[120px]"
              disabled={suggestLoading}
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Describe your goal in natural language. AI will suggest a toolset name, description, and relevant tools.
            </p>
          </div>

          {suggestError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{suggestError.message}</AlertDescription>
            </Alert>
          )}

          {suggestError?.message.includes('AI configuration not found') && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please configure your AI settings in the Settings page before using this feature.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {step === 'review' && aiSuggestion && (
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <Label htmlFor="toolset-name" className="flex items-center gap-2">
              Name <span className="text-red-500">*</span>
              {!isEditingName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingName(true)}
                  className="h-5 px-1.5 text-xs"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </Label>
            <Input
              id="toolset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
              disabled={!isEditingName}
              autoComplete="off"
            />
            {!isEditingName && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI suggested (click Edit to change)
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <Label htmlFor="toolset-description" className="flex items-center gap-2">
              Description
              {!isEditingDescription && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingDescription(true)}
                  className="h-5 px-1.5 text-xs"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </Label>
            <Textarea
              id="toolset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-[80px]"
              disabled={!isEditingDescription}
            />
            {!isEditingDescription && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI suggested (click Edit to change)
              </p>
            )}
          </div>

          {/* Internal Tool Suggestions */}
          {hasInternalSuggestions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>AI Suggested Tools ({aiSuggestion.suggestions.length} recommended)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllTools(!showAllTools)}
                  className="text-xs"
                >
                  {showAllTools ? 'Hide All Tools' : 'Browse All Tools'}
                </Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900">
                {aiSuggestion.suggestions.map((suggestion) => (
                  <label
                    key={suggestion.toolId}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  >
                    <Checkbox
                      checked={selectedToolIds.has(suggestion.toolId)}
                      onCheckedChange={() => handleToggleTool(suggestion.toolId)}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">{suggestion.toolName}</span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex-shrink-0">
                          {Math.round(suggestion.confidence * 100)}% match
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{suggestion.reason}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Browse All Tools Section */}
          {showAllTools && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search tools by name, description, or server..."
                    value={toolSearchQuery}
                    onChange={(e) => setToolSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                {browsableTools.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    {toolSearchQuery ? 'No tools found matching your search' : 'No tools available'}
                  </p>
                ) : (
                  browsableTools.map((tool) => (
                    <label
                      key={tool.id}
                      className="flex items-start gap-3 p-3 hover:bg-white dark:hover:bg-gray-800 rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                      <Checkbox
                        checked={selectedToolIds.has(tool.id)}
                        onCheckedChange={() => handleToggleTool(tool.id)}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white">{tool.name}</span>
                          {tool.isSuggested && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full flex-shrink-0">
                              AI Suggested
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            from {tool.mcpServer.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{tool.description}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* External MCP Server Suggestions */}
          {hasExternalSuggestions && (
            <div className="space-y-3">
              <Label>External MCP Servers</Label>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  AI suggests these MCP servers from the registry. Add them to your workspace to use their tools.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                {aiSuggestion.externalSuggestions.map((serverName) => (
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
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRepository(serverName)}
                        className="gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button type="button" size="sm" onClick={handleAddServer} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selection Summary */}
          {selectedToolIds.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              {selectedToolIds.size} tool{selectedToolIds.size !== 1 ? 's' : ''} will be added to this toolset
            </div>
          )}
        </div>
      )}
    </FormDialog>
  );
}
