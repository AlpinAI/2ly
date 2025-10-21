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
 * - Uses FormDialog for consistent UI and auto-focus behavior
 */

import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { FormDialog } from '@/components/ui/form-dialog';
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

  const handleSubmit = useCallback(async () => {
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
  }, [name, upstreamUrl, onSubmit, onOpenChange]);

  const handleReset = useCallback(() => {
    setName('');
    setUpstreamUrl('');
  }, []);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Custom MCP Registry"
      subtitle="Enter the details for your custom MCP registry"
      submitLabel="Add Registry"
      submitIcon={<Plus className="h-4 w-4" />}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      submitDisabled={!name.trim() || !upstreamUrl.trim()}
      onReset={handleReset}
    >
      <div>
        <Label htmlFor="registry-name">Registry Name</Label>
        <Input
          id="registry-name"
          placeholder="My Custom Registry"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          className="mt-1.5"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          The URL of your MCP registry server
        </p>
      </div>
    </FormDialog>
  );
}
