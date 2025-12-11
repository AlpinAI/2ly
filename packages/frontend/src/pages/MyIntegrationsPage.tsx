/**
 * My Integrations Page
 *
 * Allows users to connect their personal accounts to workspace-enabled OAuth providers.
 * MCP tools can then access external APIs (Google, Microsoft, Notion) on behalf of the user.
 */

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2, ExternalLink, LogOut, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserOAuthConnections } from '@/hooks/useUserOAuthConnections';
import { useOAuthProviders, OAUTH_PROVIDER_INFO } from '@/hooks/useOAuthProviders';
import { OAuthProviderType } from '@/graphql/generated/graphql';
import { useNotification } from '@/contexts/NotificationContext';

export default function MyIntegrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useNotification();
  const callbackProcessedRef = useRef(false);

  // Get workspace-enabled providers
  const { providers: workspaceProviders, loading: loadingProviders } = useOAuthProviders();

  // Get user's connections
  const {
    connections,
    loading: loadingConnections,
    refetch,
    initiateConnection,
    initiating,
    disconnectConnection,
    disconnecting,
    getConnection,
  } = useUserOAuthConnections();

  // Handle OAuth callback success/error
  useEffect(() => {
    // Prevent double processing in React StrictMode
    if (callbackProcessedRef.current) return;

    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (success) {
      callbackProcessedRef.current = true;
      const providerInfo = OAUTH_PROVIDER_INFO[success.toUpperCase() as OAuthProviderType];
      toast({
        description: `Successfully connected to ${providerInfo?.name || success}`,
        variant: 'success',
      });
      // Refetch connections to show the new connection
      refetch();
      // Clear the query params
      setSearchParams({});
    } else if (error) {
      callbackProcessedRef.current = true;
      toast({
        description: errorDescription || `Failed to connect: ${error}`,
        variant: 'error',
      });
      // Clear the query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast, refetch]);

  // Filter to only show enabled workspace providers
  const enabledProviders = workspaceProviders.filter((p) => p.enabled);

  const handleConnect = async (provider: OAuthProviderType) => {
    const authUrl = await initiateConnection(provider);
    if (authUrl) {
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } else {
      toast({
        description: 'Failed to initiate connection. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleDisconnect = async (connectionId: string, providerName: string) => {
    if (!confirm(`Are you sure you want to disconnect from ${providerName}?`)) {
      return;
    }

    const success = await disconnectConnection(connectionId);
    if (success) {
      toast({
        description: `Disconnected from ${providerName}`,
        variant: 'success',
      });
    } else {
      toast({
        description: 'Failed to disconnect. Please try again.',
        variant: 'error',
      });
    }
  };

  const loading = loadingProviders || loadingConnections;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link2 className="h-8 w-8 text-cyan-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Integrations</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your personal accounts to allow tools to access external services on your behalf.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : enabledProviders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <Link2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Integrations Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Your workspace administrator hasn't enabled any OAuth integrations yet.
            Contact them to set up Google, Microsoft, or Notion integrations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected count */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>
              {connections.length} of {enabledProviders.length} integrations connected
            </span>
          </div>

          {/* Provider cards */}
          <div className="grid gap-4">
            {enabledProviders.map((workspaceProvider) => {
              const providerType = workspaceProvider.provider;
              const info = OAUTH_PROVIDER_INFO[providerType];
              const connection = getConnection(providerType);
              const isConnected = !!connection;

              return (
                <div
                  key={providerType}
                  className={`p-5 rounded-lg border ${
                    isConnected
                      ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    {/* Provider info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {info.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {info.name}
                          </h3>
                          {isConnected ? (
                            <Badge variant="success" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {info.description}
                        </p>

                        {/* Connection details */}
                        {isConnected && connection && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                            {connection.accountEmail && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Account:</span>
                                {connection.accountName || connection.accountEmail}
                              </span>
                            )}
                            {connection.lastUsedAt && (
                              <span>
                                Last used: {new Date(connection.lastUsedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisconnect(connection!.id, info.name)}
                          disabled={disconnecting}
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        >
                          {disconnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LogOut className="h-4 w-4 mr-1" />
                              Disconnect
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(providerType)}
                          disabled={initiating}
                        >
                          {initiating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-1" />
                          )}
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help text */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              Why connect your accounts?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              When you connect your personal accounts, MCP tools in this workspace can access
              external services like Google Drive, Microsoft Teams, or Notion on your behalf.
              Your credentials are securely stored and you can disconnect at any time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
