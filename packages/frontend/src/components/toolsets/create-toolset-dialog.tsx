/**
 * Create Toolset Dialog Component
 *
 * WHY: Allows users to create new toolsets with a name and description.
 * ToolSets are logical groupings of tools (replaces the old "agent" concept).
 *
 * FEATURES:
 * - Simple form with name and description fields
 * - Creates ToolSet via GraphQL mutation
 * - Resets form on close
 * - Shows loading state during creation
 *
 * USAGE:
 * ```tsx
 * const { setOpen } = useCreateToolsetDialog();
 *
 * // Open dialog
 * setOpen(true);
 * ```
 */

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateToolsetDialog } from '@/stores/uiStore';
import { useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { CreateToolSetDocument } from '@/graphql/generated/graphql';
import { useNotification } from '@/contexts/NotificationContext';

export function CreateToolsetDialog() {
  const { open, close, callback } = useCreateToolsetDialog();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { toast } = useNotification();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [createToolSet, { loading }] = useMutation(CreateToolSetDocument, {
    refetchQueries: ['SubscribeToolSets'],
    onCompleted: (data) => {
      const toolSetId = data.createToolSet.id;

      toast({
        title: 'Toolset Created',
        description: `"${name}" has been created successfully.`,
        variant: 'success',
      });

      // Call callback if provided before closing
      if (callback) {
        callback(toolSetId);
      }

      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Error Creating Toolset',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Handle dialog close
  const handleClose = useCallback(() => {
    close();
    // Reset form after animation completes
    setTimeout(() => {
      setName('');
      setDescription('');
    }, 300);
  }, [close]);

  // Handle open change from Radix
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !workspaceId) return;

    await createToolSet({
      variables: {
        workspaceId,
        name: name.trim(),
        description: description.trim() || '',
      },
    });
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Toolset
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Create a new toolset to organize your tools
                </Dialog.Description>
              </div>

              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="toolset-name"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                >
                  Name *
                </label>
                <Input
                  id="toolset-name"
                  placeholder="Enter toolset name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="toolset-description"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                >
                  Description
                </label>
                <Textarea
                  id="toolset-description"
                  placeholder="Enter toolset description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid || loading}>
                {loading ? 'Creating...' : 'Create Toolset'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
