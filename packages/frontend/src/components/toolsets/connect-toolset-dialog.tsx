/**
 * Connect Toolset Dialog (New Design)
 *
 * WHY: Redesigned connect dialog with improved UX featuring:
 * - Header with toolset name + close button (no status labels)
 * - Settings tabs for STREAM, SSE, STDIO connection types
 * - Platform cards (N8N, Langflow, Langchain, JSON) with auto-tab selection
 * - Instruction area with image placeholder and detailed steps
 * - Footer with docs link
 */

import { useState, useMemo, useCallback } from 'react';
import { X, ExternalLink } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@apollo/client/react';
import { Button } from '@/components/ui/button';
import { useConnectToolsetDialog } from '@/stores/uiStore';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useSystemInit } from '@/hooks/useSystemInit';
import { GetToolsetKeyDocument, GetKeyValueDocument } from '@/graphql/generated/graphql';
import { CONNECTION_OPTIONS, type PlatformOption } from './connection-options';
import { N8NInstructions } from './instructions/n8n-instructions';
import { LangflowInstructions } from './instructions/langflow-instructions';
import { LangchainInstructions } from './instructions/langchain-instructions';
import { ManualConnectionInstructions } from './instructions/manual-connection-instructions';

export function ConnectToolsetDialog() {
  const { open, setOpen, selectedToolsetName, selectedToolsetId } = useConnectToolsetDialog();
  const { runtimes } = useRuntimeData();
  const { infra } = useSystemInit();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption | null>(null);

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
    const existingRuntime = runtimes.find((runtime) => runtime.name === selectedToolsetName);
    if (existingRuntime) return existingRuntime;

    if (selectedToolsetName) {
      return {
        id: `new-${selectedToolsetName}`,
        name: selectedToolsetName,
        status: 'INACTIVE' as const,
      };
    }

    return null;
  }, [runtimes, selectedToolsetName]);

  const remoteMCPServer = useMemo(() => {
    return infra?.remoteMCP || `${window.location.protocol}//${window.location.hostname}:3001`;
  }, [infra]);

  // Connection URLs
  const streamUrl = `${remoteMCPServer}/mcp?key=${toolsetKey || '<toolset_key>'}`;
  const sseUrl = `${remoteMCPServer}/sse?key=${toolsetKey || '<toolset_key>'}`;

  // Handle platform card click
  const handlePlatformClick = useCallback((platform: PlatformOption) => {
    setSelectedPlatform(platform);
  }, []);

  // Handle dialog close
  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setSelectedPlatform(null);
    }, 300);
  }, [setOpen]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!selectedToolset) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-3xl translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                Connect: <span className="font-mono">{selectedToolset.name}</span>
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="overflow-y-auto flex-1 min-h-0">


            {/* Platform Cards */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Select Platform</h3>
              <div className="grid grid-cols-3 gap-3">
                {CONNECTION_OPTIONS.filter((option) => !option.disabled).map((option) => {
                  const Icon = option.Icon;
                  const isSelected = selectedPlatform === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handlePlatformClick(option.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`h-8 w-8 mb-2 ${isSelected ? 'text-blue-500' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {option.title.split('/')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instructions Area */}
            <div className="p-6">
              {selectedPlatform ? (
                <>
                  {selectedPlatform === 'n8n' && <N8NInstructions streamUrl={streamUrl} />}
                  {selectedPlatform === 'langflow' && <LangflowInstructions sseUrl={sseUrl} toolsetName={selectedToolset.name} />}
                  {selectedPlatform === 'langchain' && <LangchainInstructions toolsetKey={toolsetKey} />}
                  {selectedPlatform === 'json' && (
                    <ManualConnectionInstructions
                      streamUrl={streamUrl}
                      sseUrl={sseUrl}
                      toolsetKey={toolsetKey}
                    />
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  How do you want to connect to your toolset?
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <a
              href="https://docs.2ly.ai/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View full documentation
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
