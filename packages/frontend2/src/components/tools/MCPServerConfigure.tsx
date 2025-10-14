/**
 * MCPServerConfigure Component
 *
 * WHY: Configuration and testing interface for MCP Registry servers.
 * Users select a config type (package/remote), fill required fields, and test the server.
 *
 * ARCHITECTURE:
 * - Left panel: Server info + config dropdown + dynamic form + test controls
 * - Right panel: Test status and results
 * - Responsive layout (stacks on mobile)
 * - GraphQL integration for server creation and testing
 * - Real-time tool discovery via subscription
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useMutation, useSubscription } from '@apollo/client/react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { SplitButton } from '@/components/ui/split-button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { TestPanel, type TestStatus } from './TestPanel';
import { ConfigFieldInput } from './ConfigFieldInput';
import {
  extractConfigOptions,
  extractConfigurableFields,
  enrichConfigWithValues,
  getServerDisplayName,
  validateFields,
  type ConfigField,
} from '@/lib/mcpConfigHelpers';
import {
  SubscribeRuntimesDocument,
  CreateMcpServerDocument,
  UpdateMcpServerRunOnDocument,
  DeleteMcpServerDocument,
  SubscribeMcpServersDocument,
  McpServerRunOn,
} from '@/graphql/generated/graphql';
import type { SubscribeMcpRegistriesSubscription } from '@/graphql/generated/graphql';

// Extract server type
type MCPRegistryServer = NonNullable<
  NonNullable<SubscribeMcpRegistriesSubscription['mcpRegistries']>[number]['servers']
>[number];

interface MCPServerConfigureProps {
  selectedServer: MCPRegistryServer;
  onBack: () => void;
  onSuccess?: () => void;
}

const TEST_TIMEOUT_MS = 20000; // 20 seconds

export function MCPServerConfigure({ selectedServer, onBack, onSuccess }: MCPServerConfigureProps) {
  console.log('selectedServer', selectedServer);
  if (selectedServer.packages) console.log('packages', JSON.parse(selectedServer.packages));
  if (selectedServer.remotes) console.log('remotes', JSON.parse(selectedServer.remotes));

  const workspaceId = useWorkspaceId();

  // Config state
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [fields, setFields] = useState<ConfigField[]>([]);
  const [customName, setCustomName] = useState<string>('');

  // Runtime state
  const [selectedRuntimeId, setSelectedRuntimeId] = useState<string>('');

  // Test state
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testServerId, setTestServerId] = useState<string>('');
  const [discoveredTools, setDiscoveredTools] = useState<Array<{ id: string; name: string }>>([]);
  const [testError, setTestError] = useState<string>('');

  const testTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // GraphQL mutations
  const [createServer] = useMutation(CreateMcpServerDocument);
  const [updateServerRunOn] = useMutation(UpdateMcpServerRunOnDocument);
  const [deleteServer] = useMutation(DeleteMcpServerDocument);

  // Subscribe to runtimes for real-time updates
  const { data: runtimesData } = useSubscription(SubscribeRuntimesDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  // Subscribe to MCP servers for tool discovery
  const { data: serversData } = useSubscription(SubscribeMcpServersDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId || !testServerId,
  });

  // Extract config options from server
  const configOptions = useMemo(() => {
    return extractConfigOptions(selectedServer);
  }, [selectedServer]);

  // Get selected config option
  const selectedOption = useMemo(() => {
    return configOptions.find((opt) => opt.id === selectedOptionId);
  }, [configOptions, selectedOptionId]);

  // Get runtimes list from subscription
  const runtimes = useMemo(() => {
    return runtimesData?.runtimes || [];
  }, [runtimesData]);

  // Get default runtime
  const defaultRuntimeId = useMemo(() => {
    // Find first active runtime
    const activeRuntime = runtimes.find((r) => r.status === 'ACTIVE');
    return activeRuntime?.id || runtimes[0]?.id || '';
  }, [runtimes]);

  // Initialize selected runtime
  useEffect(() => {
    if (!selectedRuntimeId && defaultRuntimeId) {
      setSelectedRuntimeId(defaultRuntimeId);
    }
  }, [defaultRuntimeId, selectedRuntimeId]);

  // Initialize selected option (first supported)
  useEffect(() => {
    if (!selectedOptionId && configOptions.length > 0) {
      const firstSupported = configOptions.find((opt) => opt.isSupported);
      if (firstSupported) {
        setSelectedOptionId(firstSupported.id);
      }
    }
  }, [configOptions, selectedOptionId]);

  // Extract fields when option changes
  useEffect(() => {
    if (selectedOption) {
      const extracted = extractConfigurableFields(selectedOption);
      setFields(extracted);
    } else {
      setFields([]);
    }
  }, [selectedOption]);

  // Initialize custom name
  useEffect(() => {
    if (!customName) {
      setCustomName(getServerDisplayName(selectedServer));
    }
  }, [selectedServer, customName]);

  // Watch for tools on test server
  useEffect(() => {
    if (!testServerId || testStatus !== 'running') return;

    const server = serversData?.mcpServers?.find((s) => s.id === testServerId);
    if (server?.tools && server.tools.length > 0) {
      // Tools discovered!
      if (testTimeoutRef.current) {
        clearTimeout(testTimeoutRef.current);
        testTimeoutRef.current = null;
      }
      setDiscoveredTools(server.tools.map((t) => ({ id: t.id, name: t.name })));
      setTestStatus('success');

      // Set server to GLOBAL mode (makes it available workspace-wide)
      updateServerRunOn({
        variables: {
          mcpServerId: testServerId,
          runOn: McpServerRunOn.Global,
        },
      }).catch((err) => {
        console.error('Failed to set server to GLOBAL:', err);
      });
    }
  }, [serversData, testServerId, testStatus, updateServerRunOn]);

  // Handle field value change
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.name === fieldName ? { ...f, value } : f)));
  }, []);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!selectedOption) return false;
    if (!selectedRuntimeId) return false;
    return validateFields(fields);
  }, [selectedOption, selectedRuntimeId, fields]);

  // Handle test server
  const handleTestServer = useCallback(async () => {
    if (!workspaceId || !selectedOption || !selectedRuntimeId) return;

    setTestStatus('running');
    setTestError('');
    setDiscoveredTools([]);

    try {
      // Enrich config with user-provided values
      const input = enrichConfigWithValues(selectedServer, selectedOption, fields, customName);

      // Create server
      const { data } = await createServer({
        variables: {
          workspaceId,
          name: input.name,
          description: input.description,
          repositoryUrl: input.repositoryUrl,
          transport: input.transport,
          config: input.config,
        },
      });

      const serverId = data?.createMCPServer?.id;
      if (!serverId) {
        throw new Error('Failed to create server');
      }

      setTestServerId(serverId);

      // Set server to run on EDGE with selected runtime for testing
      await updateServerRunOn({
        variables: {
          mcpServerId: serverId,
          runOn: McpServerRunOn.Edge,
          runtimeId: selectedRuntimeId,
        },
      });

      // Set timeout for tool discovery
      testTimeoutRef.current = setTimeout(() => {
        setTestStatus('timeout');
        // Clean up server on timeout
        deleteServer({ variables: { id: serverId } }).catch((err) => {
          console.error('Failed to delete server on timeout:', err);
        });
        testTimeoutRef.current = null;
      }, TEST_TIMEOUT_MS);
    } catch (err) {
      console.error('Test failed:', err);
      setTestError(err instanceof Error ? err.message : 'Unknown error');
      setTestStatus('error');
    }
  }, [
    workspaceId,
    selectedOption,
    selectedRuntimeId,
    selectedServer,
    fields,
    customName,
    createServer,
    updateServerRunOn,
    deleteServer,
  ]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setTestStatus('idle');
    setTestServerId('');
    setDiscoveredTools([]);
    setTestError('');
    if (testTimeoutRef.current) {
      clearTimeout(testTimeoutRef.current);
      testTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) {
        clearTimeout(testTimeoutRef.current);
      }
    };
  }, []);

  const serverDisplayName = getServerDisplayName(selectedServer);

  return (
    <div className="px-6 py-6 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left Panel: Configuration */}
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Fixed Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 space-y-2">
            {/* Config Type Dropdown as Title */}
            <Select value={selectedOptionId} onValueChange={setSelectedOptionId}>
              <SelectTrigger id="config-type" className={cn('text-base font-semibold text-gray-900 dark:text-white')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {configOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id} disabled={!option.isSupported}>
                    {option.label}
                    {!option.isSupported && ' (Not supported)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Description */}
            {selectedServer.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{selectedServer.description}</p>
            )}

            {/* Repository Link */}
            {selectedServer.repositoryUrl && (
              <a
                href={selectedServer.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                View Repository
              </a>
            )}
          </div>

          {/* Scrollable Form Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {/* Section Header */}
            <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Server Configuration</h4>
            </div>

            {/* Server Name Input - Always visible */}
            <div className="space-y-1.5">
              <Label htmlFor="custom-name">Server Name</Label>
              <Input
                id="custom-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={serverDisplayName}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Give this server configuration a meaningful name
              </p>
            </div>

            {/* Dynamic Configuration Fields */}
            {fields.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">No additional configuration needed</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">You can test this server directly</p>
              </div>
            ) : (
              fields.map((field) => (
                <ConfigFieldInput
                  key={field.name}
                  field={field}
                  value={field.value || ''}
                  onChange={(value) => handleFieldChange(field.name, value)}
                />
              ))
            )}
          </div>

          {/* Fixed Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 space-y-3">
            {/* Test Server Split Button */}
            <SplitButton
              primaryLabel={
                testStatus === 'running' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Server'
                )
              }
              onPrimaryAction={handleTestServer}
              primaryDisabled={!isFormValid || testStatus === 'running'}
              dropdownContent={
                <DropdownMenuRadioGroup value={selectedRuntimeId} onValueChange={setSelectedRuntimeId}>
                  {runtimes.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">No runtimes available</div>
                  ) : (
                    runtimes.map((runtime) => (
                      <DropdownMenuRadioItem key={runtime.id} value={runtime.id} disabled={runtime.status !== 'ACTIVE'}>
                        {runtime.name}
                        {runtime.id === defaultRuntimeId && ' (Default)'}
                        {runtime.status !== 'ACTIVE' && ' (Offline)'}
                      </DropdownMenuRadioItem>
                    ))
                  )}
                </DropdownMenuRadioGroup>
              }
              dropdownAriaLabel="Select runtime"
              className="w-full"
            />

            {/* Validation Alert */}
            {!isFormValid && selectedOption && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">Please fill all required fields before testing</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Right Panel: Test Area */}
        <div className="h-full min-h-[400px] lg:min-h-0">
          <TestPanel
            status={testStatus}
            serverName={customName || serverDisplayName}
            tools={discoveredTools}
            error={testError}
            onRetry={handleRetry}
            onConfigureAnother={testStatus === 'success' ? onBack : undefined}
            onFinish={testStatus === 'success' && onSuccess ? onSuccess : undefined}
          />
        </div>
      </div>
    </div>
  );
}
