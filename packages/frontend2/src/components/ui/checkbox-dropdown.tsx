/**
 * CheckboxDropdown Component
 *
 * WHY: Reusable multi-select dropdown filter using Radix UI primitives.
 * Used across Servers, Tools, and Agents pages for filtering.
 *
 * ARCHITECTURE:
 * - Radix Popover for accessible dropdown behavior
 * - Radix Checkbox for accessible checkboxes
 * - Consistent with frontend2 design system (Tailwind + Radix)
 * - Click outside to close
 * - Keyboard accessible
 *
 * USAGE:
 * ```tsx
 * <CheckboxDropdown
 *   label="Filter by Transport"
 *   placeholder="Select transports..."
 *   items={[
 *     { id: 'STREAM', label: 'Stream' },
 *     { id: 'STDIO', label: 'STDIO' },
 *   ]}
 *   selectedIds={selectedTransports}
 *   onChange={setSelectedTransports}
 * />
 * ```
 */

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { cn } from '@/lib/utils';

export interface CheckboxDropdownItem {
  id: string;
  label: string;
}

export interface CheckboxDropdownProps {
  label: string;
  placeholder?: string;
  items: CheckboxDropdownItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export function CheckboxDropdown({
  label,
  placeholder,
  items,
  selectedIds,
  onChange,
  className,
}: CheckboxDropdownProps) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (itemId: string) => {
    const isSelected = selectedIds.includes(itemId);
    const nextSelected = isSelected
      ? selectedIds.filter((id) => id !== itemId)
      : [...selectedIds, itemId];
    onChange(nextSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      onChange([]);
    } else {
      onChange(items.map((item) => item.id));
    }
  };

  const selectedCount = selectedIds.length;
  const buttonLabel =
    selectedCount === 0
      ? placeholder || label
      : selectedCount === 1
        ? items.find((item) => item.id === selectedIds[0])?.label || `${selectedCount} selected`
        : `${selectedCount} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
        >
          <span className="truncate">{buttonLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-[300px] overflow-auto">
          {items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No options available
            </div>
          ) : (
            <>
              {/* Select All option */}
              {items.length > 1 && (
                <>
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
                    onClick={handleSelectAll}
                  >
                    <Checkbox
                      checked={selectedIds.length === items.length}
                      onCheckedChange={handleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>
                  <div className="h-px bg-border my-1" />
                </>
              )}

              {/* Individual items */}
              {items.map((item) => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
                    onClick={() => handleToggle(item.id)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm flex-1">{item.label}</span>
                    {isChecked && <Check className="h-4 w-4 text-primary" />}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
