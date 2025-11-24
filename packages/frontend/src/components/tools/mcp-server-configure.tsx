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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { TestPanel, type TestStatus, type LifecycleStage } from './test-panel';
import { ConfigEditor } from '@/components/sources/config-editor';
import {
  extractConfigOptions,
  extractConfigurableFields,
  enrichConfigWithValues,
  getServerDisplayName,
  validateFields,
  type ConfigField,
} from '@/lib/mcpConfigHelpers';
import {
  TestMcpServerDocument,
  SubscribeMcpServerTestProgressDocument,
  McpLifecycleStage,
  CreateMcpServerDocument,
  type McpTransportType,
} from '@/graphql/generated/graphql';
import type { GetRegistryServersQuery } from '@/graphql/generated/graphql';

// Extract server type
type MCPRegistryServer = GetRegistryServersQuery['getRegistryServers'][number];

interface MCPServerConfigureProps {
  selectedServer: MCPRegistryServer;
  onBack: () => void;
  onSuccess?: () => void;
}

// Convert GraphQL enum to component type
function toLifecycleStage(stage: McpLifecycleStage): LifecycleStage {
  switch (stage) {
    case McpLifecycleStage.Installing:
      return 'INSTALLING';
    case McpLifecycleStage.Starting:
      return 'STARTING';
    case McpLifecycleStage.ListingTools:
      return 'LISTING_TOOLS';
    default:
      return null;
  }
}

export function MCPServerConfigure({ selectedServer, onBack, onSuccess }: MCPServerConfigureProps) {
  const workspaceId = useWorkspaceId();

  // Config state
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [fields, setFields] = useState<ConfigField[]>([]);
  const [customName, setCustomName] = useState<string>('');

  // Test state
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testSessionId, setTestSessionId] = useState<string>('');
  const [discoveredTools, setDiscoveredTools] = useState<Array<{ id: string; name: string }>>([]);
  const [testError, setTestError] = useState<string>('');
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>(null);
  const [lifecycleMessage, setLifecycleMessage] = useState<string>('');

  // Store pending server config for creation after successful test
  const pendingServerConfigRef = useRef<{
    name: string;
    description: string;
    repositoryUrl: string;
    transport: McpTransportType;
    config: string;
  } | null>(null);

  // GraphQL mutations
  const [testServer] = useMutation(TestMcpServerDocument);
  const [createServer] = useMutation(CreateMcpServerDocument);

  // Subscribe to lifecycle events during testing
  useSubscription(SubscribeMcpServerTestProgressDocument, {
    variables: { testSessionId },
    skip: !testSessionId,
    onData: async ({ data }) => {
      const event = data?.data?.mcpServerTestProgress;
      if (event) {
        setLifecycleStage(toLifecycleStage(event.stage));
        setLifecycleMessage(event.message);

        if (event.stage === McpLifecycleStage.Completed) {
          setDiscoveredTools(event.tools?.map((t) => ({ id: t.id, name: t.name })) || []);
          setTestSessionId(''); // Clear to stop subscription

          // Persist the server to database on successful test
          const pendingConfig = pendingServerConfigRef.current;
          if (pendingConfig && workspaceId) {
            try {
              await createServer({
                variables: {
                  workspaceId,
                  name: pendingConfig.name,
                  description: pendingConfig.description,
                  repositoryUrl: pendingConfig.repositoryUrl,
                  transport: pendingConfig.transport,
                  config: pendingConfig.config,
                  registryServerId: selectedServer.id,
                },
                refetchQueries: ['GetRegistryServers', 'SubscribeMCPServers'],
              });
              pendingServerConfigRef.current = null;
              setTestStatus('success');
            } catch (err) {
              console.error('Failed to create server:', err);
              setTestError(err instanceof Error ? err.message : 'Failed to save server');
              setTestStatus('error');
            }
          } else {
            setTestStatus('success');
          }
        } else if (event.stage === McpLifecycleStage.Failed) {
          setTestError(event.error?.message || event.message);
          setTestStatus('error');
          setTestSessionId(''); // Clear to stop subscription
          pendingServerConfigRef.current = null;
        }
      }
    },
    onError: (err) => {
      console.error('Subscription error:', err);
      setTestError(err.message);
      setTestStatus('error');
      setTestSessionId('');
      pendingServerConfigRef.current = null;
    },
  });

  // Extract config options from server
  const configOptions = useMemo(() => {
    return extractConfigOptions(selectedServer);
  }, [selectedServer]);

  // Get selected config option
  const selectedOption = useMemo(() => {
    return configOptions.find((opt) => opt.id === selectedOptionId);
  }, [configOptions, selectedOptionId]);

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
      const displayName = getServerDisplayName(selectedServer);
      // Strip namespace (anything before the /)
      const nameWithoutNamespace = displayName.includes('/')
        ? displayName.split('/').pop() || displayName
        : displayName;
      setCustomName(nameWithoutNamespace);
    }
  }, [selectedServer, customName]);

  // Handle field value change
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.name === fieldName ? { ...f, value } : f)));
  }, []);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!selectedOption) return false;
    if (!customName || customName.trim() === '') return false;
    return validateFields(fields);
  }, [selectedOption, customName, fields]);

  // Handle test server
  const handleTestServer = useCallback(async () => {
    if (!workspaceId || !selectedOption) return;

    setTestStatus('running');
    setTestError('');
    setDiscoveredTools([]);
    setLifecycleStage(null);
    setLifecycleMessage('');

    try {
      // Enrich config with user-provided values
      const input = enrichConfigWithValues(selectedServer, selectedOption, fields, customName);

      // Store config for creating server after successful test
      pendingServerConfigRef.current = {
        name: input.name,
        description: input.description,
        repositoryUrl: input.repositoryUrl,
        transport: input.transport,
        config: input.config,
      };

      // Call test mutation - returns testSessionId immediately
      const { data } = await testServer({
        variables: {
          workspaceId,
          name: input.name,
          repositoryUrl: input.repositoryUrl,
          transport: input.transport,
          config: input.config,
        },
      });

      const sessionId = data?.testMCPServer?.testSessionId;
      if (!sessionId) {
        pendingServerConfigRef.current = null;
        throw new Error(data?.testMCPServer?.error || 'Failed to start test');
      }

      // Set testSessionId to activate subscription
      setTestSessionId(sessionId);
      // Subscription will handle all lifecycle updates and server creation
    } catch (err) {
      console.error('Test failed:', err);
      setTestError(err instanceof Error ? err.message : 'Unknown error');
      setTestStatus('error');
      pendingServerConfigRef.current = null;
    }
  }, [workspaceId, selectedOption, selectedServer, fields, customName, testServer]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setTestStatus('idle');
    setTestSessionId('');
    setDiscoveredTools([]);
    setTestError('');
    setLifecycleStage(null);
    setLifecycleMessage('');
    pendingServerConfigRef.current = null;
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
            <ConfigEditor
              fields={fields}
              onFieldChange={handleFieldChange}
              emptyMessage="No additional configuration needed"
            />
          </div>

          {/* Fixed Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 space-y-3">
            {/* Test Server Button */}
            <Button
              onClick={handleTestServer}
              disabled={!isFormValid || testStatus === 'running'}
              className="w-full"
            >
              {testStatus === 'running' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Server'
              )}
            </Button>

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
            lifecycleStage={lifecycleStage}
            lifecycleMessage={lifecycleMessage}
            onRetry={handleRetry}
            onConfigureAnother={testStatus === 'success' ? onBack : undefined}
            onFinish={testStatus === 'success' && onSuccess ? onSuccess : undefined}
          />
        </div>
      </div>
    </div>
  );
}
