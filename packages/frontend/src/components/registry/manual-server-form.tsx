/**
 * ManualServerForm Component
 *
 * WHY: Form for manually adding an MCP server configuration to the private registry.
 * Allows users to create custom server configs not from upstream registries.
 *
 * FIELDS (Basic):
 * - Server name
 * - Description
 * - Transport type (STDIO/SSE)
 * - Command/URL (conditional based on transport)
 * - Arguments
 * - Environment variables
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddServerToRegistryDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

interface ManualServerFormProps {
  onServerAdded: (serverId: string) => void;
  onCancel: () => void;
}

// Removed EnvVar interface - now using simple string state

export function ManualServerForm({
  onServerAdded,
  onCancel,
}: ManualServerFormProps) {
  const workspaceId = useWorkspaceId();

  if (!workspaceId) {
    console.error('No workspace ID found');
    return;
  }

  const [addServerToRegistry] = useMutation(AddServerToRegistryDocument, {
    refetchQueries: ['GetRegistryServers'],
    onError: (err) => {
      console.error('[ManualServerForm] Add server error:', err);
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repositoryUrl: '',
    version: '1.0.0',
    transportType: 'STDIO' as 'STDIO' | 'SSE' | 'STREAMABLE_HTTP',
    command: '',
    argsText: '', // Space-separated arguments as single string
    url: '',
  });

  const [envVarsText, setEnvVarsText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      // Parse arguments from space-separated string
      const args = formData.argsText
        .split(/\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Parse environment variables from KEY=value lines
      const envVars = envVarsText
        .split('\n')
        .filter(line => line.trim() && line.includes('='))
        .map(line => {
          const [key, ...valueParts] = line.split('=');
          return { key: key.trim(), value: valueParts.join('=').trim() };
        });

      let packages = null;
      let remotes = null;

      // Build config using official MCP registry Package/Transport schema
      if (formData.transportType === 'STDIO') {
        // Use official Package schema for STDIO
        const packageObj = {
          identifier: formData.name,
          version: formData.version,
          registryType: 'npm',
          transport: {
            type: 'stdio',
          },
          ...(envVars.length > 0 && {
            environmentVariables: envVars.map(({ key, value }) => ({
              name: key,
              value: value,
              isRequired: false,
              isSecret: false,
            })),
          }),
          ...(formData.command && {
            runtimeArguments: [{
              type: 'string',
              value: formData.command,
              name: 'command',
            }],
          }),
          ...(args.length > 0 && {
            packageArguments: args.map((arg, idx) => ({
              type: 'string',
              value: arg,
              name: `arg${idx}`,
            })),
          }),
        };
        packages = JSON.stringify([packageObj]);
      } else {
        // Use official Transport schema for SSE/STREAM
        const remoteObj = {
          type: formData.transportType === 'SSE' ? 'sse' : 'streamableHttp',
          url: formData.url,
        };
        remotes = JSON.stringify([remoteObj]);
      }

      const result = await addServerToRegistry({
        variables: {
          workspaceId: workspaceId,
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

  const isValid = formData.name.trim() && formData.description.trim() &&
    (formData.transportType === 'STDIO' ? formData.command.trim() : formData.url.trim());

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure a custom MCP server with your own settings.
        </p>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Server Name *</Label>
            <Input
              id="name"
              placeholder="my-custom-server"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what this server does..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, repositoryUrl: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              placeholder="1.0.0"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            />
          </div>
        </div>

        {/* Transport Configuration */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <Label htmlFor="transportType">Transport Type *</Label>
            <Select
              value={formData.transportType}
              onValueChange={(value: 'STDIO' | 'SSE' | 'STREAMABLE_HTTP') =>
                setFormData(prev => ({ ...prev, transportType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STDIO">STDIO (Local Process)</SelectItem>
                <SelectItem value="SSE">SSE (Server-Sent Events)</SelectItem>
                <SelectItem value="STREAMABLE_HTTP">Streamable HTTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.transportType === 'STDIO' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="command">Command *</Label>
                <Input
                  id="command"
                  placeholder="node"
                  value={formData.command}
                  onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="args">Arguments (optional)</Label>
                <Input
                  id="args"
                  placeholder="index.js --port 8080"
                  value={formData.argsText}
                  onChange={(e) => setFormData(prev => ({ ...prev, argsText: e.target.value }))}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter space-separated arguments
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="envVars">Environment Variables (optional)</Label>
                <Textarea
                  id="envVars"
                  placeholder="API_KEY=your_key_here&#10;DEBUG=true&#10;PORT=3000"
                  value={envVarsText}
                  onChange={(e) => setEnvVarsText(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter one environment variable per line in KEY=value format
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="url">
                {formData.transportType === 'SSE' ? 'Server URL *' : 'HTTP Endpoint URL *'}
              </Label>
              <Input
                id="url"
                type="url"
                placeholder={
                  formData.transportType === 'SSE'
                    ? 'https://example.com/mcp'
                    : 'https://example.com/api/mcp'
                }
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                required
              />
              {formData.transportType === 'STREAMABLE_HTTP' && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  The HTTP endpoint for streaming MCP protocol messages
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
