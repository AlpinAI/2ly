/**
 * Connect Toolset Dialog Component
 *
 * WHY: Provides platform-specific instructions for connecting toolsets to 2LY.
 * Users can select their platform (Langchain, Langflow, N8N, JSON) and see
 * tailored connection instructions with code examples.
 *
 * FEATURES:
 * - Platform selection via Radix Select
 * - Dynamic instructions based on selected platform
 * - Real-time connection detection (shows when toolset connects)
 * - Code snippets with copy functionality
 * - Toolset name pre-filled in all examples
 *
 * USAGE:
 * ```tsx
 * const { setOpen, setSelectedToolsetName } = useConnectToolsetDialog();
 *
 * // Open dialog for specific toolset
 * setSelectedToolsetName(toolset.name);
 * setOpen(true);
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, CheckCircle2, Loader2, Copy, Key, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useConnectToolsetDialog } from '@/stores/uiStore';
import { useRuntimeData } from '@/stores/runtimeStore';
import { CONNECTION_OPTIONS, type PlatformOption } from './connection-options';
import { LangchainInstructions } from './instructions/langchain-instructions';
import { LangflowInstructions } from './instructions/langflow-instructions';
import { N8NInstructions } from './instructions/n8n-instructions';
import { JSONInstructions } from './instructions/json-instructions';
import { useQuery } from '@apollo/client/react';
import { GetToolsetKeyDocument } from '@/graphql/generated/graphql';
import { useNotification } from '@/contexts/NotificationContext';

export function ConnectToolsetDialog() {
  const { open, setOpen, selectedToolsetName, selectedToolsetId } = useConnectToolsetDialog();
  const { runtimes } = useRuntimeData();
  const { toast } = useNotification();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption>('langchain');
  const [isConnected, setIsConnected] = useState(false);

  // Fetch toolset key
  const { data: keyData, loading: keyLoading } = useQuery(GetToolsetKeyDocument, {
    variables: { toolsetId: selectedToolsetId || '' },
    skip: !selectedToolsetId || !open,
  });

  const toolsetKey = keyData?.toolsetKey?.key;

  const handleCopyKey = () => {
    if (toolsetKey) {
      navigator.clipboard.writeText(toolsetKey);
      toast({ description: 'Toolset key copied to clipboard', variant: 'success' });
    }
  };

  // Get selected toolset from runtime store, or create a mock one for new toolsets
  const selectedToolset = useMemo(() => {
    // Try to find existing runtime first
    const existingRuntime = runtimes.find((runtime) => runtime.name === selectedToolsetName);
    if (existingRuntime) return existingRuntime;

    // If selectedToolsetName is provided but no runtime found, treat it as a name for a new toolset
    if (selectedToolsetName) {
      return {
        id: `new-${selectedToolsetName}`,
        name: selectedToolsetName,
        status: 'INACTIVE' as const,
      };
    }

    return null;
  }, [runtimes, selectedToolsetName]);

  // Get NATS server URL
  // WHY: Use window.location.hostname as default since NATS typically runs on same host
  const natsServer = useMemo(() => {
    return `${window.location.hostname}:4222`;
  }, []);

  // Real-time connection detection
  // WHY: Watch for new runtimes with matching name and show feedback
  useEffect(() => {
    if (!open || !selectedToolset) return;

    const checkForConnection = () => {
      const matchingRuntime = runtimes.find(
        (runtime) =>
          runtime.name === selectedToolset.name &&
          runtime.status === 'ACTIVE'
      );

      if (matchingRuntime && !isConnected) {
        setIsConnected(true);
      }
    };

    // Check immediately and on runtime changes
    checkForConnection();
  }, [runtimes, selectedToolset, open, isConnected]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    setOpen(false);
    // Reset state after animation completes
    setTimeout(() => {
      setSelectedPlatform('langchain');
      setIsConnected(false);
    }, 300);
  }, [setOpen]);

  // Handle open change from Radix
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Don't render if no toolset selected
  if (!selectedToolset) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  Connect Toolset to 2LY
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Toolset: <span className="font-mono font-medium">{selectedToolset.name}</span>
                </Dialog.Description>
              </div>

              {/* Connection Status Badge */}
              {isConnected && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 animate-in fade-in zoom-in mr-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected!</span>
                </div>
              )}

              {!isConnected && open && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mr-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Waiting...</span>
                </div>
              )}

              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>

            {/* Toolset Key Display */}
            {keyLoading ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading toolset key...
                </div>
              </div>
            ) : toolsetKey ? (
              <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cyan-900 dark:text-cyan-100 mb-2">
                      Toolset Authentication Key
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-cyan-200 dark:border-cyan-800 rounded text-xs font-mono text-cyan-900 dark:text-cyan-100 truncate">
                        {toolsetKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyKey}
                        className="flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-2">
                      Use this key to authenticate your toolset connection
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedToolsetId ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      No Key Found
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      This toolset doesn't have an authentication key yet.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Platform Selector */}
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                Select Platform
              </label>
              <Select value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as PlatformOption)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONNECTION_OPTIONS.map((option) => {
                    const Icon = option.Icon;
                    return (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{option.title}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">
            {/* Instructions based on selected platform */}
            <div>
              {selectedPlatform === 'langchain' && (
                <LangchainInstructions
                  agentName={selectedToolset.name}
                  natsServer={natsServer}
                />
              )}
              {selectedPlatform === 'langflow' && (
                <LangflowInstructions
                  agentName={selectedToolset.name}
                  natsServer={natsServer}
                />
              )}
              {selectedPlatform === 'n8n' && (
                <N8NInstructions agentName={selectedToolset.name} />
              )}
              {selectedPlatform === 'json' && (
                <JSONInstructions
                  agentName={selectedToolset.name}
                  natsServer={natsServer}
                />
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
