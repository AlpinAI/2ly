/**
 * AIProvidersSection Component
 *
 * WHY: Manage AI provider configurations for the workspace (BYOK - Bring Your Own Key)
 *
 * WHAT IT SHOWS:
 * - List of available AI providers (OpenAI, Anthropic, Google, Ollama)
 * - Configuration status for each provider
 * - Active provider indicator
 * - Configure, activate, and remove provider actions
 * - Test provider functionality
 */

import { useState } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Trash2, Play, Settings2 } from 'lucide-react';
import { SettingsSection } from './settings-section';
import { ConfigureAIProviderDialog } from './configure-ai-provider-dialog';
import { useAIProviders, PROVIDER_INFO } from '@/hooks/useAIProviders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [testingProvider, setTestingProvider] = useState<AiProviderType | null>(null);
  const { toast } = useNotification();

  const {
    providers,
    loading,
    configureProvider,
    setActiveProvider,
    removeProvider,
    testProvider,
    settingActive,
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

  const handleSetActive = async (provider: AiProviderType) => {
    try {
      await setActiveProvider(provider);
      toast({ description: `${PROVIDER_INFO[provider].name} is now the active provider`, variant: 'success' });
    } catch (_error) {
      toast({ description: 'Failed to set active provider', variant: 'error' });
    }
  };

  const handleRemove = async (provider: AiProviderType) => {
    const providerInfo = PROVIDER_INFO[provider];
    if (!confirm(`Are you sure you want to remove ${providerInfo.name} configuration?`)) {
      return;
    }

    try {
      await removeProvider(provider);
      toast({ description: `${providerInfo.name} configuration removed`, variant: 'success' });
    } catch (_error) {
      toast({ description: 'Failed to remove provider', variant: 'error' });
    }
  };

  const handleTest = async (provider: AiProviderType) => {
    setTestingProvider(provider);
    try {
      const result = await testProvider(provider, 'Say "Hello, I am working!" in exactly 5 words.');
      if (result) {
        toast({ description: `Test response: ${result}`, variant: 'success' });
      }
    } catch (_error) {
      toast({ description: 'Test failed', variant: 'error' });
    } finally {
      setTestingProvider(null);
    }
  };

  const configuredCount = providers.filter((p) => p.isConfigured).length;

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
              const isConfigured = config?.isConfigured;
              const isActive = config?.isActive;
              const isTesting = testingProvider === providerType;

              return (
                <div
                  key={providerType}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isActive
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
                        {isActive && (
                          <Badge variant="success" className="text-xs">
                            Active
                          </Badge>
                        )}
                        {isConfigured && !isActive && (
                          <Badge variant="default" className="text-xs">
                            Configured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{info.description}</p>
                      {isConfigured && config?.defaultModel && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Default model: {config.defaultModel}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isConfigured ? (
                      <>
                        {/* Test button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTest(providerType)}
                          disabled={isTesting}
                          className="text-gray-600 dark:text-gray-400"
                        >
                          <Play className={`h-4 w-4 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                          {isTesting ? 'Testing...' : 'Test'}
                        </Button>

                        {/* Set Active button - only show if not already active */}
                        {!isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetActive(providerType)}
                            disabled={settingActive}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Set Active
                          </Button>
                        )}

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
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                About AI Providers
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                API keys are encrypted and stored securely. You can use cloud providers (OpenAI, Anthropic, Google)
                with your own API keys, or run Ollama locally for free, open-source models.
              </p>
            </div>
          </div>
        </div>
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
