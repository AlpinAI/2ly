/**
 * Create Skill Dialog Component
 *
 * WHY: Allows users to create new skills with a name and description.
 * Skills are logical groupings of tools (replaces the old "agent" concept).
 *
 * FEATURES:
 * - Two modes: Manual and AI-assisted
 * - Manual: Simple form with name and description fields
 * - AI-assisted: Generate skill from natural language using configured AI providers
 * - Creates Skill via GraphQL mutation
 * - Resets form on close
 * - Shows loading state during creation
 *
 * USAGE:
 * ```tsx
 * const { setOpen } = useCreateSkillDialog();
 *
 * // Open dialog
 * setOpen(true);
 * ```
 */

import { useState, useCallback } from 'react';
import { X, Wand2, Sparkles, RefreshCw } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateSkillDialog } from '@/stores/uiStore';
import { useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { CreateSkillDocument, GenerateSkillWithAiDocument } from '@/graphql/generated/graphql';
import { useNotification } from '@/contexts/NotificationContext';
import { useAIProviders } from '@/hooks/useAIProviders';

type GeneratedData = {
  name: string;
  description: string;
  guardrails: string | null;
  associatedKnowledge: string | null;
  suggestedToolIds: string[];
};

export function CreateSkillDialog() {
  const { open, close, callback } = useCreateSkillDialog();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { toast } = useNotification();
  const { providers } = useAIProviders();

  // Mode state
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');

  // Manual mode state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // AI mode state
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);

  // Editable fields for generated data
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedGuardrails, setEditedGuardrails] = useState('');
  const [editedKnowledge, setEditedKnowledge] = useState('');

  const [createSkill, { loading: creating }] = useMutation(CreateSkillDocument, {
    refetchQueries: ['SubscribeSkills'],
    onCompleted: (data) => {
      const skillId = data.createSkill.id;

      toast({
        title: 'Skill Created',
        description: `"${mode === 'manual' ? name : editedName}" has been created successfully.`,
        variant: 'success',
      });

      // Call callback if provided before closing
      if (callback) {
        callback(skillId);
      }

      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Error Creating Skill',
        description: error.message,
        variant: 'error',
      });
    },
  });

  const [generateSkill, { loading: generating }] = useMutation(GenerateSkillWithAiDocument, {
    onCompleted: (data) => {
      if (data.generateSkillWithAI) {
        const generated = data.generateSkillWithAI;
        setGeneratedData({
          name: generated.name,
          description: generated.description,
          guardrails: generated.guardrails,
          associatedKnowledge: generated.associatedKnowledge,
          suggestedToolIds: generated.suggestedToolIds || [],
        });
        // Initialize editable fields
        setEditedName(generated.name);
        setEditedDescription(generated.description);
        setEditedGuardrails(generated.guardrails || '');
        setEditedKnowledge(generated.associatedKnowledge || '');

        toast({
          title: 'Skill Generated',
          description: 'Review and edit the generated skill before creating.',
          variant: 'success',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error Generating Skill',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Handle dialog close
  const handleClose = useCallback(() => {
    close();
    // Reset form after animation completes
    setTimeout(() => {
      setMode('manual');
      setName('');
      setDescription('');
      setUserPrompt('');
      setSelectedProviderId('');
      setGeneratedData(null);
      setEditedName('');
      setEditedDescription('');
      setEditedGuardrails('');
      setEditedKnowledge('');
    }, 300);
  }, [close]);

  // Handle open change from Radix
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !workspaceId) return;

    await createSkill({
      variables: {
        workspaceId,
        name: name.trim(),
        description: description.trim() || '',
      },
    });
  };

  const handleGenerate = async () => {
    if (!userPrompt.trim() || !selectedProviderId || !workspaceId) return;

    await generateSkill({
      variables: {
        input: {
          userPrompt: userPrompt.trim(),
          providerId: selectedProviderId,
          workspaceId,
        },
      },
    });
  };

  const handleCreateFromGenerated = async () => {
    if (!editedName.trim() || !workspaceId) return;

    await createSkill({
      variables: {
        workspaceId,
        name: editedName.trim(),
        description: editedDescription.trim() || '',
      },
    });
  };

  const handleRegenerate = () => {
    setGeneratedData(null);
    setEditedName('');
    setEditedDescription('');
    setEditedGuardrails('');
    setEditedKnowledge('');
  };

  const isManualValid = name.trim().length > 0;
  const isAIValid = userPrompt.trim().length > 0 && selectedProviderId.length > 0;
  const isGeneratedValid = editedName.trim().length > 0;

  // Auto-select first provider if only one exists
  if (providers.length === 1 && !selectedProviderId && mode === 'ai') {
    setSelectedProviderId(providers[0].id);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Skill
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Create a new skill manually or use AI to generate one
                </Dialog.Description>
              </div>

              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <Tabs.Root value={mode} onValueChange={(v) => setMode(v as 'manual' | 'ai')} className="flex flex-col flex-1 overflow-hidden">
            <Tabs.List className="px-6 pt-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
              <Tabs.Trigger
                value="manual"
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Manual
              </Tabs.Trigger>
              <Tabs.Trigger
                value="ai"
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                AI-Assisted
              </Tabs.Trigger>
            </Tabs.List>

            {/* Manual Mode */}
            <Tabs.Content value="manual" className="flex-1 overflow-hidden">
              <form onSubmit={handleManualSubmit} className="flex flex-col h-full">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
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
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                      disabled={creating}
                    />
                  </div>

                  {/* Description Field */}
                  <div>
                    <label
                      htmlFor="skill-description"
                      className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                    >
                      Description
                    </label>
                    <Textarea
                      id="skill-description"
                      placeholder="Enter skill description (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      disabled={creating}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={creating}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!isManualValid || creating}>
                    {creating ? 'Creating...' : 'Create Skill'}
                  </Button>
                </div>
              </form>
            </Tabs.Content>

            {/* AI-Assisted Mode */}
            <Tabs.Content value="ai" className="flex-1 overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  {!generatedData ? (
                    <>
                      {/* AI Provider Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          AI Provider *
                        </label>
                        {providers.length === 0 ? (
                          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                            No AI providers configured. Configure one in Settings → AI Providers.
                          </div>
                        ) : (
                          <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an AI provider..." />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.provider}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Natural Language Prompt */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Describe Your Skill *
                        </label>
                        <Textarea
                          placeholder="E.g., 'Create a skill for data analysis with tools for reading CSV files, generating charts, and statistical analysis'"
                          value={userPrompt}
                          onChange={(e) => setUserPrompt(e.target.value)}
                          rows={6}
                          disabled={generating}
                          className="resize-none"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Describe what you want this skill to do, and AI will generate a complete skill definition.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Review & Edit Generated Skill */}
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 mb-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-sm font-medium">AI-Generated Skill</span>
                        </div>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400">
                          Review and edit the fields below before creating the skill.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Name *
                        </label>
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          disabled={creating}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Description (max 250 chars)
                        </label>
                        <Textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          rows={3}
                          maxLength={250}
                          disabled={creating}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {editedDescription.length}/250 characters
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Guardrails (max 1000 chars)
                        </label>
                        <Textarea
                          value={editedGuardrails}
                          onChange={(e) => setEditedGuardrails(e.target.value)}
                          rows={3}
                          maxLength={1000}
                          disabled={creating}
                          placeholder="Safety and behavioral constraints..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {editedGuardrails.length}/1000 characters
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Associated Knowledge (max 2000 chars)
                        </label>
                        <Textarea
                          value={editedKnowledge}
                          onChange={(e) => setEditedKnowledge(e.target.value)}
                          rows={4}
                          maxLength={2000}
                          disabled={creating}
                          placeholder="Domain context and background knowledge..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {editedKnowledge.length}/2000 characters
                        </p>
                      </div>

                      {generatedData.suggestedToolIds.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Suggested Tools ({generatedData.suggestedToolIds.length})
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            After creating the skill, you can add these tools in the Manage Tools dialog.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-2">
                  <div>
                    {generatedData && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRegenerate}
                        disabled={creating}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={generating || creating}>
                      Cancel
                    </Button>
                    {!generatedData ? (
                      <Button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!isAIValid || generating}
                        className="flex items-center gap-2"
                      >
                        {generating ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleCreateFromGenerated}
                        disabled={!isGeneratedValid || creating}
                      >
                        {creating ? 'Creating...' : 'Create Skill'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
