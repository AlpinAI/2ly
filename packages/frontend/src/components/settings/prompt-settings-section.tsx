/**
 * Prompt Settings Section
 *
 * WHY: Allows users to customize AI prompt templates used for skill generation.
 * Provides an editor for the skill generation prompt with variable documentation.
 *
 * FEATURES:
 * - Editable textarea for skill generation prompt template
 * - Variable documentation ({{intent}}, {{tools}}, {{workspace}})
 * - Character counter
 * - Save and Reset to Default buttons
 * - Real-time validation
 * - Help text with examples
 */

import { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  UpdateWorkspacePromptsDocument,
  GetDefaultAiModelDocument,
} from '@/graphql/generated/graphql';
import { useNotification } from '@/contexts/NotificationContext';
import {
  DEFAULT_SKILL_GENERATION_PROMPT,
  parseCustomPrompts,
  getSkillGenerationPrompt,
  validatePromptTemplate,
  type CustomPrompts,
} from '@/lib/promptTemplates';

export function PromptSettingsSection() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { toast } = useNotification();

  const [promptTemplate, setPromptTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current workspace prompts
  const { data, loading: loadingPrompts } = useQuery(GetDefaultAiModelDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  // Update prompts mutation
  const [updatePrompts] = useMutation(UpdateWorkspacePromptsDocument, {
    refetchQueries: ['GetDefaultAIModel'],
  });

  // Initialize prompt template from workspace data
  useEffect(() => {
    if (data?.workspace) {
      const customPrompts = parseCustomPrompts(data.workspace.customPrompts);
      const currentPrompt = getSkillGenerationPrompt(customPrompts);
      setPromptTemplate(currentPrompt);
    }
  }, [data]);

  // Validate current template
  const validation = validatePromptTemplate(promptTemplate);
  const characterCount = promptTemplate.length;
  const isModified = promptTemplate !== DEFAULT_SKILL_GENERATION_PROMPT;
  const canSave = validation.valid && isModified;

  const handleSave = async () => {
    if (!workspaceId || !validation.valid) return;

    setIsSaving(true);
    try {
      const customPromptsObj: CustomPrompts = {
        skillGeneration: promptTemplate,
      };

      await updatePrompts({
        variables: {
          workspaceId,
          customPrompts: JSON.stringify(customPromptsObj),
        },
      });

      toast({
        title: 'Prompt Saved',
        description: 'Custom skill generation prompt has been updated.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to save prompt:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save prompt template.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPromptTemplate(DEFAULT_SKILL_GENERATION_PROMPT);
    toast({
      description: 'Prompt reset to default template.',
      variant: 'info',
    });
  };

  if (loadingPrompts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading prompt settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          AI Prompt Templates
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize the prompts used when generating skills with AI. Use variables to inject dynamic
          content.
        </p>
      </div>

      {/* Skill Generation Prompt Section */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="skill-generation-prompt"
            className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
          >
            Skill Generation Prompt
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            This prompt is used when creating skills with the "Create with AI" feature.
          </p>

          {/* Variable Documentation */}
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Available Variables:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>
                <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                  {'{{tools}}'}
                </code>{' '}
                - List of available tools in the workspace (required)
              </li>
              <li>
                <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                  {'{{workspace}}'}
                </code>{' '}
                - Workspace name (optional)
              </li>
            </ul>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              <strong>Note:</strong> The user's intent is automatically sent as a separate user message, not included in the system prompt template.
            </p>
          </div>

          {/* Template Editor */}
          <Textarea
            id="skill-generation-prompt"
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            rows={16}
            className="font-mono text-sm"
            placeholder="Enter your custom prompt template..."
          />

          {/* Character Count and Validation */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm">
              {!validation.valid ? (
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{validation.errors.join(', ')}</span>
                </div>
              ) : (
                <span
                  className={
                    characterCount > 10000
                      ? 'text-red-600 dark:text-red-400'
                      : characterCount > 8000
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }
                >
                  {characterCount.toLocaleString()} / 10,000 characters
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {isModified && (
                <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              )}
              <Button onClick={handleSave} size="sm" disabled={!canSave || isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Prompt'}
              </Button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tips:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Include clear instructions for the AI about the expected output format (JSON)</li>
            <li>Specify character limits for name, scope, guardrails, and knowledge fields</li>
            <li>Remind the AI to only suggest tools from the available list</li>
            <li>Test your prompt by creating a skill with AI to ensure it works as expected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
