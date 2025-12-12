/**
 * SkillDetail Component
 *
 * WHY: Displays detailed information about a selected skill.
 * Used by Skills Page as the detail panel.
 *
 * DISPLAYS:
 * - Name and description
 * - Mode selector (LIST, OPTIMIZED, SMART)
 * - Available Tools (with links)
 * - Created/Updated timestamps
 */

import { useState, useEffect, useMemo } from 'react';
import { Wrench, Clock, Settings, Trash2, Cable, Eye, EyeOff, Copy, Save, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useManageToolsDialog, useConnectSkillDialog } from '@/stores/uiStore';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { useNotification } from '@/contexts/NotificationContext';
import { useAIProviders } from '@/hooks/useAIProviders';
import { useRuntimeData } from '@/stores/runtimeStore';
import {
  DeleteSkillDocument,
  GetSkillKeyDocument,
  GetKeyValueDocument,
  UpdateSkillDocument,
  UpdateSkillModeDocument,
  UpdateSkillSmartConfigDocument,
  SkillMode,
  ExecutionTarget,
} from '@/graphql/generated/graphql';
import type { SubscribeSkillsSubscription } from '@/graphql/generated/graphql';
import { DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from '@skilder-ai/common';

type Skill = NonNullable<SubscribeSkillsSubscription['skills']>[number];

// Mode descriptions for the UI
const MODE_INFO = {
  [SkillMode.List]: {
    title: 'List Mode',
    description: 'This skill will make each tool available to the consuming agent.',
  },
  [SkillMode.Optimized]: {
    title: 'Optimized Mode',
    description:
      'This skill will provide a Search Tool and a Call Tool to the consuming agent. This will save tokens and avoid context bloat with skills containing many tools.',
  },
  [SkillMode.Smart]: {
    title: 'Smart Mode',
    description:
      'This skill will orchestrate the tools and call them directly using a sub-agent. Configure the model, prompt, and execution settings below.',
  },
};

// Maximum tokens limit for smart mode configuration
const MAX_TOKENS_LIMIT = 128000;

export interface SkillDetailProps {
  skill: Skill;
}

export function SkillDetail({ skill }: SkillDetailProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { setOpen, setSelectedSkillId } = useManageToolsDialog();
  const {
    setOpen: setConnectDialogOpen,
    setSelectedSkillName,
    setSelectedSkillId: setConnectSkillId,
  } = useConnectSkillDialog();

  const { confirm, toast } = useNotification();
  const { allModels } = useAIProviders();
  const { runtimes } = useRuntimeData();
  const [deleteSkill] = useMutation(DeleteSkillDocument);
  const [updateSkill] = useMutation(UpdateSkillDocument);
  const [updateSkillMode, { loading: updatingMode }] = useMutation(UpdateSkillModeDocument);
  const [updateSmartConfig, { loading: savingSmartConfig }] = useMutation(UpdateSkillSmartConfigDocument);

  // Inline edit state
  const [skillName, setSkillName] = useState(skill.name);
  const [skillDescription, setSkillDescription] = useState(skill.description || '');

  // Mode change state
  const [pendingMode, setPendingMode] = useState<SkillMode | null>(null);

  // Smart mode configuration state (edited values)
  const [model, setModel] = useState<string | null>(skill.model);
  const [temperature, setTemperature] = useState<number>(skill.temperature ?? DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState<number>(skill.maxTokens ?? DEFAULT_MAX_TOKENS);
  const [systemPrompt, setSystemPrompt] = useState<string>(skill.systemPrompt || '');
  const [executionTarget, setExecutionTarget] = useState<ExecutionTarget | null>(skill.executionTarget);
  const [runtimeId, setRuntimeId] = useState<string | null>(skill.runtime?.id || null);
  const [hasSmartConfigChanges, setHasSmartConfigChanges] = useState(false);

  // Key visibility state
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyValue, setKeyValue] = useState<string | null>(null);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [getSkillKey, { loading: loadingKey }] = useLazyQuery(GetSkillKeyDocument);
  const [getKeyValue, { loading: loadingKeyValue }] = useLazyQuery(GetKeyValueDocument);

  // Reset values when skill changes
  useEffect(() => {
    setSkillName(skill.name);
    setSkillDescription(skill.description || '');
    // Smart config resets
    setModel(skill.model);
    setTemperature(skill.temperature ?? DEFAULT_TEMPERATURE);
    setMaxTokens(skill.maxTokens ?? DEFAULT_MAX_TOKENS);
    setSystemPrompt(skill.systemPrompt || '');
    setExecutionTarget(skill.executionTarget);
    setRuntimeId(skill.runtime?.id || null);
    setHasSmartConfigChanges(false);
  }, [skill]);

  // Clear pending mode when skill.mode updates to match
  useEffect(() => {
    if (pendingMode && skill.mode === pendingMode) {
      setPendingMode(null);
    }
  }, [skill.mode, pendingMode]);

  // Computed value for Run On selector
  const groupedSelectValue = useMemo(() => {
    if (executionTarget === ExecutionTarget.Edge && runtimeId) {
      return `EDGE:${runtimeId}`;
    }
    return executionTarget || 'AGENT';
  }, [executionTarget, runtimeId]);

  // Detect changes by comparing to original skill values
  useEffect(() => {
    const modelChanged = model !== skill.model;
    const tempChanged = temperature !== (skill.temperature ?? DEFAULT_TEMPERATURE);
    const tokensChanged = maxTokens !== (skill.maxTokens ?? DEFAULT_MAX_TOKENS);
    const promptChanged = systemPrompt !== (skill.systemPrompt || '');
    const targetChanged = executionTarget !== skill.executionTarget;
    const runtimeChanged = runtimeId !== (skill.runtime?.id || null);

    setHasSmartConfigChanges(
      modelChanged || tempChanged || tokensChanged || promptChanged || targetChanged || runtimeChanged,
    );
  }, [model, temperature, maxTokens, systemPrompt, executionTarget, runtimeId, skill]);

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  const handleManageTools = () => {
    setSelectedSkillId(skill.id);
    setOpen(true);
  };

  const handleConnect = () => {
    // Use the skill name as a pseudo-agent ID for connection instructions
    // The ConnectSkillDialog will show instructions for this name
    setSelectedSkillName(skill.name);
    setConnectSkillId(skill.id);
    setConnectDialogOpen(true);
  };

  // Handle name save on blur
  const handleNameSave = async () => {
    if (skillName === skill.name) return;

    // Validate: 3-100 characters
    const trimmedName = skillName.trim();
    if (trimmedName.length < 3 || trimmedName.length > 100) {
      toast({
        description: 'Name must be between 3 and 100 characters',
        variant: 'error',
      });
      setSkillName(skill.name); // Revert to original
      return;
    }

    try {
      await updateSkill({
        variables: {
          id: skill.id,
          name: trimmedName,
          description: skill.description || '',
        },
      });
    } catch (error) {
      console.error('Failed to save name:', error);
      toast({
        description: 'Failed to save name',
        variant: 'error',
      });
      setSkillName(skill.name); // Revert on error
    }
  };

  // Handle description save on blur
  const handleDescriptionSave = async () => {
    if (skillDescription === (skill.description || '')) return;

    // Validate: max 1000 characters (can be empty)
    if (skillDescription.length > 1000) {
      toast({
        description: 'Description must not exceed 1000 characters',
        variant: 'error',
      });
      setSkillDescription(skill.description || ''); // Revert to original
      return;
    }

    try {
      await updateSkill({
        variables: {
          id: skill.id,
          name: skill.name,
          description: skillDescription,
        },
      });
    } catch (error) {
      console.error('Failed to save description:', error);
      toast({
        description: 'Failed to save description',
        variant: 'error',
      });
      setSkillDescription(skill.description || ''); // Revert on error
    }
  };

  const handleModeChange = async (newMode: SkillMode) => {
    if (newMode === skill.mode) return;

    setPendingMode(newMode);
    try {
      await updateSkillMode({
        variables: {
          id: skill.id,
          mode: newMode,
        },
      });
      toast({
        description: `Skill mode changed to ${newMode}`,
        variant: 'success',
      });
      // pendingMode is cleared by useEffect when skill.mode updates
    } catch (error) {
      // Clear pending mode on error
      setPendingMode(null);
      console.error('Failed to update mode:', error);
      toast({
        description: 'Failed to update skill mode',
        variant: 'error',
      });
    }
  };

  // Smart mode configuration handlers
  const handleModelChange = (newModel: string) => {
    setModel(newModel);
  };

  const handleRunOnChange = (value: string) => {
    if (value.startsWith('EDGE:')) {
      setRuntimeId(value.replace('EDGE:', ''));
      setExecutionTarget(ExecutionTarget.Edge);
    } else {
      setExecutionTarget(value as ExecutionTarget);
      setRuntimeId(null);
    }
  };

  const handleSmartConfigSave = async () => {
    try {
      await updateSmartConfig({
        variables: {
          input: {
            id: skill.id,
            model,
            temperature,
            maxTokens,
            systemPrompt,
            executionTarget,
            runtimeId: executionTarget === ExecutionTarget.Edge ? runtimeId : null,
          },
        },
      });
      toast({ description: 'Smart configuration saved', variant: 'success' });
    } catch (error) {
      console.error('Failed to save smart config:', error);
      toast({ description: 'Failed to save configuration', variant: 'error' });
    }
  };

  const handleSmartConfigCancel = () => {
    setModel(skill.model);
    setTemperature(skill.temperature ?? DEFAULT_TEMPERATURE);
    setMaxTokens(skill.maxTokens ?? DEFAULT_MAX_TOKENS);
    setSystemPrompt(skill.systemPrompt || '');
    setExecutionTarget(skill.executionTarget);
    setRuntimeId(skill.runtime?.id || null);
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Skill',
      description: `Are you sure you want to delete "${skill.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete Skill',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await deleteSkill({
        variables: {
          id: skill.id,
        },
        refetchQueries: ['SubscribeSkills'],
      });
    } catch (error) {
      console.error('Failed to delete skill:', error);
    }
  };

  const handleToggleKeyVisibility = async () => {
    if (keyVisible) {
      // Hide the key
      setKeyVisible(false);
      setKeyValue(null);
    } else {
      // Fetch and show the key
      try {
        // First get the key metadata
        const keyResult = await getSkillKey({ variables: { skillId: skill.id } });
        if (keyResult.data?.skillKey) {
          // Then get the actual key value
          const valueResult = await getKeyValue({ variables: { keyId: keyResult.data.skillKey.id } });
          if (valueResult.data?.keyValue) {
            setKeyValue(valueResult.data.keyValue);
            setKeyVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch key:', error);
        toast({
          description: 'Failed to fetch skill key',
          variant: 'error',
        });
      }
    }
  };

  const handleCopyKey = async () => {
    try {
      let valueToUse = keyValue;

      // If key is not loaded, fetch it
      if (!valueToUse) {
        setLoadingCopy(true);
        // First get the key metadata
        const keyResult = await getSkillKey({ variables: { skillId: skill.id } });
        if (!keyResult.data?.skillKey) {
          throw new Error('Skill key not found');
        }
        // Then get the actual key value
        const valueResult = await getKeyValue({ variables: { keyId: keyResult.data.skillKey.id } });
        if (!valueResult.data?.keyValue) {
          throw new Error('Key value not found');
        }
        valueToUse = valueResult.data.keyValue;
        // Keep the key in memory for future use
        setKeyValue(valueToUse);
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(valueToUse);
      toast({
        description: 'Key copied to clipboard',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to copy key:', error);
      toast({
        description: 'Failed to copy key',
        variant: 'error',
      });
    } finally {
      setLoadingCopy(false);
    }
  };

  const currentMode = skill.mode || SkillMode.List;

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Wrench className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              onBlur={handleNameSave}
              className="text-lg font-semibold h-auto p-0 border-none bg-transparent focus:ring-0 focus:border-none"
            />
            <AutoGrowTextarea
              value={skillDescription}
              onChange={(e) => setSkillDescription(e.target.value)}
              onBlur={handleDescriptionSave}
              placeholder="Click to add description..."
              className="text-sm text-gray-500 dark:text-gray-400 mt-1 min-h-0 h-auto p-0 border-none bg-transparent focus:ring-0 focus:border-none"
              minRows={1}
              maxRows={5}
            />
          </div>
        </div>

        {/* Guardrails and Associated Knowledge */}
        {(skill.guardrails || skill.associatedKnowledge) && (
          <div className="mt-3 space-y-2">
            {skill.guardrails && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">
                  Guardrails
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {skill.guardrails}
                </div>
              </div>
            )}
            {skill.associatedKnowledge && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
                  Associated Knowledge
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {skill.associatedKnowledge}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
        <Button variant="default" size="sm" onClick={handleConnect} className="h-8 px-3 text-sm">
          <Cable className="h-4 w-4 mr-2" />
          Connect
        </Button>

        <Button variant="default" size="sm" onClick={handleManageTools} className="h-8 px-3 text-sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Tools
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Mode Selector */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Mode</h4>
          <div className="space-y-2">
            {Object.entries(MODE_INFO).map(([mode, info]) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode as SkillMode)}
                disabled={updatingMode}
                className={`relative w-full text-left p-3 rounded-lg border-2 transition-all ${
                  currentMode === mode
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${updatingMode && pendingMode !== mode ? 'opacity-50 cursor-not-allowed' : ''} ${updatingMode && pendingMode === mode ? 'cursor-not-allowed' : ''}`}
              >
                {pendingMode === mode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 rounded-lg">
                    <div className="h-6 w-6 rounded-full animate-spin border-2 border-gray-300 dark:border-gray-600 border-t-cyan-600 dark:border-t-cyan-400" />
                  </div>
                )}
                <div className="font-medium text-sm text-gray-900 dark:text-white">{info.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{info.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Smart Mode Configuration */}
        {currentMode === SkillMode.Smart && (
          <div className="space-y-3 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <h4 className="text-xs font-medium text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
              Smart Mode Configuration
            </h4>
            <div className="space-y-3">
              {/* Model Dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Model</label>
                <Select value={model || ''} onValueChange={handleModelChange}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Select a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allModels.length === 0 ? (
                      <SelectItem value="__no_models__" disabled>
                        No models configured
                      </SelectItem>
                    ) : (
                      allModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature & Max Tokens */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Temperature</label>
                  <Input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Max Tokens</label>
                  <Input
                    type="number"
                    min={1}
                    max={MAX_TOKENS_LIMIT}
                    step={256}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                    className="w-full bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">System Prompt</label>
                <AutoGrowTextarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter instructions for the sub-agent... (e.g., 'You are a helpful assistant that specializes in data analysis.')"
                  className="w-full bg-white dark:bg-gray-800 min-h-[80px]"
                  minRows={3}
                  maxRows={10}
                />
              </div>

              {/* Run On Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Run On</label>
                <Select value={groupedSelectValue} onValueChange={handleRunOnChange}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENT">Agent Side</SelectItem>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>On the Edge</SelectLabel>
                      {runtimes.map((runtime) => (
                        <SelectItem
                          key={runtime.id}
                          value={`EDGE:${runtime.id}`}
                          disabled={runtime.status !== 'ACTIVE'}
                        >
                          {runtime.name} {runtime.status === 'ACTIVE' ? '(active)' : '(offline)'}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={handleSmartConfigCancel}
                  disabled={!hasSmartConfigChanges || savingSmartConfig}
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSmartConfigSave}
                  disabled={!hasSmartConfigChanges || savingSmartConfig}
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Identity Key */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Identity Key
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white truncate">
                {keyVisible && keyValue ? keyValue : '••••••••••••••••••••••••••••••••'}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyKey}
                disabled={loadingCopy || loadingKey || loadingKeyValue}
                className="h-7 w-7 p-0 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                title="Copy to clipboard"
              >
                {loadingCopy ? (
                  <div className="h-3 w-3 border-2 border-cyan-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Copy className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleKeyVisibility}
                disabled={loadingKey || loadingKeyValue}
                className="h-7 w-7 p-0"
                title={keyVisible ? 'Hide key' : 'Show key'}
              >
                {keyVisible ? (
                  <EyeOff className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Eye className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Created/Updated */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Timestamps
          </h4>
          <div className="space-y-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Created:</span>
              <span className="text-gray-900 dark:text-white">{formatDate(skill.createdAt)}</span>
            </div>
            {skill.updatedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(skill.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tools */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
            <Wrench className="h-3 w-3" />
            Tools ({skill.mcpTools?.length || 0})
          </h4>
          {skill.mcpTools && skill.mcpTools.length > 0 ? (
            <ul className="space-y-1 max-h-64 overflow-auto">
              {skill.mcpTools?.map((tool) => (
                <li
                  key={tool.id}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  <Wrench className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/w/${workspaceId}/tools?id=${tool.id}`}
                      className="text-sm text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline truncate block"
                    >
                      {tool.name}
                    </Link>
                    {tool.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tool.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No tools in this skill</p>
          )}
        </div>

        {/* Delete Skill Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button variant="destructive" onClick={handleDelete} size="sm" className="h-7 px-2 text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            Delete Skill
          </Button>
        </div>
      </div>
    </div>
  );
}
