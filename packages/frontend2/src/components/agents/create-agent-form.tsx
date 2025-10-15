/**
 * Create Agent Form Component
 *
 * WHY: Form for creating new agents (runtimes with 'agent' capability).
 * Used in LinkToolDialog to create agents on-the-fly.
 *
 * FEATURES:
 * - Simple form with name and description fields
 * - Auto-sets capabilities to ['agent']
 * - Loading state during creation
 * - Error handling with user feedback
 * - Calls onSuccess callback after successful creation
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { CreateRuntimeDocument } from '@/graphql/generated/graphql';

export interface CreateAgentFormProps {
  onSuccess: (agentId: string) => void;
  onCancel: () => void;
}

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const workspaceId = useWorkspaceId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createRuntime] = useMutation(CreateRuntimeDocument);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Agent name is required');
      return;
    }

    if (!workspaceId) {
      setError('Workspace not found');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await createRuntime({
        variables: {
          workspaceId,
          name: name.trim(),
          description: description.trim() || '',
          capabilities: ['agent'],
        },
      });

      if (result.data?.createRuntime) {
        onSuccess(result.data.createRuntime.id);
      }
    } catch (err) {
      console.error('Error creating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="agent-name">Agent Name</Label>
        <Input
          id="agent-name"
          placeholder="My New Agent"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isCreating}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-description">Description (optional)</Label>
        <Input
          id="agent-description"
          placeholder="Brief description of this agent"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreating}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isCreating || !name.trim()}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
