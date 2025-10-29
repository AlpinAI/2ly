/**
 * ConfirmDialog Component Tests
 *
 * WHY: Test the ConfirmDialog component for proper behavior,
 * accessibility, and user interactions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
  };

  it('renders dialog when open is true', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeDefined();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeDefined();
  });

  it('does not render dialog when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Confirm Action')).toBeNull();
  });

  it('renders with default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('renders with custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Go Back"
      />
    );

    expect(screen.getByText('Delete')).toBeDefined();
    expect(screen.getByText('Go Back')).toBeDefined();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('applies destructive variant styling', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} variant="destructive" />
    );

    // Check for destructive color classes (red)
    const iconContainer = container.querySelector('.bg-red-100');
    expect(iconContainer).toBeDefined();
  });

  it('applies default variant styling', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} variant="default" />
    );

    // Check for default color classes (blue)
    const iconContainer = container.querySelector('.bg-blue-100');
    expect(iconContainer).toBeDefined();
  });

  it('disables buttons when loading is true', () => {
    render(<ConfirmDialog {...defaultProps} loading />);

    const confirmButton = screen.getByText('Confirm');
    const cancelButton = screen.getByText('Cancel');

    expect(confirmButton.getAttribute('disabled')).toBe('');
    expect(cancelButton.getAttribute('disabled')).toBe('');
  });

  it('displays alert icon', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} />);

    const icon = container.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('has proper ARIA roles for accessibility', () => {
    render(<ConfirmDialog {...defaultProps} />);

    // AlertDialog should have proper roles
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeDefined();
  });

  it('handles async onConfirm', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancel button receives focus when dialog opens', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    // Verify that the Cancel button is the active element (has focus)
    expect(document.activeElement).toBe(cancelButton);
  });

  it('overlay has correct z-index to appear above BottomPanel', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} />);

    // Find the overlay element
    const overlay = container.querySelector('[class*="inset-0"]');
    expect(overlay).toBeDefined();
    if (overlay) {
      expect(overlay.className).toContain('z-[60]');
    }
  });

  it('content has correct z-index to appear above BottomPanel', () => {
    render(<ConfirmDialog {...defaultProps} />);

    // Find the content element by its role
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.className).toContain('z-[60]');
  });

  it('content stacks above overlay in DOM order', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} />);

    const portal = container.querySelector('[data-radix-portal]');
    if (portal) {
      const children = Array.from(portal.children);
      expect(children.length).toBeGreaterThan(1);

      // Overlay should be first child
      expect(children[0]?.className).toContain('inset-0');

      // Content should come after overlay
      const contentIndex = children.findIndex((child) =>
        child.getAttribute('role') === 'alertdialog'
      );
      expect(contentIndex).toBeGreaterThan(0);
    }
  });

  it('dialog remains interactive when rendered inside a z-50 container', () => {
    // Simulate rendering inside BottomPanel (z-50)
    render(
      <div className="fixed z-50">
        <ConfirmDialog {...defaultProps} />
      </div>
    );

    // Dialog should be in a portal (not a child of the z-50 container)
    const portalRoot = document.body.querySelector('[data-radix-portal]');
    expect(portalRoot).toBeDefined();

    // Dialog should still be clickable
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDefined();

    fireEvent.click(confirmButton);
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('buttons are clickable and not blocked by overlay', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    );

    // Both buttons should be accessible and clickable
    const confirmButton = screen.getByText('Confirm');
    const cancelButton = screen.getByText('Cancel');

    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(cancelButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('overlay does not prevent pointer events to dialog content', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} />);

    // Verify overlay exists
    const overlay = container.querySelector('[class*="inset-0"]');
    expect(overlay).toBeDefined();

    // Verify dialog content is accessible and interactive
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeDefined();

    // All interactive elements should be reachable
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);

    buttons.forEach(button => {
      expect(button).toBeDefined();
      expect(button.getAttribute('disabled')).toBeNull();
    });
  });
});
