/**
 * CreateKeyDialog Component
 *
 * WHY: Dialog for generating a new workspace master key with a description
 *
 * WHAT IT DOES:
 * - Prompts user for key description
 * - Generates new master key via GraphQL mutation
 * - Shows the newly generated key value once (with copy button)
 */

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@apollo/client/react';
import { CreateWorkspaceKeyDocument, GetWorkspaceKeysDocument } from '@/graphql/generated/graphql';
import { useNotification } from '@/contexts/NotificationContext';
import { Copy, Key, AlertCircle, X } from 'lucide-react';

interface CreateKeyDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateKeyDialog({ workspaceId, open, onOpenChange }: CreateKeyDialogProps) {
  const [description, setDescription] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const { toast } = useNotification();

  const [createKey, { loading }] = useMutation(CreateWorkspaceKeyDocument, {
    refetchQueries: [{ query: GetWorkspaceKeysDocument, variables: { workspaceId } }],
    onCompleted: (data: any) => {
      if (data.createWorkspaceKey) {
        setNewKeyValue(data.createWorkspaceKey.key);
        toast({ description: 'Key generated successfully', variant: 'success' });
      }
    },
    onError: (error: any) => {
      toast({ description: 'Failed to generate key', variant: 'error' });
      console.error('Error generating key:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ description: 'Please enter a description', variant: 'error' });
      return;
    }

    await createKey({
      variables: {
        workspaceId,
        description: description.trim(),
      },
    });
  };

  const handleCopyKey = () => {
    if (newKeyValue) {
      navigator.clipboard.writeText(newKeyValue);
      toast({ description: 'Key copied to clipboard', variant: 'success' });
    }
  };

  const handleClose = () => {
    setDescription('');
    setNewKeyValue(null);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white shadow-lg p-0 dark:border-gray-700 dark:bg-gray-800 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="h-5 w-5" />
                Generate New Master Key
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400">
              {newKeyValue
                ? "Your new key has been generated. Copy it now - you won't be able to see it again."
                : 'Create a new workspace master key with a descriptive name.'}
            </Dialog.Description>
          </div>

          {/* Content */}
          <div className="p-6">
            {newKeyValue ? (
              // Show the generated key
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                        Key Generated Successfully
                      </p>
                      <p className="text-green-700 dark:text-green-300">
                        Copy this key now. For security reasons, you won't be able to see the full key value again.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your New Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newKeyValue}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyKey}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Show the form to create a new key
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="description"
                    placeholder="e.g., Production API Key, Development Access"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add a meaningful description to help identify this key later.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            {newKeyValue ? (
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Key'}
                </Button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
