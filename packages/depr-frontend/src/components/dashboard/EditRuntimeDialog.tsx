import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import { apolloResolversTypes } from '@2ly/common';

interface EditRuntimeDialogProps {
  runtime: apolloResolversTypes.Runtime;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, name: string, description: string) => Promise<void>;
}

/**
 * Dialog for editing runtime name and description
 */
const EditRuntimeDialog: React.FC<EditRuntimeDialogProps> = ({
  runtime,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(runtime.name);
  const [description, setDescription] = useState(runtime.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when runtime changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(runtime.name);
      setDescription(runtime.description || '');
      setError(null);
    }
  }, [runtime, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(runtime.id, name.trim(), description.trim());
      onClose();
    } catch (err) {
      console.error('Failed to update runtime:', err);
      setError(err instanceof Error ? err.message : 'Failed to update runtime');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="rounded-lg bg-white p-6 shadow-xl max-w-md w-full"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Runtime</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="runtime-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="runtime-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Enter runtime name"
              autoFocus
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="runtime-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="runtime-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full min-h-[80px] resize-y"
              placeholder="Enter runtime description"
              disabled={isSaving}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditRuntimeDialog;