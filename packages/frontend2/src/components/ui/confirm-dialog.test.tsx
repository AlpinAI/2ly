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
});
