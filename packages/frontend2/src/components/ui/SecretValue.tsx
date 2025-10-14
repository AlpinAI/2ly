/**
 * SecretValue Component
 *
 * WHY: Displays sensitive values (passwords, API keys) with reveal/hide toggle.
 * Used in Servers Page to show MCP server configuration secrets.
 *
 * ARCHITECTURE:
 * - Shows masked value by default (*****)
 * - Eye/EyeOff icon button to toggle visibility
 * - Accessible button with aria-label
 * - Monospace font for technical values
 *
 * USAGE:
 * ```tsx
 * <SecretValue value="sk-1234567890abcdef" />
 * ```
 */

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface SecretValueProps {
  value: string;
  maskLength?: number;
  className?: string;
}

export function SecretValue({ value, maskLength = 20, className }: SecretValueProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const maskedValue = '*'.repeat(Math.min(maskLength, value.length));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <code className="flex-1 text-sm bg-muted px-2 py-1 rounded font-mono">
        {isVisible ? value : maskedValue}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => setIsVisible(!isVisible)}
        aria-label={isVisible ? 'Hide value' : 'Show value'}
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
