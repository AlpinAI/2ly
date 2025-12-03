/**
 * AIProvidersSection Component
 *
 * Manage AI provider configurations for the workspace (BYOK - Bring Your Own Key).
 * Includes a minimal tester UI to test configured models.
 */

import { useState, useEffect } from 'react';
import { Sparkles, Trash2, Settings2, Send, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

  // Inner tab state
  const [activeTab, setActiveTab] = useState<'configuration' | 'testing'>('configuration');

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
  const hasProviders = configuredCount > 0;

  // Auto-switch to configuration tab if no providers configured
  useEffect(() => {
    if (!hasProviders && activeTab === 'testing') {
      setActiveTab('configuration');
    }
  }, [hasProviders, activeTab]);

  return (
    <SettingsSection
      title="AI Providers"
      description="Configure AI providers for your workspace. Bring your own API keys (BYOK) for cloud providers or use Ollama for local models."
      icon={Sparkles}
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'configuration' | 'testing')}>
        {/* Underline-style inner tabs */}
        <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none p-0 h-auto mb-4">
          <TabsTrigger
            value="configuration"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-4 py-2 text-sm"
          >
            Configuration
          </TabsTrigger>
          <TabsTrigger
            value="testing"
            disabled={!hasProviders}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="mt-0">
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

          </div>
        </TabsContent>

        <TabsContent value="testing" className="mt-0">
          {allModels.length > 0 ? (
            <div className="space-y-4">
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              No models available. Configure a provider first.
            </div>
          )}
        </TabsContent>
      </Tabs>

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
