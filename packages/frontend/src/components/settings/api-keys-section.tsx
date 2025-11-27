/**
 * ApiKeysSection Component
 *
 * WHY: Manage workspace workspace keys for programmatic access to the platform.
 *
 * WHAT IT SHOWS:
 * - List of active and revoked workspace keys
 * - Key descriptions and creation dates
 * - Show/hide key values with eye icon (lazy loaded)
 * - Generate new keys
 * - Revoke existing keys
 */

import { useState } from 'react';
import { Key, Eye, EyeOff, Copy, Plus, AlertCircle } from 'lucide-react';
import { SettingsSection } from './settings-section';
import { CreateKeyDialog } from './create-key-dialog';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import {
  GetWorkspaceKeysDocument,
  GetKeyValueDocument,
  RevokeKeyDocument
} from '@/graphql/generated/graphql';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useNotification } from '@/contexts/NotificationContext';

export function ApiKeysSection() {
  const [visibleKeys, setVisibleKeys] = useState<Record<string, string>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const workspaceId = useWorkspaceId();
  const { toast } = useNotification();

  const { data, loading, refetch } = useQuery(GetWorkspaceKeysDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  const [getKeyValue, { loading: loadingKeyValue }] = useLazyQuery(GetKeyValueDocument);
  const [revokeKey] = useMutation(RevokeKeyDocument);

  const handleToggleKeyVisibility = async (keyId: string) => {
    if (visibleKeys[keyId]) {
      // Hide the key
      const newVisibleKeys = { ...visibleKeys };
      delete newVisibleKeys[keyId];
      setVisibleKeys(newVisibleKeys);
    } else {
      // Fetch and show the key
      try {
        const result = await getKeyValue({ variables: { keyId } });
        if (result.data?.keyValue) {
          setVisibleKeys({ ...visibleKeys, [keyId]: result.data.keyValue });
        }
      } catch (error) {
        toast({ description: 'Failed to fetch key value', variant: 'error' });
        console.error('Error fetching key value:', error);
      }
    }
  };

  const handleCopyKey = (keyValue: string) => {
    navigator.clipboard.writeText(keyValue);
    toast({ description: 'Key copied to clipboard', variant: 'success' });
  };

  const handleRevokeKey = async (keyId: string, description?: string | null) => {
    if (!confirm(`Are you sure you want to revoke the key "${description || 'Unnamed key'}"?`)) {
      return;
    }

    try {
      await revokeKey({ variables: { keyId } });
      toast({ description: 'Key revoked successfully', variant: 'success' });
      refetch();
    } catch (error) {
      toast({ description: 'Failed to revoke key', variant: 'error' });
      console.error('Error revoking key:', error);
    }
  };

  const workspaceKeys = data?.workspaceKeys || [];
  const hasKeys = workspaceKeys.length > 0;

  return (
    <SettingsSection
      title="API Keys"
      description="Manage workspace keys for programmatic access."
      icon={Key}
    >
      <div className="space-y-4">
        {/* Generate Key Button */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {hasKeys ? `${workspaceKeys.length} key(s) total` : 'No keys yet'}
          </p>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Generate New Key
          </Button>
        </div>

        {/* Keys Table */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading keys...</div>
        ) : hasKeys ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Key
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Created
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {workspaceKeys.map((key) => {
                  const isRevoked = !!key.revokedAt;
                  const isVisible = !!visibleKeys[key.id];
                  const keyValue = visibleKeys[key.id] || key.key;

                  return (
                    <tr
                      key={key.id}
                      className={`${isRevoked ? 'opacity-50 bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'}`}
                    >
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {key.description || <span className="text-gray-400 italic">No description</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          {isVisible ? (
                            <>
                              <span className="truncate max-w-xs">{keyValue}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyKey(keyValue)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <span>••••••••••••••••</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {format(new Date(key.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        {isRevoked ? (
                          <Badge variant="error">Revoked</Badge>
                        ) : (
                          <Badge variant="success">
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleKeyVisibility(key.id)}
                            disabled={loadingKeyValue || isRevoked}
                            className="h-8 w-8 p-0"
                          >
                            {isVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          {!isRevoked && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRevokeKey(key.id, key.description)}
                              className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-full p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No API Keys
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
              Generate your first workspace key to enable programmatic access.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                About Workspace Keys
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Workspace keys provide full access to your workspace. Keep them secure and revoke any keys that may be compromised.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Key Dialog */}
      {workspaceId && (
        <CreateKeyDialog
          workspaceId={workspaceId}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </SettingsSection>
  );
}
