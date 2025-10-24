/**
 * ConfigEditor Component
 *
 * WHY: Pure controlled component for editing MCP server configuration fields.
 * Used by both ServerDetail and MCPServerConfigure components.
 *
 * FEATURES:
 * - Renders ConfigFieldInput components for each field
 * - Handles empty state with custom message
 * - Pure controlled component - no internal state or mutations
 * - Parent components handle save/cancel logic
 *
 * USAGE:
 * ```tsx
 * <ConfigEditor
 *   fields={fields}
 *   onFieldChange={handleFieldChange}
 *   emptyMessage="No configuration needed"
 * />
 * ```
 */

import { ConfigFieldInput } from '@/components/tools/config-field-input';
import type { ConfigField } from '@/lib/mcpConfigHelpers';

interface ConfigEditorProps {
  fields: ConfigField[];
  onFieldChange: (fieldName: string, value: string) => void;
  emptyMessage?: string;
}

export function ConfigEditor({ 
  fields,
  onFieldChange,
  emptyMessage = 'No configuration fields'
}: ConfigEditorProps) {
  
  if (fields.length === 0) {
    return (
      <div className="py-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <ConfigFieldInput
          key={field.name}
          field={field}
          value={field.value || ''}
          onChange={(value) => onFieldChange(field.name, value)}
        />
      ))}
    </div>
  );
}

