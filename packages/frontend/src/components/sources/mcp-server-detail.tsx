/**
 * MCPServerDetail Component
 *
 * WHY: Displays detailed information about a selected MCP server.
 * Used by Sources Page as the detail panel for MCP Server sources.
 *
 * DISPLAYS:
 * - Name (editable)
 * - Description
 * - Transport
 * - Run On (editable with grouped select)
 * - Config (editable with dynamic fields)
 * - Repository URL
 * - Connected Runtime
 * - Tools list
 *
 * FEATURES:
 * - Toggle between view and edit modes
 * - Batch save all changes
 * - Grouped select for Run On with nested runtime options
 * - Dynamic config field editing
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { ExternalLink, Server, Save, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { useNotification } from '@/contexts/NotificationContext';
import { ConfigEditor } from './config-editor';
import { useRuntimeData } from '@/stores/runtimeStore';
import { UpdateMcpServerRunOnDocument, UpdateMcpServerDocument, DeleteMcpServerDocument } from '@/graphql/generated/graphql';
import { extractConfigurableFields, enrichConfigWithValues, type ConfigField, type ConfigOption } from '@/lib/mcpConfigHelpers';
import type { SubscribeMcpServersSubscription } from '@/graphql/generated/graphql';
import { McpServerRunOn } from '@/graphql/generated/graphql';

type McpServer = NonNullable<SubscribeMcpServersSubscription['mcpServers']>[number];

export interface MCPServerDetailProps {
  server: McpServer;
}

export function MCPServerDetail({ server }: MCPServerDetailProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { runtimes } = useRuntimeData();
  const { confirm } = useNotification();

  // Inline edit state
  const [serverName, setServerName] = useState(server.name);
  const [runOn, setRunOn] = useState<McpServerRunOn | null>(server.runOn);
  const [runtimeId, setRuntimeId] = useState<string | null>(server.runtime?.id || null);

  // Configuration fields state
  const [configFields, setConfigFields] = useState<ConfigField[]>([]);
  const [editedConfigFields, setEditedConfigFields] = useState<ConfigField[]>([]);
  const [hasConfigChanges, setHasConfigChanges] = useState(false);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  // Mutations
  const [updateServer] = useMutation(UpdateMcpServerDocument);
  const [updateRunOn] = useMutation(UpdateMcpServerRunOnDocument);
  const [deleteServer] = useMutation(DeleteMcpServerDocument);

  // Create ConfigOption from stored config
  const configOption = useMemo((): ConfigOption | null => {
    try {
      const configObj = JSON.parse(server.config);
      
      // Determine if it's a Package or Transport based on structure
      const isPackage = 'packageArguments' in configObj || 
                        'environmentVariables' in configObj || 
                        'identifier' in configObj;
      
      return {
        id: 'stored-config',
        label: server.transport,
        type: isPackage ? 'package' : 'remote',
        transport: server.transport,
        config: configObj,
        isSupported: true,
      };
    } catch {
      return null;
    }
  }, [server.config, server.transport]);

  // Extract configurable fields using existing helper
  const configurableFields = useMemo(() => {
    if (!configOption) return [];
    return extractConfigurableFields(configOption);
  }, [configOption]);

  // Reset values when server changes
  useEffect(() => {
    setServerName(server.name);
    setRunOn(server.runOn);
    setRuntimeId(server.runtime?.id || null);
  }, [server]);

  // Initialize config fields when configurable fields change
  useEffect(() => {
    setConfigFields(configurableFields);
    setEditedConfigFields(configurableFields);
    setHasConfigChanges(false);
  }, [configurableFields]);

  // Generate grouped select value
  const groupedSelectValue = useMemo(() => {
    if (runOn === McpServerRunOn.Edge && runtimeId) {
      return `EDGE:${runtimeId}`;
    }
    return runOn || 'GLOBAL';
  }, [runOn, runtimeId]);

  // Handle name save on blur
  const handleNameSave = async () => {
    if (serverName === server.name) return;
    
    try {
      await updateServer({
        variables: {
          id: server.id,
          name: serverName,
          description: server.description,
          repositoryUrl: server.repositoryUrl,
          transport: server.transport,
          config: server.config,
        },
      });
    } catch (error) {
      console.error('Failed to save name:', error);
      setServerName(server.name); // Revert on error
    }
  };

  // Handle runOn change with auto-save
  const handleRunOnChange = async (value: string) => {
    let newRunOn: McpServerRunOn;
    let newRuntimeId: string | null = null;

    if (value.startsWith('EDGE:')) {
      newRuntimeId = value.replace('EDGE:', '');
      newRunOn = McpServerRunOn.Edge;
    } else {
      newRunOn = value as McpServerRunOn;
      newRuntimeId = null;
    }

    // Update local state immediately
    setRunOn(newRunOn);
    setRuntimeId(newRuntimeId);

    // Save to server
    try {
      await updateRunOn({
        variables: {
          mcpServerId: server.id,
          runOn: newRunOn,
          runtimeId: newRunOn === McpServerRunOn.Edge ? newRuntimeId : null,
        },
      });
    } catch (error) {
      console.error('Failed to save runOn:', error);
      // Revert on error
      setRunOn(server.runOn);
      setRuntimeId(server.runtime?.id || null);
    }
  };

  // Handle configuration field changes
  const handleConfigFieldChange = (fieldName: string, value: string) => {
    setEditedConfigFields(prev => prev.map(f => f.name === fieldName ? {...f, value} : f));
    setHasConfigChanges(true);
  };

  // Handle configuration save
  const handleConfigSave = async () => {
    if (!configOption) return;

    try {
      // Create a dummy server object for enrichConfigWithValues
      const dummyServer = {
        name: serverName,
        description: server.description,
        repositoryUrl: server.repositoryUrl,
      };

      // Use existing helper to reconstruct config with new values
      const enriched = enrichConfigWithValues(
        dummyServer as Parameters<typeof enrichConfigWithValues>[0],
        configOption,
        editedConfigFields,
      );

      // Update the server with the new config
      await updateServer({
        variables: {
          id: server.id,
          name: serverName,
          description: server.description,
          repositoryUrl: server.repositoryUrl,
          transport: server.transport,
          config: enriched.config,
        },
      });

      // Update local fields and clear changes
      setConfigFields(editedConfigFields);
      setHasConfigChanges(false);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  // Handle configuration cancel
  const handleConfigCancel = () => {
    setEditedConfigFields(configFields);
    setHasConfigChanges(false);
  };

  // Handle server deletion
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Server',
      description: `Are you sure you want to delete "${server.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete Server',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteServer({
        variables: {
          id: server.id,
        },
        refetchQueries: ['GetMCPTools'],
      });
    } catch (error) {
      console.error('Failed to delete server:', error);
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Server className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              onBlur={handleNameSave}
              className="text-lg font-semibold h-auto p-0 border-none bg-transparent focus:ring-0 focus:border-none"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{server.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Transport */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Transport
          </h4>
          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            {server.transport}
          </span>
        </div>

        {/* Run On */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Run On</h4>
          <Select value={groupedSelectValue} onValueChange={handleRunOnChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GLOBAL">Main Runtime</SelectItem>
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

        {/* Runtime */}
        {server.runtime && (() => {
          // Look up full runtime details from store to check capabilities
          const fullRuntime = runtimes.find(r => r.id === server.runtime!.id);
          const isAgent = fullRuntime?.capabilities?.includes('agent') ?? false;

          return (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Connected Runtime
              </h4>
              {isAgent ? (
                <Link
                  to={`/w/${workspaceId}/toolsets?id=${server.runtime.id}`}
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline"
                >
                  {server.runtime.name}
                </Link>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">{server.runtime.name}</p>
              )}
            </div>
          );
        })()}

        {/* Repository URL */}
        {server.repositoryUrl && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Repository
            </h4>
            <a
              href={server.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              {server.repositoryUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Configuration - Only show if there are configurable fields */}
        {configurableFields.length > 0 && (
          <div className="space-y-3">
            {/* Separator above Configuration */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Configuration
            </h4>
            
            <ConfigEditor
              fields={editedConfigFields}
              onFieldChange={handleConfigFieldChange}
            />
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={handleConfigCancel} 
                disabled={!hasConfigChanges}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={handleConfigSave} 
                disabled={!hasConfigChanges}
                className="h-7 px-2 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
            
            {/* Separator below action buttons */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
          </div>
        )}

        {/* Tools */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Tools ({server.tools?.length || 0})
          </h4>
          {server.tools && server.tools.length > 0 ? (
            <ul className="space-y-1">
              {server.tools.map((tool) => (
                <li
                  key={tool.id}
                  className="bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  <Link
                    to={`/w/${workspaceId}/tools?id=${tool.id}`}
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No tools discovered yet</p>
          )}
        </div>

        {/* Delete Server Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button
            variant="destructive"
            onClick={handleDelete}
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={isDeleting}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete Server
          </Button>
        </div>

      </div>
    </div>
  );
}
