/**
 * AIProvidersSection Component
 *
 * Manage AI provider configurations for the workspace (BYOK - Bring Your Own Key).
 * Includes a minimal tester UI to test configured models.
 */

import { useState } from 'react';
import { Sparkles, AlertCircle, Trash2, Settings2, Send, Loader2 } from 'lucide-react';
import { SettingsSection } from './settings-section';
import { ConfigureAIProviderDialog } from './configure-ai-provider-dialog';
import { useAIProviders, PROVIDER_INFO } from '@/hooks/useAIProviders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AiProviderType, type AiProviderConfig } from '@/graphql/generated/graphql';
import { useNotification } from '@/contexts/NotificationContext';

// All supported providers
const ALL_PROVIDERS = [
  AiProviderType.Openai,
  AiProviderType.Anthropic,
  AiProviderType.Google,
  AiProviderType.Ollama,
];

export function AIProvidersSection() {
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProviderType | null>(null);
  const { toast } = useNotification();

  // Tester state
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState<string | null>(null);

  const {
    providers,
    allModels,
    loading,
    configureProvider,
    removeProvider,
    chatWithModel,
    chatting,
    removing,
  } = useAIProviders();

  // Create a map of provider configs by provider type
  const providerConfigMap = providers.reduce(
    (acc, config) => {
      acc[config.provider] = config;
      return acc;
    },
    {} as Record<AiProviderType, AiProviderConfig>
  );

  const handleOpenConfigureDialog = (provider: AiProviderType) => {
    setSelectedProvider(provider);
    setConfigureDialogOpen(true);
  };

  const handleRemove = async (provider: AiProviderType) => {
    const config = providerConfigMap[provider];
    if (!config) return;

    const providerInfo = PROVIDER_INFO[provider];
    if (!confirm(`Are you sure you want to remove ${providerInfo.name} configuration?`)) {
      return;
    }

    try {
      await removeProvider(config.id);
      toast({ description: `${providerInfo.name} configuration removed`, variant: 'success' });
    } catch (_error) {
      toast({ description: 'Failed to remove provider', variant: 'error' });
    }
  };

  const handleTestChat = async () => {
    if (!selectedModel || !testMessage.trim()) return;

    setTestResponse(null);
    try {
      const response = await chatWithModel(selectedModel, testMessage.trim());
      setTestResponse(response || 'No response received');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chat failed';
      toast({ description: message, variant: 'error' });
      setTestResponse(null);
    }
  };

  const configuredCount = providers.length;

  return (
    <SettingsSection
      title="AI Providers"
      description="Configure AI providers for your workspace. Bring your own API keys (BYOK) for cloud providers or use Ollama for local models."
      icon={Sparkles}
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {configuredCount} of {ALL_PROVIDERS.length} providers configured
          </p>
        </div>

        {/* Providers List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading providers...</div>
        ) : (
          <div className="space-y-3">
            {ALL_PROVIDERS.map((providerType) => {
              const config = providerConfigMap[providerType];
              const info = PROVIDER_INFO[providerType];
              const isConfigured = config !== undefined;

              return (
                <div
                  key={providerType}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isConfigured
                      ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  {/* Provider Info */}
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{info.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{info.name}</h4>
                        {isConfigured && (
                          <Badge variant="success" className="text-xs">
                            Configured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{info.description}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isConfigured ? (
                      <>
                        {/* Configure button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenConfigureDialog(providerType)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>

                        {/* Remove button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(providerType)}
                          disabled={removing}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => handleOpenConfigureDialog(providerType)}>
                        Configure
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">About AI Providers</p>
              <p className="text-blue-700 dark:text-blue-300">
                API keys are encrypted and stored securely. You can use cloud providers (OpenAI, Anthropic, Google)
                with your own API keys, or run Ollama locally for free, open-source models.
              </p>
            </div>
          </div>
        </div>

        {/* AI Tester Section */}
        {configuredCount > 0 && allModels.length > 0 && (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Test AI
            </h4>

            <div className="space-y-3">
              {/* Model Selector */}
              <div className="space-y-1">
                <Label htmlFor="test-model" className="text-sm">
                  Model
                </Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="test-model" className="w-full bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Select a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message Input */}
              <div className="space-y-1">
                <Label htmlFor="test-message" className="text-sm">
                  Message
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="test-message"
                    placeholder="Type your test message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTestChat();
                      }
                    }}
                    className="bg-white dark:bg-gray-800"
                    disabled={chatting}
                  />
                  <Button onClick={handleTestChat} disabled={!selectedModel || !testMessage.trim() || chatting}>
                    {chatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Response Output */}
              {testResponse && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Response:</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{testResponse}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Configure Dialog */}
      {selectedProvider && (
        <ConfigureAIProviderDialog
          provider={selectedProvider}
          existingConfig={providerConfigMap[selectedProvider]}
          open={configureDialogOpen}
          onOpenChange={setConfigureDialogOpen}
          onConfigure={configureProvider}
        />
      )}
    </SettingsSection>
  );
}
