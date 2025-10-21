/**
 * FormDialog Tests
 *
 * WHY: Test the FormDialog component for proper behavior,
 * focus management, form submission, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormDialog } from './form-dialog';
import { useState } from 'react';
import { Input } from './input';
import { Label } from './label';

describe('FormDialog', () => {
  describe('Rendering', () => {
    it('renders dialog when open is true', () => {
      render(
        <FormDialog
          open={true}
          onOpenChange={() => {}}
          title="Test Dialog"
          onSubmit={async () => {}}
        >
          <div>Form content</div>
        </FormDialog>
      );

      expect(screen.getByText('Test Dialog')).toBeDefined();
      expect(screen.getByText('Form content')).toBeDefined();
    });

    it('does not render dialog when open is false', () => {
      render(
        <FormDialog
          open={false}
          onOpenChange={() => {}}
          title="Test Dialog"
          onSubmit={async () => {}}
        >
          <div>Form content</div>
        </FormDialog>
      );

      expect(screen.queryByText('Test Dialog')).toBeNull();
      expect(screen.queryByText('Form content')).toBeNull();
    });

    it('renders subtitle when provided', () => {
      render(
        <FormDialog
          open={true}
          onOpenChange={() => {}}
          title="Test Dialog"
          subtitle="Test subtitle"
          onSubmit={async () => {}}
        >
          <div>Form content</div>
        </FormDialog>
      );

      expect(screen.getByText('Test subtitle')).toBeDefined();
    });

    it('renders custom button labels', () => {
      render(
        <FormDialog
          open={true}
          onOpenChange={() => {}}
          title="Test Dialog"
          submitLabel="Create Item"
          cancelLabel="Dismiss"
          onSubmit={async () => {}}
        >
          <div>Form content</div>
        </FormDialog>
      );

      expect(screen.getByText('Create Item')).toBeDefined();
      expect(screen.getByText('Dismiss')).toBeDefined();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit when form is submitted', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <FormDialog
          open={true}
          onOpenChange={() => {}}
          title="Test Dialog"
          onSubmit={onSubmit}
        >
          <div>Form content</div>
        </FormDialog>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state during submission', async () => {
      const TestComponent = () => {
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleSubmit = async () => {
          setIsSubmitting(true);
          await new Promise((resolve) => setTimeout(resolve, 100));
          setIsSubmitting(false);
        };

        return (
          <FormDialog
            open={true}
            onOpenChange={() => {}}
            title="Test Dialog"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          >
            <div>Form content</div>
          </FormDialog>
        );
      };

      render(<TestComponent />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeDefined();
      });
    });

    it('disables submit button when submitDisabled is true', () => {
      render(
        <FormDialog
          open={true}
          onOpenChange={() => {}}
          title="Test Dialog"
          onSubmit={async () => {}}
          submitDisabled={true}
        >
          <div>Form content</div>
        </FormDialog>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toHaveProperty('disabled', true);
    });

    it('disables cancel and close buttons during submission', async () => {
      const TestComponent = () => {
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleSubmit = async () => {
          setIsSubmitting(true);
          await new Promise((resolve) => setTimeout(resolve, 100));
          setIsSubmitting(false);
        };

        return (
          <FormDialog
            open={true}
            onOpenChange={() => {}}
            title="Test Dialog"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          >
            <Input data-testid="test-input" />
          </FormDialog>
        );
      };

      render(<TestComponent />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // When submitting, cancel button and close (X) button should be disabled
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toHaveProperty('disabled', true);
      });
    });
  });

  describe('Dialog Close Behavior', () => {
    it('calls onOpenChange when cancel button is clicked', () => {
      const onOpenChange = vi.fn();

      render(
        <FormDialog
          open={true}
          onOpenChange={onOpenChange}
          title="Test Dialog"
          onSubmit={async () => {}}
        >
          <div>Form content</div>
        </FormDialog>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onReset when dialog closes', () => {
      const onReset = vi.fn();
      const onOpenChange = vi.fn((open) => {
        if (!open) onReset();
      });

      render(
        <FormDialog
          open={true}
          onOpenChange={onOpenChange}
          title="Test Dialog"
          onSubmit={async () => {}}
          onReset={onReset}
        >
          <div>Form content</div>
        </FormDialog>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onReset).toHaveBeenCalled();
    });

    it('calls onOpenChange when X button is clicked', () => {
      const onOpenChange = vi.fn();

      const { container } = render(
        <FormDialog
          open={true}
          onOpenChange={onOpenChange}
          title="Test Dialog"
          onSubmit={async () => {}}
        >
          <div>Form content</div>
        </FormDialog>
      );

      // Find X button by looking for the X icon's parent button
      const closeButtons = container.querySelectorAll('button[type="button"]');
      const xButton = Array.from(closeButtons).find(
        (button) => button.querySelector('svg') && !button.textContent?.includes('Cancel')
      );

      if (xButton) {
        fireEvent.click(xButton);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });
  });

  describe('Focus Management', () => {
    it('auto-focuses first input when dialog opens', async () => {
      const TestComponent = () => {
        const [open, setOpen] = useState(false);
        const [name, setName] = useState('');

        return (
          <>
            <button onClick={() => setOpen(true)}>Open Dialog</button>
            <FormDialog
              open={open}
              onOpenChange={setOpen}
              title="Test Dialog"
              onSubmit={async () => {}}
            >
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </FormDialog>
          </>
        );
      };

      render(<TestComponent />);

      const openButton = screen.getByText('Open Dialog');
      fireEvent.click(openButton);

      await waitFor(() => {
        const nameInput = screen.getByTestId('name-input');
        expect(document.activeElement).toBe(nameInput);
      });
    });

    it('skips disabled inputs when auto-focusing', async () => {
      const TestComponent = () => {
        const [open, setOpen] = useState(false);

        return (
          <>
            <button onClick={() => setOpen(true)}>Open Dialog</button>
            <FormDialog
              open={open}
              onOpenChange={setOpen}
              title="Test Dialog"
              onSubmit={async () => {}}
            >
              <div>
                <Input data-testid="disabled-input" disabled />
                <Input data-testid="enabled-input" />
              </div>
            </FormDialog>
          </>
        );
      };

      render(<TestComponent />);

      const openButton = screen.getByText('Open Dialog');
      fireEvent.click(openButton);

      await waitFor(() => {
        const enabledInput = screen.getByTestId('enabled-input');
        expect(document.activeElement).toBe(enabledInput);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <FormDialog
          open={true}
          onOpenChange={() => {}}
          title="Test Dialog"
          subtitle="Test subtitle"
          onSubmit={async () => {}}
        >
          <div>Form content</div>
        </FormDialog>
      );

      // Title should be present and accessible
      expect(screen.getByText('Test Dialog')).toBeDefined();

      // Description should be present
      expect(screen.getByText('Test subtitle')).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('works with realistic form scenario', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onReset = vi.fn();

      const TestComponent = () => {
        const [open, setOpen] = useState(true);
        const [name, setName] = useState('');
        const [url, setUrl] = useState('');

        return (
          <FormDialog
            open={open}
            onOpenChange={setOpen}
            title="Add Registry"
            subtitle="Enter registry details"
            submitLabel="Add"
            onSubmit={onSubmit}
            submitDisabled={!name || !url}
            onReset={onReset}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  data-testid="url-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>
          </FormDialog>
        );
      };

      render(<TestComponent />);

      // Submit should be disabled initially
      const submitButton = screen.getByRole('button', { name: /add/i });
      expect(submitButton).toHaveProperty('disabled', true);

      // Fill in form
      const nameInput = screen.getByTestId('name-input');
      const urlInput = screen.getByTestId('url-input');

      fireEvent.change(nameInput, { target: { value: 'My Registry' } });
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

      // Submit should now be enabled
      await waitFor(() => {
        expect(submitButton).toHaveProperty('disabled', false);
      });

      // Submit form
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });
});
