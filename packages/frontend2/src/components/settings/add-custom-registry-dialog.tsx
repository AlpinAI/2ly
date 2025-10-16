/**
 * Add Custom Registry Dialog Component
 *
 * WHY: Dialog for adding custom MCP registries with manual URL input.
 * Provides a focused interface for custom registry configuration.
 *
 * FEATURES:
 * - Input fields for registry name and URL
 * - Form validation
 * - Loading states during creation
 * - Auto-close on success
 * - Clean, focused dialog UI
 */

import { useState, useCallback } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AddCustomRegistryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, upstreamUrl: string) => Promise<void>;
  isLoading: boolean;
}

export function AddCustomRegistryDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: AddCustomRegistryDialogProps) {
  const [name, setName] = useState('');
  const [upstreamUrl, setUpstreamUrl] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !upstreamUrl.trim()) return;

      try {
        await onSubmit(name.trim(), upstreamUrl.trim());

        // Clear form and close dialog on success
        setName('');
        setUpstreamUrl('');
        onOpenChange(false);
      } catch (error) {
        // Error handling is done in parent component
        console.error('Error adding registry:', error);
      }
    },
    [name, upstreamUrl, onSubmit, onOpenChange]
  );

  // Reset form when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setName('');
        setUpstreamUrl('');
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Custom MCP Registry
              </Dialog.Title>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter the details for your custom MCP registry
              </p>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="registry-name">Registry Name</Label>
                <Input
                  id="registry-name"
                  placeholder="My Custom Registry"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="upstream-url">Upstream URL</Label>
                <Input
                  id="upstream-url"
                  type="url"
                  placeholder="https://registry.example.com/v0/servers"
                  value={upstreamUrl}
                  onChange={(e) => setUpstreamUrl(e.target.value)}
                  disabled={isLoading}
                  className="mt-1.5"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  The URL of your MCP registry server
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                disabled={isLoading || !name.trim() || !upstreamUrl.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Registry
                  </>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
