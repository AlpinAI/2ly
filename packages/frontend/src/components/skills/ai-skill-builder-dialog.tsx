/**
 * AI Skill Builder Dialog Component
 *
 * WHY: Allows users to create skills using AI by describing their intent.
 * The AI generates skill metadata (name, scope, guardrails, knowledge) and suggests relevant tools.
 *
 * FEATURES:
 * - Two-step process: Intent collection → Review & Edit
 * - AI-powered generation using workspace's default AI model
 * - Editable form fields with validation
 * - Tool selection with checkboxes
 * - Character limit enforcement
 * - Error handling and retry mechanism
 *
 * USAGE:
 * ```tsx
 * const { openDialog } = useAISkillBuilderDialog();
 *
 * // Open dialog with optional callback
 * openDialog((skillId) => {
 *   console.log('Skill created:', skillId);
 * });
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { X, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAISkillBuilderDialog } from '@/stores/uiStore';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  CreateSkillDocument,
  AddMcpToolToSkillDocument,
  GetMcpToolsDocument,
  ChatWithModelDocument,
  GetDefaultAiModelDocument,
} from '@/graphql/generated/graphql';
import { useNotification } from '@/contexts/NotificationContext';
import {
  parseCustomPrompts,
  getSkillGenerationPrompt,
  replaceVariables,
  type PromptVariables,
} from '@/lib/promptTemplates';

// Character limits based on issue requirements
const CHAR_LIMITS = {
  name: 100,
  scope: 300,
  guardrails: 10000,
  knowledge: 10000,
};

interface GeneratedSkillData {
  name: string;
  scope: string;
  guardrails: string;
  knowledge: string;
  toolIds: string[];
}

type Step = 'intent' | 'review';

export function AISkillBuilderDialog() {
  const { open, close, callback } = useAISkillBuilderDialog();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { toast } = useNotification();

  // Step management
  const [step, setStep] = useState<Step>('intent');
  const [intent, setIntent] = useState('');

  // Generated data (extracted into individual state variables)
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [guardrails, setGuardrails] = useState('');
  const [knowledge, setKnowledge] = useState('');
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch default AI model
  const { data: aiModelData } = useQuery(GetDefaultAiModelDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId || !open,
  });

  // Fetch available tools
  const { data: toolsData } = useQuery(GetMcpToolsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId || !open,
  });

  // Chat with AI mutation
  const [chatWithModel] = useMutation(ChatWithModelDocument);

  // Create skill mutation
  const [createSkill] = useMutation(CreateSkillDocument, {
    refetchQueries: ['SubscribeSkills'],
  });

  // Add tool to skill mutation
  const [addToolToSkill] = useMutation(AddMcpToolToSkillDocument);

  const defaultAIModel = aiModelData?.workspace?.defaultAIModel;
  const availableTools = toolsData?.mcpTools || [];
  const customPrompts = parseCustomPrompts(aiModelData?.workspace?.customPrompts);

  // Reset form state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('intent');
        setIntent('');
        setName('');
        setScope('');
        setGuardrails('');
        setKnowledge('');
        setSelectedToolIds(new Set());
        setIsGenerating(false);
        setIsCreating(false);
      }, 300);
    }
  }, [open]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (isGenerating || isCreating) return; // Prevent closing during operations
    close();
  }, [close, isGenerating, isCreating]);

  // Handle open change from Radix
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Build AI prompt using custom or default template
  const buildAIPrompt = (userIntent: string): string => {
    const toolsList =
      availableTools.length > 0
        ? availableTools.map((t: { id: string; name: string; description: string }) => `- ${t.id}: ${t.name} - ${t.description}`).join('\n')
        : 'No tools available';

    // Get the prompt template (custom or default)
    const template = getSkillGenerationPrompt(customPrompts);

    // Prepare variables for replacement
    const variables: PromptVariables = {
      intent: userIntent,
      tools: toolsList,
      workspace: aiModelData?.workspace?.name,
    };

    // Replace variables in template
    return replaceVariables(template, variables);
  };

  // Parse AI response
  const parseAIResponse = (response: string): GeneratedSkillData => {
    // Try to extract JSON from response (in case AI wraps it in markdown)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.name || !parsed.scope || !parsed.guardrails || !parsed.knowledge) {
      throw new Error('AI response missing required fields');
    }

    // Enforce character limits
    const data: GeneratedSkillData = {
      name: parsed.name.substring(0, CHAR_LIMITS.name),
      scope: parsed.scope.substring(0, CHAR_LIMITS.scope),
      guardrails: parsed.guardrails.substring(0, CHAR_LIMITS.guardrails),
      knowledge: parsed.knowledge.substring(0, CHAR_LIMITS.knowledge),
      toolIds: Array.isArray(parsed.toolIds) ? parsed.toolIds : [],
    };

    // Filter out invalid tool IDs
    const validToolIds = new Set(availableTools.map((t: { id: string }) => t.id));
    data.toolIds = data.toolIds.filter((id: string) => validToolIds.has(id));

    return data;
  };

  // Handle AI generation
  const handleGenerate = async () => {
    if (!intent.trim()) {
      toast({
        title: 'Intent Required',
        description: 'Please describe what skill you want to build.',
        variant: 'error',
      });
      return;
    }

    if (!defaultAIModel) {
      toast({
        title: 'No AI Model Configured',
        description: 'Please configure an AI provider and set a default model in settings.',
        variant: 'error',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = buildAIPrompt(intent.trim());

      const { data, error } = await chatWithModel({
        variables: {
          workspaceId: workspaceId || '',
          model: defaultAIModel,
          message: prompt,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.chatWithModel) {
        throw new Error('No response from AI model');
      }

      const generated = parseAIResponse(data.chatWithModel);

      // Populate form fields
      setName(generated.name);
      setScope(generated.scope);
      setGuardrails(generated.guardrails);
      setKnowledge(generated.knowledge);
      setSelectedToolIds(new Set(generated.toolIds));

      // Move to review step
      setStep('review');
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Generation Failed',
        description:
          error instanceof Error ? error.message : 'Failed to generate skill. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle start over
  const handleStartOver = () => {
    setStep('intent');
    setName('');
    setScope('');
    setGuardrails('');
    setKnowledge('');
    setSelectedToolIds(new Set());
  };

  // Handle skill creation
  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please provide a name for the skill.',
        variant: 'error',
      });
      return;
    }

    if (!scope.trim()) {
      toast({
        title: 'Scope Required',
        description: 'Please provide a scope for the skill.',
        variant: 'error',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create skill with description containing all fields
      const description = `SCOPE: ${scope.trim()}\n\nGUARDRAILS: ${guardrails.trim()}\n\nKNOWLEDGE: ${knowledge.trim()}`;

      const { data } = await createSkill({
        variables: {
          workspaceId: workspaceId || '',
          name: name.trim(),
          description,
        },
      });

      const skillId = data?.createSkill?.id;
      if (!skillId) {
        throw new Error('Failed to create skill');
      }

      // Add selected tools to skill
      const toolPromises = Array.from(selectedToolIds).map((toolId) =>
        addToolToSkill({
          variables: {
            skillId,
            mcpToolId: toolId,
          },
        })
      );

      await Promise.all(toolPromises);

      toast({
        title: 'Skill Created',
        description: `"${name}" has been created successfully with ${selectedToolIds.size} tools.`,
        variant: 'success',
      });

      // Call callback if provided
      if (callback) {
        callback(skillId);
      }

      handleClose();
    } catch (error) {
      console.error('Skill creation error:', error);
      toast({
        title: 'Error Creating Skill',
        description: error instanceof Error ? error.message : 'Failed to create skill',
        variant: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle tool selection
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

  const isIntentValid = intent.trim().length > 0;
  const isReviewValid = name.trim().length > 0 && scope.trim().length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-3xl translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create Skill with AI
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {step === 'intent'
                      ? 'Describe what you want to build and let AI generate the skill'
                      : 'Review and edit the AI-generated skill'}
                  </Dialog.Description>
                </div>
              </div>

              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  disabled={isGenerating || isCreating}
                >
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {step === 'intent' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="skill-intent"
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                  >
                    What skill do you want to build?
                  </label>
                  <Textarea
                    id="skill-intent"
                    placeholder="Describe your intent... For example: 'A skill for managing GitHub issues and pull requests' or 'Help me analyze and visualize data from CSV files'"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    rows={6}
                    disabled={isGenerating}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Be specific about what you want the skill to do and any constraints or
                    requirements.
                  </p>
                </div>

                {!defaultAIModel && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      No AI model is configured for this workspace. Please configure an AI provider
                      and set a default model in settings.
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-6">
                {/* AI Generated Badge */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Sparkles className="h-4 w-4" />
                  <span>AI-generated content - Review and edit as needed</span>
                </div>

                {/* Name Field */}
                <div>
                  <label
                    htmlFor="skill-name"
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                  >
                    Name *
                  </label>
                  <Input
                    id="skill-name"
                    placeholder="Enter skill name"
                    value={name}
                    onChange={(e) => setName(e.target.value.substring(0, CHAR_LIMITS.name))}
                    maxLength={CHAR_LIMITS.name}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {name.length}/{CHAR_LIMITS.name} characters
                  </p>
                </div>

                {/* Scope Field */}
                <div>
                  <label
                    htmlFor="skill-scope"
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                  >
                    Scope *
                  </label>
                  <Textarea
                    id="skill-scope"
                    placeholder="What does this skill do?"
                    value={scope}
                    onChange={(e) => setScope(e.target.value.substring(0, CHAR_LIMITS.scope))}
                    maxLength={CHAR_LIMITS.scope}
                    rows={3}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {scope.length}/{CHAR_LIMITS.scope} characters
                  </p>
                </div>

                {/* Guardrails Field */}
                <div>
                  <label
                    htmlFor="skill-guardrails"
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                  >
                    Guardrails
                  </label>
                  <Textarea
                    id="skill-guardrails"
                    placeholder="How to use it safely, limitations, constraints"
                    value={guardrails}
                    onChange={(e) =>
                      setGuardrails(e.target.value.substring(0, CHAR_LIMITS.guardrails))
                    }
                    maxLength={CHAR_LIMITS.guardrails}
                    rows={4}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {guardrails.length}/{CHAR_LIMITS.guardrails} characters
                  </p>
                </div>

                {/* Knowledge Field */}
                <div>
                  <label
                    htmlFor="skill-knowledge"
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                  >
                    Knowledge
                  </label>
                  <Textarea
                    id="skill-knowledge"
                    placeholder="Relevant background, policies, best practices"
                    value={knowledge}
                    onChange={(e) =>
                      setKnowledge(e.target.value.substring(0, CHAR_LIMITS.knowledge))
                    }
                    maxLength={CHAR_LIMITS.knowledge}
                    rows={4}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {knowledge.length}/{CHAR_LIMITS.knowledge} characters
                  </p>
                </div>

                {/* Tool Selection */}
                {availableTools.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Tools ({selectedToolIds.size} selected)
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      {availableTools.map((tool: { id: string; name: string; description?: string; mcpServer?: { name: string } }) => (
                        <div key={tool.id} className="flex items-start gap-3">
                          <Checkbox
                            id={`tool-${tool.id}`}
                            checked={selectedToolIds.has(tool.id)}
                            onCheckedChange={() => handleToggleTool(tool.id)}
                            disabled={isCreating}
                          />
                          <label
                            htmlFor={`tool-${tool.id}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {tool.name}
                            </div>
                            {tool.description && (
                              <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                                {tool.description}
                              </div>
                            )}
                            <div className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                              {tool.mcpServer?.name}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {availableTools.length === 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No tools available in this workspace. The skill will be created without tools.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            {step === 'intent' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!isIntentValid || isGenerating || !defaultAIModel}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStartOver}
                  disabled={isCreating}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Start Over
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreate}
                    disabled={!isReviewValid || isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Skill'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
