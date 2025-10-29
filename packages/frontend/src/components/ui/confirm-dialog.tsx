/**
 * ConfirmDialog Component
 *
 * WHY: Provides a consistent, accessible confirmation dialog to replace browser alerts.
 * Built on Radix UI AlertDialog for better UX and accessibility.
 *
 * FEATURES:
 * - Customizable title and description
 * - Support for destructive actions (red styling)
 * - Loading states for async operations
 * - Keyboard navigation and focus management
 * - Dark mode support
 */

import { AlertTriangle } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    // Only close if not controlled by parent's loading state
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-[60]" />
        <AlertDialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800 z-[60]">

          {/* Icon and Title */}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                variant === 'destructive'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  variant === 'destructive'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
              />
            </div>
            <div className="flex-1">
              <AlertDialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <AlertDialog.Cancel asChild>
              <Button 
                variant="outline" 
                disabled={loading}
                className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={variant}
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirm();
                }}
                disabled={loading}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
