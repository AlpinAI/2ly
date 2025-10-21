import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import { apolloResolversTypes } from '@2ly/common';

type MCPServerFormData = Omit<apolloResolversTypes.MutationCreateMcpServerArgs, 'workspaceId'>;

interface MCPServerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: MCPServerFormData) => Promise<void>;
  initialData?: Partial<MCPServerFormData>;
  title?: string;
  submitButtonText?: string;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

const MCPServerFormDialog: React.FC<MCPServerFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  title = 'Add New MCP Server',
  submitButtonText = 'Create MCP Server',
  isSubmitting = false,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<MCPServerFormData>({
    name: '',
    description: '',
    repositoryUrl: '',
    transport: 'STDIO' as apolloResolversTypes.McpTransportType,
    command: '',
    args: '',
    ENV: '',
    serverUrl: '',
    headers: undefined,
  });

  // Memoize the initial data to prevent unnecessary re-renders
  const stableInitialData = useMemo(() => {
    if (!initialData || Object.keys(initialData).length === 0) {
      return null;
    }
    return initialData;
  }, [initialData]);

  // Reset form when dialog opens/closes or initial data changes
  useEffect(() => {
    if (isOpen) {
      if (stableInitialData && isEditing) {
        setFormData((prev) => ({ ...prev, ...stableInitialData }));
      } else {
        setFormData({
          name: '',
          description: '',
          repositoryUrl: '',
          transport: 'STDIO' as apolloResolversTypes.McpTransportType,
          command: '',
          args: '',
          ENV: '',
          serverUrl: '',
          headers: undefined,
        });
      }
    }
  }, [isOpen, isEditing, stableInitialData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  }, [onSubmit, formData]);

  const handleInputChange = useCallback((field: keyof MCPServerFormData, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[80vh] rounded-lg bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Editable Fields */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Read-only Fields when Editing */}
            {isEditing ? (
              <>
                <div className="md:col-span-2 space-y-3 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Server Configuration</h3>

                  <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Repository URL</span>
                      <span className="text-sm text-gray-900 break-all">{formData.repositoryUrl}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                    <div>
                      <span className="block text-xs font-medium text-gray-500">Transport Type</span>
                      <span className="text-sm text-gray-900">{formData.transport}</span>
                    </div>
                  </div>

                  {formData.transport === 'STDIO' ? (
                    <>
                      <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                        <div>
                          <span className="block text-xs font-medium text-gray-500">Command</span>
                          <span className="text-sm text-gray-900 font-mono break-all">{formData.command}</span>
                        </div>
                      </div>

                      {formData.args && (
                        <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                          <div>
                            <span className="block text-xs font-medium text-gray-500">Arguments</span>
                            <span className="text-sm text-gray-900 font-mono break-all">{formData.args}</span>
                          </div>
                        </div>
                      )}

                      {formData.ENV && (
                        <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                          <div>
                            <span className="block text-xs font-medium text-gray-500">Environment Variables</span>
                            <pre className="text-sm text-gray-900 font-mono whitespace-pre-wrap break-all">{formData.ENV}</pre>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                        <div>
                          <span className="block text-xs font-medium text-gray-500">Server URL</span>
                          <span className="text-sm text-gray-900 break-all">{formData.serverUrl}</span>
                        </div>
                      </div>

                      {formData.headers && (
                        <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                          <div>
                            <span className="block text-xs font-medium text-gray-500">Headers</span>
                            <pre className="text-sm text-gray-900 font-mono whitespace-pre-wrap break-all">{formData.headers}</pre>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Editable Fields for Create Mode */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Repository URL</label>
                  <input
                    type="url"
                    required
                    value={formData.repositoryUrl}
                    onChange={(e) => handleInputChange('repositoryUrl', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">MCP Transport Type</label>
                  <select
                    required
                    value={formData.transport}
                    onChange={(e) => handleInputChange('transport', e.target.value as apolloResolversTypes.McpTransportType)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="STDIO">STDIO</option>
                    <option value="STREAM">STREAM</option>
                  </select>
                </div>
              </>
            )}

            {!isEditing && formData.transport === 'STDIO' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Command</label>
                  <input
                    type="text"
                    required
                    value={formData.command}
                    onChange={(e) => handleInputChange('command', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Arguments</label>
                  <input
                    type="text"
                    value={formData.args}
                    onChange={(e) => handleInputChange('args', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Environment Variables</label>
                  <textarea
                    value={formData.ENV}
                    onChange={(e) => handleInputChange('ENV', e.target.value)}
                    rows={3}
                    placeholder="KEY1=value1&#10;KEY2=value2"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </>
            )}

            {!isEditing && formData.transport === 'STREAM' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Server URL</label>
                  <input
                    type="url"
                    required
                    value={formData.serverUrl}
                    onChange={(e) => handleInputChange('serverUrl', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Headers</label>
                  <textarea
                    value={formData.headers || ''}
                    onChange={(e) => handleInputChange('headers', e.target.value || undefined)}
                    rows={3}
                    placeholder="header_name header_value&#10;another_header another_value"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: &lt;header_name&gt;&lt;space&gt;&lt;header_value&gt; (one per line)
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : submitButtonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MCPServerFormDialog;
