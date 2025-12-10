/**
 * ConfigureOAuthProviderDialog Component
 *
 * Dialog for configuring an OAuth provider with Client ID, Client Secret,
 * and optional Tenant ID (for Microsoft).
 */

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/contexts/NotificationContext';
import { X, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { OAuthProviderType, type OAuthProviderConfig } from '@/graphql/generated/graphql';
import { OAUTH_PROVIDER_INFO } from '@/hooks/useOAuthProviders';

interface ConfigureOAuthProviderDialogProps {
  provider: OAuthProviderType;
  existingConfig?: OAuthProviderConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigure: (
    provider: OAuthProviderType,
    clientId: string,
    clientSecret: string,
    tenantId?: string
  ) => Promise<{ valid: boolean; error?: string | null } | null | undefined>;
}

export function ConfigureOAuthProviderDialog({
  provider,
  existingConfig,
  open,
  onOpenChange,
  onConfigure,
}: ConfigureOAuthProviderDialogProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    error?: string | null;
  } | null>(null);
  const { toast } = useNotification();

  const providerInfo = OAUTH_PROVIDER_INFO[provider];

  // Reset state when dialog opens with new provider
  useEffect(() => {
    if (open) {
      setClientId(existingConfig?.clientId || '');
      setClientSecret('');
      setTenantId(existingConfig?.tenantId || '');
      setShowSecret(false);
      setResult(null);
    }
  }, [open, provider, existingConfig]);

  const handleClose = () => {
    setClientId('');
    setClientSecret('');
    setTenantId('');
    setShowSecret(false);
    setResult(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId.trim()) {
      toast({ description: 'Please enter a Client ID', variant: 'error' });
      return;
    }

    // For new configs or when updating secret, require secret
    if (!existingConfig && !clientSecret.trim()) {
      toast({ description: 'Please enter a Client Secret', variant: 'error' });
      return;
    }

    if (providerInfo.requiresTenantId && !tenantId.trim()) {
      toast({ description: 'Please enter a Tenant ID', variant: 'error' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // If updating and no new secret provided, use a placeholder that backend will handle
      const secretToSend = clientSecret.trim() || (existingConfig ? '__KEEP_EXISTING__' : '');

      const configResult = await onConfigure(
        provider,
        clientId.trim(),
        secretToSend,
        tenantId.trim() || undefined
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
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-700 dark:text-gray-300">
                  {providerInfo.icon}
                </div>
                Configure {providerInfo.name}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400">
              {existingConfig
                ? `Update your ${providerInfo.name} OAuth configuration`
                : `Enter your ${providerInfo.name} OAuth credentials to enable this integration`}
            </Dialog.Description>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client ID field */}
              <div className="space-y-2">
                <Label htmlFor="clientId">
                  Client ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientId"
                  type="text"
                  placeholder="Enter your Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Client Secret field */}
              <div className="space-y-2">
                <Label htmlFor="clientSecret">
                  Client Secret {!existingConfig && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="clientSecret"
                    type={showSecret ? 'text' : 'password'}
                    placeholder={existingConfig ? 'Leave empty to keep existing secret' : 'Enter your Client Secret'}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {existingConfig
                    ? 'Leave empty to keep the existing secret, or enter a new one to update'
                    : 'Your Client Secret will be encrypted and stored securely'}
                </p>
              </div>

              {/* Tenant ID field - only for Microsoft */}
              {providerInfo.requiresTenantId && (
                <div className="space-y-2">
                  <Label htmlFor="tenantId">
                    Tenant ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tenantId"
                    type="text"
                    placeholder="e.g., common, organizations, or your Azure AD tenant ID"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use &quot;common&quot; for multi-tenant, &quot;organizations&quot; for work accounts only,
                    or your specific Azure AD tenant GUID
                  </p>
                </div>
              )}

              {/* Documentation link */}
              <a
                href={providerInfo.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ExternalLink className="h-3 w-3" />
                View {providerInfo.name} OAuth documentation
              </a>

              {/* Google Cloud Console configuration help */}
              {provider === OAuthProviderType.Google && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Open Google Cloud Console
                      </a>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Configure the following in your OAuth 2.0 Client ID settings:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Authorized JavaScript origin:
                      </span>
                      <code className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">
                        {window.location.origin}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Authorized redirect URI:
                      </span>
                      <code className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">
                        {`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/oauth/callback`}
                      </code>
                    </div>
                  </div>
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
                        className={`font-medium ${
                          result.valid
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}
                      >
                        {result.valid ? 'Configuration Saved' : 'Validation Failed'}
                      </p>
                      {!result.valid && result.error && (
                        <p className="text-red-700 dark:text-red-300 mt-1">{result.error}</p>
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
                  Saving...
                </>
              ) : existingConfig ? (
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
