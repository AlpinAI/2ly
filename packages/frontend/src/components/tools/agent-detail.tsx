/**
 * AgentDetail Component
 *
 * WHY: Displays detailed information about a selected Agent.
 * Used by ToolDetail router for Agent items.
 *
 * DISPLAYS:
 * - Agent name and description (editable)
 * - Model configuration (model, temperature, maxTokens - editable)
 * - System prompt (editable, collapsible)
 * - Execution target (dropdown: AGENT / EDGE with runtime selection)
 * - Skills list with link/unlink
 * - AgentTester component for testing
 *
 * FEATURES:
 * - Inline editing for all fields
 * - Auto-save on blur or Enter
 * - ExecutionTarget dropdown with runtime selection
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { Bot, Settings, Plus, X, Save, Trash2, Loader2 } from 'lucide-react';
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
import { useRuntimeData } from '@/stores/runtimeStore';
import { useSkills } from '@/hooks/useSkills';
import { useAIProviders } from '@/hooks/useAIProviders';
import { AgentTester } from './agent-tester';
import { LinkAgentSkillDialog } from './link-agent-skill-dialog';
import type { AgentItem } from '@/types/tools';
import {
  UpdateAgentDocument,
  UpdateAgentExecutionTargetDocument,
  DeleteAgentDocument,
  RemoveSkillFromAgentDocument,
  ExecutionTarget,
} from '@/graphql/generated/graphql';

export interface AgentDetailProps {
  agent: AgentItem;
}

export function AgentDetail({ agent }: AgentDetailProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { runtimes } = useRuntimeData();
  const { skills } = useSkills(workspaceId!);
  const { confirm, toast } = useNotification();
  const { allModels } = useAIProviders();

  // Inline edit state
  const [agentName, setAgentName] = useState(agent.name);
  const [agentDescription, setAgentDescription] = useState(agent.description || '');
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);
  const [model, setModel] = useState(agent.model);
  const [temperature, setTemperature] = useState(agent.temperature);
  const [maxTokens, setMaxTokens] = useState(agent.maxTokens);
  const [executionTarget, setExecutionTarget] = useState<ExecutionTarget | null>(agent.executionTarget || null);
  const [runtimeId, setRuntimeId] = useState<string | null>(agent.runtime?.id || null);

  // UI state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [unlinkingSkillIds, setUnlinkingSkillIds] = useState<Record<string, boolean>>({});

  // Mutations
  const [updateAgent] = useMutation(UpdateAgentDocument);
  const [updateExecutionTarget] = useMutation(UpdateAgentExecutionTargetDocument);
  const [deleteAgent] = useMutation(DeleteAgentDocument);
  const [unlinkSkill] = useMutation(RemoveSkillFromAgentDocument);

  // Reset form values only when switching to a different agent (by ID)
  // This prevents form state from being overwritten during data refetches
  // while still resetting when navigating to a different agent
  // Note: Intentionally using agent.id as the only dependency
  useEffect(() => {
    setAgentName(agent.name);
    setAgentDescription(agent.description || '');
    setSystemPrompt(agent.systemPrompt);
    setModel(agent.model);
    setTemperature(agent.temperature);
    setMaxTokens(agent.maxTokens);
    setExecutionTarget(agent.executionTarget || null);
    setRuntimeId(agent.runtime?.id || null);
  }, [agent.id]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return (
      agentName !== agent.name ||
      agentDescription !== (agent.description || '') ||
      systemPrompt !== agent.systemPrompt ||
      model !== agent.model ||
      temperature !== agent.temperature ||
      maxTokens !== agent.maxTokens
    );
  }, [agent, agentName, agentDescription, systemPrompt, model, temperature, maxTokens]);

  // Get skills not yet accessible by this agent (for future use when skill linking is implemented)
  const unlinkedSkills = useMemo(() => {
    const linkedSkillIds = new Set(agent.tools?.map((s) => s.id) || []);
    return skills.filter((skill) => !linkedSkillIds.has(skill.id));
  }, [skills, agent.tools]);

  // Grouped select value for execution target
  const groupedSelectValue = useMemo(() => {
    if (executionTarget === ExecutionTarget.Edge && runtimeId) {
      return `EDGE:${runtimeId}`;
    }
    return executionTarget || 'AGENT';
  }, [executionTarget, runtimeId]);

  // Handle execution target change
  const handleRunOnChange = async (value: string) => {
    let newExecutionTarget: ExecutionTarget;
    let newRuntimeId: string | undefined;

    if (value === 'AGENT') {
      newExecutionTarget = ExecutionTarget.Agent;
      newRuntimeId = undefined;
    } else if (value.startsWith('EDGE:')) {
      newExecutionTarget = ExecutionTarget.Edge;
      newRuntimeId = value.replace('EDGE:', '');
    } else {
      return;
    }

    setExecutionTarget(newExecutionTarget);
    setRuntimeId(newRuntimeId || null);

    try {
      await updateExecutionTarget({
        variables: {
          agentId: agent.id,
          executionTarget: newExecutionTarget,
          runtimeId: newRuntimeId,
        },
      });
      toast({
        title: 'Execution target updated',
        description: `Agent will now run on ${newExecutionTarget === ExecutionTarget.Agent ? 'Agent Side' : 'Edge Runtime'}`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error updating execution target:', error);
      // Revert on error
      setExecutionTarget(agent.executionTarget || null);
      setRuntimeId(agent.runtime?.id || null);
      toast({
        title: 'Failed to update execution target',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error',
      });
    }
  };

  // Handle save all changes
  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      await updateAgent({
        variables: {
          input: {
            id: agent.id,
            name: agentName.trim(),
            description: agentDescription.trim() || null,
            systemPrompt: systemPrompt.trim(),
            model: model.trim(),
            temperature,
            maxTokens,
          },
        },
      });
      toast({
        title: 'Agent updated',
        description: 'Your changes have been saved.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: 'Failed to update agent',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel changes
  const handleCancel = () => {
    setAgentName(agent.name);
    setAgentDescription(agent.description || '');
    setSystemPrompt(agent.systemPrompt);
    setModel(agent.model);
    setTemperature(agent.temperature);
    setMaxTokens(agent.maxTokens);
  };

  // Handle delete
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Agent',
      description: `Are you sure you want to delete "${agent.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAgent({
        variables: { id: agent.id },
        refetchQueries: ['GetAgents'],
      });
      toast({
        title: 'Agent deleted',
        description: `"${agent.name}" has been deleted.`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: 'Failed to delete agent',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error',
      });
      setIsDeleting(false);
    }
  };

  // Handle unlink skill from agent
  const handleUnlinkSkill = useCallback(
    async (skillId: string) => {
      setUnlinkingSkillIds((prev) => ({ ...prev, [skillId]: true }));

      try {
        await unlinkSkill({
          variables: {
            skillId: skillId,
            agentId: agent.id,
          },
          refetchQueries: ['GetAgents'],
        });

        toast({
          title: 'Skill unlinked',
          description: 'Skill has been removed from the agent.',
          variant: 'success',
        });
      } catch (error) {
        console.error('Error unlinking skill:', error);
        toast({
          title: 'Failed to unlink skill',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          variant: 'error',
        });
      } finally {
        setUnlinkingSkillIds((prev) => ({ ...prev, [skillId]: false }));
      }
    },
    [unlinkSkill, agent.id, toast],
  );

  return (
    <div className="flex flex-col h-full overflow-auto scroll-smooth">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="text-lg font-semibold h-auto p-0 border-none bg-transparent focus:ring-0 focus:border-none"
              placeholder="Agent name"
            />
            <AutoGrowTextarea
              value={agentDescription}
              onChange={(e) => setAgentDescription(e.target.value)}
              className="text-sm text-gray-500 dark:text-gray-400 mt-1 min-h-0 h-auto p-0 border-none bg-transparent focus:ring-0 focus:border-none resize-none"
              placeholder="Click to add description..."
              minRows={1}
              maxRows={5}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Model Configuration */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Model Configuration
          </h4>
          <div className="space-y-3 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Model</label>
              <Select value={model} onValueChange={setModel} disabled={allModels.length === 0}>
                <SelectTrigger className="mt-1">
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
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">System Prompt</label>
              <AutoGrowTextarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="font-mono text-sm mt-1"
                placeholder="Enter the system prompt..."
                minRows={3}
                maxRows={10}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Temperature</label>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Max Tokens</label>
                <Input
                  type="number"
                  min={1}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills (skills this agent can use) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Agent Skills ({agent.tools?.length || 0})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              disabled={unlinkedSkills.length === 0}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title={unlinkedSkills.length === 0 ? 'All skills already linked' : 'Link skill to agent'}
              onClick={() => setLinkDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {agent.tools && agent.tools.length > 0 ? (
            <ul className="space-y-1">
              {agent.tools.map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  <Settings className="h-4 w-4 text-cyan-500" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/w/${workspaceId}/skills?id=${skill.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline truncate block"
                    >
                      {skill.name}
                    </Link>
                    {skill.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{skill.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => handleUnlinkSkill(skill.id)}
                    disabled={unlinkingSkillIds[skill.id]}
                    title="Remove skill from agent"
                  >
                    {unlinkingSkillIds[skill.id] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No skills linked to this agent</p>
          )}
        </div>

        {/* Execution Target */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Run On
          </h4>
          <Select value={groupedSelectValue} onValueChange={handleRunOnChange}>
            <SelectTrigger className="w-full">
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

        {/* Available in Skills (skills where this agent is a tool) */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Available in Skills ({agent.skills?.length || 0})
          </h4>
          {agent.skills && agent.skills.length > 0 ? (
            <ul className="space-y-1">
              {agent.skills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  <Settings className="h-4 w-4 text-purple-500" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/w/${workspaceId}/skills?id=${skill.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline truncate block"
                    >
                      {skill.name}
                    </Link>
                    {skill.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{skill.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Not included as a tool in any skills</p>
          )}
        </div>

        {/* Save/Cancel buttons */}
        {hasChanges && (
          <div className="flex gap-2 justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="h-8 px-3 text-sm">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="h-8 px-3 text-sm">
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}

        {/* Agent Tester */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <AgentTester agentId={agent.id} agentName={agent.name} executionTarget={executionTarget} />
        </div>

        {/* Delete Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete Agent'}
          </Button>
        </div>
      </div>

      {/* Link Skill Dialog */}
      <LinkAgentSkillDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} agent={agent} />
    </div>
  );
}
