/**
 * Notification Context
 *
 * WHY: Centralized management for all transient UI notifications.
 * Provides imperative API for confirms and toasts without component-level state.
 *
 * DESIGN DECISIONS:
 * - Promise-based confirm API for natural async/await syntax
 * - Fire-and-forget toast API with auto-dismiss
 * - Single context for all transient UI (confirms, toasts)
 * - Prevents "provider hell" by grouping related concerns
 * - Follows industry patterns (Material-UI SnackbarProvider, Mantine NotificationsProvider)
 *
 * USAGE:
 * ```tsx
 * function Component() {
 *   const { confirm, toast } = useNotification();
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       title: 'Delete Server',
 *       description: 'This cannot be undone',
 *       variant: 'destructive'
 *     });
 *     if (confirmed) {
 *       await deleteServer();
 *       toast({ description: 'Server deleted', variant: 'success' });
 *     }
 *   };
 * }
 * ```
 */

import React, { createContext, useContext, useState, useRef, useCallback, useReducer, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

// Configuration constants
const TOAST_LIMIT = 3;                    // Max simultaneous toasts
const TOAST_DEFAULT_DURATION = 5000;      // 5 seconds
const TOAST_REMOVE_DELAY = 200;           // Cleanup after animation

/**
 * Options for confirm dialog
 */
export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

/**
 * Options for toast notification
 */
export interface ToastOptions {
  title?: string;
  description: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number; // Auto-dismiss duration in ms (default: 5000)
}

/**
 * Internal toast state
 */
interface ToastState {
  id: string;
  title?: string;
  description: string;
  variant: 'default' | 'success' | 'error' | 'warning' | 'info';
  open: boolean;
}

/**
 * Notification Context API
 */
interface NotificationContextType {
  /**
   * Show a confirmation dialog
   * @returns Promise that resolves to true if confirmed, false if cancelled
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;

  /**
   * Show a toast notification
   * @returns void (fire-and-forget)
   */
  toast: (options: ToastOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Internal state for managing the confirm dialog
 */
interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

/**
 * Toast reducer actions
 */
type ToastAction =
  | { type: 'ADD_TOAST'; toast: ToastState }
  | { type: 'UPDATE_TOAST'; id: string; toast: Partial<ToastState> }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'REMOVE_TOAST'; id: string };

/**
 * Toast reducer
 */
function toastReducer(state: ToastState[], action: ToastAction): ToastState[] {
  switch (action.type) {
    case 'ADD_TOAST':
      return [action.toast, ...state].slice(0, TOAST_LIMIT);

    case 'UPDATE_TOAST':
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.toast } : t
      );

    case 'DISMISS_TOAST':
      return state.map((t) =>
        t.id === action.id ? { ...t, open: false } : t
      );

    case 'REMOVE_TOAST':
      return state.filter((t) => t.id !== action.id);

    default:
      return state;
  }
}

/**
 * Generate unique toast ID
 */
let toastCount = 0;
function genToastId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return `toast-${toastCount}`;
}

/**
 * Get icon for toast variant
 */
function getToastIcon(variant: ToastState['variant']) {
  const className = "h-5 w-5 shrink-0";
  switch (variant) {
    case 'success':
      return <CheckCircle2 className={`${className} text-green-600 dark:text-green-400`} />;
    case 'error':
      return <XCircle className={`${className} text-red-600 dark:text-red-400`} />;
    case 'warning':
      return <AlertTriangle className={`${className} text-yellow-600 dark:text-yellow-400`} />;
    case 'info':
      return <Info className={`${className} text-blue-600 dark:text-blue-400`} />;
    default:
      return null;
  }
}

/**
 * NotificationProvider Component
 *
 * WHY: Provides transient UI notification system to entire app.
 * Manages confirm dialog state and toast queue.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
  });

  // Toast state
  const [toasts, dispatchToast] = useReducer(toastReducer, []);

  // Store Promise resolve/reject functions
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  // Store toast timeouts
  const toastTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /**
   * Show confirm dialog and return Promise
   */
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({
        ...options,
        open: true,
      });
    });
  }, []);

  /**
   * Handle confirm button click
   */
  const handleConfirm = useCallback(() => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(true);
      confirmResolveRef.current = null;
    }
    setConfirmState(prev => ({ ...prev, open: false }));
  }, []);

  /**
   * Handle cancel or dialog close
   */
  const handleCancel = useCallback(() => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(false);
      confirmResolveRef.current = null;
    }
    setConfirmState(prev => ({ ...prev, open: false }));
  }, []);

  /**
   * Show toast notification
   */
  const toast = useCallback((options: ToastOptions) => {
    const id = genToastId();
    const duration = options.duration ?? TOAST_DEFAULT_DURATION;

    // Add toast
    dispatchToast({
      type: 'ADD_TOAST',
      toast: {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? 'default',
        open: true,
      },
    });

    // Auto-dismiss after duration
    const timeout = setTimeout(() => {
      dispatchToast({ type: 'DISMISS_TOAST', id });

      // Remove from DOM after animation
      setTimeout(() => {
        dispatchToast({ type: 'REMOVE_TOAST', id });
        toastTimeoutsRef.current.delete(id);
      }, TOAST_REMOVE_DELAY);
    }, duration);

    toastTimeoutsRef.current.set(id, timeout);
  }, []);

  /**
   * Handle toast close
   */
  const handleToastClose = useCallback((id: string) => {
    // Clear auto-dismiss timeout
    const timeout = toastTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeoutsRef.current.delete(id);
    }

    // Dismiss toast
    dispatchToast({ type: 'DISMISS_TOAST', id });

    // Remove from DOM after animation
    setTimeout(() => {
      dispatchToast({ type: 'REMOVE_TOAST', id });
    }, TOAST_REMOVE_DELAY);
  }, []);

  /**
   * Cleanup: Clear all timeouts and reject pending confirms on unmount
   */
  useEffect(() => {
    return () => {
      // Clear confirm promise
      if (confirmResolveRef.current) {
        confirmResolveRef.current(false);
      }

      // Clear toast timeouts
      toastTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      toastTimeoutsRef.current.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ confirm, toast }}>
      {children}

      {/* Confirm Dialog - rendered once, reused for all confirms */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        variant={confirmState.variant}
        onConfirm={handleConfirm}
      />

      {/* Toast Notifications - stacked, max 3 */}
      <ToastProvider>
        {toasts.map((t) => {
          const icon = getToastIcon(t.variant);

          return (
            <Toast
              key={t.id}
              open={t.open}
              onOpenChange={(open) => {
                if (!open) {
                  handleToastClose(t.id);
                }
              }}
              variant={t.variant}
            >
              <div className="flex items-start gap-3">
                {icon}
                <div className="grid gap-1 flex-1">
                  {t.title && <ToastTitle>{t.title}</ToastTitle>}
                  <ToastDescription>{t.description}</ToastDescription>
                </div>
              </div>
              <ToastClose />
            </Toast>
          );
        })}
        <ToastViewport />
      </ToastProvider>
    </NotificationContext.Provider>
  );
}

/**
 * useNotification Hook
 *
 * WHY: Provides type-safe access to notification system.
 * Throws error if used outside provider to catch bugs early.
 *
 * @returns Notification API with confirm and toast methods
 * @throws Error if used outside NotificationProvider
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
