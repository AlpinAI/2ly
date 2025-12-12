/**
 * AIFeaturesSection Component
 *
 * Manage AI system prompts for AI-powered features.
 * Allows workspace members to view and edit system prompts used by AI generation features.
 */

import { useState } from 'react';
import { Sparkles, Plus, Trash2, Edit } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { SettingsSection } from './settings-section';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAIConfigs } from '@/hooks/useAIConfigs';
import { useNotification } from '@/contexts/NotificationContext';
import { X } from 'lucide-react';

interface EditPromptDialogProps {
  open: boolean;
  onClose: () => void;
  promptKey: string | null;
  promptValue: string;
  promptDescription: string;
  onSave: (key: string, value: string, description: string) => Promise<void>;
  isNew: boolean;
}

function EditPromptDialog({
  open,
  onClose,
  promptKey,
  promptValue,
  promptDescription,
  onSave,
  isNew,
}: EditPromptDialogProps) {
  const [key, setKey] = useState(promptKey || '');
  const [value, setValue] = useState(promptValue);
  const [description, setDescription] = useState(promptDescription);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!key.trim() || !value.trim()) return;

    setSaving(true);
    try {
      await onSave(key.trim(), value.trim(), description.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[700px] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white shadow-lg p-0 dark:border-gray-700 dark:bg-gray-800 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                {isNew ? 'Add AI Prompt' : 'Edit AI Prompt'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400">
              {isNew
                ? 'Create a new system prompt for AI features.'
                : 'Update the system prompt configuration.'}
            </Dialog.Description>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
            <div>
              <Label htmlFor="prompt-key">Prompt Key</Label>
              <Input
                id="prompt-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g., skill-generation-prompt"
                disabled={!isNew}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A unique identifier for this prompt. Use kebab-case.
              </p>
            </div>

            <div>
              <Label htmlFor="prompt-description">Description</Label>
              <Input
                id="prompt-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this prompt is used for"
              />
            </div>

            <div>
              <Label htmlFor="prompt-value">System Prompt</Label>
              <Textarea
                id="prompt-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter the system prompt..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The actual prompt text that will be sent to the AI.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!key.trim() || !value.trim() || saving}>
              {saving ? 'Saving...' : 'Save Prompt'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AIFeaturesSection() {
  const { configs, loading, error, setConfig, deleteConfig } = useAIConfigs();
  const { toast } = useNotification();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [isNewPrompt, setIsNewPrompt] = useState(false);

  const handleEdit = (key: string, value: string, description: string) => {
    setEditingKey(key);
    setEditingValue(value);
    setEditingDescription(description);
    setIsNewPrompt(false);
    setEditDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingKey(null);
    setEditingValue('');
    setEditingDescription('');
    setIsNewPrompt(true);
    setEditDialogOpen(true);
  };

  const handleSave = async (key: string, value: string, description: string) => {
    try {
      await setConfig(key, value, description);
      toast({
        description: isNewPrompt ? 'Prompt created successfully' : 'Prompt updated successfully',
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save prompt';
      toast({ description: message, variant: 'error' });
      throw error;
    }
  };

  const handleDelete = async (id: string, key: string) => {
    if (!confirm(`Are you sure you want to delete the prompt "${key}"?`)) {
      return;
    }

    try {
      await deleteConfig(id);
      toast({ description: 'Prompt deleted successfully', variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete prompt';
      toast({ description: message, variant: 'error' });
    }
  };

  return (
    <>
      <SettingsSection
        icon={Sparkles}
        title="AI Features"
        description="Manage system prompts for AI-powered features like skill generation. These prompts control how AI assists with creating and configuring skills."
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {configs.length} {configs.length === 1 ? 'prompt' : 'prompts'} configured
            </p>
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Prompt
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading prompts...</div>
          ) : error ? (
            <div className="text-center py-8 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-600 dark:text-red-400 mb-2">Failed to load AI prompts</p>
              <p className="text-sm text-red-500 dark:text-red-500">{error.message}</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No AI prompts configured</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Add custom prompts to customize AI behavior in skill generation and other features.
              </p>
              <Button onClick={handleAddNew} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Prompt
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => {
                if (!config) return null;
                return (
                <div
                  key={config.id}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {config.key}
                        </code>
                      </div>
                      {config.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(config.key, config.value, config.description ?? '')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config.id ?? '', config.key)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-800">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                      {config.value}
                    </pre>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>Created: {new Date(config.createdAt).toLocaleDateString()}</span>
                    {config.updatedAt && String(config.updatedAt) !== String(config.createdAt) && (
                      <span>Updated: {new Date(config.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </SettingsSection>

      <EditPromptDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        promptKey={editingKey}
        promptValue={editingValue}
        promptDescription={editingDescription}
        onSave={handleSave}
        isNew={isNewPrompt}
      />
    </>
  );
}
