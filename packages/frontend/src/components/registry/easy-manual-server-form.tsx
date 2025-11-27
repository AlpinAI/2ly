/**
 * EasyManualServerForm Component
 *
 * WHY: Simple form for quickly adding MCP servers to the private registry.
 * Designed for common use cases where users don't need advanced configuration.
 *
 * KEY DIFFERENCE from Advanced mode:
 * - packageArguments are POSITIONAL CONSTANTS (type: "positional", value only)
 * - No configurable arguments in the Configure step
 * - Environment variables and headers become configurable with defaults
 *
 * FIELDS:
 * - Basic: name, description, repositoryUrl, version
 * - Transport: STDIO | SSE | STREAMABLE_HTTP
 * - STDIO: command, args (space-separated), env vars (KEY=value)
 * - SSE/STREAM: URL, headers (KEY=value)
 */

import { useState } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Loader2, Sparkles } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AddServerToRegistryDocument, AnalyzeRepositoryDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

interface EasyManualServerFormProps {
  onServerAdded: (serverId: string) => void;
  onCancel: () => void;
}

type TransportType = 'STDIO' | 'SSE' | 'STREAMABLE_HTTP';

export function EasyManualServerForm({
  onServerAdded,
  onCancel,
}: EasyManualServerFormProps) {
  const workspaceId = useWorkspaceId();

  if (!workspaceId) {
    console.error('No workspace ID found');
    return;
  }

  const [addServerToRegistry] = useMutation(AddServerToRegistryDocument, {
    refetchQueries: ['GetRegistryServers'],
    onError: (err) => {
      console.error('[EasyManualServerForm] Add server error:', err);
    },
  });

  const [analyzeRepository, { loading: analyzing, error: analyzeError }] = useLazyQuery(AnalyzeRepositoryDocument);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repositoryUrl: '',
    version: '1.0.0',
    transportType: 'STDIO' as TransportType,
    // STDIO fields
    command: '',
    argsText: '', // Space-separated arguments
    envVarsText: '', // KEY=value per line
    // SSE/STREAM fields
    url: '',
    headersText: '', // KEY=value per line
  });

  const handleAnalyzeRepository = async () => {
    if (!formData.repositoryUrl.trim() || !workspaceId) return;

    try {
      const result = await analyzeRepository({
        variables: {
          workspaceId,
          repositoryUrl: formData.repositoryUrl.trim(),
        },
      });

      const analysis = result.data?.analyzeRepository;
      if (!analysis) {
        console.error('No analysis data returned');
        return;
      }

      // Auto-fill form with AI analysis results
      setFormData((prev) => ({
        ...prev,
        name: analysis.name || prev.name,
        description: analysis.description || prev.description,
        version: analysis.version || prev.version,
        transportType: (analysis.transportType as TransportType) || prev.transportType,
        // STDIO fields
        command: analysis.command || prev.command,
        argsText: analysis.args?.join(' ') || prev.argsText,
        envVarsText:
          analysis.envVars?.map((env) => `${env.key}${env.value ? `=${env.value}` : ''}`).join('\n') ||
          prev.envVarsText,
        // SSE/STREAM fields
        url: analysis.url || prev.url,
        headersText: analysis.headers?.map((h) => `${h.key}=${h.value}`).join('\n') || prev.headersText,
      }));
    } catch (error) {
      console.error('Failed to analyze repository:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      let packages = null;
      let remotes = null;

      if (formData.transportType === 'STDIO') {
        // Parse arguments from space-separated string
        const args = formData.argsText
          .split(/\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        // Parse environment variables from KEY=value or KEY lines
        const envVars = formData.envVarsText
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine.includes('=')) {
              // KEY format (no equals) - configurable variable with no default
              return { key: trimmedLine, value: '' };
            }
            // KEY=value or KEY= format
            const [key, ...valueParts] = trimmedLine.split('=');
            return { key: key.trim(), value: valueParts.join('=').trim() };
          });

        // Build Package following official MCP registry schema
        // For Easy Manual: identifier IS the command, registryType is "none"
        const packageObj = {
          identifier: formData.command,
          version: formData.version,
          registryType: 'none',
          transport: {
            type: 'stdio',
          },
          // Environment variables - fixed values (not configurable)
          ...(envVars.length > 0 && {
            environmentVariables: envVars.map(({ key, value }) => ({
              name: key,
              // Set value directly to make it non-configurable
              value: value || undefined,
              isRequired: false,
              isSecret: false,
            })),
          }),
          // Package arguments - POSITIONAL CONSTANTS (no name, no isRequired)
          ...(args.length > 0 && {
            packageArguments: args.map((arg) => ({
              type: 'positional',
              value: arg,
              // NO name property - makes it non-configurable
              // NO isRequired property
            })),
          }),
        };

        packages = JSON.stringify([packageObj]);
      } else {
        // SSE or STREAMABLE_HTTP
        // Parse headers from KEY=value lines
        const headers = formData.headersText
          .split('\n')
          .filter((line) => line.trim() && line.includes('='))
          .map((line) => {
            const [key, ...valueParts] = line.split('=');
            return { key: key.trim(), value: valueParts.join('=').trim() };
          });

        // Build Transport following official MCP registry schema
        const remoteObj: Record<string, unknown> = {
          type: formData.transportType === 'SSE' ? 'sse' : 'streamableHttp',
          url: formData.url,
        };

        // Headers - fixed values (not configurable)
        if (headers.length > 0) {
          remoteObj.headers = headers.map(({ key, value }) => ({
            name: key,
            value: value || undefined,
            isRequired: false,
            // Detect if it might be secret (common header names)
            isSecret: /auth|token|key|secret|password/i.test(key),
          }));
        }

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

  // Form validation
  const isValid =
    formData.name.trim() &&
    formData.description.trim() &&
    (formData.transportType === 'STDIO' ? formData.command.trim() : formData.url.trim());

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Quick setup for common MCP servers. Arguments and environment variables will use fixed values.
        </p>

        {/* AI Analysis Error */}
        {analyzeError && (
          <Alert variant="destructive">
            <AlertDescription>
              {analyzeError.message.includes('AI configuration not found')
                ? 'Please configure your AI settings in the Settings page before using this feature.'
                : `Failed to analyze repository: ${analyzeError.message}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Server Name *</Label>
            <Input
              id="name"
              placeholder="my-custom-server"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
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
            <Label htmlFor="repositoryUrl">Repository URL</Label>
            <div className="flex gap-2">
              <Input
                id="repositoryUrl"
                type="url"
                placeholder="https://github.com/..."
                value={formData.repositoryUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, repositoryUrl: e.target.value }))}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAnalyzeRepository}
                disabled={!formData.repositoryUrl.trim() || analyzing}
                className="flex-shrink-0 gap-2"
                title="Analyze repository with AI"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Provide a GitHub repository URL and click "Analyze" to auto-fill form fields with AI
            </p>
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

        {/* Transport Configuration */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <Label htmlFor="transportType">Transport Type *</Label>
            <Select
              value={formData.transportType}
              onValueChange={(value: TransportType) =>
                setFormData((prev) => ({ ...prev, transportType: value }))
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, command: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="args">Arguments (optional)</Label>
                <Input
                  id="args"
                  placeholder="index.js --port 8080"
                  value={formData.argsText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, argsText: e.target.value }))}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Space-separated arguments. These will be constant values. Use the Advanced mode for configurable arguments.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="envVars">Environment Variables (optional)</Label>
                <Textarea
                  id="envVars"
                  placeholder={'API_KEY=your_key_here\nDEBUG=true\nPORT=3000'}
                  value={formData.envVarsText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, envVarsText: e.target.value }))}
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  One per line. KEY=value for constants, KEY or KEY= for configurable values.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="url">
                  {formData.transportType === 'SSE' ? 'Server URL *' : 'HTTP Endpoint URL *'}
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder={
                    formData.transportType === 'SSE' ? 'https://example.com/mcp' : 'https://example.com/api/mcp'
                  }
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers">Headers (optional)</Label>
                <Textarea
                  id="headers"
                  placeholder={'Authorization=Bearer your_token\nContent-Type=application/json'}
                  value={formData.headersText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, headersText: e.target.value }))}
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  One per line in KEY=value format. These will be fixed values.
                </p>
              </div>
            </>
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
