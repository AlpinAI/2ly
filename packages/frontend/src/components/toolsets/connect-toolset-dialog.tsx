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
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@apollo/client/react';
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
import { useSystemInit } from '@/hooks/useSystemInit';
import { GetToolsetKeyDocument, GetKeyValueDocument } from '@/graphql/generated/graphql';
import { CONNECTION_OPTIONS, type PlatformOption } from './connection-options';
import { LangchainInstructions } from './instructions/langchain-instructions';
import { LangflowInstructions } from './instructions/langflow-instructions';
import { N8NInstructions } from './instructions/n8n-instructions';
import { JSONInstructions } from './instructions/json-instructions';

export function ConnectToolsetDialog() {
  const { open, setOpen, selectedToolsetName, selectedToolsetId } = useConnectToolsetDialog();
  const { runtimes } = useRuntimeData();
  const { infra } = useSystemInit();

  console.log('infra', infra);

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption>('langchain');
  const [isConnected, setIsConnected] = useState(false);

  // Fetch toolset key metadata
  const { data: keyData } = useQuery(GetToolsetKeyDocument, {
    variables: { toolsetId: selectedToolsetId ?? '' },
    skip: !selectedToolsetId || !open,
  });

  // Fetch actual key value once we have the ID
  const keyId = keyData?.toolsetKey?.id;
  const { data: valueData } = useQuery(GetKeyValueDocument, {
    variables: { keyId: keyId ?? '' },
    skip: !keyId,
  });

  const toolsetKey = valueData?.keyValue || '';

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

  // Get NATS server URL from infra config, fallback to hostname-based default
  const natsServer = useMemo(() => {
    return infra?.nats ?? `${window.location.hostname}:4222`;
  }, [infra]);

  const remoteMCPServer = useMemo(() => {
    return infra?.remoteMCP ?? '${window.location.hostname}:3001'
  }, [infra]);
  console.log('remoteMCPServer', remoteMCPServer);

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
                  toolsetKey={toolsetKey || 'Loading key...'}
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
                  toolsetKey={toolsetKey || 'Loading key...'}
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
