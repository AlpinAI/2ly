/**
 * SplitButton Component
 *
 * WHY: Reusable split button pattern combining a primary action button
 * with a dropdown menu trigger. Common pattern for "primary action + options".
 *
 * ARCHITECTURE:
 * - Left button: Primary action (e.g., "Test Server", "Configure")
 * - Right button: Dropdown trigger with ChevronDown icon
 * - Seamlessly connected visual appearance
 * - Uses existing Button and DropdownMenu primitives
 * - Fully typed and accessible
 *
 * USAGE:
 * ```tsx
 * <SplitButton
 *   primaryLabel="Test Server"
 *   onPrimaryAction={handleTest}
 *   dropdownContent={
 *     <>
 *       <DropdownMenuItem>Option 1</DropdownMenuItem>
 *       <DropdownMenuItem>Option 2</DropdownMenuItem>
 *     </>
 *   }
 * />
 * ```
 */

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface SplitButtonProps {
  // Primary button
  primaryLabel: React.ReactNode;
  onPrimaryAction: () => void;
  primaryDisabled?: boolean;

  // Dropdown
  dropdownContent: React.ReactNode;
  dropdownOpen?: boolean;
  onDropdownOpenChange?: (open: boolean) => void;
  dropdownAlign?: 'start' | 'center' | 'end';

  // Shared styling
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;

  // Accessibility
  primaryAriaLabel?: string;
  dropdownAriaLabel?: string;
}

export function SplitButton({
  primaryLabel,
  onPrimaryAction,
  primaryDisabled = false,
  dropdownContent,
  dropdownOpen,
  onDropdownOpenChange,
  dropdownAlign = 'end',
  variant = 'default',
  size = 'default',
  className,
  primaryAriaLabel,
  dropdownAriaLabel = 'Show options',
}: SplitButtonProps) {
  return (
    <div className={cn('flex', className)}>
      {/* Primary Action Button */}
      <Button
        variant={variant}
        size={size}
        onClick={onPrimaryAction}
        disabled={primaryDisabled}
        className="flex-1 rounded-r-none border-r-0"
        aria-label={primaryAriaLabel}
      >
        {primaryLabel}
      </Button>

      {/* Dropdown Trigger Button */}
      <DropdownMenu open={dropdownOpen} onOpenChange={onDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={primaryDisabled}
            className={cn(
              'rounded-l-none px-2',
              variant === 'default' && 'border-l border-l-white/20',
              variant === 'outline' && 'border-l',
              variant === 'secondary' && 'border-l border-l-gray-300 dark:border-l-gray-600'
            )}
            aria-label={dropdownAriaLabel}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={dropdownAlign}>{dropdownContent}</DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
