/**
 * AI Settings Section Component
 *
 * WHY: Configure AI provider (OpenAI or Anthropic) and API keys for workspace.
 * Enables AI-powered features like tool set suggestions.
 *
 * FEATURES:
 * - Select AI provider (OpenAI or Anthropic)
 * - Select model from dropdown
 * - Input and validate API keys
 * - Encrypted storage in Dgraph
 * - Delete configuration
 * - Loading and error states
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Brain, Loader2, Trash2, Save, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { SettingsSection } from './settings-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  GetAiConfigDocument,
  SetAiConfigDocument,
  DeleteAiConfigDocument,
  AiProvider,
} from '@/graphql/generated/graphql';

const OPENAI_MODELS = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

const ANTHROPIC_MODELS = [
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
];

export function AISettingsSection() {
  const workspaceId = useWorkspaceId();

  const [provider, setProvider] = useState<AiProvider>(AiProvider.Openai);
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Query existing config
  const { data, loading: queryLoading, refetch } = useQuery(GetAiConfigDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  // Mutations
  const [setAIConfig, { loading: saveLoading, error: saveError }] = useMutation(SetAiConfigDocument);
  const [deleteAIConfig, { loading: deleteLoading }] = useMutation(DeleteAiConfigDocument);

  // Load existing config
  useEffect(() => {
    if (data?.getAIConfig) {
      setProvider(data.getAIConfig.provider);
      setModel(data.getAIConfig.model);
      setHasExistingConfig(true);
      setApiKey(''); // Don't show existing API key
    }
  }, [data]);

  // Update model list when provider changes
  useEffect(() => {
    const models = provider === AiProvider.Openai ? OPENAI_MODELS : ANTHROPIC_MODELS;
    if (!model || !models.find((m) => m.value === model)) {
      setModel(models[0].value);
    }
  }, [provider, model]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSave = async () => {
    if (!apiKey && !hasExistingConfig) {
      return; // API key required for new config
    }

    if (!workspaceId) return;

    try {
      await setAIConfig({
        variables: {
          workspaceId,
          provider,
          model,
          apiKey: apiKey || 'UNCHANGED', // Use placeholder if not changing key
        },
      });

      setSuccessMessage('AI configuration saved successfully!');
      setApiKey(''); // Clear API key field
      await refetch();
    } catch (error) {
      console.error('Failed to save AI config:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your AI configuration?')) {
      return;
    }

    if (!workspaceId) return;

    try {
      await deleteAIConfig({
        variables: { workspaceId },
      });

      setProvider(AiProvider.Openai);
      setModel(OPENAI_MODELS[0].value);
      setApiKey('');
      setHasExistingConfig(false);
      setSuccessMessage('AI configuration deleted successfully!');
      await refetch();
    } catch (error) {
      console.error('Failed to delete AI config:', error);
    }
  };

  const availableModels = provider === AiProvider.Openai ? OPENAI_MODELS : ANTHROPIC_MODELS;
  const isLoading = queryLoading || saveLoading || deleteLoading;
  const canSave = (hasExistingConfig || apiKey.trim().length > 0) && !isLoading;

  return (
    <SettingsSection
      title="AI Configuration"
      description="Configure AI provider and API keys for intelligent tool suggestions."
      icon={Brain}
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your API keys are encrypted before being stored. We use a bring-your-own-license (BYOL) approach - you
            provide your own OpenAI or Anthropic API key.
          </AlertDescription>
        </Alert>

        {/* Success Message */}
        {successMessage && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError.message}</AlertDescription>
          </Alert>
        )}

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">AI Provider</Label>
          <Select value={provider} onValueChange={(value) => setProvider(value as AiProvider)} disabled={isLoading}>
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AiProvider.Openai}>OpenAI</SelectItem>
              <SelectItem value={AiProvider.Anthropic}>Anthropic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={model} onValueChange={setModel} disabled={isLoading}>
            <SelectTrigger id="model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder={hasExistingConfig ? 'Leave empty to keep existing key' : 'Enter your API key'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {provider === AiProvider.Openai
              ? 'Get your API key from platform.openai.com'
              : 'Get your API key from console.anthropic.com'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={!canSave} className="gap-2">
            {saveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            {hasExistingConfig ? 'Update Configuration' : 'Save Configuration'}
          </Button>

          {hasExistingConfig && (
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading} className="gap-2">
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Delete Configuration
            </Button>
          )}
        </div>

        {/* Current Status */}
        {hasExistingConfig && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Configuration</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>
                Provider: <span className="font-medium">{data?.getAIConfig?.provider}</span>
              </p>
              <p>
                Model: <span className="font-medium">{data?.getAIConfig?.model}</span>
              </p>
              <p>
                Last Updated:{' '}
                <span className="font-medium">
                  {data?.getAIConfig?.updatedAt ? new Date(data.getAIConfig.updatedAt).toLocaleString() : 'N/A'}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
