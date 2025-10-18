/**
 * ConfigFieldInput Component
 *
 * WHY: Reusable input component for dynamic MCP server configuration fields.
 * Handles string inputs (with password toggle), boolean dropdowns, and choice selects.
 *
 * ARCHITECTURE:
 * - Renders appropriate input based on field type
 * - Secret fields have password toggle
 * - Required fields show red asterisk
 * - Consistent styling with Radix UI components
 */

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConfigField } from '@/lib/mcpConfigHelpers';

interface ConfigFieldInputProps {
  field: ConfigField;
  value: string;
  onChange: (value: string) => void;
}

export function ConfigFieldInput({ field, value, onChange }: ConfigFieldInputProps) {
  const [showSecret, setShowSecret] = useState(false);

  const renderInput = () => {
    switch (field.type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );

      case 'choices':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <option value="">Select...</option>
            {field.choices?.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        );

      case 'string':
      default:
        if (field.secret) {
          return (
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.default || ''}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                aria-label={showSecret ? 'Hide value' : 'Show value'}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          );
        }
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.default || ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-sm font-medium text-gray-900 dark:text-white">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {field.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
      )}
      <div id={field.name}>{renderInput()}</div>
    </div>
  );
}
