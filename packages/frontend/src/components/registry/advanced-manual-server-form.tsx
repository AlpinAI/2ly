/**
 * AdvancedManualServerForm Component
 *
 * WHY: Full-featured form for advanced MCP server configuration with complete control
 * via direct JSON editing. Users provide packages and/or remotes configuration as JSON arrays.
 *
 * FEATURES:
 * - JSON code blocks for packages (STDIO) configuration
 * - JSON code blocks for remotes (SSE/HTTP) configuration
 * - Real-time Zod schema validation with visual indicators
 * - Auto-formatting on blur
 * - Detailed error messages showing what's wrong with the JSON
 * - Both fields visible simultaneously - user can fill in one or both
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMCPRegistries } from '@/hooks/useMCPRegistries';
import { AddServerToRegistryDocument } from '@/graphql/generated/graphql';
import { cn } from '@/lib/utils';
import { validatePackages, validateRemotes } from '@/lib/mcpSchemas';

interface AdvancedManualServerFormProps {
  onServerAdded: (serverId: string) => void;
  onCancel: () => void;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

const DEFAULT_PACKAGES_JSON = `[
  {
    "identifier": "my-package",
    "version": "1.0.0",
    "registryType": "npm",
    "transport": {
      "type": "stdio"
    },
    "runtimeArguments": [
      {
        "type": "string",
        "value": "node",
        "name": "command"
      }
    ]
  }
]`;

const DEFAULT_REMOTES_JSON = `[
  {
    "type": "sse",
    "url": "https://example.com/mcp"
  }
]`;

export function AdvancedManualServerForm({
  onServerAdded,
  onCancel,
}: AdvancedManualServerFormProps) {
  const { registries } = useMCPRegistries();
  const privateRegistry = registries[0];

  const [addServerToRegistry] = useMutation(AddServerToRegistryDocument, {
    refetchQueries: ['GetMCPRegistries'],
    onError: (err) => {
      console.error('[AdvancedManualServerForm] Add server error:', err);
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic info
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repositoryUrl: '',
    version: '1.0.0',
  });

  // JSON code blocks
  const [packagesJson, setPackagesJson] = useState('');
  const [remotesJson, setRemotesJson] = useState('');

  // Validation state
  const [packagesValidation, setPackagesValidation] = useState<ValidationResult>({ isValid: true });
  const [remotesValidation, setRemotesValidation] = useState<ValidationResult>({ isValid: true });

  // Validate on change for packages
  const handlePackagesChange = useCallback((value: string) => {
    setPackagesJson(value);

    // If empty, mark as valid (optional field)
    if (!value.trim()) {
      setPackagesValidation({ isValid: true });
      return;
    }

    const result = validatePackages(value);
    setPackagesValidation({
      isValid: result.success,
      error: result.error,
      formatted: result.formatted,
    });
  }, []);

  // Validate on change for remotes
  const handleRemotesChange = useCallback((value: string) => {
    setRemotesJson(value);

    // If empty, mark as valid (optional field)
    if (!value.trim()) {
      setRemotesValidation({ isValid: true });
      return;
    }

    const result = validateRemotes(value);
    setRemotesValidation({
      isValid: result.success,
      error: result.error,
      formatted: result.formatted,
    });
  }, []);

  // Auto-format on blur
  const handlePackagesBlur = useCallback(() => {
    if (packagesValidation.isValid && packagesValidation.formatted && packagesJson.trim()) {
      setPackagesJson(packagesValidation.formatted);
    }
  }, [packagesValidation, packagesJson]);

  const handleRemotesBlur = useCallback(() => {
    if (remotesValidation.isValid && remotesValidation.formatted && remotesJson.trim()) {
      setRemotesJson(remotesValidation.formatted);
    }
  }, [remotesValidation, remotesJson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!privateRegistry?.id) {
      console.error('No private registry found');
      return;
    }

    setIsSubmitting(true);
    try {
      const packages = packagesJson.trim() ? packagesJson : null;
      const remotes = remotesJson.trim() ? remotesJson : null;

      const result = await addServerToRegistry({
        variables: {
          registryId: privateRegistry.id,
          name: formData.name,
          description: formData.description,
          title: formData.name,
          repositoryUrl: formData.repositoryUrl || '',
          version: formData.version,
          packages,
          remotes,
        },
      });

      const serverId = result.data?.addServerToRegistry?.id;
      if (serverId) {
        onServerAdded(serverId);
      } else {
        throw new Error('Server ID not returned from mutation');
      }
    } catch (error) {
      console.error('Failed to create server:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation
  const hasValidContent =
    (packagesJson.trim() && packagesValidation.isValid) ||
    (remotesJson.trim() && remotesValidation.isValid);
  const isValid = formData.name.trim() && formData.description.trim() && hasValidContent;

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Advanced configuration with direct JSON editing. Provide packages (STDIO) and/or remotes
          (SSE/HTTP) configuration as JSON arrays validated against the MCP Registry schema.
        </p>

        {/* Basic Info */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Server Name *</Label>
              <Input
                id="name"
                placeholder="my-advanced-server"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="1.0.0"
                value={formData.version}
                onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what this server does..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repositoryUrl">Repository URL (optional)</Label>
            <Input
              id="repositoryUrl"
              type="url"
              placeholder="https://github.com/..."
              value={formData.repositoryUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, repositoryUrl: e.target.value }))}
            />
          </div>
        </Section>

        {/* Packages JSON */}
        <Section
          title="Packages Configuration (Optional)"
          description="Provide a JSON array of package configurations. Each package represents a local STDIO-based MCP server."
        >
          <JSONCodeBlock
            value={packagesJson}
            onChange={handlePackagesChange}
            onBlur={handlePackagesBlur}
            validation={packagesValidation}
            placeholder={DEFAULT_PACKAGES_JSON}
            helpText="Leave empty if you only want to configure remotes"
          />
        </Section>

        {/* Remotes JSON */}
        <Section
          title="Remotes Configuration (Optional)"
          description="Provide a JSON array of remote configurations. Each remote represents an SSE or HTTP-based MCP server."
        >
          <JSONCodeBlock
            value={remotesJson}
            onChange={handleRemotesChange}
            onBlur={handleRemotesBlur}
            validation={remotesValidation}
            placeholder={DEFAULT_REMOTES_JSON}
            helpText="Leave empty if you only want to configure packages"
          />
        </Section>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Server'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Helper Components

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

interface JSONCodeBlockProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  validation: ValidationResult;
  placeholder?: string;
  helpText?: string;
}

function JSONCodeBlock({
  value,
  onChange,
  onBlur,
  validation,
  placeholder,
  helpText,
}: JSONCodeBlockProps) {
  const isEmpty = !value.trim();

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={cn(
            'font-mono text-sm min-h-[300px] resize-y',
            'border-2 transition-colors',
            isEmpty
              ? 'border-gray-200 dark:border-gray-700'
              : validation.isValid
                ? 'border-green-500 dark:border-green-600'
                : 'border-red-500 dark:border-red-600'
          )}
        />
        {/* Validation indicator */}
        {!isEmpty && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {validation.isValid ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-xs font-medium">Valid</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="text-xs font-medium">Invalid</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {!validation.isValid && validation.error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900 dark:text-red-200">Schema Validation Error</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1 font-mono">{validation.error}</p>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">Validated against MCP Registry schema on each keystroke</p>
          <ul className="list-disc list-inside space-y-0.5 ml-1">
            <li>Must be a valid JSON array</li>
            <li>Array items validated against official MCP schema</li>
            <li>JSON will auto-format when you click outside the text area</li>
            {helpText && <li>{helpText}</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
