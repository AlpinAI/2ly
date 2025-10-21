import React, { useState, useMemo } from 'react';
import { useSubscription } from '@apollo/client';
import { Activity, AlertCircle, CheckCircle, Clock, Server, ArrowRight, ArrowLeft, Filter, X } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TOOL_CALLS_SUBSCRIPTION } from '../graphql/subscriptions';
import { useWorkspace } from '../contexts/useWorkspace';
import { apolloResolversTypes } from '@2ly/common';

type ToolCall = {
  id: string;
  toolInput: string;
  calledAt: string;
  completedAt?: string;
  status: apolloResolversTypes.ToolCallStatus;
  toolOutput?: string;
  error?: string;
  mcpTool: {
    id: string;
    name: string;
    description: string;
    mcpServer: {
      id: string;
      name: string;
    };
  };
  calledBy: {
    id: string;
    name: string;
    hostname?: string;
  };
  executedBy: {
    id: string;
    name: string;
    hostname?: string;
  };
};

const getStatusIcon = (status: apolloResolversTypes.ToolCallStatus) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'FAILED':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'PENDING':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const formatJsonContent = (content: string | null | undefined) => {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    const formatted = JSON.stringify(parsed, null, 2);
    return formatted;
  } catch {
    // If not valid JSON, return as is
    return content;
  }
};

const formatSingleLineContent = (content: string | null | undefined, maxLength = 80) => {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    const singleLine = JSON.stringify(parsed);
    return singleLine.length > maxLength ? singleLine.substring(0, maxLength) + '...' : singleLine;
  } catch {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
};

const formatInputAsKeyValue = (content: string | null | undefined, isExpanded = false) => {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);

    if (typeof parsed === 'object' && parsed !== null) {
      const entries = Object.entries(parsed);

      if (!isExpanded && entries.length > 3) {
        // Show first 3 entries in collapsed mode
        const visibleEntries = entries.slice(0, 3);
        return (
          <div className="space-y-1">
            {visibleEntries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="font-medium text-gray-800 text-xs">{key}:</span>
                <span className="text-gray-600 text-xs break-all">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </span>
              </div>
            ))}
            <div className="text-gray-400 text-xs">+{entries.length - 3} more...</div>
          </div>
        );
      }

      return (
        <div className="space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="font-medium text-gray-800 text-xs">{key}:</span>
              <span className="text-gray-600 text-xs break-all">
                {typeof value === 'object'
                  ? <pre className="inline">{JSON.stringify(value, null, 2)}</pre>
                  : String(value)
                }
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Fallback to JSON if not an object
    return formatJsonContent(content);
  } catch {
    return content;
  }
};

const MonitoringPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    runtime: '',
    tool: '',
    status: '' as apolloResolversTypes.ToolCallStatus | ''
  });

  const { data, loading, error } = useSubscription(TOOL_CALLS_SUBSCRIPTION, {
    variables: { workspaceId: currentWorkspace?.id },
    skip: !currentWorkspace?.id,
  });

  const allToolCalls = useMemo(() => data?.toolCalls || [], [data]);

  // Filter tool calls based on selected filters
  const filteredToolCalls = useMemo(() => {
    return allToolCalls.filter((call: ToolCall) => {
      if (filters.runtime && !call.calledBy.name.toLowerCase().includes(filters.runtime.toLowerCase()) &&
          (!call.executedBy || !call.executedBy.name.toLowerCase().includes(filters.runtime.toLowerCase()))) {
        return false;
      }
      if (filters.tool && !call.mcpTool.name.toLowerCase().includes(filters.tool.toLowerCase())) {
        return false;
      }
      if (filters.status && call.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [allToolCalls, filters]);

  const toolCalls = filteredToolCalls;

  const toggleExpanded = (callId: string, field: 'input' | 'output') => {
    const key = `${callId}-${field}`;
    setExpandedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setFilters({ runtime: '', tool: '', status: '' });
  };

  const hasActiveFilters = filters.runtime || filters.tool || filters.status;

  // Get unique values for filter dropdowns
  const uniqueRuntimes = useMemo(() => {
    const runtimes = new Set<string>();
    allToolCalls.forEach((call: ToolCall) => {
      runtimes.add(call.calledBy.name);
      if (call.executedBy) {
        runtimes.add(call.executedBy.name);
      }
    });
    return Array.from(runtimes).sort();
  }, [allToolCalls]);

  const uniqueTools = useMemo(() => {
    const tools = new Set<string>();
    allToolCalls.forEach((call: ToolCall) => {
      tools.add(call.mcpTool.name);
    });
    return Array.from(tools).sort();
  }, [allToolCalls]);

  // Calculate statistics
  const totalCalls = toolCalls.length;
  const completedCalls = toolCalls.filter((call: ToolCall) => call.status === 'COMPLETED').length;
  const failedCalls = toolCalls.filter((call: ToolCall) => call.status === 'FAILED').length;
  const pendingCalls = toolCalls.filter((call: ToolCall) => call.status === 'PENDING').length;

  if (!currentWorkspace) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">No Workspace Selected</h2>
          <p className="text-gray-500">Please select a workspace to view tool call monitoring.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-gray-500">Real-time monitoring of tool calls in your workspace.</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-shrink-0">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{failedCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tool Calls Header and Filters */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tool Calls</h2>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<X className="h-4 w-4" />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Runtime:</label>
            <select
              value={filters.runtime}
              onChange={(e) => setFilters(prev => ({ ...prev, runtime: e.target.value }))}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white min-w-32"
            >
              <option value="">All Runtimes</option>
              {uniqueRuntimes.map(runtime => (
                <option key={runtime} value={runtime}>{runtime}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Tool:</label>
            <select
              value={filters.tool}
              onChange={(e) => setFilters(prev => ({ ...prev, tool: e.target.value }))}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white min-w-32"
            >
              <option value="">All Tools</option>
              {uniqueTools.map(tool => (
                <option key={tool} value={tool}>{tool}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as apolloResolversTypes.ToolCallStatus | '' }))}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white min-w-24"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {filteredToolCalls.length} of {allToolCalls.length} calls
          </div>
        </div>
      </div>

      {/* Tool Calls Table */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
          {loading && (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <Activity className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Loading tool calls...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-red-500" />
                <p className="mt-2 text-sm text-red-600">Error loading tool calls: {error.message}</p>
              </div>
            </div>
          )}

          {!loading && !error && toolCalls.length === 0 && (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <Activity className="mx-auto h-6 w-6 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No tool calls yet</p>
              </div>
            </div>
          )}

          {!loading && !error && toolCalls.length > 0 && (
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1200px', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '48px' }} />
                  <col style={{ width: '150px', minWidth: '150px' }} />
                  <col style={{ minWidth: '200px' }} />
                  <col style={{ minWidth: '200px' }} />
                  <col style={{ width: '140px', minWidth: '140px' }} />
                  <col style={{ width: '120px', minWidth: '120px' }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3">
                      {/* Status icons */}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tool
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Input
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Output/Error
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Runtimes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Timing
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {toolCalls.map((call: ToolCall) => {
                    const duration = call.completedAt
                      ? Math.round((new Date(call.completedAt).getTime() - new Date(call.calledAt).getTime()))
                      : null;

                    return (
                      <tr key={call.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4">
                          <div className="flex items-center justify-center">
                            {getStatusIcon(call.status)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <Server className="mr-2 h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {call.mcpTool.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {call.mcpTool.mcpServer.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {call.toolInput && (
                            <div
                              className="cursor-pointer select-none"
                              onClick={() => toggleExpanded(call.id, 'input')}
                            >
                              <div className={`text-xs bg-gray-50 p-2 rounded border hover:bg-gray-100 transition-colors ${expandedCells.has(`${call.id}-input`) ? 'overflow-x-auto max-h-40 overflow-y-auto' : 'overflow-hidden'}`}>
                                {formatInputAsKeyValue(call.toolInput, expandedCells.has(`${call.id}-input`))}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {call.status === 'FAILED' && call.error ? (
                            <div
                              className="cursor-pointer select-none"
                              onClick={() => toggleExpanded(call.id, 'output')}
                            >
                              {expandedCells.has(`${call.id}-output`) ? (
                                <div className="text-xs text-red-700 bg-red-50 p-2 rounded border">
                                  <div className="font-medium text-red-800 mb-1">Error:</div>
                                  <pre className="whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                                    <code>{formatJsonContent(call.error)}</code>
                                  </pre>
                                </div>
                              ) : (
                                <div className="text-xs text-red-700 bg-red-50 p-2 rounded border hover:bg-red-100 transition-colors overflow-hidden">
                                  <div className="font-medium text-red-800">Error:</div>
                                  <code className="whitespace-nowrap">{formatSingleLineContent(call.error)}</code>
                                </div>
                              )}
                            </div>
                          ) : call.toolOutput ? (
                            <div
                              className="cursor-pointer select-none"
                              onClick={() => toggleExpanded(call.id, 'output')}
                            >
                              {expandedCells.has(`${call.id}-output`) ? (
                                <pre className="text-xs text-gray-700 bg-green-50 p-2 rounded border overflow-x-auto max-h-40 overflow-y-auto whitespace-pre">
                                  <code>{formatJsonContent(call.toolOutput)}</code>
                                </pre>
                              ) : (
                                <div className="text-xs text-gray-700 bg-green-50 p-2 rounded border hover:bg-green-100 transition-colors overflow-hidden">
                                  <code className="whitespace-nowrap">{formatSingleLineContent(call.toolOutput)}</code>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <ArrowRight className="mr-2 h-3 w-3 text-blue-500" />
                              <div>
                                <div className="text-xs font-medium text-gray-900">
                                  {call.calledBy.name}
                                </div>
                                {call.calledBy.hostname && (
                                  <div className="text-xs text-gray-500">
                                    {call.calledBy.hostname}
                                  </div>
                                )}
                              </div>
                            </div>
                            {call.executedBy && (
                              <div className="flex items-center">
                                <ArrowLeft className="mr-2 h-3 w-3 text-green-500" />
                                <div>
                                  <div className="text-xs font-medium text-gray-900">
                                    {call.executedBy.name}
                                  </div>
                                  {call.executedBy.hostname && (
                                    <div className="text-xs text-gray-500">
                                      {call.executedBy.hostname}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">
                              {new Date(call.calledAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-900 font-medium">
                              {new Date(call.calledAt).toLocaleTimeString()}
                            </div>
                            <div className="text-xs text-blue-600 font-medium">
                              {duration !== null ? `${duration} ms` : 'pending'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringPage;