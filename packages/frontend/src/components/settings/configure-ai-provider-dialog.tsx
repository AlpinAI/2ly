/**
 * ConfigureAIProviderDialog Component
 *
 * Dialog for configuring an AI provider with API key and settings.
 * Tests configuration before persisting and auto-closes on success.
 */

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/contexts/NotificationContext';
import { X, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { AiProviderType, type AiProviderConfig } from '@/graphql/generated/graphql';
import { PROVIDER_INFO } from '@/hooks/useAIProviders';

interface ConfigureAIProviderDialogProps {
  provider: AiProviderType;
  existingConfig?: AiProviderConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigure: (
    provider: AiProviderType,
    apiKey?: string,
    baseUrl?: string,
    defaultModel?: string
  ) => Promise<{ valid: boolean; error?: string | null; availableModels?: string[] | null } | null | undefined>;
}

export function ConfigureAIProviderDialog({
  provider,
  existingConfig,
  open,
  onOpenChange,
  onConfigure,
}: ConfigureAIProviderDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    error?: string | null;
    availableModels?: string[] | null;
  } | null>(null);
  const { toast } = useNotification();

  const providerInfo = PROVIDER_INFO[provider];
  const isOllama = provider === AiProviderType.Ollama;

  // Reset state when dialog opens with new provider
  useEffect(() => {
    if (open) {
      setApiKey('');
      setBaseUrl(existingConfig?.baseUrl || (isOllama ? 'http://localhost:11434/api' : ''));
      setShowApiKey(false);
      setResult(null);
    }
  }, [open, provider, existingConfig, isOllama]);

  const handleClose = () => {
    setApiKey('');
    setBaseUrl('');
    setShowApiKey(false);
    setResult(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (providerInfo.requiresKey && !apiKey.trim()) {
      toast({ description: 'Please enter an API key', variant: 'error' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const configResult = await onConfigure(
        provider,
        apiKey.trim() || undefined,
        baseUrl.trim() || undefined,
        undefined
      );

      if (configResult?.valid) {
        setResult(configResult);
        toast({ description: `${providerInfo.name} configured successfully`, variant: 'success' });
        handleClose();
      } else {
        setResult({ valid: false, error: configResult?.error || 'Configuration failed' });
        toast({ description: configResult?.error || 'Configuration failed', variant: 'error' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Configuration failed';
      setResult({ valid: false, error: message });
      toast({ description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white shadow-lg p-0 dark:border-gray-700 dark:bg-gray-800 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">{providerInfo.icon}</span>
                Configure {providerInfo.name}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400">
              {existingConfig !== undefined
                ? `Update your ${providerInfo.name} configuration`
                : `Enter your ${providerInfo.name} credentials to enable this provider`}
            </Dialog.Description>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* API Key field - only for cloud providers */}
              {providerInfo.requiresKey && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">
                    API Key <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder={existingConfig !== undefined ? '••••••••••••••••' : 'Enter your API key'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {existingConfig !== undefined
                      ? 'Leave empty to keep the existing key, or enter a new one to update'
                      : 'Your API key will be encrypted and stored securely'}
                  </p>
                </div>
              )}

              {/* Base URL field - only for Ollama */}
              {isOllama && (
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">
                    Ollama URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="baseUrl"
                    type="url"
                    placeholder="http://localhost:11434/api"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Run local models for free. Enter the URL where your Ollama instance is running.
                  </p>
                </div>
              )}

              {/* Result display */}
              {result && (
                <div
                  className={`rounded-lg p-4 ${
                    result.valid
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex gap-3">
                    {result.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <div className="text-sm flex-1">
                      <p
                        className={`font-medium mb-1 ${
                          result.valid
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}
                      >
                        {result.valid ? 'Configuration Saved' : 'Validation Failed'}
                      </p>
                      {result.valid && result.availableModels && result.availableModels.length > 0 && (
                        <p className="text-green-700 dark:text-green-300">
                          {result.availableModels.length} model(s) available:{' '}
                          {result.availableModels.slice(0, 3).join(', ')}
                          {result.availableModels.length > 3 && ` and ${result.availableModels.length - 3} more`}
                        </p>
                      )}
                      {!result.valid && result.error && (
                        <p className="text-red-700 dark:text-red-300">{result.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : existingConfig !== undefined ? (
                'Update Configuration'
              ) : (
                'Configure'
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
