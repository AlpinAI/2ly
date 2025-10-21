/**
 * RegistryForm Component
 *
 * WHY: Form for adding new MCP registries
 *
 * WHAT IT SHOWS:
 * - Input fields for registry name and upstream URL
 * - Submit button with loading state
 * - Form validation and disabled states
 */

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegistryFormProps {
  onSubmit: (name: string, upstreamUrl: string) => Promise<void>;
  isLoading: boolean;
}

export function RegistryForm({ onSubmit, isLoading }: RegistryFormProps) {
  const [name, setName] = useState('');
  const [upstreamUrl, setUpstreamUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !upstreamUrl.trim()) return;

    await onSubmit(name.trim(), upstreamUrl.trim());

    // Clear form on success
    setName('');
    setUpstreamUrl('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Registry Name</Label>
          <Input
            id="name"
            placeholder="Official MCP Registry"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="upstreamUrl">Upstream URL</Label>
          <Input
            id="upstreamUrl"
            placeholder="https://registry.modelcontextprotocol.io/v0/servers"
            value={upstreamUrl}
            onChange={(e) => setUpstreamUrl(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading || !name.trim() || !upstreamUrl.trim()}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Add Registry
          </>
        )}
      </Button>
    </form>
  );
}
