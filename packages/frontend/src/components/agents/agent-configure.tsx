/**
 * AgentConfigure Component
 *
 * WHY: Form for creating a new AI agent with all configuration options.
 * Used by AddSourceWorkflow as the agent configuration step.
 *
 * FIELDS:
 * - Name (required)
 * - Description (optional)
 * - System Prompt (required)
 * - Model (required)
 * - Temperature (default 1.0)
 * - Max Tokens (default 4096)
 * - Execution Target (AGENT / EDGE)
 *
 * FEATURES:
 * - Form validation
 * - Create agent mutation
 * - Success/error notifications
 */

import { useState, useMemo } from 'react';
import { useMutation } from '@apollo/client/react';
import { Bot, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AutoGrowTextarea } from '@/components/ui/autogrow-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';
import { useNotification } from '@/contexts/NotificationContext';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useAIProviders } from '@/hooks/useAIProviders';
import { CreateAgentDocument, ExecutionTarget } from '@/graphql/generated/graphql';

export interface AgentConfigureProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function AgentConfigure({ onBack, onSuccess }: AgentConfigureProps) {
  const workspaceId = useWorkspaceId();
  const { runtimes } = useRuntimeData();
  const { toast } = useNotification();
  const { allModels } = useAIProviders();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [executionTarget, setExecutionTarget] = useState<ExecutionTarget>(ExecutionTarget.Agent);
  const [runtimeId, setRuntimeId] = useState<string | null>(null);

  // Mutation
  const [createAgent, { loading }] = useMutation(CreateAgentDocument);

  // Validation
  const isValid = useMemo(() => {
    return name.trim().length >= 3 && systemPrompt.trim().length > 0 && model.trim().length > 0;
  }, [name, systemPrompt, model]);

  // Grouped select value for execution target
  const groupedSelectValue = useMemo(() => {
    if (executionTarget === ExecutionTarget.Edge && runtimeId) {
      return `EDGE:${runtimeId}`;
    }
    return 'AGENT';
  }, [executionTarget, runtimeId]);

  // Handle execution target change
  const handleRunOnChange = (value: string) => {
    if (value === 'AGENT') {
      setExecutionTarget(ExecutionTarget.Agent);
      setRuntimeId(null);
    } else if (value.startsWith('EDGE:')) {
      setExecutionTarget(ExecutionTarget.Edge);
      setRuntimeId(value.replace('EDGE:', ''));
    }
  };

  // Handle form submission
  const handleCreate = async () => {
    if (!isValid || !workspaceId) return;

    try {
      await createAgent({
        variables: {
          input: {
            name: name.trim(),
            description: description.trim() || undefined,
            systemPrompt: systemPrompt.trim(),
            model: model.trim(),
            temperature,
            maxTokens,
            executionTarget,
            workspaceId,
          },
        },
        refetchQueries: ['GetAgents'],
      });

      toast({
        title: 'Agent created',
        description: `"${name}" has been created successfully.`,
        variant: 'success',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: 'Failed to create agent',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error',
      });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configure your Agent</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set up an AI agent with custom prompts and model settings
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Research Assistant"
            className={name.length > 0 && name.length < 3 ? 'border-red-500' : ''}
          />
          {name.length > 0 && name.length < 3 && (
            <p className="text-xs text-red-500 mt-1">Name must be at least 3 characters</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <AutoGrowTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of what this agent does..."
            minRows={2}
            maxRows={4}
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            System Prompt <span className="text-red-500">*</span>
          </label>
          <AutoGrowTextarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant that..."
            className="font-mono text-sm"
            minRows={5}
            maxRows={15}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Define the agent&apos;s behavior and personality
          </p>
        </div>

        {/* Model Configuration */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Model Configuration</h3>

          {/* Model */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <Select value={model} onValueChange={setModel} disabled={allModels.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={allModels.length === 0 ? 'No models configured' : 'Select a model'} />
              </SelectTrigger>
              <SelectContent>
                {allModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature and Max Tokens */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Temperature</label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">0-2 (higher = more creative)</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max Tokens</label>
              <Input
                type="number"
                min={1}
                max={128000}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum response length</p>
            </div>
          </div>
        </div>

        {/* Execution Target */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Run On</label>
          <Select value={groupedSelectValue} onValueChange={handleRunOnChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AGENT">Agent Side</SelectItem>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>On the Edge</SelectLabel>
                {runtimes.length === 0 ? (
                  <SelectItem value="no-runtimes" disabled>
                    No runtimes available
                  </SelectItem>
                ) : (
                  runtimes.map((runtime) => (
                    <SelectItem
                      key={runtime.id}
                      value={`EDGE:${runtime.id}`}
                      disabled={runtime.status !== 'ACTIVE'}
                    >
                      {runtime.name} {runtime.status === 'ACTIVE' ? '(active)' : '(offline)'}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose where the agent will execute
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!isValid || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Agent'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
