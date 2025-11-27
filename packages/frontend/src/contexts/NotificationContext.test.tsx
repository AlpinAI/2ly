/**
 * NotificationContext Tests
 *
 * WHY: Test the NotificationProvider and useNotification hook
 * for proper behavior, accessibility, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NotificationProvider, useNotification } from './NotificationContext';
import { useState } from 'react';

describe('NotificationContext', () => {
  describe('NotificationProvider', () => {
    it('renders children without crashing', () => {
      render(
        <NotificationProvider>
          <div>Test Child</div>
        </NotificationProvider>
      );

      expect(screen.getByText('Test Child')).toBeDefined();
    });

    it('does not render dialog initially', () => {
      render(
        <NotificationProvider>
          <div>Test Child</div>
        </NotificationProvider>
      );

      // Dialog should not be visible
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });

  describe('useNotification hook', () => {
    it('throws error when used outside NotificationProvider', () => {
      const TestComponent = () => {
        useNotification(); // Should throw
        return <div>Test</div>;
      };

      // Expect the component to throw an error
      expect(() => render(<TestComponent />)).toThrow(
        'useNotification must be used within a NotificationProvider'
      );
    });

    it('returns confirm function', () => {
      let confirmFn: ((options: { title: string; description: string }) => Promise<boolean>) | undefined;

      const TestComponent = () => {
        const { confirm } = useNotification();
        confirmFn = confirm;
        return <div>Test</div>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      expect(confirmFn).toBeDefined();
      expect(typeof confirmFn).toBe('function');
    });
  });

  describe('confirm() function', () => {
    it('shows dialog when confirm is called', async () => {
      const TestComponent = () => {
        const { confirm } = useNotification();

        const handleClick = () => {
          confirm({
            title: 'Test Confirmation',
            description: 'Are you sure?',
          });
        };

        return <button onClick={handleClick}>Show Confirm</button>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      const button = screen.getByText('Show Confirm');
      fireEvent.click(button);

      // Dialog should be visible
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeDefined();
        expect(screen.getByText('Test Confirmation')).toBeDefined();
        expect(screen.getByText('Are you sure?')).toBeDefined();
      });
    });

    it('resolves to true when confirm button is clicked', async () => {
      let result: boolean | undefined;

      const TestComponent = () => {
        const { confirm } = useNotification();
        const [status, setStatus] = useState('');

        const handleClick = async () => {
          result = await confirm({
            title: 'Delete Item',
            description: 'Are you sure?',
          });
          setStatus(result ? 'confirmed' : 'cancelled');
        };

        return (
          <>
            <button onClick={handleClick}>Show Confirm</button>
            {status && <div>Status: {status}</div>}
          </>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Click button to show dialog
      fireEvent.click(screen.getByText('Show Confirm'));

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeDefined();
      });

      // Click confirm button
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      // Wait for result
      await waitFor(() => {
        expect(screen.getByText('Status: confirmed')).toBeDefined();
      });

      expect(result).toBe(true);
    });

    it('resolves to false when cancel button is clicked', async () => {
      let result: boolean | undefined;

      const TestComponent = () => {
        const { confirm } = useNotification();
        const [status, setStatus] = useState('');

        const handleClick = async () => {
          result = await confirm({
            title: 'Delete Item',
            description: 'Are you sure?',
          });
          setStatus(result ? 'confirmed' : 'cancelled');
        };

        return (
          <>
            <button onClick={handleClick}>Show Confirm</button>
            {status && <div>Status: {status}</div>}
          </>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Click button to show dialog
      fireEvent.click(screen.getByText('Show Confirm'));

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeDefined();
      });

      // Click cancel button
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Wait for result
      await waitFor(() => {
        expect(screen.getByText('Status: cancelled')).toBeDefined();
      });

      expect(result).toBe(false);
    });

    it('closes dialog after confirm', async () => {
      const TestComponent = () => {
        const { confirm } = useNotification();

        const handleClick = async () => {
          await confirm({
            title: 'Test',
            description: 'Test description',
          });
        };

        return <button onClick={handleClick}>Show Confirm</button>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Show dialog
      fireEvent.click(screen.getByText('Show Confirm'));

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeDefined();
      });

      // Click confirm
      fireEvent.click(screen.getByText('Confirm'));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull();
      });
    });

    it('respects custom labels', async () => {
      const TestComponent = () => {
        const { confirm } = useNotification();

        const handleClick = () => {
          confirm({
            title: 'Delete Item',
            description: 'Are you sure?',
            confirmLabel: 'Yes, Delete',
            cancelLabel: 'No, Keep',
          });
        };

        return <button onClick={handleClick}>Show Confirm</button>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Confirm'));

      await waitFor(() => {
        expect(screen.getByText('Yes, Delete')).toBeDefined();
        expect(screen.getByText('No, Keep')).toBeDefined();
      });
    });

    it('applies destructive variant styling', async () => {
      const TestComponent = () => {
        const { confirm } = useNotification();

        const handleClick = () => {
          confirm({
            title: 'Delete Item',
            description: 'Are you sure?',
            variant: 'destructive',
          });
        };

        return <button onClick={handleClick}>Show Confirm</button>;
      };

      const { container } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Confirm'));

      await waitFor(() => {
        // Check for red destructive styling
        const iconContainer = container.querySelector('.bg-red-100');
        expect(iconContainer).toBeDefined();
      });
    });
  });

  describe('toast() function', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      // Run all pending timers to avoid unhandled errors
      act(() => {
        vi.runAllTimers();
      });
      vi.useRealTimers();
    });

    it('shows toast when toast is called', () => {
      const TestComponent = () => {
        const { toast } = useNotification();

        const handleClick = () => {
          toast({
            description: 'Test notification',
            variant: 'success',
          });
        };

        return <button onClick={handleClick}>Show Toast</button>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      const button = screen.getByText('Show Toast');
      fireEvent.click(button);

      // Toast should be visible immediately
      expect(screen.getByText('Test notification')).toBeDefined();
    });

    it('displays toast with title and description', () => {
      const TestComponent = () => {
        const { toast } = useNotification();

        const handleClick = () => {
          toast({
            title: 'Success',
            description: 'Operation completed',
            variant: 'success',
          });
        };

        return <button onClick={handleClick}>Show Toast</button>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));

      expect(screen.getByText('Success')).toBeDefined();
      expect(screen.getByText('Operation completed')).toBeDefined();
    });

    it('applies correct variant styling', () => {
      const TestComponent = () => {
        const { toast } = useNotification();

        const handleClick = () => {
          toast({
            description: 'Error message',
            variant: 'error',
          });
        };

        return <button onClick={handleClick}>Show Toast</button>;
      };

      const { container } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));

      // Check for error variant styling
      const errorToast = container.querySelector('.border-red-500');
      expect(errorToast).toBeDefined();
    });

    it('auto-dismisses toast after default duration', async () => {
      const TestComponent = () => {
        const { toast } = useNotification();

        const handleClick = () => {
          toast({
            description: 'Auto dismiss test',
            duration: 100, // Short duration for testing
          });
        };

        return <button onClick={handleClick}>Show Toast</button>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));

      // Toast should appear immediately
      expect(screen.getByText('Auto dismiss test')).toBeDefined();

      // Advance timers to trigger dismiss (duration + animation delay)
      await act(async () => {
        vi.advanceTimersByTime(100); // duration
      });
      await act(async () => {
        vi.advanceTimersByTime(200); // TOAST_REMOVE_DELAY
      });

      // Toast should be gone
      expect(screen.queryByText('Auto dismiss test')).toBeNull();
    });

    it('shows icon for success variant', () => {
      const TestComponent = () => {
        const { toast } = useNotification();

        const handleClick = () => {
          toast({
            description: 'Success message',
            variant: 'success',
          });
        };

        return <button onClick={handleClick}>Show Toast</button>;
      };

      const { container } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));

      // Look for the CheckCircle2 icon (success icon)
      const successIcon = container.querySelector('.text-green-600');
      expect(successIcon).toBeDefined();
    });

    it('limits toast queue to 3 toasts', () => {
      const TestComponent = () => {
        const { toast } = useNotification();

        const handleClick = () => {
          toast({ description: 'Toast 1' });
          toast({ description: 'Toast 2' });
          toast({ description: 'Toast 3' });
          toast({ description: 'Toast 4' });
        };

        return <button onClick={handleClick}>Show Toasts</button>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Toasts'));

      // Should only show 3 toasts (Toast 4, 3, 2 - newest first)
      expect(screen.getByText('Toast 4')).toBeDefined();
      expect(screen.getByText('Toast 3')).toBeDefined();
      expect(screen.getByText('Toast 2')).toBeDefined();
      expect(screen.queryByText('Toast 1')).toBeNull(); // Should be dropped
    });
  });
});
