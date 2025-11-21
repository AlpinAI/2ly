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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/ui/code-block';
import { useConnectToolsetDialogNew } from '@/stores/uiStore';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useSystemInit } from '@/hooks/useSystemInit';
import { GetToolsetKeyDocument, GetKeyValueDocument } from '@/graphql/generated/graphql';
import { CONNECTION_OPTIONS, type PlatformOption } from './connection-options';
import { N8NInstructionsNew } from './instructions-new/n8n-instructions-new';
import { LangflowInstructionsNew } from './instructions-new/langflow-instructions-new';
import { LangchainInstructionsNew } from './instructions-new/langchain-instructions-new';
import { JSONInstructionsNew } from './instructions-new/json-instructions-new';

export type ConnectionTab = 'stream' | 'sse' | 'stdio';

// Platform to tab mapping
const PLATFORM_TAB_MAP: Record<PlatformOption, ConnectionTab> = {
  n8n: 'stream',
  langflow: 'sse',
  langchain: 'stdio',
  json: 'stdio',
};

export function ConnectToolsetDialogNew() {
  const { open, setOpen, selectedToolsetName, selectedToolsetId } = useConnectToolsetDialogNew();
  const { runtimes } = useRuntimeData();
  const { infra } = useSystemInit();

  const [selectedTab, setSelectedTab] = useState<ConnectionTab>('stream');
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
  const stdioConfig = JSON.stringify(
    {
      command: 'npx',
      args: ['-y', '@2ly/runtime'],
      env: { TOOLSET_KEY: toolsetKey || '<toolset_key>' },
    },
    null,
    2
  );

  // Handle platform card click - auto-select tab
  const handlePlatformClick = useCallback((platform: PlatformOption) => {
    setSelectedPlatform(platform);
    setSelectedTab(PLATFORM_TAB_MAP[platform]);
  }, []);

  // Handle dialog close
  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setSelectedTab('stream');
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
            {/* Settings Section with Tabs */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Generic settings</h3>
              <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as ConnectionTab)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="stream">STREAM</TabsTrigger>
                  <TabsTrigger value="sse">SSE</TabsTrigger>
                  <TabsTrigger value="stdio">STDIO</TabsTrigger>
                </TabsList>
                <TabsContent value="stream">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Unique URL to connect to this toolset using streamable-http transport</p>
                  <CodeBlock code={streamUrl} language="bash" size="small" />
                </TabsContent>
                <TabsContent value="sse">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Unique URL to connect to this toolset using SSE transport</p>
                  <CodeBlock code={sseUrl} language="bash" size="small" />
                </TabsContent>
                <TabsContent value="stdio">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Unique STDIO configuration to connect to this toolset</p>
                  <CodeBlock code={stdioConfig} language="json" size="small" />
                </TabsContent>
              </Tabs>
            </div>

            {/* Platform Cards */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Select Platform</h3>
              <div className="grid grid-cols-4 gap-3">
                {CONNECTION_OPTIONS.map((option) => {
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
                  {selectedPlatform === 'n8n' && <N8NInstructionsNew />}
                  {selectedPlatform === 'langflow' && <LangflowInstructionsNew />}
                  {selectedPlatform === 'langchain' && <LangchainInstructionsNew toolsetKey={toolsetKey} />}
                  {selectedPlatform === 'json' && <JSONInstructionsNew />}
                </>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Select a platform above to see detailed instructions
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
