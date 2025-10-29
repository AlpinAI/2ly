/**
 * Create Tool Set Dialog Component
 *
 * WHY: App-wide dialog for creating new tool sets (agents).
 * Accessible from ToolSetsPage, Command Palette, and LinkToolDialog.
 *
 * FEATURES:
 * - Input fields for tool set name (mandatory) and description (optional)
 * - Form validation
 * - Loading states during creation
 * - Success callback for custom post-creation behavior
 * - Uses FormDialog for consistent UI and auto-focus behavior
 *
 * ARCHITECTURE:
 * - Rendered in AppLayout for app-wide availability
 * - State managed in UIStore with callback registration pattern
 * - Creates runtime with ['agent'] capabilities behind the scenes
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateToolSetDialog } from '@/stores/uiStore';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useNotification } from '@/contexts/NotificationContext';
import { CreateRuntimeDocument } from '@/graphql/generated/graphql';

export function CreateToolSetDialog() {
  const { open, callback, close } = useCreateToolSetDialog();
  const workspaceId = useWorkspaceId();
  const { toast } = useNotification();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [createRuntime, { loading }] = useMutation(CreateRuntimeDocument, {
    onCompleted: (data) => {
      // Call the success callback if provided
      if (callback) {
        callback(data.createRuntime.id);
      }

      // Clear form and close dialog
      setName('');
      setDescription('');
      close();
    },
    onError: (error) => {
      toast({
        title: 'Error Creating Tool Set',
        description: error.message,
        variant: 'error',
      });
    },
  });

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !workspaceId) return;

    try {
      await createRuntime({
        variables: {
          workspaceId,
          name: name.trim(),
          description: description.trim(),
          capabilities: ['agent'],
        },
      });
    } catch (error) {
      // Error handling is done in onError callback
      console.error('Error creating tool set:', error);
    }
  }, [name, description, workspaceId, createRuntime]);

  const handleReset = useCallback(() => {
    setName('');
    setDescription('');
  }, []);

  return (
    <FormDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          close();
        }
      }}
      title="Create Tool Set"
      subtitle="Create a new tool set for organizing your AI tools"
      submitLabel="Create Tool Set"
      submitIcon={<Plus className="h-4 w-4" />}
      onSubmit={handleSubmit}
      isSubmitting={loading}
      submitDisabled={!name.trim()}
      onReset={handleReset}
    >
      <div>
        <Label htmlFor="tool-set-name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="tool-set-name"
          placeholder="My Tool Set"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5"
          autoComplete="off"
        />
      </div>

      <div>
        <Label htmlFor="tool-set-description">Description</Label>
        <Textarea
          id="tool-set-description"
          placeholder="Optional description for this tool set"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5 min-h-[80px]"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          Describe the purpose or capabilities of this tool set
        </p>
      </div>
    </FormDialog>
  );
}
