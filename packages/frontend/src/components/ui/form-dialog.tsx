/**
 * FormDialog Component
 *
 * WHY: Reusable dialog for quick creation of entities with customizable form fields.
 * Provides consistent layout, loading states, and automatic focus management.
 *
 * DESIGN DECISIONS:
 * - Uses children prop pattern for form content (flexible, not over-engineered)
 * - Automatic focus on first input element via onOpenAutoFocus
 * - Consistent header/footer layout matching other dialogs in the app
 * - Form reset callback for cleaning up state when dialog closes
 * - Loading state management with disabled inputs during submission
 *
 * USAGE:
 * ```tsx
 * <FormDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Add Custom MCP Registry"
 *   subtitle="Enter the details for your custom MCP registry"
 *   submitLabel="Add Registry"
 *   onSubmit={handleSubmit}
 *   isSubmitting={isLoading}
 *   submitDisabled={!name || !url}
 *   onReset={() => { setName(''); setUrl(''); }}
 * >
 *   <div className="space-y-4">
 *     <div>
 *       <Label htmlFor="name">Name</Label>
 *       <Input id="name" value={name} onChange={e => setName(e.target.value)} />
 *     </div>
 *   </div>
 * </FormDialog>
 * ```
 */

import { useCallback, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';

export interface FormDialogProps {
  /** Controls whether dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Submit button label (default: "Submit") */
  submitLabel?: string;
  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string;
  /** Submit handler - should return a promise */
  onSubmit: () => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
  /** Whether submit button should be disabled */
  submitDisabled?: boolean;
  /** Form field content */
  children: React.ReactNode;
  /** Optional callback to reset form state when dialog closes */
  onReset?: () => void;
  /** Optional icon to show in submit button */
  submitIcon?: React.ReactNode;
  /** Whether to show cancel button (default: false) */
  showCancel?: boolean;
  /** Optional custom cancel handler */
  onCancel?: () => void;
  /** Size variant for the dialog (default: "md") */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onSubmit,
  isSubmitting = false,
  submitDisabled = false,
  children,
  onReset,
  submitIcon,
  showCancel = false,
  onCancel,
  size = 'md',
}: FormDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // Size class mapping
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting || submitDisabled) return;

      try {
        await onSubmit();
      } catch (error) {
        // Error handling should be done in parent component
        console.error('Form submission error:', error);
      }
    },
    [onSubmit, isSubmitting, submitDisabled]
  );

  // Handle dialog close with reset
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && onReset) {
        onReset();
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, onReset]
  );

  // Auto-focus first input when dialog opens
  const handleOpenAutoFocus = useCallback((e: Event) => {
    e.preventDefault();

    // Small delay to ensure content is rendered
    setTimeout(() => {
      if (formRef.current) {
        const firstInput = formRef.current.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
        );

        if (firstInput) {
          firstInput.focus();
        }
      }
    }, 0);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content
          className={`fixed left-[50%] top-[50%] max-h-[90vh] w-[90vw] ${sizeClasses[size]} translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800 z-50 flex flex-col`}
          onOpenAutoFocus={handleOpenAutoFocus}
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </Dialog.Title>
              <Dialog.Description className={subtitle ? "text-sm text-gray-500 dark:text-gray-400 mt-1" : "sr-only"}>
                {subtitle || "Dialog"}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Form Content - Scrollable */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6">
              <fieldset disabled={isSubmitting} className="space-y-4">
                {children}
              </fieldset>
            </div>

            {/* Footer Actions - Fixed */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
              {showCancel ? (
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
                  {cancelLabel}
                </Button>
              ) : (
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    {cancelLabel}
                  </Button>
                </Dialog.Close>
              )}
              <Button type="submit" disabled={isSubmitting || submitDisabled}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {submitIcon && <span className="mr-2">{submitIcon}</span>}
                    {submitLabel}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
