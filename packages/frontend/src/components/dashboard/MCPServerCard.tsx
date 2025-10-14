import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, ExternalLink, Clock, ChevronDown, ChevronUp, Edit, Trash } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Status from '../ui/Status';
import { apolloResolversTypes, MCP_SERVER_RUN_ON } from '@2ly/common';
import { useMutation } from '@apollo/client';
import { UPDATE_MCP_SERVER_RUN_ON_MUTATION, LINK_MCP_SERVER_TO_RUNTIME_MUTATION, UNLINK_MCP_SERVER_FROM_RUNTIME_MUTATION } from '../../graphql';
import { cn, formatRelativeTime } from '../../utils/helpers';

interface MCPServerCardProps {
  server: apolloResolversTypes.McpServer;
  runtimes: apolloResolversTypes.Runtime[];
  onRuntimeChange: (serverId: string, runtimeId: string | null) => void;
  onEdit: (server: apolloResolversTypes.McpServer) => void;
  onDelete?: (server: apolloResolversTypes.McpServer) => void;
  onDuplicate?: (server: apolloResolversTypes.McpServer) => void;
  className?: string;
}

const MCPServerCard: React.FC<MCPServerCardProps> = ({
  server,
  runtimes,
  onRuntimeChange,
  onEdit,
  onDelete,
  onDuplicate,
  className,
}) => {
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRunOn, setSelectedRunOn] = useState<MCP_SERVER_RUN_ON | undefined>(server.runOn || 'GLOBAL');
  const [updateRunOn] = useMutation(UPDATE_MCP_SERVER_RUN_ON_MUTATION);
  const [linkServerToRuntime] = useMutation(LINK_MCP_SERVER_TO_RUNTIME_MUTATION);
  const [unlinkServerFromRuntime] = useMutation(UNLINK_MCP_SERVER_FROM_RUNTIME_MUTATION);

  const handleRuntimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const runtimeId = event.target.value === '' ? null : event.target.value;
    onRuntimeChange(server.id, runtimeId);
  };

  const toggleToolsExpansion = () => {
    setIsToolsExpanded(!isToolsExpanded);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(server);
    }
    setShowDeleteConfirm(false);
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(server);
    }
  };

  // Fake usage to avoid TS6133 error - temporarily
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  handleDuplicate;

  useEffect(() => {
    setSelectedRunOn(server.runOn || 'GLOBAL');
  }, [server.runOn]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} as="div">
      <Card className={cn('h-full flex flex-col', className)}>
        <CardContent className="p-0 flex-1">
          <div className="flex items-center gap-4 border-b border-gray-100 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Server className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate text-base font-semibold">{server.name}</h3>
            </div>
            <div className="flex flex-col gap-1">
              <Status status={server.runtime?.status || 'INACTIVE'} className="capitalize" size="sm" />
            </div>
          </div>

          <div className="p-2">
            <p className="mb-3 text-sm text-gray-600">{server.description}</p>

            <div className="mb-3 space-y-3">
              <div className="rounded-md bg-gray-50 p-2 text-xs">
                <span className="block text-gray-500">Transport</span>
                <span className="font-medium font-mono break-all">{server.transport}</span>
              </div>
              {server.transport === 'STDIO' ? (
                <>
                  <div className="rounded-md bg-gray-50 p-2 text-xs">
                    <span className="block text-gray-500">Command</span>
                    <span className="font-medium font-mono break-all">{server.command}</span>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2 text-xs">
                    <span className="block text-gray-500">Arguments</span>
                    <span className="font-medium font-mono break-all">{server.args || 'None'}</span>
                  </div>
                  {server.ENV && (
                    <div className="rounded-md bg-gray-50 p-2 text-xs">
                      <span className="block text-gray-500">Environment Variables</span>
                      <span className="font-medium font-mono break-all">{server.ENV}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-md bg-gray-50 p-2 text-xs">
                  <span className="block text-gray-500">Server URL</span>
                  <span className="font-medium font-mono break-all">{server.serverUrl || 'None'}</span>
                </div>
              )}

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Run on</label>
                <select
                  value={selectedRunOn}
                  onChange={async (e) => {
                    const newRunOn = e.target.value as MCP_SERVER_RUN_ON;
                    setSelectedRunOn(newRunOn ?? undefined);
                    const runtimeIdToSend = newRunOn === 'EDGE' ? server.runtime?.id ?? null : null;
                    await updateRunOn({ variables: { mcpServerId: server.id, runOn: newRunOn, runtimeId: runtimeIdToSend } });
                    if (newRunOn !== 'EDGE') {
                      await unlinkServerFromRuntime({ variables: { mcpServerId: server.id } });
                    } else if (runtimeIdToSend) {
                      await linkServerToRuntime({ variables: { mcpServerId: server.id, runtimeId: runtimeIdToSend } });
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="GLOBAL">Main Runtime</option>
                  <option value="AGENT">Agent Side</option>
                  <option value="EDGE">On the Edge</option>
                </select>
              </div>

              {selectedRunOn === 'EDGE' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Runtime</label>
                  <select
                    value={server.runtime?.id || ''}
                    onChange={handleRuntimeChange}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">No Runtime</option>
                    {runtimes.map((runtime) => (
                      <option key={runtime.id} value={runtime.id}>
                        {runtime.name} ({runtime.status.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {server.tools && server.tools.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <button
                    onClick={toggleToolsExpansion}
                    className="flex w-full items-center justify-between text-xs font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Tools ({server.tools.length})</span>
                    {isToolsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {isToolsExpanded && (
                    <div className="mt-2 space-y-2">
                      {server.tools.map((tool) => (
                        <div key={tool.id} className="rounded-md bg-gray-50 p-2 text-xs">
                          <div className="font-medium text-gray-900">{tool.name}</div>
                          <div className="text-gray-600 mt-1">{tool.description}</div>
                          <Status status={tool.status} size="sm" className="mt-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {server.repositoryUrl && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{server.repositoryUrl}</span>
                </div>
              )}

              {server.serverUrl && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Server className="h-3 w-3" />
                  <span className="truncate">{server.serverUrl}</span>
                </div>
              )}

              {server.runtime?.lastSeenAt && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>Last seen {formatRelativeTime(server.runtime?.lastSeenAt.toString())}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-gray-100 p-2 mt-auto">
          <div className="flex w-full justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash className="h-4 w-4" />}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={() => onEdit(server)}
            >
              Edit
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Delete MCP Server</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete "{server.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MCPServerCard;
