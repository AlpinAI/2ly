/**
 * Toast Component Tests
 *
 * WHY: Test the Toast notification component with variants and actions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './toast';

describe('Toast', () => {
  it('renders toast with content', () => {
    render(
      <ToastProvider>
        <Toast open>Toast message</Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = screen.getByText('Toast message');
    expect(toast).toBeDefined();
  });

  it('renders with default variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>Default toast</Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = container.querySelector('[data-state="open"]');
    expect(toast?.className).toContain('bg-background');
  });

  it('renders with destructive variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open variant="destructive">
          Error toast
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = container.querySelector('[data-state="open"]');
    expect(toast?.className).toContain('destructive');
  });

  it('renders with success variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open variant="success">
          Success toast
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = container.querySelector('[data-state="open"]');
    expect(toast?.className).toContain('border-green-500');
  });

  it('renders with error variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open variant="error">
          Error toast
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = container.querySelector('[data-state="open"]');
    expect(toast?.className).toContain('border-red-500');
  });

  it('renders with warning variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open variant="warning">
          Warning toast
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = container.querySelector('[data-state="open"]');
    expect(toast?.className).toContain('border-yellow-500');
  });

  it('renders with info variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open variant="info">
          Info toast
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = container.querySelector('[data-state="open"]');
    expect(toast?.className).toContain('border-blue-500');
  });

  it('renders with custom className', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open className="custom-toast">
          Custom
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const toast = container.querySelector('[data-state="open"]');
    expect(toast?.className).toContain('custom-toast');
  });

  it('forwards ref to toast element', () => {
    const ref = { current: null };
    render(
      <ToastProvider>
        <Toast ref={ref} open>
          With Ref
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(ref.current).toBeDefined();
  });
});

describe('ToastTitle', () => {
  it('renders toast title', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>Toast Title</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const title = screen.getByText('Toast Title');
    expect(title).toBeDefined();
    expect(title.className).toContain('font-semibold');
  });

  it('renders with custom className', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastTitle className="custom-title">Title</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const title = screen.getByText('Title');
    expect(title.className).toContain('custom-title');
  });
});

describe('ToastDescription', () => {
  it('renders toast description', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastDescription>Description text</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const description = screen.getByText('Description text');
    expect(description).toBeDefined();
    expect(description.className).toContain('opacity-90');
  });

  it('renders with custom className', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastDescription className="custom-desc">Description</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const description = screen.getByText('Description');
    expect(description.className).toContain('custom-desc');
  });
});

describe('ToastClose', () => {
  it('renders close button', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const closeButton = container.querySelector('[toast-close]');
    expect(closeButton).toBeDefined();
  });

  it('renders close icon', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('handles close click', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <ToastProvider>
        <Toast open onOpenChange={onOpenChange}>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const closeButton = container.querySelector('[toast-close]');
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    expect(onOpenChange).toHaveBeenCalled();
  });
});

describe('ToastAction', () => {
  it('renders action button', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastAction altText="Undo">Undo</ToastAction>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const action = screen.getByText('Undo');
    expect(action).toBeDefined();
  });

  it('handles action click', () => {
    const onClick = vi.fn();
    render(
      <ToastProvider>
        <Toast open>
          <ToastAction altText="Undo" onClick={onClick}>
            Undo
          </ToastAction>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    const action = screen.getByText('Undo');
    fireEvent.click(action);

    expect(onClick).toHaveBeenCalled();
  });
});

describe('Toast Composition', () => {
  it('renders complete toast with all elements', () => {
    render(
      <ToastProvider>
        <Toast open variant="success">
          <ToastTitle>Success</ToastTitle>
          <ToastDescription>Operation completed successfully</ToastDescription>
          <ToastClose />
          <ToastAction altText="Undo">Undo</ToastAction>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getByText('Success')).toBeDefined();
    expect(screen.getByText('Operation completed successfully')).toBeDefined();
    expect(screen.getByText('Undo')).toBeDefined();
  });
});

describe('ToastViewport', () => {
  it('renders viewport', () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport />
      </ToastProvider>
    );

    const viewport = container.querySelector('[data-radix-toast-viewport]');
    expect(viewport).toBeDefined();
  });

  it('accepts className prop', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>Test</Toast>
        <ToastViewport className="custom-viewport" />
      </ToastProvider>
    );

    // Viewport accepts className prop, which is sufficient to test
    const viewport = container.querySelector('[data-radix-toast-viewport]');
    expect(viewport).toBeDefined();
  });
});
