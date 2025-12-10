/**
 * OAuthProvidersSection Component
 *
 * Manage OAuth provider integrations for the workspace.
 * Allows configuring B2B OAuth connections to Google, Microsoft, and Notion.
 */

import { useState } from 'react';
import { Link2, Trash2, Settings2, ToggleLeft, ToggleRight } from 'lucide-react';
import { SettingsSection } from './settings-section';
import { ConfigureOAuthProviderDialog } from './configure-oauth-provider-dialog';
import { useOAuthProviders, OAUTH_PROVIDER_INFO } from '@/hooks/useOAuthProviders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OAuthProviderType, type OAuthProviderConfig } from '@/graphql/generated/graphql';
import { useNotification } from '@/contexts/NotificationContext';

// All supported OAuth providers
const ALL_PROVIDERS = [
  OAuthProviderType.Google,
  OAuthProviderType.Microsoft,
  OAuthProviderType.Notion,
];

export function OAuthProvidersSection() {
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<OAuthProviderType | null>(null);
  const { toast } = useNotification();

  const {
    providers,
    loading,
    configureProvider,
    updateEnabled,
    removeProvider,
    removing,
    updating,
  } = useOAuthProviders();

  // Create a map of provider configs by provider type
  const providerConfigMap = providers.reduce(
    (acc, config) => {
      acc[config.provider] = config;
      return acc;
    },
    {} as Record<OAuthProviderType, OAuthProviderConfig>
  );

  const handleOpenConfigureDialog = (provider: OAuthProviderType) => {
    setSelectedProvider(provider);
    setConfigureDialogOpen(true);
  };

  const handleToggleEnabled = async (provider: OAuthProviderType) => {
    const config = providerConfigMap[provider];
    if (!config) return;

    const providerInfo = OAUTH_PROVIDER_INFO[provider];
    const newEnabled = !config.enabled;

    try {
      await updateEnabled(config.id, newEnabled);
      toast({
        description: `${providerInfo.name} ${newEnabled ? 'enabled' : 'disabled'}`,
        variant: 'success',
      });
    } catch (_error) {
      toast({ description: 'Failed to update provider', variant: 'error' });
    }
  };

  const handleRemove = async (provider: OAuthProviderType) => {
    const config = providerConfigMap[provider];
    if (!config) return;

    const providerInfo = OAUTH_PROVIDER_INFO[provider];
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

  const configuredCount = providers.length;
  const enabledCount = providers.filter((p) => p.enabled).length;

  return (
    <SettingsSection
      title="Integrations"
      description="Configure OAuth integrations to connect your workspace with external services. Set up B2B connections to Google, Microsoft, and Notion."
      icon={Link2}
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {configuredCount} of {ALL_PROVIDERS.length} integrations configured
            {configuredCount > 0 && ` (${enabledCount} enabled)`}
          </p>
        </div>

        {/* Providers List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading integrations...</div>
        ) : (
          <div className="space-y-3">
            {ALL_PROVIDERS.map((providerType) => {
              const config = providerConfigMap[providerType];
              const info = OAUTH_PROVIDER_INFO[providerType];
              const isConfigured = config !== undefined;
              const isEnabled = config?.enabled ?? false;

              return (
                <div
                  key={providerType}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isConfigured && isEnabled
                      ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20'
                      : isConfigured
                        ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  {/* Provider Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-700 dark:text-gray-300">
                      {info.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{info.name}</h4>
                        {isConfigured && (
                          <Badge
                            variant={isEnabled ? 'success' : 'secondary'}
                            className="text-xs"
                          >
                            {isEnabled ? 'Enabled' : 'Disabled'}
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
                        {/* Enable/Disable toggle */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleEnabled(providerType)}
                          disabled={updating}
                          title={isEnabled ? 'Disable' : 'Enable'}
                        >
                          {isEnabled ? (
                            <ToggleRight className="h-5 w-5 text-cyan-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>

                        {/* Configure button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenConfigureDialog(providerType)}
                          title="Configure"
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
                          title="Remove"
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

      {/* Configure Dialog */}
      {selectedProvider && (
        <ConfigureOAuthProviderDialog
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
