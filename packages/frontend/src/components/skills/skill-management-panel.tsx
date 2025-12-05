/**
 * SkillManagementPanel Component
 *
 * WHY: Full-screen bottom panel for managing which tools belong to a skill (runtime).
 * Provides search, filtering, and selection interface for linking/unlinking tools.
 *
 * FEATURES:
 * - Bottom panel (replaces dialog modal pattern)
 * - Two-column layout: available tools list (left) + selected/linked tools summary (right)
 * - Search and filter controls (by source/server)
 * - Checkbox selection with "Select All" functionality
 * - Save/Cancel actions with optimistic updates
 * - Loading and error states
 * - Real-time updates via GraphQL subscriptions
 * - Self-contained: manages own state via UIStore
 * - Auto-closes on navigation via useCloseOnNavigation hook
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, Search, Settings, Loader2, CheckCircle, AlertCircle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckboxDropdown } from '@/components/ui/checkbox-dropdown';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BottomPanel } from '@/components/ui/bottom-panel';
import { SkillSelectionTable } from './skill-selection-table';
import { useManageToolsDialog } from '@/stores/uiStore';
import { useSkills } from '@/hooks/useSkills';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useMCPTools } from '@/hooks/useMCPTools';
import { useAgents } from '@/hooks/useAgents';
import { useCloseOnNavigation } from '@/hooks/useCloseOnNavigation';
import { useWorkspaceFromUrl } from '@/hooks/useWorkspaceFromUrl';
import {
  AddMcpToolToSkillDocument,
  RemoveMcpToolFromSkillDocument,
  AddAgentToSkillDocument,
  RemoveAgentFromSkillDocument,
  type GetMcpToolsQuery,
} from '@/graphql/generated/graphql';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

type McpTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

interface GroupedServer {
  id: string;
  name: string;
  description: string;
  tools: McpTool[];
}

export function SkillManagementPanel() {
  const { open, setOpen, selectedSkillId, setSelectedSkillId } = useManageToolsDialog();
  const workspaceId = useWorkspaceFromUrl();
  const { skills } = useSkills(workspaceId || '');
  const { servers } = useMCPServers();
  const { filteredTools, loading: toolsLoading } = useMCPTools();
  const { filteredAgents, loading: agentsLoading } = useAgents();

  // Local state for MCP tools
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [baselineToolIds, setBaselineToolIds] = useState<Set<string>>(new Set());

  // Local state for agents
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [baselineAgentIds, setBaselineAgentIds] = useState<Set<string>>(new Set());

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmRemoveToolId, setConfirmRemoveToolId] = useState<string | null>(null);
  const [confirmRemoveAgentId, setConfirmRemoveAgentId] = useState<string | null>(null);

  // Mutations for MCP tools
  const [addTool] = useMutation(AddMcpToolToSkillDocument);
  const [removeTool] = useMutation(RemoveMcpToolFromSkillDocument);

  // Mutations for agents
  const [addAgent] = useMutation(AddAgentToSkillDocument);
  const [removeAgent] = useMutation(RemoveAgentFromSkillDocument);

  // Close handler with cleanup
  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedSkillId(null);
    // Note: other state resets happen in the useEffect below
  }, [setOpen, setSelectedSkillId]);

  // Auto-close on navigation
  useCloseOnNavigation(handleClose);

  // Get selected skill
  const selectedSkill = useMemo(() => {
    if (!selectedSkillId) return null;
    return skills.find((ts) => ts.id === selectedSkillId) || null;
  }, [selectedSkillId, skills]);

  // Group tools by server
  const groupedServers = useMemo((): GroupedServer[] => {
    const serverMap = new Map<string, GroupedServer>();

    // Initialize servers
    servers.forEach((server) => {
      serverMap.set(server.id, {
        id: server.id,
        name: server.name,
        description: server.description,
        tools: [],
      });
    });

    // Add tools to servers
    filteredTools.forEach((tool) => {
      const server = serverMap.get(tool.mcpServer.id);
      if (server) {
        server.tools.push(tool);
      }
    });

    // Filter by search and server selection
    return Array.from(serverMap.values())
      .filter((server) => {
        // Filter by selected servers
        if (selectedServerIds.length > 0 && !selectedServerIds.includes(server.id)) {
          return false;
        }

        // Filter by search term
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const hasMatchingTool = server.tools.some(
            (tool) => tool.name.toLowerCase().includes(term) || tool.description.toLowerCase().includes(term),
          );
          const serverMatches =
            server.name.toLowerCase().includes(term) || server.description.toLowerCase().includes(term);
          return hasMatchingTool || serverMatches;
        }

        return true;
      })
      .map((server) => ({
        ...server,
        tools: server.tools.filter((tool) => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          return tool.name.toLowerCase().includes(term) || tool.description.toLowerCase().includes(term);
        }),
      }))
      .filter((server) => server.tools.length > 0);
  }, [servers, filteredTools, searchTerm, selectedServerIds]);

  // Initialize selected tools and agents when skill changes
  useEffect(() => {
    if (selectedSkill) {
      const currentToolIds = new Set((selectedSkill.mcpTools || []).map((tool) => tool.id));
      setSelectedToolIds(currentToolIds);
      setBaselineToolIds(currentToolIds);

      const currentAgentIds = new Set((selectedSkill.agentTools || []).map((agent) => agent.id));
      setSelectedAgentIds(currentAgentIds);
      setBaselineAgentIds(currentAgentIds);
    } else {
      setSelectedToolIds(new Set());
      setBaselineToolIds(new Set());
      setSelectedAgentIds(new Set());
      setBaselineAgentIds(new Set());
    }
  }, [selectedSkill]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedServerIds([]);
      setShowSelectedOnly(false);
      setSelectedToolIds(new Set());
      setBaselineToolIds(new Set());
      setSelectedAgentIds(new Set());
      setBaselineAgentIds(new Set());
      setSaveError(null);
      setConfirmRemoveToolId(null);
      setConfirmRemoveAgentId(null);
    }
  }, [open]);

  // Auto-clear "show selected only" filter when all tools are deselected
  useEffect(() => {
    if (showSelectedOnly && selectedToolIds.size === 0) {
      setShowSelectedOnly(false);
    }
  }, [showSelectedOnly, selectedToolIds.size]);

  // Tool selection handlers
  const handleToolToggle = useCallback((toolId: string) => {
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

  const handleServerToggle = useCallback(
    (serverId: string) => {
      const server = groupedServers.find((s) => s.id === serverId);
      if (!server) return;

      const serverToolIds = server.tools.map((tool) => tool.id);
      const allSelected = serverToolIds.every((id) => selectedToolIds.has(id));

      setSelectedToolIds((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          serverToolIds.forEach((id) => next.delete(id));
        } else {
          serverToolIds.forEach((id) => next.add(id));
        }
        return next;
      });
    },
    [groupedServers, selectedToolIds],
  );

  const handleSelectAll = useCallback(() => {
    const allToolIds = new Set<string>();
    groupedServers.forEach((server) => {
      server.tools.forEach((tool) => allToolIds.add(tool.id));
    });
    setSelectedToolIds(allToolIds);
  }, [groupedServers]);

  const handleSelectNone = useCallback(() => {
    setSelectedToolIds(new Set());
  }, []);

  const handleRemoveToolClick = useCallback((toolId: string) => {
    setConfirmRemoveToolId(toolId);
  }, []);

  const handleConfirmRemoveTool = useCallback(() => {
    if (confirmRemoveToolId) {
      handleToolToggle(confirmRemoveToolId);
      setConfirmRemoveToolId(null);
    }
  }, [confirmRemoveToolId, handleToolToggle]);

  // Agent selection handlers
  const handleAgentToggle = useCallback((agentId: string) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  }, []);

  const handleRemoveAgentClick = useCallback((agentId: string) => {
    setConfirmRemoveAgentId(agentId);
  }, []);

  const handleConfirmRemoveAgent = useCallback(() => {
    if (confirmRemoveAgentId) {
      handleAgentToggle(confirmRemoveAgentId);
      setConfirmRemoveAgentId(null);
    }
  }, [confirmRemoveAgentId, handleAgentToggle]);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!selectedSkill) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Handle MCP tool changes
      const toolsToAdd = Array.from(selectedToolIds).filter((id) => !baselineToolIds.has(id));
      const toolsToRemove = Array.from(baselineToolIds).filter((id) => !selectedToolIds.has(id));

      for (const toolId of toolsToAdd) {
        await addTool({
          variables: {
            mcpToolId: toolId,
            skillId: selectedSkill.id,
          },
        });
      }

      for (const toolId of toolsToRemove) {
        await removeTool({
          variables: {
            mcpToolId: toolId,
            skillId: selectedSkill.id,
          },
        });
      }

      // Handle agent changes
      const agentsToAdd = Array.from(selectedAgentIds).filter((id) => !baselineAgentIds.has(id));
      const agentsToRemove = Array.from(baselineAgentIds).filter((id) => !selectedAgentIds.has(id));

      for (const agentId of agentsToAdd) {
        await addAgent({
          variables: {
            agentId,
            skillId: selectedSkill.id,
          },
        });
      }

      for (const agentId of agentsToRemove) {
        await removeAgent({
          variables: {
            agentId,
            skillId: selectedSkill.id,
          },
        });
      }

      setBaselineToolIds(new Set(selectedToolIds));
      setBaselineAgentIds(new Set(selectedAgentIds));
      setOpen(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [selectedSkill, selectedToolIds, baselineToolIds, selectedAgentIds, baselineAgentIds, addTool, removeTool, addAgent, removeAgent, setOpen]);

  const handleCancel = useCallback(() => {
    setSelectedToolIds(new Set(baselineToolIds));
    setSelectedAgentIds(new Set(baselineAgentIds));
    handleClose();
  }, [baselineToolIds, baselineAgentIds, handleClose]);

  const hasChanges = useMemo(() => {
    // Check tool changes
    if (selectedToolIds.size !== baselineToolIds.size) return true;
    if (!Array.from(selectedToolIds).every((id) => baselineToolIds.has(id))) return true;
    // Check agent changes
    if (selectedAgentIds.size !== baselineAgentIds.size) return true;
    if (!Array.from(selectedAgentIds).every((id) => baselineAgentIds.has(id))) return true;
    return false;
  }, [selectedToolIds, baselineToolIds, selectedAgentIds, baselineAgentIds]);

  const availableServers = useMemo(() => {
    return servers.map((server) => ({
      id: server.id,
      label: server.name,
    }));
  }, [servers]);

  if (!selectedSkill) {
    return null;
  }

  return (
    <BottomPanel isOpen={open} onClose={handleCancel} className="tool-management-panel">
      {/* Header - natural height, no flex grow */}
      <div className="tool-management-panel-header flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Settings className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Tools</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select tools for <span className="font-medium">{selectedSkill.name}</span>
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleCancel} className="rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content - flex-1 takes all remaining space, two-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tool Selection */}
        <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
          {/* Search and Filters - natural height */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-3">
              <CheckboxDropdown
                label="Servers"
                placeholder="All servers"
                items={availableServers}
                selectedIds={selectedServerIds}
                onChange={setSelectedServerIds}
              />
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                <Switch
                  id="show-selected-only"
                  checked={showSelectedOnly}
                  onCheckedChange={setShowSelectedOnly}
                />
                <label
                  htmlFor="show-selected-only"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                >
                  Show selected only
                </label>
              </div>
            </div>
          </div>

          {/* Tools List */}
          <div className="flex-1 overflow-auto p-4">
            <SkillSelectionTable
              servers={groupedServers}
              selectedToolIds={selectedToolIds}
              onToolToggle={handleToolToggle}
              onServerToggle={handleServerToggle}
              onSelectAll={handleSelectAll}
              onSelectNone={handleSelectNone}
              searchTerm={searchTerm}
              showSelectedOnly={showSelectedOnly}
              loading={toolsLoading}
            />

            {/* Agents Section */}
            {filteredAgents.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-4 w-4 text-purple-500" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Agents ({filteredAgents.length})
                  </h4>
                </div>
                {agentsLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading agents...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAgents
                      .filter((agent) => !showSelectedOnly || selectedAgentIds.has(agent.id))
                      .filter((agent) => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (
                          agent.name.toLowerCase().includes(term) ||
                          (agent.description?.toLowerCase().includes(term) ?? false)
                        );
                      })
                      .map((agent) => (
                        <div
                          key={agent.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Checkbox
                            id={`agent-${agent.id}`}
                            checked={selectedAgentIds.has(agent.id)}
                            onCheckedChange={() => handleAgentToggle(agent.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`agent-${agent.id}`}
                              className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                            >
                              {agent.name}
                            </label>
                            {agent.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {agent.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {agent.model}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Summary (fixed width) */}
        <div className="w-80 flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Selection Summary</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Selected MCP tools:</span>
                <span className="font-medium">{selectedToolIds.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected agents:</span>
                <span className="font-medium">{selectedAgentIds.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Changes:</span>
                <span
                  className={cn('font-medium', hasChanges ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500')}
                >
                  {hasChanges ? 'Pending' : 'None'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-6">
              {/* Selected Tools */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Selected MCP Tools</h4>
                {selectedToolIds.size === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tools selected</p>
                ) : (
                  <div className="space-y-2">
                    {Array.from(selectedToolIds).map((toolId) => {
                      const tool = filteredTools.find((t) => t.id === toolId);
                      if (!tool) return null;
                      return (
                        <div
                          key={toolId}
                          className="group flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-gray-900 dark:text-white truncate flex-1">{tool.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveToolClick(toolId)}
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-600"
                            aria-label={`Remove ${tool.name}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Agents */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Selected Agents</h4>
                {selectedAgentIds.size === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No agents selected</p>
                ) : (
                  <div className="space-y-2">
                    {Array.from(selectedAgentIds).map((agentId) => {
                      const agent = filteredAgents.find((a) => a.id === agentId);
                      if (!agent) return null;
                      return (
                        <div
                          key={agentId}
                          className="group flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Bot className="h-3 w-3 text-purple-500 flex-shrink-0" />
                          <span className="text-gray-900 dark:text-white truncate flex-1">{agent.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAgentClick(agentId)}
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-600"
                            aria-label={`Remove ${agent.name}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - natural height */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          {saveError && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{saveError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog for Tool Removal */}
      <ConfirmDialog
        open={confirmRemoveToolId !== null}
        onOpenChange={(open) => !open && setConfirmRemoveToolId(null)}
        title="Remove Tool"
        description={`Are you sure you want to remove "${filteredTools.find((t) => t.id === confirmRemoveToolId)?.name}" from this skill?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleConfirmRemoveTool}
      />

      {/* Confirmation Dialog for Agent Removal */}
      <ConfirmDialog
        open={confirmRemoveAgentId !== null}
        onOpenChange={(open) => !open && setConfirmRemoveAgentId(null)}
        title="Remove Agent"
        description={`Are you sure you want to remove "${filteredAgents.find((a) => a.id === confirmRemoveAgentId)?.name}" from this skill?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleConfirmRemoveAgent}
      />
    </BottomPanel>
  );
}
